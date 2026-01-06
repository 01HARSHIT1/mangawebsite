'use client';

import { useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import EnhancedVideoPlayer from './EnhancedVideoPlayer';

interface W2GVideoPlayerProps {
    episode: any;
    series: any;
    socket: Socket | null;
    roomId: string;
    isHost: boolean;
    roomState: {
        playbackTime: number;
        isPlaying: boolean;
        currentAudioTrack: string | null;
        currentSubtitle: string | null;
    } | null;
    onBackToSeries: () => void;
}

export default function W2GVideoPlayer({
    episode,
    series,
    socket,
    roomId,
    isHost,
    roomState,
    onBackToSeries,
}: W2GVideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const lastSyncTimeRef = useRef<number>(0);

    // Sync video player with room state
    useEffect(() => {
        if (!roomState || !videoRef.current) return;

        const video = videoRef.current;

        // Initial sync when room state is received
        if (Math.abs(video.currentTime - roomState.playbackTime) > 0.5) {
            setIsSyncing(true);
            video.currentTime = roomState.playbackTime;
            setTimeout(() => setIsSyncing(false), 500);
        }

        if (roomState.isPlaying && video.paused && !isHost) {
            video.play().catch(console.error);
        } else if (!roomState.isPlaying && !video.paused && !isHost) {
            video.pause();
        }
    }, [roomState, isHost]);

    // Listen for WebSocket events (non-host only)
    useEffect(() => {
        if (!socket || isHost) return;

        const handlePlay = (data: { time: number }) => {
            const video = document.querySelector('video');
            if (video && !isSyncing) {
                setIsSyncing(true);
                if (Math.abs(video.currentTime - data.time) > 0.5) {
                    video.currentTime = data.time;
                }
                video.play().catch(console.error);
                setTimeout(() => setIsSyncing(false), 500);
            }
        };

        const handlePause = (data: { time: number }) => {
            const video = document.querySelector('video');
            if (video && !isSyncing) {
                setIsSyncing(true);
                video.pause();
                if (Math.abs(video.currentTime - data.time) > 0.5) {
                    video.currentTime = data.time;
                }
                setTimeout(() => setIsSyncing(false), 500);
            }
        };

        const handleSeek = (data: { time: number }) => {
            const video = document.querySelector('video');
            if (video && !isSyncing) {
                setIsSyncing(true);
                video.currentTime = data.time;
                setTimeout(() => setIsSyncing(false), 500);
            }
        };

        const handleSync = (data: { time: number; isPlaying: boolean }) => {
            const video = document.querySelector('video');
            if (video && !isSyncing) {
                if (Math.abs(video.currentTime - data.time) > 0.5) {
                    setIsSyncing(true);
                    video.currentTime = data.time;
                    setTimeout(() => setIsSyncing(false), 500);
                }
                if (data.isPlaying && video.paused) {
                    video.play().catch(console.error);
                } else if (!data.isPlaying && !video.paused) {
                    video.pause();
                }
            }
        };

        socket.on('play', handlePlay);
        socket.on('pause', handlePause);
        socket.on('seek', handleSeek);
        socket.on('sync', handleSync);

        return () => {
            socket.off('play', handlePlay);
            socket.off('pause', handlePause);
            socket.off('seek', handleSeek);
            socket.off('sync', handleSync);
        };
    }, [socket, isHost, isSyncing]);

    // Host controls - emit events when host controls video
    useEffect(() => {
        if (!socket || !isHost) return;

        const video = document.querySelector('video');
        if (!video) return;

        const handlePlay = () => {
            socket.emit('host_play', {
                roomId,
                time: video.currentTime,
            });
        };

        const handlePause = () => {
            socket.emit('host_pause', {
                roomId,
                time: video.currentTime,
            });
        };

        const handleSeeked = () => {
            socket.emit('host_seek', {
                roomId,
                time: video.currentTime,
            });
        };

        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);
        video.addEventListener('seeked', handleSeeked);

        // Heartbeat sync every 3 seconds
        const syncInterval = setInterval(() => {
            if (socket.connected) {
                const currentTime = video.currentTime;
                const isPlaying = !video.paused;

                if (Math.abs(currentTime - lastSyncTimeRef.current) > 1) {
                    socket.emit('host_sync', {
                        roomId,
                        time: currentTime,
                        isPlaying,
                    });
                    lastSyncTimeRef.current = currentTime;
                }
            }
        }, 3000);

        return () => {
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('pause', handlePause);
            video.removeEventListener('seeked', handleSeeked);
            clearInterval(syncInterval);
        };
    }, [socket, isHost, roomId]);

    return (
        <div className="w-full h-full relative">
            <EnhancedVideoPlayer
                episode={episode}
                series={series}
                onNextEpisode={() => {}}
                onPreviousEpisode={() => {}}
                onBackToSeries={onBackToSeries}
                hasNextEpisode={false}
                hasPreviousEpisode={false}
            />
            {!isHost && (
                <div className="absolute top-4 left-4 bg-black/70 px-3 py-1 rounded text-sm">
                    <span className="text-orange-400">Following host playback</span>
                </div>
            )}
            {isHost && (
                <div className="absolute top-4 left-4 bg-orange-600/90 px-3 py-1 rounded text-sm flex items-center gap-2">
                    <span className="text-white font-semibold">👑 You are the host</span>
                </div>
            )}
        </div>
    );
}

