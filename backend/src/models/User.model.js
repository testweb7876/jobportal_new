const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const deviceSchema = new mongoose.Schema({
  deviceId:    String,
  deviceName:  String,
  browser:     String,
  os:          String,
  ip:          String,
  location:    String,
  lastActive:  { type: Date, default: Date.now },
  isActive:    { type: Boolean, default: true },
}, { _id: false });

const notificationSettingsSchema = new mongoose.Schema({
  emailOnApplication:   { type: Boolean, default: true },
  emailOnMessage:       { type: Boolean, default: true },
  emailOnJobAlert:      { type: Boolean, default: true },
  emailOnPackageExpiry: { type: Boolean, default: true },
  pushNotifications:    { type: Boolean, default: true },
  smsNotifications:     { type: Boolean, default: false },
}, { _id: false });

const socialLinksSchema = new mongoose.Schema({
  linkedin:  { type: String, default: '' },
  github:    { type: String, default: '' },
  twitter:   { type: String, default: '' },
  facebook:  { type: String, default: '' },
  website:   { type: String, default: '' },
}, { _id: false });

const userSchema = new mongoose.Schema({
  // ── Core ─────────────────────────────────────────────────────
  uid: { type: Number },   // legacy portal compatibility
  firstName:     { type: String, required: true, trim: true, maxlength: 100 },
  lastName:      { type: String, required: true, trim: true, maxlength: 100 },
  email:         { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:      { type: String, minlength: 8, select: false },
  phone:         { type: String, trim: true },
  role:          { type: String, enum: ['jobseeker', 'employer', 'admin', 'superadmin'], default: 'jobseeker' },

  // ── Status & Verification ─────────────────────────────────────
  status:        { type: String, enum: ['pending', 'active', 'suspended', 'banned'], default: 'pending' },
  isVerified:    { type: Boolean, default: false },
  isEmailVerified: { type: Boolean, default: false },
  isPhoneVerified: { type: Boolean, default: false },
  profileCompleted: { type: Number, default: 0, min: 0, max: 100 },

  // ── Avatar ───────────────────────────────────────────────────
  avatar: {
    publicId:   String,
    secureUrl:  String,
    resourceType: { type: String, default: 'image' },
  },
  photo: { type: String }, // legacy

  // ── Social Auth ──────────────────────────────────────────────
  socialId:       String,
  socialMedia:    { type: String, enum: ['google', 'linkedin', 'facebook', ''] },
  googleId:       String,
  linkedinId:     String,

  // ── Preferences & Settings ───────────────────────────────────
  socialLinks:            { type: socialLinksSchema, default: {} },
  notificationSettings:   { type: notificationSettingsSchema, default: {} },
  deviceHistory:          [deviceSchema],

  // ── Analytics ───────────────────────────────────────────────
  profileViews:  { type: Number, default: 0 },
  lastLogin:     Date,
  lastActive:    Date,
  loginCount:    { type: Number, default: 0 },

  // ── Password Reset ────────────────────────────────────────────
  passwordResetToken:   { type: String, select: false },
  passwordResetExpires: { type: Date, select: false },
  passwordChangedAt:    Date,

  // ── Email Verification ────────────────────────────────────────
  emailVerificationToken:   { type: String, select: false },
  emailVerificationExpires: { type: Date, select: false },

  // ── Two-Factor Auth ───────────────────────────────────────────
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret:  { type: String, select: false },

  // ── Soft Delete ───────────────────────────────────────────────
  isDeleted:  { type: Boolean, default: false },
  deletedAt:  Date,

  // ── Legacy ───────────────────────────────────────────────────
  roleid:   Number,
  params:   mongoose.Schema.Types.Mixed,

}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

// ─── INDEXES ────────────────────────────────────────────────────────────────
// userSchema.index({ email: 1 });
userSchema.index({ role: 1, status: 1 });
userSchema.index({ isDeleted: 1 });
userSchema.index({ createdAt: -1 });

// ─── VIRTUALS ────────────────────────────────────────────────────────────────
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// ─── PRE-SAVE HOOKS ──────────────────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  this.password = await bcrypt.hash(this.password, rounds);
  if (this.isNew) return next();
  this.passwordChangedAt = new Date(Date.now() - 1000);
  next();
});

// ─── METHODS ─────────────────────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  return resetToken;
};

userSchema.methods.createEmailVerificationToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = crypto.createHash('sha256').update(token).digest('hex');
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return token;
};

userSchema.methods.toPublicJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  delete obj.emailVerificationToken;
  delete obj.emailVerificationExpires;
  delete obj.twoFactorSecret;
  delete obj.__v;
  return obj;
};

// ─── QUERY MIDDLEWARE ─────────────────────────────────────────────────────────
userSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: false });
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
