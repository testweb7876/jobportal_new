const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const geoip = require('geoip-lite');
const UAParser = require('ua-parser-js');
const User = require('../models/User.model');
const RefreshToken = require('../models/RefreshToken.model');
const { cache } = require('../config/redis');
const logger = require('../config/logger');

// ─── TOKEN GENERATION ────────────────────────────────────────────────────────
exports.generateAccessToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });
};

exports.generateRefreshToken = async (userId, req) => {
  const token = uuidv4() + '-' + crypto.randomBytes(32).toString('hex');
  const ua = new UAParser(req.headers['user-agent']);
  const geo = geoip.lookup(req.ip) || {};

  const refreshToken = await RefreshToken.create({
    userId,
    token,
    deviceId:   req.headers['x-device-id'] || uuidv4(),
    deviceName: req.headers['x-device-name'] || 'Unknown Device',
    browser:    `${ua.getBrowser().name || 'Unknown'} ${ua.getBrowser().version || ''}`,
    os:         `${ua.getOS().name || 'Unknown'} ${ua.getOS().version || ''}`,
    ipAddress:  req.ip,
    userAgent:  req.headers['user-agent'],
    expiresAt:  new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  });

  return refreshToken.token;
};

// ─── SEND TOKENS RESPONSE ────────────────────────────────────────────────────
exports.sendTokenResponse = async (user, statusCode, res, req) => {
  const accessToken = exports.generateAccessToken(user._id, user.role);
  const refreshToken = await exports.generateRefreshToken(user._id, req);

  // Update last login
  await User.findByIdAndUpdate(user._id, {
    lastLogin: new Date(),
    lastActive: new Date(),
    $inc: { loginCount: 1 },
  });

  // Cookie options
  const cookieOptions = {
    expires: new Date(Date.now() + (parseInt(process.env.COOKIE_EXPIRES_DAYS) || 7) * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    signed: true,
  };

  res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
  res.cookie('refreshToken', refreshToken, cookieOptions);

  const userData = user.toPublicJSON ? user.toPublicJSON() : user.toObject();

  res.status(statusCode).json({
    success: true,
    message: statusCode === 201 ? 'Account created successfully.' : 'Login successful.',
    accessToken,
    refreshToken,
    user: userData,
  });
};

// ─── REFRESH TOKEN ROTATION ───────────────────────────────────────────────────
exports.rotateRefreshToken = async (oldToken, req) => {
  const existing = await RefreshToken.findOne({ token: oldToken });

  if (!existing || !existing.isValid()) {
    // If already used (rotation attack) — revoke all tokens for this user
    if (existing) {
      await RefreshToken.updateMany({ userId: existing.userId }, { isRevoked: true, revokedReason: 'rotation_attack' });
    }
    throw new Error('Invalid or expired refresh token');
  }

  // Revoke old token
  existing.isRevoked = true;
  existing.revokedAt = new Date();
  existing.revokedReason = 'rotated';
  await existing.save();

  const user = await User.findById(existing.userId);
  if (!user || user.status !== 'active') throw new Error('User not found or inactive');

  const newAccessToken = exports.generateAccessToken(user._id, user.role);
  const newRefreshToken = await exports.generateRefreshToken(user._id, req);

  return { user, accessToken: newAccessToken, refreshToken: newRefreshToken };
};

// ─── REVOKE TOKEN ─────────────────────────────────────────────────────────────
exports.revokeToken = async (token) => {
  // Blacklist access token in Redis (TTL = remaining token time)
  try {
    const decoded = jwt.decode(token);
    if (decoded?.exp) {
      const ttl = decoded.exp - Math.floor(Date.now() / 1000);
      if (ttl > 0) await cache.set(`blacklist:${token}`, '1', ttl);
    }
  } catch { /* ignore */ }
};

// ─── REVOKE ALL REFRESH TOKENS ────────────────────────────────────────────────
exports.revokeAllRefreshTokens = async (userId, reason = 'logout_all') => {
  await RefreshToken.updateMany(
    { userId, isRevoked: false },
    { isRevoked: true, revokedAt: new Date(), revokedReason: reason }
  );
};
