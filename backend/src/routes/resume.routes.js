const express = require('express');
const router = express.Router();
const { protect, jobseekerOnly, employerOnly, adminOnly, optionalAuth } = require('../middleware/auth.middleware');
const { asyncHandler, sendSuccess, sendPaginated, AppError } = require('../utils/AppError');
const Resume = require('../models/Resume.model');
const { uploadFile } = require('../services/cloudinary.service');
const { uploadToCloudinary, deleteFromCloudinary } = require('../services/cloudinary.service');
const { cache } = require('../config/redis');

router.get('/', protect, employerOnly, asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);
  const skip = (page - 1) * limit;
  const filter = { published: true, searchable: true, isDeleted: false };
  if (req.query.keyword) filter.$text = { $search: req.query.keyword };
  if (req.query.category) filter.jobCategory = req.query.category;
  if (req.query.jobType) filter.jobType = req.query.jobType;
  if (req.query.visibility) filter.visibility = req.query.visibility;
  const [resumes, total] = await Promise.all([
    Resume.find(filter)
      .select('-aiResumeSearchText -aiResumeSearchDescription')
      .populate('uid', 'firstName lastName avatar city')
      .populate('jobCategory', 'catTitle')
      .populate('jobType', 'title')
      .sort({ isFeaturedResume: -1, createdAt: -1 })
      .skip(skip).limit(limit).lean(),
    Resume.countDocuments(filter),
  ]);
  sendPaginated(res, resumes, total, page, limit);
}));

// ─── GET MY RESUMES (Jobseeker) ───────────────────────────────────────────────
router.get('/my', protect, asyncHandler(async (req, res) => {
  const resumes = await Resume.find({ uid: req.user._id })
    .populate('jobCategory', 'catTitle')
    .populate('jobType', 'title')
    .sort({ createdAt: -1 }).lean();

  sendSuccess(res, { resumes }, 'Resumes fetched');
}));

// ─── GET SINGLE RESUME ────────────────────────────────────────────────────────
router.get('/:id', optionalAuth, asyncHandler(async (req, res, next) => {
  const resume = await Resume.findById(req.params.id)
    .populate('uid', 'firstName lastName avatar email phone city')
    .populate('jobCategory', 'catTitle')
    .populate('jobType', 'title');

  if (!resume) return next(new AppError('Resume not found.', 404));

  // Check visibility
  const isOwner = req.user && resume.uid._id.toString() === req.user._id.toString();
  const isEmployer = req.user && ['employer', 'admin', 'superadmin'].includes(req.user.role);

  if (resume.visibility === 'private' && !isOwner && !['admin', 'superadmin'].includes(req.user?.role)) {
    return next(new AppError('This resume is private.', 403));
  }

  // Increment views (not for owner)
  if (!isOwner) {
    await Resume.findByIdAndUpdate(req.params.id, { $inc: { viewsCount: 1, hits: 1 } });
  }

  sendSuccess(res, { resume }, 'Resume fetched');
}));

// ─── GET RESUME BY SHARE TOKEN ────────────────────────────────────────────────
router.get('/share/:token', asyncHandler(async (req, res, next) => {
  const resume = await Resume.findOne({ shareToken: req.params.token })
    .populate('uid', 'firstName lastName avatar city');

  if (!resume) return next(new AppError('Resume not found or link expired.', 404));

  sendSuccess(res, { resume }, 'Resume fetched');
}));

// ─── CREATE RESUME ────────────────────────────────────────────────────────────
router.post('/', protect, jobseekerOnly, asyncHandler(async (req, res, next) => {
  // Check package
  const { UserPackage } = require('../models/Payment.model');
  const pkg = await UserPackage.findOne({
    uid: req.user._id, status: true, isActive: true, endDate: { $gt: new Date() }
  });

  if (!pkg || pkg.remainingResumes <= 0) {
    return next(new AppError('You have reached your resume limit. Please upgrade your package.', 403));
  }

  const resume = await Resume.create({
    ...req.body,
    uid: req.user._id,
    status: 1,
  });

  // Deduct quota
  await UserPackage.findByIdAndUpdate(pkg._id, { $inc: { remainingResumes: -1 } });

  sendSuccess(res, { resume }, 'Resume created successfully', 201);
}));

