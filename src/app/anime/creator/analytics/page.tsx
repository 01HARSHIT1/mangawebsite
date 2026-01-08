'use client';

import { useState, useEffect } from 'react';
import AnimeDashboardLayout from '@/components/anime/creator/AnimeDashboardLayout';
import { FaEye, FaUsers, FaClock, FaChartLine, FaStar, FaHeart, FaComment, FaGlobe } from 'react-icons/fa';
import { motion } from 'framer-motion';

interface AnalyticsData {
    seriesId: string;
    title: string;
    coverImage: string;
    totalEpisodes: number;
    period: string;
    overview: {
        totalViews: number;
        uniqueViewers: number;
        totalWatchTime: number;
        averageWatchTime: number;
        completedViews: number;
        completionRate: number;
        likes: number;
        averageRating: number;
        ratingCount: number;
        commentCount: number;
    };
    episodeAnalytics: Array<{
        episodeId: string;
        episodeNumber: number;
        title: string;
        views: number;
        uniqueViewers: number;
        watchTime: number;
        completed: number;
        completionRate: number;
    }>;
    dailyAnalytics: Array<{ date: string; views: number }>;
    topRegions: Array<{ region: string; count: number }>;
}

export default function AnalyticsPage() {
    const [analytics, setAnalytics] = useState<AnalyticsData[]>([]);
    const [selectedSeries, setSelectedSeries] = useState<string | null>(null);
    const [period, setPeriod] = useState<'7' | '30' | '90' | 'all'>('30');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, [period, selectedSeries]);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const url = selectedSeries
                ? `/api/anime/creator/analytics?seriesId=${selectedSeries}&period=${period}`
                : `/api/anime/creator/analytics?period=${period}`;

            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setAnalytics(Array.isArray(data.analytics) ? data.analytics : [data.analytics]);
            }
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    };

    const selectedData = selectedSeries ? analytics.find(a => a.seriesId === selectedSeries) : analytics[0];

    return (
        <AnimeDashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Analytics</h1>
                        <p className="text-orange-400">View detailed analytics for your anime content</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <select
                            value={period}
                            onChange={(e) => setPeriod(e.target.value as any)}
                            className="bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white"
                        >
                            <option value="7">Last 7 days</option>
                            <option value="30">Last 30 days</option>
                            <option value="90">Last 90 days</option>
                            <option value="all">All time</option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                    </div>
                ) : selectedData ? (
                    <>
                        {/* Overview Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-gradient-to-br from-orange-900/50 to-red-900/50 rounded-xl p-6 border border-orange-500/30"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <FaEye className="text-orange-400 text-2xl" />
                                    <span className="text-sm text-gray-400">Views</span>
                                </div>
                                <div className="text-3xl font-bold text-white">{selectedData.overview.totalViews.toLocaleString()}</div>
                                <div className="text-sm text-gray-400 mt-1">{selectedData.overview.uniqueViewers} unique viewers</div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 rounded-xl p-6 border border-blue-500/30"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <FaClock className="text-blue-400 text-2xl" />
                                    <span className="text-sm text-gray-400">Watch Time</span>
                                </div>
                                <div className="text-3xl font-bold text-white">{formatTime(selectedData.overview.totalWatchTime)}</div>
                                <div className="text-sm text-gray-400 mt-1">Avg: {formatTime(selectedData.overview.averageWatchTime)}</div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-gradient-to-br from-green-900/50 to-emerald-900/50 rounded-xl p-6 border border-green-500/30"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <FaChartLine className="text-green-400 text-2xl" />
                                    <span className="text-sm text-gray-400">Completion</span>
                                </div>
                                <div className="text-3xl font-bold text-white">{selectedData.overview.completionRate.toFixed(1)}%</div>
                                <div className="text-sm text-gray-400 mt-1">{selectedData.overview.completedViews} completed</div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="bg-gradient-to-br from-yellow-900/50 to-orange-900/50 rounded-xl p-6 border border-yellow-500/30"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <FaStar className="text-yellow-400 text-2xl" />
                                    <span className="text-sm text-gray-400">Rating</span>
                                </div>
                                <div className="text-3xl font-bold text-white">{selectedData.overview.averageRating.toFixed(1)}</div>
                                <div className="text-sm text-gray-400 mt-1">{selectedData.overview.ratingCount} ratings</div>
                            </motion.div>
                        </div>

                        {/* Engagement Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
                                <div className="flex items-center gap-3 mb-2">
                                    <FaHeart className="text-red-400" />
                                    <span className="text-gray-400">Likes</span>
                                </div>
                                <div className="text-2xl font-bold text-white">{selectedData.overview.likes.toLocaleString()}</div>
                            </div>

                            <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
                                <div className="flex items-center gap-3 mb-2">
                                    <FaComment className="text-blue-400" />
                                    <span className="text-gray-400">Comments</span>
                                </div>
                                <div className="text-2xl font-bold text-white">{selectedData.overview.commentCount.toLocaleString()}</div>
                            </div>

                            <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
                                <div className="flex items-center gap-3 mb-2">
                                    <FaUsers className="text-purple-400" />
                                    <span className="text-gray-400">Unique Viewers</span>
                                </div>
                                <div className="text-2xl font-bold text-white">{selectedData.overview.uniqueViewers.toLocaleString()}</div>
                            </div>
                        </div>

                        {/* Daily Views Chart */}
                        {selectedData.dailyAnalytics.length > 0 && (
                            <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
                                <h3 className="text-xl font-bold text-white mb-4">Daily Views</h3>
                                <div className="h-64 flex items-end space-x-1">
                                    {selectedData.dailyAnalytics.map((item, index) => {
                                        const maxViews = Math.max(...selectedData.dailyAnalytics.map(d => d.views), 1);
                                        const height = (item.views / maxViews) * 100;
                                        return (
                                            <div key={index} className="flex-1 flex flex-col items-center">
                                                <div
                                                    className="w-full bg-gradient-to-t from-orange-500 to-red-500 rounded-t transition-all hover:opacity-80 cursor-pointer"
                                                    style={{ height: `${height}%` }}
                                                    title={`${item.date}: ${item.views} views`}
                                                />
                                                <span className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-top-left whitespace-nowrap">
                                                    {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Top Episodes */}
                        {selectedData.episodeAnalytics.length > 0 && (
                            <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
                                <h3 className="text-xl font-bold text-white mb-4">Episode Performance</h3>
                                <div className="space-y-3">
                                    {selectedData.episodeAnalytics
                                        .sort((a, b) => b.views - a.views)
                                        .slice(0, 10)
                                        .map((episode) => (
                                            <div key={episode.episodeId} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                                                <div>
                                                    <div className="font-semibold text-white">
                                                        Episode {episode.episodeNumber}: {episode.title}
                                                    </div>
                                                    <div className="text-sm text-gray-400">
                                                        {episode.views} views • {episode.uniqueViewers} unique • {formatTime(episode.watchTime)} watch time
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-lg font-bold text-orange-400">{episode.completionRate.toFixed(1)}%</div>
                                                    <div className="text-xs text-gray-400">completion</div>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}

                        {/* Top Regions */}
                        {selectedData.topRegions.length > 0 && (
                            <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                    <FaGlobe className="text-orange-400" />
                                    Top Regions
                                </h3>
                                <div className="space-y-2">
                                    {selectedData.topRegions.map((region, index) => (
                                        <div key={index} className="flex items-center justify-between">
                                            <span className="text-gray-300">{region.region}</span>
                                            <div className="flex items-center gap-3 flex-1 mx-4">
                                                <div className="flex-1 bg-gray-800 rounded-full h-2">
                                                    <div
                                                        className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full"
                                                        style={{ width: `${(region.count / selectedData.topRegions[0].count) * 100}%` }}
                                                    />
                                                </div>
                                                <span className="text-white font-semibold w-16 text-right">{region.count.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="bg-gray-900/50 rounded-2xl p-8 border border-orange-500/20 text-center">
                        <p className="text-gray-400">No analytics data available. Upload some anime to see analytics!</p>
                    </div>
                )}
            </div>
        </AnimeDashboardLayout>
    );
}

