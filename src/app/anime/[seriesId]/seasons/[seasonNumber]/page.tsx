'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppMode } from '@/contexts/AppModeContext';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Play, Clock, Calendar, Download, Share2, Bookmark, MoreVertical, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';

interface Episode {
    _id: string;
    episodeNumber: number;
    title: string;
    description?: string;
    thumbnail?: string;
    duration?: number;
    airDate?: string;
    releaseDate?: string;
    isPreview?: boolean;
    watched?: boolean;
    watchedPercentage?: number;
    lastPosition?: number;
}

interface Season {
    seasonNumber: number;
    episodeCount: number;
    watchedEpisodes: number;
    progress: number;
}

export default function SeasonEpisodesPage() {
    const params = useParams();
    const router = useRouter();
    const { appMode, switchToAnime } = useAppMode();
    const { isAuthenticated } = useAuth();
    const seriesId = params?.seriesId as string;
    const seasonNumber = parseInt(params?.seasonNumber as string, 10);
    
    const [episodes, setEpisodes] = useState<Episode[]>([]);
    const [season, setSeason] = useState<Season | null>(null);
    const [series, setSeries] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedEpisode, setSelectedEpisode] = useState<string | null>(null);

    useEffect(() => {
        if (appMode !== 'anime') {
            switchToAnime();
        }
    }, [appMode, switchToAnime]);

    useEffect(() => {
        if (seriesId && seasonNumber) {
            fetchData();
        }
    }, [seriesId, seasonNumber]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            
            // Fetch series info
            const seriesRes = await fetch(`/api/anime/${seriesId}`);
            if (seriesRes.ok) {
                const seriesData = await seriesRes.json();
                setSeries(seriesData);
            }

            // Fetch episodes for season
            const episodesRes = await fetch(
                `/api/anime/seasons/${seasonNumber}/episodes?seriesId=${seriesId}&seasonNumber=${seasonNumber}`,
                {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                }
            );
            if (episodesRes.ok) {
                const episodesData = await episodesRes.json();
                setEpisodes(episodesData.episodes || []);
            }

            // Fetch season info
            const seasonsRes = await fetch(`/api/anime/${seriesId}/seasons`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (seasonsRes.ok) {
                const seasonsData = await seasonsRes.json();
                const foundSeason = seasonsData.seasons?.find((s: Season) => s.seasonNumber === seasonNumber);
                if (foundSeason) {
                    setSeason(foundSeason);
                }
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePlayEpisode = (episode: Episode) => {
        router.push(`/anime/${seriesId}/episode/${episode.episodeNumber}`);
    };

    const handleResumeEpisode = (episode: Episode) => {
        if (episode.lastPosition && episode.lastPosition > 0) {
            router.push(`/anime/${seriesId}/episode/${episode.episodeNumber}?t=${Math.floor(episode.lastPosition)}`);
        } else {
            handlePlayEpisode(episode);
        }
    };

    const formatDuration = (seconds?: number) => {
        if (!seconds) return 'N/A';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-950 via-red-950 to-black text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                    <p className="text-orange-400">Loading episodes...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-950 via-red-950 to-black text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href={`/anime/${seriesId}`}
                        className="inline-flex items-center gap-2 text-orange-400 hover:text-orange-300 mb-4 transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                        <span>Back to Series</span>
                    </Link>
                    
                    <h1 className="text-4xl font-black mb-2 bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 bg-clip-text text-transparent">
                        {series?.title || 'Anime Series'}
                    </h1>
                    <h2 className="text-2xl font-bold text-orange-300">
                        Season {seasonNumber}
                    </h2>
                    {season && (
                        <div className="flex items-center gap-4 mt-4 text-sm text-gray-400">
                            <span>{season.episodeCount} Episodes</span>
                            {isAuthenticated && season.watchedEpisodes > 0 && (
                                <span>
                                    {season.watchedEpisodes} Watched ({season.progress}%)
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Episodes Grid */}
                <div className="grid gap-4">
                    {episodes.map((episode, index) => (
                        <motion.div
                            key={episode._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="group relative bg-black/40 backdrop-blur-md rounded-xl border border-orange-500/20 hover:border-orange-400/50 transition-all overflow-hidden"
                        >
                            <div className="flex items-center gap-4 p-4">
                                {/* Episode Number */}
                                <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center font-black text-xl">
                                    {episode.episodeNumber}
                                </div>

                                {/* Thumbnail */}
                                {episode.thumbnail && (
                                    <div className="flex-shrink-0 w-32 h-20 rounded-lg overflow-hidden bg-gray-800">
                                        <img
                                            src={episode.thumbnail}
                                            alt={episode.title}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}

                                {/* Episode Info */}
                                <div className="flex-grow min-w-0">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-grow min-w-0">
                                            <h3 className="text-lg font-bold text-white mb-1 truncate">
                                                {episode.title}
                                            </h3>
                                            {episode.description && (
                                                <p className="text-sm text-gray-400 line-clamp-2 mb-2">
                                                    {episode.description}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                                {episode.duration && (
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="w-4 h-4" />
                                                        <span>{formatDuration(episode.duration)}</span>
                                                    </div>
                                                )}
                                                {episode.airDate && (
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="w-4 h-4" />
                                                        <span>{new Date(episode.airDate).toLocaleDateString()}</span>
                                                    </div>
                                                )}
                                                {episode.isPreview && (
                                                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded">
                                                        Preview
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Watch Progress */}
                                        {isAuthenticated && episode.watchedPercentage && episode.watchedPercentage > 0 && (
                                            <div className="flex-shrink-0 w-24">
                                                <div className="text-xs text-gray-400 mb-1 text-right">
                                                    {episode.watchedPercentage}% watched
                                                </div>
                                                <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-orange-500 transition-all"
                                                        style={{ width: `${episode.watchedPercentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex-shrink-0 flex items-center gap-2">
                                    {episode.watched && (
                                        <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-xs font-semibold">
                                            Watched
                                        </span>
                                    )}
                                    {episode.watchedPercentage && episode.watchedPercentage > 0 && episode.watchedPercentage < 90 ? (
                                        <button
                                            onClick={() => handleResumeEpisode(episode)}
                                            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                                        >
                                            <Play className="w-4 h-4" />
                                            Resume
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handlePlayEpisode(episode)}
                                            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                                        >
                                            <Play className="w-4 h-4" />
                                            Play
                                        </button>
                                    )}
                                    <button className="p-2 hover:bg-orange-500/20 rounded-lg transition-colors">
                                        <MoreVertical className="w-5 h-5 text-gray-400" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {episodes.length === 0 && (
                    <div className="text-center py-20">
                        <p className="text-gray-400 text-xl">No episodes found for this season</p>
                    </div>
                )}
            </div>
        </div>
    );
}

