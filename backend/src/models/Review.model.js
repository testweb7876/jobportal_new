const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  uid:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },

  rating: { type: Number, required: true, min: 1, max: 5 },
  title:  { type: String, required: true, trim: true, maxlength: 150 },
  review: { type: String, required: true, trim: true, maxlength: 2000 },

  // ── Optional structured feedback (Glassdoor-style) ──────────────────────
  pros: { type: String, maxlength: 1000 },
  cons: { type: String, maxlength: 1000 },

  jobTitle:       String,  // what role the reviewer held/applied for
  employmentType: { type: String, enum: ['current', 'former', 'interviewed', ''] },

  // ── Moderation ────────────────────────────────────────────────────────
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  moderationNote: String,

  // ── Anonymity ────────────────────────────────────────────────────────
  isAnonymous: { type: Boolean, default: true },

  // ── Helpful votes ────────────────────────────────────────────────────
  helpfulCount: { type: Number, default: 0 },
  helpfulVotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // ── Employer response ────────────────────────────────────────────────
  employerResponse: {
    text:        String,
    respondedAt: Date,
    respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },

  isDeleted: { type: Boolean, default: false },
  deletedAt: Date,
}, { timestamps: true });

reviewSchema.index({ companyId: 1, status: 1 });
reviewSchema.index({ uid: 1, companyId: 1 });
reviewSchema.index({ createdAt: -1 });

reviewSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeDeleted) this.where({ isDeleted: false });
  next();
});

module.exports = mongoose.model('Review', reviewSchema);