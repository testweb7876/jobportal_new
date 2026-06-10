const Company = require('../models/Company.model');
const { Follower } = require('../models/Misc.model');
const { AppError, asyncHandler, sendSuccess, sendPaginated } = require('../utils/AppError');
const { uploadToCloudinary, deleteFromCloudinary } = require('../services/cloudinary.service');
const { cache } = require('../config/redis');
const { ActivityLog } = require('../models/Misc.model');

// ─── GET ALL COMPANIES (PUBLIC) ───────────────────────────────────────────────
exports.getCompanies = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);
  const skip = (page - 1) * limit;

  const filter = { status: 1, isDeleted: false };
  if (req.query.keyword) filter.$text = { $search: req.query.keyword };
  if (req.query.city) filter.city = new RegExp(req.query.city, 'i');
  if (req.query.verified) filter.isVerified = true;

  const sort = req.query.sort === 'followers'
    ? { followersCount: -1 }
    : { isFeaturedCompany: -1, isGoldCompany: -1, createdAt: -1 };

  const [companies, total] = await Promise.all([
    Company.find(filter)
      .select('name slug logo city tagline isVerified followersCount isFeaturedCompany isGoldCompany jobsCount')
      .sort(sort).skip(skip).limit(limit).lean(),
    Company.countDocuments(filter),
  ]);

  sendPaginated(res, companies, total, page, limit);
});

// ─── GET SINGLE COMPANY ───────────────────────────────────────────────────────
exports.getCompany = asyncHandler(async (req, res, next) => {
  const identifier = req.params.id;
  const filter = identifier.match(/^[0-9a-fA-F]{24}$/) ? { _id: identifier } : { slug: identifier };

  const company = await Company.findOne({ ...filter, status: 1 })
    .populate('uid', 'firstName lastName');

  if (!company) return next(new AppError('Company not found.', 404));

  await Company.findByIdAndUpdate(company._id, { $inc: { hits: 1 } });

  let isFollowing = false;
  if (req.user) {
    const follower = await Follower.findOne({ followerId: req.user._id, companyId: company._id });
    isFollowing = !!follower;
  }

  // Recent jobs
  const Job = require('../models/Job.model');
  const recentJobs = await Job.find({ companyId: company._id, status: 'approved' })
    .select('title city jobType createdAt expiresAt workplaceType')
    .populate('jobType', 'title color')
    .sort({ createdAt: -1 })
    .limit(5).lean();

  sendSuccess(res, { company, isFollowing, recentJobs }, 'Company fetched');
});

// ─── CREATE COMPANY ───────────────────────────────────────────────────────────
exports.createCompany = asyncHandler(async (req, res, next) => {
  const existing = await Company.findOne({ uid: req.user._id });
  if (existing) return next(new AppError('You already have a company profile.', 409));

  const company = await Company.create({ ...req.body, uid: req.user._id });

  await ActivityLog.create({ uid: req.user._id, description: `Created company: ${company.name}`, referenceFor: 'company', referenceId: company._id, ipAddress: req.ip });

  sendSuccess(res, { company }, 'Company created', 201);
});

// ─── UPDATE COMPANY ───────────────────────────────────────────────────────────
exports.updateCompany = asyncHandler(async (req, res, next) => {
  const company = await Company.findById(req.params.id);
  if (!company) return next(new AppError('Company not found.', 404));

  if (company.uid.toString() !== req.user._id.toString() && !['admin', 'superadmin'].includes(req.user.role)) {
    return next(new AppError('Not authorized.', 403));
  }

  // Prevent status/verification changes by employer
  if (!['admin', 'superadmin'].includes(req.user.role)) {
    delete req.body.isVerified;
    delete req.body.verificationStatus;
    delete req.body.status;
  }

  const updated = await Company.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

  await cache.delPattern('companies:*');
  sendSuccess(res, { company: updated }, 'Company updated');
});

// ─── UPLOAD LOGO ─────────────────────────────────────────────────────────────
exports.uploadLogo = asyncHandler(async (req, res, next) => {
  if (!req.file) return next(new AppError('Please upload a logo image.', 400));

  const company = await Company.findOne({ uid: req.user._id });
  if (!company) return next(new AppError('Company not found.', 404));

  // Delete old logo
  if (company.logo?.publicId) await deleteFromCloudinary(company.logo.publicId);

  const result = await uploadToCloudinary(req.file, 'company_logo', {
    transformation: [{ width: 400, height: 400, crop: 'limit', quality: 'auto' }],
  });

  const updated = await Company.findByIdAndUpdate(company._id, { logo: result, logoFilename: result.secureUrl }, { new: true });

  sendSuccess(res, { logo: updated.logo }, 'Logo uploaded');
});

