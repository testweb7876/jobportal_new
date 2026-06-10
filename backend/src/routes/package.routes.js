const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth.middleware');
const { asyncHandler, sendSuccess } = require('../utils/AppError');
const Package = require('../models/Package.model');
const { UserPackage } = require('../models/Payment.model');
const { cache } = require('../config/redis');

router.get('/', asyncHandler(async (req, res) => {
  const cached = await cache.get('packages:all');
  if (cached) return sendSuccess(res, cached);
  const filter = { status: true };
  if (req.query.for) filter.packageFor = { $in: [req.query.for, 'both'] };
  const packages = await Package.find(filter).populate('currencyId', 'symbol code').sort({ price: 1 }).lean();
  await cache.set('packages:all', { packages }, 300);
  sendSuccess(res, { packages });
}));

router.get('/my-package', protect, asyncHandler(async (req, res) => {
  const pkg = await UserPackage.findOne({ uid: req.user._id, status: true, isActive: true, endDate: { $gt: new Date() } })
    .populate('packageId').lean();
  sendSuccess(res, { package: pkg });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const pkg = await Package.findById(req.params.id).populate('currencyId', 'symbol code');
  sendSuccess(res, { package: pkg });
}));

// Admin
router.post('/', protect, adminOnly, asyncHandler(async (req, res) => {
  const pkg = await Package.create(req.body);
  await cache.del('packages:all');
  sendSuccess(res, { package: pkg }, 'Package created', 201);
}));
router.patch('/:id', protect, adminOnly, asyncHandler(async (req, res) => {
  const pkg = await Package.findByIdAndUpdate(req.params.id, req.body, { new: true });
  await cache.del('packages:all');
  sendSuccess(res, { package: pkg }, 'Package updated');
}));
router.delete('/:id', protect, adminOnly, asyncHandler(async (req, res) => {
  await Package.findByIdAndUpdate(req.params.id, { status: false });
  await cache.del('packages:all');
  sendSuccess(res, {}, 'Package deactivated');
}));

module.exports = router;
