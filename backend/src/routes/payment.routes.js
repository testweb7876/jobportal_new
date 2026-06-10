const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');
const { uploadFile } = require('../services/cloudinary.service');
const express2 = require('express');

// Stripe webhook needs raw body
router.post('/stripe/webhook', express2.raw({ type: 'application/json' }), paymentController.stripeWebhook);

router.post('/stripe/create-session',    protect,               paymentController.createStripeSession);
router.post('/paypal/create-order',      protect,               paymentController.createPaypalOrder);
router.post('/paypal/capture',           protect,               paymentController.capturePaypalOrder);
router.post('/bank/submit-proof',        protect, uploadFile.single('proof'), paymentController.submitBankTransfer);
router.patch('/bank/:invoiceId/approve', protect, adminOnly,    paymentController.approveBankTransfer);
router.post('/free/activate',            protect,               paymentController.activateFreePackage);
router.get('/history',                   protect,               paymentController.getPaymentHistory);
router.post('/:id/refund',               protect,               paymentController.requestRefund);

module.exports = router;
