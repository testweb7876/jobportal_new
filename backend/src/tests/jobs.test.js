const request = require('supertest');
const { app } = require('../server');

require('./setup');

describe('Job Endpoints', () => {
  describe('GET /api/v1/jobs', () => {
    it('should return a paginated list of jobs', async () => {
      const res = await request(app).get('/api/v1/jobs');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toBeDefined();
    });

    it('should respect the limit query param (capped at 50)', async () => {
      const res = await request(app).get('/api/v1/jobs?limit=9999');

      expect(res.status).toBe(200);
      expect(res.body.pagination.limit).toBeLessThanOrEqual(50);
    });

    it('should filter by city', async () => {
      const res = await request(app).get('/api/v1/jobs?city=Mumbai');
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/v1/jobs/stats', () => {
    it('should return platform stats', async () => {
      const res = await request(app).get('/api/v1/jobs/stats');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('totalJobs');
      expect(res.body.data).toHaveProperty('totalCompanies');
    });
  });

  describe('GET /api/v1/jobs/:id', () => {
    it('should return 404 for a non-existent job id', async () => {
      const res = await request(app).get('/api/v1/jobs/507f1f77bcf86cd799439011');
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/v1/jobs (protected)', () => {
    it('should reject job creation without auth', async () => {
      const res = await request(app)
        .post('/api/v1/jobs')
        .send({ title: 'Test Job', description: 'Test description' });

      expect(res.status).toBe(401);
    });
  });
});