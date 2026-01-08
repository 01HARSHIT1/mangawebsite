'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, X, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PreviewClipPlayerProps {
    previewClipUrl: string;
    previewClipThumbnail?: string;
    previewClipDuration?: number;
    onClose?: () => void;
}

export default function PreviewClipPlayer({
    previewClipUrl,
    previewClipThumbnail,
    previewClipDuration,
    onClose
}: PreviewClipPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(previewClipDuration || 0);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const updateTime = () => setCurrentTime(video.currentTime);
        const updateDuration = () => setDuration(video.duration || previewClipDuration || 0);
        const handleEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
            if (video) video.currentTime = 0;
        };
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        video.addEventListener('timeupdate', updateTime);
        video.addEventListener('loadedmetadata', updateDuration);
        video.addEventListener('ended', handleEnded);
        document.addEventListener('fullscreenchange', handleFullscreenChange);

        return () => {
            video.removeEventListener('timeupdate', updateTime);
            video.removeEventListener('loadedmetadata', updateDuration);
            video.removeEventListener('ended', handleEnded);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, [previewClipDuration]);

    const togglePlay = () => {
        const video = videoRef.current;
        if (!video) return;

        if (isPlaying) {
            video.pause();
        } else {
            video.play().catch(console.error);
        }
        setIsPlaying(!isPlaying);
    };

    const toggleMute = () => {
        const video = videoRef.current;
        if (!video) return;
        video.muted = !isMuted;
        setIsMuted(!isMuted);
    };

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        const video = videoRef.current;
        if (!video || !duration) return;
        e.stopPropagation();

        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, clickX / rect.width));
        const newTime = percentage * duration;
        video.currentTime = newTime;
        setCurrentTime(newTime);
    };

    const toggleFullscreen = () => {
        const video = videoRef.current;
        if (!video) return;

        if (!document.fullscreenElement) {
            video.requestFullscreen().catch(console.error);
        } else {
            document.exitFullscreen();
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-black rounded-lg overflow-hidden border border-gray-800 shadow-2xl"
        >
            {/* Close Button */}
            {onClose && (
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-20 p-2 bg-black/70 hover:bg-black/90 rounded-full transition-colors"
                >
                    <X className="w-5 h-5 text-white" />
                </button>
            )}

            {/* Video Container */}
            <div className="relative w-full aspect-video bg-black">
                <video
                    ref={videoRef}
                    src={previewClipUrl}
                    className="w-full h-full object-contain"
                    poster={previewClipThumbnail}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    muted={isMuted}
                    playsInline
                />

                {/* Overlay Controls */}
                {!isPlaying && (
                    <div 
                        className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer"
                        onClick={togglePlay}
                    >
                        <div className="p-4 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm transition-colors">
                            <Play className="w-12 h-12 text-white fill-white" />
                        </div>
                    </div>
                )}

                {/* Bottom Controls */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    {/* Progress Bar */}
                    <div
                        className="relative h-1 bg-white/30 rounded-full mb-3 cursor-pointer group"
                        onClick={handleSeek}
                    >
                        <div
                            className="absolute top-0 left-0 h-full bg-orange-500 rounded-full transition-all"
                            style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                        />
                        <div
                            className="absolute top-1/2 transform -translate-y-1/2 w-3 h-3 bg-orange-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`, marginLeft: '-6px' }}
                        />
                    </div>

                    {/* Control Buttons */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={togglePlay}
                                className="p-2 hover:bg-white/10 rounded transition-colors"
                            >
                                {isPlaying ? (
                                    <div className="w-5 h-5 border-l-2 border-r-2 border-white ml-0.5" />
                                ) : (
                                    <Play className="w-5 h-5 text-white fill-white" />
                                )}
                            </button>

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

                            <span className="text-white text-sm">
                                {formatTime(currentTime)} / {formatTime(duration)}
                            </span>
                        </div>

                        <button
                            onClick={toggleFullscreen}
                            className="p-2 hover:bg-white/10 rounded transition-colors"
                        >
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Preview Badge */}
            <div className="absolute top-4 left-4 px-3 py-1 bg-orange-500/90 backdrop-blur-sm rounded-full">
                <span className="text-white text-xs font-semibold">PREVIEW</span>
            </div>
        </motion.div>
    );
}
