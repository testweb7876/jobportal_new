const nodemailer = require('nodemailer');
const logger = require('../config/logger');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async send({ to, subject, html, text }) {
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'JobPortal'}" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''),
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent to ${to}: ${info.messageId}`);
      return info;
    } catch (error) {
      logger.error(`Email failed to ${to}:`, error.message);
      throw error;
    }
  }

  // ── Email Templates ────────────────────────────────────────────────────────

  async sendWelcome(user, verifyUrl) {
    return this.send({
      to: user.email,
      subject: 'Welcome to JobPortal! Please verify your email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Welcome to JobPortal, ${user.firstName}! 🎉</h2>
          <p>Thank you for signing up. Please verify your email address to get started.</p>
          <a href="${verifyUrl}" style="display:inline-block; background:#2563eb; color:white; padding:12px 24px; border-radius:6px; text-decoration:none; margin:16px 0;">
            Verify Email Address
          </a>
          <p style="color:#666;">This link expires in 24 hours.</p>
          <p style="color:#666;">If you didn't create this account, please ignore this email.</p>
        </div>
      `,
    });
  }

  async sendPasswordReset(user, resetUrl) {
    return this.send({
      to: user.email,
      subject: 'Password Reset Request - JobPortal',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Reset Your Password</h2>
          <p>Hi ${user.firstName}, you requested a password reset.</p>
          <a href="${resetUrl}" style="display:inline-block; background:#dc2626; color:white; padding:12px 24px; border-radius:6px; text-decoration:none; margin:16px 0;">
            Reset Password
          </a>
          <p style="color:#666;">This link expires in 1 hour.</p>
          <p style="color:#666;">If you didn't request this, please ignore this email and your password will remain unchanged.</p>
        </div>
      `,
    });
  }

  async sendApplicationConfirmation(jobseeker, job) {
    return this.send({
      to: jobseeker.email,
      subject: `Application Submitted - ${job.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Application Received ✅</h2>
          <p>Hi ${jobseeker.firstName},</p>
          <p>Your application for <strong>${job.title}</strong> at <strong>${job.company}</strong> has been submitted successfully.</p>
          <p>The employer will review your application and get back to you.</p>
          <p style="color:#666; font-size:14px;">Good luck! 🤞</p>
        </div>
      `,
    });
  }

  async sendApplicationStatusUpdate(jobseeker, job, status, note = '') {
    const statusMap = {
      shortlisted: { color: '#059669', icon: '⭐', label: 'Shortlisted' },
      interview_scheduled: { color: '#7c3aed', icon: '📅', label: 'Interview Scheduled' },
      hired: { color: '#059669', icon: '🎉', label: 'Hired' },
      rejected: { color: '#dc2626', icon: '❌', label: 'Not Selected' },
    };
    const s = statusMap[status] || { color: '#2563eb', icon: '📋', label: status };

    return this.send({
      to: jobseeker.email,
      subject: `Application Update: ${s.label} - ${job.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: ${s.color};">${s.icon} Application Status Update</h2>
          <p>Hi ${jobseeker.firstName},</p>
          <p>Your application for <strong>${job.title}</strong> has been updated to: <strong style="color:${s.color}">${s.label}</strong></p>
          ${note ? `<p><strong>Note from employer:</strong> ${note}</p>` : ''}
        </div>
      `,
    });
  }

  async sendNewApplicationAlert(employer, application, jobTitle) {
    return this.send({
      to: employer.email,
      subject: `New Application Received - ${jobTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">New Application Received 📬</h2>
          <p>Hi ${employer.firstName},</p>
          <p>You have received a new application for <strong>${jobTitle}</strong>.</p>
          <p>Log in to your dashboard to review the candidate's profile.</p>
        </div>
      `,
    });
  }

  async sendPackageExpiryWarning(user, packageName, expiresAt) {
    return this.send({
      to: user.email,
      subject: 'Your Package is Expiring Soon - JobPortal',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d97706;">⚠️ Package Expiry Warning</h2>
          <p>Hi ${user.firstName},</p>
          <p>Your <strong>${packageName}</strong> package expires on <strong>${new Date(expiresAt).toLocaleDateString()}</strong>.</p>
          <p>Renew now to keep your jobs and features active.</p>
        </div>
      `,
    });
  }

  async sendPaymentConfirmation(user, invoice) {
    return this.send({
      to: user.email,
      subject: `Payment Confirmed - Invoice #${invoice._id}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">Payment Confirmed ✅</h2>
          <p>Hi ${user.firstName},</p>
          <p>Your payment of <strong>${invoice.amount} ${invoice.currency || ''}</strong> has been confirmed.</p>
          <p>Invoice ID: <strong>#${invoice._id}</strong></p>
        </div>
      `,
    });
  }

  async sendJobAlert(user, jobs) {
    const jobList = jobs.map((j) => `<li><a href="#">${j.title}</a> - ${j.company} (${j.city || 'Remote'})</li>`).join('');
    return this.send({
      to: user.email,
      subject: `${jobs.length} New Jobs Match Your Alert - JobPortal`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">New Jobs Found 🔔</h2>
          <p>Hi ${user.firstName}, we found ${jobs.length} new jobs matching your alert:</p>
          <ul>${jobList}</ul>
        </div>
      `,
    });
  }

  // ── NEW TEMPLATES ──────────────────────────────────────────────────────────

  async sendJobModerationUpdate(employer, job, status, note = '') {
    const statusMap = {
      approved: { color: '#059669', icon: '✅', label: 'Approved' },
      rejected: { color: '#dc2626', icon: '❌', label: 'Rejected' },
      paused: { color: '#d97706', icon: '⏸️', label: 'Paused' },
    };
    const s = statusMap[status] || { color: '#2563eb', icon: '📋', label: status };

    return this.send({
      to: employer.email,
      subject: `Job ${s.label}: ${job.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: ${s.color};">${s.icon} Job ${s.label}</h2>
          <p>Hi ${employer.firstName},</p>
          <p>Your job posting <strong>${job.title}</strong> has been <strong style="color:${s.color}">${s.label.toLowerCase()}</strong> by our team.</p>
          ${note ? `<p><strong>Note:</strong> ${note}</p>` : ''}
          ${status === 'approved' ? `<p>Your job is now live and visible to candidates.</p>` : ''}
        </div>
      `,
    });
  }

  async sendCompanyVerificationUpdate(employer, company, status, note = '') {
    const approved = status === 'approved';
    return this.send({
      to: employer.email,
      subject: `Company Verification ${approved ? 'Approved' : 'Rejected'} - ${company.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: ${approved ? '#059669' : '#dc2626'};">${approved ? '✅ Verification Approved' : '❌ Verification Rejected'}</h2>
          <p>Hi ${employer.firstName},</p>
          <p>The verification request for <strong>${company.name}</strong> has been <strong>${approved ? 'approved' : 'rejected'}</strong>.</p>
          ${note ? `<p><strong>Note from admin:</strong> ${note}</p>` : ''}
          ${approved ? `<p>Your company now displays a verified badge.</p>` : `<p>Please review the note above and resubmit your documents if needed.</p>`}
        </div>
      `,
    });
  }

  async sendAccountStatusUpdate(user, status, reason = '') {
    const statusMap = {
      suspended: { color: '#d97706', icon: '⚠️', label: 'Suspended' },
      banned: { color: '#dc2626', icon: '🚫', label: 'Banned' },
      active: { color: '#059669', icon: '✅', label: 'Reactivated' },
      pending: { color: '#2563eb', icon: 'ℹ️', label: 'Pending' },
    };
    const s = statusMap[status] || { color: '#2563eb', icon: '📋', label: status };

    return this.send({
      to: user.email,
      subject: `Account Status Update - ${s.label}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: ${s.color};">${s.icon} Account ${s.label}</h2>
          <p>Hi ${user.firstName},</p>
          <p>Your account status has been changed to: <strong style="color:${s.color}">${s.label}</strong></p>
          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
          ${['suspended', 'banned'].includes(status) ? `<p>If you believe this is a mistake, please contact support.</p>` : ''}
        </div>
      `,
    });
  }

  async sendPasswordChangedAlert(user) {
    return this.send({
      to: user.email,
      subject: 'Your Password Was Changed - JobPortal',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">🔒 Password Changed</h2>
          <p>Hi ${user.firstName},</p>
          <p>This is a confirmation that your account password was just changed.</p>
          <p style="color:#666;">If you did not make this change, please contact support immediately and secure your account.</p>
        </div>
      `,
    });
  }

  async sendPaymentFailed(user, invoice) {
    return this.send({
      to: user.email,
      subject: 'Payment Failed - JobPortal',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">❌ Payment Failed</h2>
          <p>Hi ${user.firstName},</p>
          <p>We were unable to process your payment of <strong>${invoice.amount} ${invoice.currency || ''}</strong>.</p>
          <p>Please try again or use a different payment method.</p>
        </div>
      `,
    });
  }

  async sendRefundStatusUpdate(user, invoice, status) {
    const statusMap = {
      requested: { color: '#2563eb', icon: '📨', label: 'Refund Request Received' },
      processed: { color: '#059669', icon: '✅', label: 'Refund Processed' },
      rejected: { color: '#dc2626', icon: '❌', label: 'Refund Rejected' },
    };
    const s = statusMap[status] || { color: '#2563eb', icon: '📋', label: status };

    return this.send({
      to: user.email,
      subject: `${s.label} - Invoice #${invoice._id}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: ${s.color};">${s.icon} ${s.label}</h2>
          <p>Hi ${user.firstName},</p>
          <p>Your refund request for invoice <strong>#${invoice._id}</strong> (amount: ${invoice.amount} ${invoice.currency || ''}) is now: <strong style="color:${s.color}">${s.label}</strong></p>
          ${status === 'requested' ? `<p>Our team will review it within 5-7 business days.</p>` : ''}
        </div>
      `,
    });
  }

  async sendNotificationEmail(user, notification) {
    return this.send({
      to: user.email,
      subject: notification.title || 'New Notification - JobPortal',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">${notification.title || 'New Notification'}</h2>
          <p>Hi ${user.firstName},</p>
          <p>${notification.message || ''}</p>
        </div>
      `,
    });
  }

  async sendBankProofReceived(user, invoice) {
    return this.send({
      to: user.email,
      subject: 'Bank Transfer Proof Received - JobPortal',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">📥 Payment Proof Received</h2>
          <p>Hi ${user.firstName},</p>
          <p>We've received your bank transfer proof for invoice <strong>#${invoice._id}</strong> (amount: ${invoice.amount}).</p>
          <p>Our team will verify it within 24-48 hours and activate your package.</p>
        </div>
      `,
    });
  }
}

module.exports = new EmailService();