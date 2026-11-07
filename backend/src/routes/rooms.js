const registerRooms = require('../controllers/roomsController.js');

module.exports = (app, context) => registerRooms(app, context);
