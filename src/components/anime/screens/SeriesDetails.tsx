'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Play, Star, Calendar, Clock, ChevronLeft, Share2, Heart, Bookmark, MessageCircle, Search, Filter, Facebook, Twitter, MessageSquare, Reddit, Send, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import EpisodeCard from '@/components/anime/components/EpisodeCard';

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
    country?: string;
    premiered?: string;
    broadcast?: string;
    duration?: number;
    releaseDate?: string;
    alternativeTitles?: string[];
}

interface SeriesDetailsProps {
    seriesId: string;
}

export default function SeriesDetails({ seriesId }: SeriesDetailsProps) {
    const router = useRouter();
    const [series, setSeries] = useState<AnimeSeries | null>(null);
    const [episodes, setEpisodes] = useState<Episode[]>([]);
    const [recommendedAnime, setRecommendedAnime] = useState<AnimeSeries[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEpisode, setSelectedEpisode] = useState<number | null>(null);
    const [episodeSearch, setEpisodeSearch] = useState('');
    const [episodeRange, setEpisodeRange] = useState({ start: 1, end: 100 });
    const [comments, setComments] = useState<any[]>([]);
    const [showComments, setShowComments] = useState(false);

    const fetchSeriesDetails = useCallback(async () => {
        try {
            const response = await fetch(`/api/anime/${seriesId}`);
            if (response.ok) {
                const data = await response.json();
                setSeries(data);
                // Set first episode as default
                if (data.episodeCount > 0) {
                    setSelectedEpisode(1);
                }
            }
        } catch (error) {
            console.error('Error fetching series details:', error);
        } finally {
            setLoading(false);
        }
    }, [seriesId]);

    const fetchEpisodes = useCallback(async () => {
        try {
            const response = await fetch(`/api/anime/${seriesId}/episodes`);
            if (response.ok) {
                const data = await response.json();
                setEpisodes(data.episodes || []);
            }
        } catch (error) {
            console.error('Error fetching episodes:', error);
        }
    }, [seriesId]);

    const fetchRecommended = useCallback(async () => {
        try {
            // Fetch anime with similar genres
            if (series?.genres && series.genres.length > 0) {
                const genreQuery = series.genres[0];
                const response = await fetch(`/api/anime/browse?genre=${genreQuery}&limit=10`);
                if (response.ok) {
                    const data = await response.json();
                    // Filter out current series
                    const filtered = (data.anime || []).filter((a: any) => a._id !== seriesId).slice(0, 5);
                    setRecommendedAnime(filtered);
                }
            }
        } catch (error) {
            console.error('Error fetching recommended anime:', error);
        }
    }, [series, seriesId]);

    useEffect(() => {
        fetchSeriesDetails();
        fetchEpisodes();
    }, [fetchSeriesDetails, fetchEpisodes]);

    useEffect(() => {
        if (series) {
            fetchRecommended();
        }
    }, [series, fetchRecommended]);

    const handlePlayEpisode = (episodeNumber: number) => {
        router.push(`/anime/${seriesId}/episode/${episodeNumber}`);
    };

    const filteredEpisodes = episodes.filter(ep => {
        if (episodeSearch) {
            return ep.episodeNumber.toString().includes(episodeSearch) || 
                   ep.title.toLowerCase().includes(episodeSearch.toLowerCase());
        }
        return ep.episodeNumber >= episodeRange.start && ep.episodeNumber <= episodeRange.end;
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                    <p className="text-white text-xl">Loading...</p>
                </div>
            </div>
        );
    }

    if (!series) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <p className="text-white text-xl mb-4">Series not found</p>
                    <Link href="/anime" className="text-orange-400 hover:text-orange-500">
                        Back to Home
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Breadcrumbs */}
            <div className="bg-black/80 border-b border-orange-500/20 py-2">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center space-x-2 text-sm text-gray-400">
                        <Link href="/anime" className="hover:text-orange-400">Home</Link>
                        <span>/</span>
                        <span className="text-white">{series.title}</span>
                    </div>
                </div>
                    </div>

            {/* Hero Section */}
            <div className="relative bg-gradient-to-br from-orange-950/50 via-red-950/50 to-black">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Left: Cover Image */}
                        <div className="flex-shrink-0">
                            <div className="relative w-64 h-96 rounded-lg overflow-hidden shadow-2xl">
                                <Image
                                    src={series.coverImage}
                                    alt={series.title}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            </div>

                        {/* Right: Series Info */}
                            <div className="flex-1">
                            {/* Status, Year, Rating */}
                                <div className="flex items-center space-x-3 mb-4">
                                <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${
                                    series.status === 'ongoing' ? 'bg-green-500 text-white' :
                                    series.status === 'completed' ? 'bg-blue-500 text-white' :
                                    'bg-yellow-500 text-white'
                                }`}>
                                    {series.status === 'ongoing' ? 'ONGOING' : series.status === 'completed' ? 'COMPLETED' : 'UPCOMING'}
                                    </span>
                                <span className="text-gray-300 font-semibold">{series.year}</span>
                                    <div className="flex items-center space-x-1 text-yellow-400">
                                    <Star className="w-5 h-5 fill-yellow-400" />
                                    <span className="font-bold">{(series.rating || 0).toFixed(1)}</span>
                                </div>
                                </div>

                            {/* Title */}
                            <h1 className="text-4xl md:text-5xl font-black mb-2 text-white">
                                    {series.title}
                                </h1>

                            {/* Alternative Titles */}
                            {series.alternativeTitles && series.alternativeTitles.length > 0 && (
                                <p className="text-gray-400 mb-4">
                                    {series.alternativeTitles.join('; ')}
                                </p>
                            )}

                            {/* Type and Genres */}
                            <div className="flex items-center space-x-2 mb-4">
                                <span className="px-2 py-1 bg-gray-800 text-gray-300 rounded text-sm">TV</span>
                                {series.genres && series.genres.slice(0, 3).map((genre, idx) => (
                                    <span key={idx} className="px-2 py-1 bg-gray-800 text-gray-300 rounded text-sm">
                                            {genre}
                                        </span>
                                    ))}
                                </div>

                            {/* Synopsis */}
                            <p className="text-gray-300 mb-6 leading-relaxed max-w-3xl">
                                {series.description}
                            </p>

                            {/* Action Buttons */}
                            <div className="flex items-center space-x-4 mb-6">
                                    <button
                                        onClick={() => handlePlayEpisode(1)}
                                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg font-bold shadow-lg shadow-orange-500/50 transition-all"
                                    >
                                    <Play className="w-5 h-5 fill-white" />
                                    <span>WATCH NOW</span>
                                    </button>
                                    <button className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
                                    <Heart className="w-5 h-5 text-gray-400" />
                                    </button>
                                    <button className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
                                    <Bookmark className="w-5 h-5 text-gray-400" />
                                    </button>
                                    <button className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
                                    <Share2 className="w-5 h-5 text-gray-400" />
                                    </button>
                                </div>

                            {/* Episode Info */}
                            <div className="text-gray-400 text-sm">
                                <span>{series.episodeCount || 0} Episodes</span>
                                {series.latestEpisode && (
                                    <span className="ml-4">Latest: Ep {series.latestEpisode}</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Social Sharing Section */}
            <div className="bg-black/50 border-y border-orange-500/20 py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                                <span className="text-2xl">😊</span>
                            </div>
                            <div>
                                <p className="text-white font-semibold">Love this site? Share it and let others know!</p>
                                <p className="text-gray-400 text-sm">4.6k Shares</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                                <Facebook className="w-4 h-4" />
                                <span className="text-sm">775</span>
                            </button>
                            <button className="flex items-center space-x-2 px-4 py-2 bg-black hover:bg-gray-800 rounded-lg transition-colors border border-gray-700">
                                <Twitter className="w-4 h-4" />
                                <span className="text-sm">286</span>
                            </button>
                            <button className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors">
                                <MessageSquare className="w-4 h-4" />
                                <span className="text-sm">117</span>
                            </button>
                            <button className="flex items-center space-x-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors">
                                <Reddit className="w-4 h-4" />
                                <span className="text-sm">2.2k</span>
                            </button>
                            <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors">
                                <Send className="w-4 h-4" />
                                <span className="text-sm">88</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left: Video Player + Comments */}
                    <div className="flex-1">
                        {/* Video Player Area */}
                        <div className="mb-8">
                            <div className="relative w-full aspect-video bg-gray-900 rounded-lg overflow-hidden mb-4">
                                {selectedEpisode ? (
                                    <div className="relative w-full h-full">
                                        <Image
                                            src={series.coverImage}
                                            alt={series.title}
                                            fill
                                            className="object-cover opacity-50"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => handlePlayEpisode(selectedEpisode)}
                                                className="w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-2xl shadow-orange-500/50"
                                            >
                                                <Play className="w-10 h-10 text-white fill-white ml-1" />
                                            </motion.button>
                                        </div>
                                        <div className="absolute top-4 right-4">
                                            <span className="px-3 py-1 bg-black/70 backdrop-blur-sm text-white rounded text-sm font-bold">
                                                ONE PIECE RAZAR
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-900">
                                        <p className="text-gray-500">Select an episode to watch</p>
                                    </div>
                                )}
                            </div>

                            {/* Player Controls */}
                            <div className="flex items-center space-x-2 mb-4">
                                <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm">Focus</button>
                                <button className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded text-sm">AutoNext</button>
                                <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm">AutoPlay</button>
                                <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm">AutoSkip</button>
                                <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm">Prev</button>
                                <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm">Next</button>
                                <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm">Bookmark</button>
                </div>

                            {selectedEpisode && (
                                <p className="text-gray-400 text-sm mb-4">
                                    You are watching Episode {selectedEpisode}
                                </p>
                            )}

                            {/* Server Options */}
                            <div className="flex items-center space-x-2 mb-4">
                                <span className="text-gray-400 text-sm">Hard Sub</span>
                                <span className="text-gray-400 text-sm">Soft Sub</span>
                                <span className="text-gray-400 text-sm">Dub</span>
                                <div className="flex items-center space-x-2 ml-4">
                                    <button className="px-4 py-1 bg-green-600 rounded text-sm">Server 1</button>
                                    <button className="px-4 py-1 bg-gray-800 hover:bg-gray-700 rounded text-sm">Server 2</button>
                                </div>
                            </div>
                        </div>

                        {/* Metadata Section */}
                        <div className="bg-gray-900/50 rounded-lg p-6 mb-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-lg font-bold mb-4">Information</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex">
                                            <span className="text-gray-400 w-32">Country:</span>
                                            <span className="text-white">{series.country || 'Japan'}</span>
                                        </div>
                                        <div className="flex">
                                            <span className="text-gray-400 w-32">Genres:</span>
                                            <span className="text-white">{series.genres?.join(', ') || 'N/A'}</span>
                                        </div>
                                        <div className="flex">
                                            <span className="text-gray-400 w-32">Premiered:</span>
                                            <span className="text-white">{series.premiered || series.year || 'N/A'}</span>
                                        </div>
                                        <div className="flex">
                                            <span className="text-gray-400 w-32">Date aired:</span>
                                            <span className="text-white">
                                                {series.releaseDate ? new Date(series.releaseDate).toLocaleDateString() : `${series.year || 'N/A'} to ?`}
                                            </span>
                                        </div>
                                        <div className="flex">
                                            <span className="text-gray-400 w-32">Broadcast:</span>
                                            <span className="text-white">{series.broadcast || 'N/A'}</span>
                                        </div>
                                        <div className="flex">
                                            <span className="text-gray-400 w-32">Episodes:</span>
                                            <span className="text-white">{series.episodeCount || '?'}</span>
                                        </div>
                                        <div className="flex">
                                            <span className="text-gray-400 w-32">Duration:</span>
                                            <span className="text-white">{series.duration ? `${series.duration} min` : '24 min'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold mb-4">Details</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex">
                                            <span className="text-gray-400 w-32">Status:</span>
                                            <span className="text-white capitalize">{series.status || 'N/A'}</span>
                                        </div>
                                        <div className="flex">
                                            <span className="text-gray-400 w-32">MAL Rating:</span>
                                            <span className="text-white">{(series.rating || 0).toFixed(2)} by 1,490,130 users</span>
                                        </div>
                                        <div className="flex">
                                            <span className="text-gray-400 w-32">Studios:</span>
                                            <span className="text-white">{series.studio || 'N/A'}</span>
                                        </div>
                                        <div className="flex">
                                            <span className="text-gray-400 w-32">Producers:</span>
                                            <span className="text-white">Fuji TV, TAP</span>
                                        </div>
                                        <div className="flex">
                                            <span className="text-gray-400 w-32">Links:</span>
                                            <span className="text-orange-400">MAL, AL</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* User Rating */}
                            <div className="mt-6 pt-6 border-t border-gray-800">
                                <h3 className="text-lg font-bold mb-2">How'd you rate this anime?</h3>
                                <div className="flex items-center space-x-2">
                                    <div className="flex items-center space-x-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star
                                                key={star}
                                                className={`w-6 h-6 ${
                                                    star <= 4.5
                                                        ? 'text-yellow-400 fill-yellow-400'
                                                        : 'text-gray-600'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-gray-400 text-sm ml-2">9.66 by 50,697 reviews</span>
                                </div>
                            </div>
                        </div>

                        {/* Comments Section */}
                        <div className="bg-gray-900/50 rounded-lg p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold flex items-center space-x-2">
                                    <span>COMMENTS</span>
                                    <span className="px-2 py-1 bg-orange-500 text-white text-xs rounded">ON</span>
                                </h3>
                                        <button
                                    onClick={() => setShowComments(!showComments)}
                                    className="text-orange-400 hover:text-orange-300 text-sm"
                                >
                                    {showComments ? 'Hide Comments' : 'Show Comments'}
                                </button>
                            </div>
                            {showComments && (
                                <div className="space-y-4">
                                    <div className="bg-blue-500/20 border border-blue-500/30 rounded p-3 mb-4">
                                        <p className="text-blue-300 text-sm">
                                            Note: Please take a moment to read the comment rules before posting.
                                        </p>
                                    </div>
                                    <div className="text-gray-400 text-sm mb-4">754 comments</div>
                                    <div className="flex items-center space-x-3 mb-4">
                                        <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
                                        <input
                                            type="text"
                                            placeholder="Write your comment..."
                                            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4 mb-4">
                                        <button className="text-orange-400 border-b-2 border-orange-400 pb-1 text-sm font-semibold">Best</button>
                                        <button className="text-gray-400 hover:text-white text-sm">Newest</button>
                                        <button className="text-gray-400 hover:text-white text-sm">Oldest</button>
                                    </div>
                                    {/* Comments list would go here */}
                                    <div className="text-center py-8">
                                        <button className="px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg">
                                            Load More Comments
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Episode List + Recommended */}
                    <div className="w-full lg:w-80 space-y-6">
                        {/* Episode List Sidebar */}
                        <div className="bg-gray-900/50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold">Episodes</h3>
                                <div className="flex items-center space-x-2">
                                    <button className="p-1 hover:bg-gray-800 rounded">
                                        <Search className="w-4 h-4" />
                                    </button>
                                    <button className="p-1 hover:bg-gray-800 rounded">
                                        <Filter className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Episode Search */}
                            <div className="mb-4">
                                <input
                                    type="text"
                                    placeholder="# Find"
                                    value={episodeSearch}
                                    onChange={(e) => setEpisodeSearch(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-500"
                                />
                            </div>

                            {/* Episode Range Selector */}
                            {episodes.length > 100 && (
                                <div className="flex items-center justify-between mb-4">
                                    <button
                                        onClick={() => setEpisodeRange({ start: Math.max(1, episodeRange.start - 100), end: Math.max(100, episodeRange.end - 100) })}
                                        className="p-1 hover:bg-gray-800 rounded"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <select
                                        value={`${episodeRange.start}-${episodeRange.end}`}
                                        onChange={(e) => {
                                            const [start, end] = e.target.value.split('-').map(Number);
                                            setEpisodeRange({ start, end });
                                        }}
                                        className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white"
                                    >
                                        <option value="1-100">001-100</option>
                                        <option value="101-200">101-200</option>
                                        <option value="201-300">201-300</option>
                                    </select>
                                    <button
                                        onClick={() => setEpisodeRange({ start: episodeRange.start + 100, end: episodeRange.end + 100 })}
                                        className="p-1 hover:bg-gray-800 rounded"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                            </div>
                        )}

                            {/* Episode Grid */}
                            <div className="grid grid-cols-6 gap-2 max-h-96 overflow-y-auto">
                                {filteredEpisodes.map((episode) => (
                                    <button
                                    key={episode._id}
                                        onClick={() => {
                                            setSelectedEpisode(episode.episodeNumber);
                                            handlePlayEpisode(episode.episodeNumber);
                                        }}
                                        className={`aspect-square rounded text-sm font-semibold transition-all ${
                                            selectedEpisode === episode.episodeNumber
                                                ? 'bg-orange-500 text-white'
                                                : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                                        }`}
                                    >
                                        {episode.episodeNumber}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Recommended Anime */}
                        {recommendedAnime.length > 0 && (
                            <div className="bg-gray-900/50 rounded-lg p-4">
                                <h3 className="text-lg font-bold mb-4">Recommended</h3>
                                <div className="space-y-3">
                                    {recommendedAnime.map((anime) => (
                                        <Link
                                            key={anime._id}
                                            href={`/anime/${anime._id}`}
                                            className="flex items-center space-x-3 p-2 rounded hover:bg-gray-800 transition-colors"
                                        >
                                            <div className="relative w-16 h-24 flex-shrink-0 rounded overflow-hidden">
                                        <Image
                                                    src={anime.coverImage}
                                                    alt={anime.title}
                                            fill
                                            className="object-cover"
                                        />
                                </div>
                                <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-semibold text-white truncate">{anime.title}</h4>
                                                <p className="text-xs text-gray-400">
                                                    CC {anime.episodeCount || 0} • {anime.episodeCount || 0} TV
                                                </p>
                                    </div>
                                        </Link>
                                    ))}
                                </div>
                                        </div>
                                    )}
                    </div>
                </div>
            </div>
        </div>
    );
}
