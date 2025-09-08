'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface MangaStats {
    totalManga: number;
    totalChapters: number;
    totalViews: number;
    totalLikes: number;
}

export default function CreatorDashboardClient() {
    const { user, isAuthenticated, isCreator } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState<MangaStats>({
        totalManga: 0,
        totalChapters: 0,
        totalViews: 0,
        totalLikes: 0,
    });
    const [recentManga, setRecentManga] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }

        if (!isCreator) {
            router.push('/upload');
            return;
        }

        fetchCreatorData();
    }, [isAuthenticated, isCreator, router]);

    const fetchCreatorData = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('/api/creator/dashboard', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setStats(data.stats);
                setRecentManga(data.recentManga);
            }
        } catch (error) {
            console.error('Error fetching creator data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isAuthenticated || !isCreator) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
                    <p className="text-gray-600 mb-4">You need to be a creator to access this page.</p>
                    <Link href="/upload" className="text-blue-600 hover:text-blue-800">
                        Go to Upload Page
                    </Link>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full mb-6">
                        <span className="text-3xl">📊</span>
                    </div>
                    <h1 className="text-5xl font-black mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                        Creator Dashboard
                    </h1>
                    <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                        Welcome back, <span className="text-purple-400 font-semibold">{user?.creatorProfile?.displayName || user?.username}</span>!
                        Manage your manga and track your performance.
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    <div className="group bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl p-6 border border-blue-500/20 hover:border-blue-400/40 transition-all duration-300 transform hover:scale-105">
                        <div className="flex items-center">
                            <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg">
                                <span className="text-2xl">📚</span>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-semibold text-gray-400">Total Manga</p>
                                <p className="text-3xl font-bold text-white">{stats.totalManga}</p>
                            </div>
                        </div>
                        <div className="mt-4">
                            <div className="w-full bg-gray-700 rounded-full h-2">
                                <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full" style={{ width: `${Math.min((stats.totalManga / 10) * 100, 100)}%` }}></div>
                            </div>
                        </div>
                    </div>

                    <div className="group bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl p-6 border border-emerald-500/20 hover:border-emerald-400/40 transition-all duration-300 transform hover:scale-105">
                        <div className="flex items-center">
                            <div className="p-3 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl shadow-lg">
                                <span className="text-2xl">📄</span>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-semibold text-gray-400">Total Chapters</p>
                                <p className="text-3xl font-bold text-white">{stats.totalChapters}</p>
                            </div>
                        </div>
                        <div className="mt-4">
                            <div className="w-full bg-gray-700 rounded-full h-2">
                                <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2 rounded-full" style={{ width: `${Math.min((stats.totalChapters / 50) * 100, 100)}%` }}></div>
                            </div>
                        </div>
                    </div>

                    <div className="group bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl p-6 border border-purple-500/20 hover:border-purple-400/40 transition-all duration-300 transform hover:scale-105">
                        <div className="flex items-center">
                            <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg">
                                <span className="text-2xl">👁️</span>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-semibold text-gray-400">Total Views</p>
                                <p className="text-3xl font-bold text-white">{stats.totalViews.toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="mt-4">
                            <div className="w-full bg-gray-700 rounded-full h-2">
                                <div className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full" style={{ width: `${Math.min((stats.totalViews / 10000) * 100, 100)}%` }}></div>
                            </div>
                        </div>
                    </div>

                    <div className="group bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl p-6 border border-pink-500/20 hover:border-pink-400/40 transition-all duration-300 transform hover:scale-105">
                        <div className="flex items-center">
                            <div className="p-3 bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl shadow-lg">
                                <span className="text-2xl">❤️</span>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-semibold text-gray-400">Total Likes</p>
                                <p className="text-3xl font-bold text-white">{stats.totalLikes.toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="mt-4">
                            <div className="w-full bg-gray-700 rounded-full h-2">
                                <div className="bg-gradient-to-r from-pink-500 to-pink-600 h-2 rounded-full" style={{ width: `${Math.min((stats.totalLikes / 1000) * 100, 100)}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl p-8 mb-12 border border-purple-500/20">
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                        <span className="mr-3">⚡</span>
                        Quick Actions
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Link
                            href="/upload"
                            className="group relative bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white p-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300"
                        >
                            <div className="flex items-center">
                                <div className="p-3 bg-white/20 rounded-lg mr-4">
                                    <span className="text-2xl">📤</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">Upload New Manga</h3>
                                    <p className="text-blue-100 text-sm">Share your latest work</p>
                                </div>
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                        </Link>

                        <Link
                            href="/creator/profile"
                            className="group relative bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white p-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300"
                        >
                            <div className="flex items-center">
                                <div className="p-3 bg-white/20 rounded-lg mr-4">
                                    <span className="text-2xl">👤</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">Edit Profile</h3>
                                    <p className="text-emerald-100 text-sm">Update your creator info</p>
                                </div>
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                        </Link>

                        <Link
                            href="/creator/analytics"
                            className="group relative bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white p-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300"
                        >
                            <div className="flex items-center">
                                <div className="p-3 bg-white/20 rounded-lg mr-4">
                                    <span className="text-2xl">📈</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">View Analytics</h3>
                                    <p className="text-amber-100 text-sm">
                                        {stats.totalManga > 0
                                            ? `Track performance of ${stats.totalManga} manga`
                                            : 'Upload content to see analytics'
                                        }
                                    </p>
                                </div>
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                        </Link>
                    </div>
                </div>

                {/* Recent Manga */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl p-8 border border-purple-500/20">
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                        <span className="mr-3">📚</span>
                        Your Manga Library
                    </h2>
                    {recentManga.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {recentManga.map((manga: any) => (
                                <div key={manga._id} className="group bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-xl p-6 border border-gray-600/50 hover:border-purple-500/50 transition-all duration-300 transform hover:scale-105">
                                    <div className="flex items-start space-x-4">
                                        <img
                                            src={manga.coverImage}
                                            alt={manga.title}
                                            className="w-16 h-20 object-cover rounded-lg shadow-lg"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-white text-lg mb-2 truncate">{manga.title}</h3>
                                            <div className="space-y-1">
                                                <p className="text-sm text-gray-300 flex items-center">
                                                    <span className="mr-2">📄</span>
                                                    {manga.chapterCount} chapters
                                                </p>
                                                <p className="text-sm text-gray-300 flex items-center">
                                                    <span className="mr-2">👁️</span>
                                                    {manga.views.toLocaleString()} views
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex space-x-3 mt-4">
                                        <Link
                                            href={`/manga/${manga._id}`}
                                            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg text-sm font-semibold text-center transition-all duration-300"
                                        >
                                            View
                                        </Link>
                                        <Link
                                            href={`/creator/manga/${manga._id}/edit`}
                                            className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-4 py-2 rounded-lg text-sm font-semibold text-center transition-all duration-300"
                                        >
                                            Edit
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="w-24 h-24 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <span className="text-4xl">📚</span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-4">No Manga Yet</h3>
                            <p className="text-gray-400 mb-6 max-w-md mx-auto">
                                Start your journey as a creator by uploading your first manga and sharing your stories with the world.
                            </p>
                            <Link
                                href="/upload"
                                className="group relative inline-flex items-center bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-2xl transform hover:scale-105 transition-all duration-300"
                            >
                                <span className="relative z-10 flex items-center">
                                    <span className="mr-2">🚀</span>
                                    Upload Your First Manga
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
