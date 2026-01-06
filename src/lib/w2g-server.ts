import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

interface RoomState {
    roomId: string;
    hostUserId: string;
    playbackTime: number;
    isPlaying: boolean;
    currentAudioTrack: string | null;
    currentSubtitle: string | null;
    participants: Map<string, Participant>;
    lastSyncTime: number;
}

interface Participant {
    userId: string;
    username: string;
    socketId: string;
    isHost: boolean;
    isMuted: boolean;
    joinedAt: Date;
}

// In-memory room storage (for MVP - can be replaced with Redis later)
const rooms = new Map<string, RoomState>();

// Initialize Socket.IO server
let io: SocketIOServer | null = null;

export function initializeW2GServer(httpServer: HTTPServer) {
    io = new SocketIOServer(httpServer, {
        cors: {
            origin: process.env.NEXT_PUBLIC_BASE_URL || '*',
            methods: ['GET', 'POST'],
            credentials: true,
        },
        path: '/api/w2g/socket',
    });

    io.on('connection', async (socket) => {
        console.log('W2G client connected:', socket.id);

        // Authenticate user
        let userId: string | null = null;
        let username: string | null = null;

        socket.on('authenticate', async (data: { token: string }) => {
            try {
                const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
                const payload = jwt.verify(data.token, JWT_SECRET) as any;
                userId = payload.userId || payload._id;
                username = payload.username || payload.email?.split('@')[0] || 'User';
                socket.emit('authenticated', { userId, username });
            } catch (error) {
                socket.emit('auth_error', { error: 'Invalid token' });
            }
        });

        // Join room
        socket.on('join_room', async (data: { roomId: string }) => {
            if (!userId) {
                socket.emit('error', { message: 'Not authenticated' });
                return;
            }

            const { roomId } = data;
            const client = await clientPromise;
            const db = client.db('mangawebsite');

            // Get room from database
            const roomDoc = await db.collection('w2g_rooms').findOne({ roomId });
            if (!roomDoc) {
                socket.emit('error', { message: 'Room not found' });
                return;
            }

            // Join socket room
            socket.join(roomId);

            // Initialize or get room state
            if (!rooms.has(roomId)) {
                rooms.set(roomId, {
                    roomId,
                    hostUserId: roomDoc.hostUserId.toString(),
                    playbackTime: roomDoc.playbackTime || 0,
                    isPlaying: roomDoc.isPlaying || false,
                    currentAudioTrack: roomDoc.currentAudioTrack || null,
                    currentSubtitle: roomDoc.currentSubtitle || null,
                    participants: new Map(),
                    lastSyncTime: Date.now(),
                });
            }

            const roomState = rooms.get(roomId)!;
            const isHost = roomState.hostUserId === userId;

            // Add participant
            roomState.participants.set(userId, {
                userId,
                username: username || 'User',
                socketId: socket.id,
                isHost,
                isMuted: false,
                joinedAt: new Date(),
            });

            // Send current room state to new participant
            socket.emit('room_state', {
                playbackTime: roomState.playbackTime,
                isPlaying: roomState.isPlaying,
                currentAudioTrack: roomState.currentAudioTrack,
                currentSubtitle: roomState.currentSubtitle,
                isHost,
            });

            // Notify others
            socket.to(roomId).emit('participant_joined', {
                userId,
                username,
                participantCount: roomState.participants.size,
            });

            // Send participant list
            const participantsList = Array.from(roomState.participants.values()).map((p) => ({
                userId: p.userId,
                username: p.username,
                isHost: p.isHost,
                isMuted: p.isMuted,
            }));

            io!.to(roomId).emit('participants_update', participantsList);
        });

        // Host controls - PLAY
        socket.on('host_play', async (data: { roomId: string; time: number }) => {
            if (!userId) return;

            const { roomId, time } = data;
            const roomState = rooms.get(roomId);

            if (!roomState || roomState.hostUserId !== userId) {
                socket.emit('error', { message: 'Only host can control playback' });
                return;
            }

            roomState.playbackTime = time;
            roomState.isPlaying = true;
            roomState.lastSyncTime = Date.now();

            // Update database
            const client = await clientPromise;
            const db = client.db('mangawebsite');
            await db.collection('w2g_rooms').updateOne(
                { roomId },
                {
                    $set: {
                        playbackTime: time,
                        isPlaying: true,
                        updatedAt: new Date(),
                    },
                }
            );

            // Broadcast to all participants
            socket.to(roomId).emit('play', { time });
        });

        // Host controls - PAUSE
        socket.on('host_pause', async (data: { roomId: string; time: number }) => {
            if (!userId) return;

            const { roomId, time } = data;
            const roomState = rooms.get(roomId);

            if (!roomState || roomState.hostUserId !== userId) {
                socket.emit('error', { message: 'Only host can control playback' });
                return;
            }

            roomState.playbackTime = time;
            roomState.isPlaying = false;
            roomState.lastSyncTime = Date.now();

            // Update database
            const client = await clientPromise;
            const db = client.db('mangawebsite');
            await db.collection('w2g_rooms').updateOne(
                { roomId },
                {
                    $set: {
                        playbackTime: time,
                        isPlaying: false,
                        updatedAt: new Date(),
                    },
                }
            );

            // Broadcast to all participants
            socket.to(roomId).emit('pause', { time });
        });

        // Host controls - SEEK
        socket.on('host_seek', async (data: { roomId: string; time: number }) => {
            if (!userId) return;

            const { roomId, time } = data;
            const roomState = rooms.get(roomId);

            if (!roomState || roomState.hostUserId !== userId) {
                socket.emit('error', { message: 'Only host can control playback' });
                return;
            }

            roomState.playbackTime = time;
            roomState.lastSyncTime = Date.now();

            // Update database
            const client = await clientPromise;
            const db = client.db('mangawebsite');
            await db.collection('w2g_rooms').updateOne(
                { roomId },
                {
                    $set: {
                        playbackTime: time,
                        updatedAt: new Date(),
                    },
                }
            );

            // Broadcast to all participants
            socket.to(roomId).emit('seek', { time });
        });

        // Host controls - SYNC (heartbeat)
        socket.on('host_sync', async (data: { roomId: string; time: number; isPlaying: boolean }) => {
            if (!userId) return;

            const { roomId, time, isPlaying } = data;
            const roomState = rooms.get(roomId);

            if (!roomState || roomState.hostUserId !== userId) {
                return; // Silently ignore if not host
            }

            roomState.playbackTime = time;
            roomState.isPlaying = isPlaying;
            roomState.lastSyncTime = Date.now();

            // Broadcast sync to all participants
            socket.to(roomId).emit('sync', { time, isPlaying });
        });

        // Host controls - AUDIO CHANGE
        socket.on('host_audio_change', async (data: { roomId: string; track: string }) => {
            if (!userId) return;

            const { roomId, track } = data;
            const roomState = rooms.get(roomId);

            if (!roomState || roomState.hostUserId !== userId) {
                socket.emit('error', { message: 'Only host can change audio' });
                return;
            }

            roomState.currentAudioTrack = track;

            // Update database
            const client = await clientPromise;
            const db = client.db('mangawebsite');
            await db.collection('w2g_rooms').updateOne(
                { roomId },
                {
                    $set: {
                        currentAudioTrack: track,
                        updatedAt: new Date(),
                    },
                }
            );

            // Broadcast to all participants
            socket.to(roomId).emit('audio_change', { track });
        });

        // Host controls - SUBTITLE CHANGE
        socket.on('host_subtitle_change', async (data: { roomId: string; subtitle: string | null }) => {
            if (!userId) return;

            const { roomId, subtitle } = data;
            const roomState = rooms.get(roomId);

            if (!roomState || roomState.hostUserId !== userId) {
                socket.emit('error', { message: 'Only host can change subtitles' });
                return;
            }

            roomState.currentSubtitle = subtitle;

            // Update database
            const client = await clientPromise;
            const db = client.db('mangawebsite');
            await db.collection('w2g_rooms').updateOne(
                { roomId },
                {
                    $set: {
                        currentSubtitle: subtitle,
                        updatedAt: new Date(),
                    },
                }
            );

            // Broadcast to all participants
            socket.to(roomId).emit('subtitle_change', { subtitle });
        });

        // Chat message
        socket.on('chat_message', async (data: { roomId: string; message: string }) => {
            if (!userId || !username) return;

            const { roomId, message } = data;
            const roomState = rooms.get(roomId);

            if (!roomState) return;

            const chatMessage = {
                userId,
                username,
                message,
                timestamp: new Date(),
            };

            // Save to database
            const client = await clientPromise;
            const db = client.db('mangawebsite');
            await db.collection('w2g_rooms').updateOne(
                { roomId },
                {
                    $push: {
                        chatMessages: {
                            $each: [chatMessage],
                            $slice: -100, // Keep last 100 messages
                        },
                    },
                }
            );

            // Broadcast to all participants
            io!.to(roomId).emit('chat_message', chatMessage);
        });

        // Emoji reaction
        socket.on('reaction', (data: { roomId: string; emoji: string }) => {
            if (!userId || !username) return;

            const { roomId, emoji } = data;
            const roomState = rooms.get(roomId);

            if (!roomState) return;

            // Broadcast reaction to all participants
            socket.to(roomId).emit('reaction', {
                userId,
                username,
                emoji,
                timestamp: new Date(),
            });
        });

        // Leave room
        socket.on('leave_room', async (data: { roomId: string }) => {
            if (!userId) return;

            const { roomId } = data;
            const roomState = rooms.get(roomId);

            if (roomState) {
                roomState.participants.delete(userId);

                // Notify others
                socket.to(roomId).emit('participant_left', {
                    userId,
                    participantCount: roomState.participants.size,
                });

                // Send updated participant list
                const participantsList = Array.from(roomState.participants.values()).map((p) => ({
                    userId: p.userId,
                    username: p.username,
                    isHost: p.isHost,
                    isMuted: p.isMuted,
                }));

                io!.to(roomId).emit('participants_update', participantsList);

                // Clean up room if empty
                if (roomState.participants.size === 0) {
                    rooms.delete(roomId);
                }
            }

            socket.leave(roomId);
        });

        // Disconnect
        socket.on('disconnect', async () => {
            console.log('W2G client disconnected:', socket.id);

            // Remove from all rooms
            for (const [roomId, roomState] of rooms.entries()) {
                if (roomState.participants.has(userId || '')) {
                    roomState.participants.delete(userId || '');

                    socket.to(roomId).emit('participant_left', {
                        userId,
                        participantCount: roomState.participants.size,
                    });

                    if (roomState.participants.size === 0) {
                        rooms.delete(roomId);
                    }
                }
            }
        });
    });

    return io;
}

export function getW2GServer(): SocketIOServer | null {
    return io;
}

