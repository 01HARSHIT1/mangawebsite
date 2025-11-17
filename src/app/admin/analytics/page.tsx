'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { FaChartLine, FaUsers, FaBook, FaEye, FaClock, FaMobile, FaDesktop, FaTablet } from 'react-icons/fa';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';

export default function AdminAnalyticsPage() {
    const [analytics, setAnalytics] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isAuthenticated || user?.role !== 'admin') {
            router.push('/admin/login');
            return;
        }
        fetchAnalytics();
    }, [isAuthenticated, user, router, timeRange]);

    const fetchAnalytics = async () => {
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const response = await fetch(`/api/admin/analytics?range=${timeRange}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setAnalytics(data);
            }
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    const COLORS = ['#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#3b82f6'];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                            Analytics Dashboard
                        </h1>
                        <p className="text-gray-400">Platform performance metrics and insights</p>
                    </div>
                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value as any)}
                        className="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-white"
                    >
                        <option value="7d">Last 7 days</option>
                        <option value="30d">Last 30 days</option>
                        <option value="90d">Last 90 days</option>
                        <option value="1y">Last year</option>
                    </select>
                </div>

                {/* Platform Analytics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <StatCard icon={<FaUsers />} title="Total Visitors" value={analytics?.platform?.totalVisitors || 0} />
                    <StatCard icon={<FaEye />} title="Total Views" value={analytics?.platform?.totalViews || 0} />
                    <StatCard icon={<FaClock />} title="Avg Reading Time" value={`${analytics?.platform?.avgReadingTime || 0} min`} />
                    <StatCard icon={<FaUsers />} title="Active Users" value={analytics?.platform?.activeUsers || 0} />
                </div>

                {/* Charts Row 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <div className="bg-slate-800/50 rounded-2xl p-6 backdrop-blur-sm">
                        <h2 className="text-xl font-bold mb-4">Visitors Over Time</h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={analytics?.visitorsOverTime || []}>
                                <XAxis dataKey="date" stroke="#9ca3af" />
                                <YAxis stroke="#9ca3af" />
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
                                <Line type="monotone" dataKey="visitors" stroke="#8b5cf6" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="bg-slate-800/50 rounded-2xl p-6 backdrop-blur-sm">
                        <h2 className="text-xl font-bold mb-4">Device Breakdown</h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={analytics?.deviceBreakdown || []}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {(analytics?.deviceBreakdown || []).map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Content Analytics */}
                <div className="bg-slate-800/50 rounded-2xl p-6 backdrop-blur-sm mb-6">
                    <h2 className="text-xl font-bold mb-4">Content Analytics</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-slate-700/50 rounded-lg p-4">
                            <p className="text-gray-400 text-sm mb-1">Total Manga</p>
                            <p className="text-2xl font-bold">{analytics?.content?.totalManga || 0}</p>
                        </div>
                        <div className="bg-slate-700/50 rounded-lg p-4">
                            <p className="text-gray-400 text-sm mb-1">Total Chapters</p>
                            <p className="text-2xl font-bold">{analytics?.content?.totalChapters || 0}</p>
                        </div>
                        <div className="bg-slate-700/50 rounded-lg p-4">
                            <p className="text-gray-400 text-sm mb-1">Avg Completion Rate</p>
                            <p className="text-2xl font-bold">{analytics?.content?.avgCompletionRate || 0}%</p>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-700">
                            <thead>
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Manga</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Views</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Likes</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Comments</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Completion</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {(analytics?.topManga || []).slice(0, 10).map((manga: any) => (
                                    <tr key={manga._id}>
                                        <td className="px-6 py-4">{manga.title}</td>
                                        <td className="px-6 py-4">{manga.views || 0}</td>
                                        <td className="px-6 py-4">{manga.likes || 0}</td>
                                        <td className="px-6 py-4">{manga.comments || 0}</td>
                                        <td className="px-6 py-4">{manga.completionRate || 0}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Creator Analytics */}
                <div className="bg-slate-800/50 rounded-2xl p-6 backdrop-blur-sm">
                    <h2 className="text-xl font-bold mb-4">Creator Performance</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-slate-700/50 rounded-lg p-4">
                            <p className="text-gray-400 text-sm mb-1">Total Creators</p>
                            <p className="text-2xl font-bold">{analytics?.creators?.totalCreators || 0}</p>
                        </div>
                        <div className="bg-slate-700/50 rounded-lg p-4">
                            <p className="text-gray-400 text-sm mb-1">Active Creators</p>
                            <p className="text-2xl font-bold">{analytics?.creators?.activeCreators || 0}</p>
                        </div>
                        <div className="bg-slate-700/50 rounded-lg p-4">
                            <p className="text-gray-400 text-sm mb-1">Total Earnings</p>
                            <p className="text-2xl font-bold">₹{(analytics?.creators?.totalEarnings || 0).toLocaleString()}</p>
                        </div>
                        <div className="bg-slate-700/50 rounded-lg p-4">
                            <p className="text-gray-400 text-sm mb-1">Avg Uploads/Month</p>
                            <p className="text-2xl font-bold">{analytics?.creators?.avgUploads || 0}</p>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-700">
                            <thead>
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Creator</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Series</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Views</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Earnings</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {(analytics?.topCreators || []).slice(0, 10).map((creator: any) => (
                                    <tr key={creator._id}>
                                        <td className="px-6 py-4">{creator.username}</td>
                                        <td className="px-6 py-4">{creator.seriesCount || 0}</td>
                                        <td className="px-6 py-4">{creator.totalViews || 0}</td>
                                        <td className="px-6 py-4">₹{(creator.earnings || 0).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon, title, value }: { icon: React.ReactNode; title: string; value: string | number }) {
    return (
        <div className="bg-slate-800/50 rounded-2xl p-6 backdrop-blur-sm border border-purple-500/20">
            <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white text-xl">
                    {icon}
                </div>
            </div>
            <h3 className="text-gray-400 text-sm font-medium mb-1">{title}</h3>
            <p className="text-3xl font-bold text-white">{value}</p>
        </div>
    );
}

