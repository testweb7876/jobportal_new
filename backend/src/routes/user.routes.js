const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { asyncHandler, sendSuccess } = require('../utils/AppError');
const User = require('../models/User.model');
const { uploadToCloudinary, deleteFromCloudinary } = require('../services/cloudinary.service');
const { uploadImage } = require('../services/cloudinary.service');
const { AppError } = require('../utils/AppError');

router.get('/profile', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  sendSuccess(res, { user: user.toPublicJSON() });
}));

router.patch('/profile', protect, asyncHandler(async (req, res) => {
  const disallowed = ['password', 'email', 'role', 'status', 'isVerified'];
  disallowed.forEach(f => delete req.body[f]);
  const user = await User.findByIdAndUpdate(req.user._id, req.body, { new: true, runValidators: true });
  sendSuccess(res, { user: user.toPublicJSON() }, 'Profile updated');
}));

router.post('/avatar', protect, uploadImage.single('avatar'), asyncHandler(async (req, res, next) => {
  if (!req.file) return next(new AppError('No image uploaded.', 400));
  const user = await User.findById(req.user._id);
  if (user.avatar?.publicId) await deleteFromCloudinary(user.avatar.publicId);
  const result = await uploadToCloudinary(req.file, 'avatar', {
    transformation: [{ width: 300, height: 300, crop: 'fill', gravity: 'face', quality: 'auto' }],
  });
  await User.findByIdAndUpdate(req.user._id, { avatar: result });
  sendSuccess(res, { avatar: result }, 'Avatar uploaded');
}));

router.patch('/notification-settings', protect, asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.user._id, { notificationSettings: req.body }, { new: true });
  sendSuccess(res, { settings: user.notificationSettings }, 'Settings updated');
}));

router.delete('/account', protect, asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { isDeleted: true, deletedAt: new Date(), status: 'banned' });
  sendSuccess(res, {}, 'Account deleted');
}));

module.exports = router;
