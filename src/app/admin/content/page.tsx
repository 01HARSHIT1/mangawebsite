'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import { FaBook, FaSearch, FaFilter, FaEdit, FaTrash, FaEye, FaEyeSlash, FaChartLine, FaUser, FaCheck } from 'react-icons/fa';

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
}

export default function AdminContentManagement() {
    const [manga, setManga] = useState<Manga[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
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
    }, [isAuthenticated, user, router]);

    const fetchManga = async () => {
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            if (!token) {
                setLoading(false);
                return;
            }

            const response = await fetch('/api/admin/manga', {
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


    const filteredManga = manga.filter(m => {
        const matchesSearch = m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.creator.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || m.status === filterStatus;

        return matchesSearch && matchesStatus;
    });

    const handleViewCreatorDashboard = (creatorId: string) => {
        // Admin can view creator's dashboard
        router.push(`/admin/creator/${creatorId}`);
    };

    const handleEditManga = (mangaId: string) => {
        // Admin can edit any manga
        router.push(`/admin/manga/${mangaId}/edit`);
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

                {/* Filters */}
                <div className="bg-slate-800/50 rounded-3xl p-6 backdrop-blur-sm mb-8 border border-purple-500/20">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Search */}
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search manga or creator..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="relative">
                            <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="all">All Status</option>
                                <option value="ongoing">Ongoing</option>
                                <option value="completed">Completed</option>
                                <option value="hiatus">Hiatus</option>
                            </select>
                        </div>

                        <div className="text-right">
                            <button
                                onClick={fetchManga}
                                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-colors"
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
                            {filteredManga.map((m) => (
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
                                                className="p-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors"
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
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
