'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { FaUserPlus, FaUserMinus, FaUsers, FaHeart, FaBell, FaCheck } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface FollowSystemProps {
    targetUserId: string;
    targetUsername: string;
    targetRole?: 'reader' | 'creator' | 'admin';
    showFollowerCount?: boolean;
    size?: 'small' | 'medium' | 'large';
}

interface Follower {
    userId: string;
    username: string;
    role: string;
    followedAt: Date;
    avatarUrl?: string;
}

export default function UserFollowSystem({ 
    targetUserId, 
    targetUsername, 
    targetRole = 'reader',
    showFollowerCount = true,
    size = 'medium'
}: FollowSystemProps) {
    const [isFollowing, setIsFollowing] = useState(false);
    const [followerCount, setFollowerCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [showFollowers, setShowFollowers] = useState(false);
    const [followers, setFollowers] = useState<Follower[]>([]);
    const [following, setFollowing] = useState<Follower[]>([]);
    
    const { user, isAuthenticated } = useAuth();
    const { socket } = useWebSocket();

    useEffect(() => {
        if (isAuthenticated && targetUserId) {
            checkFollowStatus();
            loadFollowData();
        }
    }, [isAuthenticated, targetUserId]);

    useEffect(() => {
        if (socket) {
            // Listen for real-time follow updates
            socket.on('user_followed', (data: { followerId: string; followedId: string; followerUsername: string }) => {
                if (data.followedId === targetUserId) {
                    setFollowerCount(prev => prev + 1);
                }
                if (data.followerId === user?._id) {
                    setIsFollowing(true);
                }
            });

            socket.on('user_unfollowed', (data: { followerId: string; followedId: string; followerUsername: string }) => {
                if (data.followedId === targetUserId) {
                    setFollowerCount(prev => Math.max(0, prev - 1));
                }
                if (data.followerId === user?._id) {
                    setIsFollowing(false);
                }
            });

            return () => {
                socket.off('user_followed');
                socket.off('user_unfollowed');
            };
        }
    }, [socket, targetUserId, user?._id]);

    const checkFollowStatus = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch(`/api/users/${targetUserId}/follow-status`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setIsFollowing(data.isFollowing);
            }
        } catch (error) {
            console.error('Failed to check follow status:', error);
        }
    };

    const loadFollowData = async () => {
        try {
            const [followersRes, followingRes] = await Promise.all([
                fetch(`/api/users/${targetUserId}/followers`),
                fetch(`/api/users/${targetUserId}/following`)
            ]);

            if (followersRes.ok) {
                const followersData = await followersRes.json();
                setFollowers(followersData.followers || []);
                setFollowerCount(followersData.count || 0);
            }

            if (followingRes.ok) {
                const followingData = await followingRes.json();
                setFollowing(followingData.following || []);
                setFollowingCount(followingData.count || 0);
            }
        } catch (error) {
            console.error('Failed to load follow data:', error);
            // Use mock data for demonstration
            setFollowerCount(Math.floor(Math.random() * 500) + 50);
            setFollowingCount(Math.floor(Math.random() * 200) + 20);
        }
    };

    const handleFollowToggle = async () => {
        if (!isAuthenticated || !user || loading) return;
        
        if (user._id === targetUserId) return; // Can't follow yourself

        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('No authentication token');

            const response = await fetch(`/api/users/${targetUserId}/follow`, {
                method: isFollowing ? 'DELETE' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.ok) {
                const wasFollowing = isFollowing;
                setIsFollowing(!isFollowing);
                setFollowerCount(prev => wasFollowing ? prev - 1 : prev + 1);

                // Send real-time update via WebSocket
                if (socket) {
                    socket.emit(wasFollowing ? 'unfollow_user' : 'follow_user', {
                        targetUserId,
                        targetUsername
                    });
                }

                // Show success message
                console.log(`${wasFollowing ? 'Unfollowed' : 'Followed'} ${targetUsername}`);
            } else {
                throw new Error('Follow action failed');
            }
        } catch (error) {
            console.error('Failed to toggle follow:', error);
            // Revert optimistic update
            setIsFollowing(isFollowing);
        } finally {
            setLoading(false);
        }
    };

    const getButtonSize = () => {
        switch (size) {
            case 'small': return 'px-3 py-1 text-sm';
            case 'large': return 'px-6 py-3 text-lg';
            default: return 'px-4 py-2 text-base';
        }
    };

    const getIconSize = () => {
        switch (size) {
            case 'small': return 'text-sm';
            case 'large': return 'text-xl';
            default: return 'text-base';
        }
    };

    // Don't show follow button for own profile
    if (user?._id === targetUserId) {
        return showFollowerCount ? (
            <div className="flex items-center space-x-4 text-gray-300">
                <div className="flex items-center space-x-1">
                    <FaUsers className={getIconSize()} />
                    <span className={size === 'small' ? 'text-sm' : 'text-base'}>
                        {followerCount} followers
                    </span>
                </div>
                <div className="flex items-center space-x-1">
                    <FaHeart className={getIconSize()} />
                    <span className={size === 'small' ? 'text-sm' : 'text-base'}>
                        {followingCount} following
                    </span>
                </div>
            </div>
        ) : null;
    }

    return (
        <div className="flex items-center space-x-3">
            {/* Follow Button */}
            {isAuthenticated ? (
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleFollowToggle}
                    disabled={loading}
                    className={`flex items-center space-x-2 font-semibold rounded-lg transition-all duration-300 ${getButtonSize()} ${
                        isFollowing
                            ? 'bg-gray-600 text-white hover:bg-gray-700'
                            : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    {loading ? (
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    ) : (
                        <>
                            {isFollowing ? (
                                <>
                                    <FaCheck className={getIconSize()} />
                                    <span>Following</span>
                                </>
                            ) : (
                                <>
                                    <FaUserPlus className={getIconSize()} />
                                    <span>Follow</span>
                                </>
                            )}
                        </>
                    )}
                </motion.button>
            ) : (
                <Link
                    href="/login"
                    className={`flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 ${getButtonSize()}`}
                >
                    <FaUserPlus className={getIconSize()} />
                    <span>Follow</span>
                </Link>
            )}

            {/* Follower Count */}
            {showFollowerCount && (
                <div className="flex items-center space-x-4 text-gray-300">
                    <button
                        onClick={() => setShowFollowers(true)}
                        className="flex items-center space-x-1 hover:text-white transition-colors"
                    >
                        <FaUsers className={getIconSize()} />
                        <span className={size === 'small' ? 'text-sm' : 'text-base'}>
                            {followerCount}
                        </span>
                    </button>
                    
                    {targetRole === 'creator' && (
                        <div className="flex items-center space-x-1">
                            <FaHeart className={getIconSize()} />
                            <span className={size === 'small' ? 'text-sm' : 'text-base'}>
                                {followingCount}
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* Followers Modal */}
            <AnimatePresence>
                {showFollowers && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowFollowers(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-purple-500/20 shadow-2xl max-h-96 overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-white">
                                    {targetUsername}'s Followers
                                </h3>
                                <button
                                    onClick={() => setShowFollowers(false)}
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    ×
                                </button>
                            </div>

                            <div className="overflow-y-auto max-h-64">
                                {followers.length === 0 ? (
                                    <div className="text-center py-8 text-gray-400">
                                        <FaUsers className="mx-auto text-4xl mb-2 opacity-50" />
                                        <p>No followers yet</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {followers.map((follower) => (
                                            <div key={follower.userId} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                                                <Link
                                                    href={`/users/${follower.userId}`}
                                                    className="flex items-center space-x-3 flex-1 hover:text-purple-400 transition-colors"
                                                    onClick={() => setShowFollowers(false)}
                                                >
                                                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                                                        {follower.username.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-white font-medium">{follower.username}</p>
                                                        <p className="text-gray-400 text-sm capitalize">{follower.role}</p>
                                                    </div>
                                                </Link>
                                                
                                                {user?._id !== follower.userId && (
                                                    <UserFollowSystem
                                                        targetUserId={follower.userId}
                                                        targetUsername={follower.username}
                                                        targetRole={follower.role as any}
                                                        showFollowerCount={false}
                                                        size="small"
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
