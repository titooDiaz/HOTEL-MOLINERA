const express = require('express');
const path = require('path');
const fs = require('fs');
const { randomBytes } = require('crypto');
const multer = require('multer');
const PDFDocument = require('pdfkit');
const { Op } = require('sequelize');
const { models, sequelize } = require('./database');
const { hashPassword, verifyPassword, hashToken, createToken } = require('./auth');
const twoFactor = require('./twoFactor');
const { verifyCaptcha } = require('./captcha');

const app = express();
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:0.5b';
const CHAT_SYSTEM_PROMPT = [
    'Eres el asistente virtual de Hotel Molinera.',
    'Responde siempre en español, de forma amable, breve y útil.',
    'Ayuda con habitaciones, reservas, planes, restaurante y contacto.',
    'No inventes precios, disponibilidad ni políticas. Si no tienes el dato, indica que deben contactar al hotel por WhatsApp.',
    'No solicites contraseñas, datos bancarios ni claves de acceso.'
].join(' ');

const buildChatContext = async (user) => {
    const [rooms, plans, foods] = await Promise.all([
        Habitacion.findAll({
            where: { isVisible: true, isBookable: true, status: 'disponible' },
            attributes: ['number', 'type', 'capacity', 'pricePerNight', 'beds', 'bedType', 'description', 'wifi', 'airConditioning', 'privateBathroom'],
            order: [['number', 'ASC']]
        }),
        Plan.findAll({
            where: { isVisible: true, isBookable: true },
            attributes: ['name', 'summary', 'description', 'price', 'currency', 'services', 'terms'],
            order: [['sortOrder', 'ASC']]
        }),
        Comida.findAll({
            where: { isVisible: true, isAvailable: true, isSoldOut: false },
            attributes: ['name', 'description', 'price', 'currency', 'ingredients', 'allergens'],
            order: [['sortOrder', 'ASC']]
        })
    ]);

    const context = {
        fecha: new Date().toISOString().slice(0, 10),
        habitacionesDisponibles: rooms.map((room) => room.toJSON()),
        planesDisponibles: plans.map((plan) => plan.toJSON()),
        menuDisponible: foods.map((food) => food.toJSON())
    };

    if (!user) return context;

    const [reservations, orders] = await Promise.all([
        Reserva.findAll({
            where: { userId: user.id },
            attributes: ['reservationCode', 'checkIn', 'checkOut', 'status', 'guests', 'total', 'balance', 'paymentStatus'],
            include: [{ model: Habitacion, as: 'habitacion', attributes: ['number', 'type'] }],
            order: [['createdAt', 'DESC']],
            limit: 10
        }),
        Pedido.findAll({
            where: { userId: user.id },
            attributes: ['orderCode', 'status', 'paymentStatus', 'total', 'requestedAt'],
            include: [{ model: DetallePedido, as: 'detalles', attributes: ['foodName', 'quantity', 'totalPrice'] }],
            order: [['requestedAt', 'DESC']],
            limit: 10
        })
    ]);

    context.usuario = {
        nombre: user.huesped ? `${user.huesped.firstName} ${user.huesped.lastName}`.trim() : user.email,
        rol: user.role
    };
    context.misReservas = reservations.map((reservation) => reservation.toJSON());
    context.misPedidos = orders.map((order) => order.toJSON());
    return context;
};
const { Usuario, Huesped, Admin, Habitacion, CategoriaComida, Comida, Plan, ReservaPlan, Reserva, Pedido, DetallePedido, Pago, Notificacion, MensajeContacto } = models;
const uploadDirectory = path.join(__dirname, '../uploads');
const imageExtensions = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif'
};
fs.mkdirSync(uploadDirectory, { recursive: true });
const imageUploadStorage = multer.diskStorage({
    destination: uploadDirectory,
    filename: (_req, file, callback) => callback(null, `${randomBytes(16).toString('hex')}${imageExtensions[file.mimetype]}`)
});
const imageFileFilter = (_req, file, callback) => {
    if (!imageExtensions[file.mimetype]) {
        return callback(new HttpError(400, 'La imagen debe ser JPG, PNG, WEBP o GIF.'));
    }
    callback(null, true);
};
const cleanupUploadedFiles = async (files = []) => {
    await Promise.all(files.map(async (file) => {
        try {
            await fs.promises.unlink(file.path);
        } catch (error) {
            if (error.code !== 'ENOENT') console.error(`No se pudo limpiar la imagen subida ${file.filename}:`, error);
        }
    }));
};
const uploadRoomImages = multer({
    storage: imageUploadStorage,
    limits: { fileSize: 5 * 1024 * 1024, files: 4 },
    fileFilter: imageFileFilter
}).array('images', 4);
const uploadRoomImagesSafely = (req, res, next) => {
    uploadRoomImages(req, res, (error) => {
        if (!error) return next();
        cleanupUploadedFiles(req.files).finally(() => next(error));
    });
};
const uploadFoodImage = multer({
    storage: imageUploadStorage,
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    fileFilter: imageFileFilter
}).single('image');

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
const roomAmenityFields = ['airConditioning', 'cableTv', 'safe', 'workstation', 'wifi', 'minibar', 'privateBathroom', 'balcony', 'smokeFree'];
const roomEditableFields = ['number', 'floor', 'type', 'capacity', 'area', 'beds', 'bedType', 'pricePerNight', 'description'];
const parseBooleanField = (value, label) => {
    if (typeof value === 'boolean') return value;
    if (value === 1 || value === '1' || value === 'true') return true;
    if (value === 0 || value === '0' || value === 'false') return false;
    throw new HttpError(400, `El valor de ${label} no es válido.`);
};
const parseRoomAmenities = (value) => {
    let amenities = value;
    if (typeof amenities === 'string') {
        try {
            amenities = JSON.parse(amenities);
        } catch {
            throw new HttpError(400, 'Los servicios de la habitación no son válidos.');
        }
    }
    if (!amenities || typeof amenities !== 'object' || Array.isArray(amenities)) {
        throw new HttpError(400, 'Los servicios de la habitación no son válidos.');
    }
    const unknownFields = Object.keys(amenities).filter((key) => !roomAmenityFields.includes(key));
    if (unknownFields.length) throw new HttpError(400, `Servicios no reconocidos: ${unknownFields.join(', ')}`);
    return Object.fromEntries(Object.entries(amenities).map(([key, enabled]) => [key, parseBooleanField(enabled, key)]));
};
const getRoomGallery = (room) => {
    let gallery = room.gallery;
    if (typeof gallery === 'string') {
        try {
            gallery = JSON.parse(gallery);
        } catch {
            gallery = [];
        }
    }
    return Array.isArray(gallery) ? gallery : [];
};
const getRoomImageUrls = (room) => [
    ...getRoomGallery(room).map((image) => typeof image === 'string' ? image : image?.src),
    room.imageUrl
].filter((src) => typeof src === 'string' && src);
const managedRoomImageFilename = (imageUrl) => {
    if (typeof imageUrl !== 'string' || !imageUrl.startsWith('/uploads/')) return null;
    const filename = imageUrl.slice('/uploads/'.length);
    return /^[a-f0-9]{32}\.(jpg|png|webp|gif)$/.test(filename) ? filename : null;
};
const deleteUnreferencedRoomImages = async (imageUrls) => {
    const filenames = new Set(imageUrls.map(managedRoomImageFilename).filter(Boolean));
    if (!filenames.size) return;
    const rooms = await Habitacion.findAll({
        paranoid: false,
        attributes: ['imageUrl', 'gallery']
    });
    const referencedFilenames = new Set(rooms.flatMap(getRoomImageUrls).map(managedRoomImageFilename).filter(Boolean));
    for (const filename of filenames) {
        if (referencedFilenames.has(filename)) continue;
        try {
            await fs.promises.unlink(path.join(uploadDirectory, filename));
        } catch (error) {
            if (error.code !== 'ENOENT') {
                console.error(`No se pudo eliminar la imagen ${filename}:`, error);
                throw error;
            }
        }
    }
};
const deleteUnreferencedUpload = async (imageUrl) => {
    const filename = managedRoomImageFilename(imageUrl);
    if (!filename) return;
    const [rooms, foods, plans] = await Promise.all([
        Habitacion.findAll({ paranoid: false, attributes: ['imageUrl', 'gallery'] }),
        Comida.findAll({ paranoid: false, attributes: ['imageUrl'] }),
        Plan.findAll({ paranoid: false, attributes: ['imageUrl'] })
    ]);
    const referencedUrls = [
        ...rooms.flatMap(getRoomImageUrls),
        ...foods.map((food) => food.imageUrl),
        ...plans.map((plan) => plan.imageUrl)
    ];
    if (referencedUrls.some((url) => managedRoomImageFilename(url) === filename)) return;
    try {
        await fs.promises.unlink(path.join(uploadDirectory, filename));
    } catch (error) {
        if (error.code !== 'ENOENT') {
            console.error(`No se pudo eliminar la imagen ${filename}:`, error);
            throw error;
        }
    }
};
const dateOnlyFromRoom = (value) => {
    if (!value) return null;
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
};
const roomUnavailableForRange = (room, checkIn, checkOut) => {
    const unavailableFrom = dateOnlyFromRoom(room.unavailableFrom);
    const unavailableUntil = dateOnlyFromRoom(room.unavailableUntil);
    return Boolean(unavailableFrom && unavailableUntil && checkIn < unavailableUntil && checkOut > unavailableFrom);
};
const safeUser = (user) => ({
    id: user.id,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    twoFactorEnabled: Boolean(user.twoFactorEnabled),
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
const isValidDateOnly = (value) => {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const parsed = parseDate(value);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};
const getNights = (checkIn, checkOut) => Math.round((parseDate(checkOut) - parseDate(checkIn)) / 86400000);
const reservationTotal = (room, plan, nights) => Number(room.pricePerNight) * nights + Number(plan?.price || 0);
const paymentMethods = ['efectivo', 'tarjeta', 'transferencia', 'pago_movil'];
const toCents = (value) => Math.round(Number(value) * 100);
const formatStatementAmount = (value) => `Bs. ${new Intl.NumberFormat('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
}).format(Number(value) || 0)}`;
const pdfToBuffer = (writeDocument) => new Promise((resolve, reject) => {
    const document = new PDFDocument({ size: 'A4', margin: 48 });
    const chunks = [];
    document.on('data', (chunk) => chunks.push(chunk));
    document.on('end', () => resolve(Buffer.concat(chunks)));
    document.on('error', reject);
    writeDocument(document);
    document.end();
});
const writeStatementRow = (document, label, value, options = {}) => {
    const { bold = false, indent = 0 } = options;
    document.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(10)
        .text(label, 48 + indent, document.y, { continued: true, width: 380 - indent })
        .text(value, { align: 'right', width: 116 });
};
const getCancellationDeadline = (checkIn, checkInTime) => {
    const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(checkInTime || '15:00'));
    const arrivalTime = match ? `${match[1]}:${match[2]}` : '15:00';
    return new Date(new Date(`${checkIn}T${arrivalTime}:00.000Z`).getTime() - 24 * 60 * 60 * 1000);
};
const notificationStreams = new Map();

const publishNotification = (notification) => {
    const listeners = notificationStreams.get(String(notification.userId));
    if (!listeners) return;
    const event = `event: notification\ndata: ${JSON.stringify(notification.toJSON ? notification.toJSON() : notification)}\n\n`;
    for (const response of listeners) response.write(event);
};

const createUserNotification = async (userId, details, transaction) => {
    const notification = await Notificacion.create({ userId, ...details }, { transaction });
    if (!transaction) publishNotification(notification);
    return notification;
};

const createAdminNotifications = async (details, transaction) => {
    const admins = await Usuario.findAll({
        where: { role: 'admin', isActive: true },
        attributes: ['id'],
        transaction
    });
    if (!admins.length) return [];
    const notifications = await Notificacion.bulkCreate(
        admins.map((admin) => ({ userId: admin.id, ...details })),
        { transaction }
    );
    if (!transaction) notifications.forEach(publishNotification);
    return notifications;
};

const closeNotificationStream = (userId, response, heartbeat) => {
    clearInterval(heartbeat);
    const listeners = notificationStreams.get(userId);
    listeners?.delete(response);
    if (listeners?.size === 0) notificationStreams.delete(userId);
};

// Cierra un inicio de sesión exitoso: crea el token de sesión y deja constancia en la auditoría.
const completeLogin = async (user, req) => {
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
    return token;
};
const audit = (req, action) => models.Auditoria.create({
    userId: req.user.id,
    action,
    entity: 'Usuario',
    entityId: req.user.id,
    ipAddress: req.ip,
    userAgent: req.get('user-agent')?.slice(0, 500) || null
});

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

app.get('/api/rooms', optionalAuthentication, asyncHandler(async (req, res) => {
    const isAdmin = req.user?.role === 'admin';
    const catalogMode = req.query.catalog === 'true';
    const adminManagementMode = isAdmin && !catalogMode;
    const where = adminManagementMode
        ? {}
        : { isVisible: true, isBookable: true, ...(catalogMode ? {} : { status: 'disponible' }) };
    let rooms = await Habitacion.findAll({
        where,
        order: [['number', 'ASC']],
        paranoid: !adminManagementMode
    });
    // Una solicitud pendiente también bloquea la habitación para evitar que
    // otro huésped la seleccione mientras el administrador la revisa.
    if (!adminManagementMode) {
        const today = new Date().toISOString().slice(0, 10);
        const tomorrow = new Date(parseDate(today).getTime() + 86400000).toISOString().slice(0, 10);
        const blockedReservations = await Reserva.findAll({
            attributes: ['roomId'],
            where: {
                status: { [Op.notIn]: ['cancelada', 'cancelado', 'finalizada'] },
                checkOut: { [Op.gte]: today }
            },
            raw: true
        });
        const blockedRoomIds = new Set(blockedReservations.map(({ roomId }) => String(roomId)));
        if (catalogMode) {
            rooms = rooms.map((room) => {
                const isReserved = blockedRoomIds.has(String(room.id));
                const isUnderMaintenance = roomUnavailableForRange(room, today, tomorrow);
                return {
                    ...room.toJSON(),
                    isReserved,
                    isAvailable: room.status === 'disponible' && !isReserved && !isUnderMaintenance
                };
            });
        } else {
            rooms = rooms.filter((room) => !blockedRoomIds.has(String(room.id)) && !roomUnavailableForRange(room, today, tomorrow));
        }
    }
    res.json(rooms);
}));

app.post('/api/rooms', ...adminOnly, uploadRoomImagesSafely, asyncHandler(async (req, res) => {
    try {
        const data = req.body;
        requireFields(data, ['number', 'floor', 'type', 'capacity', 'pricePerNight']);
        if (!req.files?.length) throw new HttpError(400, 'Selecciona al menos una imagen para la habitación.');
        const amenities = data.amenities ? parseRoomAmenities(data.amenities) : {};
        const fields = { ...data };
        delete fields.amenities;
        delete fields.imageUrl;
        delete fields.gallery;
        for (const key of ['floor', 'capacity', 'area', 'beds', 'pricePerNight']) {
            if (fields[key] !== undefined) fields[key] = fields[key] === '' ? null : Number(fields[key]);
        }
        const gallery = (req.files || []).map((file) => ({
            src: `/uploads/${file.filename}`,
            alt: `Habitación ${fields.number}`
        }));
        const room = await Habitacion.create({
            ...fields,
            imageUrl: gallery[0]?.src || null,
            gallery,
            ...Object.fromEntries(roomAmenityFields.map((key) => [key, Boolean(amenities[key])])),
            createdByUserId: req.user.id
        });
        res.status(201).json(room);
    } catch (error) {
        await cleanupUploadedFiles(req.files);
        throw error;
    }
}));

const updateRoom = asyncHandler(async (req, res) => {
    const room = await Habitacion.findByPk(req.params.id);
    if (!room) throw new HttpError(404, 'No se encontró la habitación.');

    const data = req.body;
    const allowedFields = new Set([...roomEditableFields, ...roomAmenityFields, 'amenities']);
    const unknownFields = Object.keys(data).filter((key) => !allowedFields.has(key));
    if (unknownFields.length) throw new HttpError(400, `Campos no editables: ${unknownFields.join(', ')}`);
    const updates = {};
    for (const field of roomEditableFields) {
        if (data[field] === undefined) continue;
        const value = data[field];
        if (['floor', 'capacity', 'beds', 'pricePerNight', 'area'].includes(field)) {
            if (value === null || value === '') {
                if (field !== 'area') throw new HttpError(400, `El campo ${field} no puede estar vacío.`);
                updates[field] = null;
                continue;
            }
            const number = Number(value);
            const mustBeInteger = ['floor', 'capacity', 'beds'].includes(field);
            const minimum = ['capacity', 'beds'].includes(field) ? 1 : 0;
            if (!Number.isFinite(number) || number < minimum || (mustBeInteger && !Number.isInteger(number))) {
                throw new HttpError(400, `El valor de ${field} no es válido.`);
            }
            updates[field] = number;
        } else if (['number', 'type', 'bedType'].includes(field)) {
            if ((value === null || value === '') && field === 'bedType') {
                updates[field] = null;
                continue;
            }
            if (typeof value !== 'string' || !value.trim()) throw new HttpError(400, `El campo ${field} no puede estar vacío.`);
            updates[field] = value.trim();
        } else {
            if (value !== null && typeof value !== 'string') throw new HttpError(400, `El valor de ${field} no es válido.`);
            updates[field] = value;
        }
    }
    for (const field of roomAmenityFields) {
        if (data[field] !== undefined) updates[field] = parseBooleanField(data[field], field);
    }
    if (data.amenities !== undefined) Object.assign(updates, parseRoomAmenities(data.amenities));
    if (!Object.keys(updates).length) throw new HttpError(400, 'Indica al menos un dato para actualizar.');
    await room.update({ ...updates, updatedByUserId: req.user.id });
    res.json(room);
});
app.patch('/api/rooms/:id', ...adminOnly, updateRoom);
app.put('/api/rooms/:id', ...adminOnly, updateRoom);

app.patch('/api/rooms/:id/status', ...adminOnly, asyncHandler(async (req, res) => {
    const room = await Habitacion.findByPk(req.params.id);
    if (!room) throw new HttpError(404, 'No se encontró la habitación.');

    const allowedFields = ['status', 'maintenanceNotes', 'unavailableFrom', 'unavailableUntil'];
    const unknownFields = Object.keys(req.body).filter((key) => !allowedFields.includes(key));
    if (unknownFields.length) throw new HttpError(400, `Campos no válidos: ${unknownFields.join(', ')}`);
    if (!Object.keys(req.body).length) throw new HttpError(400, 'Indica al menos un dato para actualizar.');

    const updates = {};
    if (req.body.status !== undefined) {
        if (!['disponible', 'ocupada', 'limpieza', 'mantenimiento'].includes(req.body.status)) {
            throw new HttpError(400, 'El estado de la habitación no es válido.');
        }
        updates.status = req.body.status;
    }
    if (req.body.maintenanceNotes !== undefined) {
        if (req.body.maintenanceNotes !== null && typeof req.body.maintenanceNotes !== 'string') {
            throw new HttpError(400, 'Las notas de mantenimiento no son válidas.');
        }
        updates.maintenanceNotes = req.body.maintenanceNotes?.trim() || null;
    }
    for (const field of ['unavailableFrom', 'unavailableUntil']) {
        if (req.body[field] === undefined) continue;
        const value = req.body[field];
        if (value === null || value === '') {
            updates[field] = null;
        } else if (isValidDateOnly(value)) {
            updates[field] = parseDate(value);
        } else {
            throw new HttpError(400, `La fecha ${field} debe usar el formato AAAA-MM-DD.`);
        }
    }

    const unavailableFrom = dateOnlyFromRoom(
        Object.prototype.hasOwnProperty.call(updates, 'unavailableFrom') ? updates.unavailableFrom : room.unavailableFrom
    );
    const unavailableUntil = dateOnlyFromRoom(
        Object.prototype.hasOwnProperty.call(updates, 'unavailableUntil') ? updates.unavailableUntil : room.unavailableUntil
    );
    if (Boolean(unavailableFrom) !== Boolean(unavailableUntil)) {
        throw new HttpError(400, 'Indica las fechas de inicio y fin del bloqueo, o limpia ambas fechas.');
    }
    if (unavailableFrom && unavailableUntil <= unavailableFrom) {
        throw new HttpError(400, 'La fecha de fin del bloqueo debe ser posterior a la fecha de inicio.');
    }
    if (unavailableFrom && unavailableUntil && (updates.unavailableFrom || updates.unavailableUntil)) {
        const conflictingReservation = await Reserva.findOne({
            where: {
                roomId: room.id,
                status: { [Op.notIn]: ['cancelada', 'cancelado', 'finalizada'] },
                checkIn: { [Op.lt]: unavailableUntil },
                checkOut: { [Op.gt]: unavailableFrom }
            }
        });
        if (conflictingReservation) {
            throw new HttpError(409, 'El bloqueo coincide con una reserva vigente o futura.');
        }
    }
    await room.update({ ...updates, updatedByUserId: req.user.id });
    res.json(room);
}));

app.put('/api/rooms/:id/images', ...adminOnly, uploadRoomImagesSafely, asyncHandler(async (req, res) => {
    let gallerySaved = false;
    try {
        if (!req.files?.length) throw new HttpError(400, 'Selecciona al menos una imagen.');
        const room = await Habitacion.findByPk(req.params.id);
        if (!room) throw new HttpError(404, 'No se encontró la habitación.');

        const previousImageUrls = getRoomImageUrls(room);
        const gallery = req.files.map((file) => ({
            src: `/uploads/${file.filename}`,
            alt: `Habitación ${room.number}`
        }));
        await room.update({ imageUrl: gallery[0].src, gallery });
        gallerySaved = true;
        await deleteUnreferencedRoomImages(previousImageUrls);
        res.json(room);
    } catch (error) {
        if (!gallerySaved) await cleanupUploadedFiles(req.files);
        throw error;
    }
}));

app.delete('/api/rooms/:id/images/:imageName', ...adminOnly, asyncHandler(async (req, res) => {
    const room = await Habitacion.findByPk(req.params.id);
    if (!room) throw new HttpError(404, 'No se encontró la habitación.');
    const filename = req.params.imageName;
    if (!/^[a-f0-9]{32}\.(jpg|png|webp|gif)$/.test(filename)) {
        throw new HttpError(400, 'La imagen indicada no es válida.');
    }

    const gallery = getRoomGallery(room);
    if (!gallery.length && room.imageUrl) {
        gallery.push({ src: room.imageUrl, alt: `Habitación ${room.number}` });
    }
    const imageIndex = gallery.findIndex((image) => {
        const src = typeof image === 'string' ? image : image?.src;
        return managedRoomImageFilename(src) === filename;
    });
    if (imageIndex < 0) throw new HttpError(404, 'La imagen no pertenece a esta habitación.');
    const previousImageUrls = getRoomImageUrls(room);
    gallery.splice(imageIndex, 1);
    const imageUrl = (typeof gallery[0] === 'string' ? gallery[0] : gallery[0]?.src) || null;
    await room.update({ gallery, imageUrl, updatedByUserId: req.user.id });
    await deleteUnreferencedRoomImages(previousImageUrls);
    res.json(room);
}));

app.delete('/api/rooms/:id', ...adminOnly, asyncHandler(async (req, res) => {
    const room = await Habitacion.findByPk(req.params.id, { paranoid: false });
    if (!room) throw new HttpError(404, 'No se encontró la habitación.');

    const today = new Date().toISOString().slice(0, 10);
    const reservation = await Reserva.findOne({
        where: {
            roomId: room.id,
            status: { [Op.notIn]: ['cancelada', 'cancelado', 'finalizada'] },
            checkOut: { [Op.gt]: today }
        }
    });
    if (reservation) {
        throw new HttpError(409, 'No se puede eliminar una habitación con reservas vigentes o futuras.');
    }

    const [reservationHistory, orderHistory] = await Promise.all([
        Reserva.findOne({ where: { roomId: room.id }, paranoid: false }),
        Pedido.findOne({ where: { roomId: room.id }, paranoid: false })
    ]);
    if (reservationHistory || orderHistory) {
        throw new HttpError(409, 'No se puede eliminar permanentemente una habitación con historial de reservas o pedidos asociado.');
    }

    const imageUrls = getRoomImageUrls(room);
    await room.destroy({ force: true });
    await deleteUnreferencedRoomImages(imageUrls);
    res.status(204).end();
}));

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

app.get('/api/notifications', authenticate, asyncHandler(async (req, res) => {
    const notifications = await Notificacion.findAll({
        where: { userId: req.user.id, isActive: true },
        order: [['createdAt', 'DESC']],
        limit: 50
    });
    res.json(notifications);
}));

app.get('/api/notifications/stream', authenticate, (req, res) => {
    const userId = String(req.user.id);
    res.set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no'
    });
    res.flushHeaders();
    res.write(': connected\n\n');

    const listeners = notificationStreams.get(userId) || new Set();
    listeners.add(res);
    notificationStreams.set(userId, listeners);
    const heartbeat = setInterval(() => res.write(': keep-alive\n\n'), 25000);
    res.on('close', () => closeNotificationStream(userId, res, heartbeat));
});

