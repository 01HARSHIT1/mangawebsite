'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaChartLine, FaChartBar, FaUsers, FaEye, FaClock } from 'react-icons/fa';

interface AnalyticsData {
    views: Array<{ date: string; count: number }>;
    watchTime: Array<{ date: string; minutes: number }>;
    users: Array<{ date: string; count: number }>;
    topEpisodes: Array<{ episodeId: string; title: string; views: number }>;
    deviceBreakdown: Array<{ device: string; percentage: number }>;
    qualityBreakdown: Array<{ quality: string; percentage: number }>;
}

interface Props {
    seriesId?: string;
    timeRange: '7d' | '30d' | '90d';
}

export default function AnimeAnalyticsCharts({ seriesId, timeRange }: Props) {
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, [seriesId, timeRange]);

    const fetchAnalytics = async () => {
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const url = seriesId
                ? `/api/anime/analytics/events?seriesId=${seriesId}&startDate=${getStartDate(timeRange)}`
                : `/api/anime/analytics/events?startDate=${getStartDate(timeRange)}`;

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                // Transform data for charts
                setAnalytics(transformAnalyticsData(data));
            }
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStartDate = (range: '7d' | '30d' | '90d'): string => {
        const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
        const date = new Date();
        date.setDate(date.getDate() - days);
        return date.toISOString();
    };

    const transformAnalyticsData = (data: any): AnalyticsData => {
        // Group events by date
        const viewsByDate = new Map<string, number>();
        const watchTimeByDate = new Map<string, number>();
        const usersByDate = new Map<string, Set<string>>();

        data.events?.forEach((event: any) => {
            const date = new Date(event.timestamp).toISOString().split('T')[0];
            
            if (event.eventType === 'play') {
                viewsByDate.set(date, (viewsByDate.get(date) || 0) + 1);
            }
            
            if (event.position) {
                watchTimeByDate.set(date, (watchTimeByDate.get(date) || 0) + (event.position / 60));
            }
            
            if (event.userId) {
                if (!usersByDate.has(date)) {
                    usersByDate.set(date, new Set());
                }
                usersByDate.get(date)!.add(event.userId);
            }
        });

        return {
            views: Array.from(viewsByDate.entries()).map(([date, count]) => ({ date, count })),
            watchTime: Array.from(watchTimeByDate.entries()).map(([date, minutes]) => ({ date, minutes })),
            users: Array.from(usersByDate.entries()).map(([date, set]) => ({ date, count: set.size })),
            topEpisodes: [], // Would need episode data
            deviceBreakdown: calculateBreakdown(data.events, 'device'),
            qualityBreakdown: calculateBreakdown(data.events, 'quality')
        };
    };

    const calculateBreakdown = (events: any[], field: string): Array<{ [key: string]: string | number }> => {
        const counts = new Map<string, number>();
        events?.forEach((event: any) => {
            const value = event[field] || 'unknown';
            counts.set(value, (counts.get(value) || 0) + 1);
        });

        const total = Array.from(counts.values()).reduce((sum, count) => sum + count, 0);
        return Array.from(counts.entries()).map(([key, count]) => ({
            [field === 'device' ? 'device' : 'quality']: key,
            percentage: total > 0 ? (count / total) * 100 : 0
        }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    if (!analytics) {
        return (
            <div className="text-center p-8 text-gray-400">
                <FaChartLine className="text-4xl mx-auto mb-4 opacity-50" />
                <p>No analytics data available</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Views Chart */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-900/50 rounded-xl p-6 border border-gray-800"
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                        <FaEye className="text-orange-400" />
                        <h3 className="text-lg font-semibold text-white">Views Over Time</h3>
                    </div>
                </div>
                <div className="h-48 flex items-end space-x-1">
                    {analytics.views.map((item, index) => {
                        const maxViews = Math.max(...analytics.views.map(v => v.count), 1);
                        const height = (item.count / maxViews) * 100;
                        return (
                            <div key={index} className="flex-1 flex flex-col items-center">
                                <div
                                    className="w-full bg-gradient-to-t from-orange-500 to-red-500 rounded-t transition-all hover:opacity-80"
                                    style={{ height: `${height}%` }}
                                    title={`${item.date}: ${item.count} views`}
                                />
                                <span className="text-xs text-gray-500 mt-1 transform -rotate-45 origin-top-left">
                                    {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </motion.div>

            {/* Watch Time Chart */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gray-900/50 rounded-xl p-6 border border-gray-800"
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                        <FaClock className="text-orange-400" />
                        <h3 className="text-lg font-semibold text-white">Watch Time (Minutes)</h3>
                    </div>
                </div>
                <div className="h-48 flex items-end space-x-1">
                    {analytics.watchTime.map((item, index) => {
                        const maxMinutes = Math.max(...analytics.watchTime.map(w => w.minutes), 1);
                        const height = (item.minutes / maxMinutes) * 100;
                        return (
                            <div key={index} className="flex-1 flex flex-col items-center">
                                <div
                                    className="w-full bg-gradient-to-t from-blue-500 to-purple-500 rounded-t transition-all hover:opacity-80"
                                    style={{ height: `${height}%` }}
                                    title={`${item.date}: ${Math.round(item.minutes)} minutes`}
                                />
                            </div>
                        );
                    })}
                </div>
            </motion.div>

            {/* Device & Quality Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gray-900/50 rounded-xl p-6 border border-gray-800"
                >
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                        <FaUsers className="text-orange-400" />
                        <span>Device Breakdown</span>
                    </h3>
                    <div className="space-y-3">
                        {analytics.deviceBreakdown.map((item, index) => (
                            <div key={index} className="flex items-center justify-between">
                                <span className="text-gray-400 capitalize">{item.device}</span>
                                <div className="flex items-center space-x-2 flex-1 mx-4">
                                    <div className="flex-1 bg-gray-800 rounded-full h-2">
                                        <div
                                            className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full"
                                            style={{ width: `${item.percentage}%` }}
                                        />
                                    </div>
                                    <span className="text-white text-sm font-semibold w-12 text-right">
                                        {item.percentage.toFixed(1)}%
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gray-900/50 rounded-xl p-6 border border-gray-800"
                >
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                        <FaChartBar className="text-orange-400" />
                        <span>Quality Breakdown</span>
                    </h3>
                    <div className="space-y-3">
                        {analytics.qualityBreakdown.map((item, index) => (
                            <div key={index} className="flex items-center justify-between">
                                <span className="text-gray-400 uppercase">{item.quality}</span>
                                <div className="flex items-center space-x-2 flex-1 mx-4">
                                    <div className="flex-1 bg-gray-800 rounded-full h-2">
                                        <div
                                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                                            style={{ width: `${item.percentage}%` }}
                                        />
                                    </div>
                                    <span className="text-white text-sm font-semibold w-12 text-right">
                                        {item.percentage.toFixed(1)}%
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

