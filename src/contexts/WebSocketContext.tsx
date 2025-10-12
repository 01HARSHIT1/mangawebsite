'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface WebSocketContextType {
    socket: Socket | null;
    isConnected: boolean;
    onlineUsers: OnlineUser[];
    currentReaders: { [mangaId: string]: OnlineUser[] };
    sendMessage: (mangaId: string, message: string, chapterId?: string) => void;
    sendReaction: (targetId: string, type: ReactionType, targetType: 'manga' | 'chapter' | 'comment') => void;
    joinMangaRoom: (mangaId: string) => void;
    leaveMangaRoom: (mangaId: string) => void;
    sendComment: (mangaId: string, comment: string, chapterId?: string, rating?: number) => void;
    typingUsers: { [roomId: string]: string[] };
    startTyping: (mangaId: string, chapterId?: string) => void;
    stopTyping: (mangaId: string, chapterId?: string) => void;
}

interface OnlineUser {
    userId: string;
    username: string;
    status: 'online' | 'reading' | 'away';
    lastSeen?: Date;
}

type ReactionType = 'like' | 'love' | 'wow' | 'laugh';

interface ChatMessage {
    id: string;
    message: string;
    user: {
        userId: string;
        username: string;
        role: string;
    };
    timestamp: Date;
    mangaId: string;
    chapterId?: string;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function WebSocketProvider({ children }: { children: ReactNode }) {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
    const [currentReaders, setCurrentReaders] = useState<{ [mangaId: string]: OnlineUser[] }>({});
    const [typingUsers, setTypingUsers] = useState<{ [roomId: string]: string[] }>({});
    const { user, isAuthenticated } = useAuth();

    useEffect(() => {
        if (isAuthenticated && user) {
            // Initialize socket connection
            const newSocket = io(process.env.NODE_ENV === 'production' ? 'wss://yourdomain.com' : 'http://localhost:3000', {
                transports: ['websocket', 'polling'],
                autoConnect: true
            });

            // Connection event handlers
            newSocket.on('connect', () => {
                console.log('🔌 Connected to WebSocket server');
                setIsConnected(true);
                
                // Authenticate with server
                newSocket.emit('authenticate', {
                    userId: user._id,
                    username: user.username,
                    role: user.role || 'reader',
                    token: localStorage.getItem('token')
                });
            });

            newSocket.on('disconnect', () => {
                console.log('🔌 Disconnected from WebSocket server');
                setIsConnected(false);
            });

            newSocket.on('authenticated', (data: { success: boolean; userId: string }) => {
                if (data.success) {
                    console.log('✅ WebSocket authentication successful');
                }
            });

            // User presence events
            newSocket.on('user_online', (userData: { userId: string; username: string; status: string }) => {
                setOnlineUsers(prev => {
                    const filtered = prev.filter(u => u.userId !== userData.userId);
                    return [...filtered, { ...userData, status: userData.status as any }];
                });
            });

            newSocket.on('user_offline', (userData: { userId: string; username: string }) => {
                setOnlineUsers(prev => prev.filter(u => u.userId !== userData.userId));
            });

            newSocket.on('user_status_update', (data: { userId: string; username: string; status: string }) => {
                setOnlineUsers(prev => prev.map(u => 
                    u.userId === data.userId ? { ...u, status: data.status as any } : u
                ));
            });

            // Reading room events
            newSocket.on('user_joined_reading', (data: { userId: string; username: string; mangaId: string }) => {
                setCurrentReaders(prev => ({
                    ...prev,
                    [data.mangaId]: [
                        ...(prev[data.mangaId] || []).filter(u => u.userId !== data.userId),
                        { userId: data.userId, username: data.username, status: 'reading' }
                    ]
                }));
            });

            newSocket.on('user_left_reading', (data: { userId: string; username: string; mangaId: string }) => {
                setCurrentReaders(prev => ({
                    ...prev,
                    [data.mangaId]: (prev[data.mangaId] || []).filter(u => u.userId !== data.userId)
                }));
            });

            newSocket.on('reading_room_users', (data: { mangaId: string; users: OnlineUser[] }) => {
                setCurrentReaders(prev => ({
                    ...prev,
                    [data.mangaId]: data.users
                }));
            });

            // Chat and comment events
            newSocket.on('chat_message', (message: ChatMessage) => {
                // Handle incoming chat messages
                // You can emit this to a chat component or store in state
                console.log('💬 New chat message:', message);
            });

            newSocket.on('new_comment', (data: { comment: any; user: any }) => {
                // Handle new comments
                console.log('💬 New comment:', data);
                // Trigger comment refresh in relevant components
                window.dispatchEvent(new CustomEvent('newComment', { detail: data }));
            });

            // Reaction events
            newSocket.on('live_reaction', (data: any) => {
                console.log('❤️ Live reaction:', data);
                // Trigger reaction animation or update
                window.dispatchEvent(new CustomEvent('liveReaction', { detail: data }));
            });

            // Typing indicators
            newSocket.on('user_typing', (data: { userId: string; username: string; isTyping: boolean }) => {
                const roomId = 'current_room'; // You'd determine this based on current page
                setTypingUsers(prev => {
                    const currentTyping = prev[roomId] || [];
                    if (data.isTyping) {
                        return {
                            ...prev,
                            [roomId]: [...currentTyping.filter(u => u !== data.username), data.username]
                        };
                    } else {
                        return {
                            ...prev,
                            [roomId]: currentTyping.filter(u => u !== data.username)
                        };
                    }
                });
            });

            // Notification events
            newSocket.on('notification', (notification: any) => {
                console.log('🔔 Real-time notification:', notification);
                // Trigger notification display
                window.dispatchEvent(new CustomEvent('realtimeNotification', { detail: notification }));
            });

            setSocket(newSocket);

            return () => {
                newSocket.disconnect();
            };
        }
    }, [isAuthenticated, user]);

    // Helper functions
    const sendMessage = (mangaId: string, message: string, chapterId?: string) => {
        if (socket) {
            socket.emit('chat_message', { mangaId, message, chapterId });
        }
    };

    const sendReaction = (targetId: string, type: ReactionType, targetType: 'manga' | 'chapter' | 'comment') => {
        if (socket) {
            socket.emit('reaction', { targetId, type, targetType });
        }
    };

    const joinMangaRoom = (mangaId: string) => {
        if (socket) {
            socket.emit('join_manga', mangaId);
        }
    };

    const leaveMangaRoom = (mangaId: string) => {
        if (socket) {
            socket.emit('leave_manga', mangaId);
        }
    };

    const sendComment = (mangaId: string, comment: string, chapterId?: string, rating?: number) => {
        if (socket) {
            socket.emit('new_comment', { mangaId, comment, chapterId, rating });
        }
    };

    const startTyping = (mangaId: string, chapterId?: string) => {
        if (socket) {
            socket.emit('typing_start', { mangaId, chapterId });
        }
    };

    const stopTyping = (mangaId: string, chapterId?: string) => {
        if (socket) {
            socket.emit('typing_stop', { mangaId, chapterId });
        }
    };

    const value = {
        socket,
        isConnected,
        onlineUsers,
        currentReaders,
        sendMessage,
        sendReaction,
        joinMangaRoom,
        leaveMangaRoom,
        sendComment,
        typingUsers,
        startTyping,
        stopTyping
    };

    return (
        <WebSocketContext.Provider value={value}>
            {children}
        </WebSocketContext.Provider>
    );
}

export function useWebSocket() {
    const context = useContext(WebSocketContext);
    if (context === undefined) {
        throw new Error('useWebSocket must be used within a WebSocketProvider');
    }
    return context;
}
