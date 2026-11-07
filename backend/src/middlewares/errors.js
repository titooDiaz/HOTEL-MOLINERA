const multer = require('multer');

class HttpError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

const asyncHandler = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

const errorHandler = (error, _req, res, _next) => {
    if (res.headersSent) return;
    if (error instanceof multer.MulterError) {
        const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
        const message = error.code === 'LIMIT_FILE_SIZE'
            ? 'La imagen no puede superar los 5 MB.'
            : 'No se pudo procesar el archivo de imagen.';
        return res.status(status).json({ error: message });
    }
    if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ error: 'Ya existe un registro con esos datos.' });
    }
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeForeignKeyConstraintError') {
        return res.status(400).json({ error: error.errors?.[0]?.message || 'Los datos enviados no son válidos.' });
    }
    const status = error.status || 500;
    if (status >= 500) console.error('API error:', error);
    res.status(status).json({ error: status === 500 ? 'Ocurrió un error interno.' : error.message });
};

module.exports = { HttpError, asyncHandler, errorHandler };
