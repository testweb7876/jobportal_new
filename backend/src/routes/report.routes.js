const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { asyncHandler, sendSuccess } = require('../utils/AppError');
const { Report } = require('../models/Misc.model');

router.post('/', protect, asyncHandler(async (req, res) => {
  const report = await Report.create({ reportedBy: req.user._id, ...req.body });
  sendSuccess(res, { report }, 'Report submitted', 201);
}));

module.exports = router;
