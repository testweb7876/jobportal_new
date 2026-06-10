// ── ENUMS & CONSTANTS ────────────────────────────────────────────────────────

exports.USER_ROLES = {
  JOBSEEKER: 'jobseeker',
  EMPLOYER: 'employer',
  ADMIN: 'admin',
  SUPERADMIN: 'superadmin',
};

exports.USER_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  BANNED: 'banned',
};

exports.JOB_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
  PAUSED: 'paused',
  DELETED: 'deleted',
};

exports.APPLICATION_STATUS = {
  APPLIED: 'applied',
  REVIEWED: 'reviewed',
  SHORTLISTED: 'shortlisted',
  INTERVIEW_SCHEDULED: 'interview_scheduled',
  INTERVIEWED: 'interviewed',
  OFFERED: 'offered',
  HIRED: 'hired',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn',
};

exports.PAYMENT_METHODS = {
  STRIPE: 'stripe',
  PAYPAL: 'paypal',
  BANK: 'bank',
  FREE: 'free',
  MANUAL: 'manual',
};

exports.PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  CANCELLED: 'cancelled',
};

exports.NOTIFICATION_TYPES = {
  APPLICATION_RECEIVED: 'application_received',
  SHORTLISTED: 'shortlisted',
  HIRED: 'hired',
  REJECTED: 'rejected',
  INTERVIEW_SCHEDULED: 'interview_scheduled',
  PACKAGE_EXPIRY: 'package_expiry',
  PACKAGE_EXPIRED: 'package_expired',
  PAYMENT_SUCCESS: 'payment_success',
  PAYMENT_FAILED: 'payment_failed',
  MESSAGE_RECEIVED: 'message_received',
  JOB_ALERT: 'job_alert',
  SYSTEM: 'system',
};

exports.CLOUDINARY_FOLDERS = {
  USERS: 'jobportal/users',
  COMPANIES: 'jobportal/companies',
  RESUMES: 'jobportal/resumes',
  MESSAGES: 'jobportal/messages',
  VERIFICATIONS: 'jobportal/verifications',
  GALLERY: 'jobportal/gallery',
};

exports.WORKPLACE_TYPES = {
  ONSITE: 'onsite',
  REMOTE: 'remote',
  HYBRID: 'hybrid',
};

exports.CACHE_TTL = {
  SHORT: 60,
  MEDIUM: 300,
  LONG: 3600,
  DAY: 86400,
};

exports.PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};
