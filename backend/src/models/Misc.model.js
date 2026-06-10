const mongoose = require('mongoose');

// ─── CATEGORY ────────────────────────────────────────────────────────────────
const categorySchema = new mongoose.Schema({
  catValue:  String,
  catTitle:  { type: String, required: true },
  alias:     { type: String, required: true },
  isActive:  { type: Boolean, default: true },
  isDefault: Boolean,
  ordering:  Number,
  parentId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  serverid:  Number,
}, { timestamps: true });
categorySchema.index({ parentId: 1 });
categorySchema.index({ alias: 1 });

// ─── JOB TYPE ────────────────────────────────────────────────────────────────
const jobTypeSchema = new mongoose.Schema({
  title:     { type: String, required: true },
  color:     String,
  alias:     String,
  isActive:  { type: Boolean, default: true },
  isDefault: Boolean,
  ordering:  Number,
  status:    { type: Boolean, default: true },
  serverid:  Number,
}, { timestamps: true });

// ─── CAREER LEVEL ────────────────────────────────────────────────────────────
const careerLevelSchema = new mongoose.Schema({
  title:     { type: String, required: true },
  status:    { type: Boolean, default: true },
  isDefault: Boolean,
  ordering:  Number,
  serverid:  Number,
}, { timestamps: true });

// ─── EDUCATION ───────────────────────────────────────────────────────────────
const educationSchema = new mongoose.Schema({
  title:     { type: String, required: true },
  isActive:  { type: Boolean, default: true },
  isDefault: Boolean,
  ordering:  Number,
  serverid:  Number,
}, { timestamps: true });

// ─── SALARY RANGE TYPE ────────────────────────────────────────────────────────
const salaryRangeTypeSchema = new mongoose.Schema({
  title:     { type: String, required: true },
  status:    { type: Boolean, default: true },
  isDefault: Boolean,
  ordering:  Number,
  serverid:  Number,
}, { timestamps: true });

// ─── CURRENCY ─────────────────────────────────────────────────────────────────
const currencySchema = new mongoose.Schema({
  title:        String,
  symbol:       String,
  code:         { type: String, required: true, unique: true },
  status:       { type: Boolean, default: true },
  isDefault:    Boolean,
  ordering:     Number,
  smallestUnit: { type: Number, default: 100 },
  serverid:     Number,
}, { timestamps: true });

// ─── COUNTRY ─────────────────────────────────────────────────────────────────
const countrySchema = new mongoose.Schema({
  name:              String,
  localName:         String,
  internationalName: String,
  nameCode:          String,
  shortCountry:      String,
  continentId:       Number,
  dialCode:          Number,
  enabled:           { type: Boolean, default: false },
  serverid:          Number,
}, { timestamps: true });
countrySchema.index({ name: 'text' });

// ─── STATE ───────────────────────────────────────────────────────────────────
const stateSchema = new mongoose.Schema({
  name:              String,
  localName:         String,
  internationalName: String,
  shortRegion:       String,
  countryId:         { type: mongoose.Schema.Types.ObjectId, ref: 'Country' },
  enabled:           { type: Boolean, default: false },
  serverid:          Number,
}, { timestamps: true });
stateSchema.index({ countryId: 1 });
stateSchema.index({ name: 'text' });

// ─── CITY ────────────────────────────────────────────────────────────────────
const citySchema = new mongoose.Schema({
  cityName:          String,
  name:              String,
  localName:         String,
  internationalName: String,
  stateId:           { type: mongoose.Schema.Types.ObjectId, ref: 'State' },
  countryId:         { type: mongoose.Schema.Types.ObjectId, ref: 'Country' },
  isEdit:            { type: Boolean, default: false },
  enabled:           { type: Boolean, default: false },
  latitude:          String,
  longitude:         String,
  serverid:          Number,
}, { timestamps: true });
citySchema.index({ countryId: 1 });
citySchema.index({ stateId: 1 });
citySchema.index({ name: 'text' });

