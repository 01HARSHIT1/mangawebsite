'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, SkipBack, SkipForward, ChevronLeft, Settings } from 'lucide-react';
import AppModeSwitcher from '@/components/AppModeSwitcher';

interface Episode {
    _id: string;
    episodeNumber: number;
    title: string;
    description?: string;
    videoUrl: string;
    thumbnail?: string;
    duration?: number;
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
}

export default function VideoPlayer({
    episode,
    series,
    onNextEpisode,
    onPreviousEpisode,
    onBackToSeries,
}: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [showSettings, setShowSettings] = useState(false);
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const updateTime = () => setCurrentTime(video.currentTime);
        const updateDuration = () => setDuration(video.duration);
        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);
        const handleEnded = () => {
            setIsPlaying(false);
            // Auto-play next episode after 3 seconds
            setTimeout(() => {
                onNextEpisode();
            }, 3000);
        };

        video.addEventListener('timeupdate', updateTime);
        video.addEventListener('loadedmetadata', updateDuration);
        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);
        video.addEventListener('ended', handleEnded);

        return () => {
            video.removeEventListener('timeupdate', updateTime);
            video.removeEventListener('loadedmetadata', updateDuration);
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('pause', handlePause);
            video.removeEventListener('ended', handleEnded);
        };
    }, [onNextEpisode]);

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
                src={episode.videoUrl}
                className="w-full h-full object-contain"
                onClick={togglePlay}
                poster={episode.thumbnail}
            />

            {/* Top Bar - Series Info & Controls */}
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

                    <div className="flex items-center space-x-4">
                        <AppModeSwitcher />
                    </div>
                </div>
            </div>

            {/* Center Play Button */}
            {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <button
                        onClick={togglePlay}
                        className="w-20 h-20 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transition-all shadow-lg"
                    >
                        <Play className="w-10 h-10 text-white ml-1" />
                    </button>
                </div>
            )}

            {/* Bottom Controls Bar */}
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
                                className="p-2 hover:bg-white/10 rounded transition-colors"
                                title="Previous Episode"
                            >
                                <SkipBack className="w-5 h-5 text-white" />
                            </button>
                            <button
                                onClick={togglePlay}
                                className="p-2 hover:bg-white/10 rounded transition-colors"
                            >
                                {isPlaying ? (
                                    <Pause className="w-6 h-6 text-white" />
                                ) : (
                                    <Play className="w-6 h-6 text-white" />
                                )}
                            </button>
                            <button
                                onClick={onNextEpisode}
                                className="p-2 hover:bg-white/10 rounded transition-colors"
                                title="Next Episode"
                            >
                                <SkipForward className="w-5 h-5 text-white" />
                            </button>

                            {/* Volume Control */}
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={toggleMute}
                                    className="p-2 hover:bg-white/10 rounded transition-colors"
                                >
                                    {isMuted ? (
                                        <VolumeX className="w-5 h-5 text-white" />
                                    ) : (
                                        <Volume2 className="w-5 h-5 text-white" />
                                    )}
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

                            {/* Settings */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowSettings(!showSettings)}
                                    className="p-2 hover:bg-white/10 rounded transition-colors"
                                >
                                    <Settings className="w-5 h-5 text-white" />
                                </button>
                                {showSettings && (
                                    <div className="absolute bottom-full left-0 mb-2 bg-gray-900 rounded-lg shadow-xl p-2 min-w-[150px]">
                                        <div className="space-y-1">
                                            <p className="text-white text-sm font-semibold px-2 py-1">Playback Speed</p>
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
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <span className="text-white text-sm">
                                Episode {episode.episodeNumber}
                            </span>
                            <button
                                onClick={toggleFullscreen}
                                className="p-2 hover:bg-white/10 rounded transition-colors"
                            >
                                {isFullscreen ? (
                                    <Minimize className="w-5 h-5 text-white" />
                                ) : (
                                    <Maximize className="w-5 h-5 text-white" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

