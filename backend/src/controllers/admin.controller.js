const User = require('../models/User.model');
const Job = require('../models/Job.model');
const Company = require('../models/Company.model');
const Resume = require('../models/Resume.model');
const Application = require('../models/Application.model');
const { Invoice, UserPackage } = require('../models/Payment.model');
const { Report, SystemError, ActivityLog } = require('../models/Misc.model');
const { AppError, asyncHandler, sendSuccess, sendPaginated } = require('../utils/AppError');
const { cache } = require('../config/redis');

// ─── DASHBOARD STATS ─────────────────────────────────────────────────────────
exports.getDashboard = asyncHandler(async (req, res) => {
  const cacheKey = 'admin:dashboard';
  const cached = await cache.get(cacheKey);
  if (cached) return sendSuccess(res, cached, 'Dashboard stats');

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [
    totalUsers, newUsersThisMonth, totalJobs, activeJobs,
    pendingJobs, totalCompanies, totalApplications,
    totalRevenue, monthlyRevenue, pendingReports,
    recentUsers, recentJobs,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ createdAt: { $gte: startOfMonth } }),
    Job.countDocuments().setOptions({ includeDeleted: true }),
    Job.countDocuments({ status: 'approved' }),
    Job.countDocuments({ status: 'pending' }),
    Company.countDocuments(),
    Application.countDocuments(),
    Invoice.aggregate([{ $match: { paymentStatus: 'paid' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    Invoice.aggregate([{ $match: { paymentStatus: 'paid', createdAt: { $gte: startOfMonth } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    Report.countDocuments({ status: 'pending' }),
    User.find().sort({ createdAt: -1 }).limit(5).select('firstName lastName email role status createdAt').lean(),
    Job.find({ status: 'pending' }).sort({ createdAt: -1 }).limit(5).populate('uid', 'firstName lastName').lean(),
  ]);

  const data = {
    users: { total: totalUsers, thisMonth: newUsersThisMonth },
    jobs: { total: totalJobs, active: activeJobs, pending: pendingJobs },
    companies: { total: totalCompanies },
    applications: { total: totalApplications },
    revenue: {
      total: totalRevenue[0]?.total || 0,
      thisMonth: monthlyRevenue[0]?.total || 0,
    },
    pendingReports,
    recentUsers,
    recentJobs,
  };

  await cache.set(cacheKey, data, 60);
  sendSuccess(res, data, 'Dashboard stats');
});

// ─── USER MANAGEMENT ─────────────────────────────────────────────────────────
exports.getUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const filter = {};

  if (req.query.role) filter.role = req.query.role;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.search) {
    filter.$or = [
      { firstName: new RegExp(req.query.search, 'i') },
      { lastName: new RegExp(req.query.search, 'i') },
      { email: new RegExp(req.query.search, 'i') },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter).setOptions({ includeDeleted: true })
      .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    User.countDocuments(filter).setOptions({ includeDeleted: true }),
  ]);

  sendPaginated(res, users, total, page, limit);
});

exports.updateUserStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;
  if (!['active', 'suspended', 'banned', 'pending'].includes(status)) {
    return next(new AppError('Invalid status.', 400));
  }

  const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!user) return next(new AppError('User not found.', 404));

  await ActivityLog.create({
    uid: req.params.id,
    performedBy: req.user._id,
    description: `Admin changed user status to ${status}`,
    referenceFor: 'user',
    referenceId: req.params.id,
    ipAddress: req.ip,
  });

  sendSuccess(res, { user }, `User status updated to ${status}`);
});

exports.deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id, {
    isDeleted: true,
    deletedAt: new Date(),
    status: 'banned',
  });
  if (!user) return next(new AppError('User not found.', 404));
  sendSuccess(res, {}, 'User soft-deleted');
});

// ─── JOB MANAGEMENT ──────────────────────────────────────────────────────────
exports.getAllJobs = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  const [jobs, total] = await Promise.all([
    Job.find(filter).setOptions({ includeDeleted: true })
      .populate('uid', 'firstName lastName email')
      .populate('companyId', 'name')
      .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Job.countDocuments(filter).setOptions({ includeDeleted: true }),
  ]);

  sendPaginated(res, jobs, total, page, limit);
});

// ─── REVENUE REPORTS ─────────────────────────────────────────────────────────
exports.getRevenueReport = asyncHandler(async (req, res) => {
  const months = parseInt(req.query.months) || 6;
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const revenue = await Invoice.aggregate([
    { $match: { paymentStatus: 'paid', createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  const byMethod = await Invoice.aggregate([
    { $match: { paymentStatus: 'paid' } },
    { $group: { _id: '$payMethod', total: { $sum: '$amount' }, count: { $sum: 1 } } },
  ]);

  sendSuccess(res, { revenue, byMethod }, 'Revenue report');
});

// ─── REPORTS MANAGEMENT ───────────────────────────────────────────────────────
exports.getReports = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  const [reports, total] = await Promise.all([
    Report.find(filter)
      .populate('reportedBy', 'firstName lastName email')
      .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Report.countDocuments(filter),
  ]);

  sendPaginated(res, reports, total, page, limit);
});

exports.resolveReport = asyncHandler(async (req, res, next) => {
  const report = await Report.findByIdAndUpdate(req.params.id, {
    status: req.body.status,
    reviewedBy: req.user._id,
    reviewNote: req.body.note,
  }, { new: true });

  if (!report) return next(new AppError('Report not found.', 404));
  sendSuccess(res, { report }, 'Report updated');
});

// ─── SYSTEM ERRORS ────────────────────────────────────────────────────────────
exports.getSystemErrors = asyncHandler(async (req, res) => {
  const errors = await SystemError.find({ isView: false }).sort({ createdAt: -1 }).limit(50).lean();
  await SystemError.updateMany({ isView: false }, { isView: true });
  sendSuccess(res, { errors }, 'System errors');
});

// ─── ACTIVITY LOGS ────────────────────────────────────────────────────────────
exports.getActivityLogs = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const filter = {};
  if (req.query.uid) filter.uid = req.query.uid;

  const [logs, total] = await Promise.all([
    ActivityLog.find(filter)
      .populate('uid', 'firstName lastName email')
      .populate('performedBy', 'firstName lastName')
      .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    ActivityLog.countDocuments(filter),
  ]);

  sendPaginated(res, logs, total, page, limit);
});

// ─── PENDING BANK TRANSFERS ───────────────────────────────────────────────────
exports.getPendingBankTransfers = asyncHandler(async (req, res) => {
  const transfers = await Invoice.find({ payMethod: 'bank', paymentStatus: 'pending' })
    .populate('uid', 'firstName lastName email')
    .sort({ createdAt: -1 }).lean();

  sendSuccess(res, { transfers }, 'Pending bank transfers');
});

exports.getInvoices = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  const filter = {};

  if (req.query.paymentStatus) {
    filter.paymentStatus = req.query.paymentStatus;
  }

  if (req.query.payMethod) {
    filter.payMethod = req.query.payMethod;
  }

  const [invoices, total] = await Promise.all([
    Invoice.find(filter)
      .populate('uid', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),

    Invoice.countDocuments(filter)
  ]);

  sendPaginated(res, invoices, total, page, limit);
});