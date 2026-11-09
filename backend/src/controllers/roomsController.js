module.exports = (app, context) => {
    const { Op, Habitacion, Reserva, Pedido, cleanupUploadedFiles, uploadRoomImagesSafely, HttpError, asyncHandler, requireFields, roomAmenityFields, roomEditableFields, parseBooleanField, parseRoomAmenities, getRoomGallery, getRoomImageUrls, managedRoomImageFilename, deleteUnreferencedRoomImages, dateOnlyFromRoom, roomUnavailableForRange, optionalAuthentication, adminOnly, parseDate, isValidDateOnly } = context;

app.get('/api/rooms', optionalAuthentication, asyncHandler(async (req, res) => {
    const isAdmin = req.user?.role === 'admin';
    const catalogMode = req.query.catalog === 'true';
    const adminManagementMode = isAdmin && !catalogMode;
    const requestedCheckIn = req.query.checkIn;
    const requestedCheckOut = req.query.checkOut;
    const hasRequestedRange = isValidDateOnly(requestedCheckIn)
        && isValidDateOnly(requestedCheckOut)
        && requestedCheckOut > requestedCheckIn;
    const where = adminManagementMode
        ? {}
        : {
            isVisible: true,
            isBookable: true,
            ...(!catalogMode && !hasRequestedRange ? { status: 'disponible' } : {})
        };
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
        const availabilityStart = hasRequestedRange ? requestedCheckIn : today;
        const availabilityEnd = hasRequestedRange ? requestedCheckOut : tomorrow;
        const blockedReservations = await Reserva.findAll({
            attributes: ['roomId'],
            where: {
                status: { [Op.notIn]: ['cancelada', 'cancelado', 'finalizada'] },
                checkIn: { [Op.lt]: availabilityEnd },
                checkOut: { [Op.gt]: availabilityStart }
            },
            raw: true
        });
        const reservationsWithRanges = catalogMode
            ? await Reserva.findAll({
                attributes: ['roomId', 'checkIn', 'checkOut'],
                where: {
                    status: { [Op.notIn]: ['cancelada', 'cancelado', 'finalizada'] },
                    checkOut: { [Op.gt]: today }
                },
                order: [['checkIn', 'ASC']],
                raw: true
            })
            : [];
        const blockedRangesByRoom = reservationsWithRanges.reduce((ranges, reservation) => {
            const roomKey = String(reservation.roomId);
            if (!ranges[roomKey]) ranges[roomKey] = [];
            ranges[roomKey].push({
                checkIn: String(reservation.checkIn).slice(0, 10),
                checkOut: String(reservation.checkOut).slice(0, 10)
            });
            return ranges;
        }, {});
        const blockedRoomIds = new Set(blockedReservations.map(({ roomId }) => String(roomId)));
        if (catalogMode) {
            rooms = rooms.map((room) => {
                const isReserved = blockedRoomIds.has(String(room.id));
                const isUnderMaintenance = roomUnavailableForRange(room, availabilityStart, availabilityEnd);
                return {
                    ...room.toJSON(),
                    isReserved,
                    blockedRanges: blockedRangesByRoom[String(room.id)] || [],
                    isAvailable: (hasRequestedRange || room.status === 'disponible')
                        && !isUnderMaintenance
                        && (!hasRequestedRange || !isReserved)
                };
            });
        } else {
            rooms = rooms.filter((room) => !blockedRoomIds.has(String(room.id)) && !roomUnavailableForRange(room, availabilityStart, availabilityEnd));
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
            type: file.mimetype.startsWith('video/') ? 'video' : 'image',
            alt: `Habitación ${fields.number}`
        }));
        const firstImage = gallery.find((item) => item.type === 'image');
        if (!firstImage) throw new HttpError(400, 'La galería debe incluir al menos una imagen.');
        const room = await Habitacion.create({
            ...fields,
            imageUrl: firstImage?.src || null,
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
            type: file.mimetype.startsWith('video/') ? 'video' : 'image',
            alt: `Habitación ${room.number}`
        }));
        const firstImage = gallery.find((item) => item.type === 'image');
        if (!firstImage) throw new HttpError(400, 'La galería debe incluir al menos una imagen.');
        await room.update({ imageUrl: firstImage?.src || null, gallery });
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
    if (!/^[a-f0-9]{32}\.(jpg|png|webp|gif|mp4|webm|ogv|mov)$/.test(filename)) {
        throw new HttpError(400, 'El archivo indicado no es válido.');
    }

    const gallery = getRoomGallery(room);
    if (!gallery.length && room.imageUrl) {
        gallery.push({ src: room.imageUrl, alt: `Habitación ${room.number}` });
    }
    const imageIndex = gallery.findIndex((image) => {
        const src = typeof image === 'string' ? image : image?.src;
        return managedRoomImageFilename(src) === filename;
    });
    if (imageIndex < 0) throw new HttpError(404, 'El archivo no pertenece a esta habitación.');
    const previousImageUrls = getRoomImageUrls(room);
    gallery.splice(imageIndex, 1);
    const firstImage = gallery.find((item) => {
        const src = typeof item === 'string' ? item : item?.src;
        return /\.(jpg|png|webp|gif)$/i.test(src || '');
    });
    const imageUrl = (typeof firstImage === 'string' ? firstImage : firstImage?.src) || null;
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

};
