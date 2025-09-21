'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { FaBell, FaBook, FaHeart, FaComment, FaUserPlus, FaGift, FaCog, FaCheck, FaCheckDouble } from 'react-icons/fa';
import { useNotifications } from '@/contexts/NotificationContext';

export default function NotificationDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } = useNotifications();

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        return date.toLocaleDateString();
    };

    const handleNotificationClick = async (notification: any) => {
        if (!notification.read) {
            await markAsRead(notification._id);
        }
        setIsOpen(false);
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

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Notification Bell */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-300 hover:text-white transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-lg"
                aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
            >
                <FaBell className="text-xl" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 font-bold">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-gray-800 rounded-xl shadow-2xl border border-gray-700 z-50 max-h-96 overflow-hidden">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
                        <h3 className="text-white font-semibold">Notifications</h3>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-purple-400 hover:text-purple-300 text-sm flex items-center gap-1"
                                    title="Mark all as read"
                                >
                                    <FaCheckDouble className="text-xs" />
                                    Mark all read
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-80 overflow-y-auto">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="text-center py-8">
                                <FaBell className="text-4xl text-gray-600 mx-auto mb-2" />
                                <p className="text-gray-400">No notifications yet</p>
                                <p className="text-gray-500 text-sm">We'll notify you when something happens!</p>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <Link
                                    key={notification._id}
                                    href={getNotificationLink(notification)}
                                    onClick={() => handleNotificationClick(notification)}
                                    className={`block px-4 py-3 hover:bg-gray-700 transition-colors border-b border-gray-700/50 last:border-b-0 ${!notification.read ? 'bg-purple-900/20' : ''
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0 mt-1">
                                            {getNotificationIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className={`text-sm font-medium ${!notification.read ? 'text-white' : 'text-gray-300'}`}>
                                                {notification.title}
                                            </h4>
                                            <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                                                {notification.message}
                                            </p>
                                            <div className="flex items-center justify-between mt-2">
                                                <span className="text-xs text-gray-500">
                                                    {formatTimeAgo(notification.createdAt)}
                                                </span>
                                                {!notification.read && (
                                                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="px-4 py-3 border-t border-gray-700 bg-gray-800/50">
                            <Link
                                href="/notifications"
                                className="text-purple-400 hover:text-purple-300 text-sm font-medium"
                                onClick={() => setIsOpen(false)}
                            >
                                View all notifications →
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
