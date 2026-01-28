'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
    FaPlay, FaEye, FaHeart, FaDollarSign, 
    FaUsers, FaClock, FaChartLine, FaArrowUp, FaArrowDown,
    FaUpload, FaEdit, FaChartBar, FaQuestionCircle
} from 'react-icons/fa';
import AnimeDashboardLayout from './AnimeDashboardLayout';

interface KPIData {
    currentBalance: number;
    views30d: number;
    viewsChange: number;
    newSubscribers7d: number;
    newSubscribers30d: number;
    revenue30d: number;
    revenueChange: number;
    totalAnime: number;
    totalEpisodes: number;
    totalLikes: number;
    avgWatchTime: number;
    topSeries: Array<{
        _id: string;
        title: string;
        views: number;
        revenue: number;
        coverImage: string;
    }>;
    pendingModeration: number;
}

export default function AnimeOverviewPage() {
    const [kpiData, setKpiData] = useState<KPIData | null>(null);
    const [loading, setLoading] = useState(true);
    const [hasUploadedAnime, setHasUploadedAnime] = useState(false);
    const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

    useEffect(() => {
        fetchKPIData();
    }, [timeRange]);

    const fetchKPIData = async () => {
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const response = await fetch(`/api/anime/creator/dashboard?range=${timeRange}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setKpiData(data);
                // Check if user has uploaded anime
                setHasUploadedAnime(data.stats?.totalAnime > 0 || data.series?.length > 0);
            } else if (response.status === 404) {
                // No anime uploaded yet
                setHasUploadedAnime(false);
            }
        } catch (error) {
            console.error('Error fetching KPI data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <AnimeDashboardLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                        <p className="text-gray-400">Loading dashboard...</p>
                    </div>
                </div>
            </AnimeDashboardLayout>
        );
    }

    // Show upload prompt if user hasn't uploaded anime yet
    if (!hasUploadedAnime) {
        return (
            <AnimeDashboardLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center max-w-2xl mx-auto p-8 bg-gray-900/50 rounded-2xl border border-orange-500/20">
                        <div className="mb-6">
                            <FaUpload className="text-6xl text-orange-400 mx-auto mb-4" />
                            <h2 className="text-3xl font-bold text-white mb-2">Welcome to Creator Dashboard!</h2>
                            <p className="text-gray-400 text-lg">
                                You need to upload your first anime series to access the full dashboard.
                            </p>
                        </div>
                        <Link
                            href="/upload/intro?mode=anime"
                            className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-bold rounded-xl transition-all duration-300 hover:scale-105 shadow-lg shadow-orange-500/50"
                        >
                            <FaUpload />
                            <span>Upload Your First Anime Series</span>
                        </Link>
                        <p className="text-sm text-gray-500 mt-4">
                            After uploading, you'll get full access to analytics, earnings, and more!
                        </p>
                    </div>
                </div>
            </AnimeDashboardLayout>
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
            action: { label: 'Request Payout', href: '/anime/creator/earnings' }
        },
        {
            title: 'Views (30d)',
            value: kpiData?.views30d?.toLocaleString() || '0',
            icon: FaEye,
            color: 'from-orange-500 to-red-600',
            bgColor: 'from-orange-900/20 to-red-900/20',
            borderColor: 'border-orange-500/20',
            change: kpiData?.viewsChange || 0,
            description: 'Total views'
        },
        {
            title: 'New Subscribers',
            value: kpiData?.newSubscribers30d?.toLocaleString() || '0',
            icon: FaUsers,
            color: 'from-red-500 to-pink-600',
            bgColor: 'from-red-900/20 to-pink-900/20',
            borderColor: 'border-red-500/20',
            description: `${kpiData?.newSubscribers7d || 0} in last 7 days`,
            change: kpiData?.newSubscribers7d || 0
        },
        {
            title: 'Revenue (30d)',
            value: `₹${kpiData?.revenue30d?.toLocaleString() || '0'}`,
            icon: FaDollarSign,
            color: 'from-yellow-500 to-orange-600',
            bgColor: 'from-yellow-900/20 to-orange-900/20',
            borderColor: 'border-yellow-500/20',
            change: kpiData?.revenueChange || 0,
            description: 'Total earnings'
        }
    ];

    return (
        <AnimeDashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Dashboard Overview</h1>
                        <p className="text-orange-400">
                            Welcome back{typeof window !== 'undefined' && localStorage.getItem('authToken') ? 
                                (() => {
                                    try {
                                        const userStr = localStorage.getItem('user');
                                        if (userStr) {
                                            const user = JSON.parse(userStr);
                                            const creatorName = user?.creatorProfile?.displayName || user?.username || '';
                                            return creatorName ? `, ${creatorName}!` : '!';
                                        }
                                    } catch {}
                                    return '!';
                                })() : '!'} Here's your anime performance summary.
                        </p>
                    </div>
                    <div className="mt-4 md:mt-0 flex items-center space-x-2">
                        {(['7d', '30d', '90d'] as const).map((range) => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                                    timeRange === range
                                        ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white'
                                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                }`}
                            >
                                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {kpiCards.map((card, index) => {
                        const Icon = card.icon;
                        return (
                            <motion.div
                                key={card.title}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.bgColor} border ${card.borderColor} p-6 backdrop-blur-sm`}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`p-3 rounded-xl bg-gradient-to-br ${card.color} shadow-lg`}>
                                        <Icon className="text-white text-xl" />
                                    </div>
                                    {card.change !== undefined && card.change !== 0 && (
                                        <div className={`flex items-center space-x-1 text-sm font-semibold ${
                                            card.change > 0 ? 'text-green-400' : 'text-red-400'
                                        }`}>
                                            {card.change > 0 ? <FaArrowUp /> : <FaArrowDown />}
                                            <span>{Math.abs(card.change)}%</span>
                                        </div>
                                    )}
                                </div>
                                <h3 className="text-gray-400 text-sm font-medium mb-1">{card.title}</h3>
                                <p className="text-3xl font-bold text-white mb-2">{card.value}</p>
                                <p className="text-xs text-gray-500">{card.description}</p>
                                {card.action && (
                                    <Link
                                        href={card.action.href}
                                        className="mt-4 inline-block text-xs font-semibold text-orange-400 hover:text-orange-300"
                                    >
                                        {card.action.label} →
                                    </Link>
                                )}
                            </motion.div>
                        );
                    })}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gray-900/50 rounded-2xl p-6 border border-orange-500/20">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white">Total Series</h3>
                            <FaPlay className="text-orange-400 text-2xl" />
                        </div>
                        <p className="text-4xl font-bold text-orange-400 mb-2">{kpiData?.totalAnime || 0}</p>
                        <p className="text-sm text-gray-400">Anime series created</p>
                    </div>

                    <div className="bg-gray-900/50 rounded-2xl p-6 border border-orange-500/20">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white">Total Episodes</h3>
                            <FaClock className="text-red-400 text-2xl" />
                        </div>
                        <p className="text-4xl font-bold text-red-400 mb-2">{kpiData?.totalEpisodes || 0}</p>
                        <p className="text-sm text-gray-400">Episodes published</p>
                    </div>

                    <div className="bg-gray-900/50 rounded-2xl p-6 border border-orange-500/20">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white">Total Likes</h3>
                            <FaHeart className="text-pink-400 text-2xl" />
                        </div>
                        <p className="text-4xl font-bold text-pink-400 mb-2">{kpiData?.totalLikes?.toLocaleString() || '0'}</p>
                        <p className="text-sm text-gray-400">Total likes received</p>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-gray-900/50 rounded-2xl p-6 border border-orange-500/20">
                    <h3 className="text-xl font-bold text-white mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Link
                            href="/upload/intro?mode=anime"
                            className="flex items-center space-x-3 p-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 rounded-xl transition-all duration-300 hover:scale-105"
                        >
                            <FaUpload className="text-white text-xl" />
                            <div>
                                <p className="font-semibold text-white">Upload New Series</p>
                                <p className="text-xs text-orange-200">Add a new anime series</p>
                            </div>
                        </Link>
                        <Link
                            href="/anime/creator/series"
                            className="flex items-center space-x-3 p-4 bg-gray-800 hover:bg-gray-700 rounded-xl transition-all duration-300 border border-orange-500/20"
                        >
                            <FaEdit className="text-orange-400 text-xl" />
                            <div>
                                <p className="font-semibold text-white">Manage Series</p>
                                <p className="text-xs text-gray-400">Edit your anime</p>
                            </div>
                        </Link>
                        <Link
                            href="/anime/creator/analytics"
                            className="flex items-center space-x-3 p-4 bg-gray-800 hover:bg-gray-700 rounded-xl transition-all duration-300 border border-orange-500/20"
                        >
                            <FaChartBar className="text-red-400 text-xl" />
                            <div>
                                <p className="font-semibold text-white">View Analytics</p>
                                <p className="text-xs text-gray-400">Performance insights</p>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </AnimeDashboardLayout>
    );
}

