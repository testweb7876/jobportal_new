const mongoose = require('mongoose');
const slugify = require('slugify');

const jobSchema = new mongoose.Schema({
  // ── Core ─────────────────────────────────────────────────────
  uid:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  companyId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  title:        { type: String, required: true, trim: true, maxlength: 255 },
  slug:         { type: String, unique: true },

  // ── Classification ────────────────────────────────────────────
  categoryId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  subcategoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  jobCategory:   String, // legacy text
  jobType:       { type: mongoose.Schema.Types.ObjectId, ref: 'JobType' },
  careerLevel:   { type: mongoose.Schema.Types.ObjectId, ref: 'CareerLevel' },
  educationId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Education' },
  degreetitle:   String,
  departmentId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  tags:          [String],

  // ── Status & Moderation ───────────────────────────────────────
  status: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'rejected', 'expired', 'paused', 'deleted'],
    default: 'pending',
  },
  jobStatus:     { type: Number, default: 1 }, // legacy
  moderationNote: String,
  rejectedReason: String,
  isUrgent:      { type: Boolean, default: false },
  urgentUntil:   Date,

  // ── Content ───────────────────────────────────────────────────
  description:     { type: String, required: true },
  qualifications:  String,
  prefferdSkills:  String,
  applyInfo:       String,
  metaDescription: String,
  metaKeywords:    String,

  // ── Location ─────────────────────────────────────────────────
  company:    String,
  city:       String,
  zipcode:    String,
  address1:   String,
  address2:   String,
  longitude:  String,
  latitude:   String,
  cities:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'City' }],
  workplaceType: {
    type: String,
    enum: ['onsite', 'remote', 'hybrid'],
    default: 'onsite',
  },

  // ── Contact ───────────────────────────────────────────────────
  companyUrl:   String,
  contactName:  String,
  contactPhone: String,
  contactEmail: String,
  showContact:  { type: Boolean, default: false },
  jobApplyLink: { type: Boolean, default: false },
  jobLink:      String,

  // ── Salary ───────────────────────────────────────────────────
  hideSalaryRange: { type: Boolean, default: true },
  salaryType:      { type: mongoose.Schema.Types.ObjectId, ref: 'SalaryRangeType' },
  salaryMin:       Number,
  salaryMax:       Number,
  salaryDuration:  Number,
  currency:        String,

  // ── Requirements ─────────────────────────────────────────────
  experience:              { type: Number, default: 0 },
  heighestfinishEducation: String,
  noOfJobs:                { type: Number, default: 1 },
  duration:                String,
  reference:               String,

  // ── Scheduling ────────────────────────────────────────────────
  startPublishing: Date,
  stopPublishing:  Date,
  expiresAt:       Date,
  scheduledAt:     Date,

  // ── Featured & Gold ──────────────────────────────────────────
  isGoldJob:        { type: Boolean, default: false },
  startGoldDate:    Date,
  endGoldDate:      Date,
  isFeaturedJob:    { type: Boolean, default: false },
  startFeaturedDate: Date,
  endFeaturedDate:  Date,
  featuredUntil:    Date,

  // ── Analytics ────────────────────────────────────────────────
  viewsCount:        { type: Number, default: 0 },
  applicationsCount: { type: Number, default: 0 },
  hits:              { type: Number, default: 0 },

  // ── AI Fields ────────────────────────────────────────────────
  aiJobSearchText:        String,
  aiJobSearchDescription: String,

  // ── RAF (Recommended Applicant Fields) ───────────────────────
  raf: {
    gender:      Boolean,
    degreeLevel: Boolean,
    experience:  Boolean,
    age:         Boolean,
    education:   Boolean,
    category:    Boolean,
    subcategory: Boolean,
    location:    Boolean,
  },

  // ── Package & Payment ─────────────────────────────────────────
  userpackageId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserPackage' },
  price:         Number,

  // ── Attachments ───────────────────────────────────────────────
  aboutJobFile: {
    publicId:  String,
    secureUrl: String,
    fileType:  String,
  },

  // ── Publishing ────────────────────────────────────────────────
  sendemail: { type: Boolean, default: false },
  ordering:  { type: Number, default: 0 },

  // ── Soft Delete ───────────────────────────────────────────────
  isDeleted: { type: Boolean, default: false },
  deletedAt: Date,

  // ── Legacy ───────────────────────────────────────────────────
  serverstatus: String,
  serverid:     Number,
  jobid:        String,
  params:       mongoose.Schema.Types.Mixed,

}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

// ─── INDEXES ────────────────────────────────────────────────────────────────
jobSchema.index({ title: 'text', description: 'text', aiJobSearchText: 'text', tags: 'text' });
// jobSchema.index({ slug: 1 });
jobSchema.index({ status: 1, isDeleted: 1 });
jobSchema.index({ uid: 1 });
jobSchema.index({ companyId: 1 });
jobSchema.index({ categoryId: 1 });
jobSchema.index({ city: 1 });
jobSchema.index({ workplaceType: 1 });
jobSchema.index({ isFeaturedJob: 1, isGoldJob: 1 });
jobSchema.index({ expiresAt: 1 });
jobSchema.index({ createdAt: -1 });
jobSchema.index({ salaryMin: 1, salaryMax: 1 });
jobSchema.index({ experience: 1 });

// ─── SLUG GENERATION ────────────────────────────────────────────────────────
jobSchema.pre('save', async function (next) {
  if (!this.isModified('title')) return next();
  let slug = slugify(this.title, { lower: true, strict: true });
  const count = await mongoose.model('Job').countDocuments({ slug: new RegExp(`^${slug}`) });
  this.slug = count ? `${slug}-${Date.now()}` : slug;
  next();
});

// ─── QUERY MIDDLEWARE ────────────────────────────────────────────────────────
jobSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: false });
  }
  next();
});

// ─── VIRTUALS ────────────────────────────────────────────────────────────────
jobSchema.virtual('isExpired').get(function () {
  return this.expiresAt && new Date() > this.expiresAt;
});

jobSchema.virtual('isActive').get(function () {
  return this.status === 'approved' && !this.isExpired;
});

module.exports = mongoose.model('Job', jobSchema);
