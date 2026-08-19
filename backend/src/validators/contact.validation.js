const Joi = require('joi');

exports.submitContactSchema = Joi.object({
  name:     Joi.string().trim().min(2).max(100).required(),
  email:    Joi.string().email().lowercase().required(),
  category: Joi.string().valid('general', 'jobseeker', 'employer', 'partnership', 'issue').default('general'),
  message:  Joi.string().trim().min(20).max(5000).required()
    .messages({ 'string.min': 'Message must be at least 20 characters' }),
});

exports.updateStatusSchema = Joi.object({
  status: Joi.string().valid('new', 'read', 'responded', 'closed').required(),
});

exports.respondSchema = Joi.object({
  response: Joi.string().trim().min(2).max(5000).required(),
});