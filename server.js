const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

// Initialize Socket.IO server
let io = null;

function initializeW2GServer(httpServer) {
    const { Server } = require('socket.io');
    const jwt = require('jsonwebtoken');
    const { ObjectId } = require('mongodb');
    
    // Handle ES module default export in CommonJS
    let clientPromise;
    try {
        const mongoModule = require('./src/lib/mongodb');
        clientPromise = mongoModule.default || mongoModule;
    } catch (error) {
        console.error('Error loading MongoDB client:', error);
        // Fallback: create a new client
        const { MongoClient } = require('mongodb');
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            console.error('MONGODB_URI not set');
            return null;
        }
        const client = new MongoClient(uri);
        clientPromise = client.connect();
    }

    io = new Server(httpServer, {
        cors: {
            origin: process.env.NEXT_PUBLIC_BASE_URL || '*',
            methods: ['GET', 'POST'],
            credentials: true,
        },
        path: '/api/w2g/socket',
    });

    // In-memory room storage
    const rooms = new Map();

    io.on('connection', async (socket) => {
        console.log('W2G client connected:', socket.id);

        let userId = null;
        let username = null;

        socket.on('authenticate', async (data) => {
            try {
                const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
                const payload = jwt.verify(data.token, JWT_SECRET);
                userId = payload.userId || payload._id;
                username = payload.username || payload.email?.split('@')[0] || 'User';
                socket.emit('authenticated', { userId, username });
            } catch (error) {
                socket.emit('auth_error', { error: 'Invalid token' });
            }
        });

        socket.on('join_room', async (data) => {
            if (!userId) {
                socket.emit('error', { message: 'Not authenticated' });
                return;
            }

            const { roomId } = data;
            const client = await clientPromise();
            const db = client.db('mangawebsite');

            const roomDoc = await db.collection('w2g_rooms').findOne({ roomId });
            if (!roomDoc) {
                socket.emit('error', { message: 'Room not found' });
                return;
            }

            socket.join(roomId);

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

            const roomState = rooms.get(roomId);
            const isHost = roomState.hostUserId === userId;

            roomState.participants.set(userId, {
                userId,
                username: username || 'User',
                socketId: socket.id,
                isHost,
                isMuted: false,
                joinedAt: new Date(),
            });

            socket.emit('room_state', {
                playbackTime: roomState.playbackTime,
                isPlaying: roomState.isPlaying,
                currentAudioTrack: roomState.currentAudioTrack,
                currentSubtitle: roomState.currentSubtitle,
                isHost,
            });

            socket.to(roomId).emit('participant_joined', {
                userId,
                username,
                participantCount: roomState.participants.size,
            });

            const participantsList = Array.from(roomState.participants.values()).map((p) => ({
                userId: p.userId,
                username: p.username,
                isHost: p.isHost,
                isMuted: p.isMuted,
            }));

            io.to(roomId).emit('participants_update', participantsList);
        });

        // Host controls
        socket.on('host_play', async (data) => {
            if (!userId) return;
            const { roomId, time } = data;
            const roomState = rooms.get(roomId);
            if (!roomState || roomState.hostUserId !== userId) return;

            roomState.playbackTime = time;
            roomState.isPlaying = true;
            roomState.lastSyncTime = Date.now();

            const client = await clientPromise();
            const db = client.db('mangawebsite');
            await db.collection('w2g_rooms').updateOne(
                { roomId },
                { $set: { playbackTime: time, isPlaying: true, updatedAt: new Date() } }
            );

            socket.to(roomId).emit('play', { time });
        });

        socket.on('host_pause', async (data) => {
            if (!userId) return;
            const { roomId, time } = data;
            const roomState = rooms.get(roomId);
            if (!roomState || roomState.hostUserId !== userId) return;

            roomState.playbackTime = time;
            roomState.isPlaying = false;
            roomState.lastSyncTime = Date.now();

            const client = await clientPromise();
            const db = client.db('mangawebsite');
            await db.collection('w2g_rooms').updateOne(
                { roomId },
                { $set: { playbackTime: time, isPlaying: false, updatedAt: new Date() } }
            );

            socket.to(roomId).emit('pause', { time });
        });

        socket.on('host_seek', async (data) => {
            if (!userId) return;
            const { roomId, time } = data;
            const roomState = rooms.get(roomId);
            if (!roomState || roomState.hostUserId !== userId) return;

            roomState.playbackTime = time;
            roomState.lastSyncTime = Date.now();

            const client = await clientPromise();
            const db = client.db('mangawebsite');
            await db.collection('w2g_rooms').updateOne(
                { roomId },
                { $set: { playbackTime: time, updatedAt: new Date() } }
            );

            socket.to(roomId).emit('seek', { time });
        });

        socket.on('host_sync', async (data) => {
            if (!userId) return;
            const { roomId, time, isPlaying } = data;
            const roomState = rooms.get(roomId);
            if (!roomState || roomState.hostUserId !== userId) return;

            roomState.playbackTime = time;
            roomState.isPlaying = isPlaying;
            roomState.lastSyncTime = Date.now();

            socket.to(roomId).emit('sync', { time, isPlaying });
        });

        socket.on('chat_message', async (data) => {
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

            const client = await clientPromise();
            const db = client.db('mangawebsite');
            await db.collection('w2g_rooms').updateOne(
                { roomId },
                { $push: { chatMessages: { $each: [chatMessage], $slice: -100 } } }
            );

            io.to(roomId).emit('chat_message', chatMessage);
        });

        socket.on('reaction', (data) => {
            if (!userId || !username) return;
            const { roomId, emoji } = data;
            socket.to(roomId).emit('reaction', {
                userId,
                username,
                emoji,
                timestamp: new Date(),
            });
        });

        socket.on('leave_room', async (data) => {
            if (!userId) return;
            const { roomId } = data;
            const roomState = rooms.get(roomId);

            if (roomState) {
                roomState.participants.delete(userId);
                socket.to(roomId).emit('participant_left', {
                    userId,
                    participantCount: roomState.participants.size,
                });

                const participantsList = Array.from(roomState.participants.values()).map((p) => ({
                    userId: p.userId,
                    username: p.username,
                    isHost: p.isHost,
                    isMuted: p.isMuted,
                }));

                io.to(roomId).emit('participants_update', participantsList);

                if (roomState.participants.size === 0) {
                    rooms.delete(roomId);
                }
            }

            socket.leave(roomId);
        });

        socket.on('disconnect', () => {
            console.log('W2G client disconnected:', socket.id);
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

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    const httpServer = createServer(async (req, res) => {
        try {
            const parsedUrl = parse(req.url, true);
            await handle(req, res, parsedUrl);
        } catch (err) {
            console.error('Error occurred handling', req.url, err);
            res.statusCode = 500;
            res.end('internal server error');
        }
    });

    // Initialize W2G WebSocket server
    initializeW2GServer(httpServer);

    httpServer
        .once('error', (err) => {
            console.error(err);
            process.exit(1);
        })
        .listen(port, () => {
            console.log(`> Ready on http://${hostname}:${port}`);
            console.log(`> W2G WebSocket server initialized on /api/w2g/socket`);
        });
});
