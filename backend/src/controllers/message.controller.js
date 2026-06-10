const { Message, Conversation } = require('../models/Message.model');
const { AppError, asyncHandler, sendSuccess, sendPaginated } = require('../utils/AppError');
const { uploadToCloudinary } = require('../services/cloudinary.service');
const notificationService = require('../services/notification.service');

// ─── GET CONVERSATIONS ────────────────────────────────────────────────────────
exports.getConversations = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  const [conversations, total] = await Promise.all([
    Conversation.find({ participants: req.user._id, isDeleted: false })
      .populate('participants', 'firstName lastName avatar role')
      .populate('jobId', 'title slug')
      .populate('lastMessage', 'message createdAt sendBy isRead')
      .sort({ lastMessageAt: -1 })
      .skip((page - 1) * limit).limit(limit).lean(),
    Conversation.countDocuments({ participants: req.user._id, isDeleted: false }),
  ]);

  sendPaginated(res, conversations, total, page, limit);
});

// ─── GET OR CREATE CONVERSATION ───────────────────────────────────────────────
exports.getOrCreateConversation = asyncHandler(async (req, res, next) => {
  const { recipientId, jobId } = req.body;

  if (recipientId === req.user._id.toString()) {
    return next(new AppError('Cannot message yourself.', 400));
  }

  // Find existing conversation
  let conversation = await Conversation.findOne({
    participants: { $all: [req.user._id, recipientId] },
    ...(jobId ? { jobId } : {}),
  }).populate('participants', 'firstName lastName avatar role');

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [req.user._id, recipientId],
      jobId: jobId || null,
    });
    await conversation.populate('participants', 'firstName lastName avatar role');
  }

  sendSuccess(res, { conversation }, 'Conversation ready');
});

// ─── GET MESSAGES IN CONVERSATION ────────────────────────────────────────────
exports.getMessages = asyncHandler(async (req, res, next) => {
  const conversation = await Conversation.findOne({
    _id: req.params.conversationId,
    participants: req.user._id,
  });
  if (!conversation) return next(new AppError('Conversation not found.', 404));

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 30;

  const [messages, total] = await Promise.all([
    Message.find({ conversationId: req.params.conversationId, isDeleted: false, deletedFor: { $ne: req.user._id } })
      .populate('sendBy', 'firstName lastName avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit).limit(limit).lean(),
    Message.countDocuments({ conversationId: req.params.conversationId, isDeleted: false }),
  ]);

  // Mark unread messages as read
  await Message.updateMany(
    { conversationId: req.params.conversationId, sendBy: { $ne: req.user._id }, isRead: false },
    { isRead: true, readAt: new Date(), $addToSet: { readBy: req.user._id } }
  );

  sendPaginated(res, messages.reverse(), total, page, limit);
});

// ─── SEND MESSAGE ─────────────────────────────────────────────────────────────
exports.sendMessage = asyncHandler(async (req, res, next) => {
  const conversation = await Conversation.findOne({
    _id: req.params.conversationId,
    participants: req.user._id,
  });
  if (!conversation) return next(new AppError('Conversation not found.', 404));

  // Upload attachments
  let attachments = [];
  if (req.files?.length) {
    attachments = await Promise.all(req.files.map((f) => uploadToCloudinary(f, 'message')));
  }

  const message = await Message.create({
    conversationId: conversation._id,
    sendBy: req.user._id,
    message: req.body.message,
    attachments,
    replyToId: req.body.replyToId || null,
  });

  await message.populate('sendBy', 'firstName lastName avatar');

  // Update conversation
  await Conversation.findByIdAndUpdate(conversation._id, {
    lastMessage: message._id,
    lastMessageAt: new Date(),
    lastMessageText: req.body.message?.substring(0, 100),
  });

  // Emit via Socket
  try {
    const { getIO } = require('../sockets');
    const io = getIO();
    if (io) {
      conversation.participants.forEach((participantId) => {
        if (participantId.toString() !== req.user._id.toString()) {
          io.to(`user:${participantId}`).emit('new_message', {
            conversationId: conversation._id,
            message,
          });
        }
      });
    }
  } catch { /* socket not ready */ }

  // Notify other participants
  const recipients = conversation.participants.filter((p) => p.toString() !== req.user._id.toString());
  for (const recipientId of recipients) {
    await notificationService.create({
      recipientId,
      senderId: req.user._id,
      type: 'message_received',
      title: 'New Message',
      message: req.body.message?.substring(0, 100) || 'You have a new message',
      refModel: 'Message',
      refId: message._id,
      channels: { inApp: true },
    });
  }

  sendSuccess(res, { message }, 'Message sent', 201);
});

// ─── DELETE MESSAGE ───────────────────────────────────────────────────────────
exports.deleteMessage = asyncHandler(async (req, res, next) => {
  const msg = await Message.findOne({ _id: req.params.messageId, sendBy: req.user._id });
  if (!msg) return next(new AppError('Message not found.', 404));

  const { deleteForEveryone } = req.body;

  if (deleteForEveryone) {
    await Message.findByIdAndUpdate(msg._id, { isDeleted: true, deletedAt: new Date() });
  } else {
    await Message.findByIdAndUpdate(msg._id, { $addToSet: { deletedFor: req.user._id } });
  }

  sendSuccess(res, {}, 'Message deleted');
});
