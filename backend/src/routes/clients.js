const registerClients = require('../controllers/clientsController.js');

module.exports = (app, context) => registerClients(app, context);
