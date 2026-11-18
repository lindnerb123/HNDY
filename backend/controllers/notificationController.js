const db = require('../config/db');
const { sendPushNotification, vapidKeys } = require('../services/notificationService');

exports.getVapidPublicKey = (req, res) => {
    if (vapidKeys.publicKey) {
        res.json({
            publicKey: vapidKeys.publicKey
        });
    } else {
        res.status(404).json({
            error: 'Push notifications not configured'
        });
    }
};

exports.saveSubscription = async (req, res) => {
    try {
        const { subscription } = req.body;
        const email = req.user.email;

        // Validate subscription object
        if (!subscription || !subscription.endpoint || !subscription.keys || !subscription.keys.p256dh || !subscription.keys.auth) {
            return res.status(400).json({
                success: false,
                message: 'Invalid subscription format'
            });
        }

        await db.savePushSubscription(email, subscription);

        res.json({
            success: true,
            message: 'Push subscription saved successfully'
        });
    } catch (error) {
        console.error('Error saving subscription:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save subscription'
        });
    }
};

exports.testNotification = async (req, res) => {
    try {
        // Check if push notifications are configured
        if (!vapidKeys.publicKey || !vapidKeys.privateKey) {
            return res.status(400).json({
                success: false,
                message: 'Push notifications not configured on server'
            });
        }

        const email = req.user.email;

        const testNotification = {
            title: '🔔 HNDY Test Notification',
            body: 'Push notifications are working perfectly!',
            icon: '/icon-192x192.png',
            badge: '/badge-72x72.png',
            data: {
                test: true,
                url: '/customer-portal',
                timestamp: new Date().toISOString()
            }
        };

        const success = await sendPushNotification(email, testNotification);

        res.json({
            success,
            message: success ? 'Test notification sent!' : 'Failed to send notification'
        });
    } catch (error) {
        console.error('Error sending test notification:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send test notification'
        });
    }
};
