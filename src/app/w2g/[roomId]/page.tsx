'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import Link from 'next/link';
import Image from 'next/image';
import { Users, MessageCircle, Send, Smile, X, Copy, Share2, Crown, Volume2, VolumeX } from 'lucide-react';
import W2GVideoPlayer from '@/components/anime/components/W2GVideoPlayer';

interface Participant {
    userId: string;
    username: string;
    isHost: boolean;
    isMuted: boolean;
}

interface ChatMessage {
    userId: string;
    username: string;
    message: string;
    timestamp: Date;
}

interface RoomState {
    playbackTime: number;
    isPlaying: boolean;
    currentAudioTrack: string | null;
    currentSubtitle: string | null;
    isHost: boolean;
}

export default function W2GRoomPage() {
    const params = useParams();
    const router = useRouter();
    const roomId = params?.roomId as string;
    
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [room, setRoom] = useState<any>(null);
    const [roomState, setRoomState] = useState<RoomState | null>(null);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [episode, setEpisode] = useState<any>(null);
    const [series, setSeries] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const lastSyncTimeRef = useRef<number>(0);

    // Scroll chat to bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    // Initialize room and socket
    useEffect(() => {
        if (!roomId) return;

        const initializeRoom = async () => {
            try {
                const token = localStorage.getItem('authToken') || localStorage.getItem('token');
                if (!token) {
                    setError('Please sign in to join a watch room');
                    setLoading(false);
                    return;
                }

                // Fetch room details
                const roomResponse = await fetch(`/api/w2g/rooms/${roomId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!roomResponse.ok) {
                    const errorData = await roomResponse.json();
                    setError(errorData.error || 'Room not found');
                    setLoading(false);
                    return;
                }

                const roomData = await roomResponse.json();
                setRoom(roomData.room);
                setEpisode(roomData.room.episode);
                setSeries(roomData.room.series);

                // Join room via API
                const joinResponse = await fetch(`/api/w2g/rooms/${roomId}/join`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!joinResponse.ok) {
                    const errorData = await joinResponse.json();
                    setError(errorData.error || 'Failed to join room');
                    setLoading(false);
                    return;
                }

                const joinData = await joinResponse.json();
                setRoomState({
                    playbackTime: joinData.roomState.playbackTime,
                    isPlaying: joinData.roomState.isPlaying,
                    currentAudioTrack: joinData.roomState.currentAudioTrack,
                    currentSubtitle: joinData.roomState.currentSubtitle,
                    isHost: roomData.room.isHost,
                });

                // Initialize Socket.IO connection
                const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000';
                const newSocket = io(socketUrl, {
                    path: '/api/w2g/socket',
                    transports: ['websocket', 'polling'],
                });

                newSocket.on('connect', () => {
                    console.log('Socket connected');
                    setIsConnected(true);
                    
                    // Authenticate
                    newSocket.emit('authenticate', { token });
                });

                newSocket.on('authenticated', () => {
                    console.log('Socket authenticated');
                    // Join room
                    newSocket.emit('join_room', { roomId });
                });

                newSocket.on('room_state', (state: RoomState) => {
                    console.log('Received room state:', state);
                    setRoomState(state);
                    
                    // Sync will be handled by individual play/pause/seek events
                    // This just sets the initial state
                });

                newSocket.on('play', (data: { time: number }) => {
                    if (!roomState?.isHost) {
                        // Find video element and sync
                        const video = document.querySelector('video');
                        if (video) {
                            if (Math.abs(video.currentTime - data.time) > 0.5) {
                                video.currentTime = data.time;
                            }
                            video.play().catch(console.error);
                        }
                    }
                    setRoomState(prev => prev ? { ...prev, playbackTime: data.time, isPlaying: true } : null);
                });

                newSocket.on('pause', (data: { time: number }) => {
                    if (!roomState?.isHost) {
                        const video = document.querySelector('video');
                        if (video) {
                            video.pause();
                            if (Math.abs(video.currentTime - data.time) > 0.5) {
                                video.currentTime = data.time;
                            }
                        }
                    }
                    setRoomState(prev => prev ? { ...prev, playbackTime: data.time, isPlaying: false } : null);
                });

                newSocket.on('seek', (data: { time: number }) => {
                    if (!roomState?.isHost) {
                        const video = document.querySelector('video');
                        if (video) {
                            video.currentTime = data.time;
                        }
                    }
                    setRoomState(prev => prev ? { ...prev, playbackTime: data.time } : null);
                });

                newSocket.on('sync', (data: { time: number; isPlaying: boolean }) => {
                    if (!roomState?.isHost) {
                        const video = document.querySelector('video');
                        if (video) {
                            if (Math.abs(video.currentTime - data.time) > 0.5) {
                                video.currentTime = data.time;
                            }
                            if (data.isPlaying && video.paused) {
                                video.play().catch(console.error);
                            } else if (!data.isPlaying && !video.paused) {
                                video.pause();
                            }
                        }
                    }
                    setRoomState(prev => prev ? { ...prev, playbackTime: data.time, isPlaying: data.isPlaying } : null);
                });

                newSocket.on('audio_change', (data: { track: string }) => {
                    setRoomState(prev => prev ? { ...prev, currentAudioTrack: data.track } : null);
                });

                newSocket.on('subtitle_change', (data: { subtitle: string | null }) => {
                    setRoomState(prev => prev ? { ...prev, currentSubtitle: data.subtitle } : null);
                });

                newSocket.on('participants_update', (participantsList: Participant[]) => {
                    setParticipants(participantsList);
                });

                newSocket.on('participant_joined', (data: { userId: string; username: string; participantCount: number }) => {
                    console.log(`${data.username} joined the room`);
                });

                newSocket.on('participant_left', (data: { userId: string; participantCount: number }) => {
                    console.log('Participant left the room');
                });

                newSocket.on('chat_message', (message: ChatMessage) => {
                    setChatMessages(prev => [...prev, message]);
                });

                newSocket.on('reaction', (data: { userId: string; username: string; emoji: string; timestamp: Date }) => {
                    // Show reaction animation (can be enhanced later)
                    console.log(`${data.username} reacted with ${data.emoji}`);
                });

                newSocket.on('error', (data: { message: string }) => {
                    console.error('Socket error:', data.message);
                    setError(data.message);
                });

                newSocket.on('disconnect', () => {
                    console.log('Socket disconnected');
                    setIsConnected(false);
                });

                setSocket(newSocket);
                setLoading(false);

                // Heartbeat sync is now handled by W2GVideoPlayer component

            } catch (error) {
                console.error('Error initializing room:', error);
                setError('Failed to initialize room');
                setLoading(false);
            }
        };

        initializeRoom();

        return () => {
            if (socket) {
                socket.emit('leave_room', { roomId });
                socket.disconnect();
            }
        };
    }, [roomId]);

    // Video player events are now handled by W2GVideoPlayer component

    const handleSendMessage = () => {
        if (socket && chatInput.trim()) {
            socket.emit('chat_message', {
                roomId,
                message: chatInput.trim(),
            });
            setChatInput('');
        }
    };

    const handleReaction = (emoji: string) => {
        if (socket) {
            socket.emit('reaction', { roomId, emoji });
        }
    };

    const copyRoomLink = () => {
        const link = `${window.location.origin}/w2g/${roomId}`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const leaveRoom = async () => {
        if (socket) {
            socket.emit('leave_room', { roomId });
            socket.disconnect();
        }
        
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        if (token) {
            await fetch(`/api/w2g/rooms/${roomId}/join`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
        }
        
        router.push(`/anime/${series?._id}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                    <p className="text-white text-xl">Loading room...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <p className="text-white text-xl mb-4">{error}</p>
                    <Link href="/anime" className="text-orange-400 hover:text-orange-500">
                        Back to Home
                    </Link>
                </div>
            </div>
        );
    }

    if (!room || !episode || !series) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <p className="text-white text-xl mb-4">Room data not available</p>
                    <Link href="/anime" className="text-orange-400 hover:text-orange-500">
                        Back to Home
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Header */}
            <div className="bg-gray-900 border-b border-gray-800 px-4 py-3">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={`/anime/${series._id}`} className="text-orange-400 hover:text-orange-500">
                            ← Back
                        </Link>
                        <div>
                            <h1 className="text-lg font-bold">{room.roomName}</h1>
                            <p className="text-sm text-gray-400">
                                {series.title} - Episode {episode.episodeNumber}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm">
                            <Users className="w-4 h-4" />
                            <span>{participants.length} watching</span>
                        </div>
                        {roomState?.isHost && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-orange-600 rounded text-sm">
                                <Crown className="w-4 h-4" />
                                <span>Host</span>
                            </div>
                        )}
                        <button
                            onClick={copyRoomLink}
                            className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-sm flex items-center gap-2"
                        >
                            <Copy className="w-4 h-4" />
                            {copied ? 'Copied!' : 'Copy Link'}
                        </button>
                        <button
                            onClick={leaveRoom}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
                        >
                            Leave
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex h-[calc(100vh-64px)]">
                {/* Video Player - Left Side */}
                <div className="flex-1 bg-black relative">
                    {episode && series && socket ? (
                        <W2GVideoPlayer
                            episode={{
                                _id: episode._id,
                                id: episode._id,
                                episodeNumber: episode.episodeNumber,
                                title: episode.title || `Episode ${episode.episodeNumber}`,
                                videoUrl: episode.videoUrl,
                                hlsManifestUrl: episode.hlsManifestUrl,
                                dashManifestUrl: episode.dashManifestUrl,
                                thumbnail: episode.thumbnail,
                                audioTracks: episode.audioTracks || [],
                                subtitles: episode.subtitles || [],
                                availableTracks: {
                                    audio: episode.audioTracks || [],
                                    subtitles: episode.subtitles || [],
                                },
                            }}
                            series={{
                                _id: series._id,
                                title: series.title,
                                coverImage: series.coverImage,
                            }}
                            socket={socket}
                            roomId={roomId}
                            isHost={roomState?.isHost || false}
                            roomState={roomState}
                            onBackToSeries={() => router.push(`/anime/${series._id}`)}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <p className="text-gray-500">Loading episode...</p>
                        </div>
                    )}
                </div>

                {/* Sidebar - Right Side */}
                <div className="w-96 bg-gray-900 border-l border-gray-800 flex flex-col">
                    {/* Participants */}
                    <div className="p-4 border-b border-gray-800">
                        <h3 className="font-semibold mb-2 flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Participants ({participants.length})
                        </h3>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                            {participants.map((participant) => {
                                const token = localStorage.getItem('authToken') || localStorage.getItem('token');
                                const currentUserId = token ? (JSON.parse(atob(token.split('.')[1]))).userId || (JSON.parse(atob(token.split('.')[1])))._id : null;
                                const isCurrentUser = participant.userId === currentUserId;
                                
                                return (
                                    <div
                                        key={participant.userId}
                                        className="flex items-center justify-between text-sm"
                                    >
                                        <div className="flex items-center gap-2">
                                            {participant.isHost && <Crown className="w-3 h-3 text-orange-500" />}
                                            <span>{participant.username} {isCurrentUser && '(You)'}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {participant.isMuted && (
                                                <VolumeX className="w-3 h-3 text-gray-500" />
                                            )}
                                            {roomState?.isHost && !participant.isHost && (
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={async () => {
                                                            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
                                                            const response = await fetch(`/api/w2g/rooms/${roomId}/host`, {
                                                                method: 'POST',
                                                                headers: {
                                                                    'Content-Type': 'application/json',
                                                                    Authorization: `Bearer ${token}`,
                                                                },
                                                                body: JSON.stringify({
                                                                    action: participant.isMuted ? 'unmute' : 'mute',
                                                                    targetUserId: participant.userId,
                                                                }),
                                                            });
                                                            if (response.ok) {
                                                                // Participants will be updated via socket
                                                            }
                                                        }}
                                                        className="text-xs text-gray-400 hover:text-white p-1"
                                                        title={participant.isMuted ? 'Unmute' : 'Mute'}
                                                    >
                                                        {participant.isMuted ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
                                                    </button>
                                                    <button
                                                        onClick={async () => {
                                                            if (confirm(`Kick ${participant.username} from the room?`)) {
                                                                const token = localStorage.getItem('authToken') || localStorage.getItem('token');
                                                                const response = await fetch(`/api/w2g/rooms/${roomId}/host`, {
                                                                    method: 'POST',
                                                                    headers: {
                                                                        'Content-Type': 'application/json',
                                                                        Authorization: `Bearer ${token}`,
                                                                    },
                                                                    body: JSON.stringify({
                                                                        action: 'kick',
                                                                        targetUserId: participant.userId,
                                                                    }),
                                                                });
                                                                if (response.ok) {
                                                                    // Participant will be removed via socket
                                                                }
                                                            }
                                                        }}
                                                        className="text-xs text-red-400 hover:text-red-500 p-1"
                                                        title="Kick"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                    <button
                                                        onClick={async () => {
                                                            if (confirm(`Transfer host to ${participant.username}?`)) {
                                                                const token = localStorage.getItem('authToken') || localStorage.getItem('token');
                                                                const response = await fetch(`/api/w2g/rooms/${roomId}/host`, {
                                                                    method: 'POST',
                                                                    headers: {
                                                                        'Content-Type': 'application/json',
                                                                        Authorization: `Bearer ${token}`,
                                                                    },
                                                                    body: JSON.stringify({
                                                                        action: 'transfer_host',
                                                                        targetUserId: participant.userId,
                                                                    }),
                                                                });
                                                                if (response.ok) {
                                                                    alert('Host transferred successfully!');
                                                                    // Room state will update via socket
                                                                }
                                                            }
                                                        }}
                                                        className="text-xs text-orange-400 hover:text-orange-500 p-1"
                                                        title="Transfer Host"
                                                    >
                                                        <Crown className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Chat */}
                    <div className="flex-1 flex flex-col">
                        <div className="p-4 border-b border-gray-800">
                            <h3 className="font-semibold mb-2 flex items-center gap-2">
                                <MessageCircle className="w-4 h-4" />
                                Chat
                            </h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {chatMessages.map((msg, idx) => (
                                <div key={idx} className="text-sm">
                                    <span className="font-semibold text-orange-400">{msg.username}:</span>
                                    <span className="ml-2">{msg.message}</span>
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>
                        <div className="p-4 border-t border-gray-800">
                            <div className="flex gap-2 mb-2">
                                {['😂', '🔥', '❤️', '👏', '😢', '😮'].map((emoji) => (
                                    <button
                                        key={emoji}
                                        onClick={() => handleReaction(emoji)}
                                        className="text-xl hover:scale-125 transition-transform"
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            handleSendMessage();
                                        }
                                    }}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
                                />
                                <button
                                    onClick={handleSendMessage}
                                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

