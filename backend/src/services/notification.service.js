const Notification = require('../models/Notification.model');
const logger = require('../config/logger');

class NotificationService {
  async create(data) {
    try {
      const notification = await Notification.create(data);
      try {
        const { getIO } = require('../sockets');
        const io = getIO();
        if (io) io.to(`user:${data.recipientId}`).emit('notification', notification);
      } catch { /* socket not ready */ }

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

  // ── NEW: notify every active admin/superadmin, in-app only (email handled separately/explicitly) ──
  async notifyAdmins({ type, title, message, refModel, refId }) {
    try {
      const User = require('../models/User.model');
      const admins = await User.find({ role: { $in: ['admin', 'superadmin'] }, status: 'active' })
        .select('_id').lean();

      await Promise.all(admins.map((a) => this.create({
        recipientId: a._id,
        type,
        title,
        message,
        refModel,
        refId,
      })));
      return admins.length;
    } catch (error) {
      logger.error('notifyAdmins error:', error);
      return 0;
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
    return Notification.updateMany({ recipientId: userId, isRead: false }, { isRead: true, readAt: new Date() });
  }

  async getUnreadCount(userId) {
    return Notification.countDocuments({ recipientId: userId, isRead: false, isDeleted: false });
  }
}

module.exports = new NotificationService();