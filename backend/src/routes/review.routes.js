const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const { protect, adminOnly, employerOnly } = require('../middleware/auth.middleware');

router.get('/company/:companyId',    reviewController.getCompanyReviews);
router.post('/',                     protect, reviewController.createReview);
router.get('/my',                    protect, reviewController.getMyReviews);
router.patch('/:id',                 protect, reviewController.updateReview);
router.delete('/:id',                protect, reviewController.deleteReview);
router.post('/:id/helpful',          protect, reviewController.toggleHelpful);
router.post('/:id/respond',          protect, employerOnly, reviewController.respondToReview);
router.get('/admin/all',             protect, adminOnly, reviewController.getAllReviewsAdmin);
router.get('/admin/pending',         protect, adminOnly, reviewController.getPendingReviews);
router.patch('/admin/:id/moderate',  protect, adminOnly, reviewController.moderateReview);

module.exports = router;