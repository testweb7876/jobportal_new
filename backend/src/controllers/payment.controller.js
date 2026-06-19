const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Invoice, UserPackage, TransactionLog } = require('../models/Payment.model');
const Package = require('../models/Package.model');
const { AppError, asyncHandler, sendSuccess } = require('../utils/AppError');
const emailService = require('../services/email.service');
const notificationService = require('../services/notification.service');
const logger = require('../config/logger');

// ─── HELPER: ACTIVATE USER PACKAGE ───────────────────────────────────────────
const activateUserPackage = async (userId, packageId, invoiceId) => {
  const pkg = await Package.findById(packageId);
  if (!pkg) throw new Error('Package not found');

  const endDate = new Date();
  if (pkg.packageTimeUnit === 'days') endDate.setDate(endDate.getDate() + pkg.packageTime);
  else if (pkg.packageTimeUnit === 'months') endDate.setMonth(endDate.getMonth() + pkg.packageTime);
  else if (pkg.packageTimeUnit === 'years') endDate.setFullYear(endDate.getFullYear() + pkg.packageTime);

  // Deactivate old packages
  await UserPackage.updateMany({ uid: userId, status: true }, { status: false, isActive: false });

  const userPkg = await UserPackage.create({
    uid: userId,
    packageId,
    endDate,
    status: true,
    isActive: true,
    paymentHistoryId: invoiceId,
    remainingJobs:           pkg.job,
    remainingFeaturedJobs:   pkg.featuredJob,
    remainingResumes:        pkg.resume,
    remainingFeaturedResumes: pkg.featuredResume,
    remainingCompanies:      pkg.companies,
    remainingJobAlerts:      pkg.jobAlert,
    remainingJobApply:       pkg.jobApply,
    remainingResumeSearch:   pkg.resumeSearch,
  });

  await TransactionLog.create({
    uid: userId,
    userPackageId: userPkg._id,
    recordId: invoiceId,
    type: 'package_activated',
    status: true,
  });

  return userPkg;
};

// ─── STRIPE: CREATE CHECKOUT SESSION ─────────────────────────────────────────
exports.createStripeSession = asyncHandler(async (req, res, next) => {
  const { packageId } = req.body;

  const pkg = await Package.findById(packageId);
  if (!pkg || !pkg.status) return next(new AppError('Package not found.', 404));
  if (pkg.isFree) return next(new AppError('Use free package activation for free packages.', 400));

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    customer_email: req.user.email,
    client_reference_id: req.user._id.toString(),
    metadata: {
      userId: req.user._id.toString(),
      packageId: packageId,
    },
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: pkg.title,
          description: `JobPortal ${pkg.packageFor} Package - ${pkg.packageTime} ${pkg.packageTimeUnit}`,
        },
        unit_amount: Math.round(pkg.price * 100),
      },
      quantity: 1,
    }],
    success_url: `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.CLIENT_URL}/payment/cancel`,
  });

  // Create pending invoice
  const invoice = await Invoice.create({
    uid: req.user._id,
    recordId: packageId,
    description: `Package: ${pkg.title}`,
    type: 'package',
    amount: pkg.price,
    payMethod: 'stripe',
    paymentStatus: 'pending',
    transactionId: session.id,
    payer_email: req.user.email,
  });

  sendSuccess(res, { sessionId: session.id, sessionUrl: session.url, invoiceId: invoice._id }, 'Checkout session created');
});

// ─── STRIPE: WEBHOOK ──────────────────────────────────────────────────────────
exports.stripeWebhook = async (req, res) => {

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    logger.error('Stripe webhook signature failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { userId, packageId } = session.metadata;
      const invoice = await Invoice.findOneAndUpdate(
        { transactionId: session.id },
        {
          paymentStatus: 'paid',
          paidAt: new Date(),
          payerTransactionNumber: session.payment_intent
        },
        { new: true }
      );

      if (invoice) {
        await activateUserPackage(userId, packageId, invoice._id);

        const User = require('../models/User.model');
        const user = await User.findById(userId);

        if (user) {
          await emailService.sendPaymentConfirmation(user, invoice);

          await notificationService.create({
            recipientId: userId,
            type: 'payment_success',
            title: 'Payment Successful 🎉',
            message: 'Your package has been activated successfully.',
            refModel: 'Invoice',
            refId: invoice._id,
          });
        }
      }
    }

    if (event.type === 'payment_intent.payment_failed') {
      const pi = event.data.object;
      const invoice = await Invoice.findOneAndUpdate(
        { transactionId: pi.id },
        { paymentStatus: 'failed' },
        { new: true }
      );

      // Email — user should know their payment didn't go through
      if (invoice) {
        const User = require('../models/User.model');
        const user = await User.findById(invoice.uid);
        if (user) {
          try {
            await emailService.sendPaymentFailed(user, invoice);
          } catch { /* silent */ }
        }
      }
    }
  } catch (err) {
    logger.error('Webhook processing error:', err);
  }

  res.json({ received: true });
};

