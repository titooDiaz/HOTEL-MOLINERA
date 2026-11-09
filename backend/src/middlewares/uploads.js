const fs = require('fs');
const path = require('path');
const { randomBytes } = require('crypto');
const multer = require('multer');

module.exports = ({ HttpError }) => {
    const uploadDirectory = path.join(__dirname, '../../uploads');
    const imageExtensions = {
        'image/jpeg': '.jpg',
        'image/png': '.png',
        'image/webp': '.webp',
        'image/gif': '.gif'
    };
    const mediaExtensions = {
        ...imageExtensions,
        'video/mp4': '.mp4',
        'video/webm': '.webm',
        'video/ogg': '.ogv',
        'video/quicktime': '.mov'
    };

    fs.mkdirSync(uploadDirectory, { recursive: true });

    const mediaUploadStorage = multer.diskStorage({
        destination: uploadDirectory,
        filename: (_req, file, callback) => callback(null, `${randomBytes(16).toString('hex')}${mediaExtensions[file.mimetype]}`)
    });

    const mediaFileFilter = (_req, file, callback) => {
        if (!mediaExtensions[file.mimetype]) {
            return callback(new HttpError(400, 'El archivo debe ser una imagen JPG, PNG, WEBP o GIF, o un video MP4, WEBM, OGG o MOV.'));
        }
        callback(null, true);
    };

    const cleanupUploadedFiles = async (files = []) => {
        await Promise.all(files.map(async (file) => {
            try {
                await fs.promises.unlink(file.path);
            } catch (error) {
                if (error.code !== 'ENOENT') console.error(`No se pudo limpiar la imagen subida ${file.filename}:`, error);
            }
        }));
    };

    const uploadRoomMedia = multer({
        storage: mediaUploadStorage,
        limits: { fileSize: 50 * 1024 * 1024, files: 8 },
        fileFilter: mediaFileFilter
    }).array('images', 8);

    const uploadFoodImage = multer({
        storage: mediaUploadStorage,
        limits: { fileSize: 5 * 1024 * 1024, files: 1 },
        fileFilter: (_req, file, callback) => {
            if (!imageExtensions[file.mimetype]) {
                return callback(new HttpError(400, 'La imagen debe ser JPG, PNG, WEBP o GIF.'));
            }
            callback(null, true);
        }
    }).single('image');

    const uploadRoomImagesSafely = (req, res, next) => {
        uploadRoomMedia(req, res, (error) => {
            if (!error) return next();
            cleanupUploadedFiles(req.files).finally(() => next(error));
        });
    };

    return { uploadDirectory, cleanupUploadedFiles, uploadRoomImagesSafely, uploadFoodImage };
};
