// ── VALIDATE MIDDLEWARE ──────────────────────────────────────────────────────
const { AppError } = require('../utils/AppError');

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    const messages = error.details.map((d) => d.message.replace(/['"]/g, '')).join(', ');
    return next(new AppError(messages, 422));
  }
  req.body = value;
  next();
};

module.exports = validate;
