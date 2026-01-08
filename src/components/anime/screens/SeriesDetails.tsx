'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Play, Star, Calendar, Clock, ChevronLeft, Share2, Heart, Bookmark, MessageCircle, Search, Filter, ChevronRight, ChevronDown, Maximize2, X, Bell, BellOff } from 'lucide-react';
import { FaFacebook, FaTwitter, FaReddit, FaWhatsapp, FaTelegram } from 'react-icons/fa';
import { motion } from 'framer-motion';
import EnhancedVideoPlayer from '@/components/anime/components/EnhancedVideoPlayer';
import ReportModal from '@/components/anime/components/ReportModal';

// Spoiler Content Component
function SpoilerContent({ text }: { text: string }) {
    const [isRevealed, setIsRevealed] = useState(false);
    
    return (
        <div className="mb-2">
            {!isRevealed ? (
                <button
                    onClick={() => setIsRevealed(true)}
                    className="bg-yellow-900/50 border border-yellow-700 rounded px-4 py-2 text-yellow-400 text-sm hover:bg-yellow-900/70 transition-colors w-full text-left"
                >
                    ⚠️ Spoiler - Click to reveal
                </button>
            ) : (
                <p className="text-gray-300 text-sm bg-black/30 rounded p-2 border border-yellow-700/50">{text}</p>
            )}
        </div>
    );
}

