const db = require('../config/db');
// DB is likely a singleton if it exports methods directly. 
// However, the original code used 'db' requiring './database-postgresql'.
const webpush = require('web-push');

// Configure Web Push
const vapidKeys = {
    publicKey: process.env.VAPID_PUBLIC_KEY,
    privateKey: process.env.VAPID_PRIVATE_KEY,
    subject: process.env.VAPID_SUBJECT || 'mailto:hi@hndy.co'
};

if (vapidKeys.publicKey && vapidKeys.privateKey) {
    webpush.setVapidDetails(
        vapidKeys.subject,
        vapidKeys.publicKey,
        vapidKeys.privateKey
    );
}

const sendPushNotification = async (email, notificationData) => {
    try {
        // Check if push notifications are configured
        if (!vapidKeys.publicKey || !vapidKeys.privateKey) {
            console.log(`📱 Push notifications not configured - skipping notification for ${email}`);
            return false;
        }

        // We need to access DB to get subscription. 
        // If db module is already instantiated, we can use it.
        // The previous server.js 'db' was require('./database-postgresql').
        // Let's assume it works here too.
        const subscription = await db.getPushSubscription(email);
        if (!subscription) {
            console.log(`📱 No push subscription found for ${email}`);
            return false;
        }

        // Validate subscription object
        if (!subscription.endpoint || !subscription.keys || !subscription.keys.p256dh || !subscription.keys.auth) {
            console.error(`📱 Invalid subscription format for ${email}`);
            return false;
        }

        await webpush.sendNotification(subscription, JSON.stringify(notificationData));
        await db.saveNotificationHistory(email, notificationData, true);
        console.log(`📱 Push notification sent to ${email}: ${notificationData.title}`);
        return true;
    } catch (error) {
        console.error(`❌ Push notification failed for ${email}:`, error.message);

        // Handle subscription gone errors
        if (error.statusCode === 410) {
            console.log(`📱 Removing expired subscription for ${email}`);
            try {
                await db.removePushSubscription(email);
            } catch (err) {
                console.error('Error removing subscription:', err);
            }
        }

        try {
            await db.saveNotificationHistory(email, notificationData, false);
        } catch (err) {
            console.error('Error saving history:', err);
        }
        return false;
    }
};

module.exports = {
    sendPushNotification,
    vapidKeys
};
