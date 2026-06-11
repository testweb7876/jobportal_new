const express = require('express');
const router = express.Router();

const controller = require('../controllers/jobAlert.controller');
const { protect } = require('../middleware/auth.middleware');

// Get all alerts
router.get('/', protect, controller.getAlerts);

// Create alert
router.post('/', protect, controller.createAlert);

// Update alert
router.patch('/:id', protect, controller.updateAlert);

// Delete alert
router.delete('/:id', protect, controller.deleteAlert);

module.exports = router;