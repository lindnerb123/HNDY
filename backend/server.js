// Load env from parent directory
require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
const fs = require('fs');

// Initialize services
require('./config/storage'); // Cloudinary
require('./services/notificationService'); // WebPush

// Import Middleware
const { limiter, corsMiddleware, securityHeaders } = require('./middleware/security');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const requestRoutes = require('./routes/requestRoutes');
const adminRoutes = require('./routes/adminRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const stripeRoutes = require('./stripe-routes');
const { handleStripeWebhook } = require('./stripe-webhook');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Webhook MUST be before body parser
app.post('/stripe-webhook', express.raw({ type: 'application/json', limit: '10mb' }), handleStripeWebhook);

// Security Middleware (Helmet & CORS)
app.use(securityHeaders);
app.use(corsMiddleware);

// Rate Limiting
app.use(limiter);

// Body parsers
app.use(express.json({ limit: '50mb' })); // Reduced from 200mb for security
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Session
app.use(session({
    secret: JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// Use Routes
app.use('/api/stripe', stripeRoutes);
app.use('/api/contractor', require('./routes/contractorRoutes'));
app.use('/', authRoutes);
app.use('/', requestRoutes);
app.use('/', adminRoutes);
app.use('/', notificationRoutes);

// Database Health Check
const db = require('./config/db');
app.get('/health', async (req, res) => {
    try {
        const stats = await db.getRequestStats();
        res.json({
            status: 'running',
            timestamp: new Date().toISOString(),
            requestStats: stats,
            features: ['Refactored Backend', 'Security Hardened']
        });
    } catch (err) {
        res.status(503).json({ status: 'error', error: 'DB connection issue' });
    }
});

app.get('/', (req, res) => res.json({ message: 'HNDY Backend is running! (Secure)' }));

const cron = require('node-cron');
const assignmentService = require('./services/assignmentService');

// Schedule Expiration Check (Every Minute)
cron.schedule('* * * * *', async () => {
    // console.log('Running Expiration Check...'); 
    await assignmentService.handleExpiration();
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 HNDY Backend (Secure) running on http://localhost:${PORT}`);
    console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});
