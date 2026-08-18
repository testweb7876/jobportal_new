const express = require('express');
const router = express.Router();
const Job = require('../models/Job.model');
const Company = require('../models/Company.model');
const { cache } = require('../config/redis');

const CLIENT_URL = process.env.CLIENT_URL?.split(',')[0] || 'http://localhost:3000';

const escapeXml = (str = '') =>
  str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

// ─── MAIN SITEMAP INDEX ────────────────────────────────────────────────────
router.get('/sitemap.xml', async (req, res) => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>${CLIENT_URL}/sitemap-jobs.xml</loc></sitemap>
  <sitemap><loc>${CLIENT_URL}/sitemap-companies.xml</loc></sitemap>
  <sitemap><loc>${CLIENT_URL}/sitemap-static.xml</loc></sitemap>
</sitemapindex>`;

  res.header('Content-Type', 'application/xml');
  res.send(xml);
});

// ─── JOBS SITEMAP ──────────────────────────────────────────────────────────
router.get('/sitemap-jobs.xml', async (req, res) => {
  const cacheKey = 'sitemap:jobs';
  const cached = await cache.get(cacheKey);
  if (cached) {
    res.header('Content-Type', 'application/xml');
    return res.send(cached);
  }

  const jobs = await Job.find({
    status: 'approved',
    isDeleted: false,
    $or: [{ expiresAt: { $gt: new Date() } }, { expiresAt: null }],
  })
    .select('slug updatedAt')
    .sort({ updatedAt: -1 })
    .limit(50000) // sitemap spec hard limit per file
    .lean();

  const urls = jobs.map((job) => `
  <url>
    <loc>${CLIENT_URL}/jobs/${escapeXml(job.slug)}</loc>
    <lastmod>${new Date(job.updatedAt).toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`;

  await cache.set(cacheKey, xml, 3600); // cache 1 hour
  res.header('Content-Type', 'application/xml');
  res.send(xml);
});

// ─── COMPANIES SITEMAP ─────────────────────────────────────────────────────
router.get('/sitemap-companies.xml', async (req, res) => {
  const cacheKey = 'sitemap:companies';
  const cached = await cache.get(cacheKey);
  if (cached) {
    res.header('Content-Type', 'application/xml');
    return res.send(cached);
  }

  const companies = await Company.find({ status: 1, isDeleted: false })
    .select('slug updatedAt')
    .sort({ updatedAt: -1 })
    .limit(50000)
    .lean();

  const urls = companies.map((c) => `
  <url>
    <loc>${CLIENT_URL}/companies/${escapeXml(c.slug)}</loc>
    <lastmod>${new Date(c.updatedAt).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`;

  await cache.set(cacheKey, xml, 3600);
  res.header('Content-Type', 'application/xml');
  res.send(xml);
});

// ─── STATIC PAGES SITEMAP ──────────────────────────────────────────────────
router.get('/sitemap-static.xml', (req, res) => {
  const staticPages = ['', '/jobs', '/companies', '/pricing', '/login', '/register'];

  const urls = staticPages.map((page) => `
  <url>
    <loc>${CLIENT_URL}${page}</loc>
    <changefreq>weekly</changefreq>
    <priority>${page === '' ? '1.0' : '0.5'}</priority>
  </url>`).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`;

  res.header('Content-Type', 'application/xml');
  res.send(xml);
});

// ─── ROBOTS.TXT ─────────────────────────────────────────────────────────────
router.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(`User-agent: *
Allow: /
Disallow: /dashboard
Disallow: /admin
Disallow: /messages
Disallow: /oauth-callback

Sitemap: ${CLIENT_URL}/sitemap.xml`);
});

module.exports = router;