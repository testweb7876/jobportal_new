const crypto = require('crypto');
const User = require('../models/User.model');
const RefreshToken = require('../models/RefreshToken.model');
const { AppError, asyncHandler, sendSuccess } = require('../utils/AppError');
const authService = require('../services/auth.service');
const emailService = require('../services/email.service');
const { ActivityLog } = require('../models/Misc.model');
const logger = require('../config/logger');
const passport = require('../config/passport');

// ─── REGISTER ────────────────────────────────────────────────────────────────
exports.register = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, email, password, role = 'jobseeker', phone } = req.body;

  const existingUser = await User.findOne({ email }).setOptions({ includeDeleted: true });
  if (existingUser) {
    return next(new AppError('An account with this email already exists.', 409));
  }

  const user = await User.create({
    firstName, lastName, email, password, role, phone,
    status: 'pending',
  });

  // Email verification token
  const verifyToken = user.createEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${verifyToken}`;

  try {
    await emailService.sendWelcome(user, verifyUrl);
  } catch (err) {
    logger.warn(`Welcome email failed for ${user.email}: ${err.message}`);
  }

  // Log activity
  await ActivityLog.create({
    uid: user._id,
    description: 'User registered',
    referenceFor: 'user',
    referenceId: user._id,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  await authService.sendTokenResponse(user, 201, res, req);
});

// ─── LOGIN ───────────────────────────────────────────────────────────────────
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide email and password.', 400));
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Incorrect email or password.', 401));
  }

  if (user.status === 'pending') {
    return next(new AppError('Please verify your email address to continue.', 403));
  }

  if (user.status === 'suspended' || user.status === 'banned') {
    return next(new AppError(`Your account has been ${user.status}. Contact support.`, 403));
  }

  // Log activity
  await ActivityLog.create({
    uid: user._id,
    description: 'User logged in',
    referenceFor: 'user',
    referenceId: user._id,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  await authService.sendTokenResponse(user, 200, res, req);
});

// ─── REFRESH TOKEN ───────────────────────────────────────────────────────────
exports.refreshToken = asyncHandler(async (req, res, next) => {
  const token = req.body.refreshToken || req.signedCookies?.refreshToken;

  if (!token) return next(new AppError('No refresh token provided.', 401));

  try {
    const { user, accessToken, refreshToken } = await authService.rotateRefreshToken(token, req);

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      signed: true,
    };

    res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
    res.cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

    sendSuccess(res, { accessToken, refreshToken, user: user.toPublicJSON() }, 'Token refreshed');
  } catch (err) {
    return next(new AppError(err.message || 'Invalid refresh token.', 401));
  }
});

// ─── LOGOUT ──────────────────────────────────────────────────────────────────
exports.logout = asyncHandler(async (req, res, next) => {
  // Blacklist current access token
  if (req.token) {
    await authService.revokeToken(req.token);
  }

  // Revoke refresh token
  const refreshToken = req.body.refreshToken || req.signedCookies?.refreshToken;
  if (refreshToken) {
    await RefreshToken.findOneAndUpdate(
      { token: refreshToken },
      { isRevoked: true, revokedAt: new Date(), revokedReason: 'logout' }
    );
  }

  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');

  sendSuccess(res, {}, 'Logged out successfully');
});

// ─── LOGOUT ALL DEVICES ───────────────────────────────────────────────────────
exports.logoutAll = asyncHandler(async (req, res, next) => {
  await authService.revokeAllRefreshTokens(req.user._id, 'logout_all');
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  sendSuccess(res, {}, 'Logged out from all devices');
});

// ─── VERIFY EMAIL ────────────────────────────────────────────────────────────
exports.verifyEmail = asyncHandler(async (req, res, next) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({ emailVerificationToken: hashedToken });

  if (!user) {
    return next(new AppError('Token is invalid or has expired. Please request a new verification email.', 400));
  }

  if (user.emailVerificationExpires < Date.now()) {
    return next(new AppError('Verification link has expired. Please request a new one.', 400));
  }

  if (user.isEmailVerified) {
    return sendSuccess(res, {}, 'Email already verified. You can log in.');
  }

  user.isEmailVerified = true;
  user.status = 'active';
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save({ validateBeforeSave: false });

  sendSuccess(res, {}, 'Email verified successfully. You can now log in.');
});

// ─── RESEND VERIFICATION ──────────────────────────────────────────────────────
exports.resendVerification = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) return next(new AppError('No account found with this email.', 404));
  if (user.isEmailVerified) return next(new AppError('Email is already verified.', 400));

  const verifyToken = user.createEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  await emailService.sendWelcome(user, `${process.env.CLIENT_URL}/verify-email/${verifyToken}`);

  sendSuccess(res, {}, 'Verification email sent.');
});

// ─── FORGOT PASSWORD ──────────────────────────────────────────────────────────
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return sendSuccess(res, {}, 'If an account exists, a reset link has been sent.');
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  try {
    await emailService.sendPasswordReset(user, resetUrl);
    sendSuccess(res, {}, 'Password reset link sent to your email.');
  } catch {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError('Could not send email. Please try again later.', 500));
  }
});

// ─── RESET PASSWORD ───────────────────────────────────────────────────────────
exports.resetPassword = asyncHandler(async (req, res, next) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) return next(new AppError('Token is invalid or has expired.', 400));

  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  await authService.revokeAllRefreshTokens(user._id, 'password_reset');

  try {
    await emailService.sendPasswordChangedAlert(user);
  } catch { /* silent */ }

  sendSuccess(res, {}, 'Password reset successful. Please log in with your new password.');
});

// ─── CHANGE PASSWORD ──────────────────────────────────────────────────────────
exports.changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.comparePassword(currentPassword))) {
    return next(new AppError('Current password is incorrect.', 401));
  }

  user.password = newPassword;
  await user.save();

  await authService.revokeAllRefreshTokens(user._id, 'password_changed');

  try {
    await emailService.sendPasswordChangedAlert(user);
  } catch { /* silent */ }

  sendSuccess(res, {}, 'Password changed successfully. Please log in again.');
});

// ─── GET ME ──────────────────────────────────────────────────────────────────
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  sendSuccess(res, { user: user.toPublicJSON() }, 'Profile fetched');
});

// ─── ACTIVE SESSIONS ─────────────────────────────────────────────────────────
exports.getActiveSessions = asyncHandler(async (req, res, next) => {
  const sessions = await RefreshToken.find({
    userId: req.user._id,
    isRevoked: false,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 }).select('-token');

  sendSuccess(res, { sessions }, 'Active sessions fetched');
});

// ─── REVOKE SESSION ───────────────────────────────────────────────────────────
exports.revokeSession = asyncHandler(async (req, res, next) => {
  const session = await RefreshToken.findOne({ _id: req.params.sessionId, userId: req.user._id });
  if (!session) return next(new AppError('Session not found.', 404));

  session.isRevoked = true;
  session.revokedAt = new Date();
  session.revokedReason = 'user_revoked';
  await session.save();

  sendSuccess(res, {}, 'Session revoked');
});

// ─── OAUTH (GOOGLE / LINKEDIN) ─────────────────────────────────────────────────
const issueOAuthRedirect = async (req, res, user) => {
  const accessToken = authService.generateAccessToken(user._id, user.role);
  const refreshToken = await authService.generateRefreshToken(user._id, req);

  await User.findByIdAndUpdate(user._id, {
    lastLogin: new Date(),
    lastActive: new Date(),
    $inc: { loginCount: 1 },
  });

  await ActivityLog.create({
    uid: user._id,
    description: `User logged in via ${user.socialMedia || 'social'}`,
    referenceFor: 'user',
    referenceId: user._id,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  const redirectUrl = `${process.env.CLIENT_URL}/oauth-callback#accessToken=${accessToken}&refreshToken=${refreshToken}`;
  res.redirect(redirectUrl);
};

