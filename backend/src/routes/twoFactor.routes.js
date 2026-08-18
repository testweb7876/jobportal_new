const express = require('express');
const router = express.Router();
const twoFactorController = require('../controllers/twoFactor.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/setup',        protect, twoFactorController.setupTwoFactor);
router.post('/verify-enable', protect, twoFactorController.verifyAndEnableTwoFactor);
router.post('/verify-login',  twoFactorController.verifyLoginTwoFactor); // no protect — happens before full login
router.post('/disable',      protect, twoFactorController.disableTwoFactor);

module.exports = router;