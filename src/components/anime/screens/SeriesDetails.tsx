'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Play, Star, Calendar, Clock, ChevronLeft, Share2, Heart, Bookmark, MessageCircle, Search, Filter, ChevronRight, ChevronDown, Maximize2 } from 'lucide-react';
import { FaFacebook, FaTwitter, FaReddit, FaWhatsapp, FaTelegram } from 'react-icons/fa';
import { motion } from 'framer-motion';

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
    type?: string;
}

interface RelatedContent {
    _id: string;
    title: string;
    coverImage: string;
    episodeCount?: number;
    type?: string;
}

interface SeriesDetailsProps {
    seriesId: string;
}

export default function SeriesDetails({ seriesId }: SeriesDetailsProps) {
    const router = useRouter();
    const [series, setSeries] = useState<AnimeSeries | null>(null);
    const [episodes, setEpisodes] = useState<Episode[]>([]);
    const [recommendedAnime, setRecommendedAnime] = useState<AnimeSeries[]>([]);
    const [relatedContent, setRelatedContent] = useState<RelatedContent[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEpisode, setSelectedEpisode] = useState<number>(1); // Always start with episode 1
    const [episodeSearch, setEpisodeSearch] = useState('');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [episodeRange, setEpisodeRange] = useState({ start: 1, end: 100 });
    const [showComments, setShowComments] = useState(true);
    const [commentsSort, setCommentsSort] = useState<'best' | 'newest' | 'oldest'>('best');
    const [refreshKey, setRefreshKey] = useState(0);

    // Auto-refresh episodes every 30 seconds to catch new uploads
    useEffect(() => {
        const interval = setInterval(() => {
            setRefreshKey(prev => prev + 1);
        }, 30000); // Refresh every 30 seconds

        return () => clearInterval(interval);
    }, []);

    const fetchSeriesDetails = useCallback(async () => {
        try {
            const response = await fetch(`/api/anime/${seriesId}?t=${Date.now()}`);
            if (response.ok) {
                const data = await response.json();
                setSeries(data);
                // Always set episode 1 as default
                if (data.episodeCount > 0) {
                    setSelectedEpisode(1);
                }
            }
        } catch (error) {
            console.error('Error fetching series details:', error);
        } finally {
            setLoading(false);
        }
    }, [seriesId, episodes.length]);

    const fetchEpisodes = useCallback(async () => {
        try {
            const response = await fetch(`/api/anime/${seriesId}/episodes?t=${Date.now()}`);
            if (response.ok) {
                const data = await response.json();
                const sortedEpisodes = (data.episodes || []).sort((a: Episode, b: Episode) => 
                    a.episodeNumber - b.episodeNumber
                );
                setEpisodes(sortedEpisodes);
                // Ensure episode 1 is selected if available
                if (sortedEpisodes.length > 0) {
                    const episode1 = sortedEpisodes.find(e => e.episodeNumber === 1);
                    if (episode1 && selectedEpisode !== 1) {
                        setSelectedEpisode(1);
                    }
                }
                // Update episode count range
                if (sortedEpisodes.length > 0) {
                    const maxEpisode = Math.max(...sortedEpisodes.map((e: Episode) => e.episodeNumber));
                    if (maxEpisode > episodeRange.end) {
                        setEpisodeRange({ start: 1, end: Math.ceil(maxEpisode / 100) * 100 });
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching episodes:', error);
        }
    }, [seriesId, selectedEpisode, episodeRange.end]);

    const fetchRecommended = useCallback(async () => {
        try {
            if (series?.genres && series.genres.length > 0) {
                const genreQuery = series.genres[0];
                const response = await fetch(`/api/anime/browse?genre=${genreQuery}&limit=10`);
                if (response.ok) {
                    const data = await response.json();
                    const filtered = (data.anime || []).filter((a: any) => a._id !== seriesId).slice(0, 5);
                    setRecommendedAnime(filtered);
                }
            }
        } catch (error) {
            console.error('Error fetching recommended anime:', error);
        }
    }, [series, seriesId]);

    const fetchRelatedContent = useCallback(async () => {
        try {
            // Fetch related content (specials, movies, OVAs) with similar title
            if (series?.title) {
                const titleWords = series.title.split(' ').slice(0, 2).join(' ');
                const response = await fetch(`/api/anime/browse?search=${encodeURIComponent(titleWords)}&limit=10`);
            if (response.ok) {
                const data = await response.json();
                    // Filter to get related content (different from main series)
                    const related = (data.anime || [])
                        .filter((a: any) => a._id !== seriesId && a.title.toLowerCase().includes(series.title.toLowerCase().split(' ')[0]))
                        .slice(0, 5);
                    setRelatedContent(related);
                }
            }
        } catch (error) {
            console.error('Error fetching related content:', error);
        }
    }, [series, seriesId]);

    useEffect(() => {
        fetchSeriesDetails();
    }, [fetchSeriesDetails, refreshKey]);

    useEffect(() => {
            fetchEpisodes();
    }, [fetchEpisodes, refreshKey]);

    useEffect(() => {
        if (series) {
            fetchRecommended();
            fetchRelatedContent();
        }
    }, [series, fetchRecommended, fetchRelatedContent]);

    const handlePlayEpisode = (episodeNumber: number) => {
        if (!seriesId || !episodeNumber) {
            console.error('Missing seriesId or episodeNumber');
            return;
        }
        try {
        router.push(`/anime/${seriesId}/episode/${episodeNumber}`);
        } catch (error) {
            console.error('Error navigating to episode:', error);
        }
    };

    const toggleFullscreen = () => {
        if (!videoPlayerRef.current) return;
        
        if (!document.fullscreenElement) {
            videoPlayerRef.current.requestFullscreen().then(() => {
                setIsFullscreen(true);
            }).catch(err => {
                console.error('Error attempting to enable fullscreen:', err);
            });
        } else {
            document.exitFullscreen().then(() => {
                setIsFullscreen(false);
            }).catch(err => {
                console.error('Error attempting to exit fullscreen:', err);
            });
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, []);

    const filteredEpisodes = episodes.filter(ep => {
        if (episodeSearch) {
            return ep.episodeNumber.toString().includes(episodeSearch) || 
                   ep.title.toLowerCase().includes(episodeSearch.toLowerCase());
        }
        return ep.episodeNumber >= episodeRange.start && ep.episodeNumber <= episodeRange.end;
    });

    // Calculate episode ranges dynamically
    const maxEpisode = episodes.length > 0 ? Math.max(...episodes.map(e => e.episodeNumber)) : 100;
    const episodeRanges = [];
    for (let i = 1; i <= maxEpisode; i += 100) {
        const end = Math.min(i + 99, maxEpisode);
        episodeRanges.push({ start: i, end, label: `${String(i).padStart(3, '0')}-${String(end).padStart(3, '0')}` });
    }

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
            {/* Breadcrumbs - Image 1 */}
            <div className="bg-black/80 border-b border-orange-500/20 py-2">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center space-x-2 text-sm text-gray-400">
                        <Link href="/anime" className="hover:text-orange-400">Home</Link>
                        <span>/</span>
                        <span className="text-white">TV</span>
                        <span>/</span>
                        <span className="text-white">{series.title}</span>
                        </div>
                    </div>
                </div>

            {/* Hero Section - Image 1 */}
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
                                    onClick={(e) => {
                                        e.preventDefault();
                                        const firstEpisode = episodes.length > 0 ? episodes[0].episodeNumber : 1;
                                        handlePlayEpisode(firstEpisode);
                                    }}
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
                                <span>{series.episodeCount || episodes.length || 0} Episodes</span>
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
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                                <span className="text-2xl">😊</span>
                            </div>
                            <div>
                                <p className="text-white font-semibold">Love this site? Share it and let others know!</p>
                                <p className="text-gray-400 text-sm">4.6k Shares</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3 flex-wrap">
                            <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                                <FaFacebook className="w-4 h-4" />
                                <span className="text-sm">775</span>
                            </button>
                            <button className="flex items-center space-x-2 px-4 py-2 bg-black hover:bg-gray-800 rounded-lg transition-colors border border-gray-700">
                                <FaTwitter className="w-4 h-4" />
                                <span className="text-sm">286</span>
                            </button>
                            <button className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors">
                                <MessageCircle className="w-4 h-4" />
                                <span className="text-sm">117</span>
                            </button>
                            <button className="flex items-center space-x-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors">
                                <FaReddit className="w-4 h-4" />
                                <span className="text-sm">2.2k</span>
                            </button>
                            <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors">
                                <FaWhatsapp className="w-4 h-4" />
                                <span className="text-sm">88</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area - Image 2 */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left: Video Player + Comments */}
                    <div className="flex-1">
                        {/* Video Player Area - Image 2 */}
                        <div className="mb-8">
                            <div 
                                ref={videoPlayerRef}
                                className="relative w-full bg-gray-900 rounded-lg overflow-hidden mb-4"
                                style={{ height: 'calc(100vh - 400px)', minHeight: '500px', maxHeight: '800px' }}
                            >
                                {selectedEpisode ? (
                                    <div className="relative w-full h-full">
                                        <Image
                                            src={series.bannerImage || series.coverImage}
                                            alt={series.title}
                                            fill
                                            className="object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/30"></div>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => handlePlayEpisode(selectedEpisode)}
                                                className="w-24 h-24 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-2xl shadow-orange-500/50 z-10 hover:shadow-orange-500/70 transition-shadow"
                                            >
                                                <Play className="w-12 h-12 text-white fill-white ml-1" />
                                            </motion.button>
                                        </div>
                                        <div className="absolute top-4 right-4 z-10 flex items-center space-x-2">
                                            <span className="px-3 py-1 bg-black/70 backdrop-blur-sm text-white rounded text-sm font-bold">
                                                {series.title.toUpperCase()}
                                            </span>
                                            <button
                                                onClick={toggleFullscreen}
                                                className="p-2 bg-black/70 backdrop-blur-sm hover:bg-black/90 rounded transition-colors"
                                                title="Fullscreen"
                                            >
                                                <Maximize2 className="w-5 h-5 text-white" />
                                            </button>
                                        </div>
                                        <div className="absolute bottom-4 left-4 z-10">
                                            <span className="px-3 py-1 bg-black/70 backdrop-blur-sm text-white rounded text-sm">
                                                Episode {selectedEpisode}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-900">
                                        <p className="text-gray-500">Loading episode...</p>
                                    </div>
                                )}
                            </div>

                            {/* Player Controls */}
                            <div className="flex items-center space-x-2 mb-4 flex-wrap">
                                <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm">Focus</button>
                                <button className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded text-sm">AutoNext</button>
                                <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm">AutoPlay</button>
                                <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm">AutoSkip</button>
                    <button
                                    onClick={() => {
                                        const currentIndex = episodes.findIndex(e => e.episodeNumber === selectedEpisode);
                                        if (currentIndex > 0) {
                                            handlePlayEpisode(episodes[currentIndex - 1].episodeNumber);
                                        }
                                    }}
                                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm"
                                >
                                    Prev
                    </button>
                    <button
                                    onClick={() => {
                                        const currentIndex = episodes.findIndex(e => e.episodeNumber === selectedEpisode);
                                        if (currentIndex < episodes.length - 1) {
                                            handlePlayEpisode(episodes[currentIndex + 1].episodeNumber);
                                        }
                                    }}
                                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm"
                                >
                                    Next
                    </button>
                                <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm">Bookmark</button>
                                <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm">W2G</button>
                                <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm">Report</button>
                </div>

                            {selectedEpisode && (
                                <p className="text-gray-400 text-sm mb-4">
                                    You are watching Episode {selectedEpisode}
                                </p>
                            )}

                            {/* Server Options */}
                            <div className="flex items-center space-x-2 mb-4 flex-wrap">
                                <span className="text-gray-400 text-sm">Hard Sub</span>
                                <span className="text-gray-400 text-sm">Soft Sub</span>
                                <span className="text-gray-400 text-sm">Dub</span>
                                <div className="flex items-center space-x-2 ml-4">
                                    <button className="px-4 py-1 bg-green-600 rounded text-sm">Server 1</button>
                                    <button className="px-4 py-1 bg-gray-800 hover:bg-gray-700 rounded text-sm">Server 2</button>
                                </div>
                                <p className="text-gray-500 text-xs ml-4">If the current server is not working, please try switching to other servers.</p>
                            </div>
                        </div>

                        {/* Metadata Section - Image 3 */}
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
                                            <span className="text-white">{series.premiered || `Fall ${series.year}` || 'N/A'}</span>
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
                                            <span className="text-white">{series.episodeCount || episodes.length || '?'}</span>
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
                                            <span className="text-white capitalize">{series.status === 'ongoing' ? 'Releasing' : series.status || 'N/A'}</span>
                                        </div>
                                        <div className="flex">
                                            <span className="text-gray-400 w-32">MAL Rating:</span>
                                            <span className="text-white">{(series.rating || 0).toFixed(2)} by 1,490,130 users</span>
                                        </div>
                                        <div className="flex">
                                            <span className="text-gray-400 w-32">Studios:</span>
                                            <span className="text-white">{series.studio || 'Toei Animation'}</span>
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

                        {/* Comments Section - Images 4 & 5 */}
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
                                        <button 
                                            onClick={() => setCommentsSort('best')}
                                            className={`text-sm font-semibold pb-1 ${
                                                commentsSort === 'best' 
                                                    ? 'text-orange-400 border-b-2 border-orange-400' 
                                                    : 'text-gray-400 hover:text-white'
                                            }`}
                                        >
                                            Best
                                        </button>
                                        <button 
                                            onClick={() => setCommentsSort('newest')}
                                            className={`text-sm pb-1 ${
                                                commentsSort === 'newest' 
                                                    ? 'text-orange-400 border-b-2 border-orange-400' 
                                                    : 'text-gray-400 hover:text-white'
                                            }`}
                                        >
                                            Newest
                                        </button>
                                        <button
                                            onClick={() => setCommentsSort('oldest')}
                                            className={`text-sm pb-1 ${
                                                commentsSort === 'oldest' 
                                                    ? 'text-orange-400 border-b-2 border-orange-400' 
                                                    : 'text-gray-400 hover:text-white'
                                            }`}
                                        >
                                            Oldest
                                        </button>
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

                        {/* Relations Section */}
                        {relatedContent.length > 0 && (
                            <div className="bg-gray-900/50 rounded-lg p-6 mt-8">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-bold">Relations</h3>
                                    <select className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white">
                                        <option>Summary</option>
                                        <option>All</option>
                                    </select>
                                </div>
                                <div className="space-y-3">
                                    {relatedContent.map((item) => (
                                <Link
                                            key={item._id}
                                            href={`/anime/${item._id}`}
                                            className="flex items-center space-x-3 p-3 rounded hover:bg-gray-800 transition-colors"
                                        >
                                            <div className="relative w-20 h-28 flex-shrink-0 rounded overflow-hidden">
                                        <Image
                                                    src={item.coverImage}
                                                    alt={item.title}
                                            fill
                                            className="object-cover"
                                        />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-semibold text-white truncate">{item.title}</h4>
                                                <div className="flex items-center space-x-2 mt-1">
                                                    <span className="text-xs text-gray-400">CC {item.episodeCount || 1}</span>
                                                    <span className="text-xs text-gray-400">•</span>
                                                    <span className="text-xs text-gray-400">{item.episodeCount || 1}</span>
                                                    <span className="text-xs text-gray-400">•</span>
                                                    <span className="text-xs text-gray-400">{item.type || 'SPECIAL'}</span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                                        </div>
                                    )}
                                </div>

                    {/* Right: Episode List + Recommended - Image 2 */}
                    <div className="w-full lg:w-80 space-y-6">
                        {/* Episode List Sidebar */}
                        <div className="bg-gray-900/50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-bold">Anime</h3>
                                    <p className="text-sm text-gray-400">Episode {selectedEpisode || 1} sub</p>
                                </div>
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
                            {episodeRanges.length > 1 && (
                                <div className="flex items-center justify-between mb-4">
                                    <button
                                        onClick={() => {
                                            const currentIndex = episodeRanges.findIndex(r => r.start === episodeRange.start);
                                            if (currentIndex > 0) {
                                                setEpisodeRange(episodeRanges[currentIndex - 1]);
                                            }
                                        }}
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
                                        {episodeRanges.map((range) => (
                                            <option key={range.label} value={`${range.start}-${range.end}`}>
                                                {range.label}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={() => {
                                            const currentIndex = episodeRanges.findIndex(r => r.start === episodeRange.start);
                                            if (currentIndex < episodeRanges.length - 1) {
                                                setEpisodeRange(episodeRanges[currentIndex + 1]);
                                            }
                                        }}
                                        className="p-1 hover:bg-gray-800 rounded"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            )}

                            {/* Episode Grid */}
                            <div className="grid grid-cols-6 gap-2 max-h-96 overflow-y-auto">
                                {filteredEpisodes.length > 0 ? (
                                    filteredEpisodes.map((episode) => (
                                        <button
                                            key={episode._id}
                                            onClick={() => {
                                                setSelectedEpisode(episode.episodeNumber);
                                            }}
                                            className={`aspect-square rounded text-sm font-semibold transition-all ${
                                                selectedEpisode === episode.episodeNumber
                                                    ? 'bg-orange-500 text-white'
                                                    : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                                            }`}
                                        >
                                            {episode.episodeNumber}
                                        </button>
                                    ))
                                ) : (
                                    <div className="col-span-6 text-center text-gray-500 text-sm py-4">
                                        No episodes found
                                        </div>
                                    )}
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

            {/* A-Z List Section - Image 6 */}
            <div className="bg-gray-900/50 border-t border-orange-500/20 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-4">
                        <h3 className="text-xl font-bold mb-2">A-Z List</h3>
                        <p className="text-gray-400 text-sm">Searching anime order by alphabet name A to Z.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm">All</button>
                        <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm">0-9</button>
                        {Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)).map((letter) => (
                            <button
                                key={letter}
                                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm"
                            >
                                {letter}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="bg-black border-t border-orange-500/20 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center text-gray-400 text-sm space-y-2">
                        <p>Copyright ©AnimeStream. All Rights Reserved.</p>
                        <p>This site does not store any files on its server. All contents are provided by non-affiliated third parties.</p>
                        <div className="flex items-center justify-center space-x-4 mt-4">
                            <span className="text-gray-500">Socials:</span>
                            <FaTwitter className="w-5 h-5 text-gray-400 hover:text-blue-400 cursor-pointer" />
                            <FaReddit className="w-5 h-5 text-gray-400 hover:text-orange-400 cursor-pointer" />
                            <FaTelegram className="w-5 h-5 text-gray-400 hover:text-blue-400 cursor-pointer" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
