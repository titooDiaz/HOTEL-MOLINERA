module.exports = ({ asyncHandler, HttpError, Usuario, hashToken, userIncludes }) => {
    const authenticate = asyncHandler(async (req, _res, next) => {
        const token = req.get('authorization')?.replace(/^Bearer\s+/i, '');
        if (!token) throw new HttpError(401, 'Inicia sesión para continuar.');
        const user = await Usuario.findOne({
            where: { rememberTokenHash: hashToken(token), isActive: true },
            include: userIncludes
        });
        if (!user) throw new HttpError(401, 'La sesión expiró. Inicia sesión nuevamente.');
        req.user = user;
        next();
    });

    const optionalAuthentication = asyncHandler(async (req, _res, next) => {
        const token = req.get('authorization')?.replace(/^Bearer\s+/i, '');
        if (token) {
            req.user = await Usuario.findOne({
                where: { rememberTokenHash: hashToken(token), isActive: true },
                include: userIncludes
            });
        }
        next();
    });

    const requireAdmin = (req, _res, next) => {
        if (req.user?.role !== 'admin') return next(new HttpError(403, 'Se requieren permisos de administrador.'));
        next();
    };

    return {
        authenticate,
        optionalAuthentication,
        requireAdmin,
        adminOnly: [authenticate, requireAdmin]
    };
};
