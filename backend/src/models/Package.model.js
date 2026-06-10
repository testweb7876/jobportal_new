const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema({
  title:   { type: String, required: true },
  isFree:  { type: Boolean, default: false },
  price:   { type: Number, default: 0 },

  // ── Duration ─────────────────────────────────────────────────
  packageTime:     { type: Number, required: true },
  packageTimeUnit: { type: String, enum: ['days', 'months', 'years'], required: true },

  // ── Allowed Features ─────────────────────────────────────────
  companies:            { type: Number, default: 0 },
  featuredCompany:      { type: Number, default: 0 },
  job:                  { type: Number, default: 0 },
  featuredJob:          { type: Number, default: 0 },
  resume:               { type: Number, default: 0 },
  featuredResume:       { type: Number, default: 0 },
  department:           { type: Number, default: 0 },
  coverletter:          { type: Number, default: 0 },
  jobSearch:            { type: Number, default: 0 },
  resumeSearch:         { type: Number, default: 0 },
  jobAlert:             { type: Number, default: 0 },
  jobApply:             { type: Number, default: 0 },
  resumeContactDetail:  { type: Number, default: 0 },
  companyContactDetail: { type: Number, default: 0 },

  // ── Job Publish Duration ─────────────────────────────────────
  jobTime:     { type: Number, default: 30 },
  jobTimeUnit: { type: String, enum: ['days', 'months', 'years'], default: 'days' },

  // ── Featured Durations ────────────────────────────────────────
  featuredCompanyTime:     Number,
  featuredCompanyTimeUnit: String,
  featuredJobTime:         Number,
  featuredJobTimeUnit:     String,
  featuredResumeTime:      Number,
  featuredResumeTimeUnit:  String,

  // ── Discount ─────────────────────────────────────────────────
  discount:          Number,
  discountType:      { type: String, enum: ['fixed', 'percent'] },
  renewDiscount:     Number,
  renewDiscountType: { type: String, enum: ['fixed', 'percent'] },

  // ── Currency & Role ───────────────────────────────────────────
  currencyId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Currency' },
  packageFor:  { type: String, enum: ['employer', 'jobseeker', 'both'], required: true },

  // ── Stripe/PayPal Subscription ────────────────────────────────
  paypalSubscription:  { type: Boolean, default: false },
  stripeSubscription:  { type: Boolean, default: false },
  stripePlanId:        String,
  stripePlanName:      String,

  status: { type: Boolean, default: true },

  isDeleted: { type: Boolean, default: false },
  deletedAt: Date,

}, { timestamps: true });

packageSchema.index({ packageFor: 1, status: 1 });

module.exports = mongoose.model('Package', packageSchema);
