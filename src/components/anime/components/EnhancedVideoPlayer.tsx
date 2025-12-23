'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, SkipBack, SkipForward, ChevronLeft, Settings, Subtitles, Languages } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import AppModeSwitcher from '@/components/AppModeSwitcher';

interface Subtitle {
    language: string;
    languageCode: string;
    url: string;
    format: 'vtt' | 'srt' | 'ass';
    isDefault?: boolean;
}

interface AudioTrack {
    language: string;
    languageCode: string;
    url: string;
    isDefault?: boolean;
}

interface QualityLevel {
    quality: '1080p' | '720p' | '480p' | '360p' | 'auto';
    bitrate: number;
    manifestUrl: string;
}

interface Episode {
    _id?: string;
    id?: string;
    episodeNumber: number;
    seasonNumber?: number;
    title: string;
    description?: string;
    videoUrl?: string;
    hlsManifestUrl?: string;
    dashManifestUrl?: string;
    thumbnail?: string;
    duration?: number;
    subtitles?: Subtitle[];
    audioTracks?: AudioTrack[];
    qualityLevels?: QualityLevel[];
    availableTracks?: {
        audio?: AudioTrack[];
        subtitles?: Subtitle[];
    };
}

interface Series {
    _id: string;
    title: string;
    coverImage: string;
}

interface VideoPlayerProps {
    episode: Episode;
    series: Series;
    onNextEpisode: () => void;
    onPreviousEpisode: () => void;
    onBackToSeries: () => void;
    hasNextEpisode?: boolean;
    hasPreviousEpisode?: boolean;
}

