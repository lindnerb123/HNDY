const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const { authenticateToken } = require('../middleware/auth');
const handleFileUpload = require('../middleware/uploadMiddleware');

// Public routes
router.post('/analyze-request', requestController.analyzeRequest);
router.post('/submit-request', handleFileUpload, requestController.submitRequest);
router.get('/request/:requestId', requestController.getRequestById);
router.get('/debug/request/:id', requestController.debugRequest);

// Protected routes (Customer)
router.get('/customer/requests', authenticateToken, requestController.getCustomerRequests);
router.get('/api/customer/services', authenticateToken, requestController.getCustomerServices);
router.get('/api/customer/profile', authenticateToken, requestController.getCustomerProfile);

// Verification Routes
router.post('/verify/start', requestController.startVerification);
router.post('/verify/check', requestController.checkVerification);

module.exports = router;
