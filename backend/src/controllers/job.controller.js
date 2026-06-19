const Job = require('../models/Job.model');
const Company = require('../models/Company.model');
const User = require('../models/User.model');
const Application = require('../models/Application.model');
const slugify = require('slugify');
const { UserPackage } = require('../models/Payment.model');
const { ActivityLog, JobShortlist } = require('../models/Misc.model');
const { AppError, asyncHandler, sendSuccess, sendPaginated } = require('../utils/AppError');
const { cache } = require('../config/redis');
const notificationService = require('../services/notification.service');
const emailService = require('../services/email.service');

// ─── BUILD QUERY HELPER ──────────────────────────────────────────────────────
const buildJobQuery = (query) => {
  const filter = { status: 'approved', isDeleted: false };

  if (query.keyword) filter.$text = { $search: query.keyword };
  if (query.category) filter.categoryId = query.category;
  if (query.subcategory) filter.subcategoryId = query.subcategory;
  if (query.jobType) filter.jobType = query.jobType;
  if (query.city) filter.city = new RegExp(query.city, 'i');
  if (query.country) filter.country = new RegExp(query.country, 'i');
  if (query.workplaceType) filter.workplaceType = query.workplaceType;
  if (query.isUrgent) filter.isUrgent = true;
  if (query.company) filter.companyId = query.company;
    if (
    query.experience !== undefined &&
    query.experience !== '' &&
    !isNaN(query.experience)
  ) {
    filter.experience = {
      $lte: Number(query.experience)
    };
  }
  if (query.tags) filter.tags = { $in: Array.isArray(query.tags) ? query.tags : [query.tags] };

  if (query.salaryMin || query.salaryMax) {
    filter.salaryMin = {};
    if (query.salaryMin) filter.salaryMin.$gte = parseFloat(query.salaryMin);
    if (query.salaryMax) filter.salaryMax = { $lte: parseFloat(query.salaryMax) };
  }

  // Expiry check
  filter.$or = [{ expiresAt: { $gt: new Date() } }, { expiresAt: null }];

  return filter;
};

// ─── GET ALL JOBS (PUBLIC) ────────────────────────────────────────────────────
exports.getJobs = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);
  const skip = (page - 1) * limit;

  // Cache key
  const cacheKey = `jobs:list:${JSON.stringify(req.query)}`;
  const cached = await cache.get(cacheKey);
  if (cached) return sendPaginated(res, cached.jobs, cached.total, page, limit);

  const filter = buildJobQuery(req.query);

  // Sort
  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    salary_high: { salaryMax: -1 },
    salary_low: { salaryMin: 1 },
    relevance: { score: { $meta: 'textScore' }, isFeaturedJob: -1, isGoldJob: -1, createdAt: -1 },
  };
  const sort = sortMap[req.query.sort] || { isFeaturedJob: -1, isGoldJob: -1, isUrgent: -1, createdAt: -1 };

  const [jobs, total] = await Promise.all([
    Job.find(filter)
      .populate('companyId', 'name logo slug isVerified city')
      .populate('categoryId', 'catTitle')
      .populate('jobType', 'title color')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Job.countDocuments(filter),
  ]);

  await cache.set(cacheKey, { jobs, total }, 120);

  sendPaginated(res, jobs, total, page, limit);
});

// ─── GET SINGLE JOB ──────────────────────────────────────────────────────────
exports.getJob = asyncHandler(async (req, res, next) => {
  const identifier = req.params.id;
  const filter = identifier.match(/^[0-9a-fA-F]{24}$/)
    ? { _id: identifier }
    : { slug: identifier };

  let query = { ...filter }
  if (!req.user || req.user.role === 'jobseeker') {
    query.status = 'approved'
  }
  const job = await Job.findOne(query)
    .populate('companyId', 'name logo slug isVerified city description socialLinks followersCount')
    .populate('categoryId', 'catTitle alias')
    .populate('subcategoryId', 'catTitle alias')
    .populate('jobType', 'title color')
    .populate('careerLevel', 'title')
    .populate('educationId', 'title')
    .populate('departmentId', 'name');

  if (!job) return next(new AppError('Job not found.', 404));

  // Increment views
  await Job.findByIdAndUpdate(job._id, { $inc: { viewsCount: 1, hits: 1 } });

  // Check if job is shortlisted by current user
  let isShortlisted = false;
  if (req.user) {
    const shortlist = await JobShortlist.findOne({ uid: req.user._id, jobId: job._id, status: true });
    isShortlisted = !!shortlist;
  }

  // Similar jobs
  const similarJobs = await Job.find({
    _id: { $ne: job._id },
    categoryId: job.categoryId,
    status: 'approved',
    $or: [{ expiresAt: { $gt: new Date() } }, { expiresAt: null }],
  })
    .populate('companyId', 'name logo')
    .limit(5)
    .lean();

  sendSuccess(res, { job, isShortlisted, similarJobs }, 'Job fetched');
});

