const registerAuth = require('./auth');
const registerRooms = require('./rooms');
const registerClients = require('./clients');
const registerReservations = require('./reservations');
const registerCatalog = require('./catalog');
const registerOrders = require('./orders');
const registerAdmin = require('./admin');

module.exports = (app, context) => {
    registerAuth(app, context);
    registerRooms(app, context);
    registerClients(app, context);
    registerReservations(app, context);
    registerCatalog(app, context);
    registerOrders(app, context);
    registerAdmin(app, context);
};
