const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');
const logger = require('./logger');

exports.setupSocketRedisAdapter = async (io) => {
  if (process.env.NODE_ENV === 'test') {
    logger.info('Skipping Socket.io Redis adapter in test environment');
    return;
  }

  try {
    const pubClient = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
    const subClient = pubClient.duplicate();

    await Promise.all([pubClient.connect(), subClient.connect()]);

    io.adapter(createAdapter(pubClient, subClient));
    logger.info('✅ Socket.io Redis adapter connected (multi-instance ready)');
  } catch (err) {
    logger.warn('⚠️ Socket.io Redis adapter failed to connect — running in single-instance mode:', err.message);
  }
};