export default function EnhancedVideoPlayer({
    episode,
    series,
    onNextEpisode,
    onPreviousEpisode,
    onBackToSeries,
    hasNextEpisode = true,
    hasPreviousEpisode = true,
}: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const { user, isAuthenticated } = useAuth();
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [showSettings, setShowSettings] = useState(false);
    const [showSubtitlesMenu, setShowSubtitlesMenu] = useState(false);
    const [showQualityMenu, setShowQualityMenu] = useState(false);
    const [showAudioMenu, setShowAudioMenu] = useState(false);
    const [selectedSubtitle, setSelectedSubtitle] = useState<Subtitle | null>(null);
    const [selectedQuality, setSelectedQuality] = useState<QualityLevel | null>(null);
    const [selectedAudio, setSelectedAudio] = useState<AudioTrack | null>(null);
    const [playbackData, setPlaybackData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [resumePosition, setResumePosition] = useState(0);
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const trackRef = useRef<HTMLTrackElement>(null);

    // Load playback data and resume position
    useEffect(() => {
        loadPlaybackData();
    }, [episode._id || episode.id]);

    const loadPlaybackData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            
            // Get playback URL with entitlement
            const episodeId = episode._id || episode.id;
            if (!episodeId) {
                console.error('Episode ID not found');
                setLoading(false);
                return;
            }
            
            const playbackRes = await fetch(`/api/anime/episodes/${episodeId}/playback`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });

            if (playbackRes.ok) {
                const data = await playbackRes.json();
                setPlaybackData(data);
                setSelectedQuality(data.qualityLevels?.[0] || null);
                
                // Set default subtitle
                const defaultSubtitle = data.subtitles?.find((s: Subtitle) => s.isDefault) || data.subtitles?.[0];
                if (defaultSubtitle) {
                    setSelectedSubtitle(defaultSubtitle);
                }

                // Set default audio track
                const defaultAudio = data.audioTracks?.find((a: AudioTrack) => a.isDefault) || data.audioTracks?.[0];
                if (defaultAudio) {
                    setSelectedAudio(defaultAudio);
                }
            }

            // Get resume position if authenticated
            if (isAuthenticated && token) {
                const historyRes = await fetch('/api/anime/watch-history', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (historyRes.ok) {
                    const historyData = await historyRes.json();
                    const episodeHistory = historyData.watchHistory?.find((h: any) => 
                        h.episodeId === episodeId || h.episodeId === episode._id || h.episodeId === episode.id
                    );
                    if (episodeHistory && !episodeHistory.completed) {
                        setResumePosition(episodeHistory.lastPosition || 0);
                    }
                }
            }
        } catch (error) {
            console.error('Error loading playback data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Set video source and resume position
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        // Use HLS manifest if available, otherwise fallback to videoUrl
        const videoSrc = playbackData?.manifestUrl || playbackData?.hlsManifestUrl || playbackData?.videoUrl || episode.videoUrl || episode.hlsManifestUrl;
        if (videoSrc) {
            video.src = videoSrc;
            video.load(); // Reload video with new source
        }

        // Resume from last position
        if (resumePosition > 0) {
            video.currentTime = resumePosition;
        }

        // Load subtitles
        if (selectedSubtitle && trackRef.current) {
            trackRef.current.src = selectedSubtitle.url;
            trackRef.current.kind = 'subtitles';
            trackRef.current.srclang = selectedSubtitle.languageCode;
            trackRef.current.label = selectedSubtitle.language;
        }
    }, [playbackData, resumePosition, selectedSubtitle, episode.videoUrl, episode.hlsManifestUrl]);

    // Track playback events
    const episodeId = episode._id || episode.id || '';
    const trackEvent = useCallback(async (eventType: string, position?: number) => {
        if (!isAuthenticated || !episodeId) return;
        
        try {
            const token = localStorage.getItem('token');
            await fetch('/api/anime/player/event', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    episodeId: episodeId,
                    seriesId: series._id,
                    eventType,
                    position: position || currentTime,
                    duration,
                    quality: selectedQuality?.quality || 'auto',
                })
            });
        } catch (error) {
            console.error('Error tracking event:', error);
        }
    }, [isAuthenticated, episodeId, series._id, currentTime, duration, selectedQuality]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const updateTime = () => {
            const time = video.currentTime;
            setCurrentTime(time);
            // Track heartbeat every 10 seconds
            if (Math.floor(time) % 10 === 0 && isPlaying) {
                trackEvent('heartbeat', time);
            }
        };

        const updateDuration = () => {
            setDuration(video.duration);
        };

        const handlePlay = () => {
            setIsPlaying(true);
            trackEvent('play', video.currentTime);
        };

        const handlePause = () => {
            setIsPlaying(false);
            trackEvent('pause', video.currentTime);
            // Update watch history
            updateWatchHistory(video.currentTime);
        };

        const handleEnded = () => {
            setIsPlaying(false);
            trackEvent('complete', video.duration);
            updateWatchHistory(video.duration, true);
            // Auto-play next episode after 3 seconds
            setTimeout(() => {
                onNextEpisode();
            }, 3000);
        };

        const handleSeeked = () => {
            trackEvent('seek', video.currentTime);
        };

        video.addEventListener('timeupdate', updateTime);
        video.addEventListener('loadedmetadata', updateDuration);
        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);
        video.addEventListener('ended', handleEnded);
        video.addEventListener('seeked', handleSeeked);

        return () => {
            video.removeEventListener('timeupdate', updateTime);
            video.removeEventListener('loadedmetadata', updateDuration);
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('pause', handlePause);
            video.removeEventListener('ended', handleEnded);
            video.removeEventListener('seeked', handleSeeked);
        };
    }, [onNextEpisode, trackEvent]);

    const updateWatchHistory = async (position: number, completed: boolean = false) => {
        if (!isAuthenticated) return;
        
        try {
            const token = localStorage.getItem('token');
            await fetch('/api/anime/watch-history', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    episodeId: episode._id,
                    seriesId: series._id,
                    lastPosition: position,
                    watchedDuration: position,
                    completed,
                    quality: selectedQuality?.quality || 'auto',
                    device: 'web',
                })
            });
        } catch (error) {
            console.error('Error updating watch history:', error);
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const togglePlay = () => {
        const video = videoRef.current;
        if (!video) return;

        if (isPlaying) {
            video.pause();
        } else {
            video.play();
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const video = videoRef.current;
        if (!video) return;
        const newTime = parseFloat(e.target.value);
        video.currentTime = newTime;
        setCurrentTime(newTime);
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const video = videoRef.current;
        if (!video) return;
        const newVolume = parseFloat(e.target.value);
        video.volume = newVolume;
        setVolume(newVolume);
        setIsMuted(newVolume === 0);
    };

    const toggleMute = () => {
        const video = videoRef.current;
        if (!video) return;
        video.muted = !isMuted;
        setIsMuted(!isMuted);
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            videoRef.current?.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleMouseMove = () => {
        setShowControls(true);
        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }
        controlsTimeoutRef.current = setTimeout(() => {
            if (isPlaying) {
                setShowControls(false);
            }
        }, 3000);
    };

    const handleQualityChange = (quality: QualityLevel) => {
        setSelectedQuality(quality);
        setShowQualityMenu(false);
        // In production, would switch video source here
        trackEvent('quality_change', currentTime);
    };

    const handleSubtitleChange = (subtitle: Subtitle | null) => {
        setSelectedSubtitle(subtitle);
        setShowSubtitlesMenu(false);
        const video = videoRef.current;
        if (video && trackRef.current) {
            if (subtitle) {
                trackRef.current.src = subtitle.url;
                trackRef.current.kind = 'subtitles';
                trackRef.current.srclang = subtitle.languageCode;
                trackRef.current.label = subtitle.language;
                video.textTracks[0].mode = 'showing';
            } else {
                if (video.textTracks.length > 0) {
                    video.textTracks[0].mode = 'hidden';
                }
            }
        }
        trackEvent('subtitle_change', currentTime);
    };

    const handleAudioChange = (audio: AudioTrack) => {
        setSelectedAudio(audio);
        setShowAudioMenu(false);
        // In production, would switch audio track here
        trackEvent('audio_change', currentTime);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
                    <p className="text-white text-xl">Loading player...</p>
                </div>
            </div>
        );
    }

    return (
        <div
            className="relative w-full h-screen bg-black"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => {
                if (isPlaying) {
                    setTimeout(() => setShowControls(false), 1000);
                }
            }}
        >
            {/* Video Element */}
            <video
                ref={videoRef}
                className="w-full h-full object-contain"
                onClick={togglePlay}
                poster={episode.thumbnail}
                crossOrigin="anonymous"
            >
                {selectedSubtitle && (
                    <track
                        ref={trackRef}
                        kind="subtitles"
                        srcLang={selectedSubtitle.languageCode}
                        label={selectedSubtitle.language}
                        default={selectedSubtitle.isDefault}
                    />
                )}
            </video>

            {/* Resume Prompt */}
            {resumePosition > 10 && !isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                    <div className="bg-gray-900 rounded-lg p-6 text-center">
                        <p className="text-white mb-4">Resume from {formatTime(resumePosition)}?</p>
                        <div className="flex space-x-4">
                            <button
                                onClick={() => {
                                    if (videoRef.current) {
                                        videoRef.current.currentTime = resumePosition;
                                        videoRef.current.play();
                                    }
                                }}
                                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
                            >
                                Resume
                            </button>
                            <button
                                onClick={() => {
                                    if (videoRef.current) {
                                        videoRef.current.currentTime = 0;
                                        videoRef.current.play();
                                    }
                                    setResumePosition(0);
                                }}
                                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded"
                            >
                                Start Over
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Top Bar */}
            <div
                className={`absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent transition-opacity duration-300 ${
                    showControls ? 'opacity-100' : 'opacity-0'
                }`}
            >
                <div className="flex items-center justify-between p-4">
                    <button
                        onClick={onBackToSeries}
                        className="flex items-center space-x-2 text-white hover:text-red-400 transition-colors"
                    >
                        <ChevronLeft className="w-6 h-6" />
                        <div className="hidden md:block">
                            <p className="text-sm font-semibold">{series.title}</p>
                            <p className="text-xs text-gray-400">Episode {episode.episodeNumber}: {episode.title}</p>
                        </div>
                    </button>
                    <AppModeSwitcher />
                </div>
            </div>

            {/* Center Play Button */}
            {!isPlaying && resumePosition === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <button
                        onClick={togglePlay}
                        className="w-20 h-20 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transition-all shadow-lg"
                    >
                        <Play className="w-10 h-10 text-white ml-1" />
                    </button>
                </div>
            )}

            {/* Bottom Controls */}
            <div
                className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-300 ${
                    showControls ? 'opacity-100' : 'opacity-0'
                }`}
            >
                <div className="p-4 space-y-4">
                    {/* Progress Bar */}
                    <div className="flex items-center space-x-2">
                        <input
                            type="range"
                            min="0"
                            max={duration || 0}
                            value={currentTime}
                            onChange={handleSeek}
                            className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-600"
                        />
                        <span className="text-white text-sm font-mono min-w-[80px] text-right">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                    </div>

                    {/* Control Buttons */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <button 
                                onClick={onPreviousEpisode} 
                                disabled={!hasPreviousEpisode}
                                className={`p-2 rounded transition-colors ${
                                    hasPreviousEpisode 
                                        ? 'hover:bg-white/10' 
                                        : 'opacity-50 cursor-not-allowed'
                                }`}
                                title={hasPreviousEpisode ? "Previous Episode" : "No previous episode"}
                            >
                                <SkipBack className="w-5 h-5 text-white" />
                            </button>
                            <button onClick={togglePlay} className="p-2 hover:bg-white/10 rounded transition-colors">
                                {isPlaying ? <Pause className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white" />}
                            </button>
                            <button 
                                onClick={onNextEpisode} 
                                disabled={!hasNextEpisode}
                                className={`p-2 rounded transition-colors ${
                                    hasNextEpisode 
                                        ? 'hover:bg-white/10' 
                                        : 'opacity-50 cursor-not-allowed'
                                }`}
                                title={hasNextEpisode ? "Next Episode" : "No next episode"}
                            >
                                <SkipForward className="w-5 h-5 text-white" />
                            </button>

                            {/* Volume */}
                            <div className="flex items-center space-x-2">
                                <button onClick={toggleMute} className="p-2 hover:bg-white/10 rounded transition-colors">
                                    {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
                                </button>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.01"
                                    value={isMuted ? 0 : volume}
                                    onChange={handleVolumeChange}
                                    className="w-24 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-600"
                                />
                            </div>

                            {/* Subtitles */}
                            {playbackData?.subtitles && playbackData.subtitles.length > 0 && (
                                <div className="relative">
                                    <button
                                        onClick={() => {
                                            setShowSubtitlesMenu(!showSubtitlesMenu);
                                            setShowQualityMenu(false);
                                            setShowAudioMenu(false);
                                            setShowSettings(false);
                                        }}
                                        className="p-2 hover:bg-white/10 rounded transition-colors"
                                        title="Subtitles"
                                    >
                                        <Subtitles className={`w-5 h-5 ${selectedSubtitle ? 'text-red-400' : 'text-white'}`} />
                                    </button>
                                    {showSubtitlesMenu && (
                                        <div className="absolute bottom-full left-0 mb-2 bg-gray-900 rounded-lg shadow-xl p-2 min-w-[200px] z-50">
                                            <button
                                                onClick={() => handleSubtitleChange(null)}
                                                className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-800 ${
                                                    !selectedSubtitle ? 'text-red-400 font-semibold' : 'text-white'
                                                }`}
                                            >
                                                Off
                                            </button>
                                            {playbackData.subtitles.map((sub: Subtitle) => (
                                                <button
                                                    key={sub.languageCode}
                                                    onClick={() => handleSubtitleChange(sub)}
                                                    className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-800 ${
                                                        selectedSubtitle?.languageCode === sub.languageCode ? 'text-red-400 font-semibold' : 'text-white'
                                                    }`}
                                                >
                                                    {sub.language}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Audio Tracks */}
                            {playbackData?.audioTracks && playbackData.audioTracks.length > 1 && (
                                <div className="relative">
                                    <button
                                        onClick={() => {
                                            setShowAudioMenu(!showAudioMenu);
                                            setShowSubtitlesMenu(false);
                                            setShowQualityMenu(false);
                                            setShowSettings(false);
                                        }}
                                        className="p-2 hover:bg-white/10 rounded transition-colors"
                                        title="Audio"
                                    >
                                        <Languages className="w-5 h-5 text-white" />
                                    </button>
                                    {showAudioMenu && (
                                        <div className="absolute bottom-full left-0 mb-2 bg-gray-900 rounded-lg shadow-xl p-2 min-w-[200px] z-50">
                                            {playbackData.audioTracks.map((audio: AudioTrack) => (
                                                <button
                                                    key={audio.languageCode}
                                                    onClick={() => handleAudioChange(audio)}
                                                    className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-800 ${
                                                        selectedAudio?.languageCode === audio.languageCode ? 'text-red-400 font-semibold' : 'text-white'
                                                    }`}
                                                >
                                                    {audio.language}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Quality */}
                            {playbackData?.qualityLevels && playbackData.qualityLevels.length > 1 && (
                                <div className="relative">
                                    <button
                                        onClick={() => {
                                            setShowQualityMenu(!showQualityMenu);
                                            setShowSubtitlesMenu(false);
                                            setShowAudioMenu(false);
                                            setShowSettings(false);
                                        }}
                                        className="p-2 hover:bg-white/10 rounded transition-colors"
                                        title="Quality"
                                    >
                                        <span className="text-white text-sm font-semibold">
                                            {selectedQuality?.quality || 'Auto'}
                                        </span>
                                    </button>
                                    {showQualityMenu && (
                                        <div className="absolute bottom-full left-0 mb-2 bg-gray-900 rounded-lg shadow-xl p-2 min-w-[150px] z-50">
                                            {playbackData.qualityLevels.map((quality: QualityLevel) => (
                                                <button
                                                    key={quality.quality}
                                                    onClick={() => handleQualityChange(quality)}
                                                    className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-800 ${
                                                        selectedQuality?.quality === quality.quality ? 'text-red-400 font-semibold' : 'text-white'
                                                    }`}
                                                >
                                                    {quality.quality} ({quality.bitrate}Kbps)
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Settings */}
                            <div className="relative">
                                <button
                                    onClick={() => {
                                        setShowSettings(!showSettings);
                                        setShowSubtitlesMenu(false);
                                        setShowQualityMenu(false);
                                        setShowAudioMenu(false);
                                    }}
                                    className="p-2 hover:bg-white/10 rounded transition-colors"
                                >
                                    <Settings className="w-5 h-5 text-white" />
                                </button>
                                {showSettings && (
                                    <div className="absolute bottom-full left-0 mb-2 bg-gray-900 rounded-lg shadow-xl p-2 min-w-[150px] z-50">
                                        <p className="text-white text-sm font-semibold px-2 py-1">Speed</p>
                                        {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                                            <button
                                                key={rate}
                                                onClick={() => {
                                                    if (videoRef.current) {
                                                        videoRef.current.playbackRate = rate;
                                                        setPlaybackRate(rate);
                                                    }
                                                    setShowSettings(false);
                                                }}
                                                className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-800 ${
                                                    playbackRate === rate ? 'text-red-400 font-semibold' : 'text-white'
                                                }`}
                                            >
                                                {rate}x
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <span className="text-white text-sm">Episode {episode.episodeNumber}</span>
                            <button onClick={toggleFullscreen} className="p-2 hover:bg-white/10 rounded transition-colors">
                                {isFullscreen ? <Minimize className="w-5 h-5 text-white" /> : <Maximize className="w-5 h-5 text-white" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

