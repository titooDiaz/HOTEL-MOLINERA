module.exports = (app, context) => {
    const { Op, sequelize, Usuario, Huesped, Habitacion, Comida, Reserva, Pedido, DetallePedido, Pago, HttpError, asyncHandler, requireFields, authenticate, adminOnly, makeCode, publishNotification, createUserNotification, createAdminNotifications } = context;

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

};
