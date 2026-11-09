const { createHash, randomBytes } = require('crypto');

const COOKIE_NAME = 'hm_viewer';
const COOKIE_MAX_AGE_SECONDS = 30 * 60;
const readCookie = (header, name) => {
    const value = header?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
    if (!value) return null;
    try {
        return decodeURIComponent(value.slice(name.length + 1));
    } catch {
        return null;
    }
};

const hashVisitor = (value) => createHash('sha256').update(value).digest('hex');
const normalizePath = (value) => {
    const path = typeof value === 'string' && value.startsWith('/') ? value : '/';
    return path.slice(0, 255);
};

module.exports = (app, context) => {
    const { sequelize, Vista, QueryTypes, asyncHandler, adminOnly } = context;

    app.post('/api/analytics/visit', asyncHandler(async (req, res) => {
        const existingCookie = readCookie(req.get('cookie'), COOKIE_NAME);
        const visitorId = existingCookie || randomBytes(24).toString('hex');

        if (!existingCookie) {
            const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
            res.setHeader(
                'Set-Cookie',
                `${COOKIE_NAME}=${encodeURIComponent(visitorId)}; Max-Age=${COOKIE_MAX_AGE_SECONDS}; Path=/; HttpOnly; SameSite=Lax${secure}`
            );
        }

        if (!existingCookie) {
            await Vista.create({
                visitorHash: hashVisitor(visitorId),
                path: normalizePath(req.body?.path),
                ipAddress: req.ip,
                userAgent: req.get('user-agent')?.slice(0, 500) || null
            });
        }

        res.status(204).end();
    }));

    app.get('/api/admin/analytics/views', ...adminOnly, asyncHandler(async (req, res) => {
        const requestedPeriod = Number.parseInt(req.query.period, 10);
        const periodDays = [7, 30].includes(requestedPeriod) ? requestedPeriod : 7;
        const [summaryRows, groupedRows] = await Promise.all([
            sequelize.query(
                `SELECT COUNT(*) AS totalViews, COUNT(DISTINCT visitorHash) AS uniqueVisitors
                 FROM vistas_sitio
                 WHERE viewedAt >= DATE_SUB(NOW(), INTERVAL ${periodDays} DAY)`,
                { type: QueryTypes.SELECT }
            ),
            sequelize.query(
                `SELECT DATE_FORMAT(viewedAt, '%Y-%m-%d %H:00:00') AS hour, COUNT(*) AS views
                 FROM vistas_sitio
                 WHERE viewedAt >= DATE_SUB(NOW(), INTERVAL ${periodDays} DAY)
                 GROUP BY DATE_FORMAT(viewedAt, '%Y-%m-%d %H:00:00')
                 ORDER BY hour ASC`,
                { type: QueryTypes.SELECT }
            )
        ]);

        const grouped = new Map(groupedRows.map((row) => [row.hour, Number(row.views)]));
        const now = new Date();
        const start = new Date(now);
        start.setMinutes(0, 0, 0);
        start.setHours(start.getHours() - (periodDays * 24 - 1));
        const series = Array.from({ length: periodDays * 24 }, (_, index) => {
            const point = new Date(start);
            point.setHours(start.getHours() + index);
            const key = `${point.getFullYear()}-${String(point.getMonth() + 1).padStart(2, '0')}-${String(point.getDate()).padStart(2, '0')} ${String(point.getHours()).padStart(2, '0')}:00:00`;
            return {
                hour: point.toISOString(),
                views: grouped.get(key) || 0
            };
        });
        const peak = series.reduce((best, point) => point.views > best.views ? point : best, { views: 0 });

        res.json({
            periodDays,
            totalViews: Number(summaryRows[0]?.totalViews || 0),
            uniqueVisitors: Number(summaryRows[0]?.uniqueVisitors || 0),
            peak: peak.views ? { hour: peak.hour, views: peak.views } : null,
            series
        });
    }));
};
