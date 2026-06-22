const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const { authLimiter } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, changePasswordSchema } = require('../validators/auth.validator');

router.post('/register',          authLimiter, validate(registerSchema),       authController.register);
router.post('/login',             authLimiter, validate(loginSchema),           authController.login);
router.post('/refresh-token',                                                    authController.refreshToken);
router.post('/logout',            protect,                                       authController.logout);
router.post('/logout-all',        protect,                                       authController.logoutAll);
router.post('/forgot-password',   authLimiter, validate(forgotPasswordSchema),  authController.forgotPassword);
router.patch('/reset-password/:token',   validate(resetPasswordSchema),         authController.resetPassword);
router.get('/verify-email/:token',                                              authController.verifyEmail);
router.post('/resend-verification',      authLimiter,                           authController.resendVerification);
router.patch('/change-password',  protect, validate(changePasswordSchema),      authController.changePassword);
router.get('/me',                 protect,                                       authController.getMe);
router.get('/sessions',           protect,                                       authController.getActiveSessions);
router.delete('/sessions/:sessionId', protect,                                  authController.revokeSession);
router.get('/google', authController.googleAuth);
router.get('/google/callback', authController.googleCallback);
router.get('/linkedin', authController.linkedinAuth);
router.get('/linkedin/callback', authController.linkedinCallback);

module.exports = router;
