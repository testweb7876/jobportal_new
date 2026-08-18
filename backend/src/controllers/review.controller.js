const Review = require('../models/Review.model');
const Company = require('../models/Company.model');
const { AppError, asyncHandler, sendSuccess, sendPaginated } = require('../utils/AppError');
const notificationService = require('../services/notification.service');
const { ActivityLog } = require('../models/Misc.model');

// ─── GET REVIEWS FOR A COMPANY (PUBLIC) ──────────────────────────────────────
exports.getCompanyReviews = asyncHandler(async (req, res, next) => {
  const page  = parseInt(req.query.page)  || 1;
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);
  const skip  = (page - 1) * limit;

  const filter = { companyId: req.params.companyId, status: 'approved' };
  if (req.query.rating) filter.rating = parseInt(req.query.rating);

  const sortMap = {
    newest:  { createdAt: -1 },
    oldest:  { createdAt: 1 },
    helpful: { helpfulCount: -1 },
    highest: { rating: -1 },
    lowest:  { rating: 1 },
  };
  const sort = sortMap[req.query.sort] || { createdAt: -1 };

  const [reviews, total, summary] = await Promise.all([
    Review.find(filter)
      .populate('uid', 'firstName lastName avatar')
      .sort(sort).skip(skip).limit(limit).lean(),
    Review.countDocuments(filter),
    Review.aggregate([
      { $match: { companyId: req.params.companyId, status: 'approved', isDeleted: false } },
      { $group: { _id: null, avgRating: { $avg: '$rating' }, totalReviews: { $sum: 1 } } },
    ]),
  ]);

  // Hide reviewer identity if the review is anonymous
  const sanitized = reviews.map((r) => {
    if (r.isAnonymous) {
      return { ...r, uid: { firstName: 'Anonymous', lastName: '', avatar: null } };
    }
    return r;
  });

  sendPaginated(res, sanitized, total, page, limit, 'Reviews fetched', {
    avgRating: summary[0]?.avgRating ? Math.round(summary[0].avgRating * 10) / 10 : 0,
    totalReviews: summary[0]?.totalReviews || 0,
  });
});

// ─── CREATE REVIEW ────────────────────────────────────────────────────────────
exports.createReview = asyncHandler(async (req, res, next) => {
  const { companyId, rating, title, review, pros, cons, jobTitle, employmentType, isAnonymous } = req.body;

  const company = await Company.findById(companyId);
  if (!company) return next(new AppError('Company not found.', 404));

  const existing = await Review.findOne({ uid: req.user._id, companyId }).setOptions({ includeDeleted: true });
  if (existing) return next(new AppError('You have already reviewed this company.', 409));

  const newReview = await Review.create({
    uid: req.user._id,
    companyId,
    rating,
    title,
    review,
    pros,
    cons,
    jobTitle,
    employmentType,
    isAnonymous: isAnonymous !== false, // default true
    status: 'pending', // requires admin moderation before going public
  });

  await ActivityLog.create({
    uid: req.user._id,
    description: `Submitted a review for company: ${company.name}`,
    referenceFor: 'review',
    referenceId: newReview._id,
    ipAddress: req.ip,
  });

  sendSuccess(res, { review: newReview }, 'Review submitted. It will be visible after moderation.', 201);
});

// ─── GET MY REVIEWS ───────────────────────────────────────────────────────────
exports.getMyReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ uid: req.user._id })
    .populate('companyId', 'name logo slug')
    .sort({ createdAt: -1 }).lean();

  sendSuccess(res, { reviews }, 'Your reviews fetched');
});

// ─── UPDATE REVIEW (OWNER ONLY, RESETS TO PENDING) ───────────────────────────
exports.updateReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findOne({ _id: req.params.id, uid: req.user._id });
  if (!review) return next(new AppError('Review not found.', 404));

  const allowedFields = ['rating', 'title', 'review', 'pros', 'cons', 'jobTitle', 'employmentType', 'isAnonymous'];
  allowedFields.forEach((f) => {
    if (req.body[f] !== undefined) review[f] = req.body[f];
  });

  review.status = 'pending'; // re-moderate after edit
  await review.save();

  sendSuccess(res, { review }, 'Review updated. It will be re-reviewed before going public.');
});

