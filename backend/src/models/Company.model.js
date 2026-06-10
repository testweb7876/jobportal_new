const mongoose = require('mongoose');
const slugify = require('slugify');

const galleryItemSchema = new mongoose.Schema({
  publicId:    String,
  secureUrl:   String,
  caption:     String,
  uploadedAt:  { type: Date, default: Date.now },
}, { _id: false });

const companySchema = new mongoose.Schema({
  uid:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:   { type: String, required: true, trim: true },
  slug:   { type: String, unique: true },
  alias:  String,

  // ── Contact & Web ─────────────────────────────────────────────
  url:          String,
  contactEmail: String,
  tagline:      String,
  description:  String,

  // ── Logo ──────────────────────────────────────────────────────
  logo: {
    publicId:    String,
    secureUrl:   String,
    resourceType: { type: String, default: 'image' },
    fileSize:    Number,
  },
  smallLogo: {
    publicId:  String,
    secureUrl: String,
  },
  logoFilename:      String, // legacy
  smallLogoFilename: String, // legacy

  // ── Location ─────────────────────────────────────────────────
  city:     String,
  address1: String,
  address2: String,
  cities:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'City' }],

  // ── Verification ──────────────────────────────────────────────
  isVerified:         { type: Boolean, default: false },
  verificationStatus: { type: String, enum: ['pending', 'approved', 'rejected', 'not_submitted'], default: 'not_submitted' },
  verificationNote:   String,
  verificationDocuments: [{
    publicId:    String,
    secureUrl:   String,
    fileType:    String,
    uploadedAt:  Date,
  }],

  // ── Status & Features ─────────────────────────────────────────
  status:       { type: Number, default: 0 },
  isGoldCompany:    { type: Boolean, default: false },
  startGoldDate:    Date,
  endGoldDate:      Date,
  isFeaturedCompany: { type: Boolean, default: false },
  startFeaturedDate: Date,
  endFeaturedDate:   Date,

  // ── Social Media ──────────────────────────────────────────────
  socialLinks: {
    facebook:  String,
    twitter:   String,
    linkedin:  String,
    youtube:   String,
    instagram: String,
    website:   String,
  },

  // ── Gallery ───────────────────────────────────────────────────
  gallery: [galleryItemSchema],

  // ── Analytics ────────────────────────────────────────────────
  hits:           { type: Number, default: 0 },
  followersCount: { type: Number, default: 0 },
  jobsCount:      { type: Number, default: 0 },

  // ── SEO ───────────────────────────────────────────────────────
  metaDescription: String,
  metaKeywords:    String,

  // ── Package ───────────────────────────────────────────────────
  userpackageId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserPackage' },
  price:         Number,

  // ── Soft Delete ───────────────────────────────────────────────
  isDeleted: { type: Boolean, default: false },
  deletedAt: Date,

  // ── Legacy ───────────────────────────────────────────────────
  serverstatus: String,
  serverid:     { type: Number, default: 0 },
  params:       mongoose.Schema.Types.Mixed,

}, { timestamps: true, toJSON: { virtuals: true } });

// companySchema.index({ slug: 1 });
companySchema.index({ uid: 1 });
companySchema.index({ name: 'text', description: 'text' });
companySchema.index({ status: 1, isDeleted: 1 });
companySchema.index({ isVerified: 1 });

companySchema.pre('save', async function (next) {
  if (!this.isModified('name')) return next();
  let slug = slugify(this.name, { lower: true, strict: true });
  const count = await mongoose.model('Company').countDocuments({ slug: new RegExp(`^${slug}`) });
  this.slug = count ? `${slug}-${Date.now()}` : slug;
  next();
});

companySchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeDeleted) this.where({ isDeleted: false });
  next();
});

module.exports = mongoose.model('Company', companySchema);
