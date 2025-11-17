'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import { FaArrowLeft, FaTrash, FaEye, FaEyeSlash, FaEdit, FaFileAlt, FaTimes, FaSave } from 'react-icons/fa';

export const dynamic = 'force-dynamic';

interface Chapter {
    _id: string;
    title: string;
    chapterNumber: number;
    subtitle?: string;
    pageCount: number;
    views: number;
    likes: number;
    status: string;
    coinPrice: number;
    createdAt: string;
    isVisible?: boolean;
}

interface Manga {
    _id: string;
    title: string;
    creator: string;
    creatorId: string;
    coverImage: string;
    status: 'ongoing' | 'completed' | 'hiatus';
    description?: string;
    genre?: string;
    tags?: string[] | string;
}

export default function AdminMangaEditPage() {
    const params = useParams();
    const mangaId = params?.mangaId as string;
    const router = useRouter();
    const { user, isAuthenticated } = useAuth();
    
    const [manga, setManga] = useState<Manga | null>(null);
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingManga, setEditingManga] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        status: 'ongoing' as 'ongoing' | 'completed' | 'hiatus',
        genre: '',
        tags: ''
    });

    useEffect(() => {
        if (!isAuthenticated || user?.role !== 'admin') {
            router.push('/admin/login');
            return;
        }
        if (mangaId) {
            fetchMangaData();
            fetchChapters();
        }
    }, [isAuthenticated, user, mangaId, router]);

    const fetchMangaData = async () => {
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const response = await fetch(`/api/admin/manga`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                const foundManga = data.manga?.find((m: Manga) => m._id === mangaId);
                if (foundManga) {
                    setManga(foundManga);
                    setFormData({
                        title: foundManga.title || '',
                        description: foundManga.description || '',
                        status: foundManga.status || 'ongoing',
                        genre: foundManga.genre || '',
                        tags: Array.isArray(foundManga.tags) ? foundManga.tags.join(', ') : (foundManga.tags || '')
                    });
                }
            }
        } catch (error) {
            console.error('Failed to fetch manga:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchChapters = async () => {
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const response = await fetch(`/api/admin/manga/${mangaId}/chapters`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setChapters(data.chapters || []);
            }
        } catch (error) {
            console.error('Failed to fetch chapters:', error);
        }
    };

    const handleSaveManga = async () => {
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(t => t);
            
            const response = await fetch(`/api/admin/manga/${mangaId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: formData.title,
                    description: formData.description,
                    status: formData.status,
                    genre: formData.genre,
                    tags: tagsArray
                })
            });

            if (response.ok) {
                alert('Manga updated successfully');
                setEditingManga(false);
                fetchMangaData();
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to update manga');
            }
        } catch (error) {
            console.error('Update error:', error);
            alert('Failed to update manga');
        }
    };

    const handleDeleteChapter = async (chapterId: string, chapterNumber: number) => {
        if (!confirm(`Are you sure you want to delete Chapter ${chapterNumber}? This action cannot be undone.`)) {
            return;
        }

        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const response = await fetch(`/api/admin/chapters/${chapterId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                alert('Chapter deleted successfully');
                fetchChapters();
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to delete chapter');
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('Failed to delete chapter');
        }
    };

    const handleToggleChapterVisibility = async (chapterId: string, currentStatus: string) => {
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const newStatus = currentStatus === 'published' ? 'hidden' : 'published';
            
            const response = await fetch(`/api/chapters/${chapterId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                fetchChapters();
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to update chapter status');
            }
        } catch (error) {
            console.error('Toggle visibility error:', error);
            alert('Failed to update chapter status');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
                <div className="text-white text-xl">Loading...</div>
            </div>
        );
    }

    if (!manga) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-white mb-4">Manga Not Found</h1>
                    <Link href="/admin/content" className="text-purple-400 hover:text-purple-300">
                        ← Back to Content Management
                    </Link>
                </div>
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
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                                Edit Manga: {manga.title}
                            </h1>
                            <p className="text-gray-300">Creator: {manga.creator}</p>
                        </div>
                        {!editingManga && (
                            <button
                                onClick={() => setEditingManga(true)}
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-colors flex items-center gap-2"
                            >
                                <FaEdit /> Edit Details
                            </button>
                        )}
                    </div>
                </div>

                {/* Edit Form */}
                {editingManga && (
                    <div className="bg-slate-800/50 rounded-2xl p-6 mb-8 backdrop-blur-sm border border-purple-500/20">
                        <h2 className="text-2xl font-bold mb-4 text-purple-400">Manga Details</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Title</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    rows={4}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    >
                                        <option value="ongoing">Ongoing</option>
                                        <option value="completed">Completed</option>
                                        <option value="hiatus">Hiatus</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Genre</label>
                                    <input
                                        type="text"
                                        value={formData.genre}
                                        onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Tags (comma-separated)</label>
                                <input
                                    type="text"
                                    value={formData.tags}
                                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleSaveManga}
                                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-colors flex items-center gap-2"
                                >
                                    <FaSave /> Save Changes
                                </button>
                                <button
                                    onClick={() => {
                                        setEditingManga(false);
                                        fetchMangaData();
                                    }}
                                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold transition-colors flex items-center gap-2"
                                >
                                    <FaTimes /> Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Chapters Section */}
                <div className="bg-slate-800/50 rounded-2xl p-6 backdrop-blur-sm border border-purple-500/20">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-purple-400">
                            Chapters ({chapters.length})
                        </h2>
                        <button
                            onClick={fetchChapters}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
                        >
                            Refresh
                        </button>
                    </div>

                    {chapters.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <FaFileAlt className="text-6xl mx-auto mb-4 opacity-50" />
                            <p>No chapters found</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {chapters.map((chapter) => (
                                <div
                                    key={chapter._id}
                                    className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 hover:border-purple-500/50 transition-all"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-sm font-semibold text-purple-400">
                                                    Ch. {chapter.chapterNumber}
                                                </span>
                                                {chapter.coinPrice > 0 && (
                                                    <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">
                                                        {chapter.coinPrice} coins
                                                    </span>
                                                )}
                                                {chapter.status === 'hidden' && (
                                                    <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">
                                                        Hidden
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="font-semibold text-white mb-1">{chapter.title}</h3>
                                            {chapter.subtitle && (
                                                <p className="text-sm text-gray-400 mb-2">{chapter.subtitle}</p>
                                            )}
                                            <div className="flex items-center gap-3 text-xs text-gray-500">
                                                <span>{chapter.pageCount} pages</span>
                                                <span>{chapter.views} views</span>
                                                <span>{chapter.likes} likes</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 mt-3">
                                        <button
                                            onClick={() => handleToggleChapterVisibility(chapter._id, chapter.status)}
                                            className={`flex-1 px-3 py-2 rounded text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                                                chapter.status === 'hidden'
                                                    ? 'bg-green-600 hover:bg-green-700'
                                                    : 'bg-yellow-600 hover:bg-yellow-700'
                                            }`}
                                            title={chapter.status === 'hidden' ? 'Show Chapter' : 'Hide Chapter'}
                                        >
                                            {chapter.status === 'hidden' ? <FaEye /> : <FaEyeSlash />}
                                            {chapter.status === 'hidden' ? 'Show' : 'Hide'}
                                        </button>
                                        <button
                                            onClick={() => handleDeleteChapter(chapter._id, chapter.chapterNumber)}
                                            className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded text-sm font-semibold transition-colors flex items-center gap-2"
                                            title="Delete Chapter"
                                        >
                                            <FaTrash /> Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

