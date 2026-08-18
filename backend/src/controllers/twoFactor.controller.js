const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const User = require('../models/User.model');
const { AppError, asyncHandler, sendSuccess } = require('../utils/AppError');

// ─── STEP 1: GENERATE SECRET + QR CODE ────────────────────────────────────
exports.setupTwoFactor = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  if (user.twoFactorEnabled) {
    return next(new AppError('Two-factor authentication is already enabled.', 400));
  }

  const secret = speakeasy.generateSecret({
    name: `JobPortal (${user.email})`,
    length: 20,
  });

  // Store secret temporarily — NOT enabled yet until user verifies with a code
  user.twoFactorSecret = secret.base32;
  await user.save({ validateBeforeSave: false });

  const qrCodeDataUrl = await qrcode.toDataURL(secret.otpauth_url);

  sendSuccess(res, {
    qrCode: qrCodeDataUrl,        // render this as an <img src="..."> on the frontend
    manualEntryKey: secret.base32, // fallback for manual entry into authenticator apps
  }, 'Scan the QR code with your authenticator app, then verify to enable 2FA.');
});

// ─── STEP 2: VERIFY CODE AND ENABLE ───────────────────────────────────────
exports.verifyAndEnableTwoFactor = asyncHandler(async (req, res, next) => {
  const { token } = req.body;
  const user = await User.findById(req.user._id).select('+twoFactorSecret');

  if (!user.twoFactorSecret) {
    return next(new AppError('Please start 2FA setup first.', 400));
  }

  const isValid = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token,
    window: 1, // allows 30s clock drift
  });

  if (!isValid) {
    return next(new AppError('Invalid verification code. Please try again.', 400));
  }

  user.twoFactorEnabled = true;
  await user.save({ validateBeforeSave: false });

  sendSuccess(res, {}, 'Two-factor authentication enabled successfully.');
});

// ─── STEP 3: VERIFY DURING LOGIN ───────────────────────────────────────────
exports.verifyLoginTwoFactor = asyncHandler(async (req, res, next) => {
  const { userId, token } = req.body;
  const user = await User.findById(userId).select('+twoFactorSecret');

  if (!user || !user.twoFactorEnabled) {
    return next(new AppError('Two-factor authentication is not enabled for this account.', 400));
  }

  const isValid = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token,
    window: 1,
  });

  if (!isValid) {
    return next(new AppError('Invalid verification code.', 401));
  }

  const authService = require('../services/auth.service');
  await authService.sendTokenResponse(user, 200, res, req);
});

// ─── DISABLE 2FA ───────────────────────────────────────────────────────────
exports.disableTwoFactor = asyncHandler(async (req, res, next) => {
  const { password } = req.body;
  const user = await User.findById(req.user._id).select('+password +twoFactorSecret');

  if (!(await user.comparePassword(password))) {
    return next(new AppError('Incorrect password.', 401));
  }

  user.twoFactorEnabled = false;
  user.twoFactorSecret = undefined;
  await user.save({ validateBeforeSave: false });

  sendSuccess(res, {}, 'Two-factor authentication disabled.');
});