app.patch('/api/notifications/read-all', authenticate, asyncHandler(async (req, res) => {
    await Notificacion.update(
        { readAt: new Date(), updatedByUserId: req.user.id },
        { where: { userId: req.user.id, isActive: true, readAt: null } }
    );
    res.json({ message: 'Notificaciones marcadas como leídas.' });
}));

app.patch('/api/notifications/:id/read', authenticate, asyncHandler(async (req, res) => {
    const notification = await Notificacion.findOne({
        where: { id: req.params.id, userId: req.user.id, isActive: true }
    });
    if (!notification) throw new HttpError(404, 'No se encontró la notificación.');
    if (!notification.readAt) {
        await notification.update({ readAt: new Date(), updatedByUserId: req.user.id });
    }
    res.json(notification);
}));

app.get('/api/me/reservations', authenticate, asyncHandler(async (req, res) => {
    const today = new Date().toISOString().slice(0, 10);
    const reservations = await Reserva.findAll({
        where: {
            userId: req.user.id,
            status: { [Op.notIn]: ['cancelada', 'cancelado', 'finalizada'] },
            checkOut: { [Op.gte]: today }
        },
        include: [
            { model: Habitacion, as: 'habitacion' },
            { model: Plan, as: 'plan' }
        ],
        order: [['createdAt', 'DESC']]
    });
    res.json(reservations);
}));

