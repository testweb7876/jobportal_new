const Application = require('../models/Application.model');
const Job = require('../models/Job.model');
const Resume = require('../models/Resume.model');
const { UserPackage } = require('../models/Payment.model');
const { AppError, asyncHandler, sendSuccess, sendPaginated } = require('../utils/AppError');
const notificationService = require('../services/notification.service');
const emailService = require('../services/email.service');
const { ActivityLog } = require('../models/Misc.model');

// ─── APPLY FOR JOB ───────────────────────────────────────────────────────────
exports.applyJob = asyncHandler(async (req, res, next) => {
  const { jobId, cvId, coverLetterId, applyMessage, quickApply } = req.body;

  const job = await Job.findOne({ _id: jobId, status: 'approved' }).populate('uid', 'email firstName');
  if (!job) return next(new AppError('Job not found or not accepting applications.', 404));

  // Check if expired
  if (job.expiresAt && new Date() > job.expiresAt) {
    return next(new AppError('This job posting has expired.', 400));
  }

  // Duplicate apply check
  const existing = await Application.findOne({ jobId, uid: req.user._id }).setOptions({ includeDeleted: true });
  if (existing) return next(new AppError('You have already applied for this job.', 409));

  // Check package quota
  const pkg = await UserPackage.findOne({ uid: req.user._id, status: true, isActive: true, endDate: { $gt: new Date() } });
  if (!pkg || pkg.remainingJobApply <= 0) {
    return next(new AppError('You have reached your application limit. Please upgrade your package.', 403));
  }

  // Snapshot resume at time of apply
  let resumeSnapshot = null;
  if (cvId) {
    const resume = await Resume.findById(cvId).lean();
    resumeSnapshot = resume;
  }

  const application = await Application.create({
    jobId,
    uid: req.user._id,
    cvId,
    companyId: job.companyId,
    coverLetterId,
    applyMessage,
    quickApply: quickApply || false,
    resumeSnapshot,
    statusHistory: [{ status: 'applied', note: 'Application submitted', changedBy: req.user._id }],
    userpackageId: pkg._id,
  });

  // Deduct quota
  await UserPackage.findByIdAndUpdate(pkg._id, { $inc: { remainingJobApply: -1 } });

  // Update job applications count
  await Job.findByIdAndUpdate(jobId, { $inc: { applicationsCount: 1 } });

  // Notify employer
  if (job.uid) {
    await notificationService.create({
      recipientId: job.uid._id,
      senderId: req.user._id,
      type: 'application_received',
      title: 'New Application Received',
      message: `Someone applied for your job "${job.title}"`,
      refModel: 'Application',
      refId: application._id,
      channels: { inApp: true, email: true },
    });
    try {
      await emailService.sendNewApplicationAlert(job.uid, application, job.title);
    } catch { /* silent */ }
  }

  // Notify applicant
  await notificationService.create({
    recipientId: req.user._id,
    type: 'system',
    title: 'Application Submitted',
    message: `Your application for "${job.title}" has been submitted successfully.`,
    refModel: 'Application',
    refId: application._id,
  });

  await ActivityLog.create({
    uid: req.user._id,
    description: `Applied for job: ${job.title}`,
    referenceFor: 'application',
    referenceId: application._id,
    ipAddress: req.ip,
  });

  sendSuccess(res, { application }, 'Application submitted successfully.', 201);
});

// ─── GET MY APPLICATIONS (JOBSEEKER) ────────────────────────────────────────
exports.getMyApplications = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = { uid: req.user._id };
  if (req.query.status) filter.status = req.query.status;

  const [applications, total] = await Promise.all([
    Application.find(filter)
      .populate('jobId', 'title company city slug status expiresAt')
      .populate('cvId', 'applicationTitle')
      .sort({ createdAt: -1 })
      .skip(skip).limit(limit).lean(),
    Application.countDocuments(filter),
  ]);

  sendPaginated(res, applications, total, page, limit);
});

// ─── GET JOB APPLICATIONS (EMPLOYER) ────────────────────────────────────────
exports.getJobApplications = asyncHandler(async (req, res, next) => {
  const job = await Job.findOne({ _id: req.params.jobId, uid: req.user._id });
  if (!job && !['admin', 'superadmin'].includes(req.user.role)) {
    return next(new AppError('Job not found or unauthorized.', 403));
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const filter = { jobId: req.params.jobId };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.rating) filter.rating = { $gte: parseFloat(req.query.rating) };

  const [applications, total] = await Promise.all([
    Application.find(filter)
      .populate('uid', 'firstName lastName email phone avatar profileCompleted')
      .populate('cvId', 'applicationTitle skills atsScore completionPercentage')
      .sort({ createdAt: -1 })
      .skip(skip).limit(limit).lean(),
    Application.countDocuments(filter),
  ]);

  sendPaginated(res, applications, total, page, limit);
});

// ─── GET SINGLE APPLICATION ──────────────────────────────────────────────────
exports.getApplication = asyncHandler(async (req, res, next) => {
  const application = await Application.findById(req.params.id)
    .populate('uid', 'firstName lastName email phone avatar')
    .populate('jobId', 'title company city companyId')
    .populate('cvId')
    .populate('coverLetterId', 'title description');

  if (!application) return next(new AppError('Application not found.', 404));

  // Authorization check
  const isApplicant = application.uid._id.toString() === req.user._id.toString();
  const isEmployer = req.user.role === 'employer';
  const isAdmin = ['admin', 'superadmin'].includes(req.user.role);

  if (!isApplicant && !isAdmin) {
    // Check if employer owns the job
    if (isEmployer) {
      const job = await Job.findOne({ _id: application.jobId._id, uid: req.user._id });
      if (!job) return next(new AppError('Not authorized.', 403));
    } else {
      return next(new AppError('Not authorized.', 403));
    }
  }

  // Mark resume as viewed by employer
  if (isEmployer && !application.resumeView) {
    await Application.findByIdAndUpdate(req.params.id, {
      resumeView: true,
      resumeViewedAt: new Date(),
    });
  }

  sendSuccess(res, { application }, 'Application fetched');
});

