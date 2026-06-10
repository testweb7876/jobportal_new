const express = require('express');
const router = express.Router();
const { Category, JobType, CareerLevel, Education, Currency, Country, State, City } = require('../models/Misc.model');
const { asyncHandler, sendSuccess } = require('../utils/AppError');
const { cache } = require('../config/redis');
const { protect, adminOnly } = require('../middleware/auth.middleware');

const cached = (key, fn, ttl = 3600) => asyncHandler(async (req, res) => {
  const c = await cache.get(key);
  if (c) return sendSuccess(res, c, 'Data fetched');
  const data = await fn();
  await cache.set(key, data, ttl);
  sendSuccess(res, data, 'Data fetched');
});

router.get('/categories',   cached('categories', async () => ({ categories: await Category.find({ isActive: true }).lean() })));
router.get('/job-types',    cached('jobtypes', async () => ({ jobTypes: await JobType.find({ isActive: true }).lean() })));
router.get('/career-levels',cached('careerlevels', async () => ({ careerLevels: await CareerLevel.find({ status: true }).lean() })));
router.get('/education',    cached('education', async () => ({ education: await Education.find({ isActive: true }).lean() })));
router.get('/currencies',   cached('currencies', async () => ({ currencies: await Currency.find({ status: true }).lean() })));
router.get('/countries',    cached('countries', async () => ({ countries: await Country.find({ enabled: true }).select('name shortCountry dialCode').lean() })));
router.get('/states/:countryId', asyncHandler(async (req, res) => {
  const states = await State.find({ countryId: req.params.countryId, enabled: true }).lean();
  sendSuccess(res, { states });
}));
router.get('/cities/:stateId', asyncHandler(async (req, res) => {
  const cities = await City.find({ stateId: req.params.stateId, enabled: true }).lean();
  sendSuccess(res, { cities });
}));

// Admin CRUD for categories
router.post('/categories',   protect, adminOnly, asyncHandler(async (req, res) => {
  const cat = await Category.create(req.body);
  await cache.del('categories');
  sendSuccess(res, { category: cat }, 'Created', 201);
}));
router.patch('/categories/:id', protect, adminOnly, asyncHandler(async (req, res) => {
  const cat = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
  await cache.del('categories');
  sendSuccess(res, { category: cat }, 'Updated');
}));
router.delete('/categories/:id', protect, adminOnly, asyncHandler(async (req, res) => {
  await Category.findByIdAndDelete(req.params.id);
  await cache.del('categories');
  sendSuccess(res, {}, 'Deleted');
}));

module.exports = router;
