'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
    FaStar, FaFire, FaEye, FaEyeSlash, FaBan, FaArrowUp, FaArrowDown,
    FaSearch, FaFilter, FaEdit, FaSave, FaTimes, FaCheckCircle
} from 'react-icons/fa';
import { motion } from 'framer-motion';

interface AnimeVisibility {
    _id: string;
    title: string;
    coverImage: string;
    rating: number;
    episodeCount: number;
    status: string;
    isFeatured: boolean;
    isTrending: boolean;
    isHidden: boolean;
    isSuppressed: boolean;
    visibilityBoost: number;
    discoverability: 'featured' | 'boosted' | 'normal' | 'suppressed' | 'hidden';
    manualRank: number | null;
    featuredUntil: string | null;
    suppressedUntil: string | null;
}

export default function VisibilityControlsPage() {
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();
    const [anime, setAnime] = useState<AnimeVisibility[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<'all' | 'featured' | 'hidden' | 'suppressed'>('all');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editData, setEditData] = useState<Partial<AnimeVisibility>>({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!isAuthenticated || user?.role !== 'admin') {
            router.push('/admin/login');
            return;
        }
        fetchAnime();
    }, [isAuthenticated, user, router, page, filter]);

    const fetchAnime = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '50',
            });
            if (searchQuery) params.append('search', searchQuery);
            
            const response = await fetch(`/api/admin/anime/visibility?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                let filteredAnime = data.anime || [];
                
                // Apply client-side filter
                if (filter === 'featured') {
                    filteredAnime = filteredAnime.filter((a: AnimeVisibility) => a.isFeatured);
                } else if (filter === 'hidden') {
                    filteredAnime = filteredAnime.filter((a: AnimeVisibility) => a.isHidden);
                } else if (filter === 'suppressed') {
                    filteredAnime = filteredAnime.filter((a: AnimeVisibility) => a.isSuppressed);
                }
                
                setAnime(filteredAnime);
                setTotalPages(data.pagination?.totalPages || 1);
            }
        } catch (error) {
            console.error('Error fetching anime:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveVisibility = async (seriesId: string) => {
        try {
            setSubmitting(true);
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const response = await fetch('/api/admin/anime/visibility', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    seriesId,
                    updates: editData
                })
            });

            if (response.ok) {
                await fetchAnime();
                setEditingId(null);
                setEditData({});
                alert('Visibility controls updated successfully');
            } else {
                const error = await response.json();
                alert(`Error: ${error.error}`);
            }
        } catch (error) {
            console.error('Error updating visibility:', error);
            alert('Failed to update visibility controls');
        } finally {
            setSubmitting(false);
        }
    };

    const handleQuickAction = async (seriesId: string, action: string, value: boolean) => {
        try {
            setSubmitting(true);
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const response = await fetch('/api/admin/anime/visibility', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    seriesId,
                    updates: { [action]: value }
                })
            });

            if (response.ok) {
                await fetchAnime();
                alert(`${action.replace('is', '').replace(/([A-Z])/g, ' $1').trim()} ${value ? 'enabled' : 'disabled'}`);
            } else {
                const error = await response.json();
                alert(`Error: ${error.error}`);
            }
        } catch (error) {
            console.error('Error updating visibility:', error);
            alert('Failed to update visibility');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isAuthenticated || user?.role !== 'admin') {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Recommendation & Visibility Controls</h1>
                        <p className="text-gray-400">Feature anime, boost trending, suppress content, and control discoverability</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                    <div className="flex items-center gap-4">
                        <div className="flex-1 relative">
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search anime..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        setPage(1);
                                        fetchAnime();
                                    }
                                }}
                                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                            />
                        </div>
                        <select
                            value={filter}
                            onChange={(e) => {
                                setFilter(e.target.value as any);
                                setPage(1);
                            }}
                            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                        >
                            <option value="all">All Anime</option>
                            <option value="featured">Featured</option>
                            <option value="hidden">Hidden</option>
                            <option value="suppressed">Suppressed</option>
                        </select>
                        <button
                            onClick={() => {
                                setSearchQuery('');
                                setFilter('all');
                                setPage(1);
                                fetchAnime();
                            }}
                            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white"
                        >
                            Reset
                        </button>
                    </div>
                </div>

                {/* Anime List */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                    </div>
                ) : anime.length === 0 ? (
                    <div className="text-center py-20 bg-gray-900 rounded-lg">
                        <p className="text-gray-400 text-lg">No anime found</p>
                    </div>
                ) : (
                    <>
                        <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-800 border-b border-gray-700">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-sm font-semibold">Anime</th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold">Visibility</th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold">Boost</th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {anime.map((item) => (
                                            <tr
                                                key={item._id}
                                                className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                                            >
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <img
                                                            src={item.coverImage}
                                                            alt={item.title}
                                                            className="w-16 h-24 object-cover rounded"
                                                        />
                                                        <div>
                                                            <div className="font-semibold text-white">{item.title}</div>
                                                            <div className="text-xs text-gray-400">
                                                                {item.episodeCount} episodes • Rating: {item.rating.toFixed(1)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className={`px-2 py-1 rounded text-xs ${
                                                        item.status === 'ongoing' ? 'bg-green-900/50 text-green-300' :
                                                        item.status === 'completed' ? 'bg-blue-900/50 text-blue-300' :
                                                        'bg-gray-900/50 text-gray-300'
                                                    }`}>
                                                        {item.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex flex-wrap gap-2">
                                                        {item.isFeatured && (
                                                            <span className="px-2 py-1 bg-yellow-900/50 text-yellow-300 rounded text-xs flex items-center gap-1">
                                                                <FaStar /> Featured
                                                            </span>
                                                        )}
                                                        {item.isTrending && (
                                                            <span className="px-2 py-1 bg-orange-900/50 text-orange-300 rounded text-xs flex items-center gap-1">
                                                                <FaFire /> Trending
                                                            </span>
                                                        )}
                                                        {item.isHidden && (
                                                            <span className="px-2 py-1 bg-red-900/50 text-red-300 rounded text-xs flex items-center gap-1">
                                                                <FaEyeSlash /> Hidden
                                                            </span>
                                                        )}
                                                        {item.isSuppressed && (
                                                            <span className="px-2 py-1 bg-gray-900/50 text-gray-300 rounded text-xs flex items-center gap-1">
                                                                <FaBan /> Suppressed
                                                            </span>
                                                        )}
                                                        {!item.isFeatured && !item.isTrending && !item.isHidden && !item.isSuppressed && (
                                                            <span className="px-2 py-1 bg-gray-700/50 text-gray-400 rounded text-xs">
                                                                Normal
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        {item.discoverability}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="text-sm font-semibold text-white">
                                                        {item.visibilityBoost > 0 ? `+${item.visibilityBoost}` : item.visibilityBoost}
                                                    </div>
                                                    {item.manualRank && (
                                                        <div className="text-xs text-gray-400">Rank: {item.manualRank}</div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4">
                                                    {editingId === item._id ? (
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => handleSaveVisibility(item._id)}
                                                                disabled={submitting}
                                                                className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm disabled:opacity-50"
                                                            >
                                                                <FaSave />
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setEditingId(null);
                                                                    setEditData({});
                                                                }}
                                                                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
                                                            >
                                                                <FaTimes />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col gap-2">
                                                            <button
                                                                onClick={() => {
                                                                    setEditingId(item._id);
                                                                    setEditData({
                                                                        isFeatured: item.isFeatured,
                                                                        isTrending: item.isTrending,
                                                                        isHidden: item.isHidden,
                                                                        isSuppressed: item.isSuppressed,
                                                                        visibilityBoost: item.visibilityBoost,
                                                                        discoverability: item.discoverability,
                                                                        manualRank: item.manualRank,
                                                                    });
                                                                }}
                                                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm font-semibold flex items-center gap-1"
                                                            >
                                                                <FaEdit />
                                                                Edit
                                                            </button>
                                                            <div className="flex gap-1">
                                                                <button
                                                                    onClick={() => handleQuickAction(item._id, 'isFeatured', !item.isFeatured)}
                                                                    disabled={submitting}
                                                                    className={`px-2 py-1 rounded text-xs disabled:opacity-50 ${item.isFeatured ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-gray-700 hover:bg-gray-600'}`}
                                                                    title="Toggle Featured"
                                                                >
                                                                    <FaStar />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleQuickAction(item._id, 'isHidden', !item.isHidden)}
                                                                    disabled={submitting}
                                                                    className={`px-2 py-1 rounded text-xs disabled:opacity-50 ${item.isHidden ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'}`}
                                                                    title="Toggle Hidden"
                                                                >
                                                                    <FaEyeSlash />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Pagination */}
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-400">
                                Page {page} of {totalPages}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {/* Edit Modal */}
                {editingId && editData && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                        <div className="bg-gray-900 rounded-lg max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold">Edit Visibility Controls</h3>
                                <button
                                    onClick={() => {
                                        setEditingId(null);
                                        setEditData({});
                                    }}
                                    className="text-gray-400 hover:text-white"
                                >
                                    <FaTimes className="w-5 h-5" />
                                </button>
                            </div>

                            {(() => {
                                const item = anime.find(a => a._id === editingId);
                                if (!item) return null;

                                return (
                                    <div className="space-y-4">
                                        <div className="p-4 bg-gray-800 rounded-lg">
                                            <div className="font-semibold text-white mb-2">{item.title}</div>
                                            <img src={item.coverImage} alt={item.title} className="w-32 h-48 object-cover rounded" />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="flex items-center justify-between p-3 bg-gray-800 rounded">
                                                <label className="text-sm font-semibold">Featured</label>
                                                <input
                                                    type="checkbox"
                                                    checked={editData.isFeatured || false}
                                                    onChange={(e) => setEditData({ ...editData, isFeatured: e.target.checked })}
                                                    className="w-5 h-5"
                                                />
                                            </div>

                                            <div className="flex items-center justify-between p-3 bg-gray-800 rounded">
                                                <label className="text-sm font-semibold">Trending</label>
                                                <input
                                                    type="checkbox"
                                                    checked={editData.isTrending || false}
                                                    onChange={(e) => setEditData({ ...editData, isTrending: e.target.checked })}
                                                    className="w-5 h-5"
                                                />
                                            </div>

                                            <div className="flex items-center justify-between p-3 bg-gray-800 rounded">
                                                <label className="text-sm font-semibold">Hidden</label>
                                                <input
                                                    type="checkbox"
                                                    checked={editData.isHidden || false}
                                                    onChange={(e) => setEditData({ ...editData, isHidden: e.target.checked })}
                                                    className="w-5 h-5"
                                                />
                                            </div>

                                            <div className="flex items-center justify-between p-3 bg-gray-800 rounded">
                                                <label className="text-sm font-semibold">Suppressed</label>
                                                <input
                                                    type="checkbox"
                                                    checked={editData.isSuppressed || false}
                                                    onChange={(e) => setEditData({ ...editData, isSuppressed: e.target.checked })}
                                                    className="w-5 h-5"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold mb-2">Discoverability</label>
                                            <select
                                                value={editData.discoverability || 'normal'}
                                                onChange={(e) => setEditData({ ...editData, discoverability: e.target.value as any })}
                                                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                                            >
                                                <option value="featured">Featured</option>
                                                <option value="boosted">Boosted</option>
                                                <option value="normal">Normal</option>
                                                <option value="suppressed">Suppressed</option>
                                                <option value="hidden">Hidden</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold mb-2">
                                                Visibility Boost (0-100)
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={editData.visibilityBoost || 0}
                                                onChange={(e) => setEditData({ ...editData, visibilityBoost: parseInt(e.target.value) || 0 })}
                                                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                                            />
                                            <p className="text-xs text-gray-400 mt-1">
                                                Manual boost score that affects trending algorithm
                                            </p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold mb-2">
                                                Manual Rank (optional, 1 = highest)
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={editData.manualRank || ''}
                                                onChange={(e) => setEditData({ ...editData, manualRank: e.target.value ? parseInt(e.target.value) : null })}
                                                placeholder="Leave empty for auto-ranking"
                                                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                                            />
                                        </div>

                                        {editData.isFeatured && (
                                            <div>
                                                <label className="block text-sm font-semibold mb-2">
                                                    Featured Until (optional)
                                                </label>
                                                <input
                                                    type="date"
                                                    value={editData.featuredUntil ? new Date(editData.featuredUntil).toISOString().split('T')[0] : ''}
                                                    onChange={(e) => setEditData({ ...editData, featuredUntil: e.target.value || null })}
                                                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                                                />
                                            </div>
                                        )}

                                        {editData.isSuppressed && (
                                            <div>
                                                <label className="block text-sm font-semibold mb-2">
                                                    Suppressed Until (optional)
                                                </label>
                                                <input
                                                    type="date"
                                                    value={editData.suppressedUntil ? new Date(editData.suppressedUntil).toISOString().split('T')[0] : ''}
                                                    onChange={(e) => setEditData({ ...editData, suppressedUntil: e.target.value || null })}
                                                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                                                />
                                            </div>
                                        )}

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleSaveVisibility(item._id)}
                                                disabled={submitting}
                                                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                                            >
                                                <FaCheckCircle />
                                                Save Changes
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setEditingId(null);
                                                    setEditData({});
                                                }}
                                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded font-semibold"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
