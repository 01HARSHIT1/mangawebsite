'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { FaBell, FaBook, FaHeart, FaComment, FaUserPlus, FaGift, FaCog, FaCheck, FaCheckDouble, FaTrash, FaFilter } from 'react-icons/fa';

export default function NotificationsPage() {
    const [filter, setFilter] = useState<'all' | 'unread' | 'new_chapter' | 'social'>('all');
    const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
    const { isAuthenticated } = useAuth();
    const { notifications, markAsRead, markAllAsRead, isLoading } = useNotifications();
    const router = useRouter();

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, router]);

    const filteredNotifications = notifications.filter(notification => {
        switch (filter) {
            case 'unread':
                return !notification.read;
            case 'new_chapter':
                return notification.type === 'new_chapter';
            case 'social':
                return ['like', 'comment', 'follow', 'tip'].includes(notification.type);
            default:
                return true;
        }
    });

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'new_chapter':
                return <FaBook className="text-blue-400" />;
            case 'like':
                return <FaHeart className="text-red-400" />;
            case 'comment':
                return <FaComment className="text-green-400" />;
            case 'follow':
                return <FaUserPlus className="text-purple-400" />;
            case 'tip':
                return <FaGift className="text-yellow-400" />;
            case 'system':
                return <FaCog className="text-gray-400" />;
            default:
                return <FaBell className="text-blue-400" />;
        }
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
        return date.toLocaleDateString();
    };

    const getNotificationLink = (notification: any) => {
        switch (notification.type) {
            case 'new_chapter':
                return notification.data?.chapterId
                    ? `/manga/${notification.data.mangaId}/chapter/${notification.data.chapterId}`
                    : `/manga/${notification.data?.mangaId}`;
            case 'like':
            case 'comment':
                return `/manga/${notification.data?.mangaId}`;
            case 'follow':
                return `/profile`;
            case 'tip':
                return `/creator/dashboard`;
            default:
                return '/';
        }
    };

    const handleNotificationClick = async (notification: any) => {
        if (!notification.read) {
            await markAsRead(notification._id);
        }
    };

    const toggleSelectNotification = (notificationId: string) => {
        setSelectedNotifications(prev =>
            prev.includes(notificationId)
                ? prev.filter(id => id !== notificationId)
                : [...prev, notificationId]
        );
    };

    const deleteSelectedNotifications = async () => {
        // Implementation for deleting notifications
        console.log('Delete notifications:', selectedNotifications);
        setSelectedNotifications([]);
    };

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
            <div className="max-w-4xl mx-auto px-4 py-16">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full mb-6">
                        <FaBell className="text-3xl text-white" />
                    </div>
                    <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Notifications
                    </h1>
                    <p className="text-xl text-gray-300">
                        Stay updated with your manga community
                    </p>
                </div>

                {/* Controls */}
                <div className="bg-slate-800/50 rounded-3xl p-6 mb-8 backdrop-blur-sm">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        {/* Filter Tabs */}
                        <div className="flex flex-wrap gap-2">
                            {[
                                { key: 'all', label: 'All', icon: <FaBell /> },
                                { key: 'unread', label: 'Unread', icon: <FaCheck /> },
                                { key: 'new_chapter', label: 'New Chapters', icon: <FaBook /> },
                                { key: 'social', label: 'Social', icon: <FaHeart /> }
                            ].map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => setFilter(tab.key as any)}
                                    className={`flex items-center px-4 py-2 rounded-xl font-medium transition-all duration-300 ${filter === tab.key
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-slate-700/50 text-gray-300 hover:bg-slate-600/50'
                                        }`}
                                >
                                    <span className="mr-2">{tab.icon}</span>
                                    {tab.label}
                                    {tab.key === 'unread' && notifications.filter(n => !n.read).length > 0 && (
                                        <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                                            {notifications.filter(n => !n.read).length}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                            {notifications.filter(n => !n.read).length > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors"
                                >
                                    <FaCheckDouble />
                                    Mark All Read
                                </button>
                            )}
                            {selectedNotifications.length > 0 && (
                                <button
                                    onClick={deleteSelectedNotifications}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors"
                                >
                                    <FaTrash />
                                    Delete Selected
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Notifications List */}
                <div className="bg-slate-800/50 rounded-3xl backdrop-blur-sm overflow-hidden">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mr-3"></div>
                            <span className="text-gray-300">Loading notifications...</span>
                        </div>
                    ) : filteredNotifications.length === 0 ? (
                        <div className="text-center py-12">
                            <FaBell className="text-6xl text-gray-600 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-400 mb-2">
                                {filter === 'unread' ? 'No unread notifications' : 'No notifications found'}
                            </h3>
                            <p className="text-gray-500 mb-6">
                                {filter === 'all'
                                    ? "You're all caught up! We'll notify you when something happens."
                                    : `No ${filter === 'unread' ? 'unread' : filter.replace('_', ' ')} notifications.`
                                }
                            </p>
                            <Link
                                href="/manga"
                                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300"
                            >
                                Browse Manga
                            </Link>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-700/50">
                            {filteredNotifications.map((notification) => (
                                <div
                                    key={notification._id}
                                    className={`p-4 hover:bg-slate-700/30 transition-colors ${!notification.read ? 'bg-purple-900/10' : ''
                                        }`}
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Selection Checkbox */}
                                        <input
                                            type="checkbox"
                                            checked={selectedNotifications.includes(notification._id)}
                                            onChange={() => toggleSelectNotification(notification._id)}
                                            className="mt-1 rounded border-gray-600 bg-gray-700 text-purple-600 focus:ring-purple-500"
                                        />

                                        {/* Notification Icon */}
                                        <div className="flex-shrink-0 mt-1">
                                            {getNotificationIcon(notification.type)}
                                        </div>

                                        {/* Notification Content */}
                                        <div className="flex-1 min-w-0">
                                            <Link
                                                href={getNotificationLink(notification)}
                                                onClick={() => handleNotificationClick(notification)}
                                                className="block"
                                            >
                                                <h4 className={`font-medium mb-1 ${!notification.read ? 'text-white' : 'text-gray-300'}`}>
                                                    {notification.title}
                                                </h4>
                                                <p className="text-gray-400 text-sm mb-2 line-clamp-2">
                                                    {notification.message}
                                                </p>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-gray-500">
                                                        {formatTimeAgo(notification.createdAt)}
                                                    </span>
                                                    {!notification.read && (
                                                        <span className="text-xs text-purple-400 font-medium">
                                                            New
                                                        </span>
                                                    )}
                                                </div>
                                            </Link>
                                        </div>

                                        {/* Mark as Read Button */}
                                        {!notification.read && (
                                            <button
                                                onClick={() => markAsRead(notification._id)}
                                                className="text-gray-400 hover:text-purple-400 transition-colors p-1"
                                                title="Mark as read"
                                            >
                                                <FaCheck />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Back to Home */}
                <div className="text-center mt-8">
                    <Link
                        href="/"
                        className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-6 rounded-xl transition-colors duration-300"
                    >
                        Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
