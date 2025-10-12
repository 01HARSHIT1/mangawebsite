'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FaBell, FaTimes, FaCheck } from 'react-icons/fa';

export default function PushNotifications() {
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [showPrompt, setShowPrompt] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        // Check if push notifications are supported
        if ('Notification' in window && 'serviceWorker' in navigator) {
            setIsSupported(true);
            setPermission(Notification.permission);

            // Show prompt if user is authenticated and permission is default
            if (isAuthenticated && Notification.permission === 'default') {
                // Delay showing prompt to not be intrusive
                setTimeout(() => setShowPrompt(true), 5000);
            }
        }
    }, [isAuthenticated]);

    const requestPermission = async () => {
        if (!isSupported) return;

        try {
            const result = await Notification.requestPermission();
            setPermission(result);
            setShowPrompt(false);

            if (result === 'granted') {
                // Register service worker and get push subscription
                await registerServiceWorker();

                // Show success notification
                new Notification('MangaReader Notifications', {
                    body: 'You\'ll now receive notifications about new manga chapters!',
                    icon: '/favicon.ico',
                    badge: '/favicon.ico'
                });
            }
        } catch (error) {
            console.error('Error requesting notification permission:', error);
        }
    };

    const registerServiceWorker = async () => {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker registered:', registration);

            // Subscribe to push notifications
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
            });

            // Send subscription to backend
            const token = localStorage.getItem('authToken');
            if (token) {
                await fetch('/api/notifications/subscribe', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        subscription: subscription.toJSON()
                    })
                });
            }
        } catch (error) {
            console.error('Error registering service worker:', error);
        }
    };

    const dismissPrompt = () => {
        setShowPrompt(false);
        // Don't show again for this session
        sessionStorage.setItem('notificationPromptDismissed', 'true');
    };

    // Don't show if not supported, not authenticated, or already granted/denied
    if (!isSupported || !isAuthenticated || permission !== 'default' || !showPrompt) {
        return null;
    }

    // Check if user already dismissed this session
    if (sessionStorage.getItem('notificationPromptDismissed')) {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm">
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl shadow-2xl border border-purple-500/20 p-6 backdrop-blur-md">
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                            <FaBell className="text-white text-xl" />
                        </div>
                    </div>

                    <div className="flex-1">
                        <h3 className="text-white font-semibold mb-2">
                            Stay Updated!
                        </h3>
                        <p className="text-gray-300 text-sm mb-4">
                            Get notified when your favorite manga releases new chapters.
                        </p>

                        <div className="flex gap-2">
                            <button
                                onClick={requestPermission}
                                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 text-sm"
                            >
                                <FaCheck />
                                Enable
                            </button>
                            <button
                                onClick={dismissPrompt}
                                className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-300 text-sm"
                            >
                                <FaTimes />
                                Later
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