app.get('/api/me/reservations/history', authenticate, asyncHandler(async (req, res) => {
    const today = new Date().toISOString().slice(0, 10);
    const reservations = await Reserva.findAll({
        where: {
            userId: req.user.id,
            [Op.or]: [
                { status: { [Op.in]: ['cancelada', 'cancelado', 'finalizada'] } },
                { checkOut: { [Op.lt]: today } }
            ]
        },
        include: [
            { model: Habitacion, as: 'habitacion' },
            { model: Plan, as: 'plan' }
        ],
        order: [['createdAt', 'DESC']]
    });
    res.json(reservations);
}));

const paymentIncludes = [
    {
        model: Usuario,
        as: 'usuario',
        attributes: ['id', 'email'],
        include: [{ model: Huesped, as: 'huesped', attributes: ['firstName', 'lastName'] }]
    },
    {
        model: Reserva,
        as: 'reserva',
        attributes: ['id', 'reservationCode', 'checkIn', 'checkOut', 'total', 'balance'],
        include: [{ model: Habitacion, as: 'habitacion', attributes: ['number', 'type'] }]
    },
    { model: Pedido, as: 'pedido', attributes: ['id', 'orderCode', 'total', 'requestedAt'] }
];

app.get('/api/payments', ...adminOnly, asyncHandler(async (_req, res) => {
    res.json(await Pago.findAll({
        include: paymentIncludes,
        order: [['paidAt', 'DESC'], ['createdAt', 'DESC']]
    }));
}));

app.get('/api/me/payments', authenticate, asyncHandler(async (req, res) => {
    res.json(await Pago.findAll({
        where: { userId: req.user.id },
        include: paymentIncludes.slice(1),
        order: [['paidAt', 'DESC'], ['createdAt', 'DESC']]
    }));
}));

const sendReservationStatement = async (reservationId, userId, res) => {
    const reservation = await Reserva.findOne({
        where: { id: reservationId, ...(userId ? { userId } : {}) },
        include: [
            {
                model: Usuario,
                as: 'usuario',
                attributes: ['id', 'email'],
                include: [{ model: Huesped, as: 'huesped', attributes: ['firstName', 'lastName', 'documentNumber'] }]
            },
            { model: Habitacion, as: 'habitacion', attributes: ['number', 'type', 'checkInTime', 'checkOutTime'] },
            { model: Pago, as: 'pagos', attributes: ['amount', 'currency', 'method', 'status', 'transactionReference', 'paidAt', 'createdAt'] }
        ]
    });
    if (!reservation) throw new HttpError(404, 'No se encontró la reserva.');

    const checkInTime = reservation.habitacion?.checkInTime || '15:00';
    const checkOutTime = reservation.habitacion?.checkOutTime || '12:00';
    const start = new Date(`${reservation.checkIn}T${checkInTime}:00.000Z`);
    const end = new Date(`${reservation.checkOut}T${checkOutTime}:00.000Z`);
    const orders = await Pedido.findAll({
        where: {
            userId: reservation.userId,
            roomId: reservation.roomId,
            status: { [Op.ne]: 'cancelado' },
            requestedAt: { [Op.gte]: start, [Op.lt]: end }
        },
        include: [
            { model: DetallePedido, as: 'detalles' },
            { model: Pago, as: 'pagos', attributes: ['amount', 'currency', 'method', 'status', 'transactionReference', 'paidAt', 'createdAt'] }
        ],
        order: [['requestedAt', 'ASC']]
    });

    const roomTotalCents = toCents(reservation.total);
    const reservationPayments = reservation.pagos.filter((payment) => payment.status === 'pagado');
    const recordedRoomPaymentsCents = reservationPayments.reduce((sum, payment) => sum + toCents(payment.amount), 0);
    const roomPaidCents = Math.min(roomTotalCents, Math.max(toCents(reservation.advance || 0), recordedRoomPaymentsCents));
    const orderTotalsCents = orders.map((order) => toCents(order.total));
    const orderPayments = orders.flatMap((order) => order.pagos
        .filter((payment) => payment.status === 'pagado')
        .map((payment) => ({ ...payment.toJSON(), orderCode: order.orderCode })));
    const orderPaidCents = orders.reduce((sum, order, index) => {
        const recorded = order.pagos
            .filter((payment) => payment.status === 'pagado')
            .reduce((paymentSum, payment) => paymentSum + toCents(payment.amount), 0);
        const paid = recorded || (order.paymentStatus === 'pagado' ? orderTotalsCents[index] : 0);
        return sum + Math.min(orderTotalsCents[index], paid);
    }, 0);
    const consumptionTotalCents = orderTotalsCents.reduce((sum, amount) => sum + amount, 0);
    const totalCents = roomTotalCents + consumptionTotalCents;
    const paidCents = roomPaidCents + orderPaidCents;
    const balanceCents = Math.max(0, totalCents - paidCents);
    const guest = reservation.usuario?.huesped;
    const guestName = guest ? `${guest.firstName} ${guest.lastName}`.trim() : reservation.usuario?.email || 'Huésped';
    const statementNumber = `CTA-${reservation.reservationCode}`;
    const documentBuffer = await pdfToBuffer((document) => {
        document.font('Helvetica-Bold').fontSize(18).text('HOTEL MOLINERA');
        document.moveDown(0.35);
        document.fontSize(14).text('ESTADO DE CUENTA');
        document.font('Helvetica').fontSize(9).fillColor('#555555')
            .text('Comprobante informativo; no sustituye una factura fiscal.');
        document.fillColor('#000000').moveDown();
        writeStatementRow(document, 'Cuenta', statementNumber, { bold: true });
        writeStatementRow(document, 'Huésped', guestName);
        writeStatementRow(document, 'Documento', guest?.documentNumber || '—');
        writeStatementRow(document, 'Habitación', `${reservation.habitacion?.type || 'Habitación'} ${reservation.habitacion?.number || ''}`.trim());
        writeStatementRow(document, 'Check-in / check-out', `${reservation.checkIn} al ${reservation.checkOut}`);
        writeStatementRow(document, 'Código de reserva', reservation.reservationCode);
        document.moveDown(0.7);
        document.font('Helvetica-Bold').fontSize(12).text('Alojamiento');
        document.moveDown(0.25);
        writeStatementRow(document, `${reservation.nights || 0} noche(s) x ${formatStatementAmount(reservation.pricePerNight || 0)}`, formatStatementAmount(reservation.total));
        if (Number(reservation.taxes || 0) > 0) {
            writeStatementRow(document, 'Impuestos incluidos en el alojamiento', formatStatementAmount(reservation.taxes));
        }
        document.moveDown(0.7);
        document.font('Helvetica-Bold').fontSize(12).text('Consumos durante la estadía');
        document.moveDown(0.25);
        if (!orders.length) {
            document.font('Helvetica').fontSize(10).text('No hay consumos de restaurante registrados para esta estadía.');
        }
        for (const order of orders) {
            document.font('Helvetica-Bold').fontSize(10).text(`Pedido ${order.orderCode} · ${new Date(order.requestedAt).toLocaleString('es-VE')}`);
            for (const detail of order.detalles || []) {
                writeStatementRow(document, `${detail.quantity} x ${detail.foodName} (${formatStatementAmount(detail.unitPrice)})`, formatStatementAmount(detail.totalPrice), { indent: 12 });
            }
            writeStatementRow(document, 'Total del pedido', formatStatementAmount(order.total), { bold: true, indent: 12 });
            document.moveDown(0.35);
        }
        document.moveDown(0.35);
        document.font('Helvetica-Bold').fontSize(12).text('Pagos y abonos registrados');
        document.moveDown(0.25);
        const transactions = [
            ...reservationPayments.map((payment) => ({ ...payment.toJSON(), reference: payment.transactionReference })),
            ...orderPayments
        ].sort((a, b) => new Date(a.paidAt || a.createdAt) - new Date(b.paidAt || b.createdAt));
        if (!transactions.length && paidCents > 0) {
            writeStatementRow(document, 'Abonos anteriores (sin detalle de transacción)', formatStatementAmount(paidCents / 100));
        }
        transactions.forEach((payment) => {
            const date = payment.paidAt || payment.createdAt;
            const reference = payment.transactionReference ? ` · Ref. ${payment.transactionReference}` : '';
            const orderLabel = payment.orderCode ? ` · Pedido ${payment.orderCode}` : ' · Habitación';
            writeStatementRow(
                document,
                `${date ? new Date(date).toLocaleDateString('es-VE') : 'Fecha no disponible'} · ${payment.method}${orderLabel}${reference}`,
                formatStatementAmount(payment.amount)
            );
        });
        document.moveDown(0.65);
        document.font('Helvetica-Bold').fontSize(11);
        writeStatementRow(document, 'Total alojamiento', formatStatementAmount(roomTotalCents / 100), { bold: true });
        writeStatementRow(document, 'Total consumos', formatStatementAmount(consumptionTotalCents / 100), { bold: true });
        writeStatementRow(document, 'Total cuenta', formatStatementAmount(totalCents / 100), { bold: true });
        writeStatementRow(document, 'Total pagado', formatStatementAmount(paidCents / 100), { bold: true });
        document.fillColor('#9b1c1c');
        writeStatementRow(document, 'Saldo pendiente', formatStatementAmount(balanceCents / 100), { bold: true });
        document.fillColor('#000000');
        document.moveDown();
        document.font('Helvetica').fontSize(8).fillColor('#666666')
            .text('Los consumos se asocian a la habitación y a las fechas de esta estadía. Para aclaraciones, comuníquese con recepción.');
    });
    res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${statementNumber}.pdf"`,
        'Cache-Control': 'private, no-store'
    });
    res.send(documentBuffer);
};

