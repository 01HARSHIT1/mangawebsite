'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Play, Search, TrendingUp, Clock, Star, ChevronRight } from 'lucide-react';
import AppModeSwitcher from '@/components/AppModeSwitcher';
import AnimeCarousel from '@/components/anime/components/AnimeCarousel';
import EpisodeCard from '@/components/anime/components/EpisodeCard';

interface AnimeSeries {
    _id: string;
    title: string;
    description: string;
    coverImage: string;
    bannerImage?: string;
    genres: string[];
    rating: number;
    year: number;
    status: 'ongoing' | 'completed' | 'upcoming';
    episodeCount: number;
    latestEpisode?: number;
}

export default function AnimeHome() {
    const [featuredAnime, setFeaturedAnime] = useState<AnimeSeries | null>(null);
    const [trendingAnime, setTrendingAnime] = useState<AnimeSeries[]>([]);
    const [recentAnime, setRecentAnime] = useState<AnimeSeries[]>([]);
    const [popularAnime, setPopularAnime] = useState<AnimeSeries[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnimeData();
    }, []);

    const fetchAnimeData = async () => {
        try {
            setLoading(true);
            // Fetch featured anime
            const featuredRes = await fetch('/api/anime/featured');
            if (featuredRes.ok) {
                const featured = await featuredRes.json();
                setFeaturedAnime(featured);
            }

            // Fetch trending anime
            const trendingRes = await fetch('/api/anime/trending');
            if (trendingRes.ok) {
                const trending = await trendingRes.json();
                setTrendingAnime(trending.anime || []);
            }

            // Fetch recent anime
            const recentRes = await fetch('/api/anime/recent');
            if (recentRes.ok) {
                const recent = await recentRes.json();
                setRecentAnime(recent.anime || []);
            }

            // Fetch popular anime
            const popularRes = await fetch('/api/anime/popular');
            if (popularRes.ok) {
                const popular = await popularRes.json();
                setPopularAnime(popular.anime || []);
            }
        } catch (error) {
            console.error('Error fetching anime data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
                    <p className="text-white text-xl">Loading Anime...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            {/* Anime Navigation Bar */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-md border-b border-red-500/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link href="/anime" className="flex items-center space-x-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-orange-600 rounded-xl flex items-center justify-center">
                                <Play className="w-6 h-6 text-white" />
                            </div>
                            <div className="hidden md:block">
                                <h1 className="text-xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                                    AnimeStream
                                </h1>
                            </div>
                        </Link>

                        {/* Navigation Links */}
                        <div className="hidden md:flex items-center space-x-6">
                            <Link href="/anime" className="text-white hover:text-red-400 transition-colors font-medium">
                                Home
                            </Link>
                            <Link href="/anime/browse" className="text-gray-400 hover:text-red-400 transition-colors">
                                Browse
                            </Link>
                            <Link href="/anime/genres" className="text-gray-400 hover:text-red-400 transition-colors">
                                Genres
                            </Link>
                            <Link href="/anime/library" className="text-gray-400 hover:text-red-400 transition-colors">
                                My Library
                            </Link>
                        </div>

                        {/* Search & Mode Switcher */}
                        <div className="flex items-center space-x-4">
                            <button className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors">
                                <Search className="w-5 h-5 text-gray-400" />
                            </button>
                            <AppModeSwitcher />
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section - Featured Anime */}
            {featuredAnime && (
                <div className="relative h-[70vh] mt-16 overflow-hidden">
                    <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{
                            backgroundImage: `url(${featuredAnime.bannerImage || featuredAnime.coverImage})`,
                        }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/80 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent" />
                    </div>

                    <div className="relative z-10 h-full flex items-center">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                            <div className="max-w-2xl">
                                <div className="flex items-center space-x-2 mb-4">
                                    <span className="px-3 py-1 bg-red-600 text-white text-sm font-semibold rounded-full">
                                        {featuredAnime.status === 'ongoing' ? 'Ongoing' : featuredAnime.status === 'completed' ? 'Completed' : 'Upcoming'}
                                    </span>
                                    <span className="text-gray-300 text-sm">{featuredAnime.year}</span>
                                    <div className="flex items-center space-x-1 text-yellow-400">
                                        <Star className="w-4 h-4 fill-current" />
                                        <span className="text-sm font-semibold">{featuredAnime.rating.toFixed(1)}</span>
                                    </div>
                                </div>

                                <h1 className="text-5xl md:text-6xl font-bold mb-4 text-white drop-shadow-2xl">
                                    {featuredAnime.title}
                                </h1>

                                <p className="text-lg text-gray-300 mb-6 line-clamp-3">
                                    {featuredAnime.description}
                                </p>

                                <div className="flex items-center space-x-4">
                                    <Link
                                        href={`/anime/${featuredAnime._id}`}
                                        className="flex items-center space-x-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all shadow-lg shadow-red-500/50"
                                    >
                                        <Play className="w-5 h-5" />
                                        <span>Watch Now</span>
                                    </Link>
                                    <button className="flex items-center space-x-2 px-6 py-3 bg-gray-800/50 hover:bg-gray-700/50 text-white rounded-lg font-semibold transition-all border border-gray-700">
                                        <span>+</span>
                                        <span>Add to Library</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Content Sections */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Trending Now */}
                {trendingAnime.length > 0 && (
                    <section className="mb-12">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center space-x-2">
                                <TrendingUp className="w-6 h-6 text-red-500" />
                                <h2 className="text-2xl font-bold text-white">Trending Now</h2>
                            </div>
                            <Link href="/anime/trending" className="flex items-center space-x-1 text-gray-400 hover:text-red-400 transition-colors">
                                <span>View All</span>
                                <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                        <AnimeCarousel anime={trendingAnime} />
                    </section>
                )}

                {/* Continue Watching */}
                {recentAnime.length > 0 && (
                    <section className="mb-12">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center space-x-2">
                                <Clock className="w-6 h-6 text-red-500" />
                                <h2 className="text-2xl font-bold text-white">Continue Watching</h2>
                            </div>
                            <Link href="/anime/library" className="flex items-center space-x-1 text-gray-400 hover:text-red-400 transition-colors">
                                <span>View All</span>
                                <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                        <AnimeCarousel anime={recentAnime} />
                    </section>
                )}

                {/* Popular Anime */}
                {popularAnime.length > 0 && (
                    <section className="mb-12">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center space-x-2">
                                <Star className="w-6 h-6 text-red-500 fill-current" />
                                <h2 className="text-2xl font-bold text-white">Popular Anime</h2>
                            </div>
                            <Link href="/anime/popular" className="flex items-center space-x-1 text-gray-400 hover:text-red-400 transition-colors">
                                <span>View All</span>
                                <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {popularAnime.map((anime) => (
                                <EpisodeCard key={anime._id} anime={anime} />
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}

