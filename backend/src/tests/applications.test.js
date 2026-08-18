const request = require('supertest');
const { app } = require('../server');

require('./setup');

describe('Application Endpoints', () => {
  describe('POST /api/v1/applications (protected)', () => {
    it('should reject application submission without auth', async () => {
      const res = await request(app)
        .post('/api/v1/applications')
        .send({ jobId: '507f1f77bcf86cd799439011' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/applications/my (protected)', () => {
    it('should reject without auth', async () => {
      const res = await request(app).get('/api/v1/applications/my');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/applications/:id (protected)', () => {
    it('should reject without auth', async () => {
      const res = await request(app).get('/api/v1/applications/507f1f77bcf86cd799439011');
      expect(res.status).toBe(401);
    });
  });
});