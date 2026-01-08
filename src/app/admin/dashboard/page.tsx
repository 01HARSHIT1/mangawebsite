'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import {
    FaUsers, FaBook, FaChartLine, FaExclamationTriangle, FaServer, FaCog,
    FaMoneyBillWave, FaComments, FaBell, FaSearch, FaShieldAlt, FaSignOutAlt,
    FaHome, FaEdit, FaTrash, FaCheck, FaTimes, FaBan, FaUserCheck, FaCrown,
    FaFileAlt, FaTags, FaImage, FaVideo, FaGlobe, FaDatabase, FaRobot,
    FaSlidersH, FaBars, FaTimes as FaTimesIcon, FaVolumeUp, FaGavel, FaStar
} from 'react-icons/fa';

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<string>('overview');
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const { user, isAuthenticated, logout } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/admin/login');
            return;
        }

        if (user?.role !== 'admin') {
            router.push('/');
            return;
        }

        fetchStats();
    }, [isAuthenticated, user, router]);

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const response = await fetch('/api/admin/stats', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        router.push('/admin/login');
    };

    const tabs = [
        { id: 'overview', label: 'Overview', icon: FaChartLine, href: null },
        { id: 'users', label: 'User Management', icon: FaUsers, href: '/admin/users' },
        { id: 'content', label: 'Content Management', icon: FaBook, href: '/admin/content' },
        { id: 'moderation', label: 'Content Moderation', icon: FaExclamationTriangle, href: '/admin/moderation' },
        { id: 'anime', label: 'Anime Management', icon: FaVideo, href: '/admin/anime' },
        { id: 'anime-review', label: 'Anime Review', icon: FaExclamationTriangle, href: '/admin/anime/review' },
        { id: 'anime-audio-subtitle', label: 'Audio/Subtitle Validation', icon: FaVolumeUp, href: '/admin/anime/audio-subtitle' },
        { id: 'anime-copyright', label: 'Copyright & Legal', icon: FaGavel, href: '/admin/anime/copyright' },
        { id: 'anime-reports', label: 'Reports', icon: FaExclamationTriangle, href: '/admin/anime/reports' },
        { id: 'admin-roles', label: 'Admin Roles', icon: FaShieldAlt, href: '/admin/roles' },
        { id: 'monetization', label: 'Monetization', icon: FaMoneyBillWave, href: '/admin/monetization' },
        { id: 'audit-logs', label: 'Audit Logs', icon: FaFileAlt, href: '/admin/audit-logs' },
        { id: 'visibility', label: 'Visibility Controls', icon: FaStar, href: '/admin/anime/visibility' },
        { id: 'platform-config', label: 'Platform Config', icon: FaCog, href: '/admin/platform-config' },
        { id: 'homepage', label: 'Homepage Control', icon: FaHome, href: '/admin/homepage' },
        { id: 'analytics', label: 'Analytics', icon: FaChartLine, href: '/admin/analytics' },
        { id: 'creators', label: 'Creator Management', icon: FaCrown, href: '/admin/creators' },
        { id: 'monetization', label: 'Monetization', icon: FaMoneyBillWave, href: '/admin/monetization' },
        { id: 'community', label: 'Community Tools', icon: FaComments, href: '/admin/community' },
        { id: 'seo', label: 'SEO & Metadata', icon: FaSearch, href: '/admin/seo' },
        { id: 'notifications', label: 'Notifications', icon: FaBell, href: '/admin/notifications' },
        { id: 'settings', label: 'Settings', icon: FaCog, href: '/admin/settings' },
        { id: 'ai', label: 'AI Features', icon: FaRobot, href: '/admin/ai' },
        { id: 'ai-metrics', label: 'AI Metrics', icon: FaChartLine, href: '/admin/ai-metrics' },
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                    <p className="text-white text-xl">Loading Admin Dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
            {/* Header */}
            <header className="bg-slate-800/50 backdrop-blur-sm border-b border-purple-500/20 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => setShowMobileMenu(!showMobileMenu)}
                                className="lg:hidden p-2 text-white hover:text-purple-400"
                            >
                                {showMobileMenu ? <FaTimesIcon /> : <FaBars />}
                            </button>
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                                    <FaShieldAlt className="text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold">Admin Dashboard</h1>
                                    <p className="text-xs text-gray-400">Welcome, {user?.username || user?.email}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Link
                                href="/"
                                className="hidden sm:flex items-center px-4 py-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                <FaHome className="mr-2" />
                                View Site
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                            >
                                <FaSignOutAlt className="mr-2" />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex">
                {/* Sidebar */}
                <aside className={`${showMobileMenu ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 w-64 bg-slate-800/50 backdrop-blur-sm border-r border-purple-500/20 transition-transform duration-300 overflow-y-auto`}>
                    <nav className="p-4 space-y-2">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            if (tab.href) {
                                return (
                                    <Link
                                        key={tab.id}
                                        href={tab.href}
                                        className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-purple-600/20 transition-colors"
                                        onClick={() => setShowMobileMenu(false)}
                                    >
                                        <Icon />
                                        <span>{tab.label}</span>
                                    </Link>
                                );
                            }
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => {
                                        setActiveTab(tab.id);
                                        setShowMobileMenu(false);
                                    }}
                                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                                        activeTab === tab.id
                                            ? 'bg-purple-600 text-white'
                                            : 'hover:bg-purple-600/20'
                                    }`}
                                >
                                    <Icon />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-4 sm:p-6 lg:p-8">
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                                    Dashboard Overview
                                </h2>
                                <p className="text-gray-400">Platform statistics and quick actions</p>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <StatCard
                                    icon={<FaUsers />}
                                    title="Total Users"
                                    value={stats?.totalUsers || 0}
                                    color="from-blue-500 to-cyan-500"
                                    href="/admin/users"
                                />
                                <StatCard
                                    icon={<FaBook />}
                                    title="Total Manga"
                                    value={stats?.totalManga || 0}
                                    color="from-green-500 to-emerald-500"
                                    href="/admin/content"
                                />
                                <StatCard
                                    icon={<FaChartLine />}
                                    title="Total Views"
                                    value={stats?.totalViews || 0}
                                    color="from-purple-500 to-pink-500"
                                />
                                <StatCard
                                    icon={<FaExclamationTriangle />}
                                    title="Pending Reports"
                                    value={stats?.pendingReports || 0}
                                    color="from-red-500 to-orange-500"
                                    href="/admin/moderation"
                                />
                                <StatCard
                                    icon={<FaCrown />}
                                    title="Creators"
                                    value={stats?.totalCreators || 0}
                                    color="from-yellow-500 to-amber-500"
                                    href="/admin/creators"
                                />
                                <StatCard
                                    icon={<FaMoneyBillWave />}
                                    title="Revenue"
                                    value={`₹${((stats?.totalRevenue || 0)).toLocaleString()}`}
                                    color="from-green-500 to-teal-500"
                                    href="/admin/monetization"
                                />
                                <StatCard
                                    icon={<FaComments />}
                                    title="Comments"
                                    value={stats?.totalComments || 0}
                                    color="from-indigo-500 to-purple-500"
                                    href="/admin/community"
                                />
                                <StatCard
                                    icon={<FaServer />}
                                    title="System Health"
                                    value={stats?.systemHealth === 'good' ? 'Healthy' : 'Warning'}
                                    color={stats?.systemHealth === 'good' ? 'from-green-500 to-emerald-500' : 'from-yellow-500 to-orange-500'}
                                    href="/admin/settings"
                                />
                            </div>

                            {/* Quick Actions */}
                            <div className="bg-slate-800/50 rounded-2xl p-6 backdrop-blur-sm">
                                <h3 className="text-xl font-bold mb-4 text-purple-400">Quick Actions</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <QuickAction
                                        icon={<FaUserCheck />}
                                        title="Verify Creator"
                                        description="Approve pending creator applications"
                                        href="/admin/users"
                                    />
                                    <QuickAction
                                        icon={<FaEdit />}
                                        title="Edit Content"
                                        description="Manage manga and chapters"
                                        href="/admin/content"
                                    />
                                    <QuickAction
                                        icon={<FaExclamationTriangle />}
                                        title="Review Reports"
                                        description="Handle content moderation"
                                        href="/admin/moderation"
                                    />
                                    <QuickAction
                                        icon={<FaSlidersH />}
                                        title="Homepage Editor"
                                        description="Customize homepage layout"
                                        href="/admin/homepage"
                                    />
                                    <QuickAction
                                        icon={<FaChartLine />}
                                        title="View Analytics"
                                        description="Platform performance metrics"
                                        href="/admin/analytics"
                                    />
                                    <QuickAction
                                        icon={<FaCrown />}
                                        title="Creator Earnings"
                                        description="View detailed creator earnings & revenue"
                                        href="/admin/creators"
                                    />
                                    <QuickAction
                                        icon={<FaCog />}
                                        title="System Settings"
                                        description="Configure platform settings"
                                        href="/admin/settings"
                                    />
                                </div>
                            </div>

                            {/* Recent Activity */}
                            <div className="bg-slate-800/50 rounded-2xl p-6 backdrop-blur-sm">
                                <h3 className="text-xl font-bold mb-4 text-purple-400">Recent Activity</h3>
                                <div className="space-y-4">
                                    <ActivityItem
                                        icon={<FaUsers className="text-blue-400" />}
                                        title="New user registered"
                                        description="user_123 joined the platform"
                                        time="2 minutes ago"
                                    />
                                    <ActivityItem
                                        icon={<FaBook className="text-green-400" />}
                                        title="New manga uploaded"
                                        description="Dragon Chronicles - Chapter 26"
                                        time="15 minutes ago"
                                    />
                                    <ActivityItem
                                        icon={<FaExclamationTriangle className="text-yellow-400" />}
                                        title="Content reported"
                                        description="User reported inappropriate content"
                                        time="1 hour ago"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* Mobile Menu Overlay */}
            {showMobileMenu && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-30"
                    onClick={() => setShowMobileMenu(false)}
                />
            )}
        </div>
    );
}

interface StatCardProps {
    icon: React.ReactNode;
    title: string;
    value: string | number;
    color: string;
    href?: string;
}

function StatCard({ icon, title, value, color, href }: StatCardProps) {
    const content = (
        <div className="bg-slate-800/50 rounded-2xl p-6 backdrop-blur-sm border border-purple-500/20 hover:border-purple-500/40 transition-all">
            <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${color} flex items-center justify-center text-white text-xl`}>
                    {icon}
                </div>
            </div>
            <h3 className="text-gray-400 text-sm font-medium mb-1">{title}</h3>
            <p className="text-3xl font-bold text-white">{value}</p>
        </div>
    );

    if (href) {
        return <Link href={href}>{content}</Link>;
    }

    return content;
}

interface QuickActionProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    href: string;
}

function QuickAction({ icon, title, description, href }: QuickActionProps) {
    return (
        <Link
            href={href}
            className="bg-slate-700/50 rounded-xl p-4 hover:bg-slate-700/70 transition-all border border-purple-500/20 hover:border-purple-500/40"
        >
            <div className="text-purple-400 text-xl mb-2">{icon}</div>
            <h4 className="text-white font-semibold mb-1">{title}</h4>
            <p className="text-gray-400 text-sm">{description}</p>
        </Link>
    );
}

interface ActivityItemProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    time: string;
}

function ActivityItem({ icon, title, description, time }: ActivityItemProps) {
    return (
        <div className="flex items-start space-x-4 p-4 rounded-xl bg-slate-700/30">
            <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center">
                {icon}
            </div>
            <div className="flex-1">
                <h4 className="text-white font-medium">{title}</h4>
                <p className="text-gray-400 text-sm">{description}</p>
            </div>
            <span className="text-gray-500 text-xs">{time}</span>
        </div>
    );
}
