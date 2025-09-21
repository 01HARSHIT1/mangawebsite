'use client';

import { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { useAuth } from '@/contexts/AuthContext';
import { FaPaperPlane, FaUsers, FaComments, FaEye, FaSmile } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

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

interface LiveChatProps {
    mangaId: string;
    chapterId?: string;
    isMinimized?: boolean;
    onToggleMinimize?: () => void;
}

export default function LiveChat({ mangaId, chapterId, isMinimized = false, onToggleMinimize }: LiveChatProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout>();
    
    const { socket, isConnected, currentReaders, typingUsers, sendMessage, startTyping, stopTyping, joinMangaRoom } = useWebSocket();
    const { user } = useAuth();

    const roomId = chapterId ? `chapter_${chapterId}` : `manga_${mangaId}`;
    const currentTypingUsers = typingUsers[roomId] || [];
    const readersInRoom = currentReaders[mangaId] || [];

    useEffect(() => {
        if (socket && mangaId) {
            joinMangaRoom(mangaId);

            // Listen for chat messages
            const handleChatMessage = (message: ChatMessage) => {
                setMessages(prev => [...prev, message]);
            };

            socket.on('chat_message', handleChatMessage);

            return () => {
                socket.off('chat_message', handleChatMessage);
            };
        }
    }, [socket, mangaId, joinMangaRoom]);

    useEffect(() => {
        // Scroll to bottom when new messages arrive
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = () => {
        if (!newMessage.trim() || !socket) return;

        sendMessage(mangaId, newMessage, chapterId);
        setNewMessage('');
        handleStopTyping();
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNewMessage(e.target.value);
        handleStartTyping();
    };

    const handleStartTyping = () => {
        if (!isTyping) {
            setIsTyping(true);
            startTyping(mangaId, chapterId);
        }

        // Reset typing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            handleStopTyping();
        }, 3000);
    };

    const handleStopTyping = () => {
        if (isTyping) {
            setIsTyping(false);
            stopTyping(mangaId, chapterId);
        }

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
    };

    const formatTime = (date: Date) => {
        return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (isMinimized) {
        return (
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="fixed bottom-4 right-4 z-50"
            >
                <button
                    onClick={onToggleMinimize}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full p-4 shadow-lg hover:shadow-purple-500/25 transition-all duration-300"
                >
                    <div className="flex items-center space-x-2">
                        <FaComments className="text-xl" />
                        {readersInRoom.length > 0 && (
                            <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                                {readersInRoom.length}
                            </span>
                        )}
                    </div>
                </button>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            className="fixed right-4 bottom-4 top-20 w-80 bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-purple-500/20 flex flex-col z-50"
        >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-t-2xl p-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <FaComments className="text-white" />
                    <h3 className="text-white font-semibold">Live Chat</h3>
                    {!isConnected && (
                        <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                    )}
                    {isConnected && (
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    )}
                </div>
                <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1 text-white/80">
                        <FaEye className="text-sm" />
                        <span className="text-sm">{readersInRoom.length}</span>
                    </div>
                    <button
                        onClick={onToggleMinimize}
                        className="text-white/80 hover:text-white transition-colors"
                    >
                        ×
                    </button>
                </div>
            </div>

            {/* Online Users */}
            {readersInRoom.length > 0 && (
                <div className="p-3 border-b border-slate-700">
                    <div className="flex items-center space-x-2 mb-2">
                        <FaUsers className="text-purple-400 text-sm" />
                        <span className="text-sm text-gray-300">Reading Now ({readersInRoom.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                        {readersInRoom.slice(0, 6).map((reader) => (
                            <div
                                key={reader.userId}
                                className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full text-xs"
                            >
                                {reader.username}
                            </div>
                        ))}
                        {readersInRoom.length > 6 && (
                            <div className="bg-gray-500/20 text-gray-400 px-2 py-1 rounded-full text-xs">
                                +{readersInRoom.length - 6} more
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                <AnimatePresence>
                    {messages.map((message) => (
                        <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${message.user.userId === user?._id ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-xs rounded-lg p-3 ${
                                message.user.userId === user?._id
                                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                                    : 'bg-slate-800 text-gray-100'
                            }`}>
                                {message.user.userId !== user?._id && (
                                    <div className="text-xs text-gray-400 mb-1">
                                        {message.user.username}
                                        {message.user.role === 'creator' && (
                                            <span className="ml-1 text-purple-400">✨</span>
                                        )}
                                        {message.user.role === 'admin' && (
                                            <span className="ml-1 text-red-400">👑</span>
                                        )}
                                    </div>
                                )}
                                <p className="text-sm">{message.message}</p>
                                <div className="text-xs opacity-70 mt-1">
                                    {formatTime(message.timestamp)}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Typing indicators */}
                {currentTypingUsers.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex justify-start"
                    >
                        <div className="bg-slate-800 rounded-lg p-3 max-w-xs">
                            <div className="flex items-center space-x-2">
                                <div className="flex space-x-1">
                                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                </div>
                                <span className="text-xs text-gray-400">
                                    {currentTypingUsers.slice(0, 2).join(', ')} 
                                    {currentTypingUsers.length > 2 && ` +${currentTypingUsers.length - 2} more`} typing...
                                </span>
                            </div>
                        </div>
                    </motion.div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            {user && (
                <div className="p-4 border-t border-slate-700">
                    <div className="flex items-end space-x-2">
                        <div className="flex-1">
                            <textarea
                                value={newMessage}
                                onChange={handleInputChange}
                                onKeyPress={handleKeyPress}
                                placeholder={isConnected ? "Type a message..." : "Connecting..."}
                                disabled={!isConnected}
                                className="w-full bg-slate-800 text-white rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                                rows={2}
                                maxLength={500}
                            />
                            <div className="text-xs text-gray-500 mt-1 text-right">
                                {newMessage.length}/500
                            </div>
                        </div>
                        <button
                            onClick={handleSendMessage}
                            disabled={!newMessage.trim() || !isConnected}
                            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-2 rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                        >
                            <FaPaperPlane />
                        </button>
                    </div>
                </div>
            )}

            {!user && (
                <div className="p-4 border-t border-slate-700 text-center">
                    <p className="text-gray-400 text-sm">
                        <a href="/login" className="text-purple-400 hover:text-purple-300">Login</a> to join the chat
                    </p>
                </div>
            )}
        </motion.div>
    );
}
