const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');
const paymentController = require('../controllers/payment.controller');

router.use(protect, adminOnly);

router.get('/dashboard',                   adminController.getDashboard);
router.get('/users',                       adminController.getUsers);
router.patch('/users/:id/status',          adminController.updateUserStatus);
router.delete('/users/:id',                adminController.deleteUser);
router.get('/jobs',                        adminController.getAllJobs);
router.get('/revenue',                     adminController.getRevenueReport);
router.get('/reports',                     adminController.getReports);
router.patch('/reports/:id',               adminController.resolveReport);
router.get('/system-errors',               adminController.getSystemErrors);
router.get('/activity-logs',               adminController.getActivityLogs);
router.get('/bank-transfers',              adminController.getPendingBankTransfers);
router.get('/invoices', protect, adminOnly, adminController.getInvoices);

module.exports = router;
