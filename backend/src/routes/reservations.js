const registerReservations = require('../controllers/reservationsController.js');

module.exports = (app, context) => registerReservations(app, context);
