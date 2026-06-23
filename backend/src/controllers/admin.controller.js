const User        = require('../models/User.model');
const Job         = require('../models/Job.model');
const Company     = require('../models/Company.model');
const Resume      = require('../models/Resume.model');
const Application = require('../models/Application.model');
const Package     = require('../models/Package.model');
const { Invoice, UserPackage, TransactionLog } = require('../models/Payment.model');
const { Report, SystemError, ActivityLog, Setting, Category, JobType, CareerLevel, Education } = require('../models/Misc.model');
const { AppError, asyncHandler, sendSuccess, sendPaginated } = require('../utils/AppError');
const { cache }        = require('../config/redis');
const emailService     = require('../services/email.service');
const notificationService = require('../services/notification.service');
const logger           = require('../config/logger');

// ══════════════════════════════════════════════════════════════════════════════
//  SHARED  (admin + superadmin)
// ══════════════════════════════════════════════════════════════════════════════

// ─── DASHBOARD STATS ─────────────────────────────────────────────────────────
exports.getDashboard = asyncHandler(async (req, res) => {
  const cacheKey = 'admin:dashboard';
  const cached   = await cache.get(cacheKey);
  if (cached) return sendSuccess(res, cached, 'Dashboard stats');

  const now           = new Date();
  const startOfMonth  = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalUsers, newUsersThisMonth,
    totalJobs, activeJobs, pendingJobs,
    totalCompanies, pendingCompanies,
    totalApplications,
    totalRevenue, monthlyRevenue,
    pendingReports,
    recentUsers, recentJobs,
    totalResumes,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ createdAt: { $gte: startOfMonth } }),
    Job.countDocuments().setOptions({ includeDeleted: true }),
    Job.countDocuments({ status: 'approved' }),
    Job.countDocuments({ status: 'pending' }),
    Company.countDocuments(),
    Company.countDocuments({ verificationStatus: 'pending' }),
    Application.countDocuments(),
    Invoice.aggregate([{ $match: { paymentStatus: 'paid' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    Invoice.aggregate([{ $match: { paymentStatus: 'paid', createdAt: { $gte: startOfMonth } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    Report.countDocuments({ status: 'pending' }),
    User.find().sort({ createdAt: -1 }).limit(5).select('firstName lastName email role status avatar createdAt').lean(),
    Job.find({ status: 'pending' }).sort({ createdAt: -1 }).limit(5)
      .populate('uid', 'firstName lastName')
      .populate('companyId', 'name logo')
      .lean(),
    Resume.countDocuments({ isDeleted: false }),
  ]);

  const data = {
    users:        { total: totalUsers, thisMonth: newUsersThisMonth },
    jobs:         { total: totalJobs, active: activeJobs, pending: pendingJobs },
    companies:    { total: totalCompanies, pendingVerification: pendingCompanies },
    applications: { total: totalApplications },
    resumes:      { total: totalResumes },
    revenue: {
      total:      totalRevenue[0]?.total   || 0,
      thisMonth:  monthlyRevenue[0]?.total || 0,
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
  const page  = parseInt(req.query.page)  || 1;
  const limit = parseInt(req.query.limit) || 20;
  const filter = {};

  if (req.query.role)   filter.role   = req.query.role;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.search) {
    filter.$or = [
      { firstName: new RegExp(req.query.search, 'i') },
      { lastName:  new RegExp(req.query.search, 'i') },
      { email:     new RegExp(req.query.search, 'i') },
    ];
  }

  // Regular admin CANNOT see other admins or superadmins
  if (req.user.role === 'admin') {
    filter.role = { $nin: ['admin', 'superadmin'] };
  }

  const [users, total] = await Promise.all([
    User.find(filter).setOptions({ includeDeleted: true })
      .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit)
      .select('-password -passwordResetToken -emailVerificationToken -twoFactorSecret')
      .lean(),
    User.countDocuments(filter).setOptions({ includeDeleted: true }),
  ]);

  sendPaginated(res, users, total, page, limit);
});

exports.getUserById = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id)
    .setOptions({ includeDeleted: true })
    .select('-password -passwordResetToken -emailVerificationToken -twoFactorSecret')
    .lean();
  if (!user) return next(new AppError('User not found.', 404));

  // Admin cannot view superadmin profiles
  if (req.user.role === 'admin' && ['admin', 'superadmin'].includes(user.role)) {
    return next(new AppError('Not authorized to view this user.', 403));
  }

  // Get user's package info
  const activePackage = await UserPackage.findOne({ uid: user._id, isActive: true, endDate: { $gt: new Date() } })
    .populate('packageId', 'title packageFor price').lean();

  sendSuccess(res, { user, activePackage }, 'User fetched');
});

exports.updateUserStatus = asyncHandler(async (req, res, next) => {
  const { status, reason } = req.body;
  if (!['active', 'suspended', 'banned', 'pending'].includes(status)) {
    return next(new AppError('Invalid status.', 400));
  }

  const target = await User.findById(req.params.id);
  if (!target) return next(new AppError('User not found.', 404));

  // Admin cannot change status of other admins / superadmins
  if (req.user.role === 'admin' && ['admin', 'superadmin'].includes(target.role)) {
    return next(new AppError('Not authorized to modify admin accounts.', 403));
  }

  const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true });

  await ActivityLog.create({
    uid: req.params.id,
    performedBy: req.user._id,
    description: `${req.user.role} changed user status to ${status}`,
    action: 'user_status_change',
    referenceFor: 'User',
    referenceId: req.params.id,
    ipAddress: req.ip,
  });

  try {
    await emailService.sendAccountStatusUpdate(user, status, reason);
  } catch { /* silent */ }

  sendSuccess(res, { user }, `User status updated to ${status}`);
});

