const Contact = require('../models/Contact.model');
const User = require('../models/User.model');
const { AppError, asyncHandler, sendSuccess, sendPaginated } = require('../utils/AppError');
const emailService = require('../services/email.service');
const notificationService = require('../services/notification.service');
const { ActivityLog } = require('../models/Misc.model');
const logger = require('../config/logger');

// ─── PUBLIC: SUBMIT CONTACT FORM ──────────────────────────────────────────────
exports.submitContact = asyncHandler(async (req, res, next) => {
  const { name, email, category, message } = req.body;

  const contact = await Contact.create({
    uid: req.user?._id, // present if the requester happens to be logged in, otherwise undefined
    name,
    email,
    category,
    message,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  // Confirmation email to the sender — never block the response on this
  emailService.sendContactConfirmation({ email, firstName: name.split(' ')[0] }, contact)
    .catch((err) => logger.warn(`Contact confirmation email failed for ${email}: ${err.message}`));

  // Notify admin inbox — same fire-and-forget pattern
  if (process.env.ADMIN_EMAIL) {
    emailService.sendContactNotificationToAdmin(process.env.ADMIN_EMAIL, contact)
      .catch((err) => logger.warn(`Contact admin-notify email failed: ${err.message}`));
  }

  // In-app notification for every admin/superadmin, same idea as sendBroadcast
  try {
    const admins = await User.find({ role: { $in: ['admin', 'superadmin'] }, status: 'active' })
      .select('_id').lean();
    await Promise.all(admins.map((a) => notificationService.create({
      recipientId: a._id,
      type: 'system',
      title: 'New contact message',
      message: `${name} (${email}) sent a "${category}" message.`,
      refModel: 'Contact',
      refId: contact._id,
    })));
  } catch (err) {
    logger.warn(`Contact in-app admin notification failed: ${err.message}`);
  }

  await ActivityLog.create({
    uid: req.user?._id,
    description: `Contact form submitted by ${email} (${category})`,
    referenceFor: 'Contact',
    referenceId: contact._id,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  sendSuccess(res, { contact: { id: contact._id } }, "Message sent — we'll get back to you soon.", 201);
});

// ─── ADMIN: LIST CONTACT MESSAGES ─────────────────────────────────────────────
exports.getContacts = asyncHandler(async (req, res) => {
  const page  = parseInt(req.query.page)  || 1;
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);
  const filter = {};

  if (req.query.status)   filter.status   = req.query.status;
  if (req.query.category) filter.category = req.query.category;
  if (req.query.search) {
    filter.$or = [
      { name:    new RegExp(req.query.search, 'i') },
      { email:   new RegExp(req.query.search, 'i') },
      { message: new RegExp(req.query.search, 'i') },
    ];
  }

  const [contacts, total] = await Promise.all([
    Contact.find(filter)
      .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Contact.countDocuments(filter),
  ]);

  sendPaginated(res, contacts, total, page, limit);
});

// ─── ADMIN: GET ONE ────────────────────────────────────────────────────────────
exports.getContactById = asyncHandler(async (req, res, next) => {
  const contact = await Contact.findById(req.params.id)
    .populate('respondedBy', 'firstName lastName').lean();
  if (!contact) return next(new AppError('Contact message not found.', 404));

  // mark as read the first time an admin opens it
  if (contact.status === 'new') {
    await Contact.findByIdAndUpdate(req.params.id, { status: 'read' });
    contact.status = 'read';
  }

  sendSuccess(res, { contact }, 'Contact message fetched');
});

// ─── ADMIN: UPDATE STATUS ──────────────────────────────────────────────────────
exports.updateContactStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;

  const contact = await Contact.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!contact) return next(new AppError('Contact message not found.', 404));

  await ActivityLog.create({
    uid: req.user._id,
    performedBy: req.user._id,
    description: `${req.user.role} set contact message ${contact._id} to ${status}`,
    action: 'contact_status_change',
    referenceFor: 'Contact',
    referenceId: contact._id,
    ipAddress: req.ip,
  });

  sendSuccess(res, { contact }, `Status updated to ${status}`);
});

// ─── ADMIN: RESPOND (emails the sender back) ──────────────────────────────────
exports.respondToContact = asyncHandler(async (req, res, next) => {
  const { response } = req.body;

  const contact = await Contact.findById(req.params.id);
  if (!contact) return next(new AppError('Contact message not found.', 404));

  contact.response    = response;
  contact.respondedBy = req.user._id;
  contact.respondedAt = new Date();
  contact.status      = 'responded';
  await contact.save();

  try {
    await emailService.sendContactResponse(contact, response);
  } catch (err) {
    logger.warn(`Contact response email failed for ${contact.email}: ${err.message}`);
  }

  await ActivityLog.create({
    uid: req.user._id,
    performedBy: req.user._id,
    description: `${req.user.role} responded to contact message from ${contact.email}`,
    action: 'contact_respond',
    referenceFor: 'Contact',
    referenceId: contact._id,
    ipAddress: req.ip,
  });

  sendSuccess(res, { contact }, 'Response sent');
});

// ─── ADMIN: DELETE (soft) ──────────────────────────────────────────────────────
exports.deleteContact = asyncHandler(async (req, res, next) => {
  const contact = await Contact.findByIdAndUpdate(req.params.id, {
    isDeleted: true,
    deletedAt: new Date(),
  });
  if (!contact) return next(new AppError('Contact message not found.', 404));

  sendSuccess(res, {}, 'Contact message deleted');
});