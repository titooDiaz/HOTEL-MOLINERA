// Lógica de la verificación en dos pasos por correo: crear, reenviar y comprobar códigos.
const { randomInt, timingSafeEqual } = require('crypto');
const { Op } = require('sequelize');
const { models } = require('../models');
const { hashToken, createToken } = require('./auth');
const { sendVerificationCode } = require('./mailer');

const { CodigoVerificacion, Usuario } = models;

const CODE_MINUTES = 10;       // Tiempo de vida de cada código.
const MAX_ATTEMPTS = 5;        // Intentos permitidos antes de invalidar el código.
const RESEND_SECONDS = 60;     // Espera mínima entre dos envíos.
const CHALLENGE_MAX_AGE_MINUTES = 30; // Después de esto hay que volver a poner la contraseña.

// Error con código HTTP; el manejador de errores de app.js ya usa `status` y `message`.
class TwoFactorError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

// Código de 6 dígitos generado con aleatoriedad criptográfica (no con Math.random).
const generateCode = () => String(randomInt(0, 1000000)).padStart(6, '0');

// Nunca guardamos el código en claro; se mezcla con el id del usuario antes del hash.
const hashCode = (userId, code) => hashToken(`${userId}:${code}`);

const codesMatch = (userId, code, storedHash) => {
    const actual = Buffer.from(hashCode(userId, String(code).trim()), 'hex');
    const expected = Buffer.from(storedHash, 'hex');
    return actual.length === expected.length && timingSafeEqual(actual, expected);
};

// ju***@gmail.com: se muestra al usuario sin revelar el correo completo.
const maskEmail = (email) => {
    const [name, domain] = String(email).split('@');
    if (!domain) return email;
    return `${name.slice(0, 2)}${'*'.repeat(Math.max(name.length - 2, 3))}@${domain}`;
};

// Cada desafío agotado cuenta como un inicio de sesión fallido; a los 5 la cuenta se bloquea 15 minutos.
// Así no se pueden adivinar códigos pidiendo desafíos nuevos una y otra vez.
async function registerFailedLogin(userId) {
    const user = await Usuario.findByPk(userId);
    if (!user) return;
    const failedLoginAttempts = user.failedLoginAttempts + 1;
    await user.update({
        failedLoginAttempts,
        lockedUntil: failedLoginAttempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null
    });
}

// Guarda un código nuevo en la fila del desafío y lo envía por correo.
async function refreshAndSend(challenge, user) {
    const code = generateCode();
    await challenge.update({
        codeHash: hashCode(user.id, code),
        expiresAt: new Date(Date.now() + CODE_MINUTES * 60 * 1000),
        attempts: 0,
        lastSentAt: new Date()
    });
    try {
        await sendVerificationCode({ to: user.email, code, minutes: CODE_MINUTES, purpose: challenge.purpose });
    } catch (error) {
        console.error('No se pudo enviar el correo de verificación:', error.message);
        await challenge.update({ usedAt: new Date() });
        throw new TwoFactorError(502, 'No se pudo enviar el código al correo. Intenta de nuevo en unos minutos.');
    }
}

// Crea un desafío nuevo (login o activación) y envía el primer código.
async function createChallenge(user, purpose, ipAddress) {
    // Limpieza oportunista de desafíos viejos y de los pendientes del mismo usuario y propósito.
    await CodigoVerificacion.destroy({ where: { expiresAt: { [Op.lt]: new Date(Date.now() - 24 * 60 * 60 * 1000) } } });
    await CodigoVerificacion.update(
        { usedAt: new Date() },
        { where: { userId: user.id, purpose, usedAt: null } }
    );
    const challengeToken = createToken();
    const challenge = await CodigoVerificacion.create({
        userId: user.id,
        purpose,
        tokenHash: hashToken(challengeToken),
        codeHash: hashCode(user.id, '------'),
        expiresAt: new Date(),
        ipAddress
    });
    await refreshAndSend(challenge, user);
    return challengeToken;
}

// Busca un desafío pendiente a partir del token que recibió el navegador.
async function findPending(challengeToken, purpose) {
    if (!challengeToken) throw new TwoFactorError(400, 'Falta el identificador de verificación.');
    const challenge = await CodigoVerificacion.findOne({
        where: { tokenHash: hashToken(String(challengeToken)), purpose, usedAt: null }
    });
    const maxAge = CHALLENGE_MAX_AGE_MINUTES * 60 * 1000;
    if (!challenge || Date.now() - challenge.createdAt.getTime() > maxAge) {
        throw new TwoFactorError(401, 'La verificación expiró. Inicia sesión nuevamente.');
    }
    return challenge;
}

// Reenvía un código nuevo respetando la espera mínima.
// `expectedUserId` se usa cuando el usuario ya tiene sesión (activación) para verificar que el desafío es suyo.
async function resendChallenge(challengeToken, purpose, expectedUserId) {
    const challenge = await findPending(challengeToken, purpose);
    if (expectedUserId !== undefined && String(challenge.userId) !== String(expectedUserId)) {
        throw new TwoFactorError(401, 'La verificación no es válida.');
    }
    const waitMs = RESEND_SECONDS * 1000 - (Date.now() - challenge.lastSentAt.getTime());
    if (waitMs > 0) {
        throw new TwoFactorError(429, `Espera ${Math.ceil(waitMs / 1000)} segundos antes de pedir otro código.`);
    }
    const user = await Usuario.findOne({ where: { id: challenge.userId, isActive: true } });
    if (!user) throw new TwoFactorError(401, 'La cuenta no está disponible.');
    await refreshAndSend(challenge, user);
}

// Comprueba el código. Devuelve el id del usuario dueño del desafío si es correcto.
async function verifyChallenge(challengeToken, purpose, code) {
    if (!/^\d{6}$/.test(String(code || '').trim())) {
        throw new TwoFactorError(400, 'El código debe tener 6 dígitos.');
    }
    const challenge = await findPending(challengeToken, purpose);
    if (challenge.expiresAt < new Date()) {
        throw new TwoFactorError(401, 'El código venció. Solicita uno nuevo.');
    }
    // El incremento es atómico: aunque lleguen peticiones simultáneas, el límite se respeta.
    await CodigoVerificacion.increment('attempts', { where: { id: challenge.id } });
    await challenge.reload();
    if (challenge.attempts > MAX_ATTEMPTS) {
        await challenge.update({ usedAt: new Date() });
        if (purpose === 'login') await registerFailedLogin(challenge.userId);
        throw new TwoFactorError(429, 'Demasiados intentos. Inicia sesión nuevamente para recibir otro código.');
    }
    if (!codesMatch(challenge.userId, code, challenge.codeHash)) {
        const remaining = MAX_ATTEMPTS - challenge.attempts;
        throw new TwoFactorError(401, remaining > 0
            ? `Código incorrecto. Te quedan ${remaining} intento(s).`
            : 'Código incorrecto. Inicia sesión nuevamente para recibir otro código.');
    }
    // Un código solo se puede usar una vez.
    const [updated] = await CodigoVerificacion.update(
        { usedAt: new Date() },
        { where: { id: challenge.id, usedAt: null } }
    );
    if (!updated) throw new TwoFactorError(401, 'Este código ya fue utilizado.');
    return challenge.userId;
}

module.exports = {
    CODE_MINUTES,
    RESEND_SECONDS,
    createChallenge,
    resendChallenge,
    verifyChallenge,
    maskEmail
};