// ─── UPDATE APPLICATION STATUS (EMPLOYER) ────────────────────────────────────
exports.updateApplicationStatus = asyncHandler(async (req, res, next) => {
  const { status, note, interviewDate, interviewType, interviewLink } = req.body;

  const validStatuses = ['reviewed', 'shortlisted', 'interview_scheduled', 'interviewed', 'offered', 'hired', 'rejected'];
  if (!validStatuses.includes(status)) {
    return next(new AppError('Invalid status.', 400));
  }

  const application = await Application.findById(req.params.id)
    .populate('uid', 'email firstName')
    .populate('jobId', 'title uid');

  if (!application) return next(new AppError('Application not found.', 404));

  // Employer must own the job
  if (!['admin', 'superadmin'].includes(req.user.role)) {
    const job = await Job.findOne({ _id: application.jobId._id, uid: req.user._id });
    if (!job) return next(new AppError('Not authorized.', 403));
  }

  const updateData = {
    status,
    employerNotes: note,
    $push: {
      statusHistory: { status, note, changedBy: req.user._id },
    },
  };

  if (status === 'interview_scheduled') {
    updateData.interviewDate = interviewDate;
    updateData.interviewType = interviewType;
    updateData.interviewLink = interviewLink;
    updateData.interviewScheduledAt = new Date();
  }

  const updated = await Application.findByIdAndUpdate(req.params.id, updateData, { new: true });

  // Notify applicant
  if (application.uid) {
    await notificationService.create({
      recipientId: application.uid._id,
      senderId: req.user._id,
      type: status === 'shortlisted' ? 'shortlisted' : status === 'hired' ? 'hired' : status === 'rejected' ? 'rejected' : 'system',
      title: `Application Update: ${status.replace('_', ' ').toUpperCase()}`,
      message: note || `Your application status has been updated to ${status}.`,
      refModel: 'Application',
      refId: application._id,
      channels: { inApp: true, email: true },
    });

    try {
      await emailService.sendApplicationStatusUpdate(application.uid, application.jobId, status, note);
    } catch { /* silent */ }
  }

  sendSuccess(res, { application: updated }, 'Application status updated');
});

// ─── WITHDRAW APPLICATION (JOBSEEKER) ────────────────────────────────────────
exports.withdrawApplication = asyncHandler(async (req, res, next) => {
  const application = await Application.findOne({ _id: req.params.id, uid: req.user._id });
  if (!application) return next(new AppError('Application not found.', 404));

  if (['hired', 'rejected'].includes(application.status)) {
    return next(new AppError('Cannot withdraw a closed application.', 400));
  }

  await Application.findByIdAndUpdate(req.params.id, {
    status: 'withdrawn',
    withdrawReason: req.body.reason,
    $push: { statusHistory: { status: 'withdrawn', note: req.body.reason, changedBy: req.user._id } },
  });

  sendSuccess(res, {}, 'Application withdrawn');
});

// ─── RATE APPLICATION ─────────────────────────────────────────────────────────
exports.rateApplication = asyncHandler(async (req, res, next) => {
  const { rating, notes } = req.body;

  if (rating < 0 || rating > 5) return next(new AppError('Rating must be between 0 and 5.', 400));

  const application = await Application.findById(req.params.id).populate('jobId', 'uid');
  if (!application) return next(new AppError('Application not found.', 404));

  const job = await Job.findOne({ _id: application.jobId._id, uid: req.user._id });
  if (!job && !['admin', 'superadmin'].includes(req.user.role)) {
    return next(new AppError('Not authorized.', 403));
  }

  await Application.findByIdAndUpdate(req.params.id, { rating, employerNotes: notes });

  sendSuccess(res, {}, 'Application rated');
});

// ─── COMPANY APPLICATIONS OVERVIEW ───────────────────────────────────────────
exports.getCompanyApplicationsOverview = asyncHandler(async (req, res, next) => {
  const jobs = await Job.find({ uid: req.user._id }).select('_id');
  const jobIds = jobs.map((j) => j._id);

  const stats = await Application.aggregate([
    { $match: { jobId: { $in: jobIds }, isDeleted: false } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const total = await Application.countDocuments({ jobId: { $in: jobIds } });
  const recent = await Application.find({ jobId: { $in: jobIds } })
    .populate('uid', 'firstName lastName avatar')
    .populate('jobId', 'title')
    .sort({ createdAt: -1 })
    .limit(5);

  sendSuccess(res, { stats, total, recent }, 'Company applications overview');
});

exports.getResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      uid: req.user._id,
    })

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found',
      })
    }

    res.json({
      success: true,
      resume,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    })
  }
}

exports.updateResume = async (req, res) => {
  try {
    const resume = await Resume.findOneAndUpdate(
      {
        _id: req.params.id,
        uid: req.user._id,
      },
      req.body,
      {
        new: true,
      }
    )

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found',
      })
    }

    res.json({
      success: true,
      resume,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    })
  }
}