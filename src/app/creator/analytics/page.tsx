'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { getAuthToken, getAuthHeaders } from '@/lib/token';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
    TrendingUp, TrendingDown, Eye, Heart, MessageSquare, DollarSign,
    Users, Calendar, Download, Share2, Filter, ChevronDown, Star,
    Clock, Target, Activity, Award, BarChart3, PieChart as PieChartIcon
} from 'lucide-react';

interface ChapterAnalytics {
    _id: string;
    chapterNumber: number;
    title: string;
    views: number;
    likes: number;
    comments: number;
    revenue: number;
    moneyGenerated: number;
    avgReadTime: string;
    completionRate: number;
    engagementRate: number;
    createdAt: string;
    status: 'published' | 'scheduled' | 'draft';
}

interface MangaAnalytics {
    _id: string;
    title: string;
    coverImage: string;
    views: number;
    likes: number;
    comments: number;
    revenue: number;
    moneyGenerated: number;
    totalChapters: number;
    engagementRate: number;
    avgRating: number;
    chapters: ChapterAnalytics[];
    createdAt: string;
}

interface AnalyticsData {
    totalSeries: number;
    totalEpisodes: number;
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    totalRevenue: number;
    totalMoneyGenerated: number;
    totalEngagementRate: number;
    growthRate: number;
    detailedSeries: MangaAnalytics[];
    viewsOverTime: Array<{ date: string; views: number; likes: number }>;
    revenueOverTime: Array<{ date: string; revenue: number }>;
    topPerformingChapters: Array<{
        title: string;
        manga: string;
        views: number;
        chapter: number;
    }>;
    audienceInsights: {
        topCountries: Array<{ country: string; percentage: number }>;
        deviceUsage: Array<{ device: string; percentage: number }>;
        peakReadingHours: Array<{ hour: number; reads: number }>;
    };
}

const COLORS = {
    primary: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    purple: '#8b5cf6',
    pink: '#ec4899',
    cyan: '#06b6d4',
    emerald: '#10b981'
};

const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

