const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/User.model');
const { AppError } = require('../utils/AppError');
const { cache } = require('../config/redis');
const logger = require('../config/logger');

// ─── PROTECT ─────────────────────────────────────────────────────────────────
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Get token from header or cookie
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return next(new AppError('You are not logged in. Please log in to access this resource.', 401));
    }

    // Check blacklisted token (Redis)
    const isBlacklisted = await cache.exists(`blacklist:${token}`);
    if (isBlacklisted) {
      return next(new AppError('Token has been invalidated. Please log in again.', 401));
    }

    // Verify token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // Check if user still exists
    const user = await User.findById(decoded.id).select('+password');
    if (!user) {
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    // Check if user is active
    if (user.status === 'suspended' || user.status === 'banned') {
      return next(new AppError(`Your account has been ${user.status}. Contact support.`, 403));
    }

    // Check if password changed after token issued
    if (user.changedPasswordAfter(decoded.iat)) {
      return next(new AppError('User recently changed password. Please log in again.', 401));
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token. Please log in again.', 401));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Your token has expired. Please log in again.', 401));
    }
    next(error);
  }
};

// ─── OPTIONAL AUTH ────────────────────────────────────────────────────────────
exports.optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (token) {
      const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (user && user.status === 'active') {
        req.user = user;
      }
    }
    next();
  } catch {
    next(); // ignore errors for optional auth
  }
};

// ─── RESTRICT TO ─────────────────────────────────────────────────────────────
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action.', 403));
    }
    next();
  };
};

// ─── EMPLOYER ONLY ────────────────────────────────────────────────────────────
exports.employerOnly = (req, res, next) => {
  if (!['employer', 'admin', 'superadmin'].includes(req.user.role)) {
    return next(new AppError('This route is only for employers.', 403));
  }
  next();
};

// ─── JOBSEEKER ONLY ───────────────────────────────────────────────────────────
exports.jobseekerOnly = (req, res, next) => {
  if (!['jobseeker', 'admin', 'superadmin'].includes(req.user.role)) {
    return next(new AppError('This route is only for job seekers.', 403));
  }
  next();
};

// ─── ADMIN ONLY ───────────────────────────────────────────────────────────────
exports.adminOnly = (req, res, next) => {
  if (!['admin', 'superadmin'].includes(req.user.role)) {
    return next(new AppError('This route is only for administrators.', 403));
  }
  next();
};

// ─── VERIFIED ONLY ────────────────────────────────────────────────────────────
exports.verifiedOnly = (req, res, next) => {
  if (!req.user.isEmailVerified) {
    return next(new AppError('Please verify your email address to access this resource.', 403));
  }
  next();
};

// ─── RATE LIMITER FOR AUTH ────────────────────────────────────────────────────
const rateLimit = require('express-rate-limit');
exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 5,
  message: { success: false, message: 'Too many login attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});
