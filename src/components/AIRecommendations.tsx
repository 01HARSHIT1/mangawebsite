'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FaRobot, FaBrain, FaStar, FaEye, FaHeart, FaRefresh, FaTrendingUp, FaWand } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

interface AIRecommendation {
    mangaId: string;
    score: number;
    reasons: string[];
    confidence: number;
    category: 'trending' | 'similar' | 'genre-based' | 'collaborative' | 'new-release' | 'ai-curated';
    manga: {
        _id: string;
        title: string;
        creator: string;
        description: string;
        genres: string[];
        coverImage: string;
        rating: number;
        views: number;
        status: string;
    };
}

interface AIRecommendationsProps {
    limit?: number;
    showHeader?: boolean;
    variant?: 'grid' | 'list' | 'carousel';
    category?: string;
}

export default function AIRecommendations({ 
    limit = 6, 
    showHeader = true, 
    variant = 'grid',
    category = 'all'
}: AIRecommendationsProps) {
    const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
    const [loading, setLoading] = useState(true);
    const [algorithm, setAlgorithm] = useState<string>('');
    const [isPersonalized, setIsPersonalized] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        loadRecommendations();
    }, [limit, category]);

    const loadRecommendations = async () => {
        try {
            setLoading(true);
            
            const params = new URLSearchParams();
            params.append('limit', limit.toString());
            if (category !== 'all') params.append('category', category);

            const response = await fetch(`/api/ai/recommendations?${params}`, {
                headers: isAuthenticated ? {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                } : {}
            });

            if (response.ok) {
                const data = await response.json();
                setRecommendations(data.recommendations || []);
                setAlgorithm(data.algorithm || 'unknown');
                setIsPersonalized(data.personalized || false);
            } else {
                console.error('Failed to load AI recommendations');
                setRecommendations([]);
            }
        } catch (error) {
            console.error('Error loading AI recommendations:', error);
            setRecommendations([]);
        } finally {
            setLoading(false);
        }
    };

    const refreshRecommendations = async () => {
        setRefreshing(true);
        await loadRecommendations();
        setRefreshing(false);
    };

    const recordInteraction = async (mangaId: string, action: string) => {
        try {
            if (isAuthenticated) {
                await fetch('/api/ai/recommendations', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({
                        action,
                        mangaId,
                        timestamp: new Date()
                    })
                });
            }
        } catch (error) {
            console.error('Failed to record interaction:', error);
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'trending': return <FaTrendingUp className="text-orange-400" />;
            case 'similar': return <FaHeart className="text-red-400" />;
            case 'genre-based': return <FaStar className="text-yellow-400" />;
            case 'collaborative': return <FaEye className="text-blue-400" />;
            case 'new-release': return <FaWand className="text-green-400" />;
            default: return <FaBrain className="text-purple-400" />;
        }
    };

    const getCategoryLabel = (category: string) => {
        switch (category) {
            case 'trending': return 'Trending';
            case 'similar': return 'Similar to your favorites';
            case 'genre-based': return 'Based on your genres';
            case 'collaborative': return 'Users like you enjoyed';
            case 'new-release': return 'New for you';
            default: return 'AI Curated';
        }
    };

    if (loading) {
        return (
            <div className="space-y-4">
                {showHeader && (
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-600 rounded-full animate-pulse"></div>
                        <div className="h-6 bg-gray-600 rounded w-48 animate-pulse"></div>
                    </div>
                )}
                <div className={`grid gap-6 ${
                    variant === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
                }`}>
                    {[...Array(limit)].map((_, i) => (
                        <div key={i} className="bg-slate-800/50 rounded-2xl p-4 animate-pulse">
                            <div className="aspect-[3/4] bg-gray-600 rounded-lg mb-3"></div>
                            <div className="space-y-2">
                                <div className="h-4 bg-gray-600 rounded w-3/4"></div>
                                <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (recommendations.length === 0) {
        return (
            <div className="text-center py-12">
                <FaBrain className="mx-auto text-6xl text-gray-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">No Recommendations Available</h3>
                <p className="text-gray-500">
                    {isAuthenticated 
                        ? "Read some manga to get personalized recommendations!"
                        : "Sign in to get AI-powered personalized recommendations!"
                    }
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {showHeader && (
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-full p-2">
                            <FaRobot className="text-white text-xl" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">
                                {isPersonalized ? '🤖 AI Recommendations for You' : '🔥 Trending Manga'}
                            </h2>
                            <p className="text-gray-400 text-sm">
                                {isPersonalized 
                                    ? `Powered by ${algorithm} algorithm`
                                    : 'Popular manga everyone is reading'
                                }
                            </p>
                        </div>
                    </div>
                    
                    <button
                        onClick={refreshRecommendations}
                        disabled={refreshing}
                        className="flex items-center space-x-2 bg-slate-800/50 hover:bg-slate-700/50 text-gray-300 hover:text-white px-4 py-2 rounded-lg transition-all duration-300"
                        title="Refresh recommendations"
                    >
                        <FaRefresh className={`${refreshing ? 'animate-spin' : ''}`} />
                        <span>Refresh</span>
                    </button>
                </div>
            )}

            {/* Recommendations Grid/List */}
            <div className={`grid gap-6 ${
                variant === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 
                variant === 'carousel' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6' :
                'grid-cols-1'
            }`}>
                <AnimatePresence>
                    {recommendations.map((rec, index) => (
                        <motion.div
                            key={rec.mangaId}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ delay: index * 0.1 }}
                            className="group bg-slate-800/50 rounded-2xl overflow-hidden border border-purple-500/10 hover:border-purple-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10"
                        >
                            <Link 
                                href={`/manga/${rec.manga._id}`}
                                onClick={() => recordInteraction(rec.mangaId, 'click')}
                            >
                                {/* Cover Image */}
                                <div className="aspect-[3/4] relative overflow-hidden">
                                    <Image
                                        src={rec.manga.coverImage}
                                        alt={rec.manga.title}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                    />
                                    
                                    {/* AI Badge */}
                                    <div className="absolute top-2 left-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center space-x-1">
                                        {getCategoryIcon(rec.category)}
                                        <span>AI</span>
                                    </div>
                                    
                                    {/* Confidence Score */}
                                    <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded-full text-xs font-semibold">
                                        {Math.round(rec.confidence * 100)}% match
                                    </div>
                                    
                                    {/* Rating */}
                                    <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center space-x-1">
                                        <FaStar className="text-yellow-400" />
                                        <span>{rec.manga.rating}</span>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-4">
                                    <h3 className="text-white font-semibold mb-1 group-hover:text-purple-400 transition-colors line-clamp-2">
                                        {rec.manga.title}
                                    </h3>
                                    <p className="text-gray-400 text-sm mb-2">
                                        by {rec.manga.creator}
                                    </p>
                                    
                                    {/* Genres */}
                                    <div className="flex flex-wrap gap-1 mb-3">
                                        {rec.manga.genres.slice(0, 3).map((genre) => (
                                            <span
                                                key={genre}
                                                className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full text-xs"
                                            >
                                                {genre}
                                            </span>
                                        ))}
                                    </div>

                                    {/* AI Reasons */}
                                    <div className="space-y-1 mb-3">
                                        {rec.reasons.slice(0, 2).map((reason, i) => (
                                            <div key={i} className="flex items-center space-x-2 text-xs text-gray-400">
                                                <div className="w-1 h-1 bg-purple-400 rounded-full"></div>
                                                <span>{reason}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Stats */}
                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                        <div className="flex items-center space-x-1">
                                            <FaEye />
                                            <span>{rec.manga.views.toLocaleString()}</span>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                            <span className="capitalize">{rec.manga.status}</span>
                                        </div>
                                    </div>
                                </div>
                            </Link>

                            {/* Quick Actions */}
                            <div className="px-4 pb-4 flex space-x-2">
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        recordInteraction(rec.mangaId, 'like');
                                    }}
                                    className="flex-1 bg-slate-700/50 hover:bg-red-500/20 text-gray-400 hover:text-red-400 py-2 px-3 rounded-lg text-sm transition-all duration-300 flex items-center justify-center space-x-1"
                                >
                                    <FaHeart />
                                    <span>Like</span>
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        recordInteraction(rec.mangaId, 'bookmark');
                                    }}
                                    className="flex-1 bg-slate-700/50 hover:bg-purple-500/20 text-gray-400 hover:text-purple-400 py-2 px-3 rounded-lg text-sm transition-all duration-300 flex items-center justify-center space-x-1"
                                >
                                    <FaStar />
                                    <span>Save</span>
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Algorithm Info */}
            {isPersonalized && showHeader && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-4"
                >
                    <div className="flex items-center space-x-3">
                        <FaBrain className="text-purple-400 text-xl" />
                        <div>
                            <h4 className="text-white font-semibold">AI-Powered Recommendations</h4>
                            <p className="text-gray-300 text-sm">
                                These suggestions are tailored to your reading preferences using advanced machine learning algorithms.
                                The more you read and interact, the better our recommendations become!
                            </p>
                        </div>
                    </div>
                    
                    {/* Recommendation Categories */}
                    <div className="mt-3 flex flex-wrap gap-2">
                        {Array.from(new Set(recommendations.map(r => r.category))).map((cat) => (
                            <div key={cat} className="flex items-center space-x-1 bg-slate-800/50 px-3 py-1 rounded-full">
                                {getCategoryIcon(cat)}
                                <span className="text-xs text-gray-300">{getCategoryLabel(cat)}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Learning Notice for New Users */}
            {!isPersonalized && isAuthenticated && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4"
                >
                    <div className="flex items-center space-x-3">
                        <FaRobot className="text-blue-400 text-xl" />
                        <div>
                            <h4 className="text-white font-semibold">Learning Your Preferences</h4>
                            <p className="text-gray-300 text-sm">
                                Our AI is learning your reading preferences. Read a few manga and rate them to get personalized recommendations!
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
