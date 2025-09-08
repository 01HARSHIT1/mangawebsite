'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { getAuthToken, getAuthHeaders } from '@/lib/token';

interface AnalyticsData {
    totalSeries: number;
    totalEpisodes: number;
    totalPages: number;
    totalViews: number;
    totalLikes: number;
    MAU: number;
    MPU: number;
    payingRatio: number;
    viewsOverTime: { [date: string]: number };
    episodeViews: Array<{
        _id: string;
        title: string;
        chapterNumber: number;
        views: number;
        likes: number;
        comments: number;
        avgTimeSpent: number;
        completionRate: number;
        avgRating: number;
    }>;
    seriesEngagement: Array<{
        _id: string;
        title: string;
        totalViews: number;
        totalLikes: number;
        episodeCount: number;
        avgRating: number;
    }>;
    recentReads: Array<{
        user: string;
        series: string;
        episode: string;
        timestamp: string;
    }>;
}

export default function CreatorAnalytics() {
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Don't fetch analytics if not authenticated or not a creator/admin
        if (!isAuthenticated || !user || (user.role !== 'creator' && user.role !== 'admin')) {
            if (!isAuthenticated) {
                router.push('/login');
            } else if (user && user.role !== 'creator' && user.role !== 'admin') {
                router.push('/');
            }
            return;
        }

        // Only fetch analytics if user is properly authenticated and authorized
        fetchAnalytics();
    }, [isAuthenticated, user, router]);

    const fetchAnalytics = async () => {
        // Double-check authentication before making API call
        if (!isAuthenticated || !user || (user.role !== 'creator' && user.role !== 'admin')) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const token = getAuthToken();

            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch('/api/creator-analytics', {
                headers: getAuthHeaders(),
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Authentication failed. Please log in again.');
                } else if (response.status === 403) {
                    throw new Error('Access denied. Creator role required.');
                } else {
                    throw new Error(`Failed to fetch analytics: ${response.status}`);
                }
            }

            const data = await response.json();

            // Check if user has no content (empty analytics)
            if (data.totalSeries === 0 && data.totalEpisodes === 0) {
                // User is authenticated but has no content - show no content design
                setAnalytics(null);
            } else {
                setAnalytics(data);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An error occurred';

            // If it's an authentication error, show no content design instead of error
            if (errorMessage.includes('Authentication failed') || errorMessage.includes('No authentication token found')) {
                setAnalytics(null); // Show no content design
            } else {
                setError(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    // Show loading or redirect if not authenticated
    if (loading || !isAuthenticated || !user || (user.role !== 'creator' && user.role !== 'admin')) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
                <div className="container mx-auto px-4 py-8">
                    <div className="flex items-center justify-center min-h-[400px]">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
                <div className="container mx-auto px-4 py-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                            Creator Analytics
                        </h1>
                        <p className="text-gray-300">Track your content performance and audience engagement</p>
                    </div>

                    {/* Error State Design */}
                    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 border border-white/20 max-w-md mx-auto">
                            {/* Error Icon */}
                            <div className="w-24 h-24 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>

                            {/* Error Title */}
                            <h2 className="text-2xl font-bold text-white mb-4">Unable to Load Analytics</h2>

                            {/* Error Description */}
                            <p className="text-gray-300 mb-6 leading-relaxed">
                                {error.includes('Authentication failed')
                                    ? 'Please log in again to view your analytics.'
                                    : error.includes('Access denied')
                                        ? 'You need creator permissions to view analytics.'
                                        : 'There was an issue loading your analytics data.'
                                }
                            </p>

                            {/* Action Buttons */}
                            <div className="space-y-3">
                                <button
                                    onClick={fetchAnalytics}
                                    className="inline-flex items-center justify-center w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Try Again
                                </button>

                                {error.includes('Authentication failed') && (
                                    <a
                                        href="/login"
                                        className="inline-flex items-center justify-center w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 border border-white/20"
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                        </svg>
                                        Go to Login
                                    </a>
                                )}

                                <a
                                    href="/creator/dashboard"
                                    className="inline-flex items-center justify-center w-full bg-white/5 hover:bg-white/10 text-gray-300 font-semibold py-3 px-6 rounded-lg transition-all duration-300 border border-white/10"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
                                    </svg>
                                    Back to Dashboard
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!analytics) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
                <div className="container mx-auto px-4 py-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                            Creator Analytics
                        </h1>
                        <p className="text-gray-300">Track your content performance and audience engagement</p>
                    </div>

                    {/* No Content Available Design */}
                    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 border border-white/20 max-w-md mx-auto">
                            {/* Icon */}
                            <div className="w-24 h-24 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-12 h-12 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>

                            {/* Title */}
                            <h2 className="text-2xl font-bold text-white mb-4">No Content Yet</h2>

                            {/* Description */}
                            <p className="text-gray-300 mb-6 leading-relaxed">
                                You haven't uploaded any manga or chapters yet. Once you start creating content,
                                your analytics will appear here to help you track performance and engagement.
                            </p>

                            {/* Action Buttons */}
                            <div className="space-y-3">
                                <a
                                    href="/upload"
                                    className="inline-flex items-center justify-center w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    Upload Your First Manga
                                </a>

                                <a
                                    href="/creator/dashboard"
                                    className="inline-flex items-center justify-center w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 border border-white/20"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
                                    </svg>
                                    Go to Dashboard
                                </a>
                            </div>
                        </div>

                        {/* Additional Info */}
                        <div className="mt-8 text-center">
                            <p className="text-gray-400 text-sm mb-4">What you'll see here once you have content:</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                    <div className="text-purple-400 font-semibold mb-1">📊 Performance Metrics</div>
                                    <div className="text-gray-300 text-sm">Views, likes, and engagement data</div>
                                </div>
                                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                    <div className="text-blue-400 font-semibold mb-1">👥 Audience Insights</div>
                                    <div className="text-gray-300 text-sm">Reader behavior and demographics</div>
                                </div>
                                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                    <div className="text-green-400 font-semibold mb-1">📈 Growth Tracking</div>
                                    <div className="text-gray-300 text-sm">Content performance over time</div>
                                </div>
                            </div>
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
                <div className="mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                        Creator Analytics
                    </h1>
                    <p className="text-gray-300">Track your content performance and audience engagement</p>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-300 text-sm">Total Series</p>
                                <p className="text-3xl font-bold text-purple-400">{analytics.totalSeries}</p>
                            </div>
                            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-300 text-sm">Total Episodes</p>
                                <p className="text-3xl font-bold text-blue-400">{analytics.totalEpisodes}</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-300 text-sm">Total Views</p>
                                <p className="text-3xl font-bold text-green-400">{analytics.totalViews.toLocaleString()}</p>
                            </div>
                            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-300 text-sm">Total Likes</p>
                                <p className="text-3xl font-bold text-pink-400">{analytics.totalLikes.toLocaleString()}</p>
                            </div>
                            <div className="w-12 h-12 bg-pink-500/20 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-pink-400" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Engagement Metrics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                        <h3 className="text-xl font-bold mb-4 text-purple-400">Monthly Active Users</h3>
                        <div className="text-4xl font-bold text-white mb-2">{analytics.MAU}</div>
                        <p className="text-gray-300 text-sm">Users who viewed your content this month</p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                        <h3 className="text-xl font-bold mb-4 text-blue-400">Paying Users</h3>
                        <div className="text-4xl font-bold text-white mb-2">{analytics.MPU}</div>
                        <p className="text-gray-300 text-sm">Users who made payments this month</p>
                    </div>
                </div>

                {/* Top Episodes */}
                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 mb-8">
                    <h3 className="text-2xl font-bold mb-6 text-purple-400">Top Performing Episodes</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/20">
                                    <th className="text-left py-3 px-4 text-gray-300">Episode</th>
                                    <th className="text-left py-3 px-4 text-gray-300">Views</th>
                                    <th className="text-left py-3 px-4 text-gray-300">Likes</th>
                                    <th className="text-left py-3 px-4 text-gray-300">Comments</th>
                                    <th className="text-left py-3 px-4 text-gray-300">Avg. Time</th>
                                    <th className="text-left py-3 px-4 text-gray-300">Completion</th>
                                    <th className="text-left py-3 px-4 text-gray-300">Rating</th>
                                </tr>
                            </thead>
                            <tbody>
                                {analytics.episodeViews.slice(0, 10).map((episode, index) => (
                                    <tr key={episode._id} className="border-b border-white/10 hover:bg-white/5">
                                        <td className="py-3 px-4">
                                            <div className="font-medium">{episode.title}</div>
                                            <div className="text-sm text-gray-400">Chapter {episode.chapterNumber}</div>
                                        </td>
                                        <td className="py-3 px-4 text-green-400 font-medium">{episode.views.toLocaleString()}</td>
                                        <td className="py-3 px-4 text-pink-400 font-medium">{episode.likes.toLocaleString()}</td>
                                        <td className="py-3 px-4 text-blue-400 font-medium">{episode.comments.toLocaleString()}</td>
                                        <td className="py-3 px-4 text-yellow-400 font-medium">{episode.avgTimeSpent}s</td>
                                        <td className="py-3 px-4 text-purple-400 font-medium">{episode.completionRate}%</td>
                                        <td className="py-3 px-4 text-orange-400 font-medium">{episode.avgRating.toFixed(1)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Series Engagement */}
                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 mb-8">
                    <h3 className="text-2xl font-bold mb-6 text-purple-400">Series Engagement</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {analytics.seriesEngagement.map((series) => (
                            <div key={series._id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                                <h4 className="font-bold text-lg mb-2">{series.title}</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-300">Views:</span>
                                        <span className="text-green-400 font-medium">{series.totalViews.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-300">Likes:</span>
                                        <span className="text-pink-400 font-medium">{series.totalLikes.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-300">Episodes:</span>
                                        <span className="text-blue-400 font-medium">{series.episodeCount}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-300">Rating:</span>
                                        <span className="text-orange-400 font-medium">{series.avgRating.toFixed(1)}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                    <h3 className="text-2xl font-bold mb-6 text-purple-400">Recent Reader Activity</h3>
                    <div className="space-y-3">
                        {analytics.recentReads.slice(0, 10).map((read, index) => (
                            <div key={index} className="flex items-center justify-between bg-white/5 rounded-lg p-3 border border-white/10">
                                <div>
                                    <div className="font-medium">{read.user}</div>
                                    <div className="text-sm text-gray-400">Read {read.episode} of {read.series}</div>
                                </div>
                                <div className="text-sm text-gray-400">
                                    {new Date(read.timestamp).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
