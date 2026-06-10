const express = require('express');
const router = express.Router();
const { protect, employerOnly, adminOnly } = require('../middleware/auth.middleware');
const { asyncHandler, sendSuccess } = require('../utils/AppError');
const Job = require('../models/Job.model');
const Application = require('../models/Application.model');
const Resume = require('../models/Resume.model');

router.get('/employer', protect, employerOnly, asyncHandler(async (req, res) => {
  const jobs = await Job.find({ uid: req.user._id }).select('_id');
  const jobIds = jobs.map(j => j._id);

  const [totalJobs, totalApplications, applicationsByStatus, topJobs] = await Promise.all([
    Job.countDocuments({ uid: req.user._id }),
    Application.countDocuments({ jobId: { $in: jobIds } }),
    Application.aggregate([
      { $match: { jobId: { $in: jobIds } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Job.find({ uid: req.user._id })
      .select('title viewsCount applicationsCount createdAt status')
      .sort({ viewsCount: -1 }).limit(10).lean(),
  ]);

  sendSuccess(res, { totalJobs, totalApplications, applicationsByStatus, topJobs });
}));

router.get('/jobseeker', protect, asyncHandler(async (req, res) => {
  const [totalApplications, applicationsByStatus, profileViews] = await Promise.all([
    Application.countDocuments({ uid: req.user._id }),
    Application.aggregate([
      { $match: { uid: req.user._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    require('../models/User.model').findById(req.user._id).select('profileViews').lean(),
  ]);

  sendSuccess(res, { totalApplications, applicationsByStatus, profileViews: profileViews?.profileViews || 0 });
}));

module.exports = router;
