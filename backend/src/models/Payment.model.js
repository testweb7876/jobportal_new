const mongoose = require('mongoose');

// ─── USER PACKAGE ────────────────────────────────────────────────────────────
const userPackageSchema = new mongoose.Schema({
  uid:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  packageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Package', required: true },
  endDate:   { type: Date, required: true },
  status:    { type: Boolean, default: true },
  isActive:  { type: Boolean, default: true },

  // ── Usage Tracking ────────────────────────────────────────────
  remainingJobs:           { type: Number, default: 0 },
  remainingFeaturedJobs:   { type: Number, default: 0 },
  remainingResumes:        { type: Number, default: 0 },
  remainingFeaturedResumes:{ type: Number, default: 0 },
  remainingCompanies:      { type: Number, default: 0 },
  remainingJobAlerts:      { type: Number, default: 0 },
  remainingJobApply:       { type: Number, default: 0 },
  remainingResumeSearch:   { type: Number, default: 0 },

  // ── Auto Renew ────────────────────────────────────────────────
  autoRenew:         { type: Boolean, default: false },
  subscriptionId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription' },
  paymentHistoryId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },

  isDeleted: { type: Boolean, default: false },
  deletedAt: Date,
}, { timestamps: true });

userPackageSchema.index({ uid: 1, status: 1 });
userPackageSchema.index({ endDate: 1 });

// ─── INVOICE ─────────────────────────────────────────────────────────────────
const invoiceSchema = new mongoose.Schema({
  uid:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recordId:     { type: mongoose.Schema.Types.ObjectId },
  description:  String,
  type:         { type: String, enum: ['package', 'boost', 'addon'], required: true },
  currencyId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Currency' },
  amount:       { type: Number, required: true },

  // ── Payment ───────────────────────────────────────────────────
  payMethod:     { type: String, enum: ['stripe', 'paypal', 'bank', 'free', 'manual'] },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded', 'cancelled'], default: 'pending' },
  transactionId: String,
  paidAt:        Date,
  refundStatus:  { type: String, enum: ['none', 'requested', 'processing', 'refunded'], default: 'none' },
  refundedAt:    Date,
  refundReason:  String,

  // ── Payer Details ─────────────────────────────────────────────
  payerName:            String,
  payerEmail:           String,
  payerAddress:         String,
  payerTransactionNumber: String,
  payerContactNumber:   String,
  paymentProof:         String, // for bank transfers

  status: { type: Boolean, default: true },
}, { timestamps: true });

invoiceSchema.index({ uid: 1 });
invoiceSchema.index({ paymentStatus: 1 });
invoiceSchema.index({ createdAt: -1 });

// ─── TRANSACTION LOG ─────────────────────────────────────────────────────────
const transactionLogSchema = new mongoose.Schema({
  uid:            { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userPackageId:  { type: mongoose.Schema.Types.ObjectId, ref: 'UserPackage' },
  recordId:       mongoose.Schema.Types.ObjectId,
  type:           String,
  status:         Boolean,
}, { timestamps: true });

transactionLogSchema.index({ uid: 1 });
transactionLogSchema.index({ userPackageId: 1 });

// ─── SUBSCRIPTION ────────────────────────────────────────────────────────────
const subscriptionSchema = new mongoose.Schema({
  subId:         { type: String, required: true },
  custId:        String,
  uid:           { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  packageId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Package', required: true },
  payMethod:     { type: String, enum: ['stripe', 'paypal'] },
  nextBillingDate: Date,
  status:        { type: Boolean, default: true },
}, { timestamps: true });

subscriptionSchema.index({ uid: 1 });
subscriptionSchema.index({ subId: 1 });

module.exports = {
  UserPackage:    mongoose.model('UserPackage', userPackageSchema),
  Invoice:        mongoose.model('Invoice', invoiceSchema),
  TransactionLog: mongoose.model('TransactionLog', transactionLogSchema),
  Subscription:   mongoose.model('Subscription', subscriptionSchema),
};
