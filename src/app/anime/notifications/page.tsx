'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Bell, Settings, Mail, Smartphone, X, Check } from 'lucide-react';
import { motion } from 'framer-motion';

interface Notification {
    _id: string;
    type: string;
    title: string;
    message: string;
    read: boolean;
    createdAt: string;
}

interface NotificationPreferences {
    email: boolean;
    push: boolean;
    newEpisodes: boolean;
    recommendations: boolean;
    moderation: boolean;
    payouts: boolean;
    comments: boolean;
}

export default function NotificationsPage() {
    const { isAuthenticated } = useAuth();
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [preferences, setPreferences] = useState<NotificationPreferences>({
        email: true,
        push: true,
        newEpisodes: true,
        recommendations: true,
        moderation: true,
        payouts: true,
        comments: true,
    });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'notifications' | 'settings'>('notifications');

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }
        fetchNotifications();
        fetchPreferences();
    }, [isAuthenticated]);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            if (!token) return;

            const response = await fetch('/api/notifications', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                setNotifications(data.notifications || []);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPreferences = async () => {
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            if (!token) return;

            const response = await fetch('/api/notifications/settings', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                if (data.preferences) {
                    setPreferences(data.preferences);
                }
            }
        } catch (error) {
            console.error('Error fetching preferences:', error);
        }
    };

    const markAsRead = async (notificationId: string) => {
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            if (!token) return;

            await fetch(`/api/notifications/${notificationId}/read`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            setNotifications(prev =>
                prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
            );
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            if (!token) return;

            await fetch('/api/notifications/mark-all-read', {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const updatePreference = async (key: keyof NotificationPreferences, value: boolean) => {
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            if (!token) return;

            const newPreferences = { ...preferences, [key]: value };
            setPreferences(newPreferences);

            await fetch('/api/notifications/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ [key]: value }),
            });
        } catch (error) {
            console.error('Error updating preference:', error);
            // Revert on error
            setPreferences(prev => ({ ...prev, [key]: !value }));
        }
    };

    if (!isAuthenticated) {
        return null;
    }

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-950 via-red-950 to-black text-white">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-8">
                    <h1 className="text-4xl font-black mb-2 bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 bg-clip-text text-transparent">
                        Notifications
                    </h1>
                    <p className="text-gray-400">Manage your notifications and preferences</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-8 border-b border-orange-500/20">
                    <button
                        onClick={() => setActiveTab('notifications')}
                        className={`
                            flex items-center gap-2 px-6 py-3 font-semibold transition-all relative
                            ${activeTab === 'notifications'
                                ? 'text-orange-400'
                                : 'text-gray-400 hover:text-orange-300'
                            }
                        `}
                    >
                        <Bell className="w-5 h-5" />
                        <span>Notifications</span>
                        {unreadCount > 0 && (
                            <span className="px-2 py-0.5 bg-orange-500 text-white text-xs rounded-full">
                                {unreadCount}
                            </span>
                        )}
                        {activeTab === 'notifications' && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-400"
                                initial={false}
                                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                            />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`
                            flex items-center gap-2 px-6 py-3 font-semibold transition-all relative
                            ${activeTab === 'settings'
                                ? 'text-orange-400'
                                : 'text-gray-400 hover:text-orange-300'
                            }
                        `}
                    >
                        <Settings className="w-5 h-5" />
                        <span>Settings</span>
                        {activeTab === 'settings' && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-400"
                                initial={false}
                                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                            />
                        )}
                    </button>
                </div>

                {/* Content */}
                {activeTab === 'notifications' ? (
                    <div className="space-y-4">
                        {unreadCount > 0 && (
                            <div className="flex justify-end mb-4">
                                <button
                                    onClick={markAllAsRead}
                                    className="px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-lg transition-colors text-sm font-semibold"
                                >
                                    Mark All as Read
                                </button>
                            </div>
                        )}

                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                            </div>
                        ) : notifications.length > 0 ? (
                            notifications.map((notification, index) => (
                                <motion.div
                                    key={notification._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={`
                                        p-4 rounded-xl border transition-all cursor-pointer
                                        ${notification.read
                                            ? 'bg-black/20 border-orange-500/10'
                                            : 'bg-orange-500/10 border-orange-500/30'
                                        }
                                    `}
                                    onClick={() => !notification.read && markAsRead(notification._id)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-grow">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-bold text-white">{notification.title}</h3>
                                                {!notification.read && (
                                                    <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                                                )}
                                            </div>
                                            <p className="text-gray-300 text-sm mb-2">{notification.message}</p>
                                            <p className="text-gray-500 text-xs">
                                                {new Date(notification.createdAt).toLocaleString()}
                                            </p>
                                        </div>
                                        {!notification.read && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    markAsRead(notification._id);
                                                }}
                                                className="p-2 hover:bg-orange-500/20 rounded-lg transition-colors"
                                            >
                                                <Check className="w-5 h-5 text-orange-400" />
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="text-center py-20">
                                <Bell className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                                <p className="text-gray-400 text-xl">No notifications</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="bg-black/40 backdrop-blur-md rounded-xl border border-orange-500/20 p-6">
                            <h3 className="text-xl font-bold mb-4">Notification Channels</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Mail className="w-5 h-5 text-orange-400" />
                                        <span>Email Notifications</span>
                                    </div>
                                    <button
                                        onClick={() => updatePreference('email', !preferences.email)}
                                        className={`
                                            w-14 h-7 rounded-full transition-colors relative
                                            ${preferences.email ? 'bg-orange-500' : 'bg-gray-600'}
                                        `}
                                    >
                                        <div className={`
                                            absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform
                                            ${preferences.email ? 'translate-x-7' : 'translate-x-0'}
                                        `} />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Smartphone className="w-5 h-5 text-orange-400" />
                                        <span>Push Notifications</span>
                                    </div>
                                    <button
                                        onClick={() => updatePreference('push', !preferences.push)}
                                        className={`
                                            w-14 h-7 rounded-full transition-colors relative
                                            ${preferences.push ? 'bg-orange-500' : 'bg-gray-600'}
                                        `}
                                    >
                                        <div className={`
                                            absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform
                                            ${preferences.push ? 'translate-x-7' : 'translate-x-0'}
                                        `} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="bg-black/40 backdrop-blur-md rounded-xl border border-orange-500/20 p-6">
                            <h3 className="text-xl font-bold mb-4">Notification Types</h3>
                            <div className="space-y-4">
                                {[
                                    { key: 'newEpisodes' as const, label: 'New Episodes' },
                                    { key: 'recommendations' as const, label: 'Recommendations' },
                                    { key: 'moderation' as const, label: 'Moderation Updates' },
                                    { key: 'payouts' as const, label: 'Payout Notifications' },
                                    { key: 'comments' as const, label: 'Comments & Interactions' },
                                ].map(({ key, label }) => (
                                    <div key={key} className="flex items-center justify-between">
                                        <span>{label}</span>
                                        <button
                                            onClick={() => updatePreference(key, !preferences[key])}
                                            className={`
                                                w-14 h-7 rounded-full transition-colors relative
                                                ${preferences[key] ? 'bg-orange-500' : 'bg-gray-600'}
                                            `}
                                        >
                                            <div className={`
                                                absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform
                                                ${preferences[key] ? 'translate-x-7' : 'translate-x-0'}
                                            `} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