app.get('/api/reservations/:id/receipt.pdf', ...adminOnly, asyncHandler(async (req, res) => {
    await sendReservationStatement(req.params.id, null, res);
}));

app.get('/api/me/reservations/:id/receipt.pdf', authenticate, asyncHandler(async (req, res) => {
    await sendReservationStatement(req.params.id, req.user.id, res);
}));

app.post('/api/reservations', authenticate, asyncHandler(async (req, res) => {
    const { roomId, checkIn, checkOut } = req.body;
    requireFields(req.body, ['roomId', 'checkIn', 'checkOut']);
    if (!isValidDateOnly(checkIn) || !isValidDateOnly(checkOut)) {
        throw new HttpError(400, 'Las fechas de la reserva no son válidas.');
    }
    const start = parseDate(checkIn);
    const end = parseDate(checkOut);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
        throw new HttpError(400, 'La fecha de salida debe ser posterior a la fecha de entrada.');
    }
    if (req.user.role === 'guest') {
        const today = new Date().toISOString().slice(0, 10);
        const activeReservation = await Reserva.findOne({
            where: {
                userId: req.user.id,
                status: { [Op.notIn]: ['cancelada', 'cancelado', 'finalizada'] },
                checkOut: { [Op.gte]: today }
            }
        });
        if (activeReservation) {
            throw new HttpError(409, 'Ya tienes una solicitud o reserva activa. Revisa “Mi habitación” antes de enviar otra.');
        }
    }
    const room = await Habitacion.findByPk(roomId);
    if (!room || !room.isActive || !room.isVisible || !room.isBookable || room.status !== 'disponible') {
        throw new HttpError(404, 'La habitación seleccionada no está disponible.');
    }
    if (roomUnavailableForRange(room, checkIn, checkOut)) {
        throw new HttpError(409, 'La habitación tiene un bloqueo de mantenimiento en esas fechas.');
    }
    const guests = Number(req.body.guests || req.body.adults || 1) + Number(req.body.children || 0);
    if (!Number.isInteger(guests) || guests < 1 || guests > room.capacity) {
        throw new HttpError(400, `La habitación admite un máximo de ${room.capacity} huéspedes.`);
    }
    const conflict = await Reserva.findOne({
        where: {
            roomId: room.id,
            status: { [Op.notIn]: ['cancelada', 'cancelado', 'finalizada'] },
            checkIn: { [Op.lt]: checkOut },
            checkOut: { [Op.gt]: checkIn }
        }
    });
    if (conflict) throw new HttpError(409, 'La habitación ya está reservada en esas fechas.');
    const nights = getNights(checkIn, checkOut);
    let plan = null;
    if (req.body.planId !== undefined && req.body.planId !== null && req.body.planId !== '') {
        plan = await Plan.findOne({
            where: { id: req.body.planId, isActive: true, isVisible: true, isBookable: true }
        });
        if (!plan) throw new HttpError(404, 'El plan seleccionado no está disponible.');
        if ((plan.validFrom && checkIn < plan.validFrom) || (plan.validUntil && checkIn > plan.validUntil)) {
            throw new HttpError(400, 'El plan no está disponible para las fechas seleccionadas.');
        }
    }
    const total = reservationTotal(room, plan, nights);
    const advance = req.user.role === 'admin' ? Number(req.body.advance || 0) : 0;
    const totalCents = toCents(total);
    const advanceCents = toCents(advance);
    if (!Number.isFinite(advance) || !Number.isSafeInteger(totalCents) || !Number.isSafeInteger(advanceCents)
        || advance < 0 || advanceCents > totalCents || Math.abs(advance * 100 - advanceCents) > 0.000001) {
        throw new HttpError(400, 'El anticipo debe estar entre cero y el total y tener máximo dos decimales.');
    }
    const normalizedTotal = totalCents / 100;
    const normalizedAdvance = advanceCents / 100;
    let reservationUserId = req.user.id;
    if (req.user.role === 'admin') {
        requireFields(req.body, ['clientId']);
        const client = await Huesped.findByPk(req.body.clientId);
        if (!client) throw new HttpError(404, 'No se encontró el huésped seleccionado.');
        reservationUserId = client.userId;
    }
    const initialPaymentMethod = req.body.paymentMethod || 'efectivo';
    if (req.body.transactionReference != null && typeof req.body.transactionReference !== 'string') {
        throw new HttpError(400, 'La referencia de pago no es válida.');
    }
    const transactionReference = (req.body.transactionReference || '').trim();
    if (transactionReference.length > 150) throw new HttpError(400, 'La referencia no puede superar 150 caracteres.');
    if (advance > 0) {
        if (!paymentMethods.includes(initialPaymentMethod)) {
            throw new HttpError(400, 'Selecciona un método de pago válido para el anticipo.');
        }
        if (['transferencia', 'pago_movil'].includes(initialPaymentMethod) && !transactionReference) {
            throw new HttpError(400, 'Indica la referencia de la transferencia o Pago Móvil.');
        }
    }

    const transaction = await sequelize.transaction();
    let reservation;
    try {
        reservation = await Reserva.create({
            userId: reservationUserId,
            roomId: room.id,
            planId: plan?.id || null,
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
            subtotal: normalizedTotal,
            taxes: 0,
            total: normalizedTotal,
            advance: normalizedAdvance,
            balance: (totalCents - advanceCents) / 100,
            paymentStatus: advanceCents === totalCents ? 'pagado' : advanceCents > 0 ? 'parcial' : 'pendiente',
            paymentMethod: advanceCents > 0 ? initialPaymentMethod : null,
            specialRequests: req.body.specialRequests || req.body.requests || null,
            createdByUserId: req.user.id
        }, { transaction });
        if (advanceCents > 0) {
            await Pago.create({
                userId: reservationUserId,
                reservationId: reservation.id,
                amount: normalizedAdvance,
                currency: 'VES',
                method: initialPaymentMethod,
                status: 'pagado',
                transactionReference: transactionReference || null,
                paidAt: new Date(),
                notes: 'Anticipo registrado al crear la reserva.',
                createdByUserId: req.user.id
            }, { transaction });
        }
        await transaction.commit();
    } catch (error) {
        if (!transaction.finished) await transaction.rollback();
        throw error;
    }
    await createAdminNotifications({
        type: 'new_reservation',
        title: 'Nueva reserva recibida',
        message: `Se recibió una reserva para la habitación ${room.number}.`,
        data: { route: '/admin/reservas', reservationId: reservation.id }
    });
    if (reservation.status === 'confirmada') {
        await createUserNotification(reservationUserId, {
            type: 'reservation_confirmed',
            title: 'Tu reserva fue confirmada',
            message: `Tu reserva ${reservation.reservationCode} está confirmada.`,
            data: { route: '/mi-habitacion', reservationId: reservation.id }
        });
    }
    res.status(201).json(await Reserva.findByPk(reservation.id, {
        include: [
            { model: Habitacion, as: 'habitacion' },
            { model: Plan, as: 'plan' }
        ]
    }));
}));

app.post('/api/reservations/:id/check-in', ...adminOnly, asyncHandler(async (req, res) => {
    requireFields(req.body, ['documentNumber']);
    const transaction = await sequelize.transaction();
    try {
        const reservation = await Reserva.findByPk(req.params.id, {
            transaction,
            lock: transaction.LOCK.UPDATE,
            include: [{ model: Usuario, as: 'usuario', include: [{ model: Huesped, as: 'huesped' }] }]
        });
        if (!reservation) throw new HttpError(404, 'No se encontró la reserva.');
        if (reservation.status !== 'confirmada' || reservation.checkedInAt) {
            throw new HttpError(409, 'Solo se puede registrar el check-in de una reserva confirmada que aún no haya ingresado.');
        }
        const guestDocument = reservation.usuario?.huesped?.documentNumber;
        if (!guestDocument || String(req.body.documentNumber).trim().toUpperCase() !== String(guestDocument).trim().toUpperCase()) {
            throw new HttpError(403, 'El documento presentado no coincide con el huésped de la reserva.');
        }
        const today = new Date().toISOString().slice(0, 10);
        if (reservation.checkIn > today || reservation.checkOut <= today) {
            throw new HttpError(409, 'El check-in solo se puede registrar durante las fechas de la reserva.');
        }
        const room = await Habitacion.findByPk(reservation.roomId, {
            transaction,
            lock: transaction.LOCK.UPDATE
        });
        if (!room || room.status !== 'disponible') {
            throw new HttpError(409, 'La habitación no está disponible para registrar el check-in.');
        }

        const checkedInAt = new Date();
        await reservation.update({
            status: 'checkin',
            checkedInAt,
            updatedByUserId: req.user.id
        }, { transaction });
        await room.update({ status: 'ocupada', updatedByUserId: req.user.id }, { transaction });
        await transaction.commit();
        res.json(await Reserva.findByPk(reservation.id, {
            include: [
                { model: Habitacion, as: 'habitacion' },
                { model: Plan, as: 'plan' }
            ]
        }));
    } catch (error) {
        if (!transaction.finished) await transaction.rollback();
        throw error;
    }
}));

app.post('/api/reservations/:id/check-out', ...adminOnly, asyncHandler(async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const reservation = await Reserva.findByPk(req.params.id, {
            transaction,
            lock: transaction.LOCK.UPDATE
        });
        if (!reservation) throw new HttpError(404, 'No se encontró la reserva.');
        if (!reservation.checkedInAt || reservation.checkedOutAt || reservation.status !== 'checkin') {
            throw new HttpError(409, 'La reserva no tiene un check-in activo para registrar el check-out.');
        }
        const balance = Number(reservation.balance ?? Number(reservation.total) - Number(reservation.advance || 0));
        if (!Number.isFinite(balance) || balance > 0) {
            throw new HttpError(409, 'No se puede completar el check-out mientras exista saldo pendiente en la habitación.');
        }
        const unpaidOrders = await Pedido.findAll({
            where: {
                userId: reservation.userId,
                roomId: reservation.roomId,
                status: { [Op.ne]: 'cancelado' },
                paymentStatus: { [Op.ne]: 'pagado' },
                total: { [Op.gt]: 0 }
            },
            attributes: ['id', 'orderCode', 'total', 'paymentStatus'],
            transaction,
            lock: transaction.LOCK.UPDATE
        });
        if (unpaidOrders.length) {
            throw new HttpError(409, 'No se puede completar el check-out: hay pedidos del restaurante pendientes de pago.');
        }

        const room = await Habitacion.findByPk(reservation.roomId, {
            transaction,
            lock: transaction.LOCK.UPDATE
        });
        if (!room || room.status !== 'ocupada') {
            throw new HttpError(409, 'El estado de la habitación no permite registrar el check-out.');
        }
        const checkedOutAt = new Date();
        await reservation.update({
            status: 'finalizada',
            checkedOutAt,
            roomCleared: false,
            roomClearedAt: null,
            roomClearedByUserId: null,
            updatedByUserId: req.user.id
        }, { transaction });
        await room.update({ status: 'limpieza', updatedByUserId: req.user.id }, { transaction });
        await transaction.commit();
        res.json(await Reserva.findByPk(reservation.id, {
            include: [
                { model: Habitacion, as: 'habitacion' },
                { model: Plan, as: 'plan' }
            ]
        }));
    } catch (error) {
        if (!transaction.finished) await transaction.rollback();
        throw error;
    }
}));

