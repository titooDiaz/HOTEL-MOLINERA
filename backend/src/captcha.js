// Verificación de Cloudflare Turnstile para los formularios públicos.
// El frontend solo obtiene un token; la decisión real se toma aquí, contra Cloudflare.
const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const REQUEST_TIMEOUT_MS = 5000;
// Claves oficiales de prueba de Cloudflare: sirven para desarrollo, nunca protegen de verdad.
const DEVELOPMENT_TEST_SECRET_KEY = '1x0000000000000000000000000000000AA';
const TEST_SECRET_KEYS = new Set([
    '1x0000000000000000000000000000000AA',
    '2x0000000000000000000000000000000AA',
    '3x0000000000000000000000000000000AA'
]);

let warnedAboutDevelopmentTestKey = false;

class CaptchaError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

const secretKey = () => process.env.TURNSTILE_SECRET_KEY?.trim();

const allowedHostnames = () =>
    (process.env.TURNSTILE_HOSTNAMES || '')
        .split(',')
        .map((hostname) => hostname.trim().toLowerCase())
        .filter(Boolean);

/**
 * Middleware de Express que valida el token enviado en `req.body.captchaToken`.
 * `expectedAction` debe coincidir con la acción con la que se renderizó el widget,
 * para que un token obtenido en un formulario no sirva en otro.
 */
const verifyCaptcha = (expectedAction) => async (req, _res, next) => {
    const configuredSecret = secretKey();
    const usesDevelopmentTestKey = !configuredSecret && process.env.NODE_ENV !== 'production';
    const secret = configuredSecret || (usesDevelopmentTestKey ? DEVELOPMENT_TEST_SECRET_KEY : '');

    // En desarrollo usamos la clave oficial de prueba para que cada clon funcione
    // sin copiar secretos locales. En producción, si falta la clave, se falla cerrado.
    if (!secret) {
        console.error('TURNSTILE_SECRET_KEY no está configurada: el captcha rechazará todas las solicitudes.');
        throw new CaptchaError(503, 'La verificación de seguridad no está disponible en este momento.');
    }

    if (usesDevelopmentTestKey && !warnedAboutDevelopmentTestKey) {
        warnedAboutDevelopmentTestKey = true;
        console.warn('TURNSTILE_SECRET_KEY no está configurada: se usa la clave de prueba de Cloudflare en desarrollo.');
    }

    const usesTestKey = TEST_SECRET_KEYS.has(secret);
    if (usesTestKey && process.env.NODE_ENV === 'production') {
        console.error('TURNSTILE_SECRET_KEY es una clave de prueba y no protege en producción.');
        throw new CaptchaError(503, 'La verificación de seguridad no está disponible en este momento.');
    }

    const token = req.body?.captchaToken;
    if (!token || typeof token !== 'string') {
        throw new CaptchaError(400, 'Completa la verificación de seguridad.');
    }

    const form = new URLSearchParams({
        secret,
        response: token
    });
    if (req.ip) form.set('remoteip', req.ip);

    let payload;
    try {
        const response = await fetch(VERIFY_URL, {
            method: 'POST',
            body: form,
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
        });
        if (!response.ok) throw new Error(`Cloudflare respondió HTTP ${response.status}.`);
        payload = await response.json();
    } catch (error) {
        // Un fallo de red no puede convertirse en un bypass: se rechaza la solicitud.
        console.error('No se pudo verificar el captcha:', error.message);
        throw new CaptchaError(503, 'No pudimos verificar la seguridad. Inténtalo de nuevo.');
    }

    if (!payload.success) {
        throw new CaptchaError(400, 'La verificación de seguridad falló. Inténtalo de nuevo.');
    }

    // Con claves de prueba Cloudflare no devuelve la acción real del widget.
    if (!usesTestKey && expectedAction && payload.action !== expectedAction) {
        throw new CaptchaError(400, 'La verificación de seguridad no corresponde a este formulario.');
    }

    const hostnames = allowedHostnames();
    if (!usesTestKey && hostnames.length && !hostnames.includes(String(payload.hostname || '').toLowerCase())) {
        throw new CaptchaError(400, 'La verificación de seguridad no corresponde a este sitio.');
    }

    next();
};

module.exports = { verifyCaptcha, CaptchaError };
