'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Trash2, Upload, Film, Image as ImageIcon, Settings } from 'lucide-react';
import Link from 'next/link';

interface AnimeSeries {
    _id: string;
    title: string;
    coverImage: string;
    rating: number;
    status: string;
    episodeCount: number;
    createdAt: string;
}

export default function AdminAnimePage() {
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();
    const [animeList, setAnimeList] = useState<AnimeSeries[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'series' | 'episodes' | 'upload'>('series');

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }

        if (user?.role !== 'admin' && user?.role !== 'creator') {
            router.push('/');
            return;
        }

        loadAnimeSeries();
    }, [isAuthenticated, user, router]);

    const loadAnimeSeries = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch('/api/anime/browse', {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });

            if (response.ok) {
                const data = await response.json();
                setAnimeList(data.anime || []);
            }
        } catch (error) {
            console.error('Error loading anime:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'creator')) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-red-400 mb-2">Anime Content Management</h1>
                        <p className="text-gray-400">Manage anime series, episodes, and content</p>
                    </div>
                    <Link
                        href="/admin/anime/new"
                        className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-semibold transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Add New Series</span>
                    </Link>
                </div>

                {/* Tabs */}
                <div className="flex space-x-4 mb-6 border-b border-gray-700">
                    <button
                        onClick={() => setActiveTab('series')}
                        className={`pb-4 px-4 font-semibold transition-colors ${
                            activeTab === 'series' ? 'text-red-400 border-b-2 border-red-500' : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        Series
                    </button>
                    <button
                        onClick={() => setActiveTab('episodes')}
                        className={`pb-4 px-4 font-semibold transition-colors ${
                            activeTab === 'episodes' ? 'text-red-400 border-b-2 border-red-500' : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        Episodes
                    </button>
                    <button
                        onClick={() => setActiveTab('upload')}
                        className={`pb-4 px-4 font-semibold transition-colors ${
                            activeTab === 'upload' ? 'text-red-400 border-b-2 border-red-500' : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        Upload Content
                    </button>
                </div>

                {/* Content */}
                {activeTab === 'series' && (
                    <div className="bg-gray-900 rounded-lg p-6">
                        <h2 className="text-2xl font-bold mb-6">Anime Series</h2>
                        {loading ? (
                            <div className="flex justify-center items-center py-20">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
                            </div>
                        ) : animeList.length === 0 ? (
                            <div className="text-center py-20">
                                <Film className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                                <p className="text-gray-400 text-lg mb-4">No anime series found</p>
                                <Link
                                    href="/admin/anime/new"
                                    className="inline-flex items-center space-x-2 bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-semibold transition-colors"
                                >
                                    <Plus className="w-5 h-5" />
                                    <span>Add Your First Series</span>
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {animeList.map((anime) => (
                                    <div key={anime._id} className="bg-gray-800 rounded-lg overflow-hidden hover:shadow-xl transition-shadow">
                                        <div className="relative h-64">
                                            <img
                                                src={anime.coverImage}
                                                alt={anime.title}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="p-4">
                                            <h3 className="text-xl font-bold mb-2 line-clamp-1">{anime.title}</h3>
                                            <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                                                <span>⭐ {anime.rating?.toFixed(1) || 'N/A'}</span>
                                                <span>{anime.episodeCount || 0} Episodes</span>
                                                <span className="capitalize">{anime.status}</span>
                                            </div>
                                            <div className="flex space-x-2">
                                                <Link
                                                    href={`/admin/anime/${anime._id}/edit`}
                                                    className="flex-1 flex items-center justify-center space-x-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded transition-colors"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                    <span>Edit</span>
                                                </Link>
                                                <button
                                                    className="flex-1 flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    <span>Delete</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'episodes' && (
                    <div className="bg-gray-900 rounded-lg p-6">
                        <h2 className="text-2xl font-bold mb-6">Episodes Management</h2>
                        <p className="text-gray-400">Select a series to manage its episodes</p>
                    </div>
                )}

                {activeTab === 'upload' && (
                    <div className="bg-gray-900 rounded-lg p-6">
                        <h2 className="text-2xl font-bold mb-6">Upload Content</h2>
                        <p className="text-gray-400 mb-6">Upload video files, images, and metadata</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Link
                                href="/admin/anime/upload/series"
                                className="flex items-center space-x-4 p-6 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                <ImageIcon className="w-12 h-12 text-red-400" />
                                <div>
                                    <h3 className="text-lg font-semibold">Upload Series Assets</h3>
                                    <p className="text-sm text-gray-400">Cover images, banners, posters</p>
                                </div>
                            </Link>
                            <Link
                                href="/admin/anime/upload/episode"
                                className="flex items-center space-x-4 p-6 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                <Film className="w-12 h-12 text-red-400" />
                                <div>
                                    <h3 className="text-lg font-semibold">Upload Episode Video</h3>
                                    <p className="text-sm text-gray-400">Video files and subtitles</p>
                                </div>
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

