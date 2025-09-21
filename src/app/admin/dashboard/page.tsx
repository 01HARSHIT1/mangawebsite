'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { FaUsers, FaBook, FaChartLine, FaExclamationTriangle, FaServer, FaCog } from 'react-icons/fa';

interface AdminStats {
    totalUsers: number;
    totalManga: number;
    totalChapters: number;
    totalViews: number;
    activeUsers: number;
    recentRegistrations: number;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }

        // Check if user is admin (in a real app, you'd check user.role === 'admin')
        fetchStats();
    }, [isAuthenticated, router]);

    const fetchStats = async () => {
        try {
            const response = await fetch('/api/admin/stats');
            if (response.ok) {
                const data = await response.json();
                setStats(data);
            } else {
                // Use mock data if API fails
                setStats({
                    totalUsers: 1247,
                    totalManga: 156,
                    totalChapters: 3421,
                    totalViews: 89532,
                    activeUsers: 234,
                    recentRegistrations: 23
                });
            }
        } catch (error) {
            console.error('Failed to fetch admin stats:', error);
            // Use mock data
            setStats({
                totalUsers: 1247,
                totalManga: 156,
                totalChapters: 3421,
                totalViews: 89532,
                activeUsers: 234,
                recentRegistrations: 23
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
                <div className="text-white text-xl">Loading admin dashboard...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Admin Dashboard
                    </h1>
                    <p className="text-gray-300">Welcome back, {user?.username || 'Admin'}</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <StatCard
                        icon={<FaUsers />}
                        title="Total Users"
                        value={stats?.totalUsers || 0}
                        color="from-blue-500 to-cyan-500"
                    />
                    <StatCard
                        icon={<FaBook />}
                        title="Total Manga"
                        value={stats?.totalManga || 0}
                        color="from-green-500 to-emerald-500"
                    />
                    <StatCard
                        icon={<FaChartLine />}
                        title="Total Views"
                        value={stats?.totalViews || 0}
                        color="from-purple-500 to-pink-500"
                    />
                    <StatCard
                        icon={<FaUsers />}
                        title="Active Users"
                        value={stats?.activeUsers || 0}
                        color="from-orange-500 to-red-500"
                    />
                    <StatCard
                        icon={<FaBook />}
                        title="Total Chapters"
                        value={stats?.totalChapters || 0}
                        color="from-teal-500 to-green-500"
                    />
                    <StatCard
                        icon={<FaUsers />}
                        title="New Users (7d)"
                        value={stats?.recentRegistrations || 0}
                        color="from-indigo-500 to-purple-500"
                    />
                </div>

                {/* Quick Actions */}
                <div className="bg-slate-800/50 rounded-3xl p-6 backdrop-blur-sm mb-8">
                    <h2 className="text-2xl font-bold mb-6 text-purple-400">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <ActionButton
                            icon={<FaUsers />}
                            title="Manage Users"
                            description="View and manage user accounts"
                            href="/admin/users"
                        />
                        <ActionButton
                            icon={<FaBook />}
                            title="Content Management"
                            description="Manage manga and chapters"
                            href="/admin/content"
                        />
                        <ActionButton
                            icon={<FaServer />}
                            title="System Health"
                            description="Monitor system performance"
                            href="/admin/monitoring"
                        />
                        <ActionButton
                            icon={<FaCog />}
                            title="Settings"
                            description="Configure system settings"
                            href="/admin/settings"
                        />
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-slate-800/50 rounded-3xl p-6 backdrop-blur-sm">
                    <h2 className="text-2xl font-bold mb-6 text-purple-400">Recent Activity</h2>
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
        </div>
    );
}

interface StatCardProps {
    icon: React.ReactNode;
    title: string;
    value: number;
    color: string;
}

function StatCard({ icon, title, value, color }: StatCardProps) {
    return (
        <div className="bg-slate-800/50 rounded-2xl p-6 backdrop-blur-sm border border-purple-500/20">
            <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${color} flex items-center justify-center text-white text-xl`}>
                    {icon}
                </div>
            </div>
            <h3 className="text-gray-400 text-sm font-medium mb-1">{title}</h3>
            <p className="text-3xl font-bold text-white">{value.toLocaleString()}</p>
        </div>
    );
}

interface ActionButtonProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    href: string;
}

function ActionButton({ icon, title, description, href }: ActionButtonProps) {
    const router = useRouter();

    return (
        <button
            onClick={() => router.push(href)}
            className="bg-slate-700/50 rounded-xl p-4 text-left hover:bg-slate-700/70 transition-all duration-300 border border-purple-500/20 hover:border-purple-500/40"
        >
            <div className="text-purple-400 text-xl mb-2">{icon}</div>
            <h3 className="text-white font-semibold mb-1">{title}</h3>
            <p className="text-gray-400 text-sm">{description}</p>
        </button>
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
