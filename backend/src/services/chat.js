const { models } = require('../models');
const { Op } = require('sequelize');

const { Habitacion, Plan, Comida, Reserva, Pedido, DetallePedido } = models;

const buildChatContext = async (user) => {
    const today = new Date().toISOString().slice(0, 10);
    const [rooms, plans, foods, activeReservations] = await Promise.all([
        Habitacion.findAll({
            where: { isVisible: true, isBookable: true, status: 'disponible' },
            attributes: [
                'number', 'floor', 'type', 'capacity', 'area', 'beds', 'bedType',
                'pricePerNight', 'description', 'airConditioning', 'cableTv',
                'safe', 'workstation', 'wifi', 'minibar', 'privateBathroom',
                'balcony', 'smokeFree', 'checkInTime', 'checkOutTime'
            ],
            order: [['number', 'ASC']]
        }),
        Plan.findAll({
            where: {
                isVisible: true,
                isBookable: true,
                [Op.and]: [
                    { [Op.or]: [{ validFrom: null }, { validFrom: { [Op.lte]: today } }] },
                    { [Op.or]: [{ validUntil: null }, { validUntil: { [Op.gte]: today } }] }
                ],
            },
            attributes: ['name', 'summary', 'description', 'price', 'currency', 'services', 'terms', 'validFrom', 'validUntil'],
            order: [['sortOrder', 'ASC']]
        }),
        Comida.findAll({
            where: { isVisible: true, isAvailable: true, isSoldOut: false },
            attributes: ['name', 'description', 'price', 'currency', 'ingredients', 'allergens'],
            order: [['sortOrder', 'ASC']]
        }),
        Reserva.findAll({
            attributes: ['roomId'],
            where: {
                checkIn: { [Op.lte]: today },
                checkOut: { [Op.gt]: today },
                status: { [Op.notIn]: ['cancelada', 'cancelado', 'finalizada'] }
            },
            raw: true
        }),
    ]);

    const occupiedRoomIds = new Set(activeReservations.map(({ roomId }) => String(roomId)));
    const availableRooms = rooms.filter((room) => !occupiedRoomIds.has(String(room.id)));
    const context = {
        fecha: today,
        reglasDeConsulta: [
            'Filtra habitaciones usando capacidad, precio, tipo, piso, camas y comodidades booleanas.',
            'Para una comodidad, solo cuenta una habitación si su campo es true.',
            'Si el usuario pide varias comodidades, deben cumplirse todas.',
            'No presentes habitaciones ni planes que no aparezcan en estos datos.',
            'Si no hay coincidencias, dilo claramente y ofrece relajar un criterio.',
            'Los precios están expresados en la moneda indicada por cada registro.',
            'La disponibilidad corresponde al catálogo activo; confirma fechas concretas antes de prometer una reserva.'
        ],
        habitacionesDisponibles: availableRooms.map((room) => {
            const data = room.toJSON();
            return {
                ...data,
                comodidades: [
                    data.airConditioning && 'aire acondicionado',
                    data.cableTv && 'TV por cable',
                    data.safe && 'caja de seguridad',
                    data.workstation && 'estación de trabajo',
                    data.wifi && 'Wi-Fi',
                    data.minibar && 'mini bar',
                    data.privateBathroom && 'baño privado',
                    data.balcony && 'balcón',
                    data.smokeFree && 'no fumadores'
                ].filter(Boolean)
            };
        }),
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
