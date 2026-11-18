const express = require('express');
const router = express.Router();
const contractorController = require('../controllers/contractorController');
const { authLimiter } = require('../middleware/security');

// Middleware to verify contractor token (need to create/use generic auth middleware)
// For now, assuming we might need a specific contractor auth middleware or reuse existing with role check
// I'll define a simple placeholder middleware here or use the existing if adaptable.
// Checking existing middleware...
const authenticateContractor = (req, res, next) => {
    // This should ideally be in a middleware file
    const jwt = require('jsonwebtoken');
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) return res.status(401).json({ success: false, message: 'Access denied' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
        if (decoded.role !== 'contractor') {
            return res.status(403).json({ success: false, message: 'Invalid role' });
        }
        req.user = decoded;
        next();
    } catch (err) {
        res.status(400).json({ success: false, message: 'Invalid token' });
    }
};

// Public Routes
router.post('/register', authLimiter, contractorController.register);
router.post('/login', authLimiter, contractorController.login);

// Protected Routes
router.get('/status', authenticateContractor, contractorController.getStatus);
router.post('/payment/initiate', authenticateContractor, contractorController.createPaymentIntent);
router.post('/payment/confirm', authenticateContractor, contractorController.confirmPayment);
router.put('/vetting/step', authenticateContractor, contractorController.updateVettingStep);

module.exports = router;
