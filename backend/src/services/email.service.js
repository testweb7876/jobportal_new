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
}

module.exports = new EmailService();
