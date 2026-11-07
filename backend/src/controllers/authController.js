module.exports = (app, context) => {
    const { models, sequelize, hashPassword, verifyPassword, hashToken, createToken, twoFactor, verifyCaptcha, OLLAMA_URL, OLLAMA_MODEL, CHAT_SYSTEM_PROMPT, buildChatContext, Usuario, Huesped, Admin, HttpError, asyncHandler, requireFields, safeUser, userIncludes, authenticate, optionalAuthentication, completeLogin, audit } = context;

app.get('/api/hotel', (_req, res) => res.json({ name: process.env.HOTEL_NAME || 'Hotel Molinera' }));

app.post('/api/chat', optionalAuthentication, asyncHandler(async (req, res) => {
    const inputMessages = Array.isArray(req.body?.messages) ? req.body.messages : [];
    const messages = inputMessages
        .filter((message) => ['user', 'assistant'].includes(message?.role) && typeof message.content === 'string')
        .slice(-10)
        .map((message) => ({ role: message.role, content: message.content.trim().slice(0, 500) }))
        .filter((message) => message.content);

    if (!messages.length || messages[messages.length - 1].role !== 'user') {
        throw new HttpError(400, 'Escribe una pregunta para el asistente.');
    }

    let response;
    try {
        const context = await buildChatContext(req.user);
        response = await fetch(`${OLLAMA_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: OLLAMA_MODEL,
                stream: false,
                messages: [
                    { role: 'system', content: `${CHAT_SYSTEM_PROMPT}\n\nDATOS ACTUALES DEL HOTEL Y DEL USUARIO (úsalos como fuente de verdad; no reveles datos privados):\n${JSON.stringify(context)}` },
                    ...messages
                ]
            }),
            signal: AbortSignal.timeout(30000)
        });
    } catch (error) {
        console.error('No se pudo conectar con Ollama:', error.message);
        throw new HttpError(503, 'El asistente local no está disponible. Ejecuta Ollama y descarga el modelo configurado.');
    }

    if (!response.ok) {
        const detail = await response.text();
        console.error(`Ollama respondió HTTP ${response.status}:`, detail);
        throw new HttpError(503, 'El asistente local no está disponible. Verifica que el modelo esté descargado.');
    }

    const payload = await response.json();
    const message = payload.message?.content?.trim();
    if (!message) throw new HttpError(503, 'El asistente no pudo generar una respuesta.');
    res.json({ message });
}));

app.post('/api/auth/register', verifyCaptcha('register'), asyncHandler(async (req, res) => {
    const { name, email, password, phone, documentType = 'CC', documentNumber, birthDate, nationality, city, address, emergencyName, emergencyPhone, notes } = req.body;
    requireFields(req.body, ['name', 'email', 'password', 'phone', 'documentNumber']);
    if (String(password).length < 8) throw new HttpError(400, 'La contraseña debe tener al menos 8 caracteres.');
    const [firstName, ...lastParts] = String(name).trim().split(/\s+/);
    if (!firstName || !lastParts.length) throw new HttpError(400, 'Ingresa nombres y apellidos.');
    const transaction = await sequelize.transaction();
    try {
        const user = await Usuario.create({
            email: String(email).trim().toLowerCase(),
            passwordHash: await hashPassword(password),
            role: 'guest'
        }, { transaction });
        await Huesped.create({
            userId: user.id,
            firstName,
            lastName: lastParts.join(' '),
            documentType,
            documentNumber: String(documentNumber).trim(),
            birthDate: birthDate || null,
            nationality: nationality || null,
            phone,
            city: city || null,
            address: address || null,
            emergencyName: emergencyName || null,
            emergencyPhone: emergencyPhone || null,
            notes: notes || null
        }, { transaction });
        const token = createToken();
        await user.update({ rememberTokenHash: hashToken(token) }, { transaction });
        await transaction.commit();
        const signedInUser = await Usuario.findByPk(user.id, { include: userIncludes });
        res.status(201).json({ user: safeUser(signedInUser), token });
    } catch (error) {
        if (!transaction.finished) await transaction.rollback();
        throw error;
    }
}));

app.post('/api/auth/login', asyncHandler(async (req, res) => {
    const { identifier, email, password } = req.body;
    const loginIdentifier = String(identifier ?? email ?? '').trim();
    requireFields({ identifier: loginIdentifier, password }, ['identifier', 'password']);
    const normalizedEmail = loginIdentifier.toLowerCase();
    let user = await Usuario.findOne({
        where: { email: normalizedEmail, isActive: true },
        include: userIncludes
    });
    if (!user) {
        user = await Usuario.findOne({
            where: { isActive: true },
            include: [
                { model: Huesped, as: 'huesped', where: { documentNumber: loginIdentifier }, required: true },
                { model: Admin, as: 'administrador' }
            ]
        });
    }
    if (user?.lockedUntil && user.lockedUntil > new Date()) {
        throw new HttpError(423, 'La cuenta está temporalmente bloqueada. Intenta más tarde.');
    }
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
        if (user) {
            const failedLoginAttempts = user.failedLoginAttempts + 1;
            await user.update({
                failedLoginAttempts,
                lockedUntil: failedLoginAttempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null
            });
        }
        throw new HttpError(401, 'El correo o la contraseña no son válidos.');
    }
    // Con la verificación en dos pasos activa, la contraseña sola no abre sesión: se envía un código al correo.
    if (user.twoFactorEnabled) {
        const challengeToken = await twoFactor.createChallenge(user, 'login', req.ip);
        return res.json({
            twoFactorRequired: true,
            challengeToken,
            email: twoFactor.maskEmail(user.email),
            codeMinutes: twoFactor.CODE_MINUTES,
            resendSeconds: twoFactor.RESEND_SECONDS
        });
    }
    res.json({ user: safeUser(user), token: await completeLogin(user, req) });
}));

// Segundo paso del inicio de sesión: comprueba el código recibido por correo y abre la sesión.
app.post('/api/auth/2fa/verify', asyncHandler(async (req, res) => {
    const { challengeToken, code } = req.body;
    requireFields(req.body, ['challengeToken', 'code']);
    const userId = await twoFactor.verifyChallenge(challengeToken, 'login', code);
    const user = await Usuario.findOne({ where: { id: userId, isActive: true }, include: userIncludes });
    if (!user) throw new HttpError(401, 'La cuenta no está disponible.');
    res.json({ user: safeUser(user), token: await completeLogin(user, req) });
}));

app.post('/api/auth/2fa/resend', asyncHandler(async (req, res) => {
    requireFields(req.body, ['challengeToken']);
    await twoFactor.resendChallenge(req.body.challengeToken, 'login');
    res.json({ message: 'Te enviamos un código nuevo.', resendSeconds: twoFactor.RESEND_SECONDS });
}));

app.get('/api/auth/me', authenticate, (req, res) => res.json({ user: safeUser(req.user) }));

app.post('/api/auth/logout', authenticate, asyncHandler(async (req, res) => {
    await req.user.update({ rememberTokenHash: null });
    res.json({ message: 'Sesión cerrada.' });
}));

app.post('/api/auth/change-password', authenticate, asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    requireFields(req.body, ['currentPassword', 'newPassword']);
    if (String(newPassword).length < 8) throw new HttpError(400, 'La nueva contraseña debe tener al menos 8 caracteres.');
    if (!(await verifyPassword(currentPassword, req.user.passwordHash))) {
        throw new HttpError(400, 'La contraseña actual no es correcta.');
    }
    await req.user.update({
        passwordHash: await hashPassword(newPassword),
        passwordChangedAt: new Date()
    });
    res.json({ message: 'Contraseña actualizada.' });
}));

// Activar la verificación en dos pasos exige confirmar un código enviado al correo de la cuenta.
app.post('/api/me/2fa/request', authenticate, asyncHandler(async (req, res) => {
    if (req.user.twoFactorEnabled) throw new HttpError(400, 'La verificación en dos pasos ya está activada.');
    const challengeToken = await twoFactor.createChallenge(req.user, 'enable', req.ip);
    res.json({
        challengeToken,
        email: twoFactor.maskEmail(req.user.email),
        codeMinutes: twoFactor.CODE_MINUTES,
        resendSeconds: twoFactor.RESEND_SECONDS
    });
}));

app.post('/api/me/2fa/resend', authenticate, asyncHandler(async (req, res) => {
    requireFields(req.body, ['challengeToken']);
    await twoFactor.resendChallenge(req.body.challengeToken, 'enable', req.user.id);
    res.json({ message: 'Te enviamos un código nuevo.', resendSeconds: twoFactor.RESEND_SECONDS });
}));

app.post('/api/me/2fa/confirm', authenticate, asyncHandler(async (req, res) => {
    requireFields(req.body, ['challengeToken', 'code']);
    const userId = await twoFactor.verifyChallenge(req.body.challengeToken, 'enable', req.body.code);
    if (String(userId) !== String(req.user.id)) throw new HttpError(401, 'La verificación no es válida.');
    await req.user.update({ twoFactorEnabled: true });
    await audit(req, 'Verificación en dos pasos activada');
    res.json({ user: safeUser(req.user), message: 'Verificación en dos pasos activada.' });
}));

// Desactivarla exige la contraseña actual, para que una sesión abierta no pueda quitarla sin más.
app.post('/api/me/2fa/disable', authenticate, asyncHandler(async (req, res) => {
    requireFields(req.body, ['password']);
    if (!(await verifyPassword(req.body.password, req.user.passwordHash))) {
        throw new HttpError(400, 'La contraseña no es correcta.');
    }
    await req.user.update({ twoFactorEnabled: false });
    await audit(req, 'Verificación en dos pasos desactivada');
    res.json({ user: safeUser(req.user), message: 'Verificación en dos pasos desactivada.' });
}));

app.get('/api/me/profile', authenticate, (req, res) => res.json({ user: safeUser(req.user) }));

app.put('/api/me/profile', authenticate, asyncHandler(async (req, res) => {
    const { name, email, documentType, documentNumber, birthDate, phone, nationality, city, address, emergencyName, emergencyPhone, notes } = req.body;
    requireFields(req.body, ['name', 'email']);
    const [firstName, ...lastNameParts] = String(name).trim().split(/\s+/);
    if (!firstName || !lastNameParts.length) throw new HttpError(400, 'Ingresa nombres y apellidos.');
    const profile = req.user.role === 'admin' ? req.user.administrador : req.user.huesped;
    if (!profile) throw new HttpError(404, 'No se encontró el perfil asociado a la cuenta.');
    await sequelize.transaction(async (transaction) => {
        await profile.update({
            firstName,
            lastName: lastNameParts.join(' '),
            phone: phone || null,
            ...(req.user.role === 'guest' ? {
                documentType: documentType || 'CC',
                documentNumber: String(documentNumber || '').trim(),
                birthDate: birthDate || null,
                nationality: nationality || null,
                city: city || null,
                address: address || null,
                emergencyName: emergencyName || null,
                emergencyPhone: emergencyPhone || null,
                notes: notes || null
            } : {})
        }, { transaction });
        await req.user.update({ email: String(email).trim().toLowerCase() }, { transaction });
    });
    const updatedUser = await Usuario.findByPk(req.user.id, { include: userIncludes });
    res.json({ user: safeUser(updatedUser) });
}));

app.get('/api/me/activity', authenticate, asyncHandler(async (req, res) => {
    const activity = await models.Auditoria.findAll({
        where: { userId: req.user.id },
        attributes: ['id', 'action', 'entity', 'createdAt'],
        order: [['createdAt', 'DESC']],
        limit: 20
    });
    res.json(activity);
}));

};