exports.deleteUser = asyncHandler(async (req, res, next) => {
  const target = await User.findById(req.params.id);
  if (!target) return next(new AppError('User not found.', 404));

  // Admin cannot delete other admins / superadmins
  if (req.user.role === 'admin' && ['admin', 'superadmin'].includes(target.role)) {
    return next(new AppError('Not authorized to delete admin accounts.', 403));
  }

  await User.findByIdAndUpdate(req.params.id, {
    isDeleted: true,
    deletedAt: new Date(),
    status: 'banned',
  });

  await ActivityLog.create({
    uid: req.params.id,
    performedBy: req.user._id,
    description: `${req.user.role} soft-deleted user: ${target.email}`,
    action: 'user_delete',
    referenceFor: 'User',
    referenceId: req.params.id,
    ipAddress: req.ip,
  });

  sendSuccess(res, {}, 'User soft-deleted');
});

// ─── JOB MANAGEMENT ──────────────────────────────────────────────────────────
exports.getAllJobs = asyncHandler(async (req, res) => {
  const page  = parseInt(req.query.page)  || 1;
  const limit = parseInt(req.query.limit) || 20;
  const filter = {};
  if (req.query.status)    filter.status    = req.query.status;
  if (req.query.companyId) filter.companyId = req.query.companyId;
  if (req.query.search)    filter.$or = [
    { title: new RegExp(req.query.search, 'i') },
  ];

  const [jobs, total] = await Promise.all([
    Job.find(filter).setOptions({ includeDeleted: true })
      .populate('uid',       'firstName lastName email')
      .populate('companyId', 'name logo')
      .populate('categoryId','catTitle')
      .populate('jobType',   'title color')
      .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Job.countDocuments(filter).setOptions({ includeDeleted: true }),
  ]);

  sendPaginated(res, jobs, total, page, limit);
});

// ─── REPORTS MANAGEMENT ───────────────────────────────────────────────────────
exports.getReports = asyncHandler(async (req, res) => {
  const page  = parseInt(req.query.page)  || 1;
  const limit = parseInt(req.query.limit) || 20;
  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  const [reports, total] = await Promise.all([
    Report.find(filter)
      .populate('reportedBy', 'firstName lastName email avatar')
      .populate('reviewedBy', 'firstName lastName')
      .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Report.countDocuments(filter),
  ]);

  sendPaginated(res, reports, total, page, limit);
});

exports.resolveReport = asyncHandler(async (req, res, next) => {
  const { status, note } = req.body;
  if (!['reviewed', 'resolved', 'dismissed'].includes(status)) {
    return next(new AppError('Invalid status.', 400));
  }

  const report = await Report.findByIdAndUpdate(req.params.id, {
    status,
    reviewedBy: req.user._id,
    reviewNote: note,
  }, { new: true });

  if (!report) return next(new AppError('Report not found.', 404));

  await ActivityLog.create({
    uid: req.user._id,
    performedBy: req.user._id,
    description: `Report ${status} by ${req.user.role}`,
    action: 'report_resolve',
    referenceFor: 'Report',
    referenceId: report._id,
    ipAddress: req.ip,
  });

  sendSuccess(res, { report }, 'Report updated');
});