// Comment Component with Spoiler Support
function SpoilerComment({ comment }: { comment: any }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [showSignUpModal, setShowSignUpModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportTarget, setReportTarget] = useState<{ type: string; id: string; name?: string } | null>(null);
    
    useEffect(() => {
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        setIsAuthenticated(!!token);
    }, []);

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <>
            <div className="flex items-start gap-3 pb-4 border-b border-gray-800">
                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold text-sm">
                        {comment.username?.[0]?.toUpperCase() || 'U'}
                    </span>
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">{comment.username || 'Anonymous'}</span>
                        {comment.isSpoiler && (
                            <span className="px-2 py-0.5 bg-yellow-900/50 border border-yellow-700 text-yellow-400 text-xs rounded">
                                ⚠️ Spoiler
                            </span>
                        )}
                        <span className="text-xs text-gray-500">
                            {formatTimeAgo(comment.createdAt)}
                        </span>
                    </div>
                    {comment.isSpoiler ? (
                        <SpoilerContent text={comment.text} />
                    ) : (
                        <p className="text-gray-300 text-sm mb-2">{comment.text}</p>
                    )}
                    <div className="flex items-center gap-4">
                        <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-white">
                            <span>↑</span> {comment.upvotes?.length || 0}
                        </button>
                        <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-white">
                            <span>↓</span> {comment.downvotes?.length || 0}
                        </button>
                        <button className="text-xs text-gray-400 hover:text-white">Reply</button>
                        <button 
                            onClick={() => {
                                if (!isAuthenticated) {
                                    setShowSignUpModal(true);
                                    return;
                                }
                                setReportTarget({
                                    type: 'comment',
                                    id: comment._id,
                                    name: `Comment by ${comment.username}`,
                                });
                                setShowReportModal(true);
                            }}
                            className="text-xs text-red-400 hover:text-red-500"
                        >
                            Report
                        </button>
                    </div>
                </div>
            </div>
            {showReportModal && reportTarget && (
                <ReportModal
                    isOpen={showReportModal}
                    onClose={() => {
                        setShowReportModal(false);
                        setReportTarget(null);
                    }}
                    targetType={reportTarget.type}
                    targetId={reportTarget.id}
                    targetName={reportTarget.name}
                    onSuccess={() => {
                        setShowReportModal(false);
                        setReportTarget(null);
                    }}
                />
            )}
        </>
    );
}

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
    ageRating?: 'G' | 'PG' | 'PG-13' | 'R' | 'NC-17';
    contentWarnings?: string[];
    creator?: string;
    creatorInfo?: {
        name: string;
        isVerified: boolean;
    };
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
    const [commentIsSpoiler, setCommentIsSpoiler] = useState(false);
    const [showSignUpModal, setShowSignUpModal] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [availableAudioTracks, setAvailableAudioTracks] = useState<any[]>([]);
    const [availableSubtitles, setAvailableSubtitles] = useState<any[]>([]);
    const [selectedAudioTrack, setSelectedAudioTrack] = useState<any>(null);
    const [selectedSubtitle, setSelectedSubtitle] = useState<any>(null);
    const [showAudioMenu, setShowAudioMenu] = useState(false);
    const [showSubtitleMenu, setShowSubtitleMenu] = useState(false);
    const [subtitleType, setSubtitleType] = useState<'hard' | 'soft' | null>(null);
    const audioMenuRef = useRef<HTMLDivElement>(null);
    const subtitleMenuRef = useRef<HTMLDivElement>(null);
    const [showTimestampModal, setShowTimestampModal] = useState(false);
    const [timestampData, setTimestampData] = useState({
        introStartTime: 0,
        introEndTime: 0,
        outroStartTime: 0,
        outroEndTime: 0,
    });
    const [isSavingTimestamps, setIsSavingTimestamps] = useState(false);
    
    // User preferences state
    const [userPreferences, setUserPreferences] = useState({
        autoPlay: false,
        autoNext: false,
        autoSkip: false,
        introStartTime: 0,
        introEndTime: 0,
        outroStartTime: 0,
        outroEndTime: 0,
        keyboardShortcutsEnabled: true,
    });
    const [userRating, setUserRating] = useState<number>(0);
    const [hasRated, setHasRated] = useState(false);

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
                    audioTracks: episodeData.availableTracks?.audio || episodeData.audioTracks || [],
                    subtitles: episodeData.availableTracks?.subtitles || episodeData.subtitles || [],
                    qualityLevels: episodeData.qualityLevels,
                };
                setCurrentEpisodeData(mappedEpisode);
                setPrevEpisode(episodeData.prevEpisode);
                setNextEpisode(episodeData.nextEpisode);
                
                // Set available tracks
                const audioTracks = episodeData.availableTracks?.audio || episodeData.audioTracks || [];
                const subtitles = episodeData.availableTracks?.subtitles || episodeData.subtitles || [];
                setAvailableAudioTracks(audioTracks);
                setAvailableSubtitles(subtitles);
                
                // Set default selections
                if (audioTracks.length > 0) {
                    const defaultAudio = audioTracks.find((a: any) => a.isDefault) || audioTracks[0];
                    setSelectedAudioTrack(defaultAudio);
                }
                if (subtitles.length > 0) {
                    const defaultSub = subtitles.find((s: any) => s.isDefault) || subtitles[0];
                    setSelectedSubtitle(defaultSub);
                    // Determine subtitle type (hard sub = burned in, soft sub = separate file)
                    setSubtitleType(defaultSub.format ? 'soft' : 'hard');
                } else {
                    setSelectedSubtitle(null);
                    setSubtitleType(null);
                }
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

    // Load user preferences from API
    useEffect(() => {
        const loadUserPreferences = async () => {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            if (!token) return;
            
            try {
                const response = await fetch('/api/anime/user-preferences', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.preferences) {
                        setUserPreferences({
                            autoPlay: data.preferences.autoPlay || false,
                            autoNext: data.preferences.autoNext || false,
                            autoSkip: data.preferences.autoSkip || false,
                            introStartTime: data.preferences.introStartTime || 0,
                            introEndTime: data.preferences.introEndTime || 0,
                            outroStartTime: data.preferences.outroStartTime || 0,
                            outroEndTime: data.preferences.outroEndTime || 0,
                            keyboardShortcutsEnabled: data.preferences.keyboardShortcutsEnabled !== false,
                            defaultPlaybackSpeed: data.preferences.defaultPlaybackSpeed || data.preferences.playbackSpeed || 1,
                            defaultAudioTrack: data.preferences.defaultAudioTrack || null,
                        });
                    }
                }
            } catch (error) {
                console.error('Error loading user preferences:', error);
            }
        };
        
        loadUserPreferences();
    }, [isAuthenticated]);

    // Check authentication status and load preferences
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
            
            // Load user preferences
            fetch('/api/anime/user-preferences', {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(data => {
                    if (data.preferences) {
                        setUserPreferences(data.preferences);
                    }
                })
                .catch(err => console.error('Error loading preferences:', err));
            
            // Load user rating for this series
            if (seriesId) {
                fetch(`/api/anime/${seriesId}/ratings`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                    .then(res => res.json())
                    .then(data => {
                        if (data.rating) {
                            setUserRating(data.rating);
                            setHasRated(true);
                        }
                    })
                    .catch(err => console.error('Error loading rating:', err));
            }
        } else {
            setIsAuthenticated(false);
            // Load default preferences from localStorage for non-authenticated users
            const savedPrefs = localStorage.getItem('animePreferences');
            if (savedPrefs) {
                try {
                    setUserPreferences(JSON.parse(savedPrefs));
                } catch (e) {
                    console.error('Error parsing saved preferences:', e);
                }
            }
        }
    }, [seriesId]);

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
                body: JSON.stringify({ 
                    text: commentText,
                    isSpoiler: commentIsSpoiler,
                }),
            });

            if (response.ok) {
                setCommentText('');
                setCommentIsSpoiler(false);
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
                                                episode={{
                                                    ...currentEpisodeData,
                                                    audioTracks: availableAudioTracks,
                                                    subtitles: availableSubtitles,
                                                    availableTracks: {
                                                        audio: availableAudioTracks,
                                                        subtitles: availableSubtitles,
                                                    },
                                                }}
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
                                                userPreferences={userPreferences}
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
                                    <button 
                                        onClick={() => {
                                            // Focus mode - hide UI distractions (placeholder for now)
                                            alert('Focus mode: Hides UI distractions for immersive viewing');
                                        }}
                                        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm transition-colors"
                                    >
                                        Focus
                                    </button>
                                    <button 
                                        onClick={async () => {
                                            const newValue = !userPreferences.autoNext;
                                            const updatedPrefs = { ...userPreferences, autoNext: newValue };
                                            setUserPreferences(updatedPrefs);
                                            
                                            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
                                            if (token) {
                                                await fetch('/api/anime/user-preferences', {
                                                    method: 'PUT',
                                                    headers: {
                                                        'Content-Type': 'application/json',
                                                        Authorization: `Bearer ${token}`,
                                                    },
                                                    body: JSON.stringify({ autoNext: newValue }),
                                                });
                                            } else {
                                                localStorage.setItem('animePreferences', JSON.stringify(updatedPrefs));
                                            }
                                        }}
                                        className={`px-4 py-2 rounded text-sm transition-colors ${
                                            userPreferences.autoNext 
                                                ? 'bg-orange-600 hover:bg-orange-700' 
                                                : 'bg-gray-800 hover:bg-gray-700'
                                        }`}
                                    >
                                        AutoNext {userPreferences.autoNext ? '✓' : ''}
                                    </button>
                                    <button 
                                        onClick={async () => {
                                            const newValue = !userPreferences.autoPlay;
                                            const updatedPrefs = { ...userPreferences, autoPlay: newValue };
                                            setUserPreferences(updatedPrefs);
                                            
                                            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
                                            if (token) {
                                                await fetch('/api/anime/user-preferences', {
                                                    method: 'PUT',
                                                    headers: {
                                                        'Content-Type': 'application/json',
                                                        Authorization: `Bearer ${token}`,
                                                    },
                                                    body: JSON.stringify({ autoPlay: newValue }),
                                                });
                                            } else {
                                                localStorage.setItem('animePreferences', JSON.stringify(updatedPrefs));
                                            }
                                        }}
                                        className={`px-4 py-2 rounded text-sm transition-colors ${
                                            userPreferences.autoPlay 
                                                ? 'bg-orange-600 hover:bg-orange-700' 
                                                : 'bg-gray-800 hover:bg-gray-700'
                                        }`}
                                    >
                                        AutoPlay {userPreferences.autoPlay ? '✓' : ''}
                                    </button>
                                    <button 
                                        onClick={async () => {
                                            const newValue = !userPreferences.autoSkip;
                                            const updatedPrefs = { ...userPreferences, autoSkip: newValue };
                                            setUserPreferences(updatedPrefs);
                                            
                                            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
                                            if (token) {
                                                await fetch('/api/anime/user-preferences', {
                                                    method: 'PUT',
                                                    headers: {
                                                        'Content-Type': 'application/json',
                                                        Authorization: `Bearer ${token}`,
                                                    },
                                                    body: JSON.stringify({ autoSkip: newValue }),
                                                });
                                            } else {
                                                localStorage.setItem('animePreferences', JSON.stringify(updatedPrefs));
                                            }
                                        }}
                                        className={`px-4 py-2 rounded text-sm transition-colors ${
                                            userPreferences.autoSkip 
                                                ? 'bg-orange-600 hover:bg-orange-700' 
                                                : 'bg-gray-800 hover:bg-gray-700'
                                        }`}
                                    >
                                        AutoSkip {userPreferences.autoSkip ? '✓' : ''}
                                    </button>
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
                                    <button 
                                        onClick={async () => {
                                            if (!isAuthenticated) {
                                                setShowSignUpModal(true);
                                                return;
                                            }
                                            
                                            if (!currentEpisodeData?._id) {
                                                alert('Please select an episode first');
                                                return;
                                            }
                                            
                                            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
                                            const video = document.querySelector('video');
                                            const currentPosition = video?.currentTime || 0;
                                            
                                            try {
                                                const response = await fetch('/api/anime/bookmarks', {
                                                    method: 'POST',
                                                    headers: {
                                                        'Content-Type': 'application/json',
                                                        Authorization: `Bearer ${token}`,
                                                    },
                                                    body: JSON.stringify({
                                                        seriesId: seriesId,
                                                        episodeId: currentEpisodeData._id,
                                                        episodeNumber: selectedEpisode,
                                                        position: currentPosition,
                                                    }),
                                                });
                                                
                                                if (response.ok) {
                                                    alert('Bookmark saved successfully!');
                                                } else {
                                                    const error = await response.json();
                                                    alert(error.error || 'Failed to save bookmark');
                                                }
                                            } catch (error) {
                                                console.error('Error saving bookmark:', error);
                                                alert('Failed to save bookmark');
                                            }
                                        }}
                                        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm transition-colors"
                                    >
                                        Bookmark
                                    </button>
                                    <button 
                                        onClick={async () => {
                                            if (!isAuthenticated) {
                                                setShowSignUpModal(true);
                                                return;
                                            }
                                            
                                            if (!currentEpisodeData?._id) {
                                                alert('Please select an episode first');
                                                return;
                                            }
                                            
                                            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
                                            
                                            try {
                                                const response = await fetch('/api/w2g/create', {
                                                    method: 'POST',
                                                    headers: {
                                                        'Content-Type': 'application/json',
                                                        Authorization: `Bearer ${token}`,
                                                    },
                                                    body: JSON.stringify({
                                                        seriesId: seriesId,
                                                        episodeId: currentEpisodeData._id,
                                                        episodeNumber: selectedEpisode,
                                                        isPublic: false,
                                                    }),
                                                });
                                                
                                                if (response.ok) {
                                                    const data = await response.json();
                                                    // Navigate to W2G room
                                                    router.push(`/w2g/${data.room.roomId}`);
                                                } else {
                                                    const error = await response.json();
                                                    alert(error.error || 'Failed to create watch room');
                                                }
                                            } catch (error) {
                                                console.error('Error creating W2G room:', error);
                                                alert('Failed to create watch room');
                                            }
                                        }}
                                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-sm transition-colors"
                                    >
                                        🎥 W2G
                                    </button>
                                    <button 
                                        onClick={async () => {
                                            if (!isAuthenticated) {
                                                setShowSignUpModal(true);
                                                return;
                                            }
                                            
                                            try {
                                                const token = localStorage.getItem('authToken') || localStorage.getItem('token');
                                                const response = await fetch('/api/anime/notifications/subscribe', {
                                                    method: 'POST',
                                                    headers: {
                                                        'Content-Type': 'application/json',
                                                        Authorization: `Bearer ${token}`,
                                                    },
                                                    body: JSON.stringify({
                                                        seriesId: seriesId,
                                                        enabled: !isNotificationSubscribed,
                                                    }),
                                                });
                                                
                                                if (response.ok) {
                                                    setIsNotificationSubscribed(!isNotificationSubscribed);
                                                    alert(isNotificationSubscribed ? 'Unsubscribed from notifications' : 'Subscribed to notifications');
                                                } else {
                                                    alert('Failed to update notification subscription');
                                                }
                                            } catch (error) {
                                                console.error('Error updating notification subscription:', error);
                                                alert('Failed to update notification subscription');
                                            }
                                        }}
                                        className={`px-4 py-2 rounded text-sm transition-colors flex items-center gap-2 ${
                                            isNotificationSubscribed 
                                                ? 'bg-blue-600 hover:bg-blue-700' 
                                                : 'bg-gray-800 hover:bg-gray-700'
                                        }`}
                                        title={isNotificationSubscribed ? 'Unsubscribe from notifications' : 'Subscribe to new episode notifications'}
                                    >
                                        {isNotificationSubscribed ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                                        {isNotificationSubscribed ? 'Notifications ON' : 'Notify Me'}
                                    </button>
                                    <button 
                                        onClick={() => {
                                            if (!isAuthenticated) {
                                                setShowSignUpModal(true);
                                                return;
                                            }
                                            if (!currentEpisodeData?._id) {
                                                alert('Please select an episode first');
                                                return;
                                            }
                                            setReportTarget({
                                                type: 'episode',
                                                id: currentEpisodeData._id,
                                                name: currentEpisodeData.title || `Episode ${selectedEpisode}`,
                                            });
                                            setShowReportModal(true);
                                        }}
                                        className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm transition-colors"
                                    >
                                        Report
                                    </button>
                                </div>
                            </div>

                            {selectedEpisode && (
                                <p className="text-gray-400 text-sm mb-4">
                                    You are watching Episode {selectedEpisode}
                                </p>
                            )}

                            {/* Audio & Subtitle Options - Dynamic */}
                            <div className="flex items-center space-x-2 mb-4 flex-wrap gap-2">
                                {/* Audio Tracks - Show only if multiple tracks exist */}
                                {availableAudioTracks.length > 1 ? (
                                    <div className="relative" ref={audioMenuRef}>
                                        <button
                                            onClick={() => {
                                                setShowAudioMenu(!showAudioMenu);
                                                setShowSubtitleMenu(false);
                                            }}
                                            className="px-4 py-1 bg-orange-600 hover:bg-orange-700 rounded text-sm transition-colors flex items-center gap-2"
                                        >
                                            <span>🎧 {selectedAudioTrack?.language || 'Audio'}</span>
                                            <ChevronDown className="w-4 h-4" />
                                        </button>
                                        {showAudioMenu && (
                                            <div className="absolute top-full left-0 mt-2 bg-gray-900 rounded-lg shadow-xl p-2 min-w-[150px] z-50 border border-gray-700">
                                                {availableAudioTracks.map((audio: any) => (
                                                    <button
                                                        key={audio.languageCode || audio.language}
                                                        onClick={() => {
                                                            setSelectedAudioTrack(audio);
                                                            setShowAudioMenu(false);
                                                            // Update video player audio track
                                                            if (currentEpisodeData) {
                                                                setCurrentEpisodeData({
                                                                    ...currentEpisodeData,
                                                                    audioTracks: availableAudioTracks,
                                                                });
                                                            }
                                                        }}
                                                        className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-800 transition-colors ${
                                                            selectedAudioTrack?.languageCode === audio.languageCode
                                                                ? 'bg-orange-600/20 text-orange-400 font-semibold'
                                                                : 'text-white'
                                                        }`}
                                                    >
                                                        {audio.language}
                                                    </button>
                                                ))}
                        </div>
                                        )}
                    </div>
                                ) : availableAudioTracks.length === 1 ? (
                                    <span className="px-4 py-1 bg-gray-800 rounded text-sm text-gray-300">
                                        {availableAudioTracks[0].language}
                                    </span>
                                ) : null}

                                {/* Subtitles - Show only if subtitles exist */}
                                {availableSubtitles.length > 0 && (
                                    <div className="relative" ref={subtitleMenuRef}>
                    <button
                                            onClick={() => {
                                                setShowSubtitleMenu(!showSubtitleMenu);
                                                setShowAudioMenu(false);
                                            }}
                                            className="px-4 py-1 bg-gray-800 hover:bg-gray-700 rounded text-sm transition-colors flex items-center gap-2"
                                        >
                                            <span>
                                                {subtitleType === 'hard' ? '📺 Hard Sub' : '📝 Soft Sub'}
                                                {selectedSubtitle && ` (${selectedSubtitle.language})`}
                                            </span>
                                            <ChevronDown className="w-4 h-4" />
                    </button>
                                        {showSubtitleMenu && (
                                            <div className="absolute top-full left-0 mt-2 bg-gray-900 rounded-lg shadow-xl p-2 min-w-[150px] z-50 border border-gray-700">
                                                <div className="px-2 py-1 text-xs text-gray-400 mb-1 border-b border-gray-700">
                                                    {subtitleType === 'hard' ? 'Hard Sub' : 'Soft Sub'}
                                                </div>
                                                {availableSubtitles.map((sub: any) => (
                    <button
                                                        key={sub.languageCode || sub.language}
                                                        onClick={() => {
                                                            setSelectedSubtitle(sub);
                                                            setShowSubtitleMenu(false);
                                                            // Update video player subtitle
                                                            if (currentEpisodeData) {
                                                                setCurrentEpisodeData({
                                                                    ...currentEpisodeData,
                                                                    subtitles: availableSubtitles,
                                                                });
                                                            }
                                                        }}
                                                        className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-800 transition-colors ${
                                                            selectedSubtitle?.languageCode === sub.languageCode
                                                                ? 'bg-orange-600/20 text-orange-400 font-semibold'
                                                                : 'text-white'
                                                        }`}
                                                    >
                                                        {sub.language}
                                                    </button>
                                                ))}
                                                <button
                                                    onClick={() => {
                                                        setSelectedSubtitle(null);
                                                        setShowSubtitleMenu(false);
                                                    }}
                                                    className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-800 transition-colors text-gray-400 mt-1 border-t border-gray-700 pt-2"
                                                >
                                                    Off
                    </button>
                </div>
                                        )}
                    </div>
                )}

                                {/* Server Options */}
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
                                        <div className="flex items-center gap-3 mb-2">
                                            <h1 className="text-3xl font-bold">{series.title}</h1>
                                            {series.creatorInfo?.isVerified && (
                                                <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full font-semibold flex items-center gap-1" title="Verified Creator">
                                                    ✓ Verified
                                                </span>
                                            )}
                                        </div>
                                        {series.creator && (
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-gray-400 text-sm">Creator:</span>
                                                <span className="text-orange-400 text-sm font-semibold">{series.creator}</span>
                                                {series.creatorInfo?.isVerified && (
                                                    <span className="text-blue-400" title="Verified">✓</span>
                                                )}
                                            </div>
                                        )}
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

                                        {/* Age Rating Badge */}
                                        {series.ageRating && (
                                            <div className="mb-4 flex items-center gap-3">
                                                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                                    series.ageRating === 'G' ? 'bg-green-900/50 text-green-300 border border-green-500/30' :
                                                    series.ageRating === 'PG' ? 'bg-blue-900/50 text-blue-300 border border-blue-500/30' :
                                                    series.ageRating === 'PG-13' ? 'bg-yellow-900/50 text-yellow-300 border border-yellow-500/30' :
                                                    series.ageRating === 'R' ? 'bg-orange-900/50 text-orange-300 border border-orange-500/30' :
                                                    'bg-red-900/50 text-red-300 border border-red-500/30'
                                                }`}>
                                                    {series.ageRating}
                                                </span>
                                                {series.contentWarnings && series.contentWarnings.length > 0 && (
                                                    <div className="flex flex-wrap gap-2">
                                                        {series.contentWarnings.map((warning: string, idx: number) => (
                                                            <span key={idx} className="px-2 py-1 bg-red-900/30 text-red-300 text-xs rounded border border-red-500/30">
                                                                ⚠️ {warning}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}

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
                                                        className={`w-5 h-5 cursor-pointer transition-colors ${
                                                            star <= userRating
                                                                ? 'fill-orange-500 text-orange-500'
                                                                : 'text-gray-600 hover:text-orange-400'
                                                        }`}
                                                        onClick={async () => {
                                                            if (!isAuthenticated) {
                                                                setShowSignUpModal(true);
                                                                return;
                                                            }
                                                            setUserRating(star);
                                                            setHasRated(true);
                                                            
                                                            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
                                                            if (token) {
                                                                try {
                                                                    const response = await fetch(`/api/anime/${seriesId}/ratings`, {
                                                                        method: 'POST',
                                                                        headers: {
                                                                            'Content-Type': 'application/json',
                                                                            Authorization: `Bearer ${token}`,
                                                                        },
                                                                        body: JSON.stringify({ rating: star }),
                                                                    });
                                                                    if (response.ok) {
                                                                        const data = await response.json();
                                                                        // Update series rating display
                                                                        if (series) {
                                                                            setSeries({ ...series, rating: data.rating });
                                                                        }
                                                                    }
                                                                } catch (error) {
                                                                    console.error('Error submitting rating:', error);
                                                                }
                                                            }
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            if (isAuthenticated) {
                                                                const hoverStar = parseInt(e.currentTarget.getAttribute('data-star') || '0');
                                                                // Visual feedback on hover
                                                            }
                                                        }}
                                                        data-star={star}
                                                    />
                                                ))}
                                            </div>
                                            <p className="text-xs text-gray-400">
                                                {series.rating ? `${series.rating.toFixed(1)} by reviews` : 'No ratings yet'}
                                                {hasRated && userRating > 0 && (
                                                    <span className="block mt-1 text-orange-400">You rated: {userRating}/5</span>
                                                )}
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
                                            <div className="flex items-center justify-between mt-2">
                                                <label className="flex items-center gap-2 text-sm text-gray-400 hover:text-white cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={commentIsSpoiler}
                                                        onChange={(e) => setCommentIsSpoiler(e.target.checked)}
                                                        className="w-4 h-4 text-orange-600 bg-gray-800 border-gray-700 rounded focus:ring-orange-500"
                                                    />
                                                    <span>⚠️ Contains Spoilers</span>
                                                </label>
                                                <button
                                                    onClick={handleSubmitComment}
                                                    disabled={isSubmittingComment || !commentText.trim()}
                                                    className="px-6 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm transition-colors"
                                                >
                                                    {isSubmittingComment ? 'Posting...' : 'Post Comment'}
                                                </button>
                                            </div>
                                </div>
                            </div>
                        </div>

                                {/* Comments List */}
                                <div className="space-y-4">
                                    {comments.length > 0 ? (
                                        comments.map((comment) => (
                                            <SpoilerComment key={comment._id} comment={comment} />
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

            {/* Intro/Outro Timestamp Modal */}
            {showTimestampModal && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-900 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold">Set Intro/Outro Timestamps</h3>
                            <button
                                onClick={() => setShowTimestampModal(false)}
                                className="text-gray-400 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>
                        
                        <p className="text-gray-400 text-sm mb-4">
                            Set timestamps to automatically skip intro and outro. You can set these while watching the video.
                        </p>
                        
                        <div className="space-y-4">
                            {/* Intro Section */}
                            <div className="bg-gray-800 rounded-lg p-4">
                                <h4 className="font-semibold mb-3">Intro</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Start Time (seconds)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.1"
                                            value={timestampData.introStartTime}
                                            onChange={(e) => setTimestampData({
                                                ...timestampData,
                                                introStartTime: parseFloat(e.target.value) || 0,
                                            })}
                                            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                                        />
                                        <button
                                            onClick={() => {
                                                const video = document.querySelector('video');
                                                if (video) {
                                                    setTimestampData({
                                                        ...timestampData,
                                                        introStartTime: Math.floor(video.currentTime),
                                                    });
                                                }
                                            }}
                                            className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
                                        >
                                            Use Current Time
                                        </button>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">End Time (seconds)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.1"
                                            value={timestampData.introEndTime}
                                            onChange={(e) => setTimestampData({
                                                ...timestampData,
                                                introEndTime: parseFloat(e.target.value) || 0,
                                            })}
                                            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                                        />
                                        <button
                                            onClick={() => {
                                                const video = document.querySelector('video');
                                                if (video) {
                                                    setTimestampData({
                                                        ...timestampData,
                                                        introEndTime: Math.floor(video.currentTime),
                                                    });
                                                }
                                            }}
                                            className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
                                        >
                                            Use Current Time
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Outro Section */}
                            <div className="bg-gray-800 rounded-lg p-4">
                                <h4 className="font-semibold mb-3">Outro</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Start Time (seconds)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.1"
                                            value={timestampData.outroStartTime}
                                            onChange={(e) => setTimestampData({
                                                ...timestampData,
                                                outroStartTime: parseFloat(e.target.value) || 0,
                                            })}
                                            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                                        />
                                        <button
                                            onClick={() => {
                                                const video = document.querySelector('video');
                                                if (video) {
                                                    setTimestampData({
                                                        ...timestampData,
                                                        outroStartTime: Math.floor(video.currentTime),
                                                    });
                                                }
                                            }}
                                            className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
                                        >
                                            Use Current Time
                                        </button>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">End Time (seconds)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.1"
                                            value={timestampData.outroEndTime}
                                            onChange={(e) => setTimestampData({
                                                ...timestampData,
                                                outroEndTime: parseFloat(e.target.value) || 0,
                                            })}
                                            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                                        />
                                        <button
                                            onClick={() => {
                                                const video = document.querySelector('video');
                                                if (video) {
                                                    setTimestampData({
                                                        ...timestampData,
                                                        outroEndTime: Math.floor(video.currentTime),
                                                    });
                                                }
                                            }}
                                            className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
                                        >
                                            Use Current Time
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={async () => {
                                    if (!currentEpisodeData?._id) {
                                        alert('Please select an episode first');
                                        return;
                                    }
                                    
                                    setIsSavingTimestamps(true);
                                    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
                                    
                                    try {
                                        const response = await fetch(`/api/anime/episodes/${currentEpisodeData._id}/intro-outro`, {
                                            method: 'POST',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                Authorization: `Bearer ${token}`,
                                            },
                                            body: JSON.stringify({
                                                introStartTime: timestampData.introStartTime,
                                                introEndTime: timestampData.introEndTime,
                                                outroStartTime: timestampData.outroStartTime,
                                                outroEndTime: timestampData.outroEndTime,
                                                isUserOverride: true,
                                            }),
                                        });
                                        
                                        if (response.ok) {
                                            const prefsResponse = await fetch('/api/anime/user-preferences', {
                                                method: 'PUT',
                                                headers: {
                                                    'Content-Type': 'application/json',
                                                    Authorization: `Bearer ${token}`,
                                                },
                                                body: JSON.stringify({
                                                    introStartTime: timestampData.introStartTime,
                                                    introEndTime: timestampData.introEndTime,
                                                    outroStartTime: timestampData.outroStartTime,
                                                    outroEndTime: timestampData.outroEndTime,
                                                }),
                                            });
                                            
                                            if (prefsResponse.ok) {
                                                setUserPreferences(prev => ({
                                                    ...prev,
                                                    introStartTime: timestampData.introStartTime,
                                                    introEndTime: timestampData.introEndTime,
                                                    outroStartTime: timestampData.outroStartTime,
                                                    outroEndTime: timestampData.outroEndTime,
                                                }));
                                                alert('Timestamps saved successfully!');
                                                setShowTimestampModal(false);
                                            }
                                        } else {
                                            const error = await response.json();
                                            alert(error.error || 'Failed to save timestamps');
                                        }
                                    } catch (error) {
                                        console.error('Error saving timestamps:', error);
                                        alert('Failed to save timestamps');
                                    } finally {
                                        setIsSavingTimestamps(false);
                                    }
                                }}
                                disabled={isSavingTimestamps}
                                className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
                            >
                                {isSavingTimestamps ? 'Saving...' : 'Save Timestamps'}
                            </button>
                            <button
                                onClick={() => setShowTimestampModal(false)}
                                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                        </div>
                    </div>
                )}

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
