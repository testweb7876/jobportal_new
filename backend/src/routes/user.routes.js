const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { asyncHandler, sendSuccess } = require('../utils/AppError');
const User = require('../models/User.model');
const { uploadToCloudinary, deleteFromCloudinary, uploadFile } = require('../services/cloudinary.service');
const { uploadImage } = require('../services/cloudinary.service');
const { AppError } = require('../utils/AppError');

function calcProfileCompleted(user) {
  const tasks = [
    !!user.avatar?.secureUrl,
    !!(user.firstName && user.lastName && user.phone),
    !!(user.socialLinks?.linkedin || user.socialLinks?.website),
    !!user.resume?.secureUrl,
    !!(user.jobPreferences?.categories?.length || user.jobPreferences?.jobTypes?.length),
  ];
  return Math.round((tasks.filter(Boolean).length / tasks.length) * 100);
}

router.get('/profile', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  sendSuccess(res, { user: user.toPublicJSON() });
}));

router.patch('/profile', protect, asyncHandler(async (req, res) => {
  const disallowed = ['password', 'email', 'role', 'status', 'isVerified'];
  disallowed.forEach(f => delete req.body[f]);

  const user = await User.findById(req.user._id);
  if (!user) throw new AppError('User not found', 404);

  user.firstName = req.body.firstName || user.firstName;
  user.lastName  = req.body.lastName  || user.lastName;
  user.phone     = req.body.phone     || user.phone;

  if (req.body.socialLinks) {
    user.socialLinks = { ...user.socialLinks.toObject(), ...req.body.socialLinks };
  }

  if (req.body.jobPreferences) {
    user.jobPreferences = { ...(user.jobPreferences?.toObject?.() || {}), ...req.body.jobPreferences };
  }

  // ── Recalculate profileCompleted ──────────────────────────────
  const tasks = [
    !!user.avatar?.secureUrl,
    !!(user.firstName && user.lastName && user.phone),
    !!(user.socialLinks?.linkedin || user.socialLinks?.website),
    !!user.resume?.secureUrl,
    !!(user.jobPreferences?.categories?.length || user.jobPreferences?.jobTypes?.length),
  ];
  user.profileCompleted = Math.round((tasks.filter(Boolean).length / tasks.length) * 100);
  // ─────────────────────────────────────────────────────────────

  await user.save();
  sendSuccess(res, { user: user.toPublicJSON() }, 'Profile updated');
}));

router.post('/avatar', protect, uploadImage.single('avatar'), asyncHandler(async (req, res, next) => {
  if (!req.file) return next(new AppError('No image uploaded.', 400));
  const user = await User.findById(req.user._id);
  if (user.avatar?.publicId) await deleteFromCloudinary(user.avatar.publicId);
  const result = await uploadToCloudinary(req.file, 'avatar', {
    transformation: [{ width: 300, height: 300, crop: 'fill', gravity: 'face', quality: 'auto' }],
  });
  user.avatar = result;
  user.profileCompleted = calcProfileCompleted(user);
  await user.save();
  sendSuccess(res, { avatar: result, profileCompleted: user.profileCompleted }, 'Avatar uploaded');
}));

router.patch('/notification-settings', protect, asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.user._id, { notificationSettings: req.body }, { new: true });
  sendSuccess(res, { settings: user.notificationSettings }, 'Settings updated');
}));

router.delete('/account', protect, asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { isDeleted: true, deletedAt: new Date(), status: 'banned' });
  sendSuccess(res, {}, 'Account deleted');
}));

router.post('/resume', protect, uploadFile.single('resume'), asyncHandler(async (req, res, next) => {
  if (!req.file) return next(new AppError('No file uploaded.', 400));
  const result = await uploadToCloudinary(req.file, 'resumes');
  const user = await User.findById(req.user._id);
  user.resume = {
    publicId:   result.publicId,
    secureUrl:  result.secureUrl,
    filename:   req.file.originalname,
    uploadedAt: new Date(),
  };
  user.profileCompleted = calcProfileCompleted(user);
  await user.save();
  res.json({ success: true, resume: user.resume, profileCompleted: user.profileCompleted });
}));

module.exports = router;
