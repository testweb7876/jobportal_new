const Notification = require('../models/Notification.model');
const { asyncHandler, sendSuccess, sendPaginated } = require('../utils/AppError');
const notificationService = require('../services/notification.service');

exports.getNotifications = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  const filter = { recipientId: req.user._id, isDeleted: false };
  if (req.query.unread === 'true') filter.isRead = false;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Notification.countDocuments(filter),
    notificationService.getUnreadCount(req.user._id),
  ]);

  sendPaginated(res, notifications, total, page, limit, 'Notifications fetched');
});

exports.markRead = asyncHandler(async (req, res) => {
  await notificationService.markRead(req.params.id, req.user._id);
  sendSuccess(res, {}, 'Notification marked as read');
});

exports.markAllRead = asyncHandler(async (req, res) => {
  await notificationService.markAllRead(req.user._id);
  sendSuccess(res, {}, 'All notifications marked as read');
});

exports.deleteNotification = asyncHandler(async (req, res) => {
  await Notification.findOneAndUpdate(
    { _id: req.params.id, recipientId: req.user._id },
    { isDeleted: true, deletedAt: new Date() }
  );
  sendSuccess(res, {}, 'Notification deleted');
});

exports.getUnreadCount = asyncHandler(async (req, res) => {
  const count = await notificationService.getUnreadCount(req.user._id);
  sendSuccess(res, { count }, 'Unread count');
});
