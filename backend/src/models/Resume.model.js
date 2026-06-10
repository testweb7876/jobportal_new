const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  uid:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  alias:  String,

  // ── Personal Info ─────────────────────────────────────────────
  applicationTitle: { type: String, required: true, trim: true },
  firstName:    String,
  lastName:     String,
  gender:       String,
  emailAddress: String,
  cell:         String,
  nationality:  String,
  photo: {
    publicId:  String,
    secureUrl: String,
  },

  // ── Job Preferences ────────────────────────────────────────────
  jobCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  jobType:     { type: mongoose.Schema.Types.ObjectId, ref: 'JobType' },
  salaryFixed: String,
  keywords:    String,
  tags:        [String],

  // ── Visibility & Status ────────────────────────────────────────
  published:   { type: Boolean, default: true },
  searchable:  { type: Boolean, default: true },
  visibility:  { type: String, enum: ['public', 'private', 'restricted'], default: 'public' },
  status:      { type: Number, default: 1 },
  quickApply:  { type: Boolean, default: false },

  // ── Resume Content ─────────────────────────────────────────────
  resume: String,
  skills: String,

  // ── Education ────────────────────────────────────────────────
  institutes: [{
    institute:               String,
    instituteCertificateName: String,
    instituteStudyArea:       String,
    fromDate:                String,
    toDate:                  String,
    params:                  mongoose.Schema.Types.Mixed,
    serverstatus:            String,
    serverid:                Number,
  }],

  // ── Work Experience ───────────────────────────────────────────
  employers: [{
    employer:              String,
    employerFromDate:      String,
    employerToDate:        String,
    employerCurrentStatus: { type: Number, default: 0 },
    employerCity:          String,
    employerPosition:      String,
    employerPhone:         String,
    employerAddress:       String,
    params:                mongoose.Schema.Types.Mixed,
    serverstatus:          String,
    serverid:              Number,
  }],

  // ── Languages ─────────────────────────────────────────────────
  languages: [{
    language:    String,
    proficiency: String,
    params:      mongoose.Schema.Types.Mixed,
  }],

  // ── Addresses ────────────────────────────────────────────────
  addresses: [{
    address:     String,
    addressCity: String,
    longitude:   String,
    latitude:    String,
    params:      mongoose.Schema.Types.Mixed,
  }],

  // ── Files ─────────────────────────────────────────────────────
  files: [{
    publicId:  String,
    secureUrl: String,
    filename:  String,
    filetype:  String,
    filesize:  Number,
    uploadedAt: { type: Date, default: Date.now },
  }],

  // ── Featured & Gold ────────────────────────────────────────────
  isGoldResume:     { type: Boolean, default: false },
  startGoldDate:    Date,
  endGoldDate:      Date,
  isFeaturedResume: { type: Boolean, default: false },
  startFeaturedDate: Date,
  endFeaturedDate:  Date,

  // ── ATS & Quality ─────────────────────────────────────────────
  atsScore:             { type: Number, default: 0, min: 0, max: 100 },
  completionPercentage: { type: Number, default: 0, min: 0, max: 100 },

  // ── Analytics ─────────────────────────────────────────────────
  hits:          { type: Number, default: 0 },
  viewsCount:    { type: Number, default: 0 },
  downloadCount: { type: Number, default: 0 },

  // ── AI Fields ─────────────────────────────────────────────────
  aiResumeSearchText:        String,
  aiResumeSearchDescription: String,

  // ── Sharing ────────────────────────────────────────────────────
  shareToken: { type: String, unique: true, sparse: true },

  // ── Package ───────────────────────────────────────────────────
  userpackageId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserPackage' },
  price:         Number,

  // ── Soft Delete ───────────────────────────────────────────────
  isDeleted: { type: Boolean, default: false },
  deletedAt: Date,

  // ── Legacy ───────────────────────────────────────────────────
  serverstatus: String,
  serverid:     Number,
  params:       mongoose.Schema.Types.Mixed,

}, { timestamps: true, toJSON: { virtuals: true } });

resumeSchema.index({ uid: 1 });
resumeSchema.index({ status: 1, published: 1, isDeleted: 1 });
resumeSchema.index({ jobCategory: 1 });
resumeSchema.index({ tags: 1 });
resumeSchema.index({ applicationTitle: 'text', skills: 'text', aiResumeSearchText: 'text' });
resumeSchema.index({ createdAt: -1 });

resumeSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeDeleted) this.where({ isDeleted: false });
  next();
});

module.exports = mongoose.model('Resume', resumeSchema);
