const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateAdmin } = require('../middleware/auth');

router.post('/admin/login', adminController.login);
router.get('/admin/requests', adminController.getAllRequests);
router.get('/api/admin/services', authenticateAdmin, adminController.getAdminServices);
router.get('/api/admin/contractors', authenticateAdmin, adminController.getAllContractors);
router.get('/api/admin/payment-history', authenticateAdmin, adminController.getPaymentHistory);

const { upload } = require('../config/storage');

router.put('/api/admin/services/:id', authenticateAdmin, upload.fields([{ name: 'invoice', maxCount: 1 }, { name: 'coi', maxCount: 1 }]), adminController.updateService);
router.put('/admin/request/:requestId/status', authenticateAdmin, adminController.updateRequestStatus);

router.post('/admin/test-quote-email', authenticateAdmin, adminController.testQuoteEmail);
router.post('/admin/resend-confirmation/:requestId', authenticateAdmin, adminController.resendConfirmation);
router.post('/api/process-refund', authenticateAdmin, adminController.processRefund);

module.exports = router;

