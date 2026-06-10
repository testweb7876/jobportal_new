// ── NOTIFICATION SERVICE ──────────────────────────────────────────────────────
const Notification = require('../models/Notification.model');
const logger = require('../config/logger');

class NotificationService {
  async create(data) {
    try {
      const notification = await Notification.create(data);

      // Emit via Socket.io
      try {
        const { getIO } = require('../sockets');
        const io = getIO();
        if (io) {
          io.to(`user:${data.recipientId}`).emit('notification', notification);
        }
      } catch { /* socket not ready */ }

      // Queue email if needed
      if (data.channels?.email) {
        try {
          const { notificationQueue } = require('../queues');
          await notificationQueue.add('send-email-notification', { notificationId: notification._id });
        } catch { /* queue not ready */ }
      }

      return notification;
    } catch (error) {
      logger.error('Notification create error:', error);
    }
  }

  async markRead(notificationId, userId) {
    return Notification.findOneAndUpdate(
      { _id: notificationId, recipientId: userId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );
  }

  async markAllRead(userId) {
    return Notification.updateMany(
      { recipientId: userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );
  }

  async getUnreadCount(userId) {
    return Notification.countDocuments({ recipientId: userId, isRead: false, isDeleted: false });
  }
}

module.exports = new NotificationService();
