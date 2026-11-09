module.exports = (app, context) => {
    const { sequelize, hashPassword, verifyCaptcha, Usuario, Huesped, Admin, MensajeContacto, HttpError, asyncHandler, requireFields, safeUser, userIncludes, adminOnly, createAdminNotifications, sendContactMessage } = context;

app.post('/api/contact', verifyCaptcha('contact'), asyncHandler(async (req, res) => {
    requireFields(req.body, ['name', 'email', 'subject', 'message']);
    const configuredRecipient = process.env.ADMIN_EMAIL?.trim();
    const administrator = configuredRecipient
        ? null
        : await Usuario.findOne({ where: { role: 'admin' }, attributes: ['email'], order: [['createdAt', 'ASC']] });
    const recipient = configuredRecipient || administrator?.email;
    if (!recipient) throw new HttpError(503, 'No hay un correo de administrador configurado para recibir mensajes.');
    if (!process.env.SMTP_HOST) throw new HttpError(503, 'El envío de correo no está configurado. Contacta al administrador del sitio.');
    const message = await MensajeContacto.create({
        name: String(req.body.name).trim(),
        email: String(req.body.email).trim().toLowerCase(),
        subject: String(req.body.subject).trim(),
        message: String(req.body.message).trim(),
        ipAddress: req.ip
    });
    await createAdminNotifications({
        type: 'new_contact_message',
        title: 'Nuevo mensaje de contacto',
        message: `Nuevo mensaje de ${message.name}: ${message.subject}`,
        data: { messageId: message.id }
    });
    await sendContactMessage({
        to: recipient,
        name: message.name,
        email: message.email,
        subject: message.subject,
        message: message.message
    });
    res.status(201).json({ id: message.id, message: 'Mensaje recibido.' });
}));

app.get('/api/admin/users', ...adminOnly, asyncHandler(async (_req, res) => {
    const users = await Usuario.findAll({
        attributes: ['id', 'email', 'role', 'isActive', 'createdAt'],
        include: userIncludes,
        order: [['createdAt', 'DESC']]
    });
    res.json(users.map(safeUser));
}));

app.post('/api/admin/users', ...adminOnly, asyncHandler(async (req, res) => {
    const { email, name, password, role = 'guest', phone, documentType = 'CC', documentNumber } = req.body;
    requireFields(req.body, ['email', 'name', 'password']);
    if (!['admin', 'guest'].includes(role)) throw new HttpError(400, 'El rol seleccionado no es válido.');
    if (role === 'guest') requireFields(req.body, ['documentNumber']);
    if (String(password).length < 8) throw new HttpError(400, 'La contraseña debe tener al menos 8 caracteres.');
    const [firstName, ...lastNameParts] = String(name).trim().split(/\s+/);
    if (!firstName || !lastNameParts.length) throw new HttpError(400, 'Ingresa nombres y apellidos.');
    const transaction = await sequelize.transaction();
    try {
        const user = await Usuario.create({
            email: String(email).trim().toLowerCase(),
            passwordHash: await hashPassword(password),
            role,
            createdByUserId: req.user.id
        }, { transaction });
        const profile = role === 'admin'
            ? await Admin.create({ userId: user.id, firstName, lastName: lastNameParts.join(' '), phone, createdByUserId: req.user.id }, { transaction })
            : await Huesped.create({ userId: user.id, firstName, lastName: lastNameParts.join(' '), documentType, documentNumber: String(documentNumber).trim(), phone, createdByUserId: req.user.id }, { transaction });
        await transaction.commit();
        const userData = user.toJSON();
        userData[role === 'admin' ? 'administrador' : 'huesped'] = profile;
        res.status(201).json(safeUser(userData));
    } catch (error) {
        if (!transaction.finished) await transaction.rollback();
        throw error;
    }
}));

};
