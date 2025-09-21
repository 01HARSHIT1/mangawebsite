'use client';

import { useState, useEffect } from 'react';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { FaBell, FaHeart, FaComment, FaBook, FaGift, FaTimes } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface RealTimeNotification {
    id: string;
    type: 'new_chapter' | 'like' | 'comment' | 'follow' | 'tip' | 'system';
    title: string;
    message: string;
    data?: {
        mangaId?: string;
        chapterId?: string;
        mangaTitle?: string;
        chapterTitle?: string;
        fromUser?: string;
        amount?: number;
    };
    timestamp: Date;
    read: boolean;
}

export default function RealTimeNotifications() {
    const [notifications, setNotifications] = useState<RealTimeNotification[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const { socket } = useWebSocket();

    useEffect(() => {
        if (socket) {
            // Listen for real-time notifications
            const handleNotification = (notification: any) => {
                const newNotification: RealTimeNotification = {
                    ...notification,
                    id: notification.id || Date.now().toString(),
                    timestamp: new Date(notification.timestamp || Date.now()),
                    read: false
                };

                setNotifications(prev => [newNotification, ...prev.slice(0, 9)]); // Keep only 10 most recent
                
                // Show browser notification if permission granted
                if (Notification.permission === 'granted') {
                    new Notification(newNotification.title, {
                        body: newNotification.message,
                        icon: '/favicon.ico',
                        tag: newNotification.id
                    });
                }

                // Auto-hide after 5 seconds unless user is viewing
                if (!showNotifications) {
                    setTimeout(() => {
                        setNotifications(prev => prev.map(n => 
                            n.id === newNotification.id ? { ...n, read: true } : n
                        ));
                    }, 5000);
                }
            };

            socket.on('notification', handleNotification);
            socket.on('manga_notification', handleNotification);

            return () => {
                socket.off('notification', handleNotification);
                socket.off('manga_notification', handleNotification);
            };
        }
    }, [socket, showNotifications]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAsRead = (notificationId: string) => {
        setNotifications(prev => prev.map(n => 
            n.id === notificationId ? { ...n, read: true } : n
        ));
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const removeNotification = (notificationId: string) => {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'new_chapter': return <FaBook className="text-blue-400" />;
            case 'like': return <FaHeart className="text-red-400" />;
            case 'comment': return <FaComment className="text-green-400" />;
            case 'follow': return <FaBell className="text-purple-400" />;
            case 'tip': return <FaGift className="text-yellow-400" />;
            default: return <FaBell className="text-gray-400" />;
        }
    };

    const formatTimeAgo = (date: Date) => {
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
        
        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
        return `${Math.floor(diffInMinutes / 1440)}d ago`;
    };

    return (
        <div className="relative">
            {/* Notification Bell */}
            <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-300 hover:text-white transition-colors duration-300"
            >
                <FaBell className="text-xl" />
                {unreadCount > 0 && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                    >
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                )}
                
                {/* Live notification indicator */}
                {notifications.some(n => !n.read && (Date.now() - new Date(n.timestamp).getTime()) < 10000) && (
                    <div className="absolute top-0 right-0 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                )}
            </button>

            {/* Notification Dropdown */}
            <AnimatePresence>
                {showNotifications && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute right-0 mt-2 w-96 bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-purple-500/20 z-50 max-h-96 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 rounded-t-2xl">
                            <div className="flex items-center justify-between">
                                <h3 className="text-white font-semibold flex items-center space-x-2">
                                    <FaBell />
                                    <span>Live Notifications</span>
                                </h3>
                                <div className="flex items-center space-x-2">
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={markAllAsRead}
                                            className="text-white/80 hover:text-white text-sm transition-colors"
                                        >
                                            Mark all read
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setShowNotifications(false)}
                                        className="text-white/80 hover:text-white transition-colors"
                                    >
                                        <FaTimes />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Notifications List */}
                        <div className="max-h-80 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-6 text-center text-gray-400">
                                    <FaBell className="mx-auto text-4xl mb-2 opacity-50" />
                                    <p>No new notifications</p>
                                    <p className="text-sm">You're all caught up!</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-700/50">
                                    {notifications.map((notification) => (
                                        <motion.div
                                            key={notification.id}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className={`p-4 hover:bg-slate-800/50 transition-colors cursor-pointer ${
                                                !notification.read ? 'bg-purple-500/10 border-l-4 border-purple-500' : ''
                                            }`}
                                            onClick={() => markAsRead(notification.id)}
                                        >
                                            <div className="flex items-start space-x-3">
                                                <div className="flex-shrink-0 mt-1">
                                                    {getNotificationIcon(notification.type)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <h4 className="text-white font-medium text-sm">
                                                                {notification.title}
                                                            </h4>
                                                            <p className="text-gray-300 text-sm mt-1">
                                                                {notification.message}
                                                            </p>
                                                            
                                                            {/* Action Links */}
                                                            {notification.data?.mangaId && (
                                                                <Link
                                                                    href={`/manga/${notification.data.mangaId}${
                                                                        notification.data.chapterId ? `/chapter/${notification.data.chapterId}` : ''
                                                                    }`}
                                                                    className="inline-block mt-2 text-purple-400 hover:text-purple-300 text-sm transition-colors"
                                                                    onClick={() => setShowNotifications(false)}
                                                                >
                                                                    {notification.type === 'new_chapter' ? 'Read Chapter' : 'View Manga'} →
                                                                </Link>
                                                            )}
                                                        </div>
                                                        
                                                        <div className="flex items-center space-x-2 ml-2">
                                                            <span className="text-xs text-gray-500">
                                                                {formatTimeAgo(notification.timestamp)}
                                                            </span>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    removeNotification(notification.id);
                                                                }}
                                                                className="text-gray-500 hover:text-gray-300 transition-colors"
                                                            >
                                                                <FaTimes className="text-xs" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 0 && (
                            <div className="p-3 border-t border-slate-700/50 text-center">
                                <Link
                                    href="/notifications"
                                    className="text-purple-400 hover:text-purple-300 text-sm transition-colors"
                                    onClick={() => setShowNotifications(false)}
                                >
                                    View All Notifications
                                </Link>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Reaction Bar */}
            <AnimatePresence>
                {showReactionBar && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 10 }}
                        className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-slate-800/95 backdrop-blur-md rounded-2xl p-3 shadow-xl border border-purple-500/20 z-50"
                    >
                        <div className="flex space-x-2">
                            {Object.entries(reactionIcons).map(([type, config]) => (
                                <button
                                    key={type}
                                    onClick={() => handleReactionClick(type as keyof typeof reactionIcons)}
                                    className="p-2 rounded-lg hover:bg-slate-700/50 transition-all duration-200 transform hover:scale-110"
                                    title={type}
                                >
                                    <span className="text-xl">{config.emoji}</span>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
