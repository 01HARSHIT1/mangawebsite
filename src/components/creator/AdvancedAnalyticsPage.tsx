'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    FaChartLine, FaDownload, FaCalendar, FaFilter, FaEye,
    FaUsers, FaClock, FaHeart, FaTrendingUp, FaBookOpen
} from 'react-icons/fa';
import DashboardLayout from './DashboardLayout';

export default function AdvancedAnalyticsPage() {
    const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
    const [selectedSeries, setSelectedSeries] = useState<string>('all');
    const [analytics, setAnalytics] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [series, setSeries] = useState<any[]>([]);

    useEffect(() => {
        fetchAnalytics();
        fetchSeries();
    }, [dateRange, selectedSeries]);

    const fetchSeries = async () => {
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const response = await fetch('/api/creator/dashboard', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setSeries(data.recentManga || []);
            }
        } catch (error) {
            console.error('Error fetching series:', error);
        }
    };

    const fetchAnalytics = async () => {
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const url = selectedSeries === 'all' 
                ? `/api/creator-analytics?range=${dateRange}`
                : `/api/creator-analytics?range=${dateRange}&seriesId=${selectedSeries}`;
            
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                setAnalytics(data);
            }
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExportCSV = () => {
        if (!analytics) return;

        const csvData = [
            ['Metric', 'Value'],
            ['Total Views', analytics.totalViews || 0],
            ['Total Likes', analytics.totalLikes || 0],
            ['Total Chapters', analytics.totalChapters || 0],
            ['Avg Read Time', `${analytics.avgReadTime || 0} minutes`],
            ['Date Range', dateRange]
        ];

        const csvContent = csvData.map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${dateRange}-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                        <p className="text-gray-400">Loading analytics...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    const metrics = [
        { label: 'Total Views', value: analytics?.totalViews || 0, icon: FaEye, color: 'text-blue-400', change: '+12%' },
        { label: 'Unique Readers', value: analytics?.uniqueReaders || 0, icon: FaUsers, color: 'text-green-400', change: '+8%' },
        { label: 'Avg Read Time', value: `${analytics?.avgReadTime || 0}m`, icon: FaClock, color: 'text-purple-400', change: '+5%' },
        { label: 'Total Likes', value: analytics?.totalLikes || 0, icon: FaHeart, color: 'text-pink-400', change: '+15%' }
    ];

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Advanced Analytics</h1>
                        <p className="text-gray-400">Detailed performance insights and metrics</p>
                    </div>

                    <button
                        onClick={handleExportCSV}
                        className="mt-4 md:mt-0 flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                    >
                        <FaDownload />
                        <span>Export CSV</span>
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Date Range */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-400 mb-2">
                                <FaCalendar className="inline mr-2" />
                                Date Range
                            </label>
                            <select
                                value={dateRange}
                                onChange={(e) => setDateRange(e.target.value as any)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                            >
                                <option value="7d">Last 7 Days</option>
                                <option value="30d">Last 30 Days</option>
                                <option value="90d">Last 90 Days</option>
                                <option value="all">All Time</option>
                            </select>
                        </div>

                        {/* Series Filter */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-400 mb-2">
                                <FaFilter className="inline mr-2" />
                                Filter by Series
                            </label>
                            <select
                                value={selectedSeries}
                                onChange={(e) => setSelectedSeries(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                            >
                                <option value="all">All Series</option>
                                {series.map((s) => (
                                    <option key={s._id} value={s._id}>{s.title}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {metrics.map((metric, index) => {
                        const Icon = metric.icon;
                        return (
                            <motion.div
                                key={metric.label}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <Icon className={`text-3xl ${metric.color}`} />
                                    <span className="text-sm font-semibold text-green-400">{metric.change}</span>
                                </div>
                                <h3 className="text-sm font-semibold text-gray-400 mb-1">{metric.label}</h3>
                                <p className="text-3xl font-bold text-white">{typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}</p>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Charts Placeholder */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                            <FaTrendingUp className="mr-3 text-blue-400" />
                            Views Over Time
                        </h3>
                        <div className="h-64 flex items-center justify-center bg-slate-900/50 rounded-xl">
                            <div className="text-center">
                                <FaChartLine className="text-6xl text-gray-600 mx-auto mb-4" />
                                <p className="text-gray-400">Chart visualization coming soon</p>
                                <p className="text-sm text-gray-500 mt-2">Will show daily/weekly trends</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                            <FaBookOpen className="mr-3 text-purple-400" />
                            Chapter Performance
                        </h3>
                        <div className="h-64 flex items-center justify-center bg-slate-900/50 rounded-xl">
                            <div className="text-center">
                                <FaChartLine className="text-6xl text-gray-600 mx-auto mb-4" />
                                <p className="text-gray-400">Chart visualization coming soon</p>
                                <p className="text-sm text-gray-500 mt-2">Will show per-chapter metrics</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Top Chapters */}
                <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                    <h3 className="text-lg font-bold text-white mb-4">Top Performing Chapters</h3>
                    <div className="space-y-3">
                        {analytics?.topChapters?.slice(0, 5).map((chapter: any, index: number) => (
                            <div
                                key={chapter._id}
                                className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl"
                            >
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg font-bold text-white text-sm">
                                        #{index + 1}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-white">{chapter.title}</p>
                                        <p className="text-sm text-gray-400">Chapter {chapter.chapterNumber}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold text-blue-400">{chapter.views?.toLocaleString() || 0}</p>
                                    <p className="text-xs text-gray-500">views</p>
                                </div>
                            </div>
                        )) || (
                            <div className="text-center py-8 text-gray-400">
                                No chapter data available yet
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

