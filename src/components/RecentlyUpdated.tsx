'use client';

import { useState, useEffect } from 'react';
import { FaUpload, FaClock, FaEye, FaStar, FaArrowRight, FaCalendarAlt } from 'react-icons/fa';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

interface RecentlyUpdatedManga {
    _id: string;
    title: string;
    creator: string;
    coverImage: string;
    genres: string[];
    rating: number;
    views: number;
    status: string;
    lastChapter: {
        chapterNumber: number;
        title: string;
        uploadDate: string;
        _id: string;
    };
    totalChapters: number;
    isNew: boolean; // New manga (uploaded in last 7 days)
}

interface RecentlyUpdatedProps {
    limit?: number;
    showHeader?: boolean;
    variant?: 'grid' | 'list';
    showOnlyNew?: boolean; // Show only new manga
}

export default function RecentlyUpdated({
    limit = 12,
    showHeader = true,
    variant = 'grid',
    showOnlyNew = false
}: RecentlyUpdatedProps) {
    const [recentManga, setRecentManga] = useState<RecentlyUpdatedManga[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'new' | 'updated'>('all');

    useEffect(() => {
        loadRecentlyUpdated();
    }, [limit, showOnlyNew]);

    const loadRecentlyUpdated = async () => {
        try {
            setLoading(true);

            // Get all manga and sort by most recent updates
            const response = await fetch('/api/manga?sort=updated&limit=' + (limit * 2));

            if (response.ok) {
                const data = await response.json();
                const manga = data.manga || [];

                // Process manga to add recent update information
                const processedManga = await Promise.all(
                    manga.map(async (item: any) => {
                        try {
                            // Get chapters for this manga
                            const chaptersResponse = await fetch(`/api/manga/${item._id}`);
                            if (!chaptersResponse.ok) return null;

                            const mangaDetails = await chaptersResponse.json();
                            const chapters = mangaDetails.chapters || [];

                            if (chapters.length === 0) return null;

                            // Sort chapters by upload date (most recent first)
                            const sortedChapters = chapters.sort((a: any, b: any) =>
                                new Date(b.uploadDate || b.createdAt).getTime() - new Date(a.uploadDate || a.createdAt).getTime()
                            );

                            const lastChapter = sortedChapters[0];
                            const uploadDate = new Date(lastChapter.uploadDate || lastChapter.createdAt);
                            const now = new Date();
                            const daysDiff = Math.floor((now.getTime() - uploadDate.getTime()) / (1000 * 60 * 60 * 24));

                            // Skip if too old (more than 30 days)
                            if (daysDiff > 30) return null;

                            return {
                                _id: item._id,
                                title: item.title,
                                creator: item.creator,
                                coverImage: item.coverImage || '/placeholder.svg',
                                genres: item.genres || [],
                                rating: item.rating || 0,
                                views: item.views || 0,
                                status: item.status || 'ongoing',
                                lastChapter: {
                                    chapterNumber: lastChapter.chapterNumber || 1,
                                    title: lastChapter.title || `Chapter ${lastChapter.chapterNumber || 1}`,
                                    uploadDate: lastChapter.uploadDate || lastChapter.createdAt,
                                    _id: lastChapter._id
                                },
                                totalChapters: chapters.length,
                                isNew: daysDiff <= 7 // New if uploaded in last 7 days
                            };
                        } catch (error) {
                            console.error(`Failed to process manga ${item._id}:`, error);
                            return null;
                        }
                    })
                );

                // Filter out null results and apply filters
                let filteredManga = processedManga.filter(Boolean);

                if (showOnlyNew) {
                    filteredManga = filteredManga.filter(manga => manga!.isNew);
                }

                // Sort by most recent update
                filteredManga.sort((a, b) =>
                    new Date(b!.lastChapter.uploadDate).getTime() - new Date(a!.lastChapter.uploadDate).getTime()
                );

                setRecentManga(filteredManga.slice(0, limit));
            }
        } catch (error) {
            console.error('Failed to load recently updated manga:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatTimeAgo = (dateString: string) => {
        const now = new Date();
        const updateDate = new Date(dateString);
        const diffInHours = Math.floor((now.getTime() - updateDate.getTime()) / (1000 * 60 * 60));

        if (diffInHours < 1) return 'Just updated';
        if (diffInHours < 24) return `${diffInHours}h ago`;
        if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
        return `${Math.floor(diffInHours / 168)}w ago`;
    };

    const filteredManga = recentManga.filter(manga => {
        if (filter === 'new') return manga.isNew;
        if (filter === 'updated') return !manga.isNew;
        return true;
    });

    if (loading) {
        return (
            <div className="space-y-4">
                {showHeader && (
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-600 rounded-full animate-pulse"></div>
                        <div className="h-6 bg-gray-600 rounded w-48 animate-pulse"></div>
                    </div>
                )}
                <div className={`grid gap-4 ${variant === 'grid'
                        ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6'
                        : 'grid-cols-1'
                    }`}>
                    {[...Array(limit)].map((_, i) => (
                        <div key={i} className="bg-slate-800/50 rounded-xl p-4 animate-pulse">
                            <div className="aspect-[3/4] bg-gray-600 rounded-lg mb-3"></div>
                            <div className="space-y-2">
                                <div className="h-4 bg-gray-600 rounded w-3/4"></div>
                                <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (filteredManga.length === 0) {
        return showHeader ? (
            <div className="text-center py-12">
                <FaUpload className="mx-auto text-6xl text-gray-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">No Recent Updates</h3>
                <p className="text-gray-500">
                    {showOnlyNew ? 'No new manga uploaded recently' : 'No manga updates in the last 30 days'}
                </p>
            </div>
        ) : null;
    }

    return (
        <div className="space-y-6">
            {showHeader && (
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-full p-2">
                            <FaUpload className="text-white text-xl" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">
                                {showOnlyNew ? '🆕 New Releases' : '🔄 Recently Updated'}
                            </h2>
                            <p className="text-gray-400 text-sm">
                                {showOnlyNew ? 'Fresh manga just uploaded' : 'Latest chapters and updates'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        {/* Filter buttons */}
                        {!showOnlyNew && (
                            <div className="flex bg-slate-800 rounded-lg p-1">
                                <button
                                    onClick={() => setFilter('all')}
                                    className={`px-3 py-1 rounded text-sm transition-colors ${filter === 'all' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:text-white'
                                        }`}
                                >
                                    All
                                </button>
                                <button
                                    onClick={() => setFilter('new')}
                                    className={`px-3 py-1 rounded text-sm transition-colors ${filter === 'new' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'
                                        }`}
                                >
                                    New
                                </button>
                                <button
                                    onClick={() => setFilter('updated')}
                                    className={`px-3 py-1 rounded text-sm transition-colors ${filter === 'updated' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                                        }`}
                                >
                                    Updated
                                </button>
                            </div>
                        )}

                        <Link
                            href="/manga?sort=updated"
                            className="flex items-center space-x-2 text-orange-400 hover:text-orange-300 font-medium transition-colors"
                        >
                            <span>View All</span>
                            <FaArrowRight />
                        </Link>
                    </div>
                </div>
            )}

            <div className={`grid gap-6 ${variant === 'grid'
                    ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6'
                    : 'grid-cols-1'
                }`}>
                <AnimatePresence>
                    {filteredManga.map((manga, index) => (
                        <motion.div
                            key={manga._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ delay: index * 0.05 }}
                            className="group bg-slate-800/50 rounded-2xl overflow-hidden border border-orange-500/10 hover:border-orange-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/10"
                        >
                            <Link href={`/manga/${manga._id}`}>
                                {/* Cover Image */}
                                <div className="aspect-[3/4] relative overflow-hidden">
                                    <Image
                                        src={manga.coverImage}
                                        alt={manga.title}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                                    />

                                    {/* New Badge */}
                                    {manga.isNew && (
                                        <div className="absolute top-2 left-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center space-x-1">
                                            <span>🆕</span>
                                            <span>NEW</span>
                                        </div>
                                    )}

                                    {/* Update Badge */}
                                    <div className="absolute top-2 right-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                                        Ch.{manga.lastChapter.chapterNumber}
                                    </div>

                                    {/* Update Time */}
                                    <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center space-x-1">
                                        <FaClock />
                                        <span>{formatTimeAgo(manga.lastChapter.uploadDate)}</span>
                                    </div>
                                </div>
                            </Link>

                            {/* Content */}
                            <div className="p-4">
                                <Link href={`/manga/${manga._id}`}>
                                    <h3 className="text-white font-semibold mb-1 group-hover:text-orange-400 transition-colors line-clamp-2">
                                        {manga.title}
                                    </h3>
                                </Link>
                                <p className="text-gray-400 text-sm mb-2">
                                    by {manga.creator}
                                </p>

                                {/* Latest Chapter Info */}
                                <div className="bg-slate-700/50 rounded-lg p-2 mb-3">
                                    <Link
                                        href={`/manga/${manga._id}/chapter/${manga.lastChapter._id}`}
                                        className="block hover:text-orange-400 transition-colors"
                                    >
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-gray-300 font-medium">
                                                Latest: {manga.lastChapter.title}
                                            </span>
                                            <FaCalendarAlt className="text-gray-500" />
                                        </div>
                                    </Link>
                                </div>

                                {/* Stats */}
                                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                                    <div className="flex items-center space-x-1">
                                        <FaStar className="text-yellow-400" />
                                        <span>{manga.rating}</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        <FaEye />
                                        <span>{manga.views.toLocaleString()}</span>
                                    </div>
                                    <span className="capitalize">{manga.status}</span>
                                </div>

                                {/* Action Button */}
                                <Link
                                    href={`/manga/${manga._id}/chapter/${manga.lastChapter._id}`}
                                    className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white py-2 px-4 rounded-lg font-medium text-center block text-sm transition-all duration-300"
                                >
                                    Read Latest
                                </Link>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Stats Footer */}
            {showHeader && filteredManga.length > 0 && (
                <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <FaUpload className="text-orange-400 text-xl" />
                            <div>
                                <h4 className="text-white font-semibold">
                                    {showOnlyNew ? 'New Releases' : 'Recent Activity'}
                                </h4>
                                <p className="text-gray-300 text-sm">
                                    {filteredManga.length} manga {showOnlyNew ? 'released' : 'updated'} recently
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-gray-400">
                                New: {filteredManga.filter(m => m.isNew).length}
                            </div>
                            <div className="text-sm text-gray-400">
                                Updated: {filteredManga.filter(m => !m.isNew).length}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


