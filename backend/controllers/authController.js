const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { sendCustomerEmail } = require('../utils/emailService');
const emailTemplates = require('../utils/emailTemplates');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔑 Login attempt for email:', email);

    // Validation handled by Zod middleware

    // Validate customer credentials
    const customer = await db.validateCustomerPassword(email, password);

    if (!customer) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    if (!customer.email_verified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email first'
      });
    }

    console.log('✅ Login successful for:', customer.email);

    // Generate JWT token
    const token = jwt.sign(
      { email: customer.email, id: customer.id },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
};

exports.setPassword = async (req, res) => {
  try {
    const { email, password, token } = req.body;

    // Validation handled by Zod middleware

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    // Check if customer exists
    const customer = await db.findCustomerByEmail(email);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // CHECK TOKEN - Verify token BEFORE checking email_verified
    if (customer.verification_token !== token) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    // Now verify the email (this should actually be done automatically)
    if (!customer.email_verified) {
      const verifiedCustomer = await db.verifyCustomerEmail(token);
      if (!verifiedCustomer) {
        return res.status(400).json({
          success: false,
          message: 'Failed to verify email'
        });
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Set password
    await db.setCustomerPassword(email, passwordHash);

    // Send welcome email
    if (emailTemplates && emailTemplates.welcomeEmail) {
      const welcomeEmailContent = emailTemplates.welcomeEmail(customer);
      await sendCustomerEmail(customer.email, welcomeEmailContent.subject, welcomeEmailContent.html);
    }

    // Generate login token - RENAMED to authToken to avoid conflict
    const authToken = jwt.sign(
      { email: customer.email, id: customer.id },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Password set successfully',
      token: authToken,
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name
      }
    });

  } catch (error) {
    console.error('❌ Set password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set password'
    });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    // Verify the token
    const customer = await db.verifyCustomerEmail(token);

    if (!customer) {
      return res.redirect(`${process.env.FRONTEND_URL}/customer-portal?error=invalid-token`);
    }

    // Redirect to set password page
    res.redirect(`${process.env.FRONTEND_URL}/set-password?token=${token}&email=${encodeURIComponent(customer.email)}&verified=true`);

  } catch (error) {
    console.error('❌ Email verification error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/customer-portal?error=verification-failed`);
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Validation handled by Zod middleware

    const customer = await db.findCustomerByEmail(email);
    if (!customer) {
      // Don't reveal if user exists
      return res.json({
        success: true,
        message: 'If an account exists, a password reset email has been sent.'
      });
    }

    const resetToken = await db.createPasswordResetToken(email);

    if (resetToken) {
      const resetLink = `${process.env.FRONTEND_URL || 'https://hndy.vercel.app'}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
      const emailContent = emailTemplates.passwordReset(customer, resetLink);

      await sendCustomerEmail(email, emailContent.subject, emailContent.html);
    }

    res.json({
      success: true,
      message: 'If an account exists, a password reset email has been sent.'
    });

  } catch (error) {
    console.error('❌ Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating password reset request'
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;

    // Validation handled by Zod middleware

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters'
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    const customer = await db.resetPassword(token, passwordHash);

    if (!customer) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    res.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('❌ Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password'
    });
  }
};
