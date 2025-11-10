'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
    FaBookOpen, FaEye, FaHeart, FaDollarSign, 
    FaUsers, FaClock, FaChartLine, FaArrowUp, FaArrowDown,
    FaUpload, FaEdit, FaChartBar, FaQuestionCircle
} from 'react-icons/fa';

interface KPIData {
    currentBalance: number;
    views30d: number;
    viewsChange: number;
    newSubscribers7d: number;
    newSubscribers30d: number;
    revenue30d: number;
    revenueChange: number;
    totalManga: number;
    totalChapters: number;
    totalLikes: number;
    avgReadTime: number;
    topSeries: Array<{
        _id: string;
        title: string;
        views: number;
        revenue: number;
        coverImage: string;
    }>;
    pendingModeration: number;
}

export default function OverviewPage() {
    const [kpiData, setKpiData] = useState<KPIData | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

    useEffect(() => {
        fetchKPIData();
    }, [timeRange]);

    const fetchKPIData = async () => {
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const response = await fetch(`/api/creator/dashboard/overview?range=${timeRange}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setKpiData(data);
            }
        } catch (error) {
            console.error('Error fetching KPI data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    const kpiCards = [
        {
            title: 'Current Balance',
            value: `₹${kpiData?.currentBalance?.toLocaleString() || '0'}`,
            icon: FaDollarSign,
            color: 'from-green-500 to-emerald-600',
            bgColor: 'from-green-900/20 to-emerald-900/20',
            borderColor: 'border-green-500/20',
            description: 'Available for withdrawal',
            action: { label: 'Request Payout', href: '/creator/dashboard/earnings' }
        },
        {
            title: 'Views (30d)',
            value: kpiData?.views30d?.toLocaleString() || '0',
            icon: FaEye,
            color: 'from-blue-500 to-cyan-600',
            bgColor: 'from-blue-900/20 to-cyan-900/20',
            borderColor: 'border-blue-500/20',
            change: kpiData?.viewsChange || 0,
            description: 'Total page views'
        },
        {
            title: 'New Subscribers',
            value: kpiData?.newSubscribers30d?.toLocaleString() || '0',
            icon: FaUsers,
            color: 'from-purple-500 to-pink-600',
            bgColor: 'from-purple-900/20 to-pink-900/20',
            borderColor: 'border-purple-500/20',
            description: `${kpiData?.newSubscribers7d || 0} in last 7 days`,
        },
        {
            title: 'Revenue (30d)',
            value: `₹${kpiData?.revenue30d?.toLocaleString() || '0'}`,
            icon: FaChartLine,
            color: 'from-amber-500 to-orange-600',
            bgColor: 'from-amber-900/20 to-orange-900/20',
            borderColor: 'border-amber-500/20',
            change: kpiData?.revenueChange || 0,
            description: 'Total earnings'
        }
    ];

    const quickStats = [
        { label: 'Total Series', value: kpiData?.totalManga || 0, icon: FaBookOpen, color: 'text-blue-400' },
        { label: 'Total Chapters', value: kpiData?.totalChapters || 0, icon: FaEdit, color: 'text-green-400' },
        { label: 'Total Likes', value: kpiData?.totalLikes || 0, icon: FaHeart, color: 'text-pink-400' },
        { label: 'Avg Read Time', value: `${Math.round(kpiData?.avgReadTime || 0)}m`, icon: FaClock, color: 'text-purple-400' }
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Dashboard Overview</h1>
                    <p className="text-gray-400">Track your performance and manage your content</p>
                </div>

                {/* Time Range Selector */}
                <div className="flex items-center space-x-2 mt-4 md:mt-0">
                    {(['7d', '30d', '90d'] as const).map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                                timeRange === range
                                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                                    : 'bg-slate-800 text-gray-400 hover:text-white'
                            }`}
                        >
                            {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
                        </button>
                    ))}
                </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {kpiCards.map((card, index) => {
                    const IconComponent = card.icon;
                    const Icon =
                        typeof IconComponent === 'function'
                            ? IconComponent
                            : FaQuestionCircle;
                    return (
                        <motion.div
                            key={card.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`bg-gradient-to-br ${card.bgColor} rounded-2xl p-6 border ${card.borderColor} backdrop-blur-sm hover:scale-105 transition-transform duration-300`}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className={`p-3 bg-gradient-to-br ${card.color} rounded-xl shadow-lg`}>
                                    <Icon className="text-white text-xl" />
                                </div>
                                {card.change !== undefined && (
                                    <div className={`flex items-center space-x-1 text-sm font-semibold ${
                                        card.change >= 0 ? 'text-green-400' : 'text-red-400'
                                    }`}>
                                        {card.change >= 0 ? <FaArrowUp /> : <FaArrowDown />}
                                        <span>{Math.abs(card.change)}%</span>
                                    </div>
                                )}
                            </div>
                            <h3 className="text-sm font-semibold text-gray-400 mb-1">{card.title}</h3>
                            <p className="text-3xl font-bold text-white mb-2">{card.value}</p>
                            <p className="text-xs text-gray-500">{card.description}</p>
                            {card.action && (
                                <Link
                                    href={card.action.href}
                                    className="mt-4 inline-block text-sm font-semibold text-purple-400 hover:text-purple-300 transition-colors"
                                >
                                    {card.action.label} →
                                </Link>
                            )}
                        </motion.div>
                    );
                })}
            </div>

            {/* Quick Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {quickStats.map((stat, index) => {
                    const IconComponent = stat.icon;
                    const Icon =
                        typeof IconComponent === 'function'
                            ? IconComponent
                            : FaQuestionCircle;
                    return (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.4 + index * 0.05 }}
                            className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 backdrop-blur-sm"
                        >
                            <div className="flex items-center space-x-3">
                                <Icon className={`text-2xl ${stat.color}`} />
                                <div>
                                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                                    <p className="text-xs text-gray-400">{stat.label}</p>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Top Performing Series */}
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white flex items-center">
                        <FaChartLine className="mr-3 text-yellow-400" />
                        Top Performing Series
                    </h2>
                    <Link
                        href="/creator/dashboard/analytics"
                        className="text-sm font-semibold text-purple-400 hover:text-purple-300"
                    >
                        View All Analytics →
                    </Link>
                </div>

                {kpiData?.topSeries && kpiData.topSeries.length > 0 ? (
                    <div className="space-y-4">
                        {kpiData.topSeries.slice(0, 3).map((series, index) => (
                            <div
                                key={series._id}
                                className="flex items-center space-x-4 p-4 bg-slate-900/50 rounded-xl border border-slate-700/30 hover:border-purple-500/30 transition-all"
                            >
                                <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg font-bold text-white">
                                    #{index + 1}
                                </div>
                                <img
                                    src={series.coverImage || '/placeholder.svg'}
                                    alt={series.title}
                                    className="w-12 h-16 object-cover rounded-lg"
                                />
                                <div className="flex-1">
                                    <h3 className="font-semibold text-white">{series.title}</h3>
                                    <div className="flex items-center space-x-4 text-sm text-gray-400 mt-1">
                                        <span className="flex items-center">
                                            <FaEye className="mr-1" />
                                            {series.views.toLocaleString()}
                                        </span>
                                        <span className="flex items-center">
                                            <FaDollarSign className="mr-1" />
                                            ₹{series.revenue.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                                <Link
                                    href={`/creator/dashboard/series/${series._id}`}
                                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold transition-colors"
                                >
                                    View
                                </Link>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">📊</div>
                        <p className="text-gray-400">No series data yet. Upload content to see analytics!</p>
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Link
                    href="/creator/dashboard/upload"
                    className="group bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-2xl p-6 shadow-xl transition-all duration-300 hover:scale-105"
                >
                    <div className="flex items-center space-x-4">
                        <div className="p-4 bg-white/20 rounded-xl">
                            <FaUpload className="text-3xl text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white mb-1">Upload Content</h3>
                            <p className="text-blue-100 text-sm">Add new manga or chapters</p>
                        </div>
                    </div>
                </Link>

                <Link
                    href="/creator/dashboard/series"
                    className="group bg-gradient-to-br from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-2xl p-6 shadow-xl transition-all duration-300 hover:scale-105"
                >
                    <div className="flex items-center space-x-4">
                        <div className="p-4 bg-white/20 rounded-xl">
                            <FaBookOpen className="text-3xl text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white mb-1">Manage Series</h3>
                            <p className="text-emerald-100 text-sm">Edit your manga library</p>
                        </div>
                    </div>
                </Link>

                <Link
                    href="/creator/dashboard/analytics"
                    className="group bg-gradient-to-br from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 rounded-2xl p-6 shadow-xl transition-all duration-300 hover:scale-105"
                >
                    <div className="flex items-center space-x-4">
                        <div className="p-4 bg-white/20 rounded-xl">
                            <FaChartBar className="text-3xl text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white mb-1">View Analytics</h3>
                            <p className="text-amber-100 text-sm">Detailed performance data</p>
                        </div>
                    </div>
                </Link>
            </div>

            {/* Recent Activity */}
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 backdrop-blur-sm">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                    <FaClock className="mr-3 text-blue-400" />
                    Recent Activity
                </h2>
                <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl">
                        <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <p className="text-gray-300">New chapter published</p>
                        </div>
                        <p className="text-sm text-gray-500">2 hours ago</p>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl">
                        <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                            <p className="text-gray-300">Received 5 new comments</p>
                        </div>
                        <p className="text-sm text-gray-500">5 hours ago</p>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl">
                        <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                            <p className="text-gray-300">Revenue milestone reached: ₹1,000</p>
                        </div>
                        <p className="text-sm text-gray-500">1 day ago</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

