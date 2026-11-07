const { models } = require('../models');

const { Habitacion, Plan, Comida, Reserva, Pedido, DetallePedido } = models;

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

module.exports = { buildChatContext };
