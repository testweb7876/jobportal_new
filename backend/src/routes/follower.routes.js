const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { asyncHandler, sendSuccess } = require('../utils/AppError');
const { Follower } = require('../models/Misc.model');
const Company = require('../models/Company.model');

router.get('/following', protect, asyncHandler(async (req, res) => {
  const followers = await Follower.find({ followerId: req.user._id })
    .populate('companyId', 'name slug logo city isVerified').lean();
  sendSuccess(res, { companies: followers.map(f => f.companyId) });
}));

module.exports = router;
