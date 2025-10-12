"use client";
import { useState, useEffect, useCallback } from 'react';
import { FaFire, FaStar, FaEye, FaHeart, FaBookmark, FaSpinner, FaArrowRight } from 'react-icons/fa';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import OptimizedImage from './OptimizedImage';

interface Manga {
    _id: string;
    title: string;
    description: string;
    coverImage: string;
    genres: string[];
    status: string;
    rating: number;
    views: number;
    likes: number;
    chapters: number;
    author: string;
    year: number;
    similarity?: number;
}

interface SmartRecommendationsProps {
    currentUser?: any;
    currentMangaId?: string;
}

export default function SmartRecommendations({ currentUser, currentMangaId }: SmartRecommendationsProps) {
    const [personalized, setPersonalized] = useState<Manga[]>([]);
    const [trending, setTrending] = useState<Manga[]>([]);
    const [similar, setSimilar] = useState<Manga[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'personalized' | 'trending' | 'similar'>('personalized');
    const [error, setError] = useState<string | null>(null);

    // Fetch personalized recommendations
    const fetchPersonalized = useCallback(async () => {
        if (!currentUser) return;

        try {
            const token = localStorage.getItem('authToken');
            const res = await fetch('/api/manga/recommendations/personalized', {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });

            if (res.ok) {
                const data = await res.json();
                setPersonalized(data.manga || []);
            }
        } catch (err) {
            console.error('Error fetching personalized recommendations:', err);
        }
    }, [currentUser]);

    // Fetch trending manga
    const fetchTrending = useCallback(async () => {
        try {
            const res = await fetch('/api/manga/trending');
            if (res.ok) {
                const data = await res.json();
                setTrending(data.manga || []);
            }
        } catch (err) {
            console.error('Error fetching trending manga:', err);
        }
    }, []);

    // Fetch similar manga
    const fetchSimilar = useCallback(async () => {
        if (!currentMangaId) return;

        try {
            const res = await fetch(`/api/manga/${currentMangaId}/similar`);
            if (res.ok) {
                const data = await res.json();
                setSimilar(data.manga || []);
            }
        } catch (err) {
            console.error('Error fetching similar manga:', err);
        }
    }, [currentMangaId]);

    // Load all recommendations
    useEffect(() => {
        const loadRecommendations = async () => {
            setLoading(true);
            setError(null);

            try {
                await Promise.all([
                    fetchPersonalized(),
                    fetchTrending(),
                    fetchSimilar()
                ]);
            } catch (err) {
                setError('Failed to load recommendations');
                console.error('Error loading recommendations:', err);
            } finally {
                setLoading(false);
            }
        };

        loadRecommendations();
    }, [fetchPersonalized, fetchTrending, fetchSimilar]);

    const getCurrentRecommendations = () => {
        switch (activeTab) {
            case 'personalized':
                return personalized;
            case 'trending':
                return trending;
            case 'similar':
                return similar;
            default:
                return [];
        }
    };

    const getTabIcon = (tab: string) => {
        switch (tab) {
            case 'personalized':
                return <FaHeart className="w-4 h-4" />;
            case 'trending':
                return <FaFire className="w-4 h-4" />;
            case 'similar':
                return <FaStar className="w-4 h-4" />;
            default:
                return null;
        }
    };

    const getTabTitle = (tab: string) => {
        switch (tab) {
            case 'personalized':
                return 'For You';
            case 'trending':
                return 'Trending';
            case 'similar':
                return 'Similar';
            default:
                return '';
        }
    };

    if (loading) {
        return (
            <div className="bg-gray-900 rounded-2xl p-6">
                <div className="flex justify-center py-8">
                    <FaSpinner className="animate-spin text-3xl text-blue-400" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-gray-900 rounded-2xl p-6">
                <div className="text-center py-8">
                    <p className="text-red-400 mb-2">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const currentRecommendations = getCurrentRecommendations();

    return (
        <div className="bg-gray-900 rounded-2xl shadow-xl p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Smart Recommendations</h2>
                <div className="flex space-x-1 bg-gray-800 rounded-lg p-1">
                    {(['personalized', 'trending', 'similar'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${activeTab === tab
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                                }`}
                        >
                            {getTabIcon(tab)}
                            <span>{getTabTitle(tab)}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Recommendations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {currentRecommendations.length > 0 ? (
                    currentRecommendations.map((manga, index) => (
                        <motion.div
                            key={manga._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="group cursor-pointer"
                        >
                            <Link href={`/manga/${manga._id}`}>
                                <div className="bg-gray-800 rounded-xl overflow-hidden hover:bg-gray-700 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                                    {/* Cover Image */}
                                    <div className="relative aspect-[3/4] overflow-hidden">
                                        <OptimizedImage
                                            src={manga.coverImage}
                                            alt={manga.title}
                                            fill
                                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                        {/* Rating Badge */}
                                        <div className="absolute top-2 right-2 bg-yellow-500 text-black px-2 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
                                            <FaStar className="w-3 h-3" />
                                            <span>{manga.rating.toFixed(1)}</span>
                                        </div>

                                        {/* Status Badge */}
                                        <div className="absolute top-2 left-2">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${manga.status === 'Ongoing'
                                                    ? 'bg-green-500 text-white'
                                                    : 'bg-gray-500 text-white'
                                                }`}>
                                                {manga.status}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-4">
                                        <h3 className="font-bold text-white text-lg mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">
                                            {manga.title}
                                        </h3>

                                        <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                                            {manga.description}
                                        </p>

                                        {/* Genres */}
                                        <div className="flex flex-wrap gap-1 mb-3">
                                            {manga.genres.slice(0, 2).map((genre) => (
                                                <span
                                                    key={genre}
                                                    className="px-2 py-1 bg-blue-600/20 text-blue-400 text-xs rounded-full"
                                                >
                                                    {genre}
                                                </span>
                                            ))}
                                        </div>

                                        {/* Stats */}
                                        <div className="flex items-center justify-between text-sm text-gray-400">
                                            <div className="flex items-center space-x-3">
                                                <div className="flex items-center space-x-1">
                                                    <FaEye className="w-3 h-3" />
                                                    <span>{manga.views.toLocaleString()}</span>
                                                </div>
                                                <div className="flex items-center space-x-1">
                                                    <FaHeart className="w-3 h-3" />
                                                    <span>{manga.likes.toLocaleString()}</span>
                                                </div>
                                            </div>
                                            <span className="text-xs">
                                                {manga.chapters} chapters
                                            </span>
                                        </div>

                                        {/* Author & Year */}
                                        <div className="mt-2 text-xs text-gray-500">
                                            <p>by {manga.author}</p>
                                            <p>{manga.year}</p>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))
                ) : (
                    <div className="col-span-full text-center py-12">
                        <div className="text-gray-400 text-lg mb-4">
                            No recommendations available
                        </div>
                        <p className="text-gray-500">
                            {activeTab === 'personalized'
                                ? 'Sign in to get personalized recommendations'
                                : 'Check back later for new content'
                            }
                        </p>
                    </div>
                )}
            </div>

            {/* View More Button */}
            {currentRecommendations.length > 0 && (
                <div className="mt-6 text-center">
                    <Link
                        href={`/manga?tab=${activeTab}`}
                        className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all duration-200 hover:scale-105"
                    >
                        <span>View More {getTabTitle(activeTab)}</span>
                        <FaArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            )}
        </div>
    );
}