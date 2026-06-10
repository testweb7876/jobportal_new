const express = require('express');
const router = express.Router();
const { protect, employerOnly } = require('../middleware/auth.middleware');
const { asyncHandler, sendSuccess } = require('../utils/AppError');
const Application = require('../models/Application.model');

router.get('/', protect, asyncHandler(async (req, res) => {
  const filter = req.user.role === 'employer'
    ? { status: 'interview_scheduled', jobId: { $in: (await require('../models/Job.model').find({ uid: req.user._id }).distinct('_id')) } }
    : { uid: req.user._id, status: 'interview_scheduled' };

  const interviews = await Application.find(filter)
    .populate('uid', 'firstName lastName email avatar')
    .populate('jobId', 'title company')
    .sort({ interviewDate: 1 }).lean();

  sendSuccess(res, { interviews });
}));

module.exports = router;
