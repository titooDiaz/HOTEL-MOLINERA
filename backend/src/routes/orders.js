const registerOrders = require('../controllers/ordersController.js');

module.exports = (app, context) => registerOrders(app, context);
