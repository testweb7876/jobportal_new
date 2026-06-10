const { createClient } = require('redis');
const logger = require('./logger');

let redisClient;

const connectRedis = async () => {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      password: process.env.REDIS_PASSWORD || undefined,
      socket: { reconnectStrategy: (retries) => Math.min(retries * 100, 3000) },
    });

    redisClient.on('error', (err) => logger.error('Redis error:', err));
    redisClient.on('connect', () => logger.info('✅ Redis Connected'));
    redisClient.on('reconnecting', () => logger.warn('Redis reconnecting...'));

    await redisClient.connect();
  } catch (error) {
    logger.error(`Redis connection error: ${error.message}`);
    // Don't exit — app can run without Redis (degraded mode)
  }
};

const getRedis = () => redisClient;

const cache = {
  async get(key) {
    try {
      if (!redisClient?.isReady) return null;
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch { return null; }
  },

  async set(key, value, ttlSeconds = 300) {
    try {
      if (!redisClient?.isReady) return;
      await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
    } catch { /* silent */ }
  },

  async del(key) {
    try {
      if (!redisClient?.isReady) return;
      await redisClient.del(key);
    } catch { /* silent */ }
  },

  async delPattern(pattern) {
    try {
      if (!redisClient?.isReady) return;
      const keys = await redisClient.keys(pattern);
      if (keys.length) await redisClient.del(keys);
    } catch { /* silent */ }
  },

  async exists(key) {
    try {
      if (!redisClient?.isReady) return false;
      return await redisClient.exists(key);
    } catch { return false; }
  },
};

module.exports = connectRedis;
module.exports.getRedis = getRedis;
module.exports.cache = cache;
