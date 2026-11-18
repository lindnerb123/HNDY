// Stripe Routes with Email Integration
// File: backend/stripe-routes.js

const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

// Initialize Stripe
let stripe;
try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    console.log('✅ Stripe initialized with key starting with:', process.env.STRIPE_SECRET_KEY.substring(0, 10) + '...');
  } else {
    console.error('❌ STRIPE_SECRET_KEY is not set in environment variables!');
  }
} catch (error) {
  console.error('❌ Failed to initialize Stripe:', error.message);
}

// Initialize database
let db;
try {
  db = require('./config/db');
  console.log('✅ Database module loaded for stripe routes');
} catch (error) {
  console.error('❌ Failed to load database module in stripe routes:', error.message);
}

// Configure email transporter (same as server.js)
const transporter = nodemailer.createTransport({
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

// Helper function to send customer emails (same as server.js)
const sendCustomerEmail = async (to, subject, htmlContent) => {
  try {
    const mailOptions = {
      from: `"HNDY Service" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      html: htmlContent
    };

    await transporter.sendMail(mailOptions);
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

// Customer authentication middleware
const authenticateCustomer = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const jwt = require('jsonwebtoken');
  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Admin authentication middleware
const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Admin access token required' });
  }

  const jwt = require('jsonwebtoken');
  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production', (err, user) => {
    if (err || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    req.admin = user;
    next();
  });
};

// Test route
router.get('/test', (req, res) => {
  res.json({
    message: '✅ Stripe routes are working!',
    timestamp: new Date().toISOString(),
    stripe: stripe ? 'Initialized' : 'Not initialized',
    database: db ? 'Connected' : 'Not connected',
    email: transporter ? 'Configured' : 'Not configured',
    environment: {
      stripeSecret: !!process.env.STRIPE_SECRET_KEY,
      stripePublic: !!process.env.STRIPE_PUBLISHABLE_KEY,
      jwtSecret: !!process.env.JWT_SECRET,
      emailHost: !!process.env.EMAIL_HOST
    }
  });
});

// Get Stripe publishable key
router.get('/config', (req, res) => {
  res.json({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'NOT_SET',
    configured: !!process.env.STRIPE_SECRET_KEY
  });
});

// Create a payment intent for a service request
router.post('/create-payment-intent', async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ error: 'Stripe not initialized' });
    }
    if (!db) {
      return res.status(500).json({ error: 'Database not available' });
    }

    console.log('🔍 Creating payment intent for request:', req.body);
    const { requestId } = req.body;

    // Get the service request
    const allRequests = await db.getAllRequests();
    const request = allRequests.find(r => r.id === requestId);
    console.log('🔍 Found request:', request);

    if (!request) {
      return res.status(404).json({ error: 'Service request not found' });
    }

    // Check if there's a quote or an explicit amount passed (e.g. for deposit)
    const amountToCharge = req.body.amount || request.quote;

    if (!amountToCharge) {
      return res.status(400).json({ error: 'No quote or amount available for this request' });
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amountToCharge * 100), // Stripe uses cents
      currency: 'usd',
      metadata: {
        requestId: request.id,
        customerEmail: request.customer_email || request.customerEmail,
        customerName: request.customer_name || request.customerName,
        type: req.body.amount ? 'deposit' : 'full_payment'
      },
      description: `HNDY Service ${req.body.amount ? 'Deposit' : 'Request'} ${request.id}`,
      receipt_email: request.customer_email || request.customerEmail
    });

    console.log('✅ Payment intent created:', paymentIntent.id);

    res.json({
      clientSecret: paymentIntent.client_secret,
      amount: amountToCharge,
      requestId: request.id
    });

  } catch (error) {
    console.error('❌ Error creating payment intent:', error);
    res.status(500).json({ error: 'Failed to create payment: ' + error.message });
  }
});

// Confirm payment success with email integration
router.post('/confirm-payment', authenticateCustomer, async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ error: 'Stripe not initialized' });
    }
    if (!db) {
      return res.status(500).json({ error: 'Database not available' });
    }

    console.log('🔍 Confirming payment for user:', req.user.email);
    console.log('🔍 Request body:', req.body);

    const { paymentIntentId, requestId } = req.body;

    if (!paymentIntentId || !requestId) {
      return res.status(400).json({ error: 'Missing paymentIntentId or requestId' });
    }

    // Verify payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    console.log('🔍 Stripe payment intent status:', paymentIntent.status);

    if (paymentIntent.status === 'succeeded') {
      // Get the request
      const allRequests = await db.getAllRequests();
      const request = allRequests.find(r => r.id === requestId);

      if (!request) {
        return res.status(404).json({ error: 'Service request not found' });
      }

      // Verify that the logged-in user owns this request
      const requestEmail = request.customer_email || request.customerEmail;
      if (requestEmail && requestEmail.toLowerCase() !== req.user.email.toLowerCase()) {
        return res.status(403).json({ error: 'Not authorized to confirm payment for this request' });
      }

      // Update request status to approved
      const updatedRequest = await db.updateRequestStatus(
        requestId,
        'approved',
        'Payment received - your service request has been approved!',
        {
          paymentStatus: 'completed',
          payment_status: 'completed',
          paidAt: new Date(),
          paymentIntentId: paymentIntentId
        }
      );

      console.log('✅ Payment confirmed and request updated:', {
        requestId: updatedRequest.id,
        status: updatedRequest.status,
        paymentStatus: 'completed'
      });

      // Send payment confirmation email using the template
      const paymentAmount = (paymentIntent.amount / 100).toFixed(2);
      const confirmationEmail = emailTemplates.paymentConfirmation(updatedRequest, paymentAmount);
      await sendCustomerEmail(
        updatedRequest.customer_email || updatedRequest.customerEmail,
        confirmationEmail.subject,
        confirmationEmail.html
      );

      res.json({
        success: true,
        message: 'Payment confirmed successfully',
        request: updatedRequest
      });

    } else {
      res.status(400).json({
        error: 'Payment not completed',
        status: paymentIntent.status
      });
    }

  } catch (error) {
    console.error('❌ Error confirming payment:', error);

    // Return specific error messages
    if (error.type === 'StripeCardError') {
      res.status(400).json({ error: 'Payment failed: ' + error.message });
    } else if (error.code === 'resource_missing') {
      res.status(404).json({ error: 'Payment not found' });
    } else {
      res.status(500).json({ error: 'Failed to confirm payment: ' + error.message });
    }
  }
});

// Refund functionality with email integration (admin only)
router.post('/refund', authenticateAdmin, async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ error: 'Stripe not initialized' });
    }
    if (!db) {
      return res.status(500).json({ error: 'Database not available' });
    }

    const { requestId, amount, reason } = req.body;
    console.log('💸 Processing refund for request:', requestId);

    // Get the request
    const allRequests = await db.getAllRequests();
    const request = allRequests.find(r => r.id === requestId);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    console.log('📋 Request found:', {
      id: request.id,
      customerEmail: request.customer_email || request.customerEmail,
      customerName: request.customer_name || request.customerName,
      quote: request.quote
    });

    // Check if there's a payment to refund
    const paymentStatus = request.paymentStatus || request.payment_status;
    if (paymentStatus !== 'completed') {
      return res.status(400).json({ error: 'No completed payment found for this request' });
    }

    try {
      // Search for payment intents with this request ID
      const paymentIntents = await stripe.paymentIntents.list({
        limit: 100
      });

      const matchingIntent = paymentIntents.data.find(pi =>
        pi.metadata.requestId === requestId && pi.status === 'succeeded'
      );

      if (!matchingIntent) {
        return res.status(404).json({ error: 'No payment found in Stripe for this request' });
      }

      console.log('💳 Found payment intent:', matchingIntent.id);

      // Create refund in Stripe
      const refund = await stripe.refunds.create({
        payment_intent: matchingIntent.id,
        amount: amount ? Math.round(amount * 100) : undefined, // If no amount, refund full amount
        reason: reason || 'requested_by_customer',
        metadata: {
          requestId: request.id,
          adminEmail: req.admin.email
        }
      });

      console.log('💸 Refund created:', refund.id);

      // Update request status
      await db.updateRequestStatus(
        requestId,
        'cancelled',
        'Service cancelled and payment refunded',
        {
          paymentStatus: 'refunded',
          payment_status: 'refunded',
          refundId: refund.id,
          refundedAt: new Date()
        }
      );

      // Send refund confirmation email using the template
      const refundAmount = (refund.amount / 100).toFixed(2);
      const refundEmail = emailTemplates.refundConfirmation(request, refundAmount);
      await sendCustomerEmail(
        request.customer_email || request.customerEmail,
        refundEmail.subject,
        refundEmail.html
      );

      res.json({
        success: true,
        message: 'Refund processed successfully',
        refund: {
          id: refund.id,
          amount: refund.amount / 100,
          status: refund.status
        }
      });

    } catch (stripeError) {
      console.error('❌ Stripe refund error:', stripeError);
      res.status(500).json({
        error: 'Failed to process refund: ' + stripeError.message
      });
    }

  } catch (error) {
    console.error('❌ General refund error:', error);
    res.status(500).json({
      error: 'Failed to process refund: ' + error.message
    });
  }
});

console.log('🔧 Stripe routes with email integration loaded successfully');

module.exports = router;