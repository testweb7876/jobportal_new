const express = require('express');
const router = express.Router();
const { asyncHandler, sendSuccess, sendPaginated } = require('../utils/AppError');
const { protect, optionalAuth } = require('../middleware/auth.middleware');
const { cache } = require('../config/redis');
const Job = require('../models/Job.model');
const Resume = require('../models/Resume.model');
const Company = require('../models/Company.model');
const { SavedSearch } = require('../models/Misc.model');

// Global search
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const { q, type = 'jobs', page = 1, limit = 20 } = req.query;
  if (!q) return sendSuccess(res, { results: [] });

  const cacheKey = `search:${type}:${q}:${page}`;
  const cached = await cache.get(cacheKey);
  if (cached) return sendPaginated(res, cached.results, cached.total, page, limit);

  let results = [], total = 0;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  if (type === 'jobs') {
    [results, total] = await Promise.all([
      Job.find({ $text: { $search: q }, status: 'approved' })
        .populate('companyId', 'name logo').populate('jobType', 'title color')
        .sort({ score: { $meta: 'textScore' } }).skip(skip).limit(parseInt(limit)).lean(),
      Job.countDocuments({ $text: { $search: q }, status: 'approved' }),
    ]);
  } else if (type === 'companies') {
    [results, total] = await Promise.all([
      Company.find({ $text: { $search: q }, status: 1 })
        .select('name slug logo city isVerified followersCount').skip(skip).limit(parseInt(limit)).lean(),
      Company.countDocuments({ $text: { $search: q }, status: 1 }),
    ]);
  } else if (type === 'resumes' && req.user?.role === 'employer') {
    [results, total] = await Promise.all([
      Resume.find({ $text: { $search: q }, published: true, searchable: true })
        .select('applicationTitle skills firstName lastName city').skip(skip).limit(parseInt(limit)).lean(),
      Resume.countDocuments({ $text: { $search: q }, published: true }),
    ]);
  }

  await cache.set(cacheKey, { results, total }, 60);
  sendPaginated(res, results, total, page, limit);
}));

// Saved searches
router.get('/saved',           protect, asyncHandler(async (req, res) => {
  const searches = await SavedSearch.find({ uid: req.user._id, status: true }).sort({ createdAt: -1 });
  sendSuccess(res, { searches });
}));
router.post('/saved',          protect, asyncHandler(async (req, res) => {
  const search = await SavedSearch.create({ uid: req.user._id, ...req.body });
  sendSuccess(res, { search }, 'Search saved', 201);
}));
router.delete('/saved/:id',    protect, asyncHandler(async (req, res) => {
  await SavedSearch.findOneAndDelete({ _id: req.params.id, uid: req.user._id });
  sendSuccess(res, {}, 'Search deleted');
}));

module.exports = router;