export default function CreatorAnalytics() {
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();

    // State management
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedManga, setSelectedManga] = useState<string | null>(null);
    const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
    const [timeFilter, setTimeFilter] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('monthly');
    const [viewMode, setViewMode] = useState<'overview' | 'manga' | 'chapter'>('overview');

    useEffect(() => {
        if (!isAuthenticated || !user || (user.role !== 'creator' && user.role !== 'admin')) {
            if (!isAuthenticated) {
                router.push('/login');
            } else if (user && user.role !== 'creator' && user.role !== 'admin') {
                router.push('/');
            }
            return;
        }
        fetchAnalytics();
    }, [isAuthenticated, user, router, timeFilter]);

    const fetchAnalytics = async () => {
        if (!isAuthenticated || !user) return;

        try {
            setLoading(true);
            setError(null);

            const token = getAuthToken();
            const headers = getAuthHeaders();

            const res = await fetch(`/api/creator-analytics?timeFilter=${timeFilter}`, {
                headers: {
                    ...headers,
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!res.ok) {
                throw new Error('Failed to fetch analytics');
            }

            const data = await res.json();

            // Transform data for charts - using real data from API
            const transformedData: AnalyticsData = {
                totalSeries: data.totalSeries || 0,
                totalEpisodes: data.totalEpisodes || 0,
                totalViews: data.totalViews || 0,
                totalLikes: data.totalLikes || 0,
                totalComments: data.totalComments || 0,
                totalRevenue: data.totalRevenue || 0,
                totalMoneyGenerated: data.totalMoneyGenerated || 0,
                totalEngagementRate: data.totalEngagementRate || 0,
                growthRate: data.growthRate || 0,
                detailedSeries: data.detailedSeries || [],
                viewsOverTime: data.viewsOver30Days || [],
                revenueOverTime: data.revenueOverTime || [],
                topPerformingChapters: data.topPerformingChapters || [],
                audienceInsights: {
                    topCountries: data.audienceInsights?.topCountries || [],
                    deviceUsage: data.audienceInsights?.deviceUsage || [],
                    peakReadingHours: data.audienceInsights?.peakReadingHours || []
                }
            };

            setAnalytics(transformedData);
        } catch (err) {
            console.error('❌ Analytics fetch error:', err);
            setError('Failed to load analytics');

            // Set fallback data
            setAnalytics({
                totalSeries: 0,
                totalEpisodes: 0,
                totalViews: 0,
                totalLikes: 0,
                totalComments: 0,
                totalRevenue: 0,
                totalMoneyGenerated: 0,
                totalEngagementRate: 0,
                growthRate: 0,
                detailedSeries: [],
                viewsOverTime: [],
                revenueOverTime: [],
                topPerformingChapters: [],
                audienceInsights: {
                    topCountries: [],
                    deviceUsage: [],
                    peakReadingHours: []
                }
            });
        } finally {
            setLoading(false);
        }
    };

    // Helper functions for data formatting

    const formatNumber = (num: number) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const exportAnalytics = (format: 'csv' | 'pdf') => {
        // TODO: Implement export functionality
        alert(`Exporting analytics as ${format.toUpperCase()}...`);
    };

    const selectedMangaData = analytics?.detailedSeries.find(m => m._id === selectedManga);
    const selectedChapterData = selectedMangaData?.chapters.find(c => c._id === selectedChapter);

    if (loading) {
        return (
            <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white pt-32 min-h-screen">
                <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
                        <p className="text-white text-lg font-medium">Loading Analytics...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!analytics) {
        return (
            <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white pt-32 min-h-screen">
                <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
                    <div className="text-center">
                        <p className="text-red-400 text-lg font-medium">Failed to load analytics</p>
                        <button onClick={fetchAnalytics} className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                            Retry
                                </button>
                    </div>
                </div>
            </div>
        );
    }

        return (
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white pt-32">
            {/* Header Section */}
            <div className="bg-gray-800/50 border-b border-gray-700 backdrop-blur-sm fixed top-16 left-0 right-0 z-40">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                                Analytics Overview
                        </h1>
                            <p className="text-gray-400 mt-1">Track your content performance and earnings</p>
                    </div>

                        <div className="flex flex-wrap items-center gap-3">
                            {/* Time Filter */}
                            <div className="relative">
                                <select
                                    value={timeFilter}
                                    onChange={(e) => setTimeFilter(e.target.value as any)}
                                    className="appearance-none bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                    <option value="custom">Custom Range</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>

                            {/* Manga Selector */}
                            {analytics.detailedSeries.length > 0 && (
                                <div className="relative">
                                    <select
                                        value={selectedManga || ''}
                                        onChange={(e) => {
                                            setSelectedManga(e.target.value || null);
                                            setSelectedChapter(null);
                                            setViewMode(e.target.value ? 'manga' : 'overview');
                                        }}
                                        className="appearance-none bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">All Manga</option>
                                        {analytics.detailedSeries.map(manga => (
                                            <option key={manga._id} value={manga._id}>{manga.title}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                </div>
                            )}

                            {/* Chapter Selector */}
                            {selectedMangaData && selectedMangaData.chapters.length > 0 && (
                                <div className="relative">
                                    <select
                                        value={selectedChapter || ''}
                                        onChange={(e) => {
                                            setSelectedChapter(e.target.value || null);
                                            setViewMode(e.target.value ? 'chapter' : 'manga');
                                        }}
                                        className="appearance-none bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">All Chapters</option>
                                        {selectedMangaData.chapters.map(chapter => (
                                            <option key={chapter._id} value={chapter._id}>
                                                Chapter {chapter.chapterNumber}: {chapter.title}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                </div>
                            )}

                            {/* Export Buttons */}
                            <button
                                onClick={() => exportAnalytics('csv')}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                            >
                                <Download className="w-4 h-4" />
                                <span>Export CSV</span>
                            </button>

                            <button
                                onClick={() => exportAnalytics('pdf')}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                            >
                                <Download className="w-4 h-4" />
                                <span>Export PDF</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8 mt-24">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
                    <MetricCard
                        title="Total Views"
                        value={formatNumber(
                            viewMode === 'chapter' && selectedChapterData ? selectedChapterData.views :
                                viewMode === 'manga' && selectedMangaData ? selectedMangaData.views :
                                    analytics.totalViews
                        )}
                        icon={<Eye className="w-5 h-5" />}
                        change={analytics.growthRate}
                        color="primary"
                    />
                    <MetricCard
                        title="Total Likes"
                        value={formatNumber(
                            viewMode === 'chapter' && selectedChapterData ? selectedChapterData.likes :
                                viewMode === 'manga' && selectedMangaData ? selectedMangaData.likes :
                                    analytics.totalLikes
                        )}
                        icon={<Heart className="w-5 h-5" />}
                        change={8.2}
                        color="pink"
                    />
                    <MetricCard
                        title="Comments"
                        value={formatNumber(
                            viewMode === 'chapter' && selectedChapterData ? selectedChapterData.comments :
                                viewMode === 'manga' && selectedMangaData ? selectedMangaData.comments :
                                    analytics.totalComments
                        )}
                        icon={<MessageSquare className="w-5 h-5" />}
                        change={15.3}
                        color="purple"
                    />
                    <MetricCard
                        title="Earnings"
                        value={formatCurrency(
                            viewMode === 'chapter' && selectedChapterData ? selectedChapterData.revenue :
                                viewMode === 'manga' && selectedMangaData ? selectedMangaData.revenue :
                                    analytics.totalRevenue
                        )}
                        icon={<DollarSign className="w-5 h-5" />}
                        change={22.5}
                        color="success"
                    />
                    <MetricCard
                        title="Engagement Rate"
                        value={`${(
                            viewMode === 'chapter' && selectedChapterData ? selectedChapterData.engagementRate :
                                viewMode === 'manga' && selectedMangaData ? selectedMangaData.engagementRate :
                                    analytics.totalEngagementRate
                        ).toFixed(1)}%`}
                        icon={<Activity className="w-5 h-5" />}
                        change={3.7}
                        color="cyan"
                    />
                    <MetricCard
                        title="Growth Rate"
                        value={`+${analytics.growthRate.toFixed(1)}%`}
                        icon={<TrendingUp className="w-5 h-5" />}
                        change={analytics.growthRate}
                        color="emerald"
                    />
                </div>

                {/* Main Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Views Over Time Chart */}
                    <ChartCard title="Views & Engagement Over Time" icon={<BarChart3 className="w-5 h-5" />}>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={analytics.viewsOverTime}>
                                <defs>
                                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8} />
                                        <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorLikes" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={COLORS.pink} stopOpacity={0.8} />
                                        <stop offset="95%" stopColor={COLORS.pink} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="date" stroke="#9ca3af" />
                                <YAxis stroke="#9ca3af" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '0.5rem' }}
                                    labelStyle={{ color: '#f9fafb' }}
                                />
                                <Legend />
                                <Area type="monotone" dataKey="views" stroke={COLORS.primary} fillOpacity={1} fill="url(#colorViews)" />
                                <Area type="monotone" dataKey="likes" stroke={COLORS.pink} fillOpacity={1} fill="url(#colorLikes)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    {/* Revenue Trend Chart */}
                    <ChartCard title="Revenue Trend" icon={<DollarSign className="w-5 h-5" />}>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={analytics.revenueOverTime}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="date" stroke="#9ca3af" />
                                <YAxis stroke="#9ca3af" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '0.5rem' }}
                                    labelStyle={{ color: '#f9fafb' }}
                                    formatter={(value: any) => formatCurrency(value)}
                                />
                                <Bar dataKey="revenue" fill={COLORS.success} radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>
                    </div>

                {/* Engagement Breakdown & Top Chapters */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Engagement Breakdown Pie Chart */}
                    <ChartCard title="Engagement Breakdown" icon={<PieChartIcon className="w-5 h-5" />}>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: 'Views', value: analytics.totalViews },
                                        { name: 'Likes', value: analytics.totalLikes * 10 },
                                        { name: 'Comments', value: analytics.totalComments * 15 },
                                        { name: 'Shares', value: Math.floor(analytics.totalViews * 0.05) }
                                    ]}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {CHART_COLORS.map((color, index) => (
                                        <Cell key={`cell-${index}`} fill={color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '0.5rem' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    {/* Top Performing Chapters */}
                    <ChartCard title="Top Performing Chapters" icon={<Award className="w-5 h-5" />}>
                        <div className="space-y-3">
                            {analytics.topPerformingChapters.length > 0 ? (
                                analytics.topPerformingChapters.map((chapter, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${index === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                                                index === 1 ? 'bg-gray-400/20 text-gray-400' :
                                                    index === 2 ? 'bg-orange-600/20 text-orange-600' :
                                                        'bg-gray-600/20 text-gray-400'
                                                }`}>
                                                {index + 1}
                                            </div>
                            <div>
                                                <p className="text-white font-medium">{chapter.title}</p>
                                                <p className="text-sm text-gray-400">{chapter.manga}</p>
                            </div>
                        </div>
                                        <div className="text-right">
                                            <p className="text-white font-semibold">{formatNumber(chapter.views)}</p>
                                            <p className="text-sm text-gray-400">views</p>
                            </div>
                        </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-400">
                                    <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p>No chapter data available yet</p>
                    </div>
                            )}
                        </div>
                    </ChartCard>
                </div>

                {/* Chapter Performance Table */}
                {viewMode === 'manga' && selectedMangaData && selectedMangaData.chapters.length > 0 && (
                    <ChartCard title={`${selectedMangaData.title} - Chapter Performance`} icon={<BarChart3 className="w-5 h-5" />}>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                    <tr className="border-b border-gray-700">
                                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Chapter</th>
                                        <th className="text-right py-3 px-4 text-gray-400 font-medium">Views</th>
                                        <th className="text-right py-3 px-4 text-gray-400 font-medium">Likes</th>
                                        <th className="text-right py-3 px-4 text-gray-400 font-medium">Comments</th>
                                        <th className="text-right py-3 px-4 text-gray-400 font-medium">Avg Read Time</th>
                                        <th className="text-right py-3 px-4 text-gray-400 font-medium">Earnings</th>
                                        <th className="text-center py-3 px-4 text-gray-400 font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                    {selectedMangaData.chapters.map((chapter) => (
                                        <tr
                                            key={chapter._id}
                                            className="border-b border-gray-700/50 hover:bg-gray-700/30 cursor-pointer transition-colors"
                                            onClick={() => {
                                                setSelectedChapter(chapter._id);
                                                setViewMode('chapter');
                                            }}
                                        >
                                        <td className="py-3 px-4">
                                                <div>
                                                    <p className="text-white font-medium">Chapter {chapter.chapterNumber}</p>
                                                    <p className="text-sm text-gray-400">{chapter.title}</p>
                                                </div>
                                            </td>
                                            <td className="text-right py-3 px-4 text-white">{formatNumber(chapter.views)}</td>
                                            <td className="text-right py-3 px-4 text-white">{formatNumber(chapter.likes)}</td>
                                            <td className="text-right py-3 px-4 text-white">{formatNumber(chapter.comments)}</td>
                                            <td className="text-right py-3 px-4 text-white">{chapter.avgReadTime || '3m 45s'}</td>
                                            <td className="text-right py-3 px-4 text-white">{formatCurrency(chapter.revenue)}</td>
                                            <td className="text-center py-3 px-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${chapter.status === 'published' ? 'bg-green-500/20 text-green-500' :
                                                    chapter.status === 'scheduled' ? 'bg-yellow-500/20 text-yellow-500' :
                                                        'bg-gray-500/20 text-gray-400'
                                                    }`}>
                                                    {chapter.status === 'published' ? '✅ Published' :
                                                        chapter.status === 'scheduled' ? '🕒 Scheduled' :
                                                            '📝 Draft'}
                                                </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    </ChartCard>
                )}

                {/* Audience Insights */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Top Countries */}
                    <ChartCard title="Top Countries/Regions" icon={<Users className="w-5 h-5" />}>
                        <div className="space-y-3">
                            {analytics.audienceInsights.topCountries.map((country, index) => (
                                <div key={index}>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-white text-sm">{country.country}</span>
                                        <span className="text-gray-400 text-sm">{country.percentage}%</span>
                                    </div>
                                    <div className="w-full bg-gray-700 rounded-full h-2">
                                        <div
                                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                                            style={{ width: `${country.percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ChartCard>

                    {/* Device Usage */}
                    <ChartCard title="Device Usage" icon={<Activity className="w-5 h-5" />}>
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie
                                    data={analytics.audienceInsights.deviceUsage}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="percentage"
                                    label={({ device, percentage }) => `${device}: ${percentage}%`}
                                >
                                    {analytics.audienceInsights.deviceUsage.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '0.5rem' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    {/* Peak Reading Hours */}
                    <ChartCard title="Peak Reading Hours" icon={<Clock className="w-5 h-5" />}>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={analytics.audienceInsights.peakReadingHours}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="hour" stroke="#9ca3af" />
                                <YAxis stroke="#9ca3af" hide />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '0.5rem' }}
                                    labelFormatter={(value) => `${value}:00`}
                                />
                                <Bar dataKey="reads" fill={COLORS.cyan} radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </div>

                {/* Manga Grid View (Overview Mode) */}
                {viewMode === 'overview' && analytics.detailedSeries.length > 0 && (
                    <ChartCard title="Your Manga Series" icon={<Award className="w-5 h-5" />}>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {analytics.detailedSeries.map((manga) => (
                                <div
                                    key={manga._id}
                                    className="bg-gray-700/30 rounded-xl overflow-hidden hover:bg-gray-700/50 transition-all cursor-pointer group border border-gray-700 hover:border-blue-500"
                                    onClick={() => {
                                        setSelectedManga(manga._id);
                                        setViewMode('manga');
                                    }}
                                >
                                    <div className="aspect-[3/4] overflow-hidden">
                                        <img
                                            src={manga.coverImage || '/placeholder-cover.jpg'}
                                            alt={manga.title}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                        />
                                    </div>
                                    <div className="p-4">
                                        <h3 className="text-white font-bold text-lg mb-2 truncate">{manga.title}</h3>
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div className="flex items-center gap-2 text-gray-300">
                                                <Eye className="w-4 h-4 text-blue-400" />
                                                <span>{formatNumber(manga.views)}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-300">
                                                <Heart className="w-4 h-4 text-pink-400" />
                                                <span>{formatNumber(manga.likes)}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-300">
                                                <DollarSign className="w-4 h-4 text-green-400" />
                                                <span>{formatCurrency(manga.revenue)}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-300">
                                                <Star className="w-4 h-4 text-yellow-400" />
                                                <span>{manga.avgRating?.toFixed(1) || '0.0'}</span>
                                            </div>
                                        </div>
                                        <div className="mt-3 pt-3 border-t border-gray-600">
                                            <p className="text-gray-400 text-sm">{manga.totalChapters} Chapters</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            </div>
                    </ChartCard>
                )}

                {/* No Data State */}
                {analytics.detailedSeries.length === 0 && (
                    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-12 text-center">
                        <Target className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-400 mb-2">No Analytics Data Yet</h3>
                        <p className="text-gray-500 mb-6">Start uploading manga to see your analytics here</p>
                        <button
                            onClick={() => router.push('/upload')}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                            Upload Your First Manga
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// Metric Card Component
function MetricCard({ title, value, icon, change, color }: {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    change: number;
    color: keyof typeof COLORS;
}) {
    const isPositive = change >= 0;
    const colorClasses = {
        blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        pink: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
        purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
        green: 'bg-green-500/20 text-green-400 border-green-500/30',
        cyan: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
        emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        success: 'bg-green-500/20 text-green-400 border-green-500/30',
        warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        danger: 'bg-red-500/20 text-red-400 border-red-500/30',
        primary: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    };

    return (
        <div className={`bg-gray-800/50 border rounded-xl p-4 hover:bg-gray-800/70 transition-all ${colorClasses[color]}`}>
            <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">{title}</span>
                <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
                    {icon}
                </div>
            </div>
            <div className="flex items-end justify-between">
                                <div>
                    <p className="text-2xl font-bold text-white">{value}</p>
                    <div className="flex items-center gap-1 mt-1">
                        {isPositive ? (
                            <TrendingUp className="w-3 h-3 text-green-400" />
                        ) : (
                            <TrendingDown className="w-3 h-3 text-red-400" />
                        )}
                        <span className={`text-xs ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                            {isPositive ? '+' : ''}{change.toFixed(1)}%
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Chart Card Component
function ChartCard({ title, icon, children }: {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-colors">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
                    {icon}
                </div>
                <h3 className="text-lg font-bold text-white">{title}</h3>
            </div>
            {children}
        </div>
    );
}
