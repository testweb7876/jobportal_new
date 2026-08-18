const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const logger = require('../config/logger');

/**
 * Processes an actual refund at the payment gateway based on the invoice's payment method.
 * Throws an error if the gateway call fails — caller must handle it.
 */
exports.refundInvoice = async (invoice) => {
  if (invoice.refundStatus === 'refunded') {
    throw new Error('This invoice has already been refunded.');
  }

  switch (invoice.payMethod) {
    case 'stripe': {
      if (!invoice.payerTransactionNumber) {
        throw new Error('No Stripe payment reference found for this invoice.');
      }
      await stripe.refunds.create({
        payment_intent: invoice.payerTransactionNumber,
      });
      logger.info(`Stripe refund issued for invoice ${invoice._id}`);
      break;
    }

    case 'paypal': {
      const paypal = require('@paypal/checkout-server-sdk');
      const environment = process.env.PAYPAL_MODE === 'live'
        ? new paypal.core.LiveEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET)
        : new paypal.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET);
      const client = new paypal.core.PayPalHttpClient(environment);

      if (!invoice.payerTransactionNumber) {
        throw new Error('No PayPal capture reference found for this invoice.');
      }

      const request = new paypal.payments.CapturesRefundRequest(invoice.payerTransactionNumber);
      request.requestBody({
        amount: { value: invoice.amount.toString(), currency_code: 'USD' },
      });
      await client.execute(request);
      logger.info(`PayPal refund issued for invoice ${invoice._id}`);
      break;
    }

    case 'bank':
    case 'manual':
      // No gateway API for bank transfers or manual assignments —
      // admin is expected to have already returned the funds outside the system.
      logger.info(`Bank/manual refund recorded for invoice ${invoice._id} (no gateway call made)`);
      break;

    case 'free':
      throw new Error('Free packages cannot be refunded — no payment was collected.');

    default:
      throw new Error(`Unsupported payment method for refund: ${invoice.payMethod}`);
  }
};