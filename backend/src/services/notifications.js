const { models } = require('../models');
const { Usuario, Notificacion } = models;

const notificationStreams = new Map();

const publishNotification = (notification) => {
    const listeners = notificationStreams.get(String(notification.userId));
    if (!listeners) return;
    const event = `event: notification\ndata: ${JSON.stringify(notification.toJSON ? notification.toJSON() : notification)}\n\n`;
    for (const response of listeners) response.write(event);
};

const createUserNotification = async (userId, details, transaction) => {
    const notification = await Notificacion.create({ userId, ...details }, { transaction });
    if (!transaction) publishNotification(notification);
    return notification;
};

const createAdminNotifications = async (details, transaction) => {
    const admins = await Usuario.findAll({
        where: { role: 'admin', isActive: true },
        attributes: ['id'],
        transaction
    });
    if (!admins.length) return [];
    const notifications = await Notificacion.bulkCreate(
        admins.map((admin) => ({ userId: admin.id, ...details })),
        { transaction }
    );
    if (!transaction) notifications.forEach(publishNotification);
    return notifications;
};

const closeNotificationStream = (userId, response, heartbeat) => {
    clearInterval(heartbeat);
    const listeners = notificationStreams.get(userId);
    listeners?.delete(response);
    if (listeners?.size === 0) notificationStreams.delete(userId);
};

module.exports = {
    notificationStreams,
    publishNotification,
    createUserNotification,
    createAdminNotifications,
    closeNotificationStream
};