app.post('/api/reservations/:id/room-cleared', ...adminOnly, asyncHandler(async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const reservation = await Reserva.findByPk(req.params.id, {
            transaction,
            lock: transaction.LOCK.UPDATE
        });
        if (!reservation) throw new HttpError(404, 'No se encontró la reserva.');
        if (reservation.status !== 'finalizada' || !reservation.checkedOutAt) {
            throw new HttpError(409, 'La habitación solo se puede liberar después del check-out.');
        }
        if (reservation.roomCleared) throw new HttpError(409, 'La habitación ya fue marcada como limpia.');
        const room = await Habitacion.findByPk(reservation.roomId, {
            transaction,
            lock: transaction.LOCK.UPDATE
        });
        if (!room || room.status !== 'limpieza') {
            throw new HttpError(409, 'La habitación no está marcada para limpieza.');
        }
        await reservation.update({
            roomCleared: true,
            roomClearedAt: new Date(),
            roomClearedByUserId: req.user.id,
            updatedByUserId: req.user.id
        }, { transaction });
        await room.update({ status: 'disponible', updatedByUserId: req.user.id }, { transaction });
        await transaction.commit();
        res.json(await Reserva.findByPk(reservation.id, {
            include: [{ model: Habitacion, as: 'habitacion' }]
        }));
    } catch (error) {
        if (!transaction.finished) await transaction.rollback();
        throw error;
    }
}));

app.patch('/api/reservations/:id', authenticate, asyncHandler(async (req, res) => {
    const editableFields = ['checkIn', 'checkOut', 'adults', 'children', 'guests', 'specialRequests', 'requests'];
    if (!editableFields.some((field) => Object.hasOwn(req.body, field))) {
        throw new HttpError(400, 'Indica al menos un campo para actualizar.');
    }
    const transaction = await sequelize.transaction();
    try {
        const reservation = await Reserva.findByPk(req.params.id, {
            transaction,
            lock: transaction.LOCK.UPDATE
        });
        if (!reservation) throw new HttpError(404, 'No se encontró la reserva.');
        if (req.user.role !== 'admin' && String(reservation.userId) !== String(req.user.id)) {
            throw new HttpError(404, 'No se encontró la reserva.');
        }
        if (!['proceso', 'confirmada'].includes(reservation.status) || reservation.checkedInAt) {
            throw new HttpError(409, 'Esta reserva ya no se puede modificar.');
        }
        const checkIn = req.body.checkIn ?? reservation.checkIn;
        const checkOut = req.body.checkOut ?? reservation.checkOut;
        if (!isValidDateOnly(checkIn) || !isValidDateOnly(checkOut) || checkOut <= checkIn) {
            throw new HttpError(400, 'Las fechas de la reserva no son válidas.');
        }
        const today = new Date().toISOString().slice(0, 10);
        if (checkIn < today || checkOut <= today) {
            throw new HttpError(400, 'Las fechas modificadas deben ser actuales o futuras.');
        }

        const room = await Habitacion.findByPk(reservation.roomId, { transaction });
        if (!room) throw new HttpError(404, 'No se encontró la habitación de la reserva.');
        let adults = reservation.adults;
        let children = reservation.children;
        if (req.body.guests !== undefined && req.body.adults === undefined && req.body.children === undefined) {
            adults = Number(req.body.guests);
            children = 0;
        } else {
            if (req.body.adults !== undefined) adults = Number(req.body.adults);
            if (req.body.children !== undefined) children = Number(req.body.children);
        }
        if (!Number.isInteger(adults) || adults < 1 || !Number.isInteger(children) || children < 0) {
            throw new HttpError(400, 'La cantidad de adultos y niños no es válida.');
        }
        const guests = adults + children;
        if (guests > room.capacity) {
            throw new HttpError(400, `La habitación admite un máximo de ${room.capacity} huéspedes.`);
        }
        if (checkIn !== reservation.checkIn || checkOut !== reservation.checkOut) {
            const conflict = await Reserva.findOne({
                where: {
                    id: { [Op.ne]: reservation.id },
                    roomId: reservation.roomId,
                    status: { [Op.notIn]: ['cancelada', 'cancelado', 'finalizada'] },
                    checkIn: { [Op.lt]: checkOut },
                    checkOut: { [Op.gt]: checkIn }
                },
                transaction
            });
            if (conflict) throw new HttpError(409, 'La habitación ya está reservada en esas fechas.');
        }

        const nights = getNights(checkIn, checkOut);
        let total = Number(reservation.total);
        if (checkIn !== reservation.checkIn || checkOut !== reservation.checkOut) {
            const plan = reservation.planId ? await Plan.findByPk(reservation.planId, { transaction }) : null;
            if (plan && ((plan.validFrom && checkIn < plan.validFrom) || (plan.validUntil && checkIn > plan.validUntil))) {
                throw new HttpError(400, 'El plan asociado no está disponible para las fechas modificadas.');
            }
            total = reservationTotal(room, plan, nights);
            if (reservation.paymentStatus === 'pagado' && total !== Number(reservation.total)) {
                throw new HttpError(409, 'No se pueden cambiar las fechas de una reserva pagada.');
            }
            if (total < Number(reservation.advance || 0)) {
                throw new HttpError(409, 'El cambio requiere devolver parte del anticipo y no se puede aplicar en línea.');
            }
        }
        const updates = {
            checkIn,
            checkOut,
            adults,
            children,
            guests,
            nights,
            total,
            subtotal: total,
            balance: Math.max(0, total - Number(reservation.advance || 0)),
            updatedByUserId: req.user.id
        };
        if (req.body.specialRequests !== undefined || req.body.requests !== undefined) {
            const requests = req.body.specialRequests ?? req.body.requests;
            if (requests !== null && typeof requests !== 'string') {
                throw new HttpError(400, 'Las solicitudes especiales deben ser texto.');
            }
            updates.specialRequests = requests?.trim() || null;
        }
        await reservation.update(updates, { transaction });
        await transaction.commit();
        res.json(await Reserva.findByPk(reservation.id, {
            include: [
                { model: Habitacion, as: 'habitacion' },
                { model: Plan, as: 'plan' }
            ]
        }));
    } catch (error) {
        if (!transaction.finished) await transaction.rollback();
        throw error;
    }
}));

app.post('/api/me/reservations/:id/cancel', authenticate, asyncHandler(async (req, res) => {
    if (req.body.reason !== undefined && typeof req.body.reason !== 'string') {
        throw new HttpError(400, 'El motivo de cancelación debe ser texto.');
    }
    const transaction = await sequelize.transaction();
    try {
        const reservation = await Reserva.findOne({
            where: { id: req.params.id, userId: req.user.id },
            transaction,
            lock: transaction.LOCK.UPDATE
        });
        if (!reservation) throw new HttpError(404, 'No se encontró la reserva.');
        if (!['proceso', 'confirmada'].includes(reservation.status) || reservation.checkedInAt) {
            throw new HttpError(409, 'Esta reserva ya no se puede cancelar.');
        }
        const room = await Habitacion.findByPk(reservation.roomId, { transaction });
        const deadline = getCancellationDeadline(reservation.checkIn, room?.checkInTime);
        if (Date.now() >= deadline.getTime()) {
            throw new HttpError(409, 'La reserva solo se puede cancelar hasta 24 horas antes del check-in.');
        }
        await reservation.update({
            status: 'cancelada',
            confirmed: false,
            cancellationReason: req.body.reason || 'Cancelada por el huésped.',
            cancelledAt: new Date(),
            updatedByUserId: req.user.id
        }, { transaction });
        const notification = await createUserNotification(req.user.id, {
            type: 'reservation_cancelled',
            title: 'Tu reserva fue cancelada',
            message: `Tu reserva ${reservation.reservationCode} fue cancelada.`,
            data: { route: '/mi-habitacion', reservationId: reservation.id }
        }, transaction);
        await transaction.commit();
        publishNotification(notification);
        res.json(await Reserva.findByPk(reservation.id, {
            include: [
                { model: Habitacion, as: 'habitacion' },
                { model: Plan, as: 'plan' }
            ]
        }));
    } catch (error) {
        if (!transaction.finished) await transaction.rollback();
        throw error;
    }
}));

app.patch('/api/reservations/:id/status', ...adminOnly, asyncHandler(async (req, res) => {
    const { status } = req.body;
    if (!['confirmada', 'cancelada'].includes(status)) {
        throw new HttpError(400, 'El estado de la reserva no es válido.');
    }
    const reservation = await Reserva.findByPk(req.params.id);
    if (!reservation) throw new HttpError(404, 'No se encontró la reserva.');
    const previousStatus = reservation.status;
    if (['cancelada', 'cancelado', 'finalizada'].includes(reservation.status)) {
        throw new HttpError(409, 'La reserva ya no puede cambiar de estado.');
    }
    if (reservation.checkedInAt) {
        throw new HttpError(409, 'No se puede cambiar el estado de una reserva después del check-in formal.');
    }

    if (status === 'confirmada') {
        const conflict = await Reserva.findOne({
            where: {
                id: { [Op.ne]: reservation.id },
                roomId: reservation.roomId,
                status: { [Op.notIn]: ['cancelada', 'cancelado', 'finalizada'] },
                checkIn: { [Op.lt]: reservation.checkOut },
                checkOut: { [Op.gt]: reservation.checkIn }
            }
        });
        if (conflict) throw new HttpError(409, 'La habitación ya tiene otra reserva en esas fechas.');
        await reservation.update({
            status,
            confirmed: true,
            confirmedAt: new Date(),
            confirmedByUserId: req.user.id,
            updatedByUserId: req.user.id
        });
    } else {
        await reservation.update({
            status,
            confirmed: false,
            cancellationReason: req.body.reason || 'Solicitud rechazada por un administrador.',
            cancelledAt: new Date(),
            updatedByUserId: req.user.id
        });
    }
    if (previousStatus !== status) {
        const isConfirmed = status === 'confirmada';
        await createUserNotification(reservation.userId, {
            type: isConfirmed ? 'reservation_confirmed' : 'reservation_cancelled',
            title: isConfirmed ? 'Tu reserva fue confirmada' : 'Tu reserva fue cancelada',
            message: isConfirmed
                ? `Tu reserva ${reservation.reservationCode} está confirmada.`
                : `Tu reserva ${reservation.reservationCode} fue cancelada.`,
            data: { route: '/mi-habitacion', reservationId: reservation.id }
        });
    }

    const updatedReservation = await Reserva.findByPk(reservation.id, {
        include: [
            { model: Usuario, as: 'usuario', attributes: ['id', 'email'], include: [{ model: Huesped, as: 'huesped' }] },
            { model: Habitacion, as: 'habitacion', attributes: ['id', 'number', 'type'] }
        ]
    });
    res.json(updatedReservation);
}));

app.patch('/api/reservations/:id/payment', ...adminOnly, asyncHandler(async (req, res) => {
    const { paymentMethod } = req.body;
    if (!paymentMethods.includes(paymentMethod)) {
        throw new HttpError(400, 'Selecciona un método de pago válido.');
    }
    if (req.body.transactionReference != null && typeof req.body.transactionReference !== 'string') {
        throw new HttpError(400, 'La referencia de pago no es válida.');
    }
    const transactionReference = (req.body.transactionReference || '').trim();
    if (transactionReference.length > 150) throw new HttpError(400, 'La referencia no puede superar 150 caracteres.');
    if (['transferencia', 'pago_movil'].includes(paymentMethod) && !transactionReference) {
        throw new HttpError(400, 'Indica la referencia de la transferencia o Pago Móvil.');
    }
    if (req.body.notes !== undefined && typeof req.body.notes !== 'string') {
        throw new HttpError(400, 'Las notas del pago no son válidas.');
    }

    const transaction = await sequelize.transaction();
    try {
        const reservation = await Reserva.findByPk(req.params.id, {
            transaction,
            lock: transaction.LOCK.UPDATE
        });
        if (!reservation) throw new HttpError(404, 'No se encontró la reserva.');
        if (['cancelada', 'cancelado'].includes(reservation.status)) {
            throw new HttpError(400, 'No se puede registrar el pago de una reserva cancelada.');
        }

        const totalCents = toCents(reservation.total);
        const balanceCents = toCents(reservation.balance ?? Number(reservation.total) - Number(reservation.advance || 0));
        if (!Number.isSafeInteger(totalCents) || !Number.isSafeInteger(balanceCents) || balanceCents < 0) {
            throw new HttpError(409, 'No se pudo determinar el saldo pendiente de la reserva.');
        }
        if (balanceCents === 0) throw new HttpError(409, 'La reserva ya está registrada como pagada.');
        const amount = req.body.amount === undefined ? balanceCents / 100 : Number(req.body.amount);
        const amountCents = toCents(amount);
        if (!Number.isFinite(amount) || !Number.isSafeInteger(amountCents) || amountCents <= 0 || Math.abs(amount * 100 - amountCents) > 0.000001) {
            throw new HttpError(400, 'El abono debe ser mayor que cero y tener máximo dos decimales.');
        }
        if (amountCents > balanceCents) {
            throw new HttpError(400, 'El abono no puede superar el saldo pendiente.');
        }

        const paidAt = new Date();
        const newBalanceCents = balanceCents - amountCents;
        const newAdvanceCents = totalCents - newBalanceCents;
        await reservation.update({
            paymentStatus: newBalanceCents === 0 ? 'pagado' : 'parcial',
            paymentMethod,
            advance: (newAdvanceCents / 100).toFixed(2),
            balance: (newBalanceCents / 100).toFixed(2),
            updatedByUserId: req.user.id
        }, { transaction });
        await Pago.create({
            userId: reservation.userId,
            reservationId: reservation.id,
            amount: (amountCents / 100).toFixed(2),
            currency: 'VES',
            method: paymentMethod,
            status: 'pagado',
            transactionReference: transactionReference || null,
            paidAt,
            notes: req.body.notes?.trim() || null,
            createdByUserId: req.user.id
        }, { transaction });

        await transaction.commit();
        res.json(await Reserva.findByPk(reservation.id, {
            include: [{ model: Habitacion, as: 'habitacion' }]
        }));
    } catch (error) {
        if (!transaction.finished) await transaction.rollback();
        throw error;
    }
}));

