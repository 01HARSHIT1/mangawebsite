// WebSocket server setup for real-time features
import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import clientPromise from './mongodb';
import { ObjectId } from 'mongodb';

export interface SocketUser {
    userId: string;
    username: string;
    role: 'reader' | 'creator' | 'admin';
    socketId: string;
}

export class WebSocketManager {
    private io: SocketIOServer;
    private connectedUsers: Map<string, SocketUser> = new Map();
    private userSockets: Map<string, string[]> = new Map(); // userId -> socketIds[]
    private readingRooms: Map<string, Set<string>> = new Map(); // mangaId -> userIds

    constructor(server: HTTPServer) {
        this.io = new SocketIOServer(server, {
            cors: {
                origin: process.env.NODE_ENV === 'production' 
                    ? ["https://yourdomain.com"] 
                    : ["http://localhost:3000"],
                methods: ["GET", "POST"]
            },
            transports: ['websocket', 'polling']
        });

        this.setupEventHandlers();
    }

    private setupEventHandlers() {
        this.io.on('connection', (socket) => {
            console.log(`🔌 User connected: ${socket.id}`);

            // Handle user authentication
            socket.on('authenticate', (userData: { userId: string; username: string; role: string; token: string }) => {
                this.authenticateUser(socket, userData);
            });

            // Handle joining manga reading room
            socket.on('join_manga', (mangaId: string) => {
                this.joinMangaRoom(socket, mangaId);
            });

            // Handle leaving manga reading room
            socket.on('leave_manga', (mangaId: string) => {
                this.leaveMangaRoom(socket, mangaId);
            });

            // Handle real-time comments
            socket.on('new_comment', (data: { mangaId: string; chapterId?: string; comment: string; rating?: number }) => {
                this.handleNewComment(socket, data);
            });

            // Handle live reactions
            socket.on('reaction', (data: { targetId: string; type: 'like' | 'love' | 'wow' | 'laugh'; targetType: 'manga' | 'chapter' | 'comment' }) => {
                this.handleReaction(socket, data);
            });

            // Handle live chat in reading rooms
            socket.on('chat_message', (data: { mangaId: string; message: string; chapterId?: string }) => {
                this.handleChatMessage(socket, data);
            });

            // Handle typing indicators
            socket.on('typing_start', (data: { mangaId: string; chapterId?: string }) => {
                this.handleTypingStart(socket, data);
            });

            socket.on('typing_stop', (data: { mangaId: string; chapterId?: string }) => {
                this.handleTypingStop(socket, data);
            });

            // Handle user status updates
            socket.on('status_update', (status: 'online' | 'reading' | 'away') => {
                this.updateUserStatus(socket, status);
            });

            // Handle disconnection
            socket.on('disconnect', () => {
                this.handleDisconnect(socket);
            });
        });
    }

    private async authenticateUser(socket: any, userData: { userId: string; username: string; role: string; token: string }) {
        try {
            // In a real app, you'd verify the JWT token here
            const user: SocketUser = {
                userId: userData.userId,
                username: userData.username,
                role: userData.role as 'reader' | 'creator' | 'admin',
                socketId: socket.id
            };

            this.connectedUsers.set(socket.id, user);
            
            // Track multiple sockets per user
            if (!this.userSockets.has(userData.userId)) {
                this.userSockets.set(userData.userId, []);
            }
            this.userSockets.get(userData.userId)!.push(socket.id);

            socket.join(`user_${userData.userId}`);
            socket.emit('authenticated', { success: true, userId: userData.userId });

            // Notify other users that this user is online
            socket.broadcast.emit('user_online', {
                userId: userData.userId,
                username: userData.username,
                status: 'online'
            });

            console.log(`✅ User authenticated: ${userData.username} (${userData.userId})`);
        } catch (error) {
            socket.emit('authentication_error', { error: 'Authentication failed' });
        }
    }