// ─── CREATE JOB ───────────────────────────────────────────────────────────────
exports.createJob = asyncHandler(async (req, res, next) => {
  const pkg = await UserPackage.findOne({ 
    uid: req.user._id, status: true, isActive: true, endDate: { $gt: new Date() } 
  });

  if (!pkg || (pkg.remainingJobs !== -1 && pkg.remainingJobs <= 0)) {
    return next(new AppError('You have reached your job posting limit. Please upgrade your package.', 403));
  }

  // ── AUTO-ATTACH COMPANY ───────────────────────────────────────
  const Company = require('../models/Company.model');
  const company = await Company.findOne({ uid: req.user._id });
  // ─────────────────────────────────────────────────────────────

  const jobData = {
    ...req.body,
    uid: req.user._id,
    companyId: company?._id || req.body.companyId,  // ← auto attach
    company:   company?.name || req.body.company,    // ← legacy field
    status: req.user.role === 'admin' ? 'approved' : 'pending',
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    userpackageId: pkg._id,
  };

  const job = await Job.create(jobData);

  if (pkg.remainingJobs !== -1) {
    await UserPackage.findByIdAndUpdate(pkg._id, { $inc: { remainingJobs: -1 } });
  }

  await ActivityLog.create({
    uid: req.user._id,
    description: `Created job: ${job.title}`,
    referenceFor: 'job',
    referenceId: job._id,
    ipAddress: req.ip,
  });

  await cache.delPattern('jobs:list:*');

  sendSuccess(res, { job }, 'Job created successfully. Pending review.', 201);
});

// ─── UPDATE JOB ───────────────────────────────────────────────────────────────
exports.updateJob = asyncHandler(async (req, res, next) => {
  const job = await Job.findById(req.params.id);

  if (!job) return next(new AppError('Job not found.', 404));

  if (job.uid.toString() !== req.user._id.toString() && !['admin', 'superadmin'].includes(req.user.role)) {
    return next(new AppError('You are not authorized to update this job.', 403));
  }

  if (!['admin', 'superadmin'].includes(req.user.role)) {
    if (req.body.status && req.body.status !== 'pending' && req.body.status !== 'draft') {
      delete req.body.status;
    }
  }

  const updatedJob = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

  await cache.delPattern('jobs:list:*');
  await cache.del(`job:${job.slug}`);

  sendSuccess(res, { job: updatedJob }, 'Job updated');
});

// ─── DELETE JOB (SOFT) ────────────────────────────────────────────────────────
exports.deleteJob = asyncHandler(async (req, res, next) => {
  const job = await Job.findById(req.params.id);

  if (!job) return next(new AppError('Job not found.', 404));

  if (job.uid.toString() !== req.user._id.toString() && !['admin', 'superadmin'].includes(req.user.role)) {
    return next(new AppError('You are not authorized to delete this job.', 403));
  }

  await Job.findByIdAndUpdate(req.params.id, { isDeleted: true, deletedAt: new Date(), status: 'deleted' });

  await cache.delPattern('jobs:list:*');

  sendSuccess(res, {}, 'Job deleted');
});

// ─── MY JOBS (EMPLOYER) ───────────────────────────────────────────────────────
exports.getMyJobs = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const filter = { uid: req.user._id };
  if (req.query.status) filter.status = req.query.status;

  const [jobs, total] = await Promise.all([
    Job.find(filter).setOptions({ includeDeleted: false })
      .populate('categoryId', 'catTitle')
      .populate('jobType', 'title')
      .sort({ createdAt: -1 })
      .skip(skip).limit(limit).lean(),
    Job.countDocuments(filter),
  ]);

  sendPaginated(res, jobs, total, page, limit);
});

