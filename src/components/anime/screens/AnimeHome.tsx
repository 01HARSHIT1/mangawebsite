'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Play, Search, TrendingUp, Clock, Star, ChevronRight, Sparkles, Zap, Heart, Bookmark, Share2, MoreVertical, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
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
    const [heroIndex, setHeroIndex] = useState(0);

    useEffect(() => {
        fetchAnimeData();
    }, []);

    // Auto-rotate featured anime
    useEffect(() => {
        if (trendingAnime.length > 0) {
            const interval = setInterval(() => {
                setHeroIndex((prev) => (prev + 1) % Math.min(trendingAnime.length, 5));
            }, 8000);
            return () => clearInterval(interval);
        }
    }, [trendingAnime]);

    const fetchAnimeData = async () => {
        try {
            setLoading(true);
            const [featuredRes, trendingRes, recentRes, popularRes] = await Promise.all([
                fetch('/api/anime/featured'),
                fetch('/api/anime/trending'),
                fetch('/api/anime/recent'),
                fetch('/api/anime/popular'),
            ]);

            if (featuredRes.ok) {
                const featured = await featuredRes.json();
                setFeaturedAnime(featured.anime || featured);
            }

            if (trendingRes.ok) {
                const trending = await trendingRes.json();
                setTrendingAnime(trending.anime || []);
            }

            if (recentRes.ok) {
                const recent = await recentRes.json();
                setRecentAnime(recent.anime || []);
            }

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

    const currentHero = trendingAnime[heroIndex] || featuredAnime;

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-950 via-red-950 to-black flex items-center justify-center">
                <div className="text-center">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"
                    />
                    <p className="text-orange-400 text-xl font-semibold">Loading Epic Anime...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-950 via-red-950 to-black text-white overflow-hidden">
            {/* Top Navigation Bar - Crunchyroll Style */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-orange-500/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link href="/anime" className="flex items-center space-x-3 group">
                            <motion.div
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                className="relative"
                            >
                                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/50">
                                    <Play className="w-7 h-7 text-white fill-white" />
                                </div>
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="absolute -top-1 -right-1 w-4 h-4 bg-orange-400 rounded-full border-2 border-black"
                                />
                            </motion.div>
                            <div className="hidden md:block">
                                <h1 className="text-2xl font-black bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 bg-clip-text text-transparent">
                                    ANIMESTREAM
                                </h1>
                                <p className="text-xs text-orange-300/70 -mt-1">Premium Anime Hub</p>
                            </div>
                        </Link>

                        {/* Navigation Links */}
                        <div className="hidden lg:flex items-center space-x-8">
                            <Link href="/anime" className="text-orange-400 font-bold text-sm hover:text-orange-300 transition-colors border-b-2 border-orange-400 pb-1">
                                HOME
                            </Link>
                            <Link href="/anime/browse" className="text-gray-400 hover:text-orange-400 transition-colors text-sm font-medium">
                                BROWSE
                            </Link>
                            <Link href="/anime/genres" className="text-gray-400 hover:text-orange-400 transition-colors text-sm font-medium">
                                GENRES
                            </Link>
                            <Link href="/anime/library" className="text-gray-400 hover:text-orange-400 transition-colors text-sm font-medium">
                                MY LIBRARY
                            </Link>
                        </div>

                        {/* Right Side Actions */}
                        <div className="flex items-center space-x-4">
                            <button className="p-2 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 transition-colors border border-orange-500/30">
                                <Search className="w-5 h-5 text-orange-400" />
                            </button>
                            <AppModeSwitcher />
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section - Massive Crunchyroll Style Banner */}
            {currentHero && (
                <motion.div
                    key={currentHero._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="relative h-[85vh] mt-16 overflow-hidden"
                >
                    {/* Background Image with Overlay */}
                    <div className="absolute inset-0">
                        <div
                            className="absolute inset-0 bg-cover bg-center scale-110"
                            style={{
                                backgroundImage: `url(${currentHero.bannerImage || currentHero.coverImage})`,
                                filter: 'brightness(0.4) saturate(1.2)',
                            }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-900/20 via-transparent to-red-900/20" />
                    </div>

                    {/* Animated Particles Effect */}
                    {typeof window !== 'undefined' && (
                        <div className="absolute inset-0 overflow-hidden">
                            {[...Array(20)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="absolute w-1 h-1 bg-orange-400 rounded-full"
                                    initial={{
                                        x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920),
                                        y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1080),
                                        opacity: 0,
                                    }}
                                    animate={{
                                        y: [null, Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1080)],
                                        opacity: [0, 0.6, 0],
                                    }}
                                    transition={{
                                        duration: Math.random() * 3 + 2,
                                        repeat: Infinity,
                                        delay: Math.random() * 2,
                                    }}
                                />
                            ))}
                        </div>
                    )}

                    {/* Hero Content */}
                    <div className="relative z-10 h-full flex items-center">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                            <div className="max-w-3xl">
                                {/* Badges */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center space-x-3 mb-6"
                                >
                                    <span className="px-4 py-1.5 bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-bold rounded-full shadow-lg shadow-orange-500/50 flex items-center space-x-2">
                                        <Sparkles className="w-4 h-4" />
                                        <span>{currentHero.status === 'ongoing' ? 'ONGOING' : currentHero.status === 'completed' ? 'COMPLETED' : 'UPCOMING'}</span>
                                    </span>
                                    <span className="px-3 py-1.5 bg-black/50 text-orange-300 text-sm font-semibold rounded-full border border-orange-500/30">
                                        {currentHero.year}
                                    </span>
                                    <div className="flex items-center space-x-1 px-3 py-1.5 bg-black/50 rounded-full border border-yellow-500/30">
                                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                        <span className="text-yellow-400 text-sm font-bold">{currentHero.rating.toFixed(1)}</span>
                                    </div>
                                </motion.div>

                                {/* Title */}
                                <motion.h1
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="text-6xl md:text-7xl lg:text-8xl font-black mb-6 leading-tight"
                                >
                                    <span className="bg-gradient-to-r from-white via-orange-200 to-red-200 bg-clip-text text-transparent drop-shadow-2xl">
                                        {currentHero.title}
                                    </span>
                                </motion.h1>

                                {/* Description */}
                                <motion.p
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="text-xl text-gray-300 mb-8 line-clamp-3 max-w-2xl leading-relaxed"
                                >
                                    {currentHero.description}
                                </motion.p>

                                {/* Genres */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                    className="flex flex-wrap gap-2 mb-8"
                                >
                                    {currentHero.genres.slice(0, 4).map((genre, index) => (
                                        <span
                                            key={index}
                                            className="px-3 py-1 bg-black/40 backdrop-blur-sm text-orange-300 text-xs font-semibold rounded-md border border-orange-500/30"
                                        >
                                            {genre.toUpperCase()}
                                        </span>
                                    ))}
                                </motion.div>

                                {/* Action Buttons */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.6 }}
                                    className="flex items-center space-x-4"
                                >
                                    <Link
                                        href={`/anime/${currentHero._id}/episode/1`}
                                        className="group flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl font-bold text-lg transition-all shadow-2xl shadow-orange-500/50 hover:shadow-orange-500/70 hover:scale-105"
                                    >
                                        <Play className="w-6 h-6 fill-white group-hover:scale-110 transition-transform" />
                                        <span>WATCH NOW</span>
                                    </Link>
                                    <button className="p-4 bg-black/40 backdrop-blur-sm hover:bg-black/60 border border-white/20 rounded-xl transition-all hover:scale-105">
                                        <Heart className="w-6 h-6 text-white" />
                                    </button>
                                    <button className="p-4 bg-black/40 backdrop-blur-sm hover:bg-black/60 border border-white/20 rounded-xl transition-all hover:scale-105">
                                        <Bookmark className="w-6 h-6 text-white" />
                                    </button>
                                    <button className="p-4 bg-black/40 backdrop-blur-sm hover:bg-black/60 border border-white/20 rounded-xl transition-all hover:scale-105">
                                        <Share2 className="w-6 h-6 text-white" />
                                    </button>
                                </motion.div>

                                {/* Episode Info */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.8 }}
                                    className="mt-8 flex items-center space-x-6 text-sm text-gray-400"
                                >
                                    <div className="flex items-center space-x-2">
                                        <Zap className="w-4 h-4 text-orange-400" />
                                        <span>{currentHero.episodeCount} Episodes</span>
                                    </div>
                                    {currentHero.latestEpisode && (
                                        <div className="flex items-center space-x-2">
                                            <Clock className="w-4 h-4 text-orange-400" />
                                            <span>Latest: Ep {currentHero.latestEpisode}</span>
                                        </div>
                                    )}
                                </motion.div>
                            </div>
                        </div>
                    </div>

                    {/* Hero Navigation Dots */}
                    {trendingAnime.length > 1 && (
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-2">
                            {trendingAnime.slice(0, 5).map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setHeroIndex(index)}
                                    className={`w-2 h-2 rounded-full transition-all ${
                                        index === heroIndex
                                            ? 'w-8 bg-orange-500'
                                            : 'bg-white/30 hover:bg-white/50'
                                    }`}
                                />
                            ))}
                        </div>
                    )}
                </motion.div>
            )}

            {/* Content Sections */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Trending Now - Crunchyroll Style */}
                {trendingAnime.length > 0 && (
                    <motion.section
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mb-16"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center space-x-3">
                                <div className="w-1 h-8 bg-gradient-to-b from-orange-500 to-red-500 rounded-full" />
                                <div>
                                    <div className="flex items-center space-x-2 mb-1">
                                        <TrendingUp className="w-6 h-6 text-orange-400" />
                                        <h2 className="text-3xl font-black text-white">TRENDING NOW</h2>
                                    </div>
                                    <p className="text-sm text-gray-400">Most watched this week</p>
                                </div>
                            </div>
                            <Link
                                href="/anime/trending"
                                className="flex items-center space-x-2 text-orange-400 hover:text-orange-300 transition-colors font-semibold group"
                            >
                                <span>VIEW ALL</span>
                                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                        <AnimeCarousel anime={trendingAnime} />
                    </motion.section>
                )}

                {/* Continue Watching */}
                {recentAnime.length > 0 && (
                    <motion.section
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mb-16"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center space-x-3">
                                <div className="w-1 h-8 bg-gradient-to-b from-orange-500 to-red-500 rounded-full" />
                                <div>
                                    <div className="flex items-center space-x-2 mb-1">
                                        <Clock className="w-6 h-6 text-orange-400" />
                                        <h2 className="text-3xl font-black text-white">CONTINUE WATCHING</h2>
                                    </div>
                                    <p className="text-sm text-gray-400">Pick up where you left off</p>
                                </div>
                            </div>
                            <Link
                                href="/anime/library"
                                className="flex items-center space-x-2 text-orange-400 hover:text-orange-300 transition-colors font-semibold group"
                            >
                                <span>VIEW ALL</span>
                                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {recentAnime.slice(0, 12).map((anime) => (
                                <EpisodeCard key={anime._id} anime={anime} episodeNumber={anime.latestEpisode} progress={Math.floor(Math.random() * 80 + 10)} />
                            ))}
                        </div>
                    </motion.section>
                )}

                {/* Popular Anime */}
                {popularAnime.length > 0 && (
                    <motion.section
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mb-16"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center space-x-3">
                                <div className="w-1 h-8 bg-gradient-to-b from-orange-500 to-red-500 rounded-full" />
                                <div>
                                    <div className="flex items-center space-x-2 mb-1">
                                        <Star className="w-6 h-6 text-orange-400 fill-orange-400" />
                                        <h2 className="text-3xl font-black text-white">POPULAR ANIME</h2>
                                    </div>
                                    <p className="text-sm text-gray-400">Top rated series</p>
                                </div>
                            </div>
                            <Link
                                href="/anime/popular"
                                className="flex items-center space-x-2 text-orange-400 hover:text-orange-300 transition-colors font-semibold group"
                            >
                                <span>VIEW ALL</span>
                                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {popularAnime.map((anime) => (
                                <EpisodeCard key={anime._id} anime={anime} />
                            ))}
                        </div>
                    </motion.section>
                )}

                {/* Recently Added */}
                {recentAnime.length > 0 && (
                    <motion.section
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mb-16"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center space-x-3">
                                <div className="w-1 h-8 bg-gradient-to-b from-orange-500 to-red-500 rounded-full" />
                                <div>
                                    <div className="flex items-center space-x-2 mb-1">
                                        <Zap className="w-6 h-6 text-orange-400" />
                                        <h2 className="text-3xl font-black text-white">RECENTLY ADDED</h2>
                                    </div>
                                    <p className="text-sm text-gray-400">Latest releases</p>
                                </div>
                            </div>
                            <Link
                                href="/anime/recent"
                                className="flex items-center space-x-2 text-orange-400 hover:text-orange-300 transition-colors font-semibold group"
                            >
                                <span>VIEW ALL</span>
                                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                        <AnimeCarousel anime={recentAnime} />
                    </motion.section>
                )}
            </div>

            {/* Floating Action Button - Mode Switcher */}
            <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                className="fixed bottom-8 right-8 z-50"
            >
                <div className="bg-black/80 backdrop-blur-xl border border-orange-500/30 rounded-2xl p-4 shadow-2xl">
                    <AppModeSwitcher />
                </div>
            </motion.div>
        </div>
    );
}
