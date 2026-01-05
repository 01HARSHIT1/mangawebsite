"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { Clock, Play } from 'lucide-react';
import { motion } from 'framer-motion';

interface WatchHistoryItem {
    _id: string;
    seriesId: string;
    episodeId: string;
    lastPosition: number;
    watchedDuration: number;
    completed: boolean;
    lastWatchedAt: string;
    series?: {
        _id: string;
        title: string;
        coverImage: string;
    };
    episode?: {
        _id: string;
        episodeNumber: number;
        title: string;
    };
}

interface ContinueWatchingProps {
    limit?: number;
}

export default function ContinueWatching({ limit = 12 }: ContinueWatchingProps) {
    const { isAuthenticated } = useAuth();
    const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isAuthenticated) {
            loadWatchHistory();
        } else {
            setLoading(false);
        }
    }, [isAuthenticated]);

    const loadWatchHistory = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch('/api/anime/watch-history', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                const history = data.watchHistory || [];

                // Fetch series details for each item
                const historyWithDetails = await Promise.all(
                    history.map(async (item: WatchHistoryItem) => {
                        try {
                            const seriesRes = await fetch(`/api/anime/${item.seriesId}`);
                            if (seriesRes.ok) {
                                const seriesData = await seriesRes.json();
                                return {
                                    ...item,
                                    series: seriesData.series,
                                };
                            }
                        } catch (error) {
                            console.error('Failed to load series:', error);
                        }
                        return item;
                    })
                );

                setWatchHistory(historyWithDetails.filter((item: any) => item.series).slice(0, limit));
            }
        } catch (error) {
            console.error('Failed to load watch history:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isAuthenticated) {
        return null;
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[200px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
            </div>
        );
    }

    if (watchHistory.length === 0) {
        return null;
    }

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    };

    const getProgress = (item: WatchHistoryItem) => {
        // Estimate progress based on last position (would need episode duration for accurate %)
        return Math.min(90, Math.max(10, (item.lastPosition / 1800) * 100)); // Rough estimate
    };

    return (
        <section className="mb-16">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                    <Clock className="w-6 h-6 text-orange-400" />
                    <h2 className="text-3xl font-bold text-white">Continue Watching</h2>
                </div>
                <Link
                    href="/anime/library"
                    className="text-orange-400 hover:text-orange-300 transition-colors font-semibold"
                >
                    View All
                </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {watchHistory.map((item) => (
                    <motion.div
                        key={item._id}
                        className="relative group cursor-pointer"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Link href={`/anime/${item.seriesId}?episode=${item.episode?.episodeNumber || 1}`}>
                            <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-800">
                                {item.series?.coverImage && (
                                    <Image
                                        src={item.series.coverImage}
                                        alt={item.series.title}
                                        fill
                                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                                    />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                
                                {/* Progress bar */}
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
                                    <div 
                                        className="h-full bg-red-500 transition-all"
                                        style={{ width: `${getProgress(item)}%` }}
                                    />
                                </div>

                                {/* Play overlay */}
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="bg-red-600 rounded-full p-4">
                                        <Play className="w-6 h-6 text-white" fill="white" />
                                    </div>
                                </div>

                                {/* Episode info */}
                                {item.episode && (
                                    <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-md">
                                        EP {item.episode.episodeNumber}
                                    </div>
                                )}
                            </div>
                            <div className="mt-2">
                                <h3 className="text-sm font-semibold text-white line-clamp-1">
                                    {item.series?.title}
                                </h3>
                                <p className="text-xs text-gray-400 mt-1">
                                    {item.completed ? 'Completed' : `Resume at ${formatTime(item.lastPosition)}`}
                                </p>
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}