    private joinMangaRoom(socket: any, mangaId: string) {
        const user = this.connectedUsers.get(socket.id);
        if (!user) return;

        socket.join(`manga_${mangaId}`);
        
        if (!this.readingRooms.has(mangaId)) {
            this.readingRooms.set(mangaId, new Set());
        }
        this.readingRooms.get(mangaId)!.add(user.userId);

        // Notify others in the room
        socket.to(`manga_${mangaId}`).emit('user_joined_reading', {
            userId: user.userId,
            username: user.username,
            mangaId
        });

        // Send current readers list
        const currentReaders = Array.from(this.readingRooms.get(mangaId) || []);
        socket.emit('reading_room_users', {
            mangaId,
            users: currentReaders.map(userId => {
                const userSockets = this.userSockets.get(userId) || [];
                const socketId = userSockets[0]; // Get first socket
                const userData = socketId ? this.connectedUsers.get(socketId) : null;
                return userData ? { userId, username: userData.username } : null;
            }).filter(Boolean)
        });

        console.log(`📖 User ${user.username} joined manga ${mangaId}`);
    }

    private leaveMangaRoom(socket: any, mangaId: string) {
        const user = this.connectedUsers.get(socket.id);
        if (!user) return;

        socket.leave(`manga_${mangaId}`);
        
        if (this.readingRooms.has(mangaId)) {
            this.readingRooms.get(mangaId)!.delete(user.userId);
            
            // Clean up empty rooms
            if (this.readingRooms.get(mangaId)!.size === 0) {
                this.readingRooms.delete(mangaId);
            }
        }

        // Notify others in the room
        socket.to(`manga_${mangaId}`).emit('user_left_reading', {
            userId: user.userId,
            username: user.username,
            mangaId
        });

        console.log(`📖 User ${user.username} left manga ${mangaId}`);
    }

    private async handleNewComment(socket: any, data: { mangaId: string; chapterId?: string; comment: string; rating?: number }) {
        const user = this.connectedUsers.get(socket.id);
        if (!user) return;

        try {
            const client = await clientPromise;
            const db = client.db('mangawebsite');

            // Create comment in database
            const comment = {
                _id: new ObjectId(),
                mangaId: data.mangaId,
                chapterId: data.chapterId,
                userId: user.userId,
                username: user.username,
                content: data.comment,
                rating: data.rating,
                likes: [],
                replies: [],
                createdAt: new Date(),
                updatedAt: new Date()
            };

            await db.collection('comments').insertOne(comment);

            // Broadcast to all users in the manga room
            const roomName = data.chapterId ? `chapter_${data.chapterId}` : `manga_${data.mangaId}`;
            this.io.to(roomName).emit('new_comment', {
                comment: {
                    ...comment,
                    _id: comment._id.toString()
                },
                user: {
                    userId: user.userId,
                    username: user.username,
                    role: user.role
                }
            });

            console.log(`💬 New comment by ${user.username} on ${data.chapterId ? 'chapter' : 'manga'} ${data.chapterId || data.mangaId}`);
        } catch (error) {
            socket.emit('comment_error', { error: 'Failed to post comment' });
        }
    }

    private handleReaction(socket: any, data: { targetId: string; type: 'like' | 'love' | 'wow' | 'laugh'; targetType: 'manga' | 'chapter' | 'comment' }) {
        const user = this.connectedUsers.get(socket.id);
        if (!user) return;

        // Broadcast reaction to relevant room
        const roomName = data.targetType === 'manga' ? `manga_${data.targetId}` : 
                        data.targetType === 'chapter' ? `chapter_${data.targetId}` :
                        `comment_${data.targetId}`;

        socket.to(roomName).emit('live_reaction', {
            targetId: data.targetId,
            targetType: data.targetType,
            reaction: data.type,
            user: {
                userId: user.userId,
                username: user.username
            },
            timestamp: new Date()
        });

        console.log(`❤️ ${user.username} reacted ${data.type} to ${data.targetType} ${data.targetId}`);
    }

