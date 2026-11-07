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

    fs.mkdirSync(uploadDirectory, { recursive: true });

    const imageUploadStorage = multer.diskStorage({
        destination: uploadDirectory,
        filename: (_req, file, callback) => callback(null, `${randomBytes(16).toString('hex')}${imageExtensions[file.mimetype]}`)
    });

    const imageFileFilter = (_req, file, callback) => {
        if (!imageExtensions[file.mimetype]) {
            return callback(new HttpError(400, 'La imagen debe ser JPG, PNG, WEBP o GIF.'));
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

    const uploadRoomImages = multer({
        storage: imageUploadStorage,
        limits: { fileSize: 5 * 1024 * 1024, files: 4 },
        fileFilter: imageFileFilter
    }).array('images', 4);

    const uploadRoomImagesSafely = (req, res, next) => {
        uploadRoomImages(req, res, (error) => {
            if (!error) return next();
            cleanupUploadedFiles(req.files).finally(() => next(error));
        });
    };

    const uploadFoodImage = multer({
        storage: imageUploadStorage,
        limits: { fileSize: 5 * 1024 * 1024, files: 1 },
        fileFilter: imageFileFilter
    }).single('image');

    return { uploadDirectory, cleanupUploadedFiles, uploadRoomImagesSafely, uploadFoodImage };
};
