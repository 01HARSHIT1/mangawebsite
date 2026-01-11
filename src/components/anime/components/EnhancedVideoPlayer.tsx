'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Maximize2, SkipBack, SkipForward, ChevronLeft, Settings, Subtitles, Languages, RotateCw } from 'lucide-react';
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

interface UserPreferences {
    autoPlay?: boolean;
    autoNext?: boolean;
    autoSkip?: boolean;
    introStartTime?: number;
    introEndTime?: number;
    outroStartTime?: number;
    outroEndTime?: number;
    keyboardShortcutsEnabled?: boolean;
    defaultPlaybackSpeed?: number;
    defaultAudioTrack?: string;
}

interface VideoPlayerProps {
    episode: Episode;
    series: Series;
    onNextEpisode: () => void;
    onPreviousEpisode: () => void;
    onBackToSeries: () => void;
    hasNextEpisode?: boolean;
    hasPreviousEpisode?: boolean;
    userPreferences?: UserPreferences;
}

export default function EnhancedVideoPlayer({
    episode,
    series,
    onNextEpisode,
    onPreviousEpisode,
    onBackToSeries,
    hasNextEpisode = true,
    hasPreviousEpisode = true,
    userPreferences = {
        autoPlay: false,
        autoNext: false,
        autoSkip: false,
        keyboardShortcutsEnabled: true,
    },
}: VideoPlayerProps) {
    // Early validation - log if props are missing
    if (!episode || !series) {
        console.error('EnhancedVideoPlayer: Missing episode or series props', { episode, series });
    }
    const videoRef = useRef<HTMLVideoElement>(null);
    const { user, isAuthenticated } = useAuth();
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isPictureInPicture, setIsPictureInPicture] = useState(false);
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
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [hasEnded, setHasEnded] = useState(false);
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const trackRef = useRef<HTMLTrackElement>(null);
    const currentTimeRef = useRef(0);
    const durationRef = useRef(0);
    const selectedQualityRef = useRef<QualityLevel | null>(null);
    const hasEndedRef = useRef(false);
    const isPlayingRef = useRef(false);

    // Store episode tracks in ref - will be updated in useEffect below
    const episodeTracksRef = useRef<{ subtitles: Subtitle[]; audioTracks: AudioTrack[] }>({
        subtitles: episode?.subtitles || episode?.availableTracks?.subtitles || [],
        audioTracks: episode?.audioTracks || episode?.availableTracks?.audio || []
    });

    // Update episode tracks ref when episode changes
    useEffect(() => {
        if (!episode) return;

        episodeTracksRef.current = {
            subtitles: episode.subtitles || episode.availableTracks?.subtitles || [],
            audioTracks: episode.audioTracks || episode.availableTracks?.audio || []
        };
    }, [episode?._id, episode?.id]);

    // Keep refs in sync with state - Move these AFTER memoized values to ensure proper initialization order
    useEffect(() => {
        currentTimeRef.current = currentTime;
    }, [currentTime]);
    useEffect(() => {
        durationRef.current = duration;
    }, [duration]);
    useEffect(() => {
        selectedQualityRef.current = selectedQuality;
    }, [selectedQuality]);
    useEffect(() => {
        hasEndedRef.current = hasEnded;
    }, [hasEnded]);
    useEffect(() => {
        isPlayingRef.current = isPlaying;
    }, [isPlaying]);


    // Load playback data and resume position - trigger when episodeId changes
    useEffect(() => {
        const currentEpisodeId = (episode?._id || episode?.id || '').toString();
        if (!currentEpisodeId) {
            setLoading(false);
            return;
        }

        const loadPlaybackData = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');
                const tracks = episodeTracksRef.current;
                
                const playbackRes = await fetch(`/api/anime/episodes/${currentEpisodeId}/playback`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {}
                });

                if (playbackRes.ok) {
                    const data = await playbackRes.json();
                    setPlaybackData(data);
                    setSelectedQuality(data.qualityLevels?.[0] || null);
                    
                    // Use playback data tracks, fallback to episode props if not available
                    const availableSubtitles = data.subtitles || tracks.subtitles;
                    const availableAudioTracks = data.audioTracks || tracks.audioTracks;
                    
                    // Set default subtitle
                    if (availableSubtitles.length > 0) {
                        const defaultSubtitle = availableSubtitles.find((s: Subtitle) => s.isDefault) || availableSubtitles[0];
                        setSelectedSubtitle(defaultSubtitle);
                    }

                    // Set default audio track (prefer user preference, then episode default, then first available)
                    if (availableAudioTracks.length > 0) {
                        let defaultAudio = null;
                        const audioTrackPref = userPreferences?.defaultAudioTrack;
                        if (audioTrackPref) {
                            defaultAudio = availableAudioTracks.find((a: AudioTrack) => a.languageCode === audioTrackPref);
                        }
                        if (!defaultAudio) {
                            defaultAudio = availableAudioTracks.find((a: AudioTrack) => a.isDefault) || availableAudioTracks[0];
                        }
                        if (defaultAudio) {
                            setSelectedAudio(defaultAudio);
                        }
                    }

                    // Set default playback speed from user preferences
                    const playbackSpeedPref = userPreferences?.defaultPlaybackSpeed || 1;
                    if (playbackSpeedPref && playbackSpeedPref !== 1) {
                        const video = videoRef.current;
                        if (video) {
                            video.playbackRate = playbackSpeedPref;
                            setPlaybackRate(playbackSpeedPref);
                        }
                    }
                } else {
                    console.warn('Playback API failed, using direct video URL');
                    // Use episode props for tracks if playback API fails
                    const availableSubtitles = tracks.subtitles;
                    const availableAudioTracks = tracks.audioTracks;
                    
                    // Set default subtitle from episode props
                    if (availableSubtitles.length > 0) {
                        const defaultSubtitle = availableSubtitles.find((s: Subtitle) => s.isDefault) || availableSubtitles[0];
                        setSelectedSubtitle(defaultSubtitle);
                    }

                    // Set default audio track from episode props
                    if (availableAudioTracks.length > 0) {
                        const defaultAudio = availableAudioTracks.find((a: AudioTrack) => a.isDefault) || availableAudioTracks[0];
                        if (defaultAudio) {
                            setSelectedAudio(defaultAudio);
                        }
                    }
                }

                // Get resume position if authenticated
                if (isAuthenticated && token) {
                    try {
                        const historyRes = await fetch('/api/anime/watch-history', {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        if (historyRes.ok) {
                            const historyData = await historyRes.json();
                            const episodeHistory = historyData.watchHistory?.find((h: any) => 
                                h.episodeId === currentEpisodeId
                            );
                            if (episodeHistory && !episodeHistory.completed) {
                                setResumePosition(episodeHistory.lastPosition || 0);
                            }
                        }
                    } catch (historyError) {
                        console.error('Error fetching watch history:', historyError);
                    }
                }
            } catch (error) {
                console.error('Error loading playback data:', error);
                setErrorMessage('Failed to load video');
            } finally {
                setLoading(false);
            }
        };

        loadPlaybackData();
    }, [isAuthenticated, episode?._id, episode?.id]);

    // Set video source and resume position - set immediately from episode data, update when playbackData loads
    useEffect(() => {
        const video = videoRef.current;
        const currentEpisodeId = (episode?._id || episode?.id || '').toString();
        const currentVideoUrl = episode?.videoUrl || episode?.hlsManifestUrl || '';
        if (!video || !currentEpisodeId) return;

        // Use HLS manifest if available, otherwise fallback to videoUrl
        // Prioritize playbackData, but use episode data as immediate fallback
        const videoSrc = playbackData?.manifestUrl || playbackData?.hlsManifestUrl || playbackData?.videoUrl || currentVideoUrl;

        if (!videoSrc) {
            console.warn('No video source available for episode:', currentEpisodeId);
            setErrorMessage('Video source not available');
            setLoading(false);
            return;
        }

        // Set source if it's different or not set
        if (!video.src || videoSrc !== video.src) {
            try {
                console.log('Setting video source:', videoSrc);
                video.src = videoSrc;
                video.load(); // Reload video with new source

                // Wait for metadata to load
                const handleLoadedMetadata = () => {
                    console.log('Video metadata loaded, duration:', video.duration);
                    if (video.duration && !isNaN(video.duration)) {
                        setDuration(video.duration);
                    }
                    setLoading(false);

                    // Resume from last position after metadata loads
                    if (resumePosition > 0) {
                        video.currentTime = resumePosition;
                    }
                };

                const handleCanPlay = () => {
                    console.log('Video can play');
                    setLoading(false);
                };

                // Handle errors
                const handleError = (e: any) => {
                    console.error('Video error:', e, video.error);
                    let errorMsg = 'Failed to load video.';
                    if (video.error) {
                        switch (video.error.code) {
                            case 1: errorMsg = 'Video loading aborted.'; break;
                            case 2: errorMsg = 'Network error while loading video.'; break;
                            case 3: errorMsg = 'Video decoding error.'; break;
                            case 4: errorMsg = 'Video format not supported.'; break;
                        }
                    }
                    setErrorMessage(errorMsg);
                    setLoading(false);
                };

                video.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });
                video.addEventListener('canplay', handleCanPlay, { once: true });
                video.addEventListener('error', handleError, { once: true });

                return () => {
                    video.removeEventListener('loadedmetadata', handleLoadedMetadata);
                    video.removeEventListener('canplay', handleCanPlay);
                    video.removeEventListener('error', handleError);
                };
            } catch (error) {
                console.error('Error setting video source:', error);
                setErrorMessage('Failed to set video source');
                setLoading(false);
            }
        }

        // Load subtitles
        if (selectedSubtitle && trackRef.current) {
            try {
                trackRef.current.src = selectedSubtitle.url;
                trackRef.current.kind = 'subtitles';
                trackRef.current.srclang = selectedSubtitle.languageCode;
                trackRef.current.label = selectedSubtitle.language;
            } catch (error) {
                console.error('Error loading subtitles:', error);
            }
        }
    }, [playbackData, resumePosition, selectedSubtitle, episode?._id, episode?.id, episode?.videoUrl, episode?.hlsManifestUrl]);

    // Track playback events - defined as regular function (not useCallback) to avoid closure issues
    // Access props directly when called - props are always current
    const trackEvent = async (eventType: string, position?: number) => {
        try {
            const currentEpisodeId = (episode?._id || episode?.id || '').toString();
            const currentSeriesId = (series?._id || series?.id || '').toString();
            if (!isAuthenticated || !currentEpisodeId || !currentSeriesId) return;
            
            const token = localStorage.getItem('token');
            await fetch('/api/anime/player/event', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    episodeId: currentEpisodeId,
                    seriesId: currentSeriesId,
                    eventType,
                    position: position ?? currentTimeRef.current,
                    duration: durationRef.current,
                    quality: selectedQualityRef.current?.quality || 'auto',
                })
            });
        } catch (error) {
            console.error('Error tracking event:', error);
        }
    };

    // Update watch history - defined as regular function (not useCallback) to avoid closure issues
    // Access props directly when called - props are always current
    const updateWatchHistory = async (position: number, completed: boolean = false) => {
        try {
            const currentEpisodeId = (episode?._id || episode?.id || '').toString();
            const currentSeriesId = (series?._id || series?.id || '').toString();
            if (!isAuthenticated || !currentEpisodeId || !currentSeriesId) return;
            
            const token = localStorage.getItem('token');
            await fetch('/api/anime/watch-history', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    episodeId: currentEpisodeId,
                    seriesId: currentSeriesId,
                    lastPosition: position,
                    watchedDuration: position,
                    completed,
                    quality: selectedQualityRef.current?.quality || 'auto',
                    device: 'web',
                })
            });
        } catch (error) {
            console.error('Error updating watch history:', error);
        }
    };

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const updateTime = () => {
            const time = video.currentTime;
            const videoDuration = video.duration;

            // Update current time
            setCurrentTime(time);

            // Update duration if available and different
            if (videoDuration && !isNaN(videoDuration) && videoDuration !== durationRef.current) {
                durationRef.current = videoDuration;
                setDuration(videoDuration);
            }

            // Auto-skip intro/outro if enabled
            if (userPreferences.autoSkip && videoDuration) {
                const introStart = userPreferences.introStartTime || 0;
                const introEnd = userPreferences.introEndTime || 0;
                const outroStart = userPreferences.outroStartTime || 0;
                const outroEnd = userPreferences.outroEndTime || 0;

                // Skip intro (only if we're in the intro range and not already past it)
                if (introStart > 0 && introEnd > introStart && time >= introStart && time < introEnd) {
                    video.currentTime = introEnd;
                    return; // Return early to prevent other checks
                }

                // Skip outro (only if we're in the outro range)
                if (outroStart > 0 && outroEnd > outroStart && time >= outroStart && time < outroEnd) {
                    video.currentTime = outroEnd;
                    return; // Return early to prevent other checks
                }
            }

            // Check if video has ended (within 0.5 seconds of end)
            if (videoDuration && time >= videoDuration - 0.5) {
                if (!hasEndedRef.current) {
                    hasEndedRef.current = true;
                    setHasEnded(true);
                    setIsPlaying(false);
                }
            } else if (hasEndedRef.current && time < videoDuration - 1) {
                // Reset ended state if video is rewound
                hasEndedRef.current = false;
                setHasEnded(false);
            }

            // Track heartbeat every 10 seconds
            if (Math.floor(time) % 10 === 0 && isPlayingRef.current && !hasEndedRef.current) {
                trackEvent('heartbeat', time);
            }
        };

        const updateDuration = () => {
            const videoDuration = video.duration;
            if (videoDuration && !isNaN(videoDuration)) {
                setDuration(videoDuration);
            }
        };

        const handlePlay = () => {
            isPlayingRef.current = true;
            setIsPlaying(true);
            trackEvent('play', video.currentTime);
        };

        const handlePause = () => {
            isPlayingRef.current = false;
            setIsPlaying(false);
            trackEvent('pause', video.currentTime);
            // Update watch history
            updateWatchHistory(video.currentTime);
        };

        const handleEnded = () => {
            isPlayingRef.current = false;
            hasEndedRef.current = true;
            setIsPlaying(false);
            setHasEnded(true);
            setCurrentTime(video.duration || 0);
            trackEvent('complete', video.duration);
            updateWatchHistory(video.duration, true);

            // Auto-play next episode based on user preferences
            if (userPreferences.autoNext || userPreferences.autoPlay) {
                const delay = userPreferences.autoPlay ? 0 : 5000; // AutoPlay = immediate, AutoNext = 5s delay
                setTimeout(() => {
                    if (hasNextEpisode) {
                        onNextEpisode();
                    }
                }, delay);
            }
        };

        const handleSeeked = () => {
            trackEvent('seek', video.currentTime);
        };

        // Add all event listeners
        video.addEventListener('timeupdate', updateTime);
        video.addEventListener('loadedmetadata', updateDuration);
        video.addEventListener('durationchange', updateDuration);
        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);
        video.addEventListener('ended', handleEnded);
        video.addEventListener('seeked', handleSeeked);
        video.addEventListener('progress', () => {
            // Force update when video is buffering
            if (video.buffered.length > 0) {
                updateTime();
            }
        });

        return () => {
            video.removeEventListener('timeupdate', updateTime);
            video.removeEventListener('loadedmetadata', updateDuration);
            video.removeEventListener('durationchange', updateDuration);
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('pause', handlePause);
            video.removeEventListener('ended', handleEnded);
            video.removeEventListener('seeked', handleSeeked);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [onNextEpisode, hasNextEpisode, userPreferences, isAuthenticated, episode?._id, episode?.id, series?._id, series?.id]); // trackEvent and updateWatchHistory are regular functions that access props directly

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    // Picture-in-Picture support
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleEnterPictureInPicture = () => {
            setIsPictureInPicture(true);
        };

        const handleLeavePictureInPicture = () => {
            setIsPictureInPicture(false);
        };

        video.addEventListener('enterpictureinpicture', handleEnterPictureInPicture);
        video.addEventListener('leavepictureinpicture', handleLeavePictureInPicture);

        return () => {
            video.removeEventListener('enterpictureinpicture', handleEnterPictureInPicture);
            video.removeEventListener('leavepictureinpicture', handleLeavePictureInPicture);
        };
    }, []);

    const togglePictureInPicture = async () => {
        const video = videoRef.current;
        if (!video) return;

        try {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
            } else if (document.pictureInPictureEnabled) {
                await video.requestPictureInPicture();
            } else {
                alert('Picture-in-Picture is not supported in this browser');
            }
        } catch (error) {
            console.error('Error toggling Picture-in-Picture:', error);
        }
    };

    // Keyboard shortcuts
    useEffect(() => {
        if (!userPreferences.keyboardShortcutsEnabled) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            const video = videoRef.current;
            if (!video) return;

            // Don't trigger shortcuts when typing in inputs
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
                return;
            }

            switch (e.key) {
                case ' ': // Space - Play/Pause
                    e.preventDefault();
                    togglePlay();
                    break;
                case 'ArrowLeft': // Left Arrow - Rewind 10 seconds
                    e.preventDefault();
                    video.currentTime = Math.max(0, video.currentTime - 10);
                    break;
                case 'ArrowRight': // Right Arrow - Forward 10 seconds
                    e.preventDefault();
                    video.currentTime = Math.min(video.duration, video.currentTime + 10);
                    break;
                case 'ArrowUp': // Up Arrow - Increase volume
                    e.preventDefault();
                    const newVolumeUp = Math.min(1, volume + 0.1);
                    video.volume = newVolumeUp;
                    setVolume(newVolumeUp);
                    setIsMuted(false);
                    break;
                case 'ArrowDown': // Down Arrow - Decrease volume
                    e.preventDefault();
                    const newVolumeDown = Math.max(0, volume - 0.1);
                    video.volume = newVolumeDown;
                    setVolume(newVolumeDown);
                    setIsMuted(newVolumeDown === 0);
                    break;
                case 'm': // M - Mute/Unmute
                case 'M':
                    e.preventDefault();
                    toggleMute();
                    break;
                case 'f': // F - Fullscreen
                case 'F':
                    e.preventDefault();
                    toggleFullscreen();
                    break;
                case 'n': // N - Next episode
                case 'N':
                    if (hasNextEpisode) {
                        e.preventDefault();
                        onNextEpisode();
                    }
                    break;
                case 'p': // P - Previous episode
                case 'P':
                    if (hasPreviousEpisode) {
                        e.preventDefault();
                        onPreviousEpisode();
                    }
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [userPreferences.keyboardShortcutsEnabled, volume, isMuted, hasNextEpisode, hasPreviousEpisode, onNextEpisode, onPreviousEpisode, togglePlay, toggleMute, toggleFullscreen]);

    const togglePlay = async () => {
        const video = videoRef.current;
        if (!video) {
            console.warn('Video element not found');
            return;
        }

        // If video has ended, restart from beginning
        if (hasEnded) {
            video.currentTime = 0;
            setHasEnded(false);
            setCurrentTime(0);
        }

        if (!video.src) {
            console.warn('Video source not set');
            // Try to set source from episode data
            const videoSrc = playbackData?.manifestUrl || playbackData?.hlsManifestUrl || playbackData?.videoUrl || episode.videoUrl || episode.hlsManifestUrl;
            if (videoSrc) {
                video.src = videoSrc;
                video.load();
            } else {
                console.error('No video source available');
                return;
            }
        }

        try {
            if (isPlaying) {
                video.pause();
            } else {
                // Ensure video is ready before playing
                if (video.readyState < 2) {
                    await new Promise((resolve) => {
                        const handleCanPlay = () => {
                            video.removeEventListener('canplay', handleCanPlay);
                            resolve(null);
                        };
                        video.addEventListener('canplay', handleCanPlay);
                        video.load();
                    });
                }
                await video.play();
                setIsPlaying(true);
                setHasEnded(false);
            }
        } catch (error: any) {
            console.error('Error toggling play:', error);
            if (error.name === 'NotAllowedError') {
                console.warn('Playback was prevented. User interaction may be required.');
            }
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const video = videoRef.current;
        if (!video) return;
        const newTime = parseFloat(e.target.value);
        video.currentTime = newTime;
        setCurrentTime(newTime);

        // Reset ended state if user seeks away from end
        if (hasEnded && newTime < (duration - 1)) {
            setHasEnded(false);
        }
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
        if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
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

    const handleAudioChange = async (audio: AudioTrack) => {
        setSelectedAudio(audio);
        setShowAudioMenu(false);
        // In production, would switch audio track here
        trackEvent('audio_change', currentTime);

        // Save audio track preference
        if (isAuthenticated && audio) {
            try {
                const token = localStorage.getItem('token');
                await fetch('/api/anime/user-preferences', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        defaultAudioTrack: audio.languageCode,
                        defaultAudioLanguage: audio.language,
                    }),
                });
            } catch (error) {
                console.error('Error saving audio preference:', error);
            }
        }
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
                poster={episode?.thumbnail}
                crossOrigin="anonymous"
                preload="metadata"
                playsInline
                webkit-playsinline="true"
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

            {/* Error Message */}
            {errorMessage && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
                    <div className="bg-red-900/90 rounded-lg p-6 text-center max-w-md">
                        <p className="text-white mb-4">{errorMessage}</p>
                        <button
                            onClick={() => {
                                setErrorMessage(null);
                                if (videoRef.current) {
                                    const videoSrc = playbackData?.manifestUrl || playbackData?.hlsManifestUrl || playbackData?.videoUrl || episode.videoUrl || episode.hlsManifestUrl;
                                    if (videoSrc) {
                                        videoRef.current.src = videoSrc;
                                        videoRef.current.load();
                                    }
                                }
                            }}
                            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            )}

            {/* Resume Prompt */}
            {resumePosition > 10 && !isPlaying && !errorMessage && (
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
                className={`absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'
                    }`}
            >
                <div className="flex items-center justify-between p-4">
                    <button
                        onClick={onBackToSeries}
                        className="flex items-center space-x-2 text-white hover:text-red-400 transition-colors"
                    >
                        <ChevronLeft className="w-6 h-6" />
                        <div className="hidden md:block">
                            <p className="text-sm font-semibold">{series?.title || 'Loading...'}</p>
                            <p className="text-xs text-gray-400">Episode {episode?.episodeNumber || 1}: {episode?.title || 'Untitled'}</p>
                        </div>
                    </button>
                    <AppModeSwitcher />
                </div>
            </div>

            {/* Center Play/Replay Button */}
            {!isPlaying && (resumePosition === 0 || hasEnded) && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <button
                        onClick={togglePlay}
                        className={`w-20 h-20 ${hasEnded ? 'bg-orange-600 hover:bg-orange-700' : 'bg-red-600 hover:bg-red-700'} rounded-full flex items-center justify-center transition-all shadow-lg hover:scale-110`}
                        title={hasEnded ? 'Replay' : 'Play'}
                    >
                        {hasEnded ? (
                            <RotateCw className="w-10 h-10 text-white" />
                        ) : (
                            <Play className="w-10 h-10 text-white ml-1" />
                        )}
                    </button>
                </div>
            )}

            {/* Bottom Controls */}
            <div
                className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'
                    }`}
            >
                <div className="p-4 space-y-4">
                    {/* Progress Bar */}
                    <div className="flex items-center space-x-2">
                        <input
                            type="range"
                            min="0"
                            max={duration || 0}
                            step="0.1"
                            value={currentTime}
                            onChange={handleSeek}
                            className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-600"
                            style={{
                                background: duration ? `linear-gradient(to right, #dc2626 0%, #dc2626 ${(currentTime / duration) * 100}%, #374151 ${(currentTime / duration) * 100}%, #374151 100%)` : undefined
                            }}
                        />
                        <span className="text-white text-sm font-mono min-w-[80px] text-right">
                            {formatTime(currentTime)} / {formatTime(duration || 0)}
                        </span>
                    </div>

                    {/* Control Buttons */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={onPreviousEpisode}
                                disabled={!hasPreviousEpisode}
                                className={`p-2 rounded transition-colors ${hasPreviousEpisode
                                    ? 'hover:bg-white/10'
                                    : 'opacity-50 cursor-not-allowed'
                                    }`}
                                title={hasPreviousEpisode ? "Previous Episode" : "No previous episode"}
                            >
                                <SkipBack className="w-5 h-5 text-white" />
                            </button>
                            <button
                                onClick={togglePlay}
                                className="p-2 hover:bg-white/10 rounded transition-colors"
                                title={hasEnded ? 'Replay' : isPlaying ? 'Pause' : 'Play'}
                            >
                                {hasEnded ? (
                                    <RotateCw className="w-6 h-6 text-white" />
                                ) : isPlaying ? (
                                    <Pause className="w-6 h-6 text-white" />
                                ) : (
                                    <Play className="w-6 h-6 text-white" />
                                )}
                            </button>
                            <button
                                onClick={onNextEpisode}
                                disabled={!hasNextEpisode}
                                className={`p-2 rounded transition-colors ${hasNextEpisode
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
                            {((playbackData?.subtitles && playbackData.subtitles.length > 0) || (episode.subtitles && episode.subtitles.length > 0) || (episode.availableTracks?.subtitles && episode.availableTracks.subtitles.length > 0)) && (
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
                                                className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-800 ${!selectedSubtitle ? 'text-red-400 font-semibold' : 'text-white'
                                                    }`}
                                            >
                                                Off
                                            </button>
                                            {(playbackData?.subtitles || episode.subtitles || episode.availableTracks?.subtitles || []).map((sub: Subtitle) => (
                                                <button
                                                    key={sub.languageCode}
                                                    onClick={() => handleSubtitleChange(sub)}
                                                    className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-800 ${selectedSubtitle?.languageCode === sub.languageCode ? 'text-red-400 font-semibold' : 'text-white'
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
                            {((playbackData?.audioTracks && playbackData.audioTracks.length > 1) || ((episode.audioTracks || episode.availableTracks?.audio || []).length > 1)) && (
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
                                            {(playbackData?.audioTracks || episode.audioTracks || episode.availableTracks?.audio || []).map((audio: AudioTrack) => (
                                                <button
                                                    key={audio.languageCode}
                                                    onClick={() => handleAudioChange(audio)}
                                                    className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-800 ${selectedAudio?.languageCode === audio.languageCode ? 'text-red-400 font-semibold' : 'text-white'
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
                                                    className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-800 ${selectedQuality?.quality === quality.quality ? 'text-red-400 font-semibold' : 'text-white'
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
                                                onClick={async () => {
                                                    if (videoRef.current) {
                                                        videoRef.current.playbackRate = rate;
                                                        setPlaybackRate(rate);

                                                        // Save playback speed preference
                                                        if (isAuthenticated) {
                                                            try {
                                                                const token = localStorage.getItem('token');
                                                                await fetch('/api/anime/user-preferences', {
                                                                    method: 'POST',
                                                                    headers: {
                                                                        'Content-Type': 'application/json',
                                                                        Authorization: `Bearer ${token}`,
                                                                    },
                                                                    body: JSON.stringify({
                                                                        defaultPlaybackSpeed: rate,
                                                                    }),
                                                                });
                                                            } catch (error) {
                                                                console.error('Error saving playback speed preference:', error);
                                                            }
                                                        }
                                                    }
                                                    setShowSettings(false);
                                                }}
                                                className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-800 ${playbackRate === rate ? 'text-red-400 font-semibold' : 'text-white'
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
                            {document.pictureInPictureEnabled && (
                                <button
                                    onClick={togglePictureInPicture}
                                    className="p-2 hover:bg-white/10 rounded transition-colors"
                                    title={isPictureInPicture ? 'Exit Picture-in-Picture' : 'Enter Picture-in-Picture'}
                                >
                                    <Maximize2 className={`w-5 h-5 ${isPictureInPicture ? 'text-orange-500' : 'text-white'}`} />
                                </button>
                            )}
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

