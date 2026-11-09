const express = require('express');
const path = require('path');
const fs = require('fs');
const { randomBytes } = require('crypto');
const { Op } = require('sequelize');
const { models, sequelize } = require('./models');
const { hashPassword, verifyPassword, hashToken, createToken } = require('./services/auth');
const twoFactor = require('./services/twoFactor');
const chatService = require('./services/chat');
const reservationService = require('./services/reservations');
const notificationService = require('./services/notifications');
const { sendContactMessage } = require('./services/mailer');
const { verifyCaptcha } = require('./middlewares/captcha');
const { HttpError, asyncHandler, errorHandler } = require('./middlewares/errors');
const { QueryTypes } = require('sequelize');

const app = express();
const uploadMiddleware = require('./middlewares/uploads')({ HttpError });
const { uploadDirectory, cleanupUploadedFiles, uploadRoomImagesSafely, uploadFoodImage } = uploadMiddleware;
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:0.5b';
const CHAT_SYSTEM_PROMPT = [
    'Eres el asistente virtual de Hotel Molinera.',
    'Responde siempre en español, de forma amable, breve y útil.',
    'Ayuda con habitaciones, reservas, planes, restaurante y contacto.',
    'Cuando pregunten por habitaciones, filtra los datos por capacidad, precio y comodidades solicitadas; menciona por qué cada resultado coincide.',
    'Cuando falte un criterio, pregunta solo lo necesario y no confundas capacidad con número de camas.',
    'Para fechas o disponibilidad concreta, usa la fecha actual y aclara que la confirmación final depende de la reserva.',
    'Para planes, respeta validFrom y validUntil y no recomiendes planes vencidos.',
    'No inventes precios, disponibilidad ni políticas. Si no tienes el dato, indica que deben contactar al hotel por WhatsApp.',
    'No solicites contraseñas, datos bancarios ni claves de acceso.'
].join(' ');

const { Usuario, Huesped, Admin, Habitacion, CategoriaComida, Comida, Plan, ReservaPlan, Reserva, Pedido, DetallePedido, Pago, Notificacion, MensajeContacto, Vista } = models;
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.use(require('cors')());

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
    return /^[a-f0-9]{32}\.(jpg|png|webp|gif|mp4|webm|ogv|mov)$/.test(filename) ? filename : null;
};
const deleteUnreferencedUploads = async (imageUrls) => {
    const filenames = new Set(imageUrls.map(managedRoomImageFilename).filter(Boolean));
    if (!filenames.size) return;
    const [rooms, foods, plans] = await Promise.all([
        Habitacion.findAll({ paranoid: false, attributes: ['imageUrl', 'gallery'] }),
        Comida.findAll({ attributes: ['imageUrl'] }),
        Plan.findAll({ attributes: ['imageUrl'] })
    ]);
    const referencedUrls = [
        ...rooms.flatMap(getRoomImageUrls),
        ...foods.map((food) => food.imageUrl),
        ...plans.map((plan) => plan.imageUrl)
    ];
    const referencedFilenames = new Set(referencedUrls.map(managedRoomImageFilename).filter(Boolean));
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
const deleteUnreferencedRoomImages = deleteUnreferencedUploads;
const deleteUnreferencedUpload = async (imageUrl) => deleteUnreferencedUploads([imageUrl]);
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
const authentication = require('./middlewares/auth')({ asyncHandler, HttpError, Usuario, hashToken, userIncludes });
const { authenticate, optionalAuthentication, requireAdmin, adminOnly } = authentication;
const makeCode = (prefix) => `${prefix}-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString('hex').toUpperCase()}`;
const makeSlug = (value) => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

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

const routeContext = {
    express,
    path,
    fs,
    randomBytes,
    Op,
    QueryTypes,
    models,
    sequelize,
    hashPassword,
    verifyPassword,
    hashToken,
    createToken,
    twoFactor,
    verifyCaptcha,
    OLLAMA_URL,
    OLLAMA_MODEL,
    CHAT_SYSTEM_PROMPT,
    ...chatService,
    ...reservationService,
    ...notificationService,
    sendContactMessage,
    Usuario,
    Huesped,
    Admin,
    Habitacion,
    CategoriaComida,
    Comida,
    Plan,
    ReservaPlan,
    Reserva,
    Pedido,
    DetallePedido,
    Pago,
    Notificacion,
    MensajeContacto,
    Vista,
    uploadDirectory,
    cleanupUploadedFiles,
    uploadRoomImagesSafely,
    uploadFoodImage,
    HttpError,
    asyncHandler,
    requireFields,
    roomAmenityFields,
    roomEditableFields,
    parseBooleanField,
    parseRoomAmenities,
    getRoomGallery,
    getRoomImageUrls,
    managedRoomImageFilename,
    deleteUnreferencedRoomImages,
    deleteUnreferencedUpload,
    dateOnlyFromRoom,
    roomUnavailableForRange,
    safeUser,
    userIncludes,
    authenticate,
    optionalAuthentication,
    requireAdmin,
    adminOnly,
    makeCode,
    makeSlug,
    completeLogin,
    audit
};

require('./routes')(app, routeContext);

app.use('/api', (_req, res) => res.status(404).json({ error: 'Ruta API no encontrada.' }));

const frontendPublicPath = path.join(__dirname, '../../frontend/public');
const frontendDistPath = path.join(__dirname, '../../frontend/dist');
const tourismPublicPath = path.join(__dirname, '../public/tourism');
app.use('/uploads', express.static(uploadDirectory));
app.use('/tourism', express.static(tourismPublicPath));
app.use(express.static(frontendPublicPath));
app.use(express.static(frontendDistPath));
app.get(/.*/, (_req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
});

app.use(errorHandler);

module.exports = app;
