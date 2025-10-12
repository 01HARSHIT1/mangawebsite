'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FaBook, FaClock, FaStar, FaFire, FaCalendarAlt, FaTrophy, FaChartLine, FaEye, FaHeart, FaBookmark } from 'react-icons/fa';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface ReadingStats {
    totalMangaRead: number;
    totalChaptersRead: number;
    totalReadingTimeHours: number;
    averageRating: number;
    favoriteGenres: { genre: string; count: number; percentage: number }[];
    readingStreak: {
        current: number;
        longest: number;
        lastReadDate: string;
    };
    monthlyStats: {
        month: string;
        chaptersRead: number;
        timeSpent: number;
    }[];
    achievements: {
        id: string;
        title: string;
        description: string;
        icon: string;
        unlockedDate: string;
        rarity: 'common' | 'rare' | 'epic' | 'legendary';
    }[];
    recentActivity: {
        date: string;
        action: string;
        mangaTitle: string;
        chapterNumber?: number;
    }[];
}

export default function ReadingStatsPage() {
    const { isAuthenticated, user } = useAuth();
    const [stats, setStats] = useState<ReadingStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year' | 'all'>('month');

    useEffect(() => {
        if (!isAuthenticated) {
            setLoading(false);
            return;
        }
        loadReadingStats();
    }, [isAuthenticated, timeframe]);

    const loadReadingStats = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            if (!token) return;

            // Load user profile to get reading history
            const profileResponse = await fetch('/api/profile', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (profileResponse.ok) {
                const profileData = await profileResponse.json();
                const userData = profileData.user;

                // Process reading history to generate stats
                const processedStats = await generateStatsFromHistory(userData);
                setStats(processedStats);
            }
        } catch (error) {
            console.error('Failed to load reading stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const generateStatsFromHistory = async (userData: any): Promise<ReadingStats> => {
        const readingHistory = userData.readingHistory || [];
        const bookmarks = userData.bookmarks || [];

        // Calculate basic stats
        const uniqueManga = new Set(readingHistory.map((entry: any) => entry.mangaId));
        const totalMangaRead = uniqueManga.size;
        const totalChaptersRead = readingHistory.length;

        // Estimate reading time (assuming 5 minutes per chapter)
        const totalReadingTimeHours = Math.round((totalChaptersRead * 5) / 60);

        // Calculate reading streak
        const sortedHistory = [...readingHistory].sort((a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;
        let lastDate: Date | null = null;

        // Group by date and calculate streaks
        const dateGroups = new Map();
        sortedHistory.forEach(entry => {
            const date = new Date(entry.timestamp).toDateString();
            if (!dateGroups.has(date)) {
                dateGroups.set(date, true);
            }
        });

        const dates = Array.from(dateGroups.keys()).map(date => new Date(date)).sort((a, b) => b.getTime() - a.getTime());

        for (let i = 0; i < dates.length; i++) {
            const currentDate = dates[i];

            if (lastDate) {
                const daysDiff = Math.floor((lastDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
                if (daysDiff === 1) {
                    tempStreak++;
                } else {
                    if (i === 0) currentStreak = tempStreak;
                    longestStreak = Math.max(longestStreak, tempStreak);
                    tempStreak = 1;
                }
            } else {
                tempStreak = 1;
            }

            lastDate = currentDate;
        }

        currentStreak = tempStreak;
        longestStreak = Math.max(longestStreak, tempStreak);

        // Calculate favorite genres (mock data)
        const genreStats = [
            { genre: 'Action', count: Math.floor(totalChaptersRead * 0.3), percentage: 30 },
            { genre: 'Romance', count: Math.floor(totalChaptersRead * 0.25), percentage: 25 },
            { genre: 'Fantasy', count: Math.floor(totalChaptersRead * 0.2), percentage: 20 },
            { genre: 'Comedy', count: Math.floor(totalChaptersRead * 0.15), percentage: 15 },
            { genre: 'Drama', count: Math.floor(totalChaptersRead * 0.1), percentage: 10 }
        ];

        // Generate monthly stats
        const monthlyStats = generateMonthlyStats(readingHistory);

        // Generate achievements
        const achievements = generateAchievements(totalMangaRead, totalChaptersRead, currentStreak, longestStreak);

        // Generate recent activity
        const recentActivity = sortedHistory.slice(0, 10).map((entry: any) => ({
            date: entry.timestamp,
            action: 'Read chapter',
            mangaTitle: `Manga ${entry.mangaId}`, // You'd normally fetch the actual title
            chapterNumber: parseInt(entry.chapterId) || 1
        }));

        return {
            totalMangaRead,
            totalChaptersRead,
            totalReadingTimeHours,
            averageRating: 4.2, // Mock average
            favoriteGenres: genreStats,
            readingStreak: {
                current: currentStreak,
                longest: longestStreak,
                lastReadDate: sortedHistory[0]?.timestamp || new Date().toISOString()
            },
            monthlyStats,
            achievements,
            recentActivity
        };
    };

    const generateMonthlyStats = (readingHistory: any[]) => {
        const monthlyData = new Map();
        const now = new Date();

        // Initialize last 6 months
        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthKey = date.toISOString().slice(0, 7);
            monthlyData.set(monthKey, { chaptersRead: 0, timeSpent: 0 });
        }

        // Process reading history
        readingHistory.forEach(entry => {
            const monthKey = entry.timestamp.slice(0, 7);
            if (monthlyData.has(monthKey)) {
                const data = monthlyData.get(monthKey);
                data.chaptersRead++;
                data.timeSpent += 5; // 5 minutes per chapter
            }
        });

        return Array.from(monthlyData.entries()).map(([month, data]) => ({
            month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            chaptersRead: data.chaptersRead,
            timeSpent: Math.round(data.timeSpent / 60 * 10) / 10 // Convert to hours
        }));
    };

    const generateAchievements = (totalManga: number, totalChapters: number, currentStreak: number, longestStreak: number) => {
        const achievements = [];

        if (totalChapters >= 1) {
            achievements.push({
                id: 'first-chapter',
                title: 'First Steps',
                description: 'Read your first chapter',
                icon: '📖',
                unlockedDate: new Date().toISOString(),
                rarity: 'common' as const
            });
        }

        if (totalChapters >= 50) {
            achievements.push({
                id: 'chapter-milestone',
                title: 'Dedicated Reader',
                description: 'Read 50 chapters',
                icon: '🏅',
                unlockedDate: new Date().toISOString(),
                rarity: 'rare' as const
            });
        }

        if (totalManga >= 10) {
            achievements.push({
                id: 'explorer',
                title: 'Manga Explorer',
                description: 'Read 10 different manga',
                icon: '🗺️',
                unlockedDate: new Date().toISOString(),
                rarity: 'rare' as const
            });
        }

        if (currentStreak >= 7) {
            achievements.push({
                id: 'week-streak',
                title: 'Weekly Warrior',
                description: 'Read for 7 days in a row',
                icon: '🔥',
                unlockedDate: new Date().toISOString(),
                rarity: 'epic' as const
            });
        }

        if (longestStreak >= 30) {
            achievements.push({
                id: 'month-streak',
                title: 'Monthly Master',
                description: '30-day reading streak',
                icon: '👑',
                unlockedDate: new Date().toISOString(),
                rarity: 'legendary' as const
            });
        }

        return achievements;
    };

    const getRarityColor = (rarity: string) => {
        switch (rarity) {
            case 'common': return 'from-gray-400 to-gray-600';
            case 'rare': return 'from-blue-400 to-blue-600';
            case 'epic': return 'from-purple-400 to-purple-600';
            case 'legendary': return 'from-yellow-400 to-orange-600';
            default: return 'from-gray-400 to-gray-600';
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
                <div className="container mx-auto px-4 py-20 text-center">
                    <div className="max-w-md mx-auto">
                        <FaChartLine className="mx-auto text-6xl text-purple-400 mb-6" />
                        <h1 className="text-3xl font-bold mb-4">Statistics Access Required</h1>
                        <p className="text-gray-400 mb-8">
                            Please sign in to view your personal reading statistics and achievements.
                        </p>
                        <div className="space-x-4">
                            <Link
                                href="/login"
                                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                            >
                                Sign In
                            </Link>
                            <Link
                                href="/signup"
                                className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                            >
                                Sign Up
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">📊 Reading Statistics</h1>
                        <p className="text-gray-400">Your personal manga reading analytics and achievements</p>
                    </div>

                    <div className="flex bg-slate-800 rounded-lg p-1">
                        {['week', 'month', 'year', 'all'].map((period) => (
                            <button
                                key={period}
                                onClick={() => setTimeframe(period as any)}
                                className={`px-4 py-2 rounded capitalize text-sm transition-colors ${timeframe === period ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                {period}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
                    </div>
                ) : stats ? (
                    <div className="space-y-8">
                        {/* Overview Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/20 rounded-2xl p-6"
                            >
                                <div className="flex items-center space-x-4">
                                    <FaBook className="text-3xl text-blue-400" />
                                    <div>
                                        <h3 className="text-2xl font-bold">{stats.totalMangaRead}</h3>
                                        <p className="text-gray-400">Manga Read</p>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/20 rounded-2xl p-6"
                            >
                                <div className="flex items-center space-x-4">
                                    <FaEye className="text-3xl text-green-400" />
                                    <div>
                                        <h3 className="text-2xl font-bold">{stats.totalChaptersRead}</h3>
                                        <p className="text-gray-400">Chapters Read</p>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/20 rounded-2xl p-6"
                            >
                                <div className="flex items-center space-x-4">
                                    <FaClock className="text-3xl text-purple-400" />
                                    <div>
                                        <h3 className="text-2xl font-bold">{stats.totalReadingTimeHours}h</h3>
                                        <p className="text-gray-400">Time Spent</p>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 border border-orange-500/20 rounded-2xl p-6"
                            >
                                <div className="flex items-center space-x-4">
                                    <FaFire className="text-3xl text-orange-400" />
                                    <div>
                                        <h3 className="text-2xl font-bold">{stats.readingStreak.current}</h3>
                                        <p className="text-gray-400">Day Streak</p>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Charts and Detailed Stats */}
                        <div className="grid lg:grid-cols-2 gap-8">
                            {/* Favorite Genres */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="bg-slate-800/50 rounded-2xl p-6 border border-purple-500/20"
                            >
                                <h3 className="text-xl font-bold mb-6 flex items-center space-x-2">
                                    <FaHeart className="text-red-400" />
                                    <span>Favorite Genres</span>
                                </h3>
                                <div className="space-y-4">
                                    {stats.favoriteGenres.map((genre, index) => (
                                        <div key={genre.genre} className="space-y-2">
                                            <div className="flex justify-between">
                                                <span>{genre.genre}</span>
                                                <span className="text-gray-400">{genre.count} chapters</span>
                                            </div>
                                            <div className="w-full bg-gray-700 rounded-full h-2">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${genre.percentage}%` }}
                                                    transition={{ delay: 0.5 + index * 0.1 }}
                                                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>

                            {/* Monthly Reading Activity */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="bg-slate-800/50 rounded-2xl p-6 border border-purple-500/20"
                            >
                                <h3 className="text-xl font-bold mb-6 flex items-center space-x-2">
                                    <FaChartLine className="text-blue-400" />
                                    <span>Monthly Activity</span>
                                </h3>
                                <div className="space-y-4">
                                    {stats.monthlyStats.map((month, index) => (
                                        <div key={month.month} className="flex items-center justify-between">
                                            <span className="text-sm">{month.month}</span>
                                            <div className="flex items-center space-x-4">
                                                <div className="text-right">
                                                    <div className="text-sm font-semibold">{month.chaptersRead} ch</div>
                                                    <div className="text-xs text-gray-400">{month.timeSpent}h</div>
                                                </div>
                                                <div className="w-20 bg-gray-700 rounded-full h-2">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${Math.min(month.chaptersRead / 20 * 100, 100)}%` }}
                                                        transition={{ delay: 0.6 + index * 0.1 }}
                                                        className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        </div>

                        {/* Achievements */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="bg-slate-800/50 rounded-2xl p-6 border border-purple-500/20"
                        >
                            <h3 className="text-xl font-bold mb-6 flex items-center space-x-2">
                                <FaTrophy className="text-yellow-400" />
                                <span>Achievements</span>
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {stats.achievements.map((achievement, index) => (
                                    <motion.div
                                        key={achievement.id}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.7 + index * 0.1 }}
                                        className={`bg-gradient-to-br ${getRarityColor(achievement.rarity)} p-4 rounded-xl border border-white/20`}
                                    >
                                        <div className="text-center">
                                            <div className="text-3xl mb-2">{achievement.icon}</div>
                                            <h4 className="font-semibold mb-1">{achievement.title}</h4>
                                            <p className="text-xs text-white/80">{achievement.description}</p>
                                            <div className="text-xs text-white/60 mt-2 capitalize">
                                                {achievement.rarity}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Reading Streak */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7 }}
                            className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-2xl p-6"
                        >
                            <h3 className="text-xl font-bold mb-4 flex items-center space-x-2">
                                <FaFire className="text-orange-400" />
                                <span>Reading Streak</span>
                            </h3>
                            <div className="grid md:grid-cols-3 gap-6 text-center">
                                <div>
                                    <div className="text-3xl font-bold text-orange-400">{stats.readingStreak.current}</div>
                                    <div className="text-gray-400">Current Streak</div>
                                </div>
                                <div>
                                    <div className="text-3xl font-bold text-red-400">{stats.readingStreak.longest}</div>
                                    <div className="text-gray-400">Longest Streak</div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-300">
                                        Last read: {new Date(stats.readingStreak.lastReadDate).toLocaleDateString()}
                                    </div>
                                    <div className="text-gray-400">Keep it up!</div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <FaChartLine className="mx-auto text-6xl text-gray-600 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-400 mb-2">No Statistics Available</h3>
                        <p className="text-gray-500 mb-6">
                            Start reading manga to build your statistics!
                        </p>
                        <Link
                            href="/manga"
                            className="inline-flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                        >
                            <FaBook />
                            <span>Browse Manga</span>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}


