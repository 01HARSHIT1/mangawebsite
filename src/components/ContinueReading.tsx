'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FaClock, FaPlay, FaBookOpen, FaArrowRight } from 'react-icons/fa';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

interface ContinueReadingItem {
    mangaId: string;
    mangaTitle: string;
    mangaCover: string;
    mangaCreator: string;
    lastChapterId: string;
    lastChapterNumber: number;
    lastPageNumber?: number;
    lastReadDate: string;
    readingProgress: number;
    totalChapters?: number;
    nextChapterAvailable: boolean;
}

interface ContinueReadingProps {
    limit?: number;
    showHeader?: boolean;
    variant?: 'horizontal' | 'grid';
}

export default function ContinueReading({
    limit = 6,
    showHeader = true,
    variant = 'horizontal'
}: ContinueReadingProps) {
    const { isAuthenticated } = useAuth();
    const [continueReadingList, setContinueReadingList] = useState<ContinueReadingItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isAuthenticated) {
            loadContinueReading();
        } else {
            setLoading(false);
        }
    }, [isAuthenticated]);

    const loadContinueReading = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            if (!token) return;

            // Get user's reading history
            const response = await fetch('/api/profile', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                const user = data.user;

                if (user.readingHistory && user.readingHistory.length > 0) {
                    // Process reading history to get continue reading items
                    const continueItems = await processContinueReading(user.readingHistory.slice(0, limit * 2));
                    setContinueReadingList(continueItems.slice(0, limit));
                }
            }
        } catch (error) {
            console.error('Failed to load continue reading:', error);
        } finally {
            setLoading(false);
        }
    };

    const processContinueReading = async (readingHistory: any[]): Promise<ContinueReadingItem[]> => {
        // Group by manga and get the most recent reading for each
        const mangaMap = new Map();

        readingHistory.forEach(entry => {
            const mangaId = entry.mangaId;
            if (!mangaMap.has(mangaId) || new Date(entry.timestamp) > new Date(mangaMap.get(mangaId).timestamp)) {
                mangaMap.set(mangaId, entry);
            }
        });

        // Load manga details and create continue reading items
        const continuePromises = Array.from(mangaMap.values()).map(async (entry) => {
            try {
                const mangaResponse = await fetch(`/api/manga/${entry.mangaId}`);
                if (!mangaResponse.ok) return null;

                const mangaData = await mangaResponse.json();
                const manga = mangaData.manga;

                // Calculate reading progress
                const totalChapters = manga.chapters?.length || 1;
                const currentChapter = parseInt(entry.chapterId) || 1;
                const readingProgress = Math.round((currentChapter / totalChapters) * 100);

                // Check if next chapter is available
                const nextChapterAvailable = currentChapter < totalChapters;

                return {
                    mangaId: manga._id,
                    mangaTitle: manga.title,
                    mangaCover: manga.coverImage || '/placeholder.svg',
                    mangaCreator: manga.creator,
                    lastChapterId: entry.chapterId || '1',
                    lastChapterNumber: currentChapter,
                    lastPageNumber: entry.pageNumber || 1,
                    lastReadDate: entry.timestamp,
                    readingProgress,
                    totalChapters,
                    nextChapterAvailable
                };
            } catch (error) {
                console.error(`Failed to process continue reading for manga ${entry.mangaId}:`, error);
                return null;
            }
        });

        const results = await Promise.all(continuePromises);
        return results.filter(Boolean).sort((a, b) =>
            new Date(b!.lastReadDate).getTime() - new Date(a!.lastReadDate).getTime()
        );
    };

    const formatTimeAgo = (dateString: string) => {
        const now = new Date();
        const readDate = new Date(dateString);
        const diffInHours = Math.floor((now.getTime() - readDate.getTime()) / (1000 * 60 * 60));

        if (diffInHours < 1) return 'Just now';
        if (diffInHours < 24) return `${diffInHours}h ago`;
        if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
        return `${Math.floor(diffInHours / 168)}w ago`;
    };

    if (!isAuthenticated) {
        return null; // Don't show for unauthenticated users
    }

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
                        ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
                        : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
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

    if (continueReadingList.length === 0) {
        return showHeader ? (
            <div className="text-center py-12">
                <FaBookOpen className="mx-auto text-6xl text-gray-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">No Reading Progress</h3>
                <p className="text-gray-500 mb-6">
                    Start reading some manga to see your progress here!
                </p>
                <Link
                    href="/manga"
                    className="inline-flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                    <FaBookOpen />
                    <span>Browse Manga</span>
                </Link>
            </div>
        ) : null;
    }

    return (
        <div className="space-y-6">
            {showHeader && (
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-full p-2">
                            <FaClock className="text-white text-xl" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">Continue Reading</h2>
                            <p className="text-gray-400 text-sm">Pick up where you left off</p>
                        </div>
                    </div>

                    <Link
                        href="/library"
                        className="flex items-center space-x-2 text-purple-400 hover:text-purple-300 font-medium transition-colors"
                    >
                        <span>View All</span>
                        <FaArrowRight />
                    </Link>
                </div>
            )}

            <div className={`grid gap-6 ${variant === 'grid'
                    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                }`}>
                <AnimatePresence>
                    {continueReadingList.map((item, index) => (
                        <motion.div
                            key={item.mangaId}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ delay: index * 0.1 }}
                            className="group bg-slate-800/50 rounded-2xl overflow-hidden border border-green-500/10 hover:border-green-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/10"
                        >
                            <div className="relative">
                                {/* Cover Image */}
                                <div className="aspect-[3/4] relative overflow-hidden">
                                    <Image
                                        src={item.mangaCover}
                                        alt={item.mangaTitle}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                    />

                                    {/* Progress Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                                    {/* Continue Button */}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <Link
                                            href={`/manga/${item.mangaId}/chapter/${item.nextChapterAvailable ? parseInt(item.lastChapterId) + 1 : item.lastChapterId}`}
                                            className="bg-green-600 hover:bg-green-700 text-white rounded-full p-4 shadow-lg transform scale-90 group-hover:scale-100 transition-transform duration-300"
                                        >
                                            <FaPlay className="text-xl" />
                                        </Link>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="absolute bottom-0 left-0 right-0 p-3">
                                        <div className="bg-black/50 rounded-full p-2">
                                            <div className="w-full bg-gray-600 rounded-full h-2 mb-2">
                                                <div
                                                    className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                                                    style={{ width: `${item.readingProgress}%` }}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between text-xs text-white">
                                                <span>Ch. {item.lastChapterNumber}</span>
                                                <span>{item.readingProgress}%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-4">
                                <Link href={`/manga/${item.mangaId}`}>
                                    <h3 className="text-white font-semibold mb-1 group-hover:text-green-400 transition-colors line-clamp-2">
                                        {item.mangaTitle}
                                    </h3>
                                </Link>
                                <p className="text-gray-400 text-sm mb-2">
                                    by {item.mangaCreator}
                                </p>

                                {/* Reading Status */}
                                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                                    <div className="flex items-center space-x-1">
                                        <FaClock />
                                        <span>{formatTimeAgo(item.lastReadDate)}</span>
                                    </div>
                                    <span>
                                        {item.lastChapterNumber}/{item.totalChapters || '?'} chapters
                                    </span>
                                </div>

                                {/* Action Button */}
                                <Link
                                    href={`/manga/${item.mangaId}/chapter/${item.nextChapterAvailable ? parseInt(item.lastChapterId) + 1 : item.lastChapterId}`}
                                    className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white py-2 px-4 rounded-lg font-medium text-center block transition-all duration-300"
                                >
                                    {item.nextChapterAvailable ? 'Continue Reading' : 'Re-read Chapter'}
                                </Link>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Quick Stats */}
            {showHeader && continueReadingList.length > 0 && (
                <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <FaBookOpen className="text-green-400 text-xl" />
                            <div>
                                <h4 className="text-white font-semibold">Reading Progress</h4>
                                <p className="text-gray-300 text-sm">
                                    You're currently reading {continueReadingList.length} manga
                                </p>
                            </div>
                        </div>
                        <Link
                            href="/library"
                            className="bg-slate-800/50 hover:bg-slate-700/50 text-gray-300 hover:text-white px-4 py-2 rounded-lg text-sm transition-all duration-300"
                        >
                            Manage Library
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}


