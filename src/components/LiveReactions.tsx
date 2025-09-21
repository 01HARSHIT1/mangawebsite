'use client';

import { useState, useEffect } from 'react';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { FaHeart, FaLaugh, FaStar, FaFire, FaThumbsUp } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

interface LiveReaction {
    id: string;
    type: 'like' | 'love' | 'wow' | 'laugh' | 'fire';
    user: {
        userId: string;
        username: string;
    };
    timestamp: Date;
    x: number;
    y: number;
}

interface LiveReactionsProps {
    targetId: string;
    targetType: 'manga' | 'chapter' | 'comment';
    className?: string;
}

const reactionIcons = {
    like: { icon: FaThumbsUp, color: 'text-blue-400', emoji: '👍' },
    love: { icon: FaHeart, color: 'text-red-400', emoji: '❤️' },
    wow: { icon: FaStar, color: 'text-yellow-400', emoji: '😮' },
    laugh: { icon: FaLaugh, color: 'text-green-400', emoji: '😂' },
    fire: { icon: FaFire, color: 'text-orange-400', emoji: '🔥' }
};

export default function LiveReactions({ targetId, targetType, className = '' }: LiveReactionsProps) {
    const [reactions, setReactions] = useState<LiveReaction[]>([]);
    const [showReactionBar, setShowReactionBar] = useState(false);
    const { socket, sendReaction } = useWebSocket();

    useEffect(() => {
        if (socket) {
            const handleLiveReaction = (data: any) => {
                if (data.targetId === targetId && data.targetType === targetType) {
                    const newReaction: LiveReaction = {
                        id: `${Date.now()}_${Math.random()}`,
                        type: data.reaction,
                        user: data.user,
                        timestamp: new Date(data.timestamp),
                        x: Math.random() * 300,
                        y: Math.random() * 200
                    };

                    setReactions(prev => [...prev, newReaction]);

                    // Remove reaction after animation
                    setTimeout(() => {
                        setReactions(prev => prev.filter(r => r.id !== newReaction.id));
                    }, 3000);
                }
            };

            socket.on('live_reaction', handleLiveReaction);

            return () => {
                socket.off('live_reaction', handleLiveReaction);
            };
        }
    }, [socket, targetId, targetType]);

    const handleReactionClick = (reactionType: keyof typeof reactionIcons) => {
        sendReaction(targetId, reactionType, targetType);
        setShowReactionBar(false);

        // Add local reaction for immediate feedback
        const localReaction: LiveReaction = {
            id: `local_${Date.now()}`,
            type: reactionType,
            user: { userId: 'local', username: 'You' },
            timestamp: new Date(),
            x: Math.random() * 300,
            y: Math.random() * 200
        };

        setReactions(prev => [...prev, localReaction]);

        setTimeout(() => {
            setReactions(prev => prev.filter(r => r.id !== localReaction.id));
        }, 2000);
    };

    return (
        <div className={`relative ${className}`}>
            {/* Floating Reactions */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <AnimatePresence>
                    {reactions.map((reaction) => {
                        const ReactionComponent = reactionIcons[reaction.type];
                        return (
                            <motion.div
                                key={reaction.id}
                                initial={{ 
                                    opacity: 0, 
                                    scale: 0,
                                    x: reaction.x,
                                    y: reaction.y
                                }}
                                animate={{ 
                                    opacity: [0, 1, 1, 0], 
                                    scale: [0, 1.2, 1, 0.8],
                                    y: reaction.y - 100
                                }}
                                exit={{ opacity: 0, scale: 0 }}
                                transition={{ duration: 3, ease: "easeOut" }}
                                className="absolute pointer-events-none"
                                style={{
                                    left: reaction.x,
                                    top: reaction.y
                                }}
                            >
                                <div className="flex flex-col items-center">
                                    <div className="text-2xl mb-1">
                                        {ReactionComponent.emoji}
                                    </div>
                                    {reaction.user.username !== 'You' && (
                                        <div className="text-xs text-white bg-black/50 rounded px-2 py-1 whitespace-nowrap">
                                            {reaction.user.username}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Reaction Button */}
            <div className="relative">
                <button
                    onClick={() => setShowReactionBar(!showReactionBar)}
                    className="bg-slate-800/80 backdrop-blur-sm text-white p-3 rounded-full hover:bg-slate-700/80 transition-all duration-300 shadow-lg"
                    title="React"
                >
                    <FaSmile className="text-xl" />
                </button>

                {/* Reaction Bar */}
                <AnimatePresence>
                    {showReactionBar && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8, y: 10 }}
                            className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-slate-800/95 backdrop-blur-md rounded-2xl p-2 shadow-xl border border-purple-500/20"
                        >
                            <div className="flex space-x-2">
                                {Object.entries(reactionIcons).map(([type, config]) => (
                                    <button
                                        key={type}
                                        onClick={() => handleReactionClick(type as keyof typeof reactionIcons)}
                                        className="p-2 rounded-lg hover:bg-slate-700/50 transition-all duration-200 transform hover:scale-110"
                                        title={type}
                                    >
                                        <span className="text-xl">{config.emoji}</span>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
