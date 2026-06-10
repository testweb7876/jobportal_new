const cron = require('node-cron');
const logger = require('../config/logger');

const initCronJobs = () => {
  // ── Job Expiry Checker (Every midnight) ───────────────────────────────────
  cron.schedule('0 0 * * *', async () => {
    try {
      const Job = require('../models/Job.model');
      const result = await Job.updateMany(
        { expiresAt: { $lt: new Date() }, status: 'approved' },
        { status: 'expired' }
      );
      logger.info(`[CRON] Expired ${result.modifiedCount} jobs`);
    } catch (err) {
      logger.error('[CRON] Job expiry error:', err);
    }
  });

  // ── Package Expiry Checker (Every midnight) ───────────────────────────────
  cron.schedule('0 1 * * *', async () => {
    try {
      const { UserPackage } = require('../models/Payment.model');
      const User = require('../models/User.model');
      const emailService = require('../services/email.service');
      const notificationService = require('../services/notification.service');

      // Deactivate expired packages
      const expired = await UserPackage.find({
        endDate: { $lt: new Date() },
        isActive: true,
      }).populate('uid', 'email firstName').populate('packageId', 'title');

      for (const pkg of expired) {
        await UserPackage.findByIdAndUpdate(pkg._id, { isActive: false, status: false });
        if (pkg.uid) {
          await notificationService.create({
            recipientId: pkg.uid._id,
            type: 'package_expired',
            title: 'Package Expired',
            message: `Your ${pkg.packageId?.title || 'package'} has expired. Renew to keep posting.`,
          });
        }
      }
      logger.info(`[CRON] Deactivated ${expired.length} expired packages`);

      // Send 3-day expiry warnings
      const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      const expiring = await UserPackage.find({
        endDate: { $lte: threeDaysFromNow, $gt: new Date() },
        isActive: true,
      }).populate('uid', 'email firstName').populate('packageId', 'title');

      for (const pkg of expiring) {
        if (pkg.uid) {
          try {
            await emailService.sendPackageExpiryWarning(pkg.uid, pkg.packageId?.title, pkg.endDate);
          } catch { /* silent */ }
        }
      }
      logger.info(`[CRON] Sent ${expiring.length} expiry warnings`);
    } catch (err) {
      logger.error('[CRON] Package expiry error:', err);
    }
  });

  // ── Job Alerts Sender (Every 6 hours) ────────────────────────────────────
  cron.schedule('0 */6 * * *', async () => {
    try {
      const { JobAlert } = require('../models/Misc.model');
      const Job = require('../models/Job.model');
      const emailService = require('../services/email.service');
      const User = require('../models/User.model');

      const alerts = await JobAlert.find({ status: 1 });

      for (const alert of alerts) {
        const query = { status: 'approved', createdAt: { $gt: alert.lastMailSend || new Date(0) } };
        if (alert.categoryId) query.categoryId = alert.categoryId;
        if (alert.keywords) query.$text = { $search: alert.keywords };
        if (alert.city) query.city = new RegExp(alert.city, 'i');

        const jobs = await Job.find(query).limit(10).lean();
        if (jobs.length) {
          const user = await User.findById(alert.uid);
          if (user) {
            await emailService.sendJobAlert(user, jobs);
            await JobAlert.findByIdAndUpdate(alert._id, { lastMailSend: new Date() });
          }
        }
      }
      logger.info(`[CRON] Processed ${alerts.length} job alerts`);
    } catch (err) {
      logger.error('[CRON] Job alerts error:', err);
    }
  });

  // ── Clean Old Logs (Weekly Sunday) ───────────────────────────────────────
  cron.schedule('0 3 * * 0', async () => {
    try {
      const { ActivityLog } = require('../models/Misc.model');
      const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 days
      const result = await ActivityLog.deleteMany({ createdAt: { $lt: cutoff } });
      logger.info(`[CRON] Cleaned ${result.deletedCount} old activity logs`);
    } catch (err) {
      logger.error('[CRON] Log cleanup error:', err);
    }
  });

  // ── Session Cleanup (Daily) ───────────────────────────────────────────────
  cron.schedule('0 2 * * *', async () => {
    try {
      const RefreshToken = require('../models/RefreshToken.model');
      await RefreshToken.deleteMany({ expiresAt: { $lt: new Date() } });
      logger.info('[CRON] Cleaned expired refresh tokens');
    } catch (err) {
      logger.error('[CRON] Session cleanup error:', err);
    }
  });

  logger.info('✅ Cron jobs initialized');
};

module.exports = { initCronJobs };
