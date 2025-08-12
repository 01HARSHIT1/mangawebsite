"use client";
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaUser, FaCrown, FaShieldAlt, FaStar, FaHeart, FaBookmark, FaEye, FaUsers, FaTrophy, FaMedal, FaFire, FaGem, FaEdit, FaCog, FaSpinner, FaExclamationTriangle, FaCheckCircle, FaTimes } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import OptimizedImage from './OptimizedImage';

interface UserProfileProps {
    userId: string;
    currentUser?: any;
}

interface UserStats {
    totalReads: number;
    totalLikes: number;
    totalComments: number;
    totalBookmarks: number;
    readingStreak: number;
    followers: number;
    following: number;
    coins: number;
    achievements: string[];
    recentActivity: any[];
}

interface User {
    _id: string;
    nickname: string;
    username?: string;
    avatarUrl?: string;
    bio?: string;
    role: string;
    verified?: boolean;
    createdAt: string;
    followers: string[];
    following: string[];
}

export default function UserProfile({ userId, currentUser }: UserProfileProps) {
    const [user, setUser] = useState<User | null>(null);
    const [stats, setStats] = useState<UserStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [followLoading, setFollowLoading] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'achievements' | 'social'>('overview');
    const [followers, setFollowers] = useState<any>([]);
    const [following, setFollowing] = useState<any>([]);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [followersLoading, setFollowersLoading] = useState(false);
    const [followingLoading, setFollowingLoading] = useState(false);

    // Fetch user profile data
    const fetchUserProfile = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            const headers: HeadersInit = {};
            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }

            const [userRes, statsRes] = await Promise.all([
                fetch(`/api/users/${userId}`, { headers }),
                fetch(`/api/users/${userId}/stats`)
            ]);

            if (!userRes.ok) {
                throw new Error(userRes.status === 404 ? 'User not found' : 'Failed to load user profile');
            }

            const userData = await userRes.json();
            const statsData = await statsRes.json();

            setUser(userData.user);
            setStats(statsData.stats);
            setIsFollowing(userData.isFollowing || false);
        } catch (err) {
            console.error('Failed to fetch user profile:', err);
            setError(err instanceof Error ? err.message : 'Failed to load profile');
        } finally {
            setLoading(false);
        }
    }, [userId]);

    // Fetch followers list
    const fetchFollowers = useCallback(async () => {
        setFollowersLoading(true);
        try {
            const res = await fetch(`/api/users/${userId}/followers`);
            if (res.ok) {
                const data = await res.json();
                setFollowers(data.followers || []);
            }
        } catch (err) {
            console.error('Failed to fetch followers:', err);
        } finally {
            setFollowersLoading(false);
        }
    }, [userId]);

    // Fetch following list
    const fetchFollowing = useCallback(async () => {
        setFollowingLoading(true);
        try {
            const res = await fetch(`/api/users/${userId}/following`);
            if (res.ok) {
                const data = await res.json();
                setFollowing(data.following || []);
            }
        } catch (err) {
            console.error('Failed to fetch following:', err);
        } finally {
            setFollowingLoading(false);
        }
    }, [userId]);

    // Handle follow/unfollow with optimistic updates
    const handleFollow = async () => {
        if (!currentUser || !user) return;

        setFollowLoading(true);
        setError(null);
        setSuccess(null);

        // Optimistic update
        const wasFollowing = isFollowing;
        setIsFollowing(!wasFollowing);
        setStats(prev => prev ? {
            ...prev,
            followers: wasFollowing ? prev.followers - 1 : prev.followers + 1
        } : null);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('You must be logged in to follow users');
            }

            const method = wasFollowing ? 'DELETE' : 'POST';
            const res = await fetch(`/api/users/${userId}/follow`, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                }
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to update follow status');
            }

            setSuccess(wasFollowing ? 'Unfollowed successfully!' : 'Following successfully!');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            // Revert optimistic update on error
            setIsFollowing(wasFollowing);
            setStats(prev => prev ? {
                ...prev,
                followers: wasFollowing ? prev.followers + 1 : prev.followers - 1
            } : null);

            setError(err instanceof Error ? err.message : 'Failed to update follow status');
            setTimeout(() => setError(null), 5000);
        } finally {
            setFollowLoading(false);
        }
    };

    // Load data when component mounts or userId changes
    useEffect(() => {
        fetchUserProfile();
    }, [fetchUserProfile]);

    // Load followers/following when social tab is active
    useEffect(() => {
        if (activeTab === 'social') {
            fetchFollowers();
            fetchFollowing();
        }
    }, [activeTab, fetchFollowers, fetchFollowing]);

    // Utility functions
    const getUserRoleIcon = (role: string, verified?: boolean) => {
        if (role === 'admin') return <FaCrown className="text-yellow-400" title="Admin" />;
        if (role === 'creator') return <FaShieldAlt className="text-blue-400" title="Creator" />;
        if (verified) return <FaStar className="text-green-400" title="Verified" />;
        return <FaUser className="text-gray-400" title="User" />;
    };

    const getAchievementIcon = (achievement: string) => {
        switch (achievement) {
            case 'first_read': return <FaEye className="text-blue-400" />;
            case 'first_like': return <FaHeart className="text-pink-400" />;
            case 'first_comment': return <FaStar className="text-yellow-400" />;
            case 'reading_streak': return <FaFire className="text-orange-400" />;
            case 'bookmark_master': return <FaBookmark className="text-purple-400" />;
            case 'social_butterfly': return <FaUsers className="text-green-400" />;
            case 'top_reader': return <FaTrophy className="text-gold-400" />;
            case 'premium_member': return <FaGem className="text-purple-400" />;
            default: return <FaMedal className="text-gray-400" />;
        }
    };

    const getAchievementTitle = (achievement: string) => {
        switch (achievement) {
            case 'first_read': return 'First Reader';
            case 'first_like': return 'First Like';
            case 'first_comment': return 'First Comment';
            case 'reading_streak': return 'Reading Streak';
            case 'bookmark_master': return 'Bookmark Master';
            case 'social_butterfly': return 'Social Butterfly';
            case 'top_reader': return 'Top Reader';
            case 'premium_member': return 'Premium Member';
            default: return 'Achievement';
        }
    };

    const getAchievementDescription = (achievement: string) => {
        switch (achievement) {
            case 'first_read': return 'Read your first manga chapter';
            case 'first_like': return 'Liked your first content';
            case 'first_comment': return 'Posted your first comment';
            case 'reading_streak': return 'Maintained a 7-day reading streak';
            case 'bookmark_master': return 'Bookmarked 50+ chapters';
            case 'social_butterfly': return 'Followed 10+ users';
            case 'top_reader': return 'Read 100+ chapters';
            case 'premium_member': return 'Became a premium member';
            default: return 'Achievement unlocked!';
        }
    };

    // Loading state
    if (loading) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-gray-900 rounded-2xl shadow-xl overflow-hidden"
            >
                <div className="bg-gradient-to-r from-blue-900 to-purple-900 p-6">
                    <div className="animate-pulse">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-20 h-20 rounded-full bg-gray-700"></div>
                            <div className="flex-1">
                                <div className="h-6 bg-gray-700 rounded mb-2"></div>
                                <div className="h-4 bg-gray-700 rounded w-2/3"></div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="h-16 bg-gray-700"></div>
                            ))}
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    }

    // Error state
    if (error && !user) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-900 rounded-2xl shadow-xl text-center p-8"
            >
                <div className="text-4xl mb-4">👤</div>
                <h3 className="text-xl font-bold mb-2 text-red-400">Loading Profile</h3>
                <p className="text-gray-400 mb-4">{error}</p>
                <button
                    onClick={fetchUserProfile}
                    className="px-6 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors"
                >
                    Try Again
                </button>
            </motion.div>
        );
    }

    // User not found state
    if (!user) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-900 rounded-2xl shadow-xl text-center p-8"
            >
                <div className="text-4xl mb-4">👤</div>
                <h3 className="text-xl font-bold mb-2">User Not Found</h3>
                <p className="text-gray-400">This user profile doesn't exist or has been removed.</p>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-900 rounded-2xl shadow-xl overflow-hidden"
        >
            {/* Success/Error Messages */}
            <AnimatePresence>
                {success && (
                    <motion.div
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -50 }}
                        className="fixed top-4 right-4 bg-green-600 text-white px-4 rounded-lg shadow-lg z-50 flex items-center gap-2"
                    >
                        <FaCheckCircle />
                        {success}
                        <button
                            onClick={() => setSuccess(null)}
                            className="ml-2 hover:text-green-200"
                        >
                            <FaTimes />
                        </button>
                    </motion.div>
                )}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -50 }}
                        className="fixed top-4 right-4 bg-red-600 text-white px-4 rounded-lg shadow-lg z-50 flex items-center gap-2"
                    >
                        <FaExclamationTriangle />
                        {error}
                        <button
                            onClick={() => setError(null)}
                            className="ml-2 hover:text-red-200"
                        >
                            <FaTimes />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Profile Header */}
            <div className="bg-gradient-to-r from-blue-900 to-purple-900 p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="relative">
                        <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center text-2xl font-bold text-white border-4 border-white/20 overflow-hidden">
                            {user.avatarUrl ? (
                                <OptimizedImage src={user.avatarUrl} alt="avatar" width={80} height={80} className="w-full h-full object-cover rounded-full" fallbackSrc="/file.svg" />
                            ) : (
                                <OptimizedImage src="/file.svg" alt="avatar" width={80} height={80} className="w-full h-full object-cover rounded-full" />
                            )}
                        </div>
                        <div className="absolute -bottom-1 -right-1">
                            {getUserRoleIcon(user.role, user.verified)}
                        </div>
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h2 className="text-xl sm:text-2xl font-bold text-white truncate">{user.nickname}</h2>
                            {user.verified && <FaStar className="text-yellow-400 ex-shrink-0" title="Verified" />}
                        </div>
                        <p className="text-blue-200 text-sm sm:text-base">
                            {user.role === 'admin' ? 'Administrator' :
                                user.role === 'creator' ? 'Content Creator' : 'Reader'}
                        </p>
                        {user.bio && (
                            <p className="text-gray-300 text-sm mt-1 line-clamp-2">{user.bio}</p>
                        )}
                    </div>

                    <div className="flex gap-2 flex-wrap">
                        {currentUser && currentUser._id !== userId && (
                            <button
                                onClick={handleFollow}
                                disabled={followLoading}
                                className={`px-4 sm:px-6 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 ${isFollowing
                                    ? 'bg-gray-600 hover:bg-gray-500 text-white'
                                    : 'bg-blue-600 hover:bg-blue-500 text-white'
                                    } ${followLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {followLoading ? (
                                    <FaSpinner className="animate-spin" />
                                ) : (
                                    <FaHeart className={isFollowing ? 'text-red-400 text-white' : ''} />
                                )}
                                {followLoading ? 'Updating...' : (isFollowing ? 'Following' : 'Follow')}
                            </button>
                        )}

                        {currentUser && currentUser._id === userId && (
                            <Link
                                href="/profile/edit"
                                className="px-4 sm:px-6 bg-gray-600 hover:bg-gray-500 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                            >
                                <FaEdit /> Edit Profile
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            {stats && (
                <div className="p-6 border-b border-gray-800">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-400">{stats.totalReads}</div>
                            <div className="text-sm text-gray-400">Chapters Read</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-pink-400">{stats.totalLikes}</div>
                            <div className="text-sm text-gray-400">Likes Given</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-yellow-400">{stats.totalComments}</div>
                            <div className="text-sm text-gray-400">Comments</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-purple-400">{stats.totalBookmarks}</div>
                            <div className="text-sm text-gray-400">Bookmarks</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation Tabs */}
            <div className="flex border-b border-gray-800 overflow-x-auto">
                {[
                    { id: 'overview', label: 'Overview', icon: FaUser },
                    { id: 'activity', label: 'Activity', icon: FaEye },
                    { id: 'achievements', label: 'Achievements', icon: FaTrophy },
                    { id: 'social', label: 'Social', icon: FaUsers }
                ].map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        onClick={() => setActiveTab(id as any)}
                        className={`flex items-center gap-2 px-4 sm:px-6 py-3 transition-colors whitespace-nowrap ${activeTab === id
                            ? 'text-blue-400 border-b-2 border-blue-400'
                            : 'text-gray-400 hover:text-gray-300'
                            }`}
                    >
                        <Icon className="text-sm" />
                        {label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="p-6">
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {/* Reading Streak */}
                        {stats && stats.readingStreak > 0 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-gradient-to-r from-orange-900 to-red-900 rounded-lg p-4"
                            >
                                <div className="flex items-center gap-3">
                                    <FaFire className="text-2xl text-orange-400" />
                                    <div>
                                        <div className="text-xl font-bold text-white">
                                            {stats.readingStreak} Day Reading Streak! 🔥
                                        </div>
                                        <div className="text-orange-200 text-sm">
                                            Keep up the great reading habit!
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Recent Achievements */}
                        {stats && stats.achievements.length > 0 && (
                            <div>
                                <h3 className="text-lg font-bold mb-3 text-white">Recent Achievements</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {stats.achievements.slice(0, 4).map((achievement, index) => (
                                        <motion.div
                                            key={achievement}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className="bg-gray-800 rounded-lg p-3 flex items-center gap-3 hover:bg-gray-750 transition-colors"
                                        >
                                            <div className="text-2xl">
                                                {getAchievementIcon(achievement)}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-white">
                                                    {getAchievementTitle(achievement)}
                                                </div>
                                                <div className="text-sm text-gray-400">
                                                    {getAchievementDescription(achievement)}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Social Stats */}
                        {stats && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-800 rounded-lg p-4 text-center hover:bg-gray-750 transition-colors">
                                    <div className="text-2xl font-bold text-blue-400">{stats.followers}</div>
                                    <div className="text-sm text-gray-400">Followers</div>
                                </div>
                                <div className="bg-gray-800 rounded-lg p-4 text-center hover:bg-gray-750 transition-colors">
                                    <div className="text-2xl font-bold text-green-400">{stats.following}</div>
                                    <div className="text-sm text-gray-400">Following</div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'activity' && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold mb-3 text-white">Recent Activity</h3>
                        {stats && stats.recentActivity.length > 0 ? (
                            <div className="space-y-3">
                                {stats.recentActivity.map((activity, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="text-blue-400">
                                                {activity.type === 'read' && <FaEye />}
                                                {activity.type === 'like' && <FaHeart />}
                                                {activity.type === 'comment' && <FaStar />}
                                                {activity.type === 'bookmark' && <FaBookmark />}
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-white">{activity.description}</div>
                                                <div className="text-sm text-gray-400">
                                                    {new Date(activity.timestamp).toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <div className="text-4xl mb-2">📚</div>
                                <p className="text-gray-400">No recent activity</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'achievements' && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold mb-3 text-white">All Achievements</h3>
                        {stats && stats.achievements.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {stats.achievements.map((achievement, index) => (
                                    <motion.div
                                        key={achievement}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="bg-gray-800 rounded-lg p-4 flex items-center gap-4 hover:bg-gray-750 transition-colors"
                                    >
                                        <div className="text-3xl">
                                            {getAchievementIcon(achievement)}
                                        </div>
                                        <div>
                                            <div className="font-bold text-white">
                                                {getAchievementTitle(achievement)}
                                            </div>
                                            <div className="text-sm text-gray-400">
                                                {getAchievementDescription(achievement)}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <div className="text-4xl mb-2">🏆</div>
                                <p className="text-gray-400">No achievements yet</p>
                                <p className="text-sm text-gray-500">Start reading and engaging to earn achievements!</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'social' && (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-bold mb-3 text-white">Followers ({stats?.followers || 0})</h3>
                            {followersLoading ? (
                                <div className="flex justify-center py-8">
                                    <FaSpinner className="animate-spin text-2xl text-blue-400" />
                                </div>
                            ) : followers.length === 0 ? (
                                <div className="text-center py-4">
                                    <p className="text-gray-400">No followers yet</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {followers.map((follower, index) => (
                                        <motion.div
                                            key={follower._id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="bg-gray-800 rounded-lg p-3 flex items-center gap-3 hover:bg-gray-750 transition-colors"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-blue-900 flex items-center justify-center text-sm font-bold flex-shrink-0">
                                                {follower.avatarUrl ? (
                                                    <OptimizedImage src={follower.avatarUrl} alt="avatar" width={80} height={80} className="w-full h-full object-cover rounded-full" fallbackSrc="/file.svg" />
                                                ) : (
                                                    <OptimizedImage src="/file.svg" alt="avatar" width={80} height={80} className="w-full h-full object-cover rounded-full" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-semibold text-white truncate">{follower.nickname}</div>
                                                <div className="text-sm text-gray-400">{follower.role}</div>
                                            </div>
                                            <Link
                                                href={`/users/${follower._id}`}
                                                className="px-3 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm transition-colors flex-shrink-0"
                                            >
                                                View
                                            </Link>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div>
                            <h3 className="text-lg font-bold mb-3 text-white">Following ({stats?.following || 0})</h3>
                            {followingLoading ? (
                                <div className="flex justify-center py-8">
                                    <FaSpinner className="animate-spin text-2xl text-green-400" />
                                </div>
                            ) : following.length === 0 ? (
                                <div className="text-center py-4">
                                    <p className="text-gray-400">Not following anyone yet</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {following.map((followed, index) => (
                                        <motion.div
                                            key={followed._id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="bg-gray-800 rounded-lg p-3 flex items-center gap-3 hover:bg-gray-750 transition-colors"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-green-900 flex items-center justify-center text-sm font-bold flex-shrink-0">
                                                {followed.avatarUrl ? (
                                                    <OptimizedImage src={followed.avatarUrl} alt="avatar" width={80} height={80} className="w-full h-full object-cover rounded-full" fallbackSrc="/file.svg" />
                                                ) : (
                                                    <OptimizedImage src="/file.svg" alt="avatar" width={80} height={80} className="w-full h-full object-cover rounded-full" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-semibold text-white truncate">{followed.nickname}</div>
                                                <div className="text-sm text-gray-400">{followed.role}</div>
                                            </div>
                                            <Link
                                                href={`/users/${followed._id}`}
                                                className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white rounded text-sm transition-colors flex-shrink-0"
                                            >
                                                View
                                            </Link>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
} 