app.get('/api/foods', optionalAuthentication, asyncHandler(async (req, res) => {
    const isAdmin = req.user?.role === 'admin';
    const visibleCategories = isAdmin ? [] : await CategoriaComida.findAll({
        where: { isVisible: true },
        attributes: ['id'],
        raw: true
    });
    const where = isAdmin
        ? {}
        : {
            isVisible: true,
            isAvailable: true,
            isSoldOut: false,
            [Op.or]: [
                { categoryId: null },
                { categoryId: { [Op.in]: visibleCategories.map(({ id }) => id) } }
            ]
        };
    const foods = await Comida.findAll({
        where,
        include: [{ model: CategoriaComida, as: 'categoria', attributes: ['id', 'name', 'slug', 'icon', 'sortOrder'] }],
        order: [['sortOrder', 'ASC'], ['name', 'ASC']]
    });
    res.json(foods);
}));

app.get('/api/food-categories', optionalAuthentication, asyncHandler(async (req, res) => {
    const where = req.user?.role === 'admin' ? {} : { isVisible: true };
    res.json(await CategoriaComida.findAll({
        where,
        order: [['sortOrder', 'ASC'], ['name', 'ASC']]
    }));
}));

app.post('/api/food-categories', ...adminOnly, asyncHandler(async (req, res) => {
    const { name } = req.body;
    requireFields(req.body, ['name']);
    if (typeof name !== 'string' || !name.trim()) throw new HttpError(400, 'El nombre de la categoría no es válido.');
    const slug = makeSlug(name);
    if (!slug) throw new HttpError(400, 'El nombre de la categoría no es válido.');
    const sortOrder = req.body.sortOrder === undefined ? 0 : Number(req.body.sortOrder);
    if (!Number.isInteger(sortOrder)) throw new HttpError(400, 'El orden de la categoría no es válido.');
    const transaction = await sequelize.transaction();
    try {
        let category = await CategoriaComida.findOne({
            where: { slug },
            paranoid: false,
            transaction,
            lock: transaction.LOCK.UPDATE
        });
        if (category?.deletedAt) {
            await category.restore({ transaction });
            await category.update({
                name: name.trim(),
                description: req.body.description || null,
                icon: req.body.icon || null,
                sortOrder,
                isVisible: req.body.isVisible === undefined ? true : parseBooleanField(req.body.isVisible, 'isVisible'),
                updatedByUserId: req.user.id
            }, { transaction });
        } else if (category) {
            throw new HttpError(409, 'Ya existe una categoría con ese nombre.');
        } else {
            category = await CategoriaComida.create({
                name: name.trim(),
                slug,
                description: req.body.description || null,
                icon: req.body.icon || null,
                sortOrder,
                isVisible: req.body.isVisible === undefined ? true : parseBooleanField(req.body.isVisible, 'isVisible'),
                createdByUserId: req.user.id
            }, { transaction });
        }
        await transaction.commit();
        res.status(201).json(category);
    } catch (error) {
        if (!transaction.finished) await transaction.rollback();
        throw error;
    }
}));

app.put('/api/food-categories/:id', ...adminOnly, asyncHandler(async (req, res) => {
    const category = await CategoriaComida.findByPk(req.params.id);
    if (!category) throw new HttpError(404, 'No se encontró la categoría.');
    const allowedFields = ['name', 'description', 'icon', 'sortOrder', 'isVisible'];
    const unknownFields = Object.keys(req.body).filter((field) => !allowedFields.includes(field));
    if (unknownFields.length) throw new HttpError(400, `Campos no válidos: ${unknownFields.join(', ')}`);
    const updates = {};
    if (req.body.name !== undefined) {
        if (typeof req.body.name !== 'string' || !req.body.name.trim() || !makeSlug(req.body.name)) {
            throw new HttpError(400, 'El nombre de la categoría no es válido.');
        }
        updates.name = req.body.name.trim();
        updates.slug = makeSlug(req.body.name);
    }
    for (const field of ['description', 'icon']) {
        if (req.body[field] === undefined) continue;
        if (req.body[field] !== null && typeof req.body[field] !== 'string') {
            throw new HttpError(400, `El campo ${field} no es válido.`);
        }
        updates[field] = req.body[field]?.trim() || null;
    }
    if (req.body.sortOrder !== undefined) {
        const sortOrder = Number(req.body.sortOrder);
        if (!Number.isInteger(sortOrder)) throw new HttpError(400, 'El orden de la categoría no es válido.');
        updates.sortOrder = sortOrder;
    }
    if (req.body.isVisible !== undefined) updates.isVisible = parseBooleanField(req.body.isVisible, 'isVisible');
    if (!Object.keys(updates).length) throw new HttpError(400, 'Indica al menos un dato para actualizar.');
    await category.update({ ...updates, updatedByUserId: req.user.id });
    res.json(category);
}));

app.delete('/api/food-categories/:id', ...adminOnly, asyncHandler(async (req, res) => {
    const category = await CategoriaComida.findByPk(req.params.id);
    if (!category) throw new HttpError(404, 'No se encontró la categoría.');
    const transaction = await sequelize.transaction();
    try {
        await Comida.update(
            { categoryId: null, updatedByUserId: req.user.id },
            { where: { categoryId: category.id }, transaction }
        );
        await category.destroy({ transaction });
        await transaction.commit();
        res.status(204).end();
    } catch (error) {
        if (!transaction.finished) await transaction.rollback();
        throw error;
    }
}));

