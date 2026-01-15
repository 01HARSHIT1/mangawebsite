'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Play, Search, TrendingUp, Clock, Star, ChevronRight, Sparkles, Zap, Heart, Bookmark, Share2, MoreVertical, Filter, Calendar, Tv, Award, MessageCircle, Share, Menu, X, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AppModeSwitcher from '@/components/AppModeSwitcher';
import AnimeCarousel from '@/components/anime/components/AnimeCarousel';
import EpisodeCard from '@/components/anime/components/EpisodeCard';
import ContinueWatching from '@/components/anime/components/ContinueWatching';

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
    const [topAiring, setTopAiring] = useState<AnimeSeries[]>([]);
    const [mostFavourite, setMostFavourite] = useState<AnimeSeries[]>([]);
    const [latestCompleted, setLatestCompleted] = useState<AnimeSeries[]>([]);
    const [latestEpisodes, setLatestEpisodes] = useState<any[]>([]);
    const [top10, setTop10] = useState<AnimeSeries[]>([]);
    const [schedule, setSchedule] = useState<Record<string, any[]>>({});
    const [selectedScheduleDay, setSelectedScheduleDay] = useState<string>('');
    const [top10Period, setTop10Period] = useState<'today' | 'week' | 'month'>('today');
    const [loading, setLoading] = useState(true);
    const [heroIndex, setHeroIndex] = useState(0);

    useEffect(() => {
        fetchAnimeData();
    }, []);

    // Refetch top 10 when period changes
    useEffect(() => {
        if (!loading) {
            const fetchTop10 = async () => {
                try {
                    const top10Res = await fetch(`/api/anime/top-10?period=${top10Period}`);
                    if (top10Res.ok) {
                        const data = await top10Res.json();
                        setTop10(data.anime || []);
                    }
                } catch (error) {
                    console.error('Error fetching top 10:', error);
                }
            };
            fetchTop10();
        }
    }, [top10Period]);

    // Auto-rotate featured anime
    useEffect(() => {
        const heroList = trendingAnime.length > 0 ? trendingAnime : (featuredAnime ? [featuredAnime] : []);
        if (heroList.length > 1) {
            const interval = setInterval(() => {
                setHeroIndex((prev) => (prev + 1) % Math.min(heroList.length, 5));
            }, 8000);
            return () => clearInterval(interval);
        }
    }, [trendingAnime, featuredAnime]);

    const fetchAnimeData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const userId = token ? 'user' : null; // In production, get actual userId from token
            
            // Fetch home blocks (includes personalized content)
            const homeBlocksRes = await fetch(`/api/homeblocks?user_id=${userId || ''}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            
            let homeBlocks: any = null;
            if (homeBlocksRes.ok) {
                homeBlocks = await homeBlocksRes.json();
            }

            const [featuredRes, trendingRes, recentRes, popularRes] = await Promise.all([
                fetch('/api/anime/featured'),
                fetch('/api/anime/trending'),
                fetch('/api/anime/recent'),
                fetch('/api/anime/popular'),
            ]);

            // Use home blocks if available, otherwise fallback to individual APIs
            if (homeBlocks && homeBlocks.blocks) {
                for (const block of homeBlocks.blocks) {
                    if (block.type === 'hero' && block.items && block.items.length > 0) {
                        const heroItem = block.items[0];
                        setFeaturedAnime({
                            _id: heroItem.id,
                            title: heroItem.title,
                            description: heroItem.description || '',
                            coverImage: heroItem.poster,
                            bannerImage: heroItem.poster,
                            genres: [],
                            rating: heroItem.rating || 0,
                            year: heroItem.year || 0,
                            status: 'ongoing' as const,
                            episodeCount: 0,
                        });
                    }
                    if (block.type === 'carousel') {
                        if (block.title === 'Trending Now') {
                            setTrendingAnime(block.items.map((item: any) => ({
                                _id: item.id,
                                title: item.title,
                                description: '',
                                coverImage: item.poster,
                                genres: [],
                                rating: item.rating || 0,
                                year: 0,
                                status: 'ongoing' as const,
                                episodeCount: item.episodeCount || 0,
                            })));
                        } else if (block.title === 'New Releases') {
                            setRecentAnime(block.items.map((item: any) => ({
                                _id: item.id,
                                title: item.title,
                                description: '',
                                coverImage: item.poster,
                                genres: [],
                                rating: item.rating || 0,
                                year: item.year || 0,
                                status: 'ongoing' as const,
                                episodeCount: 0,
                            })));
                        } else if (block.title === 'Popular This Week') {
                            setPopularAnime(block.items.map((item: any) => ({
                                _id: item.id,
                                title: item.title,
                                description: '',
                                coverImage: item.poster,
                                genres: [],
                                rating: item.rating || 0,
                                year: 0,
                                status: 'ongoing' as const,
                                episodeCount: item.episodeCount || 0,
                            })));
                        }
                    }
                }
            }

            // Fallback to individual APIs if home blocks not available
            if (featuredRes.ok && !homeBlocks) {
                const featured = await featuredRes.json();
                setFeaturedAnime(featured.anime || featured);
                // If we have featured anime, also add it to trending for hero rotation
                if (featured.anime || featured) {
                    const featuredItem = featured.anime || featured;
                    if (trendingAnime.length === 0) {
                        setTrendingAnime([featuredItem]);
                    }
                }
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

            // Fetch additional sections
            const [topAiringRes, mostFavouriteRes, latestCompletedRes, latestEpisodesRes, top10Res, scheduleRes] = await Promise.all([
                fetch('/api/anime/top-airing'),
                fetch('/api/anime/most-favourite'),
                fetch('/api/anime/latest-completed'),
                fetch('/api/anime/latest-episodes'),
                fetch('/api/anime/top-10?period=today'),
                fetch('/api/anime/schedule'),
            ]);

            if (topAiringRes.ok) {
                const data = await topAiringRes.json();
                setTopAiring(data.anime || []);
            }
            if (mostFavouriteRes.ok) {
                const data = await mostFavouriteRes.json();
                setMostFavourite(data.anime || []);
            }
            if (latestCompletedRes.ok) {
                const data = await latestCompletedRes.json();
                setLatestCompleted(data.anime || []);
            }
            if (latestEpisodesRes.ok) {
                const data = await latestEpisodesRes.json();
                setLatestEpisodes(data.episodes || []);
            }
            if (top10Res.ok) {
                const data = await top10Res.json();
                setTop10(data.anime || []);
            }
            if (scheduleRes.ok) {
                const data = await scheduleRes.json();
                setSchedule(data.schedule || {});
                // Set first available day as default
                const days = Object.keys(data.schedule || {});
                if (days.length > 0 && !selectedScheduleDay) {
                    setSelectedScheduleDay(days[0]);
                }
            }
        } catch (error) {
            console.error('Error fetching anime data:', error);
        } finally {
            setLoading(false);
        }
    };

    const heroList = trendingAnime.length > 0 ? trendingAnime : (featuredAnime ? [featuredAnime] : []);
    const currentHero = heroList[heroIndex] || featuredAnime;

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
            {/* Navigation is now handled by AnimeAppNavigator */}

            {/* Hero Section - Massive Crunchyroll Style Banner */}
            {currentHero && (
                <motion.div
                    key={currentHero._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="relative h-[60vh] sm:h-[70vh] md:h-[80vh] lg:h-[85vh] overflow-hidden"
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

                    {/* Hero Content - Responsive */}
                    <div className="relative z-10 h-full flex items-center">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                            <div className="max-w-3xl">
                                {/* Badges - Responsive */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6"
                                >
                                    <span className="px-3 sm:px-4 py-1 sm:py-1.5 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs sm:text-sm font-bold rounded-full shadow-lg shadow-orange-500/50 flex items-center space-x-1 sm:space-x-2">
                                        <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                                        <span>{currentHero.status === 'ongoing' ? 'ONGOING' : currentHero.status === 'completed' ? 'COMPLETED' : 'UPCOMING'}</span>
                                    </span>
                                    <span className="px-2 sm:px-3 py-1 sm:py-1.5 bg-black/50 text-orange-300 text-xs sm:text-sm font-semibold rounded-full border border-orange-500/30">
                                        {currentHero.year}
                                    </span>
                                    <div className="flex items-center space-x-1 px-2 sm:px-3 py-1 sm:py-1.5 bg-black/50 rounded-full border border-yellow-500/30">
                                        <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 fill-yellow-400" />
                                        <span className="text-yellow-400 text-xs sm:text-sm font-bold">{(currentHero.rating || 0).toFixed(1)}</span>
                                    </div>
                                </motion.div>

                                {/* Title - Responsive */}
                                <motion.h1
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl font-black mb-4 sm:mb-6 leading-tight"
                                >
                                    <span className="bg-gradient-to-r from-white via-orange-200 to-red-200 bg-clip-text text-transparent drop-shadow-2xl">
                                        {currentHero.title}
                                    </span>
                                </motion.h1>

                                {/* Description - Responsive */}
                                <motion.p
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-300 mb-6 sm:mb-8 line-clamp-2 sm:line-clamp-3 max-w-2xl leading-relaxed"
                                >
                                    {currentHero.description}
                                </motion.p>

                                {/* Genres - Responsive */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                    className="flex flex-wrap gap-2 mb-6 sm:mb-8"
                                >
                                    {currentHero.genres.slice(0, 4).map((genre, index) => (
                                        <span
                                            key={index}
                                            className="px-2 sm:px-3 py-1 bg-black/40 backdrop-blur-sm text-orange-300 text-[10px] sm:text-xs font-semibold rounded-md border border-orange-500/30"
                                        >
                                            {genre.toUpperCase()}
                                        </span>
                                    ))}
                                </motion.div>

                                {/* Action Buttons - Responsive */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.6 }}
                                    className="flex items-center flex-wrap gap-2 sm:gap-4"
                                >
                                    <Link
                                        href={`/anime/${currentHero._id}?episode=1`}
                                        className="group flex items-center space-x-2 sm:space-x-3 px-5 sm:px-6 md:px-8 py-3 sm:py-3.5 md:py-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 active:from-orange-700 active:to-red-700 text-white rounded-lg sm:rounded-xl font-bold text-sm sm:text-base md:text-lg transition-all shadow-2xl shadow-orange-500/50 hover:shadow-orange-500/70 hover:scale-105 active:scale-95 touch-manipulation"
                                    >
                                        <Play className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 fill-white group-hover:scale-110 transition-transform" />
                                        <span>WATCH NOW</span>
                                    </Link>
                                    <button className="p-3 sm:p-4 bg-black/40 backdrop-blur-sm hover:bg-black/60 active:bg-black/70 border border-white/20 rounded-lg sm:rounded-xl transition-all hover:scale-105 active:scale-95 touch-manipulation">
                                        <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                    </button>
                                    <button className="p-3 sm:p-4 bg-black/40 backdrop-blur-sm hover:bg-black/60 active:bg-black/70 border border-white/20 rounded-lg sm:rounded-xl transition-all hover:scale-105 active:scale-95 touch-manipulation">
                                        <Bookmark className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                    </button>
                                    <button className="p-3 sm:p-4 bg-black/40 backdrop-blur-sm hover:bg-black/60 active:bg-black/70 border border-white/20 rounded-lg sm:rounded-xl transition-all hover:scale-105 active:scale-95 touch-manipulation">
                                        <Share2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
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
                    {heroList.length > 1 && (
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-2">
                            {heroList.slice(0, 5).map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setHeroIndex(index)}
                                    className={`h-2 rounded-full transition-all ${
                                        index === heroIndex
                                            ? 'w-8 bg-orange-500'
                                            : 'w-2 bg-white/30 hover:bg-white/50'
                                    }`}
                                />
                            ))}
                        </div>
                    )}
                </motion.div>
            )}

            {/* Content Sections - Responsive */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-3 space-y-8 sm:space-y-12 md:space-y-16">
                {/* Trending Now - Crunchyroll Style */}
                {trendingAnime.length > 0 && (
                    <motion.section
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mb-16"
                    >
                        <div className="flex items-center justify-between mb-4 sm:mb-6 md:mb-8 flex-wrap gap-3 sm:gap-0">
                            <div className="flex items-center space-x-2 sm:space-x-3">
                                <div className="w-1 h-6 sm:h-8 bg-gradient-to-b from-orange-500 to-red-500 rounded-full" />
                                <div>
                                    <div className="flex items-center space-x-1 sm:space-x-2 mb-0.5 sm:mb-1">
                                        <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-orange-400" />
                                        <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white">TRENDING NOW</h2>
                                    </div>
                                    <p className="text-xs sm:text-sm text-gray-400 hidden sm:block">Most watched this week</p>
                                </div>
                            </div>
                            <Link
                                href="/anime/browse"
                                className="flex items-center space-x-1 sm:space-x-2 text-orange-400 hover:text-orange-300 active:text-orange-200 transition-colors font-semibold text-xs sm:text-sm group touch-manipulation"
                            >
                                <span>VIEW ALL</span>
                                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                        <AnimeCarousel anime={trendingAnime} />
                    </motion.section>
                )}

                {/* Continue Watching */}
                <ContinueWatching limit={12} />

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
                                href="/anime/browse"
                                className="flex items-center space-x-2 text-orange-400 hover:text-orange-300 transition-colors font-semibold group"
                            >
                                <span>VIEW ALL</span>
                                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                        <AnimeCarousel anime={popularAnime} />
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
                                href="/anime/browse"
                                className="flex items-center space-x-2 text-orange-400 hover:text-orange-300 transition-colors font-semibold group"
                            >
                                <span>VIEW ALL</span>
                                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                        <AnimeCarousel anime={recentAnime} />
                    </motion.section>
                )}

                {/* Latest Episodes */}
                {latestEpisodes.length > 0 && (
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
                                        <h2 className="text-3xl font-black text-white">LATEST EPISODES</h2>
                                    </div>
                                    <p className="text-sm text-gray-400">Newly released episodes</p>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                            {latestEpisodes.slice(0, 12).map((episode) => (
                                <Link
                                    key={episode._id}
                                    href={`/anime/${episode.seriesId}?episode=${episode.episodeNumber}`}
                                    className="group relative aspect-video rounded-lg overflow-hidden bg-gray-900 border border-orange-500/20 hover:border-orange-500/50 transition-all"
                                >
                                    <Image
                                        src={episode.thumbnail || episode.seriesCoverImage || '/placeholder.jpg'}
                                        alt={episode.title}
                                        fill
                                        className="object-cover group-hover:scale-110 transition-transform"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                                    <div className="absolute bottom-0 left-0 right-0 p-3">
                                        <p className="text-white text-sm font-semibold line-clamp-1">{episode.seriesTitle}</p>
                                        <p className="text-orange-400 text-xs">Ep {episode.episodeNumber}</p>
                                    </div>
                                    <div className="absolute top-2 right-2 bg-black/80 px-2 py-1 rounded text-xs text-white">
                                        {Math.floor(episode.duration / 60)} min
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </motion.section>
                )}

                {/* Estimated Schedule */}
                {Object.keys(schedule).length > 0 && (
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
                                        <Calendar className="w-6 h-6 text-orange-400" />
                                        <h2 className="text-3xl font-black text-white">ESTIMATED SCHEDULE</h2>
                                    </div>
                                    <p className="text-sm text-gray-400">Anime airing times</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-black/40 backdrop-blur-sm border border-orange-500/20 rounded-xl p-6">
                            {/* Day Selector */}
                            <div className="flex items-center space-x-2 mb-6 overflow-x-auto pb-2">
                                {Object.keys(schedule).map((day) => (
                                    <button
                                        key={day}
                                        onClick={() => setSelectedScheduleDay(day)}
                                        className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all ${
                                            selectedScheduleDay === day
                                                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                                                : 'bg-gray-800 text-gray-400 hover:text-orange-400'
                                        }`}
                                    >
                                        {day}
                                    </button>
                                ))}
                            </div>
                            {/* Schedule List */}
                            <div className="space-y-3">
                                {schedule[selectedScheduleDay]?.slice(0, 10).map((anime: any, index: number) => (
                                    <Link
                                        key={anime._id || index}
                                        href={`/anime/${anime._id}`}
                                        className="flex items-center space-x-4 p-3 rounded-lg bg-gray-900/50 hover:bg-gray-900 transition-colors group"
                                    >
                                        <span className="text-orange-400 font-mono text-sm min-w-[60px]">{anime.airTime || 'TBA'}</span>
                                        <div className="flex-1">
                                            <p className="text-white font-semibold group-hover:text-orange-400 transition-colors">{anime.title}</p>
                                            <p className="text-gray-400 text-xs">► {anime.status || 'Ongoing'}</p>
                                        </div>
                                    </Link>
                                ))}
                                {(!schedule[selectedScheduleDay] || schedule[selectedScheduleDay].length === 0) && (
                                    <p className="text-gray-400 text-center py-8">No scheduled anime for this day</p>
                                )}
                            </div>
                        </div>
                    </motion.section>
                )}

                {/* Top Airing, Most Favourite, Latest Completed - Grid Layout - Responsive */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 mb-12 sm:mb-16">
                    {/* Top Airing */}
                    {topAiring.length > 0 && (
                        <motion.section
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            <div className="flex items-center space-x-2 mb-6">
                                <Tv className="w-5 h-5 text-orange-400" />
                                <h3 className="text-xl font-black text-white">TOP AIRING</h3>
                            </div>
                            <div className="space-y-3">
                                {topAiring.slice(0, 5).map((anime, index) => (
                                    <Link
                                        key={anime._id}
                                        href={`/anime/${anime._id}`}
                                        className="flex items-center space-x-3 p-2 rounded-lg bg-gray-900/50 hover:bg-gray-900 transition-colors group"
                                    >
                                        <span className="text-orange-400 font-bold text-lg min-w-[30px]">#{index + 1}</span>
                                        <Image
                                            src={anime.coverImage}
                                            alt={anime.title}
                                            width={60}
                                            height={80}
                                            className="rounded object-cover"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white text-sm font-semibold truncate group-hover:text-orange-400 transition-colors">{anime.title}</p>
                                            <p className="text-gray-400 text-xs">{anime.episodeCount} eps</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </motion.section>
                    )}

                    {/* Most Favourite */}
                    {mostFavourite.length > 0 && (
                        <motion.section
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            <div className="flex items-center space-x-2 mb-6">
                                <Heart className="w-5 h-5 text-pink-400 fill-pink-400" />
                                <h3 className="text-xl font-black text-white">MOST FAVOURITE</h3>
                            </div>
                            <div className="space-y-3">
                                {mostFavourite.slice(0, 5).map((anime, index) => (
                                    <Link
                                        key={anime._id}
                                        href={`/anime/${anime._id}`}
                                        className="flex items-center space-x-3 p-2 rounded-lg bg-gray-900/50 hover:bg-gray-900 transition-colors group"
                                    >
                                        <span className="text-pink-400 font-bold text-lg min-w-[30px]">#{index + 1}</span>
                                        <Image
                                            src={anime.coverImage}
                                            alt={anime.title}
                                            width={60}
                                            height={80}
                                            className="rounded object-cover"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white text-sm font-semibold truncate group-hover:text-pink-400 transition-colors">{anime.title}</p>
                                            <p className="text-gray-400 text-xs">{anime.episodeCount} eps</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </motion.section>
                    )}

                    {/* Latest Completed */}
                    {latestCompleted.length > 0 && (
                        <motion.section
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            <div className="flex items-center space-x-2 mb-6">
                                <Award className="w-5 h-5 text-yellow-400" />
                                <h3 className="text-xl font-black text-white">LATEST COMPLETED</h3>
                            </div>
                            <div className="space-y-3">
                                {latestCompleted.slice(0, 5).map((anime, index) => (
                                    <Link
                                        key={anime._id}
                                        href={`/anime/${anime._id}`}
                                        className="flex items-center space-x-3 p-2 rounded-lg bg-gray-900/50 hover:bg-gray-900 transition-colors group"
                                    >
                                        <span className="text-yellow-400 font-bold text-lg min-w-[30px]">#{index + 1}</span>
                                        <Image
                                            src={anime.coverImage}
                                            alt={anime.title}
                                            width={60}
                                            height={80}
                                            className="rounded object-cover"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white text-sm font-semibold truncate group-hover:text-yellow-400 transition-colors">{anime.title}</p>
                                            <p className="text-gray-400 text-xs">{anime.episodeCount} eps</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </motion.section>
                    )}
                </div>

                {/* Genres Quick Access */}
                <motion.section
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-16"
                >
                    <div className="flex items-center space-x-3 mb-6">
                        <div className="w-1 h-8 bg-gradient-to-b from-orange-500 to-red-500 rounded-full" />
                        <h2 className="text-2xl font-black text-white">BROWSE BY GENRE</h2>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural', 'Mystery', 'Thriller', 'Isekai'].map((genre) => (
                            <Link
                                key={genre}
                                href={`/anime/genres?genre=${genre.toLowerCase()}`}
                                className="px-4 py-2 bg-gray-900/50 hover:bg-gradient-to-r hover:from-orange-500 hover:to-red-500 text-gray-300 hover:text-white rounded-lg font-semibold text-sm transition-all border border-orange-500/20 hover:border-orange-500"
                            >
                                {genre}
                            </Link>
                        ))}
                    </div>
                </motion.section>

                {/* Share Section */}
                <motion.section
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-16"
                >
                    <div className="bg-gradient-to-r from-orange-900/30 via-red-900/30 to-pink-900/30 border border-orange-500/30 rounded-xl p-8 text-center">
                        <Share className="w-12 h-12 text-orange-400 mx-auto mb-4" />
                        <h3 className="text-2xl font-black text-white mb-2">Share ANIMESTREAM</h3>
                        <p className="text-gray-400 mb-6">Help us grow by sharing with your friends!</p>
                        <div className="flex items-center justify-center space-x-4">
                            <button
                                onClick={() => {
                                    if (navigator.share) {
                                        navigator.share({
                                            title: 'ANIMESTREAM - Premium Anime Hub',
                                            text: 'Check out this amazing anime streaming platform!',
                                            url: window.location.origin + '/anime',
                                        });
                                    } else {
                                        navigator.clipboard.writeText(window.location.origin + '/anime');
                                        alert('Link copied to clipboard!');
                                    }
                                }}
                                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg font-bold transition-all shadow-lg shadow-orange-500/50"
                            >
                                Share Now
                            </button>
                        </div>
                    </div>
                </motion.section>
                    </div>

                    {/* Sidebar - Top 10 */}
                    <div className="lg:col-span-1">
                        {top10.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, x: 40 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className="sticky top-24"
                            >
                                <div className="bg-black/40 backdrop-blur-sm border border-orange-500/20 rounded-xl p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center space-x-2">
                                            <Award className="w-5 h-5 text-orange-400" />
                                            <h3 className="text-xl font-black text-white">TOP 10</h3>
                                        </div>
                                        <div className="flex items-center space-x-1 bg-gray-900 rounded-lg p-1">
                                            {(['today', 'week', 'month'] as const).map((period) => (
                                                <button
                                                    key={period}
                                                    onClick={() => setTop10Period(period)}
                                                    className={`px-2 py-1 text-xs font-semibold rounded transition-all ${
                                                        top10Period === period
                                                            ? 'bg-orange-500 text-white'
                                                            : 'text-gray-400 hover:text-orange-400'
                                                    }`}
                                                >
                                                    {period.charAt(0).toUpperCase() + period.slice(1)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        {top10.map((anime, index) => (
                                            <Link
                                                key={anime._id}
                                                href={`/anime/${anime._id}`}
                                                className="flex items-center space-x-3 p-2 rounded-lg bg-gray-900/50 hover:bg-gray-900 transition-colors group"
                                            >
                                                <span className={`font-black text-lg min-w-[30px] ${
                                                    index === 0 ? 'text-yellow-400' :
                                                    index === 1 ? 'text-gray-300' :
                                                    index === 2 ? 'text-orange-600' :
                                                    'text-gray-500'
                                                }`}>
                                                    #{index + 1}
                                                </span>
                                                <Image
                                                    src={anime.coverImage}
                                                    alt={anime.title}
                                                    width={50}
                                                    height={70}
                                                    className="rounded object-cover"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white text-sm font-semibold truncate group-hover:text-orange-400 transition-colors">{anime.title}</p>
                                                    <div className="flex items-center space-x-2 mt-1">
                                                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                                        <span className="text-gray-400 text-xs">{(anime.rating || 0).toFixed(1)}</span>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>

            {/* Floating Action Button - Mode Switcher - Responsive */}
            <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 md:bottom-8 md:right-8 z-50"
            >
                <div className="bg-black/80 backdrop-blur-xl border border-orange-500/30 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-2xl">
                    <AppModeSwitcher />
                </div>
            </motion.div>
        </div>
    );
}

