// Stripe Webhook Handler with Email Integration
// File: backend/stripe-webhook.js

const webpush = require('web-push');

// Initialize Stripe
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Initialize database
const db = require('./config/db');

// Configure web push
if (process.env.VAPID_SUBJECT && process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  console.log('✅ Push notifications enabled in webhook handler');
} else {
  console.log('⚠️ Push notifications disabled in webhook handler - VAPID variables not set');
}

// Initialize email transporter with lazy loading
let transporter = null;
let nodemailer = null;

const getTransporter = () => {
  if (!transporter) {
    try {
      if (!nodemailer) {
        nodemailer = require('nodemailer');
      }
      transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT),
        secure: process.env.EMAIL_PORT == 465,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        tls: {
          ciphers: 'SSLv3',
          rejectUnauthorized: false
        }
      });
      console.log('✅ Email transporter initialized in webhook handler');
    } catch (error) {
      console.error('❌ Failed to initialize email transporter in webhook:', error.message);
    }
  }
  return transporter;
};

// Helper function to send customer emails
const sendCustomerEmail = async (to, subject, htmlContent) => {
  try {
    const emailTransporter = getTransporter();
    if (!emailTransporter) {
      console.error('❌ Email transporter not available in webhook');
      return false;
    }

    const mailOptions = {
      from: `"HNDY Service" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      html: htmlContent
    };

    await emailTransporter.sendMail(mailOptions);
    console.log(`✅ Customer email sent to ${to}: ${subject}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send customer email to ${to}:`, error);
    return false;
  }
};

// Email templates (matching server.js structure)
const emailTemplates = {
  // Payment Confirmation Email
  paymentConfirmation: (request, paymentAmount) => ({
    subject: `✅ Payment Received - HNDY Request ${request.id} Approved!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; }
          .header { background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { padding: 30px; background: #f9f9f9; }
          .success-box { background: #d1fae5; padding: 20px; margin: 20px 0; border-radius: 8px; border: 1px solid #10b981; text-align: center; }
          .info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .receipt { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .receipt-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .receipt-row:last-child { border-bottom: none; font-weight: bold; font-size: 18px; }
          .footer { background: #333; color: white; padding: 20px; text-align: center; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Payment Confirmed!</h1>
          </div>
          
          <div class="content">
            <h2 style="color: #333; margin-bottom: 20px;">Thank you, ${request.customer_name || request.customerName}!</h2>
            
            <div class="success-box">
              <h3 style="margin: 0 0 10px 0; color: #059669;">Your payment has been successfully processed!</h3>
              <p style="margin: 0;">We'll contact you shortly to schedule your service.</p>
            </div>

            <div class="receipt">
              <h3 style="margin-top: 0;">Payment Receipt</h3>
              <div class="receipt-row">
                <span>Request ID:</span>
                <span>${request.id}</span>
              </div>
              <div class="receipt-row">
                <span>Service:</span>
                <span>Handyman Service</span>
              </div>
              <div class="receipt-row">
                <span>Payment Date:</span>
                <span>${new Date().toLocaleDateString()}</span>
              </div>
              <div class="receipt-row" style="color: #10b981;">
                <span>Amount Paid:</span>
                <span>$${paymentAmount}</span>
              </div>
            </div>

            <div class="info-box">
              <h3 style="margin-top: 0;">What Happens Next?</h3>
              <ul>
                <li>Our team will contact you within 24 hours to schedule your service</li>
                <li>You'll receive a confirmation once your appointment is set</li>
                <li>On service day, you'll get a notification when our handyman is on the way</li>
              </ul>
            </div>

            <div class="info-box">
              <h3 style="margin-top: 0;">Service Details</h3>
              <p><strong>Address:</strong> ${request.address}</p>
              ${request.problem_description || request.problemDescription ? `<p><strong>Issue:</strong> ${request.problem_description || request.problemDescription}</p>` : ''}
            </div>

            <p style="color: #666; font-size: 14px; text-align: center; margin-top: 30px;">
              Need to reschedule or have questions? Reply to this email or access your customer portal.
            </p>
          </div>
          
          <div class="footer">
            <p style="margin: 0 0 10px 0;">© HNDY - Your Trusted Handyman Service</p>
            <p style="margin: 0; font-size: 12px;">This receipt was sent to ${request.customer_email || request.customerEmail}</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  // Refund Confirmation Email
  refundConfirmation: (request, refundAmount) => ({
    subject: `💸 Refund Processed - HNDY Request ${request.id}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; }
          .header { background: linear-gradient(135deg, #ef4444, #dc2626); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { padding: 30px; background: #f9f9f9; }
          .refund-box { background: #fee2e2; padding: 20px; margin: 20px 0; border-radius: 8px; border: 1px solid #ef4444; text-align: center; }
          .info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .receipt { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .receipt-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .footer { background: #333; color: white; padding: 20px; text-align: center; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💸 Refund Processed</h1>
          </div>
          
          <div class="content">
            <h2 style="color: #333; margin-bottom: 20px;">Hi ${request.customer_name || request.customerName},</h2>
            
            <div class="refund-box">
              <h3 style="margin: 0 0 10px 0; color: #dc2626;">Your refund has been processed</h3>
              <p style="margin: 0; font-size: 24px; font-weight: bold;">$${refundAmount}</p>
            </div>

            <div class="info-box">
              <h3 style="margin-top: 0;">Refund Details</h3>
              <p><strong>Request ID:</strong> ${request.id}</p>
              <p><strong>Refund Amount:</strong> $${refundAmount}</p>
              <p><strong>Processing Date:</strong> ${new Date().toLocaleDateString()}</p>
              <p style="margin-bottom: 0;"><strong>Expected Arrival:</strong> 5-10 business days</p>
            </div>

            <div class="info-box" style="background: #fef3c7; border: 1px solid #fbbf24;">
              <p style="margin: 0;">
                <strong>Please Note:</strong> Refunds typically appear in your account within 5-10 business days, 
                depending on your bank's processing time.
              </p>
            </div>

            <p style="color: #666; font-size: 14px; text-align: center; margin-top: 30px;">
              We're sorry things didn't work out this time. If you have any questions about this refund, 
              please don't hesitate to contact us.
            </p>
          </div>
          
          <div class="footer">
            <p style="margin: 0 0 10px 0;">© HNDY - Your Trusted Handyman Service</p>
            <p style="margin: 0; font-size: 12px;">This confirmation was sent to ${request.customer_email || request.customerEmail}</p>
          </div>
        </div>
      </body>
      </html>
    `
  })
};

// Helper function to send push notification
const sendPushNotification = async (email, notificationData) => {
  try {
    const subscription = db.getPushSubscription(email);
    if (!subscription) {
      console.log(`📱 No push subscription found for ${email}`);
      return false;
    }

    await webpush.sendNotification(subscription, JSON.stringify(notificationData));
    db.saveNotificationHistory(email, notificationData, true);
    console.log(`📱 Push notification sent to ${email}: ${notificationData.title}`);
    return true;
  } catch (error) {
    console.error(`❌ Push notification failed for ${email}:`, error.message);
    db.saveNotificationHistory(email, notificationData, false);
    return false;
  }
};

// Webhook handler
const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!endpointSecret) {
    console.log('⚠️ Webhook secret not configured - skipping signature verification');
    // In development, process without signature verification
    const event = req.body;
    await processWebhookEvent(event);
    return res.json({ received: true });
  }

  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.rawBody || req.body, sig, endpointSecret);
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Process the event
  await processWebhookEvent(event);

  res.json({ received: true });
};

const processWebhookEvent = async (event) => {
  console.log(`📍 Processing webhook event: ${event.type}`);

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentSuccess(event.data.object);
      break;

    case 'payment_intent.payment_failed':
      await handlePaymentFailure(event.data.object);
      break;

    case 'charge.refunded':
      await handleRefund(event.data.object);
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }
};

const handlePaymentSuccess = async (paymentIntent) => {
  console.log('💰 Payment succeeded:', paymentIntent.id);

  // Get request info from metadata
  const { requestId, customerEmail, customerName } = paymentIntent.metadata;

  if (!requestId) {
    console.error('No requestId in payment metadata');
    return;
  }

  try {
    // Get the request from database
    const allRequests = await db.getAllRequests();
    const request = allRequests.find(r => r.id === requestId);

    if (!request) {
      console.error('Request not found:', requestId);
      return;
    }

    // Update request status to approved
    const updatedRequest = await db.updateRequestStatus(
      requestId,
      'approved',
      'Payment received via webhook - your service request has been approved!',
      {
        paymentStatus: 'completed',
        payment_status: 'completed',
        paidAt: new Date(),
        paymentIntentId: paymentIntent.id
      }
    );

    console.log('✅ Request updated via webhook:', {
      requestId: updatedRequest.id,
      status: updatedRequest.status,
      paymentStatus: 'completed'
    });

    // Send payment confirmation email using the template
    const paymentAmount = (paymentIntent.amount / 100).toFixed(2);
    const confirmationEmail = emailTemplates.paymentConfirmation(updatedRequest, paymentAmount);
    await sendCustomerEmail(
      updatedRequest.customer_email || updatedRequest.customerEmail || customerEmail,
      confirmationEmail.subject,
      confirmationEmail.html
    );

    // Send push notification
    const pushEmail = updatedRequest.customer_email || updatedRequest.customerEmail || customerEmail;
    if (pushEmail) {
      const notificationData = {
        title: '✅ Payment Received!',
        body: `Thank you! Your payment of $${paymentAmount} has been received. We'll contact you to schedule your service.`,
        icon: '/icon-192x192.png',
        data: {
          requestId: request.id,
          status: 'approved',
          url: '/customer-portal'
        }
      };

      await sendPushNotification(pushEmail, notificationData);
    }

  } catch (error) {
    console.error('❌ Error processing payment success webhook:', error);
  }
};

const handlePaymentFailure = async (paymentIntent) => {
  console.log('❌ Payment failed:', paymentIntent.id);

  const { requestId, customerEmail } = paymentIntent.metadata;

  if (!requestId) {
    console.error('No requestId in payment metadata');
    return;
  }

  try {
    // Get the request
    const allRequests = await db.getAllRequests();
    const request = allRequests.find(r => r.id === requestId);

    if (!request) {
      console.error('Request not found:', requestId);
      return;
    }

    // Update request with payment failure
    await db.updateRequestStatus(
      requestId,
      request.status, // Keep current status
      'Payment failed - please try again or contact support',
      {
        paymentStatus: 'failed',
        payment_status: 'failed',
        failedAt: new Date(),
        failureReason: paymentIntent.last_payment_error?.message
      }
    );

    // Send notification about failed payment
    const pushEmail = request.customer_email || request.customerEmail || customerEmail;
    if (pushEmail) {
      const notificationData = {
        title: '❌ Payment Failed',
        body: 'Your payment could not be processed. Please try again or contact support.',
        icon: '/icon-192x192.png',
        data: {
          requestId: request.id,
          url: '/customer-portal'
        }
      };

      await sendPushNotification(pushEmail, notificationData);
    }

  } catch (error) {
    console.error('❌ Error processing payment failure webhook:', error);
  }
};

const handleRefund = async (charge) => {
  console.log('💸 Refund processed:', charge.id);

  try {
    // Find the payment intent associated with this charge
    const paymentIntent = await stripe.paymentIntents.retrieve(charge.payment_intent);
    const { requestId } = paymentIntent.metadata;

    if (!requestId) {
      console.error('No requestId in payment metadata');
      return;
    }

    // Get the request
    const allRequests = await db.getAllRequests();
    const request = allRequests.find(r => r.id === requestId);

    if (!request) {
      console.error('Request not found:', requestId);
      return;
    }

    // Update request status
    const updatedRequest = await db.updateRequestStatus(
      request.id,
      'cancelled',
      'Service cancelled and payment refunded via webhook',
      {
        paymentStatus: 'refunded',
        payment_status: 'refunded',
        refundedAt: new Date(),
        refundAmount: charge.amount_refunded / 100
      }
    );

    // Send refund confirmation email using the template
    const refundAmount = (charge.amount_refunded / 100).toFixed(2);
    const refundEmail = emailTemplates.refundConfirmation(updatedRequest, refundAmount);
    await sendCustomerEmail(
      updatedRequest.customer_email || updatedRequest.customerEmail,
      refundEmail.subject,
      refundEmail.html
    );

    // Send refund push notification
    const pushEmail = updatedRequest.customer_email || updatedRequest.customerEmail;
    if (pushEmail) {
      const notificationData = {
        title: '💸 Refund Processed',
        body: `Your refund of $${refundAmount} has been processed. It will appear in your account within 5-10 business days.`,
        icon: '/icon-192x192.png',
        data: {
          requestId: request.id,
          status: 'refunded',
          url: '/customer-portal'
        }
      };

      await sendPushNotification(pushEmail, notificationData);
    }

  } catch (error) {
    console.error('❌ Error processing refund webhook:', error);
  }
};

console.log('🔧 Stripe webhook handler with email integration loaded successfully');

module.exports = { handleStripeWebhook };