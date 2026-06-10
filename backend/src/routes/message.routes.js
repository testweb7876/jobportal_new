const express = require('express');
const router = express.Router();
const msgController = require('../controllers/message.controller');
const { protect } = require('../middleware/auth.middleware');
const { uploadMultiple } = require('../services/cloudinary.service');

router.get('/conversations',                      protect, msgController.getConversations);
router.post('/conversations',                     protect, msgController.getOrCreateConversation);
router.get('/conversations/:conversationId',      protect, msgController.getMessages);
router.post('/conversations/:conversationId',     protect, uploadMultiple.array('attachments', 5), msgController.sendMessage);
router.delete('/:messageId',                      protect, msgController.deleteMessage);

module.exports = router;
