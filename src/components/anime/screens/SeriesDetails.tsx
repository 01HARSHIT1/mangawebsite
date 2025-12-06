'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Play, Star, Calendar, Users, Clock, ChevronLeft, Plus, Share2, Heart } from 'lucide-react';
import AppModeSwitcher from '@/components/AppModeSwitcher';

interface Episode {
    _id: string;
    episodeNumber: number;
    title: string;
    description?: string;
    thumbnail?: string;
    duration?: number;
    airDate?: string;
    watched?: boolean;
}

interface AnimeSeries {
    _id: string;
    title: string;
    description: string;
    coverImage: string;
    bannerImage?: string;
    genres: string[];
    rating: number;
    year: number;
    status: 'ongoing' | 'completed' | 'upcoming';
    episodeCount: number;
    studio?: string;
    director?: string;
    totalEpisodes?: number;
    episodes?: Episode[];
}

interface SeriesDetailsProps {
    seriesId: string;
}

export default function SeriesDetails({ seriesId }: SeriesDetailsProps) {
    const router = useRouter();
    const [series, setSeries] = useState<AnimeSeries | null>(null);
    const [episodes, setEpisodes] = useState<Episode[]>([]);
    const [seasons, setSeasons] = useState<any[]>([]);
    const [selectedSeason, setSelectedSeason] = useState<number>(1);
    const [loading, setLoading] = useState(true);
    const [selectedTab, setSelectedTab] = useState<'overview' | 'episodes'>('overview');

    useEffect(() => {
        fetchSeriesDetails();
        fetchSeasons();
    }, [seriesId]);

    useEffect(() => {
        if (selectedSeason) {
            fetchEpisodes();
        }
    }, [seriesId, selectedSeason]);

    const fetchSeriesDetails = async () => {
        try {
            const response = await fetch(`/api/anime/${seriesId}`);
            if (response.ok) {
                const data = await response.json();
                setSeries(data);
            }
        } catch (error) {
            console.error('Error fetching series details:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSeasons = async () => {
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const response = await fetch(`/api/anime/${seriesId}/seasons`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (response.ok) {
                const data = await response.json();
                setSeasons(data.seasons || []);
                if (data.seasons && data.seasons.length > 0) {
                    setSelectedSeason(data.seasons[0].seasonNumber);
                }
            }
        } catch (error) {
            console.error('Error fetching seasons:', error);
        }
    };

    const fetchEpisodes = async () => {
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const response = await fetch(
                `/api/anime/seasons/${selectedSeason}/episodes?seriesId=${seriesId}&seasonNumber=${selectedSeason}`,
                {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                }
            );
            if (response.ok) {
                const data = await response.json();
                setEpisodes(data.episodes || []);
            }
        } catch (error) {
            console.error('Error fetching episodes:', error);
        }
    };

    const handlePlayEpisode = (episodeNumber: number) => {
        router.push(`/anime/${seriesId}/episode/${episodeNumber}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
                    <p className="text-white text-xl">Loading...</p>
                </div>
            </div>
        );
    }

    if (!series) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-white text-xl mb-4">Series not found</p>
                    <Link href="/anime" className="text-red-400 hover:text-red-500">
                        Back to Home
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            {/* Navigation Bar */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-md border-b border-red-500/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => router.back()}
                                className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <Link href="/anime" className="flex items-center space-x-2">
                                <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-orange-600 rounded-xl flex items-center justify-center">
                                    <Play className="w-6 h-6 text-white" />
                                </div>
                                <div className="hidden md:block">
                                    <h1 className="text-xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                                        AnimeStream
                                    </h1>
                                </div>
                            </Link>
                        </div>

                        <div className="flex items-center space-x-4">
                            <AppModeSwitcher />
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section with Banner */}
            <div className="relative h-[60vh] mt-16 overflow-hidden">
                {series.bannerImage && (
                    <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${series.bannerImage})` }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/90 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent" />
                    </div>
                )}

                <div className="relative z-10 h-full flex items-end">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pb-8">
                        <div className="flex flex-col md:flex-row gap-6">
                            {/* Cover Image */}
                            <div className="relative w-48 h-64 flex-shrink-0 rounded-lg overflow-hidden shadow-2xl">
                                <Image
                                    src={series.coverImage}
                                    alt={series.title}
                                    fill
                                    className="object-cover"
                                />
                            </div>

                            {/* Series Info */}
                            <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-4">
                                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                        series.status === 'ongoing' ? 'bg-green-600 text-white' :
                                        series.status === 'completed' ? 'bg-blue-600 text-white' :
                                        'bg-yellow-600 text-white'
                                    }`}>
                                        {series.status === 'ongoing' ? 'Ongoing' : series.status === 'completed' ? 'Completed' : 'Upcoming'}
                                    </span>
                                    <span className="text-gray-300">{series.year}</span>
                                    <div className="flex items-center space-x-1 text-yellow-400">
                                        <Star className="w-4 h-4 fill-current" />
                                        <span className="font-semibold">{series.rating.toFixed(1)}</span>
                                    </div>
                                </div>

                                <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">
                                    {series.title}
                                </h1>

                                <p className="text-lg text-gray-300 mb-6 line-clamp-3">
                                    {series.description}
                                </p>

                                <div className="flex flex-wrap items-center gap-4 mb-6">
                                    {series.genres.map((genre, index) => (
                                        <span
                                            key={index}
                                            className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-sm"
                                        >
                                            {genre}
                                        </span>
                                    ))}
                                </div>

                                <div className="flex items-center space-x-4">
                                    <button
                                        onClick={() => handlePlayEpisode(1)}
                                        className="flex items-center space-x-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all shadow-lg shadow-red-500/50"
                                    >
                                        <Play className="w-5 h-5" />
                                        <span>Start Watching</span>
                                    </button>
                                    <button className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
                                        <Plus className="w-5 h-5" />
                                    </button>
                                    <button className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
                                        <Heart className="w-5 h-5" />
                                    </button>
                                    <button className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
                                        <Share2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Tabs */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex space-x-1 border-b border-gray-800 mb-6">
                    <button
                        onClick={() => setSelectedTab('overview')}
                        className={`px-6 py-3 font-semibold transition-colors ${
                            selectedTab === 'overview'
                                ? 'text-red-400 border-b-2 border-red-400'
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        Overview
                    </button>
                    <button
                        onClick={() => setSelectedTab('episodes')}
                        className={`px-6 py-3 font-semibold transition-colors ${
                            selectedTab === 'episodes'
                                ? 'text-red-400 border-b-2 border-red-400'
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        Episodes ({episodes.length})
                    </button>
                </div>

                {selectedTab === 'overview' && (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-xl font-bold mb-4">About</h3>
                            <p className="text-gray-300 leading-relaxed">{series.description}</p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {series.studio && (
                                <div>
                                    <p className="text-gray-400 text-sm mb-1">Studio</p>
                                    <p className="text-white font-semibold">{series.studio}</p>
                                </div>
                            )}
                            {series.director && (
                                <div>
                                    <p className="text-gray-400 text-sm mb-1">Director</p>
                                    <p className="text-white font-semibold">{series.director}</p>
                                </div>
                            )}
                            <div>
                                <p className="text-gray-400 text-sm mb-1">Episodes</p>
                                <p className="text-white font-semibold">{series.totalEpisodes || series.episodeCount}</p>
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm mb-1">Status</p>
                                <p className="text-white font-semibold capitalize">{series.status}</p>
                            </div>
                        </div>
                    </div>
                )}

                {selectedTab === 'episodes' && (
                    <div className="space-y-6">
                        {/* Season Selector */}
                        {seasons.length > 1 && (
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-400 mb-2">
                                    Select Season
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {seasons.map((season) => (
                                        <button
                                            key={season.seasonNumber}
                                            onClick={() => setSelectedSeason(season.seasonNumber)}
                                            className={`
                                                px-4 py-2 rounded-lg font-semibold transition-all
                                                ${selectedSeason === season.seasonNumber
                                                    ? 'bg-red-600 text-white shadow-lg shadow-red-500/50'
                                                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                                }
                                            `}
                                        >
                                            Season {season.seasonNumber}
                                            {season.watchedEpisodes > 0 && (
                                                <span className="ml-2 text-xs opacity-75">
                                                    ({season.watchedEpisodes}/{season.episodeCount})
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* View All Episodes Link */}
                        {seasons.length > 0 && (
                            <div className="mb-4">
                                <Link
                                    href={`/anime/${seriesId}/seasons/${selectedSeason}`}
                                    className="inline-flex items-center gap-2 text-orange-400 hover:text-orange-300 transition-colors font-semibold"
                                >
                                    <span>View All Episodes in Season {selectedSeason}</span>
                                    <ChevronLeft className="w-4 h-4 rotate-180" />
                                </Link>
                            </div>
                        )}

                        {/* Episodes List */}
                        <div className="space-y-2">
                            {episodes.map((episode) => (
                            <div
                                key={episode._id}
                                className="flex items-center space-x-4 p-4 bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
                                onClick={() => handlePlayEpisode(episode.episodeNumber)}
                            >
                                <div className="relative w-32 h-20 flex-shrink-0 rounded overflow-hidden bg-gray-800">
                                    {episode.thumbnail ? (
                                        <Image
                                            src={episode.thumbnail}
                                            alt={episode.title}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Play className="w-8 h-8 text-gray-600" />
                                        </div>
                                    )}
                                    {episode.watched && (
                                        <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full" />
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-3 mb-1">
                                        <span className="text-sm font-semibold text-gray-400">
                                            Episode {episode.episodeNumber}
                                        </span>
                                        {episode.airDate && (
                                            <span className="text-xs text-gray-500">
                                                {new Date(episode.airDate).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                    <h4 className="text-white font-semibold mb-1 truncate">{episode.title}</h4>
                                    {episode.description && (
                                        <p className="text-sm text-gray-400 line-clamp-2">{episode.description}</p>
                                    )}
                                </div>

                                <div className="flex items-center space-x-4">
                                    {episode.duration && (
                                        <div className="flex items-center space-x-1 text-gray-400 text-sm">
                                            <Clock className="w-4 h-4" />
                                            <span>{Math.floor(episode.duration / 60)} min</span>
                                        </div>
                                    )}
                                    <Play className="w-5 h-5 text-red-400" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

