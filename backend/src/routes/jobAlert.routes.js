const express = require('express');
const router = express.Router();
const controller = require('../controllers/jobAlert.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/', protect, controller.getAlerts);
router.post('/', protect, controller.createAlert);
router.patch('/:id', protect, controller.updateAlert);
router.delete('/:id', protect, controller.deleteAlert);

module.exports = router;