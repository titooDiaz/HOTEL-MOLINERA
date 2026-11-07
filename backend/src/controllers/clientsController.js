module.exports = (app, context) => {
    const { Op, sequelize, hashPassword, Usuario, Huesped, Habitacion, Reserva, HttpError, asyncHandler, requireFields, adminOnly } = context;

app.get('/api/clients', ...adminOnly, asyncHandler(async (_req, res) => {
    const clients = await Huesped.findAll({
        where: { isActive: true },
        include: [{ model: Usuario, as: 'usuario', attributes: ['id', 'email', 'createdAt'] }],
        order: [['createdAt', 'DESC']]
    });
    res.json(clients);
}));

app.get('/api/clients/:id', ...adminOnly, asyncHandler(async (req, res) => {
    const client = await Huesped.findByPk(req.params.id, {
        include: [{ model: Usuario, as: 'usuario', attributes: ['id', 'email', 'createdAt'] }]
    });
    if (!client || !client.isActive) throw new HttpError(404, 'No se encontró el cliente.');

    const reservations = await Reserva.findAll({
        where: { userId: client.userId },
        include: [{ model: Habitacion, as: 'habitacion', attributes: ['id', 'number', 'type'] }],
        order: [['createdAt', 'DESC']]
    });
    res.json({ ...client.toJSON(), reservas: reservations });
}));

app.delete('/api/clients/:id', ...adminOnly, asyncHandler(async (req, res) => {
    const client = await Huesped.findByPk(req.params.id, {
        include: [{ model: Usuario, as: 'usuario' }]
    });
    if (!client || !client.isActive || !client.usuario) throw new HttpError(404, 'No se encontró el cliente.');

    const today = new Date().toISOString().slice(0, 10);
    const activeReservation = await Reserva.findOne({
        where: {
            userId: client.userId,
            status: { [Op.notIn]: ['cancelada', 'cancelado', 'finalizada'] },
            checkOut: { [Op.gt]: today }
        }
    });
    if (activeReservation) {
        throw new HttpError(409, 'No se puede eliminar un cliente con reservas vigentes o futuras.');
    }

    const transaction = await sequelize.transaction();
    try {
        await client.destroy({ transaction });
        await client.usuario.update({
            isActive: false,
            rememberTokenHash: null
        }, { transaction });
        await client.usuario.destroy({ transaction });
        await transaction.commit();
        res.status(204).end();
    } catch (error) {
        if (!transaction.finished) await transaction.rollback();
        throw error;
    }
}));

app.post('/api/clients', ...adminOnly, asyncHandler(async (req, res) => {
    const data = req.body;
    requireFields(data, ['firstName', 'lastName', 'documentNumber', 'email', 'phone', 'password']);
    if (String(data.password).length < 8) throw new HttpError(400, 'La contraseña debe tener al menos 8 caracteres.');
    const transaction = await sequelize.transaction();
    try {
        const user = await Usuario.create({
            email: String(data.email).trim().toLowerCase(),
            passwordHash: await hashPassword(data.password),
            role: 'guest',
            createdByUserId: req.user.id
        }, { transaction });
        const client = await Huesped.create({
            ...Object.fromEntries(['firstName', 'lastName', 'documentType', 'documentNumber', 'birthDate', 'nationality', 'phone', 'city', 'address', 'emergencyName', 'emergencyPhone', 'notes'].map((key) => [key, data[key] === '' ? null : data[key]])),
            userId: user.id,
            createdByUserId: req.user.id
        }, { transaction });
        await transaction.commit();
        res.status(201).json({ ...client.toJSON(), usuario: { id: user.id, email: user.email } });
    } catch (error) {
        if (!transaction.finished) await transaction.rollback();
        throw error;
    }
}));

};
