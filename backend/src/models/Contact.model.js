const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  // ── Submitted by ─────────────────────────────────────────────
  uid:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // set if logged in, otherwise null (guest)
  name:  { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, trim: true, lowercase: true },

  // ── Message ──────────────────────────────────────────────────
  category: {
    type: String,
    enum: ['general', 'jobseeker', 'employer', 'partnership', 'issue'],
    default: 'general',
  },
  message: { type: String, required: true, trim: true, maxlength: 5000 },

  // ── Moderation / support workflow ───────────────────────────
  status: {
    type: String,
    enum: ['new', 'read', 'responded', 'closed'],
    default: 'new',
  },
  response:     { type: String, trim: true },
  respondedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  respondedAt:  Date,

  // ── Metadata ─────────────────────────────────────────────────
  ipAddress: String,
  userAgent: String,

  // ── Soft delete ──────────────────────────────────────────────
  isDeleted: { type: Boolean, default: false },
  deletedAt: Date,
}, { timestamps: true });

contactSchema.index({ status: 1, createdAt: -1 });
contactSchema.index({ email: 1 });

// ─── QUERY MIDDLEWARE (soft delete, same pattern as User model) ─────────────
contactSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: false });
  }
  next();
});

module.exports = mongoose.model('Contact', contactSchema);