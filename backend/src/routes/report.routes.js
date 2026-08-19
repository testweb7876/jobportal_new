const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { asyncHandler, sendSuccess } = require('../utils/AppError');
const { Report } = require('../models/Misc.model');
const notificationService = require('../services/notification.service');

router.post('/', protect, asyncHandler(async (req, res) => {
  const report = await Report.create({ reportedBy: req.user._id, ...req.body });

  await notificationService.notifyAdmins({
    type: 'admin_new_report',
    title: 'New Report',
    message: `${req.user.firstName} reported a ${req.body.refModel}.`,
    refModel: 'Report', refId: report._id,
  });

  sendSuccess(res, { report }, 'Report submitted', 201);
}));

module.exports = router;