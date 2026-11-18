import React, { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import config from '../../config';
import { AnimatePresence, motion } from 'framer-motion';

const PushNotificationManager = ({ token, userEmail }) => {
    const [isSupported, setIsSupported] = useState(false);
    const [subscription, setSubscription] = useState(null);
    const [permission, setPermission] = useState('default');
    const [loading, setLoading] = useState(false);
    const [showBanner, setShowBanner] = useState(false);

    useEffect(() => {
        const supported = 'serviceWorker' in navigator && 'PushManager' in window;
        setIsSupported(supported);

        if (supported) {
            setPermission(Notification.permission);
            if (token && userEmail && Notification.permission === 'default') {
                setTimeout(() => setShowBanner(true), 2000);
            }
            registerServiceWorker();
        }
    }, [token, userEmail]);

    const registerServiceWorker = async () => {
        try {
            const registration = await navigator.serviceWorker.register('/service-worker.js');
            const existingSubscription = await registration.pushManager.getSubscription();
            if (existingSubscription) setSubscription(existingSubscription);
        } catch (error) {
            console.error('Service Worker registration failed:', error);
        }
    };

    const urlBase64ToUint8Array = (base64String) => {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
        return outputArray;
    };

    const subscribeToPush = async () => {
        setLoading(true);
        try {
            const perm = await Notification.requestPermission();
            setPermission(perm);

            if (perm !== 'granted') {
                setShowBanner(false);
                setLoading(false);
                return;
            }

            const vapidResponse = await fetch(`${config.API_URL}/vapid-public-key`);
            const { publicKey } = await vapidResponse.json();

            if (!publicKey) throw new Error('No VAPID public key');

            const registration = await navigator.serviceWorker.ready;
            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicKey)
            });

            setSubscription(sub);

            await fetch(`${config.API_URL}/save-subscription`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ subscription: sub })
            });

            setShowBanner(false);
            setTimeout(() => {
                fetch(`${config.API_URL}/test-notification`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            }, 1000);

        } catch (error) {
            console.error('Error subscribing to push:', error);
            alert('Failed to enable push notifications.');
        }
        setLoading(false);
    };

    if (!isSupported || !token) return null;

    return (
        <AnimatePresence>
            {showBanner && permission === 'default' && (
                <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -50, opacity: 0 }}
                    className="fixed top-20 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-50"
                >
                    <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-4">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-sky-100 rounded-lg flex items-center justify-center shrink-0">
                                <Bell className="w-5 h-5 text-sky-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-semibold text-slate-900">Enable Notifications</h3>
                                <p className="text-xs text-slate-500">Get updates on your service request</p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={subscribeToPush}
                                disabled={loading}
                                className="flex-1 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium py-2 rounded-lg transition-colors"
                            >
                                {loading ? 'Enabling...' : 'Enable'}
                            </button>
                            <button
                                onClick={() => setShowBanner(false)}
                                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium py-2 rounded-lg transition-colors"
                            >
                                Not Now
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default PushNotificationManager;
