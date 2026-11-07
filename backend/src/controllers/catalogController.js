module.exports = (app, context) => {
    const { randomBytes, Op, sequelize, Usuario, Huesped, CategoriaComida, Comida, Plan, ReservaPlan, cleanupUploadedFiles, uploadFoodImage, HttpError, asyncHandler, requireFields, parseBooleanField, deleteUnreferencedUpload, authenticate, optionalAuthentication, adminOnly, makeSlug, isValidDateOnly, publishNotification, createAdminNotifications } = context;

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

};