// ─── TOGGLE SHORTLIST ─────────────────────────────────────────────────────────
exports.toggleShortlist = asyncHandler(async (req, res, next) => {
  const job = await Job.findById(req.params.id);
  if (!job) return next(new AppError('Job not found.', 404));

  const existing = await JobShortlist.findOne({ uid: req.user._id, jobId: req.params.id });

  if (existing) {
    await JobShortlist.findByIdAndDelete(existing._id);
    return sendSuccess(res, { shortlisted: false }, 'Job removed from shortlist');
  }

  await JobShortlist.create({
    uid: req.user._id,
    jobId: req.params.id,
    status: true,
  });

  sendSuccess(res, { shortlisted: true }, 'Job added to shortlist');
});

// ─── GET SHORTLISTED JOBS ────────────────────────────────────────────────────
exports.getShortlistedJobs = asyncHandler(async (req, res, next) => {
  const shortlists = await JobShortlist.find({ uid: req.user._id, status: true })
    .populate({ path: 'jobId', populate: { path: 'companyId', select: 'name logo' } })
    .sort({ createdAt: -1 });

  const jobs = shortlists.map((s) => s.jobId).filter(Boolean);
  sendSuccess(res, { jobs }, 'Shortlisted jobs');
});

// ─── FEATURED JOBS ────────────────────────────────────────────────────────────
exports.getFeaturedJobs = asyncHandler(async (req, res, next) => {
  const jobs = await Job.find({
    status: 'approved',
    isFeaturedJob: true,
    endfeatureddate: { $gt: new Date() },
    $or: [{ expiresAt: { $gt: new Date() } }, { expiresAt: null }],
  })
    .populate('companyId', 'name logo city')
    .populate('jobType', 'title color')
    .limit(parseInt(req.query.limit) || 8)
    .lean();

  sendSuccess(res, { jobs }, 'Featured jobs');
});

// ─── ADMIN: MODERATE JOB ─────────────────────────────────────────────────────
exports.moderateJob = asyncHandler(async (req, res, next) => {
  const { status, note } = req.body;

  if (!['approved', 'rejected', 'paused'].includes(status)) {
    return next(new AppError('Invalid status.', 400));
  }

  const job = await Job.findByIdAndUpdate(
    req.params.id,
    { status, moderationNote: note },
    { new: true }
  ).populate('uid', 'email firstName');

  if (!job) return next(new AppError('Job not found.', 404));

  // Notify employer
  if (job.uid) {
    await notificationService.create({
      recipientId: job.uid._id,
      type: status === 'approved' ? 'system' : 'system',
      title: `Your job "${job.title}" has been ${status}`,
      message: note || `Your job posting has been ${status} by admin.`,
      refModel: 'Job',
      refId: job._id,
    });

    // Email — employer needs to know whether their job is live or not
    try {
      await emailService.sendJobModerationUpdate(job.uid, job, status, note);
    } catch { /* silent */ }
  }

  sendSuccess(res, { job }, `Job ${status}`);
});

// ─── JOB ANALYTICS ───────────────────────────────────────────────────────────
exports.getJobAnalytics = asyncHandler(async (req, res, next) => {
  const job = await Job.findOne({ _id: req.params.id, uid: req.user._id });
  if (!job) return next(new AppError('Job not found.', 404));

  const Application = require('../models/Application.model');
  const stats = await Application.aggregate([
    { $match: { jobId: job._id } },
    { $group: {
      _id: '$status',
      count: { $sum: 1 },
    }},
  ]);

  sendSuccess(res, {
    viewsCount: job.viewsCount,
    applicationsCount: job.applicationsCount,
    statusBreakdown: stats,
  }, 'Job analytics');
});

exports.getPublicStats = asyncHandler(async (req, res) => {
  const [totalJobs, totalCompanies, totalUsers, totalApplications] =
    await Promise.all([
      Job.countDocuments({ status: 'approved' }),
      Company.countDocuments({}),
      User.countDocuments({ role: 'jobseeker' }),
      Application.countDocuments({})
    ])

  res.status(200).json({
    success: true,
    data: {
      totalJobs,
      totalCompanies,
      totalUsers,
      totalApplications
    }
  })
})

exports.createCategory = asyncHandler(async (req, res) => {
  const category = await Category.create({
    catTitle: req.body.catTitle,
    alias:
      req.body.alias ||
      slugify(req.body.catTitle, {
        lower: true,
        strict: true,
      }),
  });

  sendSuccess(res, { category }, 'Category created');
});