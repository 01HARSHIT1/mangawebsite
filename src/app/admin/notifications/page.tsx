'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { FaBell, FaEnvelope, FaPaperPlane, FaUsers, FaBook, FaPlus } from 'react-icons/fa';

interface Notification {
    _id?: string;
    title: string;
    message: string;
    type: 'push' | 'email' | 'both';
    target: 'all' | 'creators' | 'readers' | 'specific';
    targetIds?: string[];
    scheduledAt?: string;
    sentAt?: string;
    status: 'draft' | 'scheduled' | 'sent';
}

export default function AdminNotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isAuthenticated || user?.role !== 'admin') {
            router.push('/admin/login');
            return;
        }
        fetchNotifications();
    }, [isAuthenticated, user, router]);

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            if (!token) {
                setLoading(false);
                return;
            }

            const response = await fetch('/api/admin/notifications', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setNotifications(data.notifications || []);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                            Notifications System
                        </h1>
                        <p className="text-gray-400">Send push notifications and emails to users</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg"
                    >
                        <FaPlus className="mr-2" />
                        New Notification
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-slate-800/50 rounded-2xl p-6 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-2">
                            <FaBell className="text-purple-400 text-2xl" />
                            <span className="text-2xl font-bold">{notifications.filter(n => n.type === 'push' || n.type === 'both').length}</span>
                        </div>
                        <p className="text-gray-400">Push Notifications</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-2xl p-6 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-2">
                            <FaEnvelope className="text-blue-400 text-2xl" />
                            <span className="text-2xl font-bold">{notifications.filter(n => n.type === 'email' || n.type === 'both').length}</span>
                        </div>
                        <p className="text-gray-400">Email Notifications</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-2xl p-6 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-2">
                            <FaPaperPlane className="text-green-400 text-2xl" />
                            <span className="text-2xl font-bold">{notifications.filter(n => n.status === 'sent').length}</span>
                        </div>
                        <p className="text-gray-400">Sent Today</p>
                    </div>
                </div>

                <div className="bg-slate-800/50 rounded-2xl p-6 backdrop-blur-sm">
                    <h2 className="text-xl font-bold mb-4">Notification History ({notifications.length})</h2>
                    {notifications.length === 0 ? (
                        <div className="text-gray-400 text-center py-8">No notifications sent yet</div>
                    ) : (
                        <div className="space-y-4">
                            {notifications.map((notification) => (
                                <div key={notification._id} className="bg-slate-700/50 rounded-lg p-4">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <h3 className="font-semibold mb-1">{notification.title}</h3>
                                            <p className="text-gray-300 text-sm mb-2">{notification.message}</p>
                                            <div className="flex items-center gap-4 text-xs text-gray-400">
                                                <span>Type: {notification.type}</span>
                                                <span>Target: {notification.target}</span>
                                                <span>Status: {notification.status}</span>
                                                {notification.sentAt && (
                                                    <span>Sent: {new Date(notification.sentAt).toLocaleDateString()}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {showModal && (
                    <NotificationModal
                        onClose={() => setShowModal(false)}
                        onSave={async (notification) => {
                            try {
                                const token = localStorage.getItem('authToken') || localStorage.getItem('token');
                                if (!token) return;

                                const response = await fetch('/api/admin/notifications', {
                                    method: 'POST',
                                    headers: {
                                        'Authorization': `Bearer ${token}`,
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify(notification)
                                });
                                if (response.ok) {
                                    fetchNotifications();
                                    setShowModal(false);
                                } else {
                                    alert('Failed to send notification');
                                }
                            } catch (error) {
                                console.error('Failed to send notification:', error);
                                alert('Failed to send notification');
                            }
                        }}
                    />
                )}
            </div>
        </div>
    );
}

function NotificationModal({ onClose, onSave }: { onClose: () => void; onSave: (notification: Notification) => void }) {
    const [formData, setFormData] = useState<Notification>({
        title: '',
        message: '',
        type: 'both',
        target: 'all',
        status: 'draft',
    });

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl p-6 max-w-2xl w-full">
                <h2 className="text-2xl font-bold mb-4">Create Notification</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Title</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Message</label>
                        <textarea
                            value={formData.message}
                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            rows={4}
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Type</label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white"
                        >
                            <option value="push">Push Only</option>
                            <option value="email">Email Only</option>
                            <option value="both">Both</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Target Audience</label>
                        <select
                            value={formData.target}
                            onChange={(e) => setFormData({ ...formData, target: e.target.value as any })}
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white"
                        >
                            <option value="all">All Users</option>
                            <option value="creators">Creators Only</option>
                            <option value="readers">Readers Only</option>
                            <option value="specific">Specific Users</option>
                        </select>
                    </div>
                    <div className="flex gap-2 pt-4">
                        <button
                            onClick={() => onSave(formData)}
                            className="flex-1 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg"
                        >
                            Save & Send
                        </button>
                        <button
                            onClick={onClose}
                            className="flex-1 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

