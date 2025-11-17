'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import { FaBook, FaSearch, FaFilter, FaEdit, FaTrash, FaEye, FaEyeSlash, FaChartLine, FaUser, FaCheck, FaChevronDown, FaChevronUp, FaFileAlt, FaTimes, FaMoneyBillWave } from 'react-icons/fa';

export const dynamic = 'force-dynamic';

interface Manga {
    _id: string;
    title: string;
    creator: string;
    creatorId: string;
    coverImage: string;
    status: 'ongoing' | 'completed' | 'hiatus';
    chapters: number;
    views: number;
    rating: number;
    createdAt: string;
    description?: string;
    genre?: string;
    tags?: string[] | string;
}

interface Creator {
    _id: string;
    username: string;
}

interface Chapter {
    _id: string;
    title: string;
    chapterNumber: number;
    subtitle?: string;
    description?: string;
    pageCount: number;
    views: number;
    likes: number;
    status: string;
    coinPrice: number;
    createdAt: string;
}

export default function AdminContentManagement() {
    const [manga, setManga] = useState<Manga[]>([]);
    const [creators, setCreators] = useState<Creator[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterCreator, setFilterCreator] = useState<string>('all');
    const [expandedManga, setExpandedManga] = useState<Set<string>>(new Set());
    const [chaptersData, setChaptersData] = useState<Record<string, Chapter[]>>({});
    const [loadingChapters, setLoadingChapters] = useState<Set<string>>(new Set());
    const [editingManga, setEditingManga] = useState<Manga | null>(null);
    const [viewingEarnings, setViewingEarnings] = useState<{creatorId: string; mangaId?: string; chapterId?: string} | null>(null);
    const [earningsData, setEarningsData] = useState<any>(null);
    const [loadingEarnings, setLoadingEarnings] = useState(false);
    const [earningsChapters, setEarningsChapters] = useState<Chapter[]>([]);
    const [selectedEarningsChapterId, setSelectedEarningsChapterId] = useState<string | null>(null);
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

        fetchManga();
        fetchCreators();
    }, [isAuthenticated, user, router]);

    const fetchManga = async () => {
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            if (!token) {
                setLoading(false);
                return;
            }

            const url = new URL('/api/admin/manga', window.location.origin);
            if (filterCreator !== 'all') {
                url.searchParams.append('creatorId', filterCreator);
            }

            const response = await fetch(url.toString(), {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setManga(data.manga || []);
            } else {
                console.error('Failed to fetch manga:', response.statusText);
                setManga([]);
            }
        } catch (error) {
            console.error('Failed to fetch manga:', error);
            setManga([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchCreators = async () => {
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            if (!token) return;

            const response = await fetch('/api/admin/creators', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setCreators(data.creators || []);
            }
        } catch (error) {
            console.error('Failed to fetch creators:', error);
        }
    };

    const fetchChapters = async (mangaId: string) => {
        if (chaptersData[mangaId]) {
            // Already loaded, just toggle
            toggleMangaExpand(mangaId);
            return;
        }

        setLoadingChapters(prev => new Set(prev).add(mangaId));
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            if (!token) return;

            const response = await fetch(`/api/admin/manga/${mangaId}/chapters`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setChaptersData(prev => ({
                    ...prev,
                    [mangaId]: data.chapters || []
                }));
                toggleMangaExpand(mangaId);
            }
        } catch (error) {
            console.error('Failed to fetch chapters:', error);
        } finally {
            setLoadingChapters(prev => {
                const newSet = new Set(prev);
                newSet.delete(mangaId);
                return newSet;
            });
        }
    };

    const toggleMangaExpand = (mangaId: string) => {
        setExpandedManga(prev => {
            const newSet = new Set(prev);
            if (newSet.has(mangaId)) {
                newSet.delete(mangaId);
            } else {
                newSet.add(mangaId);
            }
            return newSet;
        });
    };

    const handleDeleteChapter = async (mangaId: string, chapterId: string, chapterNumber: number) => {
        if (!confirm(`Are you sure you want to delete Chapter ${chapterNumber}? This action cannot be undone.`)) {
            return;
        }

        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const response = await fetch(`/api/admin/chapters/${chapterId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                alert('Chapter deleted successfully');
                // Remove chapter from local state
                setChaptersData(prev => ({
                    ...prev,
                    [mangaId]: (prev[mangaId] || []).filter(ch => ch._id !== chapterId)
                }));
                // Refresh manga list to update chapter count
                fetchManga();
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to delete chapter');
            }
        } catch (error) {
            console.error('Delete chapter error:', error);
            alert('Failed to delete chapter');
        }
    };

    const handleViewEarnings = async (creatorId: string, mangaId?: string, chapterId?: string) => {
        if (!creatorId || creatorId === '' || creatorId === 'undefined') {
            alert('Creator ID is missing. Cannot view earnings.');
            return;
        }

        setViewingEarnings({ creatorId, mangaId, chapterId });
        setSelectedEarningsChapterId(chapterId || null);
        setLoadingEarnings(true);

        // Fetch chapters if mangaId is provided
        if (mangaId && !chapterId) {
            try {
                const token = localStorage.getItem('authToken') || localStorage.getItem('token');
                const chaptersResponse = await fetch(`/api/admin/manga/${mangaId}/chapters`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (chaptersResponse.ok) {
                    const chaptersData = await chaptersResponse.json();
                    setEarningsChapters(chaptersData.chapters || []);
                }
            } catch (error) {
                console.error('Failed to fetch chapters:', error);
            }
        } else {
            setEarningsChapters([]);
        }

        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const url = new URL(`/api/admin/creators/${creatorId}/earnings`, window.location.origin);
            url.searchParams.append('period', 'all');
            if (mangaId) url.searchParams.append('mangaId', mangaId);
            if (chapterId) url.searchParams.append('chapterId', chapterId);

            const response = await fetch(url.toString(), {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setEarningsData(data);
            } else {
                const errorData = await response.json();
                alert(errorData.error || 'Failed to fetch earnings');
                setViewingEarnings(null);
            }
        } catch (error) {
            console.error('Failed to fetch earnings:', error);
            alert('Failed to fetch earnings');
            setViewingEarnings(null);
        } finally {
            setLoadingEarnings(false);
        }
    };

    const handleEarningsChapterChange = async (newChapterId: string | null) => {
        if (!viewingEarnings) return;

        setSelectedEarningsChapterId(newChapterId);
        setLoadingEarnings(true);

        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const url = new URL(`/api/admin/creators/${viewingEarnings.creatorId}/earnings`, window.location.origin);
            url.searchParams.append('period', 'all');
            if (viewingEarnings.mangaId) url.searchParams.append('mangaId', viewingEarnings.mangaId);
            if (newChapterId) url.searchParams.append('chapterId', newChapterId);

            const response = await fetch(url.toString(), {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setEarningsData(data);
                // Update viewingEarnings to include new chapterId
                setViewingEarnings({ ...viewingEarnings, chapterId: newChapterId || undefined });
            } else {
                const errorData = await response.json();
                alert(errorData.error || 'Failed to fetch earnings');
            }
        } catch (error) {
            console.error('Failed to fetch earnings:', error);
            alert('Failed to fetch earnings');
        } finally {
            setLoadingEarnings(false);
        }
    };


    const filteredManga = manga.filter(m => {
        const matchesSearch = m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.creator.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || m.status === filterStatus;
        // Compare both creatorId formats (string and ObjectId string)
        const matchesCreator = filterCreator === 'all' || 
            m.creatorId === filterCreator || 
            m.creatorId?.toString() === filterCreator?.toString();

        return matchesSearch && matchesStatus && matchesCreator;
    });

    // Update manga when creator filter changes
    useEffect(() => {
        if (isAuthenticated && user?.role === 'admin') {
            setLoading(true);
            fetchManga();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterCreator]);

    const handleViewCreatorDashboard = (creatorId: string) => {
        // Admin can view creator's dashboard
        console.log('View Creator Dashboard clicked with creatorId:', creatorId);
        if (!creatorId || creatorId === '' || creatorId === 'undefined' || creatorId === 'null') {
            alert('Creator ID is missing. Cannot view creator dashboard. Please check if the manga has an assigned creator.');
            console.error('Invalid creatorId:', creatorId);
            return;
        }
        console.log('Navigating to:', `/admin/creator-view/${creatorId}`);
        router.push(`/admin/creator-view/${creatorId}`);
    };

    const handleEditManga = (mangaId: string) => {
        // Open edit modal
        const mangaToEdit = manga.find(m => m._id === mangaId);
        if (mangaToEdit) {
            setEditingManga(mangaToEdit);
        }
    };

    const handleSaveManga = async (updatedManga: Partial<Manga>) => {
        if (!editingManga) return;

        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const response = await fetch(`/api/admin/manga/${editingManga._id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedManga)
            });

            if (response.ok) {
                alert('Manga updated successfully');
                setEditingManga(null);
                fetchManga();
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to update manga');
            }
        } catch (error) {
            console.error('Update error:', error);
            alert('Failed to update manga');
        }
    };

    const handleDeleteManga = async (mangaId: string) => {
        if (!confirm('Are you sure you want to delete this manga? This action cannot be undone.')) {
            return;
        }

        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const response = await fetch(`/api/admin/manga/${mangaId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                alert('Manga deleted successfully');
                fetchManga();
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to delete manga');
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('Failed to delete manga');
        }
    };

    const handleToggleVisibility = async (mangaId: string, currentStatus: string) => {
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const currentManga = manga.find(m => m._id === mangaId);
            const newStatus = currentManga?.status === 'ongoing' ? 'hiatus' : 'ongoing';

            const response = await fetch(`/api/admin/manga/${mangaId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                alert(`Manga status updated to ${newStatus}`);
                fetchManga();
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to update manga status');
            }
        } catch (error) {
            console.error('Toggle visibility error:', error);
            alert('Failed to update manga status');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
                <div className="text-white text-xl">Loading content...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Content Management
                    </h1>
                    <p className="text-gray-300">Manage all manga and creator content</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-slate-800/50 rounded-2xl p-4 backdrop-blur-sm border border-purple-500/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Total Manga</p>
                                <p className="text-2xl font-bold text-white">{manga.length}</p>
                            </div>
                            <FaBook className="text-purple-400 text-2xl" />
                        </div>
                    </div>
                    <div className="bg-slate-800/50 rounded-2xl p-4 backdrop-blur-sm border border-purple-500/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Ongoing</p>
                                <p className="text-2xl font-bold text-green-400">{manga.filter(m => m.status === 'ongoing').length}</p>
                            </div>
                            <FaEye className="text-green-400 text-2xl" />
                        </div>
                    </div>
                    <div className="bg-slate-800/50 rounded-2xl p-4 backdrop-blur-sm border border-purple-500/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Completed</p>
                                <p className="text-2xl font-bold text-blue-400">{manga.filter(m => m.status === 'completed').length}</p>
                            </div>
                            <FaCheck className="text-blue-400 text-2xl" />
                        </div>
                    </div>
                    <div className="bg-slate-800/50 rounded-2xl p-4 backdrop-blur-sm border border-purple-500/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Total Views</p>
                                <p className="text-2xl font-bold text-yellow-400">{manga.reduce((sum, m) => sum + (m.views || 0), 0).toLocaleString()}</p>
                            </div>
                            <FaChartLine className="text-yellow-400 text-2xl" />
                        </div>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="bg-slate-800/50 rounded-2xl p-4 mb-8 backdrop-blur-sm border border-purple-500/20">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search manga or creator..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                        <div className="flex gap-2">
                            <select
                                value={filterCreator}
                                onChange={(e) => setFilterCreator(e.target.value)}
                                className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="all">All Creators</option>
                                {creators.map(creator => (
                                    <option key={creator._id} value={creator._id}>{creator.username}</option>
                                ))}
                            </select>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="all">All Status</option>
                                <option value="ongoing">Ongoing</option>
                                <option value="completed">Completed</option>
                                <option value="hiatus">Hiatus</option>
                            </select>
                            <button
                                onClick={fetchManga}
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-colors"
                            >
                                Refresh
                            </button>
                        </div>
                    </div>
                </div>

                {/* Manga List */}
                <div className="bg-slate-800/50 rounded-3xl p-6 backdrop-blur-sm border border-purple-500/20">
                    <h2 className="text-2xl font-bold mb-6 text-purple-400">All Manga Content</h2>

                    {filteredManga.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <FaBook className="text-6xl mx-auto mb-4 opacity-50" />
                            <p>No manga found</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredManga.map((m) => {
                                const isExpanded = expandedManga.has(m._id);
                                const chapters = chaptersData[m._id] || [];
                                const isLoadingChapters = loadingChapters.has(m._id);

                                return (
                                    <div
                                        key={m._id}
                                        className="bg-slate-700/50 rounded-2xl p-4 hover:bg-slate-700 transition-all border border-slate-600"
                                    >
                                        <div className="flex items-center gap-4">
                                            {/* Cover Image */}
                                            <div className="relative w-20 h-28 flex-shrink-0">
                                                <Image
                                                    src={m.coverImage || '/placeholder.svg'}
                                                    alt={m.title}
                                                    fill
                                                    className="object-cover rounded-lg"
                                                />
                                            </div>

                                            {/* Manga Info */}
                                            <div className="flex-1">
                                                <h3 className="text-lg font-bold text-white mb-1">{m.title}</h3>
                                                <div className="flex items-center gap-4 text-sm text-gray-400 mb-2">
                                                    <span className="flex items-center gap-1">
                                                        <FaUser className="text-xs" />
                                                        {m.creator}
                                                    </span>
                                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${m.status === 'ongoing' ? 'bg-green-500/20 text-green-400' :
                                                            m.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                                                                'bg-yellow-500/20 text-yellow-400'
                                                        }`}>
                                                        {m.status}
                                                    </span>
                                                    <span>{m.chapters || 0} chapters</span>
                                                    <span>{(m.views || 0).toLocaleString()} views</span>
                                                    {m.rating && <span>⭐ {m.rating.toFixed(1)}</span>}
                                                </div>
                                                <p className="text-xs text-gray-500">
                                                    Created: {new Date(m.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => fetchChapters(m._id)}
                                                    className="p-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                                                    title="View Chapters"
                                                >
                                                    {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                                                </button>
                                                <button
                                                    onClick={() => handleViewEarnings(m.creatorId, m._id)}
                                                    className="p-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors"
                                                    title="View Earnings"
                                                >
                                                    <FaMoneyBillWave />
                                                </button>
                                                <button
                                                    onClick={() => handleViewCreatorDashboard(m.creatorId)}
                                                    className="p-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                                                    title="View Creator Dashboard"
                                                >
                                                    <FaChartLine />
                                                </button>
                                                <Link
                                                    href={`/manga/${m._id}`}
                                                    className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                                                    title="View Manga"
                                                >
                                                    <FaEye />
                                                </Link>
                                                <button
                                                    onClick={() => handleEditManga(m._id)}
                                                    className="p-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                                                    title="Edit Manga"
                                                >
                                                    <FaEdit />
                                                </button>
                                                <button
                                                    onClick={() => handleToggleVisibility(m._id, 'published')}
                                                    className="p-2 bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors"
                                                    title="Toggle Visibility"
                                                >
                                                    <FaEyeSlash />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteManga(m._id)}
                                                    className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                                                    title="Delete Manga"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Chapters Section */}
                                        {isExpanded && (
                                            <div className="mt-4 pt-4 border-t border-slate-600">
                                                {isLoadingChapters ? (
                                                    <div className="text-center py-8 text-gray-400">
                                                        Loading chapters...
                                                    </div>
                                                ) : chapters.length === 0 ? (
                                                    <div className="text-center py-8 text-gray-400">
                                                        <FaFileAlt className="text-4xl mx-auto mb-2 opacity-50" />
                                                        <p>No chapters found</p>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2">
                                                        <h4 className="text-sm font-semibold text-purple-400 mb-3">
                                                            Chapters ({chapters.length})
                                                        </h4>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                                            {chapters.map((chapter) => (
                                                                <div
                                                                    key={chapter._id}
                                                                    className="bg-slate-800/50 rounded-lg p-3 border border-slate-600 hover:border-purple-500/50 transition-all"
                                                                >
                                                                    <div className="flex items-start justify-between gap-2">
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex items-center gap-2 mb-1">
                                                                                <span className="text-xs font-semibold text-purple-400">
                                                                                    Ch. {chapter.chapterNumber}
                                                                                </span>
                                                                                {chapter.coinPrice > 0 && (
                                                                                    <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">
                                                                                        {chapter.coinPrice} coins
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            <p className="text-sm text-white font-medium truncate">
                                                                                {chapter.title}
                                                                            </p>
                                                                            {chapter.subtitle && (
                                                                                <p className="text-xs text-gray-400 truncate mt-1">
                                                                                    {chapter.subtitle}
                                                                                </p>
                                                                            )}
                                                                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                                                                                <span>{chapter.pageCount} pages</span>
                                                                                <span>{chapter.views} views</span>
                                                                                <span>{chapter.likes} likes</span>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex gap-1">
                                                                            <button
                                                                                onClick={() => handleViewEarnings(m.creatorId, m._id, chapter._id)}
                                                                                className="p-1.5 bg-yellow-600/20 hover:bg-yellow-600/40 rounded text-yellow-400 transition-colors flex-shrink-0"
                                                                                title="View Chapter Earnings"
                                                                            >
                                                                                <FaMoneyBillWave className="text-xs" />
                                                                            </button>
                                                                            <button
                                                                                onClick={() => handleDeleteChapter(m._id, chapter._id, chapter.chapterNumber)}
                                                                                className="p-1.5 bg-red-600/20 hover:bg-red-600/40 rounded text-red-400 transition-colors flex-shrink-0"
                                                                                title="Delete Chapter"
                                                                            >
                                                                                <FaTrash className="text-xs" />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Manga Modal */}
            {editingManga && (
                <EditMangaModal
                    manga={editingManga}
                    onSave={handleSaveManga}
                    onClose={() => setEditingManga(null)}
                />
            )}

            {/* Earnings Modal */}
            {viewingEarnings && (
                <EarningsModal
                    earnings={earningsData}
                    loading={loadingEarnings}
                    creatorId={viewingEarnings.creatorId}
                    mangaId={viewingEarnings.mangaId}
                    chapterId={viewingEarnings.chapterId}
                    chapters={earningsChapters}
                    selectedChapterId={selectedEarningsChapterId}
                    onChapterChange={handleEarningsChapterChange}
                    onClose={() => {
                        setViewingEarnings(null);
                        setEarningsData(null);
                        setEarningsChapters([]);
                        setSelectedEarningsChapterId(null);
                    }}
                />
            )}
        </div>
    );
}

function EditMangaModal({ manga, onSave, onClose }: {
    manga: Manga;
    onSave: (updatedManga: Partial<Manga>) => void;
    onClose: () => void;
}) {
    const [formData, setFormData] = useState({
        title: manga.title || '',
        description: (manga as any).description || '',
        status: manga.status || 'ongoing',
        genre: (manga as any).genre || '',
        tags: Array.isArray((manga as any).tags) ? (manga as any).tags.join(', ') : ((manga as any).tags || '')
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(t => t);
        onSave({
            title: formData.title,
            description: formData.description,
            status: formData.status as 'ongoing' | 'completed' | 'hiatus',
            genre: formData.genre,
            tags: tagsArray
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-purple-400">Edit Manga: {manga.title}</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <FaTimes className="text-xl" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Title</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            required
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
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
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
                                placeholder="e.g., Action, Romance"
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
                            placeholder="tag1, tag2, tag3"
                        />
                    </div>

                    <div className="flex gap-2 pt-4">
                        <button
                            type="submit"
                            className="flex-1 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-semibold transition-colors"
                        >
                            Save Changes
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg font-semibold transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function EarningsModal({ 
    earnings, 
    loading, 
    creatorId, 
    mangaId, 
    chapterId, 
    chapters,
    selectedChapterId,
    onChapterChange,
    onClose 
}: { 
    earnings: any; 
    loading: boolean; 
    creatorId: string; 
    mangaId?: string; 
    chapterId?: string; 
    chapters?: Chapter[];
    selectedChapterId?: string | null;
    onChapterChange?: (chapterId: string | null) => void;
    onClose: () => void;
}) {
    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-slate-800 rounded-2xl p-6 max-w-2xl w-full">
                    <div className="text-white text-center">Loading earnings data...</div>
                </div>
            </div>
        );
    }

    if (!earnings) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-slate-800 rounded-2xl p-6 max-w-2xl w-full">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-purple-400">Earnings</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            <FaTimes className="text-xl" />
                        </button>
                    </div>
                    <div className="text-gray-400 text-center py-8">No earnings data available</div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-purple-400">
                        Earnings {mangaId ? '(Manga)' : chapterId || selectedChapterId ? '(Chapter)' : '(Creator)'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <FaTimes className="text-xl" />
                    </button>
                </div>

                {/* Chapter Selector - Only show if mangaId is provided and chapters are available */}
                {mangaId && chapters && chapters.length > 0 && onChapterChange && (
                    <div className="mb-6 bg-slate-700/50 rounded-lg p-4 border border-purple-500/20">
                        <label className="block text-sm text-gray-400 mb-2">
                            <FaFileAlt className="inline mr-2" /> Filter by Chapter
                        </label>
                        <select
                            value={selectedChapterId || 'all'}
                            onChange={(e) => {
                                const chapterId = e.target.value === 'all' ? null : e.target.value;
                                onChapterChange(chapterId);
                            }}
                            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="all">All Chapters (Total Manga Earnings)</option>
                            {chapters.map((chapter) => (
                                <option key={chapter._id} value={chapter._id}>
                                    Chapter {chapter.chapterNumber}: {chapter.title}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-2">
                            Select a specific chapter to view its individual earnings
                        </p>
                    </div>
                )}

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-slate-700/50 rounded-lg p-4 border border-purple-500/20">
                        <p className="text-gray-400 text-sm mb-1">Total Earnings</p>
                        <p className="text-2xl font-bold text-purple-400">
                            ₹{earnings.totalEarnings?.toLocaleString() || '0'}
                        </p>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-4 border border-purple-500/20">
                        <p className="text-gray-400 text-sm mb-1">Total Donations</p>
                        <p className="text-2xl font-bold text-green-400">
                            {earnings.totalDonations || 0}
                        </p>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-4 border border-purple-500/20">
                        <p className="text-gray-400 text-sm mb-1">Weekly</p>
                        <p className="text-2xl font-bold text-yellow-400">
                            ₹{earnings.periodSummaries?.weekly?.total?.toLocaleString() || '0'}
                        </p>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-4 border border-purple-500/20">
                        <p className="text-gray-400 text-sm mb-1">Monthly</p>
                        <p className="text-2xl font-bold text-blue-400">
                            ₹{earnings.periodSummaries?.monthly?.total?.toLocaleString() || '0'}
                        </p>
                    </div>
                </div>

                {/* Earnings by Manga */}
                {earnings.earningsByManga && earnings.earningsByManga.length > 0 && (
                    <div className="mb-6">
                        <h3 className="text-xl font-bold text-white mb-4">Earnings by Manga</h3>
                        <div className="space-y-3">
                            {earnings.earningsByManga.map((manga: any) => (
                                <div key={manga.mangaId} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="font-semibold text-white">{manga.mangaTitle}</h4>
                                            <p className="text-sm text-gray-400">
                                                {manga.chapterCount} chapters • {manga.donationCount} donations
                                            </p>
                                        </div>
                                        <p className="text-xl font-bold text-purple-400">
                                            ₹{manga.totalEarnings?.toLocaleString() || '0'}
                                        </p>
                                    </div>
                                    {manga.chapters && manga.chapters.length > 0 && (
                                        <div className="mt-3 space-y-2">
                                            {manga.chapters.map((chapter: any) => (
                                                <div key={chapter.chapterId} className="bg-slate-800/50 rounded p-2 flex justify-between items-center">
                                                    <span className="text-sm text-gray-300">
                                                        Ch. {chapter.chapterNumber}: {chapter.chapterTitle}
                                                    </span>
                                                    <span className="text-sm font-semibold text-yellow-400">
                                                        ₹{chapter.totalEarnings?.toLocaleString() || '0'} ({chapter.donationCount || 0} donations)
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Recent Donations */}
                {earnings.recentDonations && earnings.recentDonations.length > 0 && (
                    <div>
                        <h3 className="text-xl font-bold text-white mb-4">Recent Donations</h3>
                        <div className="space-y-2">
                            {earnings.recentDonations.slice(0, 10).map((donation: any, index: number) => (
                                <div key={index} className="bg-slate-700/50 rounded-lg p-3 border border-slate-600 flex justify-between items-center">
                                    <div>
                                        <p className="text-sm text-white">
                                            {donation.message || 'No message'}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {new Date(donation.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <p className="text-lg font-bold text-green-400">
                                        ₹{donation.amount?.toLocaleString() || '0'}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="mt-6 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