// ─── DEPARTMENT ──────────────────────────────────────────────────────────────
const departmentSchema = new mongoose.Schema({
  uid:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  name:      { type: String, required: true },
  alias:     String,
  description: String,
  status:    { type: Boolean, default: true },
  userpackageId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserPackage' },
  price:     Number,
  serverstatus: String,
  serverid:  Number,
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });
departmentSchema.index({ companyId: 1 });
departmentSchema.index({ uid: 1 });

// ─── COVER LETTER ────────────────────────────────────────────────────────────
const coverLetterSchema = new mongoose.Schema({
  uid:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:       { type: String, required: true },
  alias:       String,
  description: { type: String, required: true },
  hits:        { type: Number, default: 0 },
  published:   { type: Boolean, default: true },
  searchable:  { type: Boolean, default: true },
  status:      { type: Boolean, default: true },
  packageId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Package' },
  paymentHistoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  serverstatus: String,
  serverid:    Number,
  isDeleted:   { type: Boolean, default: false },
  deletedAt:   Date,
}, { timestamps: true });
coverLetterSchema.index({ uid: 1 });

// ─── JOB ALERT ───────────────────────────────────────────────────────────────
const jobAlertSchema = new mongoose.Schema({
  uid:           { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  categoryId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  subcategoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  name:          { type: String, required: true },
  contactEmail:  { type: String, required: true },
  country:       String,
  state:         String,
  county:        String,
  city:          String,
  zipcode:       String,
  cities:        [{ type: mongoose.Schema.Types.ObjectId, ref: 'City' }],
  keywords:      String,
  company:       { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  jobType:       { type: mongoose.Schema.Types.ObjectId, ref: 'JobType' },
  workplaceType: Number,
  isUrgent:      { type: Boolean, default: false },
  tags:          [String],
  alertType:     Number,
  longitude:     String,
  latitude:      String,
  coordinatesRadius: Number,
  sendTime:      Date,
  lastMailSend:  Date,
  status:        { type: Number, default: 1 },
  price:         Number,
  userpackageId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserPackage' },
  serverid:      Number,
  serverstatus:  String,
  isDeleted:     { type: Boolean, default: false },
}, { timestamps: true });
jobAlertSchema.index({ uid: 1 });

// ─── JOB SHORTLIST ───────────────────────────────────────────────────────────
const jobShortlistSchema = new mongoose.Schema({
  uid:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  jobId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  comments: String,
  rate:     String,
  status:   { type: Boolean, default: true },
  serverid: Number,
  serverstatus: String,
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });
jobShortlistSchema.index({ uid: 1 });
jobShortlistSchema.index({ jobId: 1 });

// ─── ACTIVITY LOG ────────────────────────────────────────────────────────────
const activityLogSchema = new mongoose.Schema({
  uid:          { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  performedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  description:  { type: String, required: true },
  referenceFor: String,
  referenceId:  mongoose.Schema.Types.ObjectId,
  action:       String,
  ipAddress:    String,
  userAgent:    String,
  browser:      String,
  os:           String,
}, { timestamps: true });
activityLogSchema.index({ uid: 1 });
activityLogSchema.index({ createdAt: -1 });

// ─── TAG ─────────────────────────────────────────────────────────────────────
const tagSchema = new mongoose.Schema({
  tag:       { type: String, required: true },
  alias:     String,
  tagFor:    { type: Number }, // 1=job, 2=resume
  status:    { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
tagSchema.index({ tag: 1 });
tagSchema.index({ tagFor: 1 });

// ─── FOLLOWER ─────────────────────────────────────────────────────────────────
const followerSchema = new mongoose.Schema({
  followerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  companyId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
}, { timestamps: true });
followerSchema.index({ followerId: 1, companyId: 1 }, { unique: true });
followerSchema.index({ companyId: 1 });

// ─── REPORT ───────────────────────────────────────────────────────────────────
const reportSchema = new mongoose.Schema({
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  refModel:   { type: String, enum: ['Job', 'Company', 'Resume', 'User'] },
  refId:      mongoose.Schema.Types.ObjectId,
  reason:     { type: String, required: true },
  description: String,
  status:     { type: String, enum: ['pending', 'reviewed', 'resolved', 'dismissed'], default: 'pending' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewNote: String,
  isDeleted:  { type: Boolean, default: false },
}, { timestamps: true });
reportSchema.index({ status: 1 });
reportSchema.index({ refModel: 1, refId: 1 });

// ─── EMPLOYER VIEW RESUME ─────────────────────────────────────────────────────
const employerViewResumeSchema = new mongoose.Schema({
  uid:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  resumeId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Resume', required: true },
  profileId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status:       { type: Boolean, default: true },
  userpackageId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserPackage' },
  price:        Number,
}, { timestamps: true });
employerViewResumeSchema.index({ uid: 1, resumeId: 1 });

// ─── SAVED SEARCH ─────────────────────────────────────────────────────────────
const savedSearchSchema = new mongoose.Schema({
  uid:          { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  searchName:   { type: String, required: true },
  searchParams: mongoose.Schema.Types.Mixed,
  params:       mongoose.Schema.Types.Mixed,
  status:       { type: Boolean, default: true },
  price:        Number,
  userpackageId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserPackage' },
}, { timestamps: true });
savedSearchSchema.index({ uid: 1 });

// ─── FOLDER / FOLDER RESUME ────────────────────────────────────────────────────
const folderSchema = new mongoose.Schema({
  uid:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  global:   { type: Boolean, default: false },
  jobId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
  name:     { type: String, required: true },
  alias:    String,
  description: String,
  status:   { type: Boolean, default: true },
  packageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Package' },
  paymentHistoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  serverid: Number,
  serverstatus: String,
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });
folderSchema.index({ uid: 1 });

const folderResumeSchema = new mongoose.Schema({
  uid:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  jobId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
  resumeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume', required: true },
  folderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', required: true },
  serverid: Number,
  serverstatus: String,
}, { timestamps: true });
folderResumeSchema.index({ folderId: 1 });

// ─── SYSTEM ERROR ─────────────────────────────────────────────────────────────
const systemErrorSchema = new mongoose.Schema({
  uid:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  error:   String,
  isView:  { type: Boolean, default: false },
}, { timestamps: true });

module.exports = {
  Category:           mongoose.model('Category', categorySchema),
  JobType:            mongoose.model('JobType', jobTypeSchema),
  CareerLevel:        mongoose.model('CareerLevel', careerLevelSchema),
  Education:          mongoose.model('Education', educationSchema),
  SalaryRangeType:    mongoose.model('SalaryRangeType', salaryRangeTypeSchema),
  Currency:           mongoose.model('Currency', currencySchema),
  Country:            mongoose.model('Country', countrySchema),
  State:              mongoose.model('State', stateSchema),
  City:               mongoose.model('City', citySchema),
  Department:         mongoose.model('Department', departmentSchema),
  CoverLetter:        mongoose.model('CoverLetter', coverLetterSchema),
  JobAlert:           mongoose.model('JobAlert', jobAlertSchema),
  JobShortlist:       mongoose.model('JobShortlist', jobShortlistSchema),
  ActivityLog:        mongoose.model('ActivityLog', activityLogSchema),
  Tag:                mongoose.model('Tag', tagSchema),
  Follower:           mongoose.model('Follower', followerSchema),
  Report:             mongoose.model('Report', reportSchema),
  EmployerViewResume: mongoose.model('EmployerViewResume', employerViewResumeSchema),
  SavedSearch:        mongoose.model('SavedSearch', savedSearchSchema),
  Folder:             mongoose.model('Folder', folderSchema),
  FolderResume:       mongoose.model('FolderResume', folderResumeSchema),
  SystemError:        mongoose.model('SystemError', systemErrorSchema),
};
