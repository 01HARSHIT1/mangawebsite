'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { FaHeart, FaComment, FaBook, FaUserPlus, FaGift, FaStar, FaUpload, FaEye } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

interface ActivityItem {
    _id: string;
    type: 'like' | 'comment' | 'follow' | 'new_chapter' | 'new_manga' | 'tip' | 'rating';
    user: {
        _id: string;
        username: string;
        role: string;
        avatarUrl?: string;
    };
    target?: {
        type: 'manga' | 'chapter' | 'user';
        id: string;
        title: string;
        coverImage?: string;
    };
    content?: string;
    metadata?: {
        rating?: number;
        amount?: number;
        chapterNumber?: number;
    };
    createdAt: string;
    isPublic: boolean;
}

interface ActivityFeedProps {
    userId?: string; // If specified, show activity for specific user
    feedType?: 'global' | 'following' | 'personal';
    limit?: number;
    showHeader?: boolean;
}

export default function ActivityFeed({ 
    userId, 
    feedType = 'global', 
    limit = 20,
    showHeader = true 
}: ActivityFeedProps) {
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'manga' | 'social' | 'uploads'>('all');
    const { user, isAuthenticated } = useAuth();
    const { socket } = useWebSocket();

    useEffect(() => {
        loadActivities();
    }, [userId, feedType, filter]);

    useEffect(() => {
        if (socket) {
            // Listen for real-time activity updates
            const handleNewActivity = (activity: ActivityItem) => {
                setActivities(prev => [activity, ...prev.slice(0, limit - 1)]);
            };

            socket.on('new_activity', handleNewActivity);

            return () => {
                socket.off('new_activity', handleNewActivity);
            };
        }
    }, [socket, limit]);

    const loadActivities = async () => {
        try {
            setLoading(true);
            
            let endpoint = '/api/activities';
            const params = new URLSearchParams();
            
            if (userId) params.append('userId', userId);
            if (feedType !== 'global') params.append('type', feedType);
            if (filter !== 'all') params.append('filter', filter);
            params.append('limit', limit.toString());

            const queryString = params.toString();
            if (queryString) endpoint += `?${queryString}`;

            const response = await fetch(endpoint, {
                headers: isAuthenticated ? {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                } : {}
            });

            if (response.ok) {
                const data = await response.json();
                setActivities(data.activities || []);
            } else {
                // Use mock data if API fails
                setActivities(generateMockActivities());
            }
        } catch (error) {
            console.error('Failed to load activities:', error);
            setActivities(generateMockActivities());
        } finally {
            setLoading(false);
        }
    };

    const generateMockActivities = (): ActivityItem[] => {
        const mockUsers = [
            { _id: '1', username: 'manga_lover_01', role: 'reader' },
            { _id: '2', username: 'akira_yamamoto', role: 'creator' },
            { _id: '3', username: 'fantasy_fan', role: 'reader' },
            { _id: '4', username: 'manga_critic', role: 'reader' }
        ];

        const mockManga = [
            { id: '1', title: 'Dragon Chronicles', coverImage: '/placeholder-page-1.svg' },
            { id: '2', title: 'Tokyo High School', coverImage: '/placeholder-page-2.svg' },
            { id: '3', title: 'Cyber Ninja', coverImage: '/placeholder-page-3.svg' }
        ];

        return [
            {
                _id: '1',
                type: 'new_chapter',
                user: mockUsers[1],
                target: { type: 'chapter', id: '1', title: 'Dragon Chronicles - Chapter 26', coverImage: mockManga[0].coverImage },
                metadata: { chapterNumber: 26 },
                createdAt: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
                isPublic: true
            },
            {
                _id: '2',
                type: 'like',
                user: mockUsers[0],
                target: { type: 'manga', id: '2', title: 'Tokyo High School', coverImage: mockManga[1].coverImage },
                createdAt: new Date(Date.now() - 600000).toISOString(), // 10 minutes ago
                isPublic: true
            },
            {
                _id: '3',
                type: 'rating',
                user: mockUsers[2],
                target: { type: 'manga', id: '3', title: 'Cyber Ninja', coverImage: mockManga[2].coverImage },
                metadata: { rating: 5 },
                createdAt: new Date(Date.now() - 900000).toISOString(), // 15 minutes ago
                isPublic: true
            },
            {
                _id: '4',
                type: 'follow',
                user: mockUsers[3],
                target: { type: 'user', id: mockUsers[1]._id, title: mockUsers[1].username },
                createdAt: new Date(Date.now() - 1200000).toISOString(), // 20 minutes ago
                isPublic: true
            }
        ];
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'like': return <FaHeart className="text-red-400" />;
            case 'comment': return <FaComment className="text-blue-400" />;
            case 'follow': return <FaUserPlus className="text-green-400" />;
            case 'new_chapter': return <FaBook className="text-purple-400" />;
            case 'new_manga': return <FaUpload className="text-orange-400" />;
            case 'tip': return <FaGift className="text-yellow-400" />;
            case 'rating': return <FaStar className="text-yellow-400" />;
            default: return <FaEye className="text-gray-400" />;
        }
    };

    const getActivityText = (activity: ActivityItem) => {
        switch (activity.type) {
            case 'like':
                return `liked ${activity.target?.title}`;
            case 'comment':
                return `commented on ${activity.target?.title}`;
            case 'follow':
                return `started following ${activity.target?.title}`;
            case 'new_chapter':
                return `uploaded Chapter ${activity.metadata?.chapterNumber} of ${activity.target?.title}`;
            case 'new_manga':
                return `uploaded a new manga: ${activity.target?.title}`;
            case 'tip':
                return `tipped ${activity.metadata?.amount} coins to ${activity.target?.title}`;
            case 'rating':
                return `rated ${activity.target?.title} ${activity.metadata?.rating} stars`;
            default:
                return `interacted with ${activity.target?.title}`;
        }
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
        
        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
        return `${Math.floor(diffInMinutes / 1440)}d ago`;
    };

    const getTargetLink = (activity: ActivityItem) => {
        if (!activity.target) return '#';
        
        switch (activity.target.type) {
            case 'manga':
                return `/manga/${activity.target.id}`;
            case 'chapter':
                return `/manga/${activity.target.id.split('-')[0]}/chapter/${activity.target.id}`;
            case 'user':
                return `/users/${activity.target.id}`;
            default:
                return '#';
        }
    };

    if (loading) {
        return (
            <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="bg-slate-800/50 rounded-2xl p-4 animate-pulse">
                        <div className="flex items-start space-x-3">
                            <div className="w-10 h-10 bg-gray-600 rounded-full"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-gray-600 rounded w-3/4"></div>
                                <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {showHeader && (
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
                        <FaEye />
                        <span>
                            {feedType === 'global' ? 'Community Activity' : 
                             feedType === 'following' ? 'Following Activity' : 
                             'Your Activity'}
                        </span>
                    </h2>
                    
                    {/* Filter Options */}
                    <div className="flex space-x-2">
                        {['all', 'manga', 'social', 'uploads'].map((filterOption) => (
                            <button
                                key={filterOption}
                                onClick={() => setFilter(filterOption as any)}
                                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                                    filter === filterOption
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                                }`}
                            >
                                {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Activity List */}
            <div className="space-y-3">
                <AnimatePresence>
                    {activities.map((activity, index) => (
                        <motion.div
                            key={activity._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-slate-800/50 rounded-2xl p-4 border border-purple-500/10 hover:border-purple-500/30 transition-all duration-300"
                        >
                            <div className="flex items-start space-x-3">
                                {/* User Avatar */}
                                <Link href={`/users/${activity.user._id}`} className="flex-shrink-0">
                                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold hover:scale-105 transition-transform">
                                        {activity.user.avatarUrl ? (
                                            <Image
                                                src={activity.user.avatarUrl}
                                                alt={activity.user.username}
                                                width={40}
                                                height={40}
                                                className="rounded-full object-cover"
                                            />
                                        ) : (
                                            activity.user.username.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                </Link>

                                {/* Activity Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <p className="text-white">
                                                <Link 
                                                    href={`/users/${activity.user._id}`}
                                                    className="font-semibold hover:text-purple-400 transition-colors"
                                                >
                                                    {activity.user.username}
                                                </Link>
                                                {activity.user.role === 'creator' && (
                                                    <span className="ml-1 text-purple-400" title="Creator">✨</span>
                                                )}
                                                {activity.user.role === 'admin' && (
                                                    <span className="ml-1 text-red-400" title="Admin">👑</span>
                                                )}
                                                <span className="text-gray-300 ml-1">
                                                    {getActivityText(activity)}
                                                </span>
                                            </p>
                                            
                                            {/* Activity Content */}
                                            {activity.content && (
                                                <p className="text-gray-400 text-sm mt-1 italic">
                                                    "{activity.content}"
                                                </p>
                                            )}
                                            
                                            {/* Rating Display */}
                                            {activity.metadata?.rating && (
                                                <div className="flex items-center space-x-1 mt-1">
                                                    {[...Array(5)].map((_, i) => (
                                                        <FaStar
                                                            key={i}
                                                            className={`text-sm ${
                                                                i < activity.metadata!.rating! ? 'text-yellow-400' : 'text-gray-600'
                                                            }`}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="flex items-center space-x-2 ml-3">
                                            <div className="text-purple-400">
                                                {getActivityIcon(activity.type)}
                                            </div>
                                            <span className="text-gray-500 text-xs">
                                                {formatTimeAgo(activity.createdAt)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Target Preview */}
                                    {activity.target && activity.target.type !== 'user' && (
                                        <Link
                                            href={getTargetLink(activity)}
                                            className="flex items-center space-x-3 mt-3 p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors group"
                                        >
                                            {activity.target.coverImage && (
                                                <div className="w-12 h-16 bg-gray-600 rounded overflow-hidden flex-shrink-0">
                                                    <Image
                                                        src={activity.target.coverImage}
                                                        alt={activity.target.title}
                                                        width={48}
                                                        height={64}
                                                        className="object-cover w-full h-full group-hover:scale-105 transition-transform"
                                                    />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white font-medium text-sm group-hover:text-purple-400 transition-colors">
                                                    {activity.target.title}
                                                </p>
                                                <p className="text-gray-400 text-xs capitalize">
                                                    {activity.target.type}
                                                </p>
                                            </div>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Empty State */}
            {activities.length === 0 && !loading && (
                <div className="text-center py-12">
                    <FaEye className="mx-auto text-6xl text-gray-600 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-400 mb-2">No Activity Yet</h3>
                    <p className="text-gray-500">
                        {feedType === 'following' 
                            ? "Follow some users to see their activity here"
                            : "Be the first to interact with manga on the platform!"
                        }
                    </p>
                </div>
            )}

            {/* Load More */}
            {activities.length >= limit && (
                <div className="text-center pt-4">
                    <button
                        onClick={() => loadActivities()}
                        className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
                    >
                        Load More Activity
                    </button>
                </div>
            )}
        </div>
    );

}