// ─── UPLOAD GALLERY IMAGE ────────────────────────────────────────────────────
exports.uploadGalleryImage = asyncHandler(async (req, res, next) => {
  if (!req.file) return next(new AppError('No image uploaded.', 400));

  const company = await Company.findOne({ uid: req.user._id });
  if (!company) return next(new AppError('Company not found.', 404));
  if (company.gallery.length >= 10) return next(new AppError('Maximum 10 gallery images allowed.', 400));

  const result = await uploadToCloudinary(req.file, 'gallery');

  await Company.findByIdAndUpdate(company._id, {
    $push: { gallery: { ...result, caption: req.body.caption } },
  });

  sendSuccess(res, { image: result }, 'Gallery image uploaded');
});

// ─── DELETE GALLERY IMAGE ─────────────────────────────────────────────────────
exports.deleteGalleryImage = asyncHandler(async (req, res, next) => {
  const { publicId } = req.body;
  const company = await Company.findOne({ uid: req.user._id });
  if (!company) return next(new AppError('Company not found.', 404));

  await deleteFromCloudinary(publicId);
  await Company.findByIdAndUpdate(company._id, { $pull: { gallery: { publicId } } });

  sendSuccess(res, {}, 'Gallery image deleted');
});

// ─── SUBMIT VERIFICATION ─────────────────────────────────────────────────────
exports.submitVerification = asyncHandler(async (req, res, next) => {
  if (!req.files?.length) return next(new AppError('Please upload verification documents.', 400));

  const company = await Company.findOne({ uid: req.user._id });
  if (!company) return next(new AppError('Company not found.', 404));

  const uploadedDocs = await Promise.all(req.files.map((f) => uploadToCloudinary(f, 'verification')));
  const documents = uploadedDocs.map((d) => ({ ...d, uploadedAt: new Date() }));

  await Company.findByIdAndUpdate(company._id, {
    verificationStatus: 'pending',
    verificationDocuments: documents,
  });

  sendSuccess(res, {}, 'Verification documents submitted. Admin will review within 2-3 business days.');
});

// ─── FOLLOW / UNFOLLOW ────────────────────────────────────────────────────────
exports.toggleFollow = asyncHandler(async (req, res, next) => {
  const company = await Company.findById(req.params.id);
  if (!company) return next(new AppError('Company not found.', 404));

  const existing = await Follower.findOne({ followerId: req.user._id, companyId: req.params.id });

  if (existing) {
    await Follower.findByIdAndDelete(existing._id);
    await Company.findByIdAndUpdate(req.params.id, { $inc: { followersCount: -1 } });
    return sendSuccess(res, { following: false }, 'Unfollowed company');
  }

  await Follower.create({ followerId: req.user._id, companyId: req.params.id });
  await Company.findByIdAndUpdate(req.params.id, { $inc: { followersCount: 1 } });

  sendSuccess(res, { following: true }, 'Following company');
});

// ─── GET MY COMPANY ──────────────────────────────────────────────────────────
exports.getMyCompany = asyncHandler(async (req, res, next) => {
  const company = await Company.findOne({ uid: req.user._id });
  if (!company) return next(new AppError('Company profile not found.', 404));
  sendSuccess(res, { company }, 'Company fetched');
});

// ─── ADMIN: VERIFY COMPANY ────────────────────────────────────────────────────
exports.verifyCompany = asyncHandler(async (req, res, next) => {
  const { status, note } = req.body;
  if (!['approved', 'rejected'].includes(status)) return next(new AppError('Invalid status.', 400));

  const company = await Company.findByIdAndUpdate(req.params.id, {
    verificationStatus: status,
    isVerified: status === 'approved',
    verificationNote: note,
  }, { new: true }).populate('uid', 'email firstName');

  if (!company) return next(new AppError('Company not found.', 404));

  const notificationService = require('../services/notification.service');
  await notificationService.create({
    recipientId: company.uid._id,
    type: 'system',
    title: `Company Verification ${status === 'approved' ? 'Approved ✅' : 'Rejected ❌'}`,
    message: note || `Your company verification has been ${status}.`,
    refModel: 'Company',
    refId: company._id,
  });

  sendSuccess(res, { company }, `Company ${status}`);
});

exports.getAllCompaniesAdmin = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  const filter = {};

  if (req.query.status)
    filter.status = req.query.status;

  if (req.query.verificationStatus)
    filter.verificationStatus = req.query.verificationStatus;

  if (req.query.keyword) {
    filter.$or = [
      { name: new RegExp(req.query.keyword, 'i') },
      { email: new RegExp(req.query.keyword, 'i') }
    ];
  }

  const companies = await Company.find(filter)
    .populate('uid', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await Company.countDocuments(filter);

  sendPaginated(res, companies, total, page, limit);
});