// ─── UPDATE RESUME ────────────────────────────────────────────────────────────
router.patch('/:id', protect, asyncHandler(async (req, res, next) => {
  const resume = await Resume.findById(req.params.id);

  if (!resume) return next(new AppError('Resume not found.', 404));
  if (resume.uid.toString() !== req.user._id.toString() && !['admin', 'superadmin'].includes(req.user.role)) {
    return next(new AppError('Not authorized.', 403));
  }

  // Calculate completion percentage
  const fields = ['applicationTitle', 'firstName', 'lastName', 'emailAddress', 'cell', 'photo'];
  const completedFields = fields.filter(f => req.body[f] || resume[f]);
  const hasEmployers = (req.body.employers || resume.employers)?.length > 0;
  const hasInstitutes = (req.body.institutes || resume.institutes)?.length > 0;
  const hasSkills = req.body.skills || resume.skills;
  const completionPercentage = Math.round(
    (completedFields.length / fields.length) * 50 +
    (hasEmployers ? 20 : 0) +
    (hasInstitutes ? 20 : 0) +
    (hasSkills ? 10 : 0)
  );

  const updated = await Resume.findByIdAndUpdate(
    req.params.id,
    { ...req.body, completionPercentage },
    { new: true, runValidators: true }
  );

  sendSuccess(res, { resume: updated }, 'Resume updated');
}));

// ─── DELETE RESUME (SOFT) ─────────────────────────────────────────────────────
router.delete('/:id', protect, asyncHandler(async (req, res, next) => {
  const resume = await Resume.findById(req.params.id);

  if (!resume) return next(new AppError('Resume not found.', 404));
  if (resume.uid.toString() !== req.user._id.toString() && !['admin', 'superadmin'].includes(req.user.role)) {
    return next(new AppError('Not authorized.', 403));
  }

  await Resume.findByIdAndUpdate(req.params.id, {
    isDeleted: true,
    deletedAt: new Date(),
    published: false,
    searchable: false,
  });

  sendSuccess(res, {}, 'Resume deleted');
}));

// ─── UPLOAD RESUME FILE ───────────────────────────────────────────────────────
router.post('/:id/upload', protect, uploadFile.single('file'), asyncHandler(async (req, res, next) => {
  if (!req.file) return next(new AppError('No file uploaded.', 400));

  const resume = await Resume.findOne({ _id: req.params.id, uid: req.user._id });
  if (!resume) return next(new AppError('Resume not found.', 404));

  const result = await uploadToCloudinary(req.file, 'resume');

  await Resume.findByIdAndUpdate(req.params.id, {
    $push: {
      files: {
        publicId: result.publicId,
        secureUrl: result.secureUrl,
        filename: req.file.originalname,
        filetype: result.fileType,
        filesize: result.fileSize,
      }
    }
  });

  sendSuccess(res, { file: result }, 'File uploaded');
}));

// ─── DELETE RESUME FILE ────────────────────────────────────────────────────────
router.delete('/:id/files/:publicId', protect, asyncHandler(async (req, res, next) => {
  const resume = await Resume.findOne({ _id: req.params.id, uid: req.user._id });
  if (!resume) return next(new AppError('Resume not found.', 404));

  const publicId = decodeURIComponent(req.params.publicId);
  await deleteFromCloudinary(publicId);

  await Resume.findByIdAndUpdate(req.params.id, {
    $pull: { files: { publicId } }
  });

  sendSuccess(res, {}, 'File deleted');
}));

// ─── TOGGLE VISIBILITY ────────────────────────────────────────────────────────
router.patch('/:id/visibility', protect, asyncHandler(async (req, res, next) => {
  const { visibility, searchable } = req.body;

  const resume = await Resume.findOneAndUpdate(
    { _id: req.params.id, uid: req.user._id },
    { ...(visibility && { visibility }), ...(searchable !== undefined && { searchable }) },
    { new: true }
  );

  if (!resume) return next(new AppError('Resume not found.', 404));

  sendSuccess(res, { resume }, 'Visibility updated');
}));

// ─── GENERATE SHARE LINK ──────────────────────────────────────────────────────
router.post('/:id/share', protect, asyncHandler(async (req, res, next) => {
  const crypto = require('crypto');
  const shareToken = crypto.randomBytes(20).toString('hex');

  const resume = await Resume.findOneAndUpdate(
    { _id: req.params.id, uid: req.user._id },
    { shareToken },
    { new: true }
  );

  if (!resume) return next(new AppError('Resume not found.', 404));

  const shareUrl = `${process.env.CLIENT_URL}/resume/share/${shareToken}`;
  sendSuccess(res, { shareUrl, shareToken }, 'Share link generated');
}));

// ─── TOGGLE FEATURED (Admin) ──────────────────────────────────────────────────
router.patch('/:id/feature', protect, asyncHandler(async (req, res, next) => {
  const resume = await Resume.findById(req.params.id);
  if (!resume) return next(new AppError('Resume not found.', 404));

  // Employer can feature via package, admin can always feature
  const isFeaturedResume = !resume.isFeaturedResume;
  const update = {
    isFeaturedResume,
    startFeaturedDate: isFeaturedResume ? new Date() : null,
    endfeatureddate: isFeaturedResume ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
  };

  const updated = await Resume.findByIdAndUpdate(req.params.id, update, { new: true });
  sendSuccess(res, { resume: updated }, `Resume ${isFeaturedResume ? 'featured' : 'unfeatured'}`);
}));

module.exports = router;
