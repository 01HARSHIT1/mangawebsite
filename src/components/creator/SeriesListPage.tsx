'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
    FaPlus, FaEdit, FaTrash, FaEye, FaHeart, FaBook, 
    FaSearch, FaFilter, FaSort, FaChartLine
} from 'react-icons/fa';
import Image from 'next/image';
import DashboardLayout from './DashboardLayout';

interface Series {
    _id: string;
    title: string;
    description: string;
    coverImage: string;
    status: string;
    genres: string[];
    views: number;
    likes: number;
    chapterCount: number;
    createdAt: string;
    updatedAt: string;
}

export default function SeriesListPage() {
    const [series, setSeries] = useState<Series[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');
    const [sortBy, setSortBy] = useState<'recent' | 'views' | 'likes'>('recent');

    useEffect(() => {
        fetchSeries();
    }, []);

    const fetchSeries = async () => {
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const response = await fetch('/api/creator/dashboard', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                const normalized = Array.isArray(data.series) ? data.series : data.recentManga || [];
                setSeries(normalized);
            }
        } catch (error) {
            console.error('Error fetching series:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredSeries = series
        .filter(s => {
            if (filterStatus !== 'all' && s.status !== filterStatus) return false;
            if (searchQuery && !s.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            return true;
        })
        .sort((a, b) => {
            if (sortBy === 'views') return (b.views || 0) - (a.views || 0);
            if (sortBy === 'likes') return (b.likes || 0) - (a.likes || 0);
            return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
        });

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">My Series</h1>
                        <p className="text-gray-400">Manage your manga library</p>
                    </div>

                    <Link
                        href="/creator/dashboard/upload"
                        className="mt-4 md:mt-0 inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all duration-300 hover:scale-105"
                    >
                        <FaPlus />
                        <span>Create New Series</span>
                    </Link>
                </div>

                {/* Filters & Search */}
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 backdrop-blur-sm">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Search */}
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search series..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="relative">
                            <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value as any)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-purple-500 appearance-none cursor-pointer"
                            >
                                <option value="all">All Status</option>
                                <option value="published">Published</option>
                                <option value="draft">Draft</option>
                            </select>
                        </div>

                        {/* Sort */}
                        <div className="relative">
                            <FaSort className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-purple-500 appearance-none cursor-pointer"
                            >
                                <option value="recent">Most Recent</option>
                                <option value="views">Most Views</option>
                                <option value="likes">Most Likes</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Series Count */}
                <div className="flex items-center justify-between">
                    <p className="text-gray-400">
                        Showing <span className="text-white font-semibold">{filteredSeries.length}</span> of <span className="text-white font-semibold">{series.length}</span> series
                    </p>
                </div>

                {/* Series Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-slate-800/50 rounded-xl p-6 animate-pulse">
                                <div className="w-full h-48 bg-slate-700 rounded-lg mb-4"></div>
                                <div className="h-6 bg-slate-700 rounded mb-2"></div>
                                <div className="h-4 bg-slate-700 rounded w-2/3"></div>
                            </div>
                        ))}
                    </div>
                ) : filteredSeries.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredSeries.map((s, index) => (
                            <motion.div
                                key={s._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="group bg-slate-800/50 rounded-xl overflow-hidden border border-slate-700/50 hover:border-purple-500/50 transition-all duration-300 hover:scale-105"
                            >
                                {/* Cover Image */}
                                <div className="relative aspect-[3/4] overflow-hidden">
                                    <Image
                                        src={s.coverImage || '/placeholder.svg'}
                                        alt={s.title}
                                        fill
                                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    
                                    {/* Status Badge */}
                                    <div className="absolute top-3 left-3">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                            s.status === 'published' 
                                                ? 'bg-green-500 text-white' 
                                                : 'bg-yellow-500 text-black'
                                        }`}>
                                            {s.status}
                                        </span>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-4">
                                    <h3 className="font-bold text-white text-lg mb-2 truncate">{s.title}</h3>
                                    <p className="text-sm text-gray-400 mb-4 line-clamp-2">{s.description}</p>

                                    {/* Stats */}
                                    <div className="flex items-center space-x-4 text-sm text-gray-400 mb-4">
                                        <span className="flex items-center">
                                            <FaBook className="mr-1" />
                                            {s.chapterCount || 0}
                                        </span>
                                        <span className="flex items-center">
                                            <FaEye className="mr-1" />
                                            {(s.views || 0).toLocaleString()}
                                        </span>
                                        <span className="flex items-center">
                                            <FaHeart className="mr-1 text-pink-400" />
                                            {(s.likes || 0).toLocaleString()}
                                        </span>
                                    </div>

                                    {/* Actions */}
                                    <div className="grid grid-cols-3 gap-2">
                                        <Link
                                            href={`/manga/${s._id}`}
                                            className="flex items-center justify-center space-x-1 bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
                                        >
                                            <FaEye className="text-xs" />
                                            <span>View</span>
                                        </Link>
                                        <Link
                                            href={`/creator/dashboard/series/${s._id}`}
                                            className="flex items-center justify-center space-x-1 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
                                        >
                                            <FaEdit className="text-xs" />
                                            <span>Edit</span>
                                        </Link>
                                        <Link
                                            href={`/creator/dashboard/series/${s._id}/analytics`}
                                            className="flex items-center justify-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
                                        >
                                            <FaChartLine className="text-xs" />
                                            <span>Stats</span>
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-slate-800/30 rounded-2xl border border-slate-700/50">
                        <div className="text-6xl mb-4">📚</div>
                        <h3 className="text-xl font-bold text-white mb-2">No Series Found</h3>
                        <p className="text-gray-400 mb-6">
                            {searchQuery || filterStatus !== 'all' 
                                ? 'Try adjusting your filters'
                                : 'Create your first manga series to get started!'
                            }
                        </p>
                        {!searchQuery && filterStatus === 'all' && (
                            <Link
                                href="/creator/dashboard/upload"
                                className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all duration-300"
                            >
                                <FaPlus />
                                <span>Create New Series</span>
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