// ─── ACTIVITY LOGS ────────────────────────────────────────────────────────────
exports.getActivityLogs = asyncHandler(async (req, res) => {
  const page  = parseInt(req.query.page)  || 1;
  const limit = parseInt(req.query.limit) || 50;
  const filter = {};
  if (req.query.uid)    filter.uid    = req.query.uid;
  if (req.query.action) filter.action = req.query.action;

  const [logs, total] = await Promise.all([
    ActivityLog.find(filter)
      .populate('uid',         'firstName lastName email role')
      .populate('performedBy', 'firstName lastName role')
      .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    ActivityLog.countDocuments(filter),
  ]);

  sendPaginated(res, logs, total, page, limit);
});

// ─── INVOICES ─────────────────────────────────────────────────────────────────
exports.getInvoices = asyncHandler(async (req, res) => {
  const page  = parseInt(req.query.page)  || 1;
  const limit = parseInt(req.query.limit) || 20;
  const filter = {};
  if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;
  if (req.query.payMethod)     filter.payMethod     = req.query.payMethod;

  const [invoices, total] = await Promise.all([
    Invoice.find(filter)
      .populate('uid', 'firstName lastName email avatar')
      .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Invoice.countDocuments(filter),
  ]);

  sendPaginated(res, invoices, total, page, limit);
});

// ─── PENDING BANK TRANSFERS ───────────────────────────────────────────────────
exports.getPendingBankTransfers = asyncHandler(async (req, res) => {
  const transfers = await Invoice.find({ payMethod: 'bank', paymentStatus: 'pending' })
    .populate('uid', 'firstName lastName email avatar')
    .sort({ createdAt: -1 }).lean();

  sendSuccess(res, { transfers }, 'Pending bank transfers');
});

// ─── BANK DETAILS (public read) ───────────────────────────────────────────────
exports.getBankDetails = asyncHandler(async (req, res) => {
  const setting = await Setting.findOne({ key: 'bank_details' });
  sendSuccess(res, { bank: setting?.value || null }, 'Bank details');
});

// ─── USER PACKAGES ────────────────────────────────────────────────────────────
exports.getUserPackages = asyncHandler(async (req, res) => {
  const page  = parseInt(req.query.page)  || 1;
  const limit = parseInt(req.query.limit) || 20;
  const filter = {};
  if (req.query.uid)      filter.uid      = req.query.uid;
  if (req.query.isActive) filter.isActive = req.query.isActive === 'true';

  const [packages, total] = await Promise.all([
    UserPackage.find(filter)
      .populate('uid',       'firstName lastName email role')
      .populate('packageId', 'title packageFor price')
      .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    UserPackage.countDocuments(filter),
  ]);

  sendPaginated(res, packages, total, page, limit);
});

// ═══════════════════════════════════════════════════════════════════════════════
//  SUPERADMIN ONLY
// ═══════════════════════════════════════════════════════════════════════════════

