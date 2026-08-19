const axios = require('axios');
const { AppError, asyncHandler } = require('../utils/AppError');

exports.verifyCaptcha = asyncHandler(async (req, res, next) => {
  // ── NEW: skip captcha verification during tests ────────────────────────
  if (
    process.env.NODE_ENV === 'test' ||
    process.env.NODE_ENV === 'development'
  ) {
    return next();
  }
  // ── END NEW ──────────────────────────────────────────────────────────

  const token = req.body.captchaToken;

  if (!token) {
    return next(new AppError('Captcha verification is required.', 400));
  }

  try {
    const { data } = await axios.post('https://hcaptcha.com/siteverify', null, {
      params: {
        secret: process.env.HCAPTCHA_SECRET,
        response: token,
        remoteip: req.ip,
      },
    });

    if (!data.success) {
      return next(new AppError('Captcha verification failed. Please try again.', 400));
    }

    next();
  } catch (err) {
    return next(new AppError('Could not verify captcha. Please try again.', 502));
  }
});