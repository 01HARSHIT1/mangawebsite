'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Play, Star, Calendar, Clock, ChevronLeft, Share2, Heart, Bookmark, MessageCircle, Search, Filter, ChevronRight, ChevronDown, Maximize2 } from 'lucide-react';
import { FaFacebook, FaTwitter, FaReddit, FaWhatsapp, FaTelegram } from 'react-icons/fa';
import { motion } from 'framer-motion';
import EnhancedVideoPlayer from '@/components/anime/components/EnhancedVideoPlayer';

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
    const searchParams = useSearchParams();
    const [series, setSeries] = useState<AnimeSeries | null>(null);
    const [episodes, setEpisodes] = useState<Episode[]>([]);
    const [recommendedAnime, setRecommendedAnime] = useState<AnimeSeries[]>([]);
    const [relatedContent, setRelatedContent] = useState<RelatedContent[]>([]);
    const [loading, setLoading] = useState(true);
    // Get episode from URL query params, default to 1
    const episodeFromUrl = searchParams?.get('episode');
    const [selectedEpisode, setSelectedEpisode] = useState<number>(
        episodeFromUrl ? parseInt(episodeFromUrl, 10) : 1
    );
    const [episodeSearch, setEpisodeSearch] = useState('');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [episodeRange, setEpisodeRange] = useState({ start: 1, end: 100 });
    const [showComments, setShowComments] = useState(true);
    const [commentsSort, setCommentsSort] = useState<'best' | 'newest' | 'oldest'>('best');
    const [refreshKey, setRefreshKey] = useState(0);
    const videoPlayerRef = useRef<HTMLDivElement>(null);
    const [currentEpisodeData, setCurrentEpisodeData] = useState<any>(null);
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);
    const [prevEpisode, setPrevEpisode] = useState<any>(null);
    const [nextEpisode, setNextEpisode] = useState<any>(null);
    const [comments, setComments] = useState<any[]>([]);
    const [commentText, setCommentText] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [showSignUpModal, setShowSignUpModal] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [userRating, setUserRating] = useState<number>(0);

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

    const fetchEpisodeData = useCallback(async (episodeNumber: number) => {
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const response = await fetch(`/api/anime/${seriesId}/episodes/${episodeNumber}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (response.ok) {
                const episodeData = await response.json();
                const mappedEpisode = {
                    _id: episodeData.id || episodeData._id,
                    id: episodeData.id || episodeData._id,
                    episodeNumber: episodeData.episodeNumber,
                    seasonNumber: episodeData.seasonNumber,
                    title: episodeData.title || `Episode ${episodeData.episodeNumber}`,
                    description: episodeData.description,
                    videoUrl: episodeData.videoUrl,
                    hlsManifestUrl: episodeData.hlsManifestUrl,
                    dashManifestUrl: episodeData.dashManifestUrl,
                    thumbnail: episodeData.thumbnail,
                    duration: episodeData.duration,
                    airDate: episodeData.airDate,
                    availableTracks: episodeData.availableTracks,
                    qualityLevels: episodeData.qualityLevels,
                };
                setCurrentEpisodeData(mappedEpisode);
                setPrevEpisode(episodeData.prevEpisode);
                setNextEpisode(episodeData.nextEpisode);
            }
        } catch (error) {
            console.error('Error fetching episode data:', error);
        }
    }, [seriesId]);

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
        // Check URL for episode parameter on mount and when it changes
        const episodeParam = searchParams?.get('episode');
        if (episodeParam) {
            const episodeNum = parseInt(episodeParam, 10);
            if (!isNaN(episodeNum) && episodeNum !== selectedEpisode) {
                setSelectedEpisode(episodeNum);
                // Auto-play if coming from a link (episode param in URL)
                setIsVideoPlaying(true);
            }
        }
    }, [searchParams, selectedEpisode]);

    useEffect(() => {
        if (selectedEpisode && episodes.length > 0) {
            fetchEpisodeData(selectedEpisode);
        }
    }, [selectedEpisode, episodes, fetchEpisodeData]);

    useEffect(() => {
        if (series) {
            fetchRecommended();
            fetchRelatedContent();
        }
    }, [series, fetchRecommended, fetchRelatedContent]);

    // Check authentication status
    useEffect(() => {
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        if (token) {
            setIsAuthenticated(true);
            // Fetch user info
            fetch('/api/auth/me', {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(data => {
                    if (data.user) {
                        setCurrentUser(data.user);
                    }
                })
                .catch(() => setIsAuthenticated(false));
        } else {
            setIsAuthenticated(false);
        }
    }, []);

    // Fetch comments
    const fetchComments = useCallback(async () => {
        try {
            const response = await fetch(`/api/anime/${seriesId}/comments?sort=${commentsSort}`);
            if (response.ok) {
                const data = await response.json();
                setComments(data.comments || []);
            }
        } catch (error) {
            console.error('Error fetching comments:', error);
        }
    }, [seriesId, commentsSort]);

    useEffect(() => {
        if (seriesId) {
            fetchComments();
        }
    }, [seriesId, commentsSort, fetchComments]);

    // Submit comment
    const handleSubmitComment = async () => {
        if (!isAuthenticated) {
            setShowSignUpModal(true);
            return;
        }

        if (!commentText.trim()) return;

        setIsSubmittingComment(true);
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const response = await fetch(`/api/anime/${seriesId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ text: commentText }),
            });

            if (response.ok) {
                setCommentText('');
                fetchComments();
            } else {
                const error = await response.json();
                if (response.status === 401) {
                    setShowSignUpModal(true);
                } else {
                    alert(error.error || 'Failed to post comment');
                }
            }
        } catch (error) {
            console.error('Error submitting comment:', error);
            alert('Failed to post comment');
        } finally {
            setIsSubmittingComment(false);
        }
    };

    // Format time ago
    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return 'just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
        if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
        if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
        return `${Math.floor(diffInSeconds / 31536000)} years ago`;
    };

    const handlePlayEpisode = (episodeNumber: number) => {
        if (!seriesId || !episodeNumber) {
            console.error('Missing seriesId or episodeNumber');
            return;
        }
        // Set the selected episode and fetch its data - video will play in place
        setSelectedEpisode(episodeNumber);
        setIsVideoPlaying(true);
    };

    const handleNextEpisode = () => {
        if (nextEpisode) {
            setSelectedEpisode(nextEpisode.episodeNumber);
            setIsVideoPlaying(true);
        }
    };

    const handlePreviousEpisode = () => {
        if (prevEpisode) {
            setSelectedEpisode(prevEpisode.episodeNumber);
            setIsVideoPlaying(true);
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
                        <div className="bg-gray-900/50 rounded-lg overflow-hidden">
                            {/* Video Player Area - Maximum Size - No padding to fill container */}
                            <div 
                                ref={videoPlayerRef}
                                className="relative w-full bg-black overflow-hidden"
                                style={{ height: 'calc(100vh - 250px)', minHeight: '650px' }}
                            >
                                {isVideoPlaying && currentEpisodeData ? (
                                    <div className="w-full h-full overflow-hidden absolute inset-0" style={{ height: '100%', width: '100%', margin: 0, padding: 0 }}>
                                        <style jsx global>{`
                                            .embedded-video-player [class*="h-screen"] {
                                                height: 100% !important;
                                                min-height: unset !important;
                                            }
                                            .embedded-video-player [class*="min-h-screen"] {
                                                min-height: unset !important;
                                            }
                                        `}</style>
                                        <div className="embedded-video-player w-full h-full">
                                            <EnhancedVideoPlayer
                                                episode={currentEpisodeData}
                                                series={{
                                                    _id: series._id,
                                                    title: series.title,
                                                    coverImage: series.coverImage
                                                }}
                                                onNextEpisode={handleNextEpisode}
                                                onPreviousEpisode={handlePreviousEpisode}
                                                hasNextEpisode={!!nextEpisode}
                                                hasPreviousEpisode={!!prevEpisode}
                                                onBackToSeries={() => setIsVideoPlaying(false)}
                                            />
                                        </div>
                    </div>
                                ) : selectedEpisode ? (
                                    <div className="relative w-full h-full">
                                        {(() => {
                                            // Get the selected episode's thumbnail if available
                                            const selectedEp = episodes.find(e => e.episodeNumber === selectedEpisode);
                                            const thumbnailUrl = selectedEp?.thumbnail || series.bannerImage || series.coverImage;
                                            
                                            return (
                                <Image
                                                    src={thumbnailUrl}
                                    alt={series.title}
                                    fill
                                    className="object-cover"
                                />
                                            );
                                        })()}
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
                                        <p className="text-gray-500">Select an episode to watch</p>
                    </div>
                                )}
                                </div>

                            {/* Player Controls - Placed right after video player in the gap */}
                            <div className="mt-4 px-4">
                                <div className="flex items-center gap-3 flex-wrap">
                                    <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm transition-colors">Focus</button>
                                    <button className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded text-sm transition-colors">AutoNext</button>
                                    <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm transition-colors">AutoPlay</button>
                                    <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm transition-colors">AutoSkip</button>
                                    <button
                                        onClick={handlePreviousEpisode}
                                        disabled={!prevEpisode}
                                        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Prev
                                    </button>
                                    <button
                                        onClick={handleNextEpisode}
                                        disabled={!nextEpisode}
                                        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Next
                                    </button>
                                    <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm transition-colors">Bookmark</button>
                                    <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm transition-colors">W2G</button>
                                    <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm transition-colors">Report</button>
                                </div>
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

                            {/* Anime Information Section */}
                            <div className="bg-gray-900/50 rounded-lg p-6 mt-6">
                                <div className="flex flex-col lg:flex-row gap-6">
                                    {/* Left: Character Image/Poster */}
                                    <div className="w-full lg:w-1/3 flex-shrink-0">
                                        <div className="relative w-full aspect-[2/3] rounded-lg overflow-hidden">
                                            <Image
                                                src={series.coverImage}
                                                alt={series.title}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                    </div>

                                    {/* Right: Anime Details */}
                                    <div className="flex-1">
                                        <h1 className="text-3xl font-bold mb-2">{series.title}</h1>
                                        {series.alternativeTitles && series.alternativeTitles.length > 0 && (
                                            <p className="text-gray-400 text-sm mb-4">
                                                {series.alternativeTitles.join('; ')}
                                            </p>
                                        )}

                                        {/* Tags */}
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            <span className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded text-sm">PG 13</span>
                                            <span className="px-3 py-1 bg-gray-700 text-gray-300 rounded text-sm">cc {series.episodeCount || 0}</span>
                                            <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded text-sm">{series.episodeCount || 0}</span>
                                            <span className="px-3 py-1 bg-gray-700 text-gray-300 rounded text-sm">{series.type || 'TV'}</span>
                                        </div>

                                        {/* Synopsis */}
                                        <p className="text-gray-300 mb-6 leading-relaxed">{series.description}</p>

                                        {/* Metadata */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                            {series.country && (
                                                <div>
                                                    <span className="text-gray-500">Country:</span> <span className="text-white">{series.country}</span>
                                                </div>
                                            )}
                                            {series.genres && series.genres.length > 0 && (
                                                <div>
                                                    <span className="text-gray-500">Genres:</span> <span className="text-white">{series.genres.join(', ')}</span>
                                                </div>
                                            )}
                                            {series.premiered && (
                                                <div>
                                                    <span className="text-gray-500">Premiered:</span> <span className="text-white">{series.premiered}</span>
                                                </div>
                                            )}
                                            {series.releaseDate && (
                                                <div>
                                                    <span className="text-gray-500">Date aired:</span> <span className="text-white">{series.releaseDate}</span>
                                                </div>
                                            )}
                                            {series.broadcast && (
                                                <div>
                                                    <span className="text-gray-500">Broadcast:</span> <span className="text-white">{series.broadcast}</span>
                                                </div>
                                            )}
                                            <div>
                                                <span className="text-gray-500">Episodes:</span> <span className="text-white">{series.episodeCount || '?'}</span>
                                            </div>
                                            {series.duration && (
                                                <div>
                                                    <span className="text-gray-500">Duration:</span> <span className="text-white">{series.duration} min</span>
                                                </div>
                                            )}
                                            <div>
                                                <span className="text-gray-500">Status:</span> <span className="text-white capitalize">{series.status}</span>
                                            </div>
                                            {series.rating && (
                                                <div>
                                                    <span className="text-gray-500">MAL:</span> <span className="text-white">{series.rating.toFixed(2)}</span>
                                                </div>
                                            )}
                                            {series.studio && (
                                                <div>
                                                    <span className="text-gray-500">Studios:</span> <span className="text-white">{series.studio}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* User Rating Section */}
                                    <div className="w-full lg:w-64 flex-shrink-0">
                                        <div className="bg-gray-800/50 rounded-lg p-4">
                                            <h3 className="text-sm font-semibold mb-2">How'd you rate this anime?</h3>
                                            <div className="flex items-center gap-1 mb-2">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <Star
                                                        key={star}
                                                        className={`w-5 h-5 ${
                                                            star <= (userRating || series.rating || 0)
                                                                ? 'fill-orange-500 text-orange-500'
                                                                : 'text-gray-600'
                                                        }`}
                                                        onClick={() => isAuthenticated && setUserRating(star)}
                                                    />
                                                ))}
                                            </div>
                                            <p className="text-xs text-gray-400">
                                                {series.rating ? `${series.rating.toFixed(2)} by reviews` : 'No ratings yet'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Social Sharing Section */}
                            <div className="bg-gray-900/50 rounded-lg p-6 mt-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <MessageCircle className="w-6 h-6 text-orange-500" />
                                        <div>
                                            <p className="text-sm font-semibold">Love this site? Share it and let others know!</p>
                                            <p className="text-xs text-gray-400">4.6k Shares</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button className="p-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors">
                                            <FaFacebook className="w-5 h-5" />
                                        </button>
                                        <button className="p-2 bg-black hover:bg-gray-800 rounded transition-colors">
                                            <FaTwitter className="w-5 h-5" />
                                        </button>
                                        <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors">
                                            <MessageCircle className="w-5 h-5" />
                                        </button>
                                        <button className="p-2 bg-orange-600 hover:bg-orange-700 rounded transition-colors">
                                            <FaReddit className="w-5 h-5" />
                                        </button>
                                        <button className="p-2 bg-green-600 hover:bg-green-700 rounded transition-colors">
                                            <FaWhatsapp className="w-5 h-5" />
                                        </button>
                                        <button className="p-2 bg-blue-500 hover:bg-blue-600 rounded transition-colors">
                                            <FaTelegram className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Comments Section */}
                            <div className="bg-gray-900/50 rounded-lg p-6 mt-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <h2 className="text-2xl font-bold">COMMENTS</h2>
                                    <span className="px-2 py-1 bg-red-600 text-white text-xs rounded">ON</span>
                                </div>

                                <div className="bg-blue-500/20 border border-blue-500/50 rounded p-3 mb-4">
                                    <p className="text-sm text-blue-300">
                                        Note: Please take a moment to read the comment rules before posting.
                                    </p>
                                </div>

                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-gray-400">{comments.length} comments</p>
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => setCommentsSort('best')}
                                            className={`text-sm ${commentsSort === 'best' ? 'text-red-500 underline' : 'text-gray-400 hover:text-white'}`}
                                        >
                                            Best
                                        </button>
                                        <button
                                            onClick={() => setCommentsSort('newest')}
                                            className={`text-sm ${commentsSort === 'newest' ? 'text-red-500 underline' : 'text-gray-400 hover:text-white'}`}
                                        >
                                            Newest
                                        </button>
                                        <button
                                            onClick={() => setCommentsSort('oldest')}
                                            className={`text-sm ${commentsSort === 'oldest' ? 'text-red-500 underline' : 'text-gray-400 hover:text-white'}`}
                                        >
                                            Oldest
                                        </button>
                                    </div>
                                </div>

                                {/* Comment Input */}
                                <div className="mb-6">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                                            {isAuthenticated && currentUser ? (
                                                <span className="text-white font-semibold">
                                                    {currentUser.username?.[0]?.toUpperCase() || currentUser.email?.[0]?.toUpperCase() || 'U'}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">?</span>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <textarea
                                                value={commentText}
                                                onChange={(e) => setCommentText(e.target.value)}
                                                onFocus={() => {
                                                    if (!isAuthenticated) {
                                                        setShowSignUpModal(true);
                                                    }
                                                }}
                                                placeholder="Write your comment..."
                                                className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-3 text-white placeholder-gray-500 resize-none"
                                                rows={3}
                                            />
                                            <button
                                                onClick={handleSubmitComment}
                                                disabled={isSubmittingComment || !commentText.trim()}
                                                className="mt-2 px-6 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm transition-colors"
                                            >
                                                {isSubmittingComment ? 'Posting...' : 'Post Comment'}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Comments List */}
                                <div className="space-y-4">
                                    {comments.length > 0 ? (
                                        comments.map((comment) => (
                                            <div key={comment._id} className="flex items-start gap-3 pb-4 border-b border-gray-800">
                                                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                                                    <span className="text-white font-semibold text-sm">
                                                        {comment.username?.[0]?.toUpperCase() || 'U'}
                                                    </span>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-semibold text-sm">{comment.username || 'Anonymous'}</span>
                                                        <span className="text-xs text-gray-500">
                                                            {formatTimeAgo(comment.createdAt)}
                                                        </span>
                                                    </div>
                                                    <p className="text-gray-300 text-sm mb-2">{comment.text}</p>
                                                    <div className="flex items-center gap-4">
                                                        <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-white">
                                                            <span>↑</span> {comment.upvotes?.length || 0}
                                                        </button>
                                                        <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-white">
                                                            <span>↓</span> {comment.downvotes?.length || 0}
                                                        </button>
                                                        <button className="text-xs text-gray-400 hover:text-white">Reply</button>
                                                        <button className="text-xs text-gray-400 hover:text-white">More</button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-gray-500 text-center py-8">No comments yet. Be the first to comment!</p>
                                    )}
                                </div>

                                {comments.length > 10 && (
                                    <button className="mt-4 w-full py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm transition-colors">
                                        Load More Comments
                                    </button>
                                )}
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

            {/* A-Z List Section */}
            <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="bg-gray-900/50 rounded-lg p-6">
                    <h2 className="text-xl font-bold mb-2">A-Z List</h2>
                    <p className="text-gray-400 text-sm mb-4">Searching anime order by alphabet name A to Z.</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                        <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm transition-colors">All</button>
                        <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm transition-colors">0-9</button>
                        {Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ').map((letter) => (
                            <button
                                key={letter}
                                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm transition-colors"
                            >
                                {letter}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="px-6 py-2 bg-orange-600 hover:bg-orange-700 rounded text-sm transition-colors">
                            REQUEST
                        </button>
                        <button className="px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm transition-colors">
                            CONTACT US
                        </button>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-black/80 border-t border-gray-800 mt-12">
                <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="text-center mb-4">
                        <p className="text-gray-400 text-sm mb-2">
                            Copyright © AnimeStream. All Rights Reserved
                        </p>
                        <p className="text-gray-500 text-xs">
                            All content is provided by non-affiliated third parties.
                        </p>
                    </div>
                    <div className="flex items-center justify-center gap-4 mb-4">
                        <button className="p-2 hover:bg-gray-800 rounded transition-colors">
                            <FaTwitter className="w-5 h-5 text-gray-400" />
                        </button>
                        <button className="p-2 hover:bg-gray-800 rounded transition-colors">
                            <FaReddit className="w-5 h-5 text-gray-400" />
                        </button>
                        <button className="p-2 hover:bg-gray-800 rounded transition-colors">
                            <FaTelegram className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>
                    <div className="text-center">
                        <p className="text-gray-500 text-xs">
                            animestream, watch anime, anime streaming
                        </p>
                    </div>
                </div>
            </footer>

            {/* Sign Up Modal */}
            {showSignUpModal && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold">Sign Up Required</h3>
                            <button
                                onClick={() => setShowSignUpModal(false)}
                                className="text-gray-400 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>
                        <p className="text-gray-300 mb-6">
                            You need to sign up or sign in to post comments. Please create an account or sign in to continue.
                        </p>
                        <div className="flex gap-3">
                            <Link
                                href="/auth/signup"
                                className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded text-center transition-colors"
                            >
                                Sign Up
                            </Link>
                            <Link
                                href="/auth/signin"
                                className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-center transition-colors"
                            >
                                Sign In
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
