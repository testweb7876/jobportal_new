const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  type: {
    type: String,
    enum: [
      'application_received', 'application_viewed', 'shortlisted', 'hired', 'rejected',
      'interview_scheduled', 'offer_received', 'package_expiry', 'package_expired',
      'payment_success', 'payment_failed', 'message_received', 'job_alert',
      'company_followed', 'resume_viewed', 'profile_viewed', 'system', 'custom',
    ],
    required: true,
  },

  title:   { type: String, required: true },
  message: { type: String, required: true },

  // ── Reference ────────────────────────────────────────────────
  refModel: { type: String, enum: ['Job', 'Application', 'Company', 'Resume', 'Message', 'Package', 'Invoice'] },
  refId:    mongoose.Schema.Types.ObjectId,

  // ── State ─────────────────────────────────────────────────────
  isRead:   { type: Boolean, default: false },
  readAt:   Date,

  // ── Delivery ─────────────────────────────────────────────────
  channels: {
    inApp:  { type: Boolean, default: true },
    email:  { type: Boolean, default: false },
    push:   { type: Boolean, default: false },
    sms:    { type: Boolean, default: false },
  },
  emailSent: { type: Boolean, default: false },
  pushSent:  { type: Boolean, default: false },

  // ── CTA ───────────────────────────────────────────────────────
  actionUrl: String,
  actionText: String,

  // ── Soft Delete ───────────────────────────────────────────────
  isDeleted: { type: Boolean, default: false },
  deletedAt: Date,

}, { timestamps: true });

notificationSchema.index({ recipientId: 1, isRead: 1 });
notificationSchema.index({ recipientId: 1, createdAt: -1 });
notificationSchema.index({ type: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
