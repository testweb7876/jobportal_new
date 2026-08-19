const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const contactController = require('../controllers/contact.controller');
const validate = require('../middleware/validate.middleware'); 
const { protect, restrictTo } = require('../middleware/auth.middleware'); 
const {
  submitContactSchema,
  updateStatusSchema,
  respondSchema,
} = require('../validators/contact.validation');

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5,                  
  message: { success: false, message: 'Too many messages sent. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── PUBLIC ────────────────────────────────────────────────────────────────
router.post('/', contactLimiter, validate(submitContactSchema), contactController.submitContact);

// ─── ADMIN ONLY ──────────────────────────────────────────────────────────────
router.use(protect, restrictTo('admin', 'superadmin'));

router.get('/', contactController.getContacts);
router.get('/:id', contactController.getContactById);
router.patch('/:id/status', validate(updateStatusSchema), contactController.updateContactStatus);
router.patch('/:id/respond', validate(respondSchema), contactController.respondToContact);
router.delete('/:id', contactController.deleteContact);

module.exports = router;