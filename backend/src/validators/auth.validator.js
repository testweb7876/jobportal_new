const Joi = require('joi');

const passwordSchema = Joi.string()
  .min(8).max(100)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])/)
  .messages({
    'string.pattern.base': 'Password must contain at least one uppercase, lowercase, number, and special character',
    'string.min': 'Password must be at least 8 characters',
  });

exports.registerSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(100).required(),
  lastName:  Joi.string().trim().min(2).max(100).required(),
  email:     Joi.string().email().lowercase().required(),
  password:  passwordSchema.required(),
  phone:     Joi.string().allow('').optional(),
  role:      Joi.string().valid('jobseeker', 'employer').default('jobseeker'),
});

exports.loginSchema = Joi.object({
  email:    Joi.string().email().lowercase().required(),
  password: Joi.string().required(),
});

exports.forgotPasswordSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
});

exports.resetPasswordSchema = Joi.object({
  password:        passwordSchema.required(),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required()
    .messages({ 'any.only': 'Passwords do not match' }),
});

exports.changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword:     passwordSchema.required(),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required()
    .messages({ 'any.only': 'Passwords do not match' }),
});