// ─── PAYPAL: CREATE ORDER ─────────────────────────────────────────────────────
exports.createPaypalOrder = asyncHandler(async (req, res, next) => {
  const { packageId } = req.body;
  const pkg = await Package.findById(packageId);
  if (!pkg) return next(new AppError('Package not found.', 404));

  const paypal = require('@paypal/checkout-server-sdk');
  const environment = process.env.PAYPAL_MODE === 'live'
    ? new paypal.core.LiveEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET)
    : new paypal.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET);
  const client = new paypal.core.PayPalHttpClient(environment);

  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer('return=representation');
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [{
      amount: { currency_code: 'USD', value: pkg.price.toString() },
      description: `JobPortal - ${pkg.title}`,
      custom_id: JSON.stringify({ userId: req.user._id.toString(), packageId }),
    }],
  });

  const order = await client.execute(request);

  const invoice = await Invoice.create({
    uid: req.user._id,
    recordId: packageId,
    description: `Package: ${pkg.title}`,
    type: 'package',
    amount: pkg.price,
    payMethod: 'paypal',
    paymentStatus: 'pending',
    transactionId: order.result.id,
    payer_email: req.user.email,
  });

  sendSuccess(res, { orderId: order.result.id, invoiceId: invoice._id }, 'PayPal order created');
});

// ─── PAYPAL: CAPTURE ORDER ────────────────────────────────────────────────────
exports.capturePaypalOrder = asyncHandler(async (req, res, next) => {
  const { orderId } = req.body;

  const paypal = require('@paypal/checkout-server-sdk');
  const environment = process.env.PAYPAL_MODE === 'live'
    ? new paypal.core.LiveEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET)
    : new paypal.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET);
  const client = new paypal.core.PayPalHttpClient(environment);

  const request = new paypal.orders.OrdersCaptureRequest(orderId);
  const capture = await client.execute(request);

  if (capture.result.status === 'COMPLETED') {
    const customId = capture.result.purchase_units[0].payments.captures[0].custom_id;
    const { userId, packageId } = JSON.parse(customId);

    const invoice = await Invoice.findOneAndUpdate(
      { transactionId: orderId },
      { paymentStatus: 'paid', paidAt: new Date(), payerTransactionNumber: capture.result.id },
      { new: true }
    );

    if (invoice) {
      await activateUserPackage(userId, packageId, invoice._id);

      // Email — was missing here while Stripe + bank already had it; now consistent across all gateways
      const User = require('../models/User.model');
      const user = await User.findById(userId);
      if (user) {
        try {
          await emailService.sendPaymentConfirmation(user, invoice);
        } catch { /* silent */ }
      }

      await notificationService.create({
        recipientId: userId,
        type: 'payment_success',
        title: 'PayPal Payment Successful 🎉',
        message: 'Your package has been activated.',
        refModel: 'Invoice',
        refId: invoice._id,
      });
    }

    return sendSuccess(res, { captureId: capture.result.id }, 'Payment captured and package activated');
  }

  next(new AppError('PayPal payment not completed.', 400));
});

// ─── BANK TRANSFER: SUBMIT PROOF ──────────────────────────────────────────────
exports.submitBankTransfer = asyncHandler(async (req, res, next) => {
  if (!req.file) return next(new AppError('Please upload payment proof.', 400));

  const { packageId } = req.body;
  const pkg = await Package.findById(packageId);
  if (!pkg) return next(new AppError('Package not found.', 404));

  const { uploadToCloudinary } = require('../services/cloudinary.service');
  const result = await uploadToCloudinary(req.file, 'verification');

  const invoice = await Invoice.create({
    uid: req.user._id,
    recordId: packageId,
    description: `Package: ${pkg.title} (Bank Transfer)`,
    type: 'package',
    amount: pkg.price,
    payMethod: 'bank',
    paymentStatus: 'pending',
    paymentProof: result.secureUrl,
    payerEmail: req.user.email,
    payerName: `${req.user.firstName} ${req.user.lastName}`,
  });

  try {
    await emailService.sendBankProofReceived(req.user, invoice);
  } catch { /* silent */ }

  sendSuccess(res, { invoice }, 'Bank transfer proof submitted. Admin will verify within 24-48 hours.', 201);
});

