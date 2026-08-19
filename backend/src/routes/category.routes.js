const express = require('express');
const router = express.Router();
const { Category, JobType, CareerLevel, Education, Currency, Country, State, City } = require('../models/Misc.model');
const { AppError, asyncHandler, sendSuccess } = require('../utils/AppError');
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

// ── Admin CRUD: Categories ──────────────────────────────────────────────────
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

// ── Admin CRUD: Job Types ───────────────────────────────────────────────────
router.post('/job-types', protect, adminOnly, asyncHandler(async (req, res) => {
  const jt = await JobType.create(req.body);
  await cache.del('jobtypes');
  sendSuccess(res, { jobType: jt }, 'Created', 201);
}));
router.patch('/job-types/:id', protect, adminOnly, asyncHandler(async (req, res) => {
  const jt = await JobType.findByIdAndUpdate(req.params.id, req.body, { new: true });
  await cache.del('jobtypes');
  sendSuccess(res, { jobType: jt }, 'Updated');
}));
router.delete('/job-types/:id', protect, adminOnly, asyncHandler(async (req, res) => {
  await JobType.findByIdAndDelete(req.params.id);
  await cache.del('jobtypes');
  sendSuccess(res, {}, 'Deleted');
}));

// ── Admin CRUD: Career Levels ───────────────────────────────────────────────
router.post('/career-levels', protect, adminOnly, asyncHandler(async (req, res) => {
  const cl = await CareerLevel.create({ title: req.body.title, status: true });
  await cache.del('careerlevels');
  sendSuccess(res, { careerLevel: cl }, 'Created', 201);
}));
router.patch('/career-levels/:id', protect, adminOnly, asyncHandler(async (req, res) => {
  const cl = await CareerLevel.findByIdAndUpdate(req.params.id, req.body, { new: true });
  await cache.del('careerlevels');
  sendSuccess(res, { careerLevel: cl }, 'Updated');
}));
router.delete('/career-levels/:id', protect, adminOnly, asyncHandler(async (req, res) => {
  await CareerLevel.findByIdAndDelete(req.params.id);
  await cache.del('careerlevels');
  sendSuccess(res, {}, 'Deleted');
}));

// ── Admin CRUD: Education ───────────────────────────────────────────────────
router.post('/education', protect, adminOnly, asyncHandler(async (req, res) => {
  const edu = await Education.create({ title: req.body.title, isActive: true });
  await cache.del('education');
  sendSuccess(res, { education: edu }, 'Created', 201);
}));
router.patch('/education/:id', protect, adminOnly, asyncHandler(async (req, res) => {
  const edu = await Education.findByIdAndUpdate(req.params.id, req.body, { new: true });
  await cache.del('education');
  sendSuccess(res, { education: edu }, 'Updated');
}));
router.delete('/education/:id', protect, adminOnly, asyncHandler(async (req, res) => {
  await Education.findByIdAndDelete(req.params.id);
  await cache.del('education');
  sendSuccess(res, {}, 'Deleted');
}));

// ── Admin CRUD: Currencies ──────────────────────────────────────────────────
router.post('/currencies', protect, adminOnly, asyncHandler(async (req, res, next) => {
  const { title, code, symbol } = req.body;
  if (!code) return next(new AppError('Currency code is required.', 400));

  try {
    const currency = await Currency.create({
      title,
      code: code.toUpperCase(),
      symbol,
      status: true,
    });
    await cache.del('currencies');
    sendSuccess(res, { currency }, 'Created', 201);
  } catch (err) {
    if (err.code === 11000) {
      return next(new AppError(`Currency code "${code.toUpperCase()}" already exists.`, 409));
    }
    throw err;
  }
}));

router.patch('/currencies/:id', protect, adminOnly, asyncHandler(async (req, res, next) => {
  const update = { ...req.body };
  if (update.code) update.code = update.code.toUpperCase();

  try {
    const currency = await Currency.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });
    if (!currency) return next(new AppError('Currency not found.', 404));
    await cache.del('currencies');
    sendSuccess(res, { currency }, 'Updated');
  } catch (err) {
    if (err.code === 11000) {
      return next(new AppError(`Currency code "${update.code}" already exists.`, 409));
    }
    throw err;
  }
}));

router.delete('/currencies/:id', protect, adminOnly, asyncHandler(async (req, res) => {
  await Currency.findByIdAndDelete(req.params.id);
  await cache.del('currencies');
  sendSuccess(res, {}, 'Deleted');
}));

module.exports = router;