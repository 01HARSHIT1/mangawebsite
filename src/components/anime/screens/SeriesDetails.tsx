'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
    const videoPlayerRef = useRef<HTMLDivElement>(null);

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
    }, [seriesId]);

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
            {/* Breadcrumbs */}
            <div className="bg-black/80 border-b border-orange-500/20 py-2">
                <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center space-x-2 text-sm text-gray-400">
                        <Link href="/anime" className="hover:text-orange-400">Home</Link>
                        <span>/</span>
                        <span className="text-white">TV</span>
                        <span>/</span>
                        <span className="text-white">{series.title}</span>
                    </div>
                </div>
            </div>

            {/* Main Content Area - Large Video Player with Episode Sidebar */}
            <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left: Large Video Player Box */}
                    <div className="flex-1">
                        <div className="bg-gray-900/50 rounded-lg p-4">
                            {/* Video Player Area - Maximum Size */}
                            <div className="mb-4">
                                <div 
                                    ref={videoPlayerRef}
                                    className="relative w-full bg-gray-900 rounded-lg overflow-hidden mb-4"
                                    style={{ height: 'calc(100vh - 250px)', minHeight: '650px' }}
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
                    </div>

                    {/* Right: Episode List Sidebar Box */}
                    <div className="w-full lg:w-96 flex-shrink-0">
                        <div className="bg-gray-900/50 rounded-lg p-4 sticky top-4">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-bold">Episodes</h3>
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
                            <div className="grid grid-cols-6 gap-2 max-h-[calc(100vh-400px)] overflow-y-auto">
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
                    </div>
                </div>
            </div>
        </div>
    );
}
