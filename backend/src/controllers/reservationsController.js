module.exports = (app, context) => {
    const { Op, sequelize, Usuario, Huesped, Habitacion, Plan, Reserva, Pedido, DetallePedido, Pago, Notificacion, HttpError, asyncHandler, requireFields, roomUnavailableForRange, authenticate, adminOnly, makeCode, parseDate, isValidDateOnly, getNights, reservationTotal, paymentMethods, toCents, formatStatementAmount, pdfToBuffer, writeStatementRow, getCancellationDeadline, notificationStreams, publishNotification, createUserNotification, createAdminNotifications, closeNotificationStream } = context;

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
        const todayParts = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'America/Caracas',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).formatToParts(new Date());
        const todayValues = Object.fromEntries(todayParts.map(({ type, value }) => [type, value]));
        const today = `${todayValues.year}-${todayValues.month}-${todayValues.day}`;
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

};
