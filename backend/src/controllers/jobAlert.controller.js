const { JobAlert } = require('../models/Misc.model');
const { AppError, asyncHandler, sendSuccess } = require('../utils/AppError');

exports.getAlerts = asyncHandler(async (req, res) => {
  const alerts = await JobAlert.find({ uid: req.user._id, isDeleted: false }).sort({ createdAt: -1 });
  sendSuccess(res, { alerts }, 'Alerts fetched');
});

exports.createAlert = asyncHandler(async (req, res) => {
  const alert = await JobAlert.create({ ...req.body, uid: req.user._id });
  sendSuccess(res, { alert }, 'Job alert created successfully', 201);
});

exports.updateAlert = asyncHandler(async (req, res, next) => {
  const alert = await JobAlert.findOneAndUpdate(
    { _id: req.params.id, uid: req.user._id },
    req.body,
    { new: true }
  );
  if (!alert) return next(new AppError('Alert not found', 404));
  sendSuccess(res, { alert }, 'Alert updated successfully');
});

exports.deleteAlert = asyncHandler(async (req, res, next) => {
  const alert = await JobAlert.findOneAndUpdate(
    { _id: req.params.id, uid: req.user._id },
    { isDeleted: true },
    { new: true }
  );
  if (!alert) return next(new AppError('Alert not found', 404));
  sendSuccess(res, {}, 'Alert deleted successfully');
});