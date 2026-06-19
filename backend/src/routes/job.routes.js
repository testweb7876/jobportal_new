const express = require('express');
const router = express.Router();
const jobController = require('../controllers/job.controller');
const { protect, optionalAuth, employerOnly, adminOnly } = require('../middleware/auth.middleware');

router.get('/',                   optionalAuth,          jobController.getJobs);
router.get('/featured',                                  jobController.getFeaturedJobs);
router.get('/stats',                                     jobController.getPublicStats);
router.get('/my-jobs',            protect, employerOnly, jobController.getMyJobs);
router.get('/shortlisted',        protect,               jobController.getShortlistedJobs);
router.get('/:id',                optionalAuth,          jobController.getJob);
router.get('/:id/analytics',      protect, employerOnly, jobController.getJobAnalytics);
router.post('/',                  protect, employerOnly, jobController.createJob);
router.patch('/:id',              protect,               jobController.updateJob);
router.delete('/:id',             protect,               jobController.deleteJob);
router.post('/:id/shortlist',     protect,               jobController.toggleShortlist);
router.patch('/:id/moderate',     protect, adminOnly,    jobController.moderateJob);


module.exports = router;