// ─── REVENUE REPORT ──────────────────────────────────────────────────────────
exports.getRevenueReport = asyncHandler(async (req, res) => {
  const months    = parseInt(req.query.months) || 6;
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const [revenue, byMethod, byPackage, refunds] = await Promise.all([
    Invoice.aggregate([
      { $match: { paymentStatus: 'paid', createdAt: { $gte: startDate } } },
      {
        $group: {
          _id:   { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
    Invoice.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: '$payMethod', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    Invoice.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $lookup: { from: 'packages', localField: 'recordId', foreignField: '_id', as: 'pkg' } },
      { $unwind: { path: '$pkg', preserveNullAndEmptyArrays: true } },
      { $group: { _id: '$pkg.title', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]),
    Invoice.aggregate([
      { $match: { refundStatus: { $in: ['requested', 'refunded'] } } },
      { $group: { _id: '$refundStatus', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
  ]);

  sendSuccess(res, { revenue, byMethod, byPackage, refunds }, 'Revenue report');
});

// ─── SYSTEM ERRORS ────────────────────────────────────────────────────────────
exports.getSystemErrors = asyncHandler(async (req, res) => {
  const errors = await SystemError.find({ isView: false })
    .populate('uid', 'firstName lastName email')
    .sort({ createdAt: -1 }).limit(50).lean();
  await SystemError.updateMany({ isView: false }, { isView: true });
  sendSuccess(res, { errors }, 'System errors');
});

exports.getAllSystemErrors = asyncHandler(async (req, res) => {
  const page  = parseInt(req.query.page)  || 1;
  const limit = parseInt(req.query.limit) || 30;

  const [errors, total] = await Promise.all([
    SystemError.find()
      .populate('uid', 'firstName lastName email')
      .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    SystemError.countDocuments(),
  ]);

  sendPaginated(res, errors, total, page, limit);
});

// ─── ADMIN MANAGEMENT (superadmin only) ──────────────────────────────────────
exports.getAdmins = asyncHandler(async (req, res) => {
  const admins = await User.find({ role: { $in: ['admin', 'superadmin'] } })
    .select('-password -passwordResetToken -emailVerificationToken -twoFactorSecret')
    .sort({ createdAt: -1 }).lean();
  sendSuccess(res, { admins }, 'Admins fetched');
});

exports.createAdmin = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, email, password, role = 'admin' } = req.body;

  // Only superadmin can create admins — and cannot create another superadmin via API
  if (role === 'superadmin') {
    return next(new AppError('Cannot create another superadmin via API.', 403));
  }
  if (!['admin'].includes(role)) {
    return next(new AppError('Invalid role for admin creation.', 400));
  }

  const existing = await User.findOne({ email }).setOptions({ includeDeleted: true });
  if (existing) return next(new AppError('An account with this email already exists.', 409));

  const admin = await User.create({
    firstName, lastName, email, password,
    role,
    status: 'active',
    isVerified: true,
    isEmailVerified: true,
    profileCompleted: 100,
  });

  await ActivityLog.create({
    uid: admin._id,
    performedBy: req.user._id,
    description: `Superadmin created new admin: ${email}`,
    action: 'admin_create',
    referenceFor: 'User',
    referenceId: admin._id,
    ipAddress: req.ip,
  });

  sendSuccess(res, { admin: admin.toPublicJSON() }, 'Admin created successfully', 201);
});

exports.updateAdminStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;
  if (!['active', 'suspended', 'banned'].includes(status)) {
    return next(new AppError('Invalid status.', 400));
  }

  const target = await User.findById(req.params.id);
  if (!target) return next(new AppError('Admin not found.', 404));

  // Cannot change your own status
  if (target._id.toString() === req.user._id.toString()) {
    return next(new AppError('You cannot change your own status.', 400));
  }

  await User.findByIdAndUpdate(req.params.id, { status });

  await ActivityLog.create({
    uid: req.params.id,
    performedBy: req.user._id,
    description: `Superadmin changed admin status to ${status}: ${target.email}`,
    action: 'admin_status_change',
    referenceFor: 'User',
    referenceId: req.params.id,
    ipAddress: req.ip,
  });

  sendSuccess(res, {}, `Admin status updated to ${status}`);
});

exports.deleteAdmin = asyncHandler(async (req, res, next) => {
  const target = await User.findById(req.params.id);
  if (!target) return next(new AppError('Admin not found.', 404));

  if (target.role === 'superadmin') {
    return next(new AppError('Cannot delete a superadmin account.', 403));
  }
  if (target._id.toString() === req.user._id.toString()) {
    return next(new AppError('You cannot delete your own account.', 400));
  }

  await User.findByIdAndUpdate(req.params.id, {
    isDeleted: true,
    deletedAt: new Date(),
    status: 'banned',
  });

  await ActivityLog.create({
    uid: req.params.id,
    performedBy: req.user._id,
    description: `Superadmin deleted admin: ${target.email}`,
    action: 'admin_delete',
    referenceFor: 'User',
    referenceId: req.params.id,
    ipAddress: req.ip,
  });

  sendSuccess(res, {}, 'Admin account deleted');
});

// ─── SITE SETTINGS (superadmin only) ─────────────────────────────────────────
exports.getSettings = asyncHandler(async (req, res) => {
  const settings = await Setting.find().lean();
  const map = {};
  settings.forEach(s => { map[s.key] = s.value; });
  sendSuccess(res, { settings: map }, 'Settings fetched');
});

exports.updateSettings = asyncHandler(async (req, res) => {
  const updates = req.body; // { key: value, key2: value2 }

  const results = await Promise.all(
    Object.entries(updates).map(([key, value]) =>
      Setting.findOneAndUpdate({ key }, { value }, { upsert: true, new: true })
    )
  );

  await cache.del('admin:settings');

  await ActivityLog.create({
    uid: req.user._id,
    performedBy: req.user._id,
    description: `Superadmin updated site settings: ${Object.keys(updates).join(', ')}`,
    action: 'settings_update',
    ipAddress: req.ip,
  });

  sendSuccess(res, { updated: results.length }, 'Settings updated');
});

exports.updateBankDetails = asyncHandler(async (req, res) => {
  const { bankName, accountName, accountNumber, ifsc, branch, upiId } = req.body;
  const setting = await Setting.findOneAndUpdate(
    { key: 'bank_details' },
    { value: { bankName, accountName, accountNumber, ifsc, branch, upiId } },
    { upsert: true, new: true }
  );

  await ActivityLog.create({
    uid: req.user._id,
    performedBy: req.user._id,
    description: 'Superadmin updated bank details',
    action: 'bank_details_update',
    ipAddress: req.ip,
  });

  sendSuccess(res, { bank: setting.value }, 'Bank details updated');
});

// ─── PACKAGE MANAGEMENT (superadmin only) ─────────────────────────────────────
exports.createPackage = asyncHandler(async (req, res) => {
  const pkg = await Package.create(req.body);
  await cache.del('packages:all');

  await ActivityLog.create({
    uid: req.user._id,
    performedBy: req.user._id,
    description: `Superadmin created package: ${pkg.title}`,
    action: 'package_create',
    referenceFor: 'Package',
    referenceId: pkg._id,
    ipAddress: req.ip,
  });

  sendSuccess(res, { package: pkg }, 'Package created', 201);
});

exports.updatePackage = asyncHandler(async (req, res, next) => {
  const pkg = await Package.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!pkg) return next(new AppError('Package not found.', 404));
  await cache.del('packages:all');

  await ActivityLog.create({
    uid: req.user._id,
    performedBy: req.user._id,
    description: `Superadmin updated package: ${pkg.title}`,
    action: 'package_update',
    referenceFor: 'Package',
    referenceId: pkg._id,
    ipAddress: req.ip,
  });

  sendSuccess(res, { package: pkg }, 'Package updated');
});

exports.deletePackage = asyncHandler(async (req, res, next) => {
  const pkg = await Package.findByIdAndUpdate(req.params.id, { status: false, isDeleted: true, deletedAt: new Date() });
  if (!pkg) return next(new AppError('Package not found.', 404));
  await cache.del('packages:all');

  await ActivityLog.create({
    uid: req.user._id,
    performedBy: req.user._id,
    description: `Superadmin deactivated package: ${pkg.title}`,
    action: 'package_delete',
    referenceFor: 'Package',
    referenceId: pkg._id,
    ipAddress: req.ip,
  });

  sendSuccess(res, {}, 'Package deactivated');
});

// ─── REFUND MANAGEMENT (superadmin only) ──────────────────────────────────────
exports.getRefundRequests = asyncHandler(async (req, res) => {
  const page  = parseInt(req.query.page)  || 1;
  const limit = parseInt(req.query.limit) || 20;
  const filter = { refundStatus: { $in: ['requested', 'processing', 'refunded'] } };
  if (req.query.refundStatus) filter.refundStatus = req.query.refundStatus;

  const [invoices, total] = await Promise.all([
    Invoice.find(filter)
      .populate('uid', 'firstName lastName email avatar')
      .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Invoice.countDocuments(filter),
  ]);

  sendPaginated(res, invoices, total, page, limit);
});

exports.processRefund = asyncHandler(async (req, res, next) => {
  const { status, note } = req.body; // status: 'processing' | 'refunded' | 'rejected'
  if (!['processing', 'refunded', 'rejected'].includes(status)) {
    return next(new AppError('Invalid refund status.', 400));
  }

  const invoice = await Invoice.findById(req.params.invoiceId)
    .populate('uid', 'email firstName');
  if (!invoice) return next(new AppError('Invoice not found.', 404));

  const updateData = { refundStatus: status };
  if (status === 'refunded') {
    updateData.paymentStatus = 'refunded';
    updateData.refundedAt    = new Date();
  }

  await Invoice.findByIdAndUpdate(invoice._id, updateData);

  // Notify user
  await notificationService.create({
    recipientId: invoice.uid._id,
    type: 'system',
    title: `Refund ${status === 'refunded' ? 'Processed ✅' : status === 'rejected' ? 'Rejected ❌' : 'In Process ⏳'}`,
    message: note || `Your refund request has been updated to: ${status}`,
    refModel: 'Invoice',
    refId: invoice._id,
  });

  try {
    await emailService.sendRefundStatusUpdate(invoice.uid, invoice, status === 'refunded' ? 'processed' : status);
  } catch { /* silent */ }

  await ActivityLog.create({
    uid: req.user._id,
    performedBy: req.user._id,
    description: `Superadmin processed refund (${status}) for invoice #${invoice._id}`,
    action: 'refund_process',
    referenceFor: 'Invoice',
    referenceId: invoice._id,
    ipAddress: req.ip,
  });

  sendSuccess(res, {}, `Refund ${status}`);
});

// ─── SEND BROADCAST NOTIFICATION (superadmin only) ────────────────────────────
exports.sendBroadcast = asyncHandler(async (req, res, next) => {
  const { title, message, targetRole, sendEmail } = req.body;
  if (!title || !message) return next(new AppError('Title and message are required.', 400));

  const filter = { status: 'active', isDeleted: false };
  if (targetRole && targetRole !== 'all') filter.role = targetRole;

  const users = await User.find(filter).select('_id email firstName').lean();

  // Create in-app notifications in bulk
  const notifications = users.map(u => ({
    recipientId: u._id,
    senderId: req.user._id,
    type: 'system',
    title,
    message,
    channels: { inApp: true, email: !!sendEmail },
  }));

  // Insert in batches of 500
  const batchSize = 500;
  for (let i = 0; i < notifications.length; i += batchSize) {
    const batch = notifications.slice(i, i + batchSize);
    const { Notification } = require('../models/Notification.model') || {};
    const NotificationModel = require('../models/Notification.model');
    await NotificationModel.insertMany(batch, { ordered: false });
  }

  // Email (async, fire and forget)
  if (sendEmail) {
    users.forEach(u => {
      emailService.sendNotificationEmail(u, { title, message }).catch(() => {});
    });
  }

  await ActivityLog.create({
    uid: req.user._id,
    performedBy: req.user._id,
    description: `Superadmin sent broadcast to ${users.length} ${targetRole || 'all'} users: "${title}"`,
    action: 'broadcast_send',
    ipAddress: req.ip,
  });

  sendSuccess(res, { sent: users.length }, `Broadcast sent to ${users.length} users`);
});

// ─── PLATFORM ANALYTICS (superadmin only) ─────────────────────────────────────
exports.getPlatformAnalytics = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const from = new Date(Date.now() - days * 86400000);

  const [
    userGrowth, jobGrowth, applicationGrowth,
    roleBreakdown, topEmployers, topCategories,
  ] = await Promise.all([
    // Daily user signups
    User.aggregate([
      { $match: { createdAt: { $gte: from } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    // Daily job postings
    Job.aggregate([
      { $match: { createdAt: { $gte: from } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    // Daily applications
    Application.aggregate([
      { $match: { createdAt: { $gte: from } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    // User role breakdown
    User.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]),
    // Top employers by job count
    Job.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: '$companyId', jobCount: { $sum: 1 } } },
      { $sort: { jobCount: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'companies', localField: '_id', foreignField: '_id', as: 'company' } },
      { $unwind: '$company' },
      { $project: { jobCount: 1, 'company.name': 1, 'company.logo': 1, 'company.slug': 1 } },
    ]),
    // Top job categories
    Job.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: '$categoryId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'cat' } },
      { $unwind: '$cat' },
      { $project: { count: 1, 'cat.catTitle': 1, 'cat.alias': 1 } },
    ]),
  ]);

  sendSuccess(res, {
    period: { days, from },
    userGrowth,
    jobGrowth,
    applicationGrowth,
    roleBreakdown,
    topEmployers,
    topCategories,
  }, 'Platform analytics');
});

// ─── MANUAL PACKAGE ASSIGN (superadmin only) ──────────────────────────────────
exports.assignPackage = asyncHandler(async (req, res, next) => {
  const { userId, packageId, days } = req.body;

  const [targetUser, pkg] = await Promise.all([
    User.findById(userId),
    Package.findById(packageId),
  ]);

  if (!targetUser) return next(new AppError('User not found.', 404));
  if (!pkg)        return next(new AppError('Package not found.', 404));

  // Deactivate existing active package
  await UserPackage.updateMany({ uid: userId, isActive: true }, { isActive: false, status: false });

  const endDate = new Date();
  endDate.setDate(endDate.getDate() + (days || pkg.packageTime));

  // Create invoice (manual)
  const invoice = await Invoice.create({
    uid: userId,
    recordId: packageId,
    description: `Manual package assignment by superadmin: ${pkg.title}`,
    type: 'package',
    amount: 0,
    payMethod: 'manual',
    paymentStatus: 'paid',
    paidAt: new Date(),
  });

  const userPkg = await UserPackage.create({
    uid: userId,
    packageId,
    endDate,
    status: true,
    isActive: true,
    paymentHistoryId: invoice._id,
    remainingJobs:            pkg.job,
    remainingFeaturedJobs:    pkg.featuredJob,
    remainingResumes:         pkg.resume,
    remainingFeaturedResumes: pkg.featuredResume,
    remainingCompanies:       pkg.companies,
    remainingJobAlerts:       pkg.jobAlert,
    remainingJobApply:        pkg.jobApply,
    remainingResumeSearch:    pkg.resumeSearch,
  });

  await TransactionLog.create({
    uid: userId,
    userPackageId: userPkg._id,
    recordId: invoice._id,
    type: 'manual_assignment',
    status: true,
  });

  await notificationService.create({
    recipientId: userId,
    type: 'payment_success',
    title: `${pkg.title} Package Activated 🎉`,
    message: `Your ${pkg.title} package has been activated by admin. Valid until ${endDate.toLocaleDateString('en-IN')}.`,
    refModel: 'Invoice',
    refId: invoice._id,
  });

  await ActivityLog.create({
    uid: req.user._id,
    performedBy: req.user._id,
    description: `Superadmin manually assigned ${pkg.title} to user ${targetUser.email}`,
    action: 'package_assign',
    referenceFor: 'UserPackage',
    referenceId: userPkg._id,
    ipAddress: req.ip,
  });

  sendSuccess(res, { userPackage: userPkg, invoice }, 'Package assigned successfully');
});

// ─── CATEGORY MANAGEMENT (superadmin only) ────────────────────────────────────
exports.createCategory = asyncHandler(async (req, res) => {
  const cat = await Category.create(req.body);
  await cache.del('categories');
  sendSuccess(res, { category: cat }, 'Category created', 201);
});

exports.updateCategory = asyncHandler(async (req, res, next) => {
  const cat = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!cat) return next(new AppError('Category not found.', 404));
  await cache.del('categories');
  sendSuccess(res, { category: cat }, 'Category updated');
});

exports.deleteCategory = asyncHandler(async (req, res, next) => {
  const cat = await Category.findByIdAndDelete(req.params.id);
  if (!cat) return next(new AppError('Category not found.', 404));
  await cache.del('categories');
  sendSuccess(res, {}, 'Category deleted');
});

// ─── CLEAR CACHE (superadmin only) ────────────────────────────────────────────
exports.clearCache = asyncHandler(async (req, res) => {
  const { pattern } = req.body;
  if (pattern) {
    await cache.delPattern(pattern);
  } else {
    // Clear all known cache keys
    await Promise.all([
      cache.del('admin:dashboard'),
      cache.del('packages:all'),
      cache.del('categories'),
      cache.del('jobtypes'),
      cache.del('careerlevels'),
      cache.del('education'),
      cache.del('currencies'),
      cache.del('countries'),
      cache.delPattern('jobs:list:*'),
      cache.delPattern('companies:*'),
      cache.delPattern('search:*'),
    ]);
  }

  await ActivityLog.create({
    uid: req.user._id,
    performedBy: req.user._id,
    description: `Superadmin cleared cache: ${pattern || 'all'}`,
    action: 'cache_clear',
    ipAddress: req.ip,
  });

  sendSuccess(res, {}, `Cache cleared${pattern ? `: ${pattern}` : ' (all)'}`);
});