const oauthFailureRedirect = (res, message) => {
  const reason = encodeURIComponent(message || 'OAuth login failed. Please try again.');
  res.redirect(`${process.env.CLIENT_URL}/login?error=${reason}`);
};

// GET /auth/google — kicks off the redirect to Google's consent screen
exports.googleAuth = passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false,
});

// GET /auth/google/callback
exports.googleCallback = (req, res, next) => {
  passport.authenticate('google', { session: false }, async (err, user, info) => {
    if (err) {
      logger.error('Google OAuth error:', err);
      return oauthFailureRedirect(res, 'Something went wrong with Google sign-in.');
    }
    if (!user) return oauthFailureRedirect(res, info?.message);
    await issueOAuthRedirect(req, res, user);
  })(req, res, next);
};

// GET /auth/linkedin — kicks off the redirect to LinkedIn's consent screen
exports.linkedinAuth = passport.authenticate('linkedin', { session: false });

// GET /auth/linkedin/callback
exports.linkedinCallback = (req, res, next) => {
  passport.authenticate('linkedin', { session: false }, async (err, user, info) => {
    if (err) {
      logger.error('LinkedIn OAuth error:', err);
      return oauthFailureRedirect(res, 'Something went wrong with LinkedIn sign-in.');
    }
    if (!user) return oauthFailureRedirect(res, info?.message);
    await issueOAuthRedirect(req, res, user);
  })(req, res, next);
};