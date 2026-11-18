const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/auth'); // We need to create/extract this middleware too

// We'll define routes here assuming authenticateToken handles the auth
// Wait, I haven't extracted authenticateToken yet. 
// I should extract middlewares to backend/middleware/auth.js first.

router.get('/vapid-public-key', notificationController.getVapidPublicKey);
router.post('/save-subscription', authenticateToken, notificationController.saveSubscription);
router.post('/test-notification', authenticateToken, notificationController.testNotification);

module.exports = router;
