const express = require('express');
const router = express.Router();
const notifController = require('../controllers/notification.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/',                  protect, notifController.getNotifications);
router.get('/unread-count',      protect, notifController.getUnreadCount);
router.patch('/read-all',        protect, notifController.markAllRead);
router.patch('/:id/read',        protect, notifController.markRead);
router.delete('/:id',            protect, notifController.deleteNotification);

module.exports = router;
