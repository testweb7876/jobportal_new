const { Queue, Worker } = require('bullmq');
const logger = require('../config/logger');

const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
};

let notificationQueue;
let emailQueue;

const initQueues = () => {
  try {
    // ── Notification Queue ───────────────────────────────────────────────────
    notificationQueue = new Queue('notifications', { connection: redisConnection });

    const notificationWorker = new Worker('notifications', async (job) => {
      if (job.name === 'send-email-notification') {
        const Notification = require('../models/Notification.model');
        const notification = await Notification.findById(job.data.notificationId)
          .populate('recipientId', 'email firstName');

        if (notification && !notification.emailSent) {
          // Send email
          await Notification.findByIdAndUpdate(job.data.notificationId, { emailSent: true });
        }
      }
    }, { connection: redisConnection });

    notificationWorker.on('completed', (job) => logger.info(`Notification job ${job.id} completed`));
    notificationWorker.on('failed', (job, err) => logger.error(`Notification job ${job.id} failed:`, err));

    // ── Email Queue ──────────────────────────────────────────────────────────
    emailQueue = new Queue('emails', { connection: redisConnection });

    const emailWorker = new Worker('emails', async (job) => {
      const emailService = require('../services/email.service');
      if (job.name === 'send-job-alert') {
        const { userId, jobs } = job.data;
        const User = require('../models/User.model');
        const user = await User.findById(userId);
        if (user && jobs?.length) {
          await emailService.sendJobAlert(user, jobs);
        }
      }
    }, { connection: redisConnection });

    emailWorker.on('failed', (job, err) => logger.error(`Email job ${job.id} failed:`, err));

    logger.info('✅ BullMQ Queues initialized');
  } catch (error) {
    logger.warn('⚠️ BullMQ/Redis not available, running without queues:', error.message);
  }
};

module.exports = { initQueues, get notificationQueue() { return notificationQueue; }, get emailQueue() { return emailQueue; } };
