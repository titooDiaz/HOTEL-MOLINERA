const registerAuth = require('../controllers/authController.js');

module.exports = (app, context) => registerAuth(app, context);