    private handleChatMessage(socket: any, data: { mangaId: string; message: string; chapterId?: string }) {
        const user = this.connectedUsers.get(socket.id);
        if (!user) return;

        const roomName = data.chapterId ? `chapter_${data.chapterId}` : `manga_${data.mangaId}`;
        
        // Broadcast chat message to room
        socket.to(roomName).emit('chat_message', {
            id: Date.now().toString(),
            message: data.message,
            user: {
                userId: user.userId,
                username: user.username,
                role: user.role
            },
            timestamp: new Date(),
            mangaId: data.mangaId,
            chapterId: data.chapterId
        });

        console.log(`💬 Chat message by ${user.username} in ${roomName}`);
    }

    private handleTypingStart(socket: any, data: { mangaId: string; chapterId?: string }) {
        const user = this.connectedUsers.get(socket.id);
        if (!user) return;

        const roomName = data.chapterId ? `chapter_${data.chapterId}` : `manga_${data.mangaId}`;
        socket.to(roomName).emit('user_typing', {
            userId: user.userId,
            username: user.username,
            isTyping: true
        });
    }

    private handleTypingStop(socket: any, data: { mangaId: string; chapterId?: string }) {
        const user = this.connectedUsers.get(socket.id);
        if (!user) return;

        const roomName = data.chapterId ? `chapter_${data.chapterId}` : `manga_${data.mangaId}`;
        socket.to(roomName).emit('user_typing', {
            userId: user.userId,
            username: user.username,
            isTyping: false
        });
    }

    private updateUserStatus(socket: any, status: 'online' | 'reading' | 'away') {
        const user = this.connectedUsers.get(socket.id);
        if (!user) return;

        // Broadcast status update to all connected users
        socket.broadcast.emit('user_status_update', {
            userId: user.userId,
            username: user.username,
            status,
            timestamp: new Date()
        });

        console.log(`📊 ${user.username} status: ${status}`);
    }

    private handleDisconnect(socket: any) {
        const user = this.connectedUsers.get(socket.id);
        if (user) {
            // Remove from connected users
            this.connectedUsers.delete(socket.id);
            
            // Remove socket from user's socket list
            const userSocketList = this.userSockets.get(user.userId) || [];
            const updatedSockets = userSocketList.filter(id => id !== socket.id);
            
            if (updatedSockets.length === 0) {
                // User completely disconnected
                this.userSockets.delete(user.userId);
                
                // Remove from all reading rooms
                this.readingRooms.forEach((users, mangaId) => {
                    if (users.has(user.userId)) {
                        users.delete(user.userId);
                        socket.to(`manga_${mangaId}`).emit('user_left_reading', {
                            userId: user.userId,
                            username: user.username,
                            mangaId
                        });
                    }
                });

                // Notify others that user went offline
                socket.broadcast.emit('user_offline', {
                    userId: user.userId,
                    username: user.username
                });
            } else {
                // User still has other connections
                this.userSockets.set(user.userId, updatedSockets);
            }

            console.log(`🔌 User disconnected: ${user.username}`);
        }
    }

    // Public methods for sending notifications
    public sendNotificationToUser(userId: string, notification: any) {
        const userSocketIds = this.userSockets.get(userId) || [];
        userSocketIds.forEach(socketId => {
            this.io.to(socketId).emit('notification', notification);
        });
    }

    public sendNotificationToMangaReaders(mangaId: string, notification: any) {
        this.io.to(`manga_${mangaId}`).emit('manga_notification', notification);
    }

    public broadcastToAll(event: string, data: any) {
        this.io.emit(event, data);
    }

    public getConnectedUsers(): SocketUser[] {
        return Array.from(this.connectedUsers.values());
    }

    public getUsersInManga(mangaId: string): string[] {
        return Array.from(this.readingRooms.get(mangaId) || []);
    }
}

// Singleton instance
let wsManager: WebSocketManager | null = null;

export function initializeWebSocket(server: HTTPServer): WebSocketManager {
    if (!wsManager) {
        wsManager = new WebSocketManager(server);
        console.log('🚀 WebSocket server initialized');
    }
    return wsManager;
}

export function getWebSocketManager(): WebSocketManager | null {
    return wsManager;
}
