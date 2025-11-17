'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { FaChartLine, FaBook, FaEye, FaHeart, FaComment, FaArrowLeft } from 'react-icons/fa';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface CreatorStats {
    totalManga: number;
    totalChapters: number;
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    followers: number;
}

export default function AdminCreatorView({ params }: { params: { creatorId: string } }) {
    const [creator, setCreator] = useState<any>(null);
    const [stats, setStats] = useState<CreatorStats | null>(null);
    const [manga, setManga] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }

        // Check if user is admin
        if (user?.role !== 'admin') {
            router.push('/');
            return;
        }

        fetchCreatorData();
    }, [isAuthenticated, user, router, params.creatorId]);

    const fetchCreatorData = async () => {
        try {
            const token = localStorage.getItem('authToken');

            // Fetch creator info
            const creatorResponse = await fetch(`/api/admin/users/${params.creatorId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (creatorResponse.ok) {
                const creatorData = await creatorResponse.json();
                setCreator(creatorData.user);
            }

            // Fetch creator stats
            const statsResponse = await fetch(`/api/admin/creator-stats/${params.creatorId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (statsResponse.ok) {
                const statsData = await statsResponse.json();
                setStats(statsData);
            } else {
                // Set empty stats if API fails
                setStats({
                    totalManga: 0,
                    totalChapters: 0,
                    totalViews: 0,
                    totalLikes: 0,
                    totalComments: 0,
                    followers: 0
                });
            }

            // Fetch creator's manga
            const mangaResponse = await fetch(`/api/manga?creatorId=${params.creatorId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (mangaResponse.ok) {
                const mangaData = await mangaResponse.json();
                setManga(mangaData.manga || []);
            }
        } catch (error) {
            console.error('Failed to fetch creator data:', error);
            // Set empty data if fetch fails
            setCreator({ username: 'Unknown', email: '' });
            setStats({
                totalManga: 0,
                totalChapters: 0,
                totalViews: 0,
                totalLikes: 0,
                totalComments: 0,
                followers: 0
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
                <div className="text-white text-xl">Loading creator data...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href="/admin/content"
                        className="inline-flex items-center text-purple-400 hover:text-purple-300 mb-4"
                    >
                        <FaArrowLeft className="mr-2" />
                        Back to Content Management
                    </Link>
                    <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Creator Dashboard View
                    </h1>
                    <p className="text-gray-300">
                        Viewing as Admin: {creator?.username || 'Creator'}
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                    <StatCard
                        icon={<FaBook />}
                        title="Total Manga"
                        value={stats?.totalManga || 0}
                        color="from-blue-500 to-cyan-500"
                    />
                    <StatCard
                        icon={<FaBook />}
                        title="Total Chapters"
                        value={stats?.totalChapters || 0}
                        color="from-green-500 to-emerald-500"
                    />
                    <StatCard
                        icon={<FaEye />}
                        title="Total Views"
                        value={(stats?.totalViews || 0).toLocaleString()}
                        color="from-purple-500 to-pink-500"
                    />
                    <StatCard
                        icon={<FaHeart />}
                        title="Total Likes"
                        value={(stats?.totalLikes || 0).toLocaleString()}
                        color="from-red-500 to-pink-500"
                    />
                    <StatCard
                        icon={<FaComment />}
                        title="Comments"
                        value={(stats?.totalComments || 0).toLocaleString()}
                        color="from-yellow-500 to-orange-500"
                    />
                    <StatCard
                        icon={<FaChartLine />}
                        title="Followers"
                        value={(stats?.followers || 0).toLocaleString()}
                        color="from-indigo-500 to-purple-500"
                    />
                </div>

                {/* Creator's Manga */}
                <div className="bg-slate-800/50 rounded-3xl p-6 backdrop-blur-sm border border-purple-500/20">
                    <h2 className="text-2xl font-bold mb-6 text-purple-400">Creator's Manga</h2>

                    {manga.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <FaBook className="text-6xl mx-auto mb-4 opacity-50" />
                            <p>No manga published yet</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {manga.map((m) => (
                                <div
                                    key={m._id}
                                    className="bg-slate-700/50 rounded-xl p-4 hover:bg-slate-700 transition-all"
                                >
                                    <h3 className="font-bold text-white mb-2">{m.title}</h3>
                                    <div className="text-sm text-gray-400 space-y-1">
                                        <p>{m.chapters || 0} chapters</p>
                                        <p>{(m.views || 0).toLocaleString()} views</p>
                                        <p>⭐ {(m.rating || 0).toFixed(1)} rating</p>
                                    </div>
                                    <div className="mt-4 flex gap-2">
                                        <Link
                                            href={`/manga/${m._id}`}
                                            className="flex-1 text-center px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                                        >
                                            View
                                        </Link>
                                        <button
                                            onClick={() => router.push(`/admin/manga/${m._id}/edit`)}
                                            className="flex-1 px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm"
                                        >
                                            Edit
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Admin Actions */}
                <div className="mt-8 bg-slate-800/50 rounded-3xl p-6 backdrop-blur-sm border border-purple-500/20">
                    <h2 className="text-2xl font-bold mb-6 text-purple-400">Admin Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button
                            onClick={() => router.push(`/admin/users`)}
                            className="p-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
                        >
                            Manage User Account
                        </button>
                        <button
                            onClick={() => router.push(`/admin/content`)}
                            className="p-4 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-colors"
                        >
                            View All Content
                        </button>
                        <button
                            onClick={() => router.push(`/admin/dashboard`)}
                            className="p-4 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-colors"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon, title, value, color }: { icon: React.ReactNode; title: string; value: string | number; color: string }) {
    return (
        <div className="bg-slate-800/50 rounded-2xl p-4 backdrop-blur-sm border border-purple-500/20">
            <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${color} mb-3`}>
                <div className="text-white text-xl">{icon}</div>
            </div>
            <p className="text-gray-400 text-sm mb-1">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
        </div>
    );
}