// ─── DELETE REVIEW (OWNER OR ADMIN) ──────────────────────────────────────────
exports.deleteReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);
  if (!review) return next(new AppError('Review not found.', 404));

  if (review.uid.toString() !== req.user._id.toString() && !['admin', 'superadmin'].includes(req.user.role)) {
    return next(new AppError('Not authorized.', 403));
  }

  await Review.findByIdAndUpdate(req.params.id, { isDeleted: true, deletedAt: new Date() });
  sendSuccess(res, {}, 'Review deleted');
});

// ─── TOGGLE HELPFUL VOTE ──────────────────────────────────────────────────────
exports.toggleHelpful = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);
  if (!review) return next(new AppError('Review not found.', 404));

  const alreadyVoted = review.helpfulVotes.some((v) => v.toString() === req.user._id.toString());

  if (alreadyVoted) {
    await Review.findByIdAndUpdate(req.params.id, {
      $pull: { helpfulVotes: req.user._id },
      $inc: { helpfulCount: -1 },
    });
    return sendSuccess(res, { helpful: false }, 'Vote removed');
  }

  await Review.findByIdAndUpdate(req.params.id, {
    $addToSet: { helpfulVotes: req.user._id },
    $inc: { helpfulCount: 1 },
  });

  sendSuccess(res, { helpful: true }, 'Marked as helpful');
});

// ─── EMPLOYER: RESPOND TO REVIEW ──────────────────────────────────────────────
exports.respondToReview = asyncHandler(async (req, res, next) => {
  const { text } = req.body;
  if (!text) return next(new AppError('Response text is required.', 400));

  const review = await Review.findById(req.params.id).populate('companyId');
  if (!review) return next(new AppError('Review not found.', 404));

  const company = await Company.findOne({ _id: review.companyId._id, uid: req.user._id });
  if (!company && !['admin', 'superadmin'].includes(req.user.role)) {
    return next(new AppError('Not authorized to respond to this review.', 403));
  }

  review.employerResponse = { text, respondedAt: new Date(), respondedBy: req.user._id };
  await review.save();

  await notificationService.create({
    recipientId: review.uid,
    type: 'system',
    title: 'Employer Responded to Your Review',
    message: `${review.companyId.name} responded to your review.`,
    refModel: 'Review',
    refId: review._id,
  });

  sendSuccess(res, { review }, 'Response posted');
});

// ─── ADMIN: GET PENDING REVIEWS ───────────────────────────────────────────────
exports.getPendingReviews = asyncHandler(async (req, res) => {
  const page  = parseInt(req.query.page)  || 1;
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);

  const [reviews, total] = await Promise.all([
    Review.find({ status: 'pending' })
      .populate('uid', 'firstName lastName email')
      .populate('companyId', 'name slug')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit).limit(limit).lean(),
    Review.countDocuments({ status: 'pending' }),
  ]);

  sendPaginated(res, reviews, total, page, limit);
});

// ─── ADMIN: MODERATE REVIEW ───────────────────────────────────────────────────
exports.moderateReview = asyncHandler(async (req, res, next) => {
  const { status, note } = req.body;
  if (!['approved', 'rejected'].includes(status)) {
    return next(new AppError('Invalid status.', 400));
  }

  const review = await Review.findByIdAndUpdate(
    req.params.id,
    { status, moderationNote: note },
    { new: true }
  );
  if (!review) return next(new AppError('Review not found.', 404));

  await notificationService.create({
    recipientId: review.uid,
    type: 'system',
    title: `Your review has been ${status}`,
    message: note || `Your review was ${status} by our moderation team.`,
    refModel: 'Review',
    refId: review._id,
  });

  sendSuccess(res, { review }, `Review ${status}`);
});