app.post('/api/foods', ...adminOnly, uploadFoodImage, asyncHandler(async (req, res) => {
    const { name, categoryName, price } = req.body;
    requireFields(req.body, ['name', 'categoryName', 'price']);
    if (!Number.isFinite(Number(price)) || Number(price) < 0) throw new HttpError(400, 'El precio debe ser un valor válido.');
    const transaction = await sequelize.transaction();
    try {
        const categorySlug = makeSlug(categoryName);
        if (!categorySlug) throw new HttpError(400, 'El nombre de la categoría no es válido.');
        let category = await CategoriaComida.findOne({
            where: { slug: categorySlug },
            paranoid: false,
            transaction
        });
        if (category?.deletedAt) await category.restore({ transaction });
        if (!category) {
            category = await CategoriaComida.create({
                name: String(categoryName).trim(),
                slug: categorySlug,
                createdByUserId: req.user.id
            }, { transaction });
        }
        const food = await Comida.create({
            name: String(name).trim(),
            slug: `${makeSlug(name)}-${randomBytes(3).toString('hex')}`,
            categoryId: category.id,
            description: req.body.description || null,
            price: Number(price),
            currency: req.body.currency || 'VES',
            imageUrl: req.file ? `/uploads/${req.file.filename}` : null,
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

app.put('/api/foods/:id', ...adminOnly, asyncHandler(async (req, res) => {
    const food = await Comida.findByPk(req.params.id);
    if (!food) throw new HttpError(404, 'No se encontró el producto.');
    const allowedFields = ['name', 'categoryId', 'description', 'price', 'currency', 'ingredients', 'allergens', 'preparationMinutes', 'sortOrder'];
    const unknownFields = Object.keys(req.body).filter((field) => !allowedFields.includes(field));
    if (unknownFields.length) throw new HttpError(400, `Campos no válidos: ${unknownFields.join(', ')}`);

    const updates = {};
    if (req.body.name !== undefined) {
        if (typeof req.body.name !== 'string' || !req.body.name.trim()) throw new HttpError(400, 'El nombre del producto no es válido.');
        updates.name = req.body.name.trim();
        updates.slug = `${makeSlug(req.body.name)}-${randomBytes(3).toString('hex')}`;
    }
    if (req.body.categoryId !== undefined) {
        if (req.body.categoryId === null || req.body.categoryId === '') {
            updates.categoryId = null;
        } else {
            const categoryId = Number(req.body.categoryId);
            if (!Number.isSafeInteger(categoryId) || categoryId < 1) throw new HttpError(400, 'La categoría seleccionada no es válida.');
            const category = await CategoriaComida.findByPk(categoryId);
            if (!category) throw new HttpError(400, 'La categoría seleccionada no está disponible.');
            updates.categoryId = category.id;
        }
    }
    if (req.body.price !== undefined) {
        const price = Number(req.body.price);
        if (!Number.isFinite(price) || price < 0) throw new HttpError(400, 'El precio debe ser un valor válido.');
        updates.price = price;
    }
    if (req.body.preparationMinutes !== undefined) {
        if (req.body.preparationMinutes === null || req.body.preparationMinutes === '') {
            updates.preparationMinutes = null;
        } else {
            const preparationMinutes = Number(req.body.preparationMinutes);
            if (!Number.isInteger(preparationMinutes) || preparationMinutes < 0) {
                throw new HttpError(400, 'El tiempo de preparación debe ser un entero no negativo.');
            }
            updates.preparationMinutes = preparationMinutes;
        }
    }
    if (req.body.sortOrder !== undefined) {
        const sortOrder = Number(req.body.sortOrder);
        if (!Number.isInteger(sortOrder)) throw new HttpError(400, 'El orden del producto no es válido.');
        updates.sortOrder = sortOrder;
    }
    for (const field of ['description', 'currency', 'ingredients', 'allergens']) {
        if (req.body[field] === undefined) continue;
        if (req.body[field] !== null && typeof req.body[field] !== 'string') {
            throw new HttpError(400, `El campo ${field} no es válido.`);
        }
        updates[field] = req.body[field]?.trim() || null;
    }
    if (!Object.keys(updates).length) throw new HttpError(400, 'Indica al menos un dato para actualizar.');
    await food.update({ ...updates, updatedByUserId: req.user.id });
    res.json(await Comida.findByPk(food.id, {
        include: [{ model: CategoriaComida, as: 'categoria', attributes: ['id', 'name', 'slug'] }]
    }));
}));

app.delete('/api/foods/:id', ...adminOnly, asyncHandler(async (req, res) => {
    const food = await Comida.findByPk(req.params.id);
    if (!food) throw new HttpError(404, 'No se encontró el producto.');
    await food.update({ updatedByUserId: req.user.id });
    await food.destroy();
    res.status(204).end();
}));

app.patch('/api/foods/:id/availability', ...adminOnly, asyncHandler(async (req, res) => {
    const food = await Comida.findByPk(req.params.id);
    if (!food) throw new HttpError(404, 'No se encontró el producto.');
    const allowedFields = ['stockQuantity', 'isSoldOut', 'isAvailable'];
    const unknownFields = Object.keys(req.body).filter((field) => !allowedFields.includes(field));
    if (unknownFields.length) throw new HttpError(400, `Campos no válidos: ${unknownFields.join(', ')}`);
    if (!Object.keys(req.body).length) throw new HttpError(400, 'Indica el stock o la disponibilidad que deseas actualizar.');

    const updates = {};
    if (req.body.stockQuantity !== undefined) {
        if (req.body.stockQuantity === null || req.body.stockQuantity === '') {
            updates.stockQuantity = null;
        } else {
            const stockQuantity = Number(req.body.stockQuantity);
            if (!Number.isInteger(stockQuantity) || stockQuantity < 0) throw new HttpError(400, 'El stock debe ser un entero no negativo.');
            updates.stockQuantity = stockQuantity;
        }
    }
    if (req.body.isSoldOut !== undefined) updates.isSoldOut = parseBooleanField(req.body.isSoldOut, 'isSoldOut');
    if (req.body.isAvailable !== undefined) updates.isAvailable = parseBooleanField(req.body.isAvailable, 'isAvailable');
    const resultingStock = Object.prototype.hasOwnProperty.call(updates, 'stockQuantity')
        ? updates.stockQuantity
        : food.stockQuantity;
    if (updates.isAvailable === true && (updates.isSoldOut === true || resultingStock === 0)) {
        throw new HttpError(400, 'No se puede activar un producto agotado o con stock cero.');
    }
    if (updates.stockQuantity === 0) {
        updates.isSoldOut = true;
        updates.isAvailable = false;
    } else if (updates.isSoldOut === false && req.body.isAvailable === undefined) {
        updates.isAvailable = true;
    } else if (updates.isSoldOut === true && req.body.isAvailable === undefined) {
        updates.isAvailable = false;
    }
    if (updates.isAvailable === true && (updates.isSoldOut ?? food.isSoldOut)) {
        throw new HttpError(400, 'No se puede activar un producto marcado como agotado.');
    }
    await food.update({ ...updates, updatedByUserId: req.user.id });
    res.json(food);
}));

app.get('/api/plans', optionalAuthentication, asyncHandler(async (req, res) => {
    const where = req.user?.role === 'admin'
        ? {}
        : {
            isVisible: true,
            isBookable: true,
            [Op.or]: [{ validUntil: null }, { validUntil: { [Op.gte]: new Date().toISOString().slice(0, 10) } }]
        };
    res.json(await Plan.findAll({ where, order: [['sortOrder', 'ASC'], ['name', 'ASC']] }));
}));

app.post('/api/plans', ...adminOnly, uploadFoodImage, asyncHandler(async (req, res) => {
    try {
        const { name } = req.body;
        requireFields(req.body, ['name']);
        if (typeof name !== 'string' || !name.trim()) throw new HttpError(400, 'El nombre del plan no es válido.');
        const price = req.body.price === '' || req.body.price == null ? null : Number(req.body.price);
        if (price !== null && (!Number.isFinite(price) || price < 0)) throw new HttpError(400, 'El precio debe ser un valor válido.');
        const currency = req.body.currency || 'VES';
        if (!/^[A-Z]{3}$/.test(currency)) throw new HttpError(400, 'La moneda debe ser un código de 3 letras mayúsculas.');
        if (req.body.validFrom && !isValidDateOnly(req.body.validFrom)) throw new HttpError(400, 'La fecha de inicio no es válida.');
        if (req.body.validUntil && !isValidDateOnly(req.body.validUntil)) throw new HttpError(400, 'La fecha de fin no es válida.');
        if (req.body.validFrom && req.body.validUntil && req.body.validUntil < req.body.validFrom) {
            throw new HttpError(400, 'La fecha de fin debe ser igual o posterior a la fecha de inicio.');
        }
        const plan = await Plan.create({
            name: String(name).trim(),
            slug: `${makeSlug(name)}-${randomBytes(3).toString('hex')}`,
            summary: req.body.summary || null,
            description: req.body.description || null,
            price,
            currency,
            imageUrl: req.file ? `/uploads/${req.file.filename}` : null,
            services: req.body.services ? String(req.body.services).split(',').map((service) => service.trim()).filter(Boolean) : null,
            terms: req.body.terms || null,
            validFrom: req.body.validFrom || null,
            validUntil: req.body.validUntil || null,
            isVisible: true,
            isBookable: true,
            createdByUserId: req.user.id
        });
        res.status(201).json(plan);
    } catch (error) {
        if (req.file) await cleanupUploadedFiles([req.file]);
        throw error;
    }
}));

app.put('/api/plans/:id', ...adminOnly, uploadFoodImage, asyncHandler(async (req, res) => {
    let updated = false;
    try {
        const plan = await Plan.findByPk(req.params.id);
        if (!plan) throw new HttpError(404, 'No se encontró el plan.');
        const allowedFields = ['name', 'summary', 'description', 'price', 'currency', 'services', 'terms', 'validFrom', 'validUntil', 'isVisible', 'isBookable', 'sortOrder'];
        const unknownFields = Object.keys(req.body).filter((field) => !allowedFields.includes(field));
        if (unknownFields.length) throw new HttpError(400, `Campos no válidos: ${unknownFields.join(', ')}`);

        const updates = {};
        if (req.body.name !== undefined) {
            if (typeof req.body.name !== 'string' || !req.body.name.trim()) throw new HttpError(400, 'El nombre del plan no es válido.');
            updates.name = req.body.name.trim();
            updates.slug = `${makeSlug(req.body.name)}-${randomBytes(3).toString('hex')}`;
        }
        if (req.body.price !== undefined) {
            if (req.body.price === null || req.body.price === '') {
                updates.price = null;
            } else {
                const price = Number(req.body.price);
                if (!Number.isFinite(price) || price < 0) throw new HttpError(400, 'El precio debe ser un valor válido.');
                updates.price = price;
            }
        }
        for (const field of ['validFrom', 'validUntil']) {
            if (req.body[field] === undefined) continue;
            if (req.body[field] === null || req.body[field] === '') updates[field] = null;
            else if (isValidDateOnly(req.body[field])) updates[field] = req.body[field];
            else throw new HttpError(400, `La fecha ${field} no es válida.`);
        }
        const validFrom = updates.validFrom ?? plan.validFrom;
        const validUntil = updates.validUntil ?? plan.validUntil;
        if (validFrom && validUntil && validUntil < validFrom) {
            throw new HttpError(400, 'La fecha de fin debe ser igual o posterior a la fecha de inicio.');
        }
        for (const field of ['summary', 'description', 'currency', 'terms']) {
            if (req.body[field] === undefined) continue;
            if (req.body[field] !== null && typeof req.body[field] !== 'string') {
                throw new HttpError(400, `El campo ${field} no es válido.`);
            }
            if (field === 'currency' && !/^[A-Z]{3}$/.test(req.body[field])) {
                throw new HttpError(400, 'La moneda debe ser un código de 3 letras mayúsculas.');
            }
            updates[field] = req.body[field]?.trim() || null;
        }
        if (req.body.services !== undefined) {
            if (req.body.services === null || req.body.services === '') {
                updates.services = null;
            } else if (Array.isArray(req.body.services) && req.body.services.every((service) => typeof service === 'string')) {
                updates.services = req.body.services.map((service) => service.trim()).filter(Boolean);
            } else if (typeof req.body.services === 'string') {
                updates.services = req.body.services.split(',').map((service) => service.trim()).filter(Boolean);
            } else {
                throw new HttpError(400, 'Los servicios del plan no son válidos.');
            }
        }
        if (req.body.sortOrder !== undefined) {
            const sortOrder = Number(req.body.sortOrder);
            if (!Number.isInteger(sortOrder)) throw new HttpError(400, 'El orden del plan no es válido.');
            updates.sortOrder = sortOrder;
        }
        for (const field of ['isVisible', 'isBookable']) {
            if (req.body[field] !== undefined) updates[field] = parseBooleanField(req.body[field], field);
        }
        if (req.file) updates.imageUrl = `/uploads/${req.file.filename}`;
        if (!Object.keys(updates).length) throw new HttpError(400, 'Indica al menos un dato para actualizar.');

        const oldImage = plan.imageUrl;
        await plan.update({ ...updates, updatedByUserId: req.user.id });
        updated = true;
        if (req.file && oldImage) await deleteUnreferencedUpload(oldImage);
        res.json(plan);
    } catch (error) {
        if (req.file && !updated) await cleanupUploadedFiles([req.file]);
        throw error;
    }
}));

app.delete('/api/plans/:id', ...adminOnly, asyncHandler(async (req, res) => {
    const plan = await Plan.findByPk(req.params.id);
    if (!plan) throw new HttpError(404, 'No se encontró el plan.');
    const imageUrl = plan.imageUrl;
    await plan.update({ isVisible: false, isBookable: false, imageUrl: null, updatedByUserId: req.user.id });
    await plan.destroy();
    if (imageUrl) await deleteUnreferencedUpload(imageUrl);
    res.status(204).end();
}));

app.get('/api/plan-bookings', ...adminOnly, asyncHandler(async (_req, res) => {
    res.json(await ReservaPlan.findAll({
        include: [
            { model: Usuario, as: 'usuario', attributes: ['id', 'email'], include: [{ model: Huesped, as: 'huesped' }] },
            { model: Plan, as: 'plan', paranoid: false }
        ],
        order: [['scheduledFor', 'ASC'], ['createdAt', 'DESC']]
    }));
}));

app.get('/api/me/plan-bookings', authenticate, asyncHandler(async (req, res) => {
    if (req.user.role !== 'guest') throw new HttpError(403, 'Solo los huéspedes pueden consultar sus reservas de experiencias.');
    res.json(await ReservaPlan.findAll({
        where: { userId: req.user.id },
        include: [{ model: Plan, as: 'plan', paranoid: false }],
        order: [['scheduledFor', 'ASC'], ['createdAt', 'DESC']]
    }));
}));

app.post('/api/plan-bookings', authenticate, asyncHandler(async (req, res) => {
    if (req.user.role !== 'guest') throw new HttpError(403, 'Solo los huéspedes pueden reservar experiencias.');
    requireFields(req.body, ['planId', 'scheduledFor']);
    if (!isValidDateOnly(req.body.scheduledFor)) throw new HttpError(400, 'La fecha de la experiencia no es válida.');
    const today = new Date().toISOString().slice(0, 10);
    if (req.body.scheduledFor < today) throw new HttpError(400, 'La fecha de la experiencia no puede estar en el pasado.');
    const planId = Number(req.body.planId);
    if (!Number.isSafeInteger(planId) || planId < 1) throw new HttpError(400, 'El plan seleccionado no es válido.');
    const plan = await Plan.findOne({
        where: { id: planId, isActive: true, isVisible: true, isBookable: true }
    });
    if (!plan) throw new HttpError(404, 'El plan seleccionado no está disponible.');
    if (plan.validFrom && req.body.scheduledFor < plan.validFrom) throw new HttpError(400, 'La fecha seleccionada es anterior a la vigencia del plan.');
    if (plan.validUntil && req.body.scheduledFor > plan.validUntil) throw new HttpError(400, 'La fecha seleccionada está fuera de la vigencia del plan.');
    if (plan.price == null) throw new HttpError(400, 'Este plan requiere consultar el precio con recepción y no se puede reservar en línea.');
    const guests = Number(req.body.guests ?? 1);
    if (!Number.isInteger(guests) || guests < 1 || guests > 30) throw new HttpError(400, 'La cantidad de participantes debe estar entre 1 y 30.');
    if (req.body.notes !== undefined && req.body.notes !== null && typeof req.body.notes !== 'string') {
        throw new HttpError(400, 'Las notas de la reserva no son válidas.');
    }

    const transaction = await sequelize.transaction();
    try {
        const booking = await ReservaPlan.create({
            userId: req.user.id,
            planId: plan.id,
            scheduledFor: req.body.scheduledFor,
            guests,
            unitPrice: plan.price,
            total: Number(plan.price) * guests,
            currency: plan.currency,
            status: 'pendiente',
            notes: req.body.notes?.trim() || null,
            createdByUserId: req.user.id
        }, { transaction });
        const notifications = await createAdminNotifications({
            type: 'new_plan_booking',
            title: 'Nueva solicitud de experiencia',
            message: `Se solicitó el plan ${plan.name} para el ${req.body.scheduledFor}.`,
            data: { route: '/admin/planes', planBookingId: booking.id }
        }, transaction);
        await transaction.commit();
        notifications.forEach(publishNotification);
        res.status(201).json(await ReservaPlan.findByPk(booking.id, {
            include: [{ model: Plan, as: 'plan' }]
        }));
    } catch (error) {
        if (!transaction.finished) await transaction.rollback();
        throw error;
    }
}));

app.patch('/api/plan-bookings/:id/status', ...adminOnly, asyncHandler(async (req, res) => {
    const { status } = req.body;
    if (!['pendiente', 'confirmada', 'cancelada', 'completada'].includes(status)) {
        throw new HttpError(400, 'El estado de la reserva de experiencia no es válido.');
    }
    const booking = await ReservaPlan.findByPk(req.params.id);
    if (!booking) throw new HttpError(404, 'No se encontró la solicitud de experiencia.');
    const allowedTransitions = {
        pendiente: ['confirmada', 'cancelada'],
        confirmada: ['cancelada', 'completada'],
        cancelada: [],
        completada: []
    };
    if (status !== booking.status && !allowedTransitions[booking.status]?.includes(status)) {
        throw new HttpError(409, 'No se puede cambiar la solicitud desde su estado actual.');
    }
    const updates = {
        status,
        confirmedAt: status === 'confirmada' ? booking.confirmedAt || new Date() : booking.confirmedAt,
        cancelledAt: status === 'cancelada' ? new Date() : null,
        cancellationReason: status === 'cancelada'
            ? (typeof req.body.reason === 'string' && req.body.reason.trim() ? req.body.reason.trim() : 'Cancelada por el administrador.')
            : null,
        updatedByUserId: req.user.id
    };
    await booking.update(updates);
    res.json(await ReservaPlan.findByPk(booking.id, {
        include: [
            { model: Usuario, as: 'usuario', attributes: ['id', 'email'], include: [{ model: Huesped, as: 'huesped' }] },
            { model: Plan, as: 'plan', paranoid: false }
        ]
    }));
}));

app.post('/api/me/plan-bookings/:id/cancel', authenticate, asyncHandler(async (req, res) => {
    if (req.user.role !== 'guest') throw new HttpError(403, 'Solo los huéspedes pueden cancelar sus solicitudes.');
    const transaction = await sequelize.transaction();
    try {
        const booking = await ReservaPlan.findOne({
            where: { id: req.params.id, userId: req.user.id },
            transaction,
            lock: transaction.LOCK.UPDATE
        });
        if (!booking) throw new HttpError(404, 'No se encontró la solicitud de experiencia.');
        if (booking.status !== 'pendiente') throw new HttpError(409, 'Solo puedes cancelar solicitudes pendientes.');
        await booking.update({
            status: 'cancelada',
            cancelledAt: new Date(),
            cancellationReason: 'Cancelada por el huésped.',
            updatedByUserId: req.user.id
        }, { transaction });
        await transaction.commit();
        res.json(booking);
    } catch (error) {
        if (!transaction.finished) await transaction.rollback();
        throw error;
    }
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

app.patch('/api/orders/:id/items', ...adminOnly, asyncHandler(async (req, res) => {
    const { items } = req.body;
    if (!Array.isArray(items) || !items.length) throw new HttpError(400, 'Agrega al menos un producto para actualizar el pedido.');

    const order = await Pedido.findByPk(req.params.id, {
        include: [{ model: DetallePedido, as: 'detalles' }]
    });
    if (!order) throw new HttpError(404, 'No se encontró el pedido.');
    if (order.status === 'cancelado') throw new HttpError(400, 'No se pueden agregar productos a un pedido cancelado.');

    const foodIds = [...new Set(items.map((item) => Number(item.id)))];
    const foods = await Comida.findAll({ where: { id: foodIds, isVisible: true, isAvailable: true, isSoldOut: false } });
    const foodsById = new Map(foods.map((food) => [String(food.id), food]));
    if (foods.length !== foodIds.length) throw new HttpError(400, 'Uno o más productos ya no están disponibles.');

    const lines = items.map((item) => {
        const food = foodsById.get(String(item.id));
        const quantity = Number(item.quantity);
        if (!food) throw new HttpError(400, 'Uno o más productos no están disponibles.');
        if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) throw new HttpError(400, 'Cantidad de producto no válida.');
        return { food, quantity, totalPrice: Number(food.price) * quantity };
    });

    const addition = lines.reduce((total, line) => total + line.totalPrice, 0);
    const orderLines = await DetallePedido.bulkCreate(lines.map(({ food, quantity, totalPrice }) => ({
        orderId: order.id,
        foodId: food.id,
        foodName: food.name,
        quantity,
        unitPrice: food.price,
        totalPrice,
        createdByUserId: req.user.id
    })));

    order.subtotal = Number(order.subtotal) + addition;
    order.total = Number(order.total) + addition;
    if (req.body.notes) {
        order.notes = req.body.notes;
    }
    await order.save();

    res.json({
        order: await Pedido.findByPk(order.id, { include: [{ model: DetallePedido, as: 'detalles' }] }),
        addedItems: orderLines.length
    });
}));

app.patch('/api/orders/:id/status', ...adminOnly, asyncHandler(async (req, res) => {
    const { status, reason } = req.body;
    const allowedStatus = ['pendiente', 'preparando', 'preparado', 'en_camino', 'entregado', 'cancelado'];
    if (!allowedStatus.includes(status)) {
        throw new HttpError(400, 'El estado del pedido no es válido.');
    }
    const order = await Pedido.findByPk(req.params.id);
    if (!order) throw new HttpError(404, 'No se encontró el pedido.');
    const previousStatus = order.status;

    const nextData = { status, updatedByUserId: req.user.id };
    if (status === 'cancelado') {
        nextData.cancelledAt = new Date();
        nextData.cancellationReason = reason || 'Cancelado por el administrador.';
    } else {
        nextData.cancelledAt = null;
        nextData.cancellationReason = null;
    }
    if (status === 'entregado') nextData.deliveredAt = new Date();
    if (status === 'preparado') nextData.preparedAt = new Date();

    await order.update(nextData);
    if (previousStatus !== status && ['preparado', 'en_camino'].includes(status)) {
        const isOnTheWay = status === 'en_camino';
        await createUserNotification(order.userId, {
            type: isOnTheWay ? 'order_on_the_way' : 'order_prepared',
            title: isOnTheWay ? 'Tu pedido va en camino' : 'Tu pedido está preparado',
            message: isOnTheWay
                ? `Tu pedido ${order.orderCode} va en camino.`
                : `Tu pedido ${order.orderCode} está preparado.`,
            data: { route: '/pedidos', orderId: order.id }
        });
    }
    res.json(order);
}));

app.patch('/api/orders/:id/payment', ...adminOnly, asyncHandler(async (req, res) => {
    const { paymentStatus, paymentMethod } = req.body;
    if (!['pendiente', 'pagado'].includes(paymentStatus)) {
        throw new HttpError(400, 'El estado de pago no es válido.');
    }
    if (paymentStatus === 'pagado' && !['efectivo', 'tarjeta', 'cargo'].includes(paymentMethod)) {
        throw new HttpError(400, 'Selecciona un método de pago válido.');
    }

    const transaction = await sequelize.transaction();
    try {
        const order = await Pedido.findByPk(req.params.id, {
            transaction,
            lock: transaction.LOCK.UPDATE
        });
        if (!order) throw new HttpError(404, 'No se encontró el pedido.');
        if (order.status === 'cancelado' && paymentStatus === 'pagado') {
            throw new HttpError(400, 'No se puede marcar como pagado un pedido cancelado.');
        }

        const paidAt = paymentStatus === 'pagado' ? order.paidAt || new Date() : null;
        const update = { paymentStatus, updatedByUserId: req.user.id, paidAt };
        if (paymentStatus === 'pagado') update.paymentMethod = paymentMethod;
        await order.update(update, { transaction });

        const existingPayment = await Pago.findOne({
            where: { orderId: order.id },
            transaction,
            lock: transaction.LOCK.UPDATE
        });
        const paymentData = {
            userId: order.userId,
            amount: order.total,
            currency: 'VES',
            method: paymentStatus === 'pagado' ? paymentMethod : order.paymentMethod,
            status: paymentStatus,
            paidAt,
            updatedByUserId: req.user.id
        };
        if (existingPayment) {
            await existingPayment.update(paymentData, { transaction });
        } else {
            await Pago.create({
                ...paymentData,
                orderId: order.id,
                createdByUserId: req.user.id
            }, { transaction });
        }
        await transaction.commit();
        res.json(order);
    } catch (error) {
        if (!transaction.finished) await transaction.rollback();
        throw error;
    }
}));

app.get('/api/me/orders', authenticate, asyncHandler(async (req, res) => {
    res.json(await Pedido.findAll({
        where: { userId: req.user.id },
        include: [{ model: DetallePedido, as: 'detalles' }],
        order: [['requestedAt', 'DESC']]
    }));
}));

app.post('/api/me/orders/:id/cancel', authenticate, asyncHandler(async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const order = await Pedido.findOne({
            where: { id: req.params.id, userId: req.user.id },
            transaction,
            lock: transaction.LOCK.UPDATE
        });
        if (!order) throw new HttpError(404, 'No se encontró el pedido.');
        if (order.status !== 'pendiente') {
            throw new HttpError(409, 'Solo puedes cancelar pedidos que aún están pendientes.');
        }
        if (order.paymentStatus === 'pagado') {
            throw new HttpError(409, 'No se puede cancelar un pedido que ya fue pagado. Contacta con recepción.');
        }
        await order.update({
            status: 'cancelado',
            cancelledAt: new Date(),
            cancellationReason: typeof req.body.reason === 'string' && req.body.reason.trim()
                ? req.body.reason.trim()
                : 'Cancelado por el huésped.',
            updatedByUserId: req.user.id
        }, { transaction });
        await transaction.commit();
        res.json(await Pedido.findByPk(order.id, {
            include: [{ model: DetallePedido, as: 'detalles' }]
        }));
    } catch (error) {
        if (!transaction.finished) await transaction.rollback();
        throw error;
    }
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
    let order;
    let adminNotifications = [];
    try {
        order = await Pedido.create({
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
        adminNotifications = await createAdminNotifications({
            type: 'new_order',
            title: 'Nuevo pedido recibido',
            message: `Se recibió el pedido ${order.orderCode}.`,
            data: { route: '/admin/restaurante', orderId: order.id }
        }, transaction);
        await transaction.commit();
        adminNotifications.forEach(publishNotification);
        res.status(201).json(await Pedido.findByPk(order.id, { include: [{ model: DetallePedido, as: 'detalles' }] }));
    } catch (error) {
        if (!transaction.finished) await transaction.rollback();
        throw error;
    }
}));

app.post('/api/contact', verifyCaptcha('contact'), asyncHandler(async (req, res) => {
    requireFields(req.body, ['name', 'email', 'subject', 'message']);
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

app.use('/api', (_req, res) => res.status(404).json({ error: 'Ruta API no encontrada.' }));

const frontendPublicPath = path.join(__dirname, '../../frontend/public');
const frontendDistPath = path.join(__dirname, '../../frontend/dist');
app.use('/uploads', express.static(uploadDirectory));
app.use(express.static(frontendPublicPath));
app.use(express.static(frontendDistPath));
app.get(/.*/, (_req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
});

app.use((error, _req, res, _next) => {
    if (res.headersSent) return;
    if (error instanceof multer.MulterError) {
        const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
        const message = error.code === 'LIMIT_FILE_SIZE'
            ? 'La imagen no puede superar los 5 MB.'
            : 'No se pudo procesar el archivo de imagen.';
        return res.status(status).json({ error: message });
    }
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
