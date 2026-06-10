const mongoose = require('mongoose');

// ─── CONVERSATION ────────────────────────────────────────────────────────────
const conversationSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  jobId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
  resumeId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Resume' },
  employerId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  jobseekerId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  lastMessage:    { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  lastMessageAt:  Date,
  lastMessageText: String,

  unreadCount: {
    type: Map,
    of: Number,
    default: {},
  },

  isDeleted: { type: Boolean, default: false },
  deletedAt: Date,
}, { timestamps: true });

conversationSchema.index({ participants: 1 });
conversationSchema.index({ employerId: 1, jobseekerId: 1 });
conversationSchema.index({ lastMessageAt: -1 });

// ─── MESSAGE ─────────────────────────────────────────────────────────────────
const messageSchema = new mongoose.Schema({
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
  sendBy:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  employerId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  jobseekerId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  jobId:          { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
  resumeId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Resume' },
  replyToId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },

  subject: String,
  message: { type: String, required: true },

  // ── Attachments ───────────────────────────────────────────────
  attachments: [{
    publicId:     String,
    secureUrl:    String,
    filename:     String,
    fileType:     String,
    fileSize:     Number,
    resourceType: String,
  }],

  // ── Read Receipts ─────────────────────────────────────────────
  isRead:    { type: Boolean, default: false },
  readBy:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  readAt:    Date,

  // ── State ─────────────────────────────────────────────────────
  isConflict:    { type: Boolean, default: false },
  conflictValue: String,
  status:        { type: Boolean, default: true },

  // ── Soft Delete ───────────────────────────────────────────────
  isDeleted:    { type: Boolean, default: false },
  deletedFor:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  deletedAt:    Date,

  // ── Legacy ───────────────────────────────────────────────────
  serverstatus: String,
  serverid:     Number,

}, { timestamps: true });

messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ sendBy: 1 });
messageSchema.index({ jobId: 1 });

module.exports = {
  Conversation: mongoose.model('Conversation', conversationSchema),
  Message: mongoose.model('Message', messageSchema),
};
