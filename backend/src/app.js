const express = require('express');
const path = require('path');
const { randomBytes } = require('crypto');
const { Op } = require('sequelize');
const { models, sequelize } = require('./database');
const { hashPassword, verifyPassword, hashToken, createToken } = require('./auth');

const app = express();
const { Usuario, Huesped, Admin, Habitacion, CategoriaComida, Comida, Plan, Reserva, Pedido, DetallePedido, MensajeContacto } = models;

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.use(require('cors')());

class HttpError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

const asyncHandler = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
const requireFields = (data, fields) => {
    const missing = fields.filter((field) => data[field] === undefined || data[field] === null || data[field] === '');
    if (missing.length) throw new HttpError(400, `Campos requeridos: ${missing.join(', ')}`);
};
const safeUser = (user) => ({
    id: user.id,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    name: user.huesped
        ? `${user.huesped.firstName} ${user.huesped.lastName}`.trim()
        : user.administrador
            ? `${user.administrador.firstName} ${user.administrador.lastName}`.trim()
            : user.email,
    profile: user.huesped || user.administrador || null
});
const userIncludes = [
    { model: Huesped, as: 'huesped' },
    { model: Admin, as: 'administrador' }
];

const authenticate = asyncHandler(async (req, _res, next) => {
    const token = req.get('authorization')?.replace(/^Bearer\s+/i, '');
    if (!token) throw new HttpError(401, 'Inicia sesión para continuar.');
    const user = await Usuario.findOne({
        where: { rememberTokenHash: hashToken(token), isActive: true },
        include: userIncludes
    });
    if (!user) throw new HttpError(401, 'La sesión expiró. Inicia sesión nuevamente.');
    req.user = user;
    next();
});

const optionalAuthentication = asyncHandler(async (req, _res, next) => {
    const token = req.get('authorization')?.replace(/^Bearer\s+/i, '');
    if (token) {
        req.user = await Usuario.findOne({
            where: { rememberTokenHash: hashToken(token), isActive: true },
            include: userIncludes
        });
    }
    next();
});

const requireAdmin = (req, _res, next) => {
    if (req.user?.role !== 'admin') return next(new HttpError(403, 'Se requieren permisos de administrador.'));
    next();
};

const adminOnly = [authenticate, requireAdmin];
const makeCode = (prefix) => `${prefix}-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString('hex').toUpperCase()}`;
const makeSlug = (value) => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const parseDate = (value) => new Date(`${value}T00:00:00.000Z`);

app.get('/api/hotel', (_req, res) => res.json({ name: process.env.HOTEL_NAME || 'Hotel Molinera' }));

