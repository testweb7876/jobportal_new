const express = require('express');
const router = express.Router();
const appController = require('../controllers/application.controller');
const { protect, employerOnly, jobseekerOnly } = require('../middleware/auth.middleware');

router.post('/',                                 protect, jobseekerOnly, appController.applyJob);
router.get('/my',                                protect, jobseekerOnly, appController.getMyApplications);
router.get('/company-overview',                  protect, employerOnly,  appController.getCompanyApplicationsOverview);
router.get('/job/:jobId',                        protect, employerOnly,  appController.getJobApplications);
router.get('/:id',                               protect,               appController.getApplication);
router.patch('/:id/status',                      protect, employerOnly,  appController.updateApplicationStatus);
router.patch('/:id/withdraw',                    protect, jobseekerOnly, appController.withdrawApplication);
router.patch('/:id/rate',                        protect, employerOnly,  appController.rateApplication);

module.exports = router;