// ─── ADMIN: APPROVE BANK TRANSFER ────────────────────────────────────────────
exports.approveBankTransfer = asyncHandler(async (req, res, next) => {
  const invoice = await Invoice.findById(req.params.invoiceId).populate('uid', 'email firstName');
  if (!invoice) return next(new AppError('Invoice not found.', 404));
  if (invoice.payMethod !== 'bank') return next(new AppError('Not a bank transfer invoice.', 400));

  await Invoice.findByIdAndUpdate(invoice._id, { paymentStatus: 'paid', paidAt: new Date() });
  await activateUserPackage(invoice.uid._id, invoice.recordId, invoice._id);

  await emailService.sendPaymentConfirmation(invoice.uid, invoice);

  sendSuccess(res, {}, 'Bank transfer approved and package activated');
});

// ─── ACTIVATE FREE PACKAGE ────────────────────────────────────────────────────
exports.activateFreePackage = asyncHandler(async (req, res, next) => {
  const pkg = await Package.findOne({ _id: req.body.packageId, isFree: true, status: true });
  if (!pkg) return next(new AppError('Free package not found.', 404));

  const existing = await UserPackage.findOne({ uid: req.user._id, isActive: true, endDate: { $gt: new Date() } });
  if (existing) return next(new AppError('You already have an active package.', 400));

  const invoice = await Invoice.create({
    uid: req.user._id,
    recordId: pkg._id,
    description: `Free Package: ${pkg.title}`,
    type: 'package',
    amount: 0,
    payMethod: 'free',
    paymentStatus: 'paid',
    paidAt: new Date(),
  });

  const userPkg = await activateUserPackage(req.user._id, pkg._id, invoice._id);

  sendSuccess(res, { package: userPkg }, 'Free package activated');
});

// ─── PAYMENT HISTORY ─────────────────────────────────────────────────────────
exports.getPaymentHistory = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const filter = { uid: req.user._id };
  const [invoices, total] = await Promise.all([
    Invoice.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Invoice.countDocuments(filter),
  ]);

  const { sendPaginated } = require('../utils/AppError');
  sendPaginated(res, invoices, total, page, limit);
});

// ─── REQUEST REFUND ───────────────────────────────────────────────────────────
exports.requestRefund = asyncHandler(async (req, res, next) => {
  const invoice = await Invoice.findOne({ _id: req.params.id, uid: req.user._id });
  if (!invoice) return next(new AppError('Invoice not found.', 404));
  if (invoice.paymentStatus !== 'paid') return next(new AppError('Only paid invoices can be refunded.', 400));
  if (invoice.refundStatus !== 'none') return next(new AppError('Refund already requested.', 400));

  await Invoice.findByIdAndUpdate(invoice._id, {
    refundStatus: 'requested',
    refundReason: req.body.reason,
  });

  // Email — confirm the refund request was received
  try {
    await emailService.sendRefundStatusUpdate(req.user, invoice, 'requested');
  } catch { /* silent */ }

  sendSuccess(res, {}, 'Refund request submitted. Admin will process within 5-7 business days.');
});

// ─── ADMIN: GET BANK TRANSFERS ─────────────────────────────
exports.getBankTransfers = asyncHandler(async (req, res) => {
  const invoices = await Invoice.find({
    payMethod: 'bank',
  })
  .populate('uid', 'firstName lastName email avatar')
  .sort({ createdAt: -1 });

  sendSuccess(res, { invoices }, 'Bank transfers');
});

// ─── ADMIN: UPDATE BANK TRANSFER STATUS ──────────────────────────────────────
exports.updateBankTransferStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body
  const invoice = await Invoice.findById(req.params.invoiceId).populate('uid', 'email firstName')
  if (!invoice) return next(new AppError('Invoice not found.', 404))
  if (invoice.payMethod !== 'bank') return next(new AppError('Not a bank transfer.', 400))

  const validStatuses = ['pending', 'paid', 'rejected', 'failed']
  if (!validStatuses.includes(status)) return next(new AppError('Invalid status.', 400))

  if (status === 'paid' && invoice.paymentStatus !== 'paid') {
    await Invoice.findByIdAndUpdate(invoice._id, { paymentStatus: 'paid', paidAt: new Date() })
    await activateUserPackage(invoice.uid._id, invoice.recordId, invoice._id)

    try {
      await emailService.sendPaymentConfirmation(invoice.uid, invoice)
    } catch { /* silent */ }
  } else {
    await Invoice.findByIdAndUpdate(invoice._id, { paymentStatus: status })

    if (status === 'rejected' || status === 'failed') {
      try {
        await emailService.sendPaymentFailed(invoice.uid, invoice)
      } catch { /* silent */ }
    }
  }

  sendSuccess(res, {}, `Status updated to ${status}`)
})