app.post('/api/auth/register', asyncHandler(async (req, res) => {
    const { name, email, password, phone } = req.body;
    requireFields(req.body, ['name', 'email', 'password', 'phone']);
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
            phone
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
    const { email, password } = req.body;
    requireFields(req.body, ['email', 'password']);
    const user = await Usuario.findOne({
        where: { email: String(email).trim().toLowerCase(), isActive: true },
        include: userIncludes
    });
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
    const token = createToken();
    await user.update({
        rememberTokenHash: hashToken(token),
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
        lastLoginIp: req.ip,
        lastLoginUserAgent: req.get('user-agent')?.slice(0, 500) || null
    });
    await models.Auditoria.create({
        userId: user.id,
        action: 'Inicio de sesión',
        entity: 'Usuario',
        entityId: user.id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')?.slice(0, 500) || null
    });
    res.json({ user: safeUser(user), token });
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

app.get('/api/me/profile', authenticate, (req, res) => res.json({ user: safeUser(req.user) }));

app.put('/api/me/profile', authenticate, asyncHandler(async (req, res) => {
    const { name, email, phone, nationality } = req.body;
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
            ...(req.user.role === 'guest' ? { nationality: nationality || null } : {})
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

app.get('/api/rooms', optionalAuthentication, asyncHandler(async (req, res) => {
    const where = req.user?.role === 'admin' ? {} : { isVisible: true, isBookable: true, status: 'disponible' };
    const rooms = await Habitacion.findAll({ where, order: [['number', 'ASC']] });
    res.json(rooms);
}));

app.post('/api/rooms', ...adminOnly, asyncHandler(async (req, res) => {
    const data = req.body;
    requireFields(data, ['number', 'floor', 'type', 'capacity', 'pricePerNight']);
    const { amenities = {}, ...fields } = data;
    const room = await Habitacion.create({
        ...fields,
        ...Object.fromEntries(['airConditioning', 'cableTv', 'safe', 'workstation', 'wifi', 'minibar', 'privateBathroom', 'balcony', 'smokeFree'].map((key) => [key, Boolean(amenities[key])])),
        createdByUserId: req.user.id
    });
    res.status(201).json(room);
}));

app.get('/api/clients', ...adminOnly, asyncHandler(async (_req, res) => {
    const clients = await Huesped.findAll({
        where: { isActive: true },
        include: [{ model: Usuario, as: 'usuario', attributes: ['id', 'email', 'createdAt'] }],
        order: [['createdAt', 'DESC']]
    });
    res.json(clients);
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

app.get('/api/reservations', ...adminOnly, asyncHandler(async (_req, res) => {
    const reservations = await Reserva.findAll({
        include: [
            { model: Usuario, as: 'usuario', attributes: ['id', 'email'], include: [{ model: Huesped, as: 'huesped' }] },
            { model: Habitacion, as: 'habitacion', attributes: ['id', 'number', 'type'] }
        ],
        order: [['createdAt', 'DESC']]
    });
    res.json(reservations);
}));

app.get('/api/me/reservations', authenticate, asyncHandler(async (req, res) => {
    const reservations = await Reserva.findAll({
        where: { userId: req.user.id },
        include: [{ model: Habitacion, as: 'habitacion' }],
        order: [['createdAt', 'DESC']]
    });
    res.json(reservations);
}));

app.post('/api/reservations', authenticate, asyncHandler(async (req, res) => {
    const { roomId, checkIn, checkOut } = req.body;
    requireFields(req.body, ['roomId', 'checkIn', 'checkOut']);
    const start = parseDate(checkIn);
    const end = parseDate(checkOut);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
        throw new HttpError(400, 'La fecha de salida debe ser posterior a la fecha de entrada.');
    }
    const room = await Habitacion.findByPk(roomId);
    if (!room || !room.isActive || !room.isVisible || !room.isBookable || room.status !== 'disponible') {
        throw new HttpError(404, 'La habitación seleccionada no está disponible.');
    }
    const guests = Number(req.body.guests || req.body.adults || 1) + Number(req.body.children || 0);
    if (!Number.isInteger(guests) || guests < 1 || guests > room.capacity) {
        throw new HttpError(400, `La habitación admite un máximo de ${room.capacity} huéspedes.`);
    }
    const conflict = await Reserva.findOne({
        where: {
            roomId: room.id,
            status: { [Op.notIn]: ['cancelada', 'cancelado'] },
            checkIn: { [Op.lt]: checkOut },
            checkOut: { [Op.gt]: checkIn }
        }
    });
    if (conflict) throw new HttpError(409, 'La habitación ya está reservada en esas fechas.');
    const nights = Math.round((end - start) / 86400000);
    const total = Number(room.pricePerNight) * nights;
    const advance = req.user.role === 'admin' ? Number(req.body.advance || 0) : 0;
    if (!Number.isFinite(advance) || advance < 0 || advance > total) {
        throw new HttpError(400, 'El anticipo debe estar entre cero y el total de la reserva.');
    }
    let reservationUserId = req.user.id;
    if (req.user.role === 'admin') {
        requireFields(req.body, ['clientId']);
        const client = await Huesped.findByPk(req.body.clientId);
        if (!client) throw new HttpError(404, 'No se encontró el huésped seleccionado.');
        reservationUserId = client.userId;
    }
    const reservation = await Reserva.create({
        userId: reservationUserId,
        roomId: room.id,
        reservationCode: makeCode('RES'),
        checkIn,
        checkOut,
        adults: Number(req.body.adults || guests),
        children: Number(req.body.children || 0),
        guests,
        status: req.user.role === 'admin' && req.body.status === 'confirmada' ? 'confirmada' : 'proceso',
        confirmed: req.user.role === 'admin' && req.body.status === 'confirmada',
        confirmedAt: req.user.role === 'admin' && req.body.status === 'confirmada' ? new Date() : null,
        confirmedByUserId: req.user.role === 'admin' && req.body.status === 'confirmada' ? req.user.id : null,
        pricePerNight: room.pricePerNight,
        nights,
        subtotal: total,
        taxes: 0,
        total,
        advance,
        balance: total - advance,
        specialRequests: req.body.specialRequests || req.body.requests || null,
        createdByUserId: req.user.id
    });
    res.status(201).json(reservation);
}));

app.get('/api/foods', optionalAuthentication, asyncHandler(async (req, res) => {
    const where = req.user?.role === 'admin'
        ? {}
        : { isVisible: true, isAvailable: true, isSoldOut: false };
    const foods = await Comida.findAll({
        where,
        include: [{ model: CategoriaComida, as: 'categoria', attributes: ['id', 'name', 'slug'] }],
        order: [['sortOrder', 'ASC'], ['name', 'ASC']]
    });
    res.json(foods);
}));

app.post('/api/foods', ...adminOnly, asyncHandler(async (req, res) => {
    const { name, categoryName, price } = req.body;
    requireFields(req.body, ['name', 'categoryName', 'price']);
    if (!Number.isFinite(Number(price)) || Number(price) < 0) throw new HttpError(400, 'El precio debe ser un valor válido.');
    const transaction = await sequelize.transaction();
    try {
        const categorySlug = makeSlug(categoryName);
        const [category] = await CategoriaComida.findOrCreate({
            where: { slug: categorySlug },
            defaults: { name: String(categoryName).trim(), slug: categorySlug, createdByUserId: req.user.id },
            transaction
        });
        const food = await Comida.create({
            name: String(name).trim(),
            slug: `${makeSlug(name)}-${randomBytes(3).toString('hex')}`,
            categoryId: category.id,
            description: req.body.description || null,
            price: Number(price),
            currency: req.body.currency || 'VES',
            imageUrl: req.body.imageUrl || null,
            ingredients: req.body.ingredients || null,
            allergens: req.body.allergens || null,
            preparationMinutes: req.body.preparationMinutes || null,
            isAvailable: true,
            isVisible: true,
            createdByUserId: req.user.id
        }, { transaction });
        await transaction.commit();
        res.status(201).json(food);
    } catch (error) {
        if (!transaction.finished) await transaction.rollback();
        throw error;
    }
}));

app.get('/api/plans', asyncHandler(async (_req, res) => {
    res.json(await Plan.findAll({ where: { isVisible: true, isBookable: true }, order: [['sortOrder', 'ASC']] }));
}));

app.post('/api/plans', ...adminOnly, asyncHandler(async (req, res) => {
    const { name } = req.body;
    requireFields(req.body, ['name']);
    const plan = await Plan.create({
        name: String(name).trim(),
        slug: `${makeSlug(name)}-${randomBytes(3).toString('hex')}`,
        summary: req.body.summary || null,
        description: req.body.description || null,
        price: req.body.price === '' || req.body.price == null ? null : Number(req.body.price),
        currency: req.body.currency || 'VES',
        imageUrl: req.body.imageUrl || null,
        services: req.body.services ? String(req.body.services).split(',').map((service) => service.trim()).filter(Boolean) : null,
        terms: req.body.terms || null,
        validFrom: req.body.validFrom || null,
        validUntil: req.body.validUntil || null,
        isVisible: true,
        isBookable: true,
        createdByUserId: req.user.id
    });
    res.status(201).json(plan);
}));

app.get('/api/orders', ...adminOnly, asyncHandler(async (_req, res) => {
    const orders = await Pedido.findAll({
        include: [
            { model: Usuario, as: 'usuario', attributes: ['id', 'email'], include: [{ model: Huesped, as: 'huesped' }] },
            { model: Habitacion, as: 'habitacion', attributes: ['id', 'number'] },
            { model: DetallePedido, as: 'detalles' }
        ],
        order: [['requestedAt', 'DESC']]
    });
    res.json(orders);
}));

app.get('/api/me/orders', authenticate, asyncHandler(async (req, res) => {
    res.json(await Pedido.findAll({
        where: { userId: req.user.id },
        include: [{ model: DetallePedido, as: 'detalles' }],
        order: [['requestedAt', 'DESC']]
    }));
}));

app.post('/api/orders', authenticate, asyncHandler(async (req, res) => {
    const { items } = req.body;
    if (!Array.isArray(items) || !items.length) throw new HttpError(400, 'Agrega al menos un producto al pedido.');
    let roomId = req.body.roomId || null;
    let userId = req.user.id;
    if (req.user.role === 'admin') {
        requireFields(req.body, ['roomId']);
        const today = new Date().toISOString().slice(0, 10);
        const activeReservation = await Reserva.findOne({
            where: {
                roomId,
                status: { [Op.notIn]: ['cancelada', 'cancelado', 'finalizada'] },
                checkIn: { [Op.lte]: today },
                checkOut: { [Op.gt]: today }
            },
            order: [['checkIn', 'DESC']]
        });
        if (!activeReservation) throw new HttpError(400, 'La habitación no tiene una reserva activa.');
        userId = activeReservation.userId;
    } else {
        const activeReservation = await Reserva.findOne({
            where: {
                userId,
                status: { [Op.notIn]: ['cancelada', 'cancelado', 'finalizada'] },
                checkIn: { [Op.lte]: new Date().toISOString().slice(0, 10) },
                checkOut: { [Op.gt]: new Date().toISOString().slice(0, 10) }
            },
            order: [['checkIn', 'DESC']]
        });
        if (!activeReservation) throw new HttpError(403, 'Necesitas una estadía activa para solicitar un pedido.');
        roomId = roomId || activeReservation.roomId;
    }
    const foodIds = [...new Set(items.map((item) => Number(item.id)))];
    const foods = await Comida.findAll({ where: { id: foodIds, isVisible: true, isAvailable: true, isSoldOut: false } });
    const foodsById = new Map(foods.map((food) => [String(food.id), food]));
    if (foods.length !== foodIds.length) throw new HttpError(400, 'Uno o más productos ya no están disponibles.');
    const lines = items.map((item) => {
        const food = foodsById.get(String(item.id));
        const quantity = Number(item.quantity);
        if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) throw new HttpError(400, 'Cantidad de producto no válida.');
        return { food, quantity, totalPrice: Number(food.price) * quantity };
    });
    const subtotal = lines.reduce((total, line) => total + line.totalPrice, 0);
    const transaction = await sequelize.transaction();
    try {
        const order = await Pedido.create({
            userId, roomId, orderCode: makeCode('ORD'), subtotal, taxes: 0, total: subtotal,
            paymentMethod: req.body.paymentMethod || 'cargo', notes: req.body.notes || null,
            createdByUserId: req.user.id
        }, { transaction });
        await DetallePedido.bulkCreate(lines.map(({ food, quantity, totalPrice }) => ({
            orderId: order.id,
            foodId: food.id,
            foodName: food.name,
            quantity,
            unitPrice: food.price,
            totalPrice,
            createdByUserId: req.user.id
        })), { transaction });
        await transaction.commit();
        res.status(201).json(await Pedido.findByPk(order.id, { include: [{ model: DetallePedido, as: 'detalles' }] }));
    } catch (error) {
        if (!transaction.finished) await transaction.rollback();
        throw error;
    }
}));

app.post('/api/contact', asyncHandler(async (req, res) => {
    requireFields(req.body, ['name', 'email', 'subject', 'message']);
    const message = await MensajeContacto.create({
        name: String(req.body.name).trim(),
        email: String(req.body.email).trim().toLowerCase(),
        subject: String(req.body.subject).trim(),
        message: String(req.body.message).trim(),
        ipAddress: req.ip
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
    const { email, name, password, role = 'guest', phone } = req.body;
    requireFields(req.body, ['email', 'name', 'password']);
    if (!['admin', 'guest'].includes(role)) throw new HttpError(400, 'El rol seleccionado no es válido.');
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
            : await Huesped.create({ userId: user.id, firstName, lastName: lastNameParts.join(' '), phone, createdByUserId: req.user.id }, { transaction });
        await transaction.commit();
        const userData = user.toJSON();
        userData[role === 'admin' ? 'administrador' : 'huesped'] = profile;
        res.status(201).json(safeUser(userData));
    } catch (error) {
        if (!transaction.finished) await transaction.rollback();
        throw error;
    }
}));

app.use('/api', (_req, res) => res.status(404).json({ error: 'Ruta API no encontrada.' }));

const frontendPublicPath = path.join(__dirname, '../../frontend/public');
const frontendDistPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendPublicPath));
app.use(express.static(frontendDistPath));
app.get(/.*/, (_req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
});

app.use((error, _req, res, _next) => {
    if (res.headersSent) return;
    if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ error: 'Ya existe un registro con esos datos.' });
    }
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeForeignKeyConstraintError') {
        return res.status(400).json({ error: error.errors?.[0]?.message || 'Los datos enviados no son válidos.' });
    }
    const status = error.status || 500;
    if (status >= 500) console.error('API error:', error);
    res.status(status).json({ error: status === 500 ? 'Ocurrió un error interno.' : error.message });
});

module.exports = app;
