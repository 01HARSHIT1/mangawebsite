'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { FaPlay, FaBookOpen, FaStar, FaClock, FaUsers, FaArrowRight, FaFire, FaGem, FaRocket, FaSearch, FaHeart, FaEye } from 'react-icons/fa';
import { motion } from 'framer-motion';
import Image from 'next/image';
import BuyMeACoffee from '@/components/BuyMeACoffee';

const genresList = [
    { name: "Action", color: "from-red-500 to-orange-500", icon: "⚔️" },
    { name: "Romance", color: "from-pink-500 to-rose-500", icon: "💕" },
    { name: "Fantasy", color: "from-purple-500 to-indigo-500", icon: "🔮" },
    { name: "Comedy", color: "from-yellow-500 to-orange-500", icon: "😂" },
    { name: "Drama", color: "from-blue-500 to-cyan-500", icon: "🎭" },
    { name: "Horror", color: "from-gray-700 to-gray-900", icon: "👻" },
    { name: "Sci-Fi", color: "from-cyan-500 to-blue-500", icon: "🚀" },
    { name: "Slice of Life", color: "from-green-500 to-emerald-500", icon: "🌱" }
];

const stats = [
    { label: "Active Readers", value: "2.5M+", icon: FaUsers, color: "text-blue-400" },
    { label: "Manga Series", value: "50K+", icon: FaBookOpen, color: "text-green-400" },
    { label: "Daily Updates", value: "1K+", icon: FaClock, color: "text-purple-400" },
    { label: "Creator Earnings", value: "$2M+", icon: FaGem, color: "text-yellow-400" }
];

// Sample featured manga for immediate display
const featuredManga = [
    {
        id: '1',
        title: 'Dragon Quest Chronicles',
        creator: 'Akira Toriyama',
        coverImage: '/placeholder.svg',
        rating: 4.8,
        views: 1250000,
        genres: ['Fantasy', 'Adventure'],
        isNew: true
    },
    {
        id: '2',
        title: 'Love in Tokyo',
        creator: 'Naoko Takeuchi',
        coverImage: '/placeholder.svg',
        rating: 4.6,
        views: 980000,
        genres: ['Romance', 'Drama'],
        isTrending: true
    },
    {
        id: '3',
        title: 'Shadow Ninja',
        creator: 'Masashi Kishimoto',
        coverImage: '/placeholder.svg',
        rating: 4.9,
        views: 2100000,
        genres: ['Action', 'Supernatural'],
        isNew: false
    }
];

export default function ImprovedHomePage() {
    const { user, isAuthenticated } = useAuth();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
                {/* Enhanced Background Effects */}
                <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/30 via-purple-900/30 to-pink-900/30"></div>

                    {/* Animated Background Orbs */}
                    <motion.div
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.3, 0.6, 0.3]
                        }}
                        transition={{ duration: 8, repeat: Infinity }}
                        className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"
                    />
                    <motion.div
                        animate={{
                            scale: [1.2, 1, 1.2],
                            opacity: [0.4, 0.7, 0.4]
                        }}
                        transition={{ duration: 6, repeat: Infinity, delay: 2 }}
                        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
                    />
                    <motion.div
                        animate={{
                            scale: [1, 1.3, 1],
                            opacity: [0.2, 0.5, 0.2]
                        }}
                        transition={{ duration: 10, repeat: Infinity, delay: 4 }}
                        className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"
                    />
                </div>

                <div className="container mx-auto px-4 relative z-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="max-w-4xl mx-auto"
                    >
                        {/* Enhanced Badge */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="inline-flex items-center space-x-2 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-full px-6 py-3 mb-8 backdrop-blur-sm"
                        >
                            <FaRocket className="text-indigo-400" />
                            <span className="text-sm font-semibold text-indigo-300">The Future of Manga Reading</span>
                            <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="w-2 h-2 bg-green-400 rounded-full"
                            />
                        </motion.div>

                        {/* Enhanced Headline with Better Typography */}
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                            className="text-6xl md:text-8xl font-black mb-6 leading-tight"
                        >
                            <motion.span
                                animate={{
                                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
                                }}
                                transition={{ duration: 5, repeat: Infinity }}
                                className="bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-[length:200%_100%] bg-clip-text text-transparent"
                            >
                                Discover Amazing
                            </motion.span>
                            <br />
                            <motion.span
                                animate={{
                                    backgroundPosition: ["100% 50%", "0% 50%", "100% 50%"]
                                }}
                                transition={{ duration: 5, repeat: Infinity, delay: 0.5 }}
                                className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-[length:200%_100%] bg-clip-text text-transparent"
                            >
                                Manga Stories
                            </motion.span>
                        </motion.h1>

                        {/* Enhanced Subtitle */}
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.4 }}
                            className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed"
                        >
                            Join <motion.span
                                animate={{ color: ['#60a5fa', '#a78bfa', '#f472b6', '#60a5fa'] }}
                                transition={{ duration: 3, repeat: Infinity }}
                                className="font-bold"
                            >
                                millions of readers
                            </motion.span> in the world's most advanced manga platform.
                            Read, create, and connect with AI-powered recommendations.
                        </motion.p>

                        {/* Enhanced CTA Buttons */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.5 }}
                            className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16"
                        >
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Link
                                    href="/manga"
                                    className="relative group bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-2xl transition-all duration-300 flex items-center space-x-3 overflow-hidden"
                                >
                                    <motion.div
                                        animate={{ x: [0, 5, 0] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    >
                                        <FaPlay />
                                    </motion.div>
                                    <span>Start Reading Now</span>
                                    <motion.div
                                        className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity blur-xl"
                                        animate={{ scale: [1, 1.1, 1] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    />
                                </Link>
                            </motion.div>

                            {!isAuthenticated ? (
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <Link
                                        href="/signup"
                                        className="group bg-slate-800/80 hover:bg-slate-700/80 border border-indigo-500/30 hover:border-indigo-500/60 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl transition-all duration-300 flex items-center space-x-3 backdrop-blur-sm"
                                    >
                                        <FaUsers />
                                        <span>Join Community</span>
                                        <motion.div
                                            animate={{ x: [0, 5, 0] }}
                                            transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                                        >
                                            <FaArrowRight />
                                        </motion.div>
                                    </Link>
                                </motion.div>
                            ) : (
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <Link
                                        href="/library"
                                        className="group bg-slate-800/80 hover:bg-slate-700/80 border border-green-500/30 hover:border-green-500/60 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl transition-all duration-300 flex items-center space-x-3 backdrop-blur-sm"
                                    >
                                        <FaBookOpen />
                                        <span>My Library</span>
                                        <motion.div
                                            animate={{ x: [0, 5, 0] }}
                                            transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                                        >
                                            <FaArrowRight />
                                        </motion.div>
                                    </Link>
                                </motion.div>
                            )}
                        </motion.div>

                        {/* Enhanced Quick Stats */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.6 }}
                            className="grid grid-cols-2 md:grid-cols-4 gap-8"
                        >
                            {stats.map((stat, index) => (
                                <motion.div
                                    key={stat.label}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.7 + index * 0.1, duration: 0.5 }}
                                    whileHover={{ scale: 1.05, y: -5 }}
                                    className="text-center p-6 bg-slate-800/30 rounded-2xl border border-slate-700/50 backdrop-blur-sm hover:bg-slate-800/50 transition-all duration-300"
                                >
                                    <motion.div
                                        animate={{
                                            scale: [1, 1.1, 1],
                                            rotate: [0, 5, -5, 0]
                                        }}
                                        transition={{ duration: 3, repeat: Infinity, delay: index * 0.5 }}
                                        className={`text-4xl font-bold ${stat.color} mb-2`}
                                    >
                                        {stat.value}
                                    </motion.div>
                                    <div className="text-sm text-gray-400 flex items-center justify-center space-x-2">
                                        <stat.icon className={stat.color} />
                                        <span>{stat.label}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </motion.div>
                </div>

                {/* Enhanced Scroll Indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                    className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
                >
                    <motion.div
                        animate={{ y: [0, 10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="flex flex-col items-center text-gray-400"
                    >
                        <span className="text-sm mb-2">Scroll to explore</span>
                        <div className="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center">
                            <motion.div
                                animate={{ y: [0, 16, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="w-1 h-3 bg-gray-400 rounded-full mt-2"
                            />
                        </div>
                    </motion.div>
                </motion.div>
            </section>

            {/* Quick Search Section */}
            <section className="py-16 px-4">
                <div className="container mx-auto max-w-4xl">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-4xl font-bold mb-4">
                            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                                🔍 Find Your Next Favorite
                            </span>
                        </h2>
                        <p className="text-gray-400 text-lg">
                            Search through thousands of manga titles instantly
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        viewport={{ once: true }}
                        className="relative"
                    >
                        <div className="relative">
                            <FaSearch className="absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
                            <input
                                type="text"
                                placeholder="Search for manga, creators, or genres..."
                                className="w-full bg-slate-800/50 border border-slate-600/50 rounded-2xl pl-16 pr-6 py-6 text-white text-lg placeholder-gray-400 focus:outline-none focus:border-indigo-500/50 focus:bg-slate-800/70 transition-all duration-300 backdrop-blur-sm"
                            />
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300"
                            >
                                Search
                            </motion.button>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Featured Manga Section */}
            <section className="py-16 px-4 bg-slate-800/20">
                <div className="container mx-auto max-w-7xl">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-4xl font-bold mb-4">
                            <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                                🌟 Featured Stories
                            </span>
                        </h2>
                        <p className="text-gray-400 text-lg">
                            Handpicked by our editorial team
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {featuredManga.map((manga, index) => (
                            <motion.div
                                key={manga.id}
                                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ duration: 0.6, delay: index * 0.2 }}
                                viewport={{ once: true }}
                                whileHover={{ y: -10, scale: 1.02 }}
                                className="group cursor-pointer"
                            >
                                <Link href={`/manga/${manga.id}`}>
                                    <div className="bg-slate-800/50 rounded-2xl overflow-hidden border border-slate-700/50 hover:border-indigo-500/50 transition-all duration-300 backdrop-blur-sm hover:shadow-2xl hover:shadow-indigo-500/10">
                                        {/* Cover Image */}
                                        <div className="aspect-[3/4] relative overflow-hidden">
                                            <Image
                                                src={manga.coverImage}
                                                alt={manga.title}
                                                fill
                                                className="object-cover group-hover:scale-110 transition-transform duration-500"
                                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                            />

                                            {/* Overlay with gradient */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                            {/* Status Badges */}
                                            <div className="absolute top-4 left-4 flex flex-col gap-2">
                                                {manga.isNew && (
                                                    <motion.div
                                                        initial={{ scale: 0, rotate: -180 }}
                                                        animate={{ scale: 1, rotate: 0 }}
                                                        transition={{ type: "spring", stiffness: 500, delay: 0.3 + index * 0.1 }}
                                                        className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1"
                                                    >
                                                        <span>🆕</span>
                                                        <span>NEW</span>
                                                    </motion.div>
                                                )}
                                                {manga.isTrending && (
                                                    <motion.div
                                                        animate={{
                                                            scale: [1, 1.1, 1],
                                                            rotate: [0, 5, -5, 0]
                                                        }}
                                                        transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
                                                        className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1"
                                                    >
                                                        <FaFire />
                                                        <span>HOT</span>
                                                    </motion.div>
                                                )}
                                            </div>

                                            {/* Rating Badge */}
                                            <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm rounded-full px-3 py-1 flex items-center space-x-1">
                                                <FaStar className="text-yellow-400 text-xs" />
                                                <span className="text-white text-xs font-semibold">{manga.rating}</span>
                                            </div>

                                            {/* Hover Play Button */}
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                whileInView={{ opacity: 1, scale: 1 }}
                                                transition={{ duration: 0.3 }}
                                                className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                            >
                                                <motion.div
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-6 shadow-2xl"
                                                >
                                                    <FaPlay className="text-2xl" />
                                                </motion.div>
                                            </motion.div>
                                        </div>

                                        {/* Content */}
                                        <div className="p-6">
                                            <h3 className="text-white font-bold text-xl mb-2 group-hover:text-indigo-400 transition-colors">
                                                {manga.title}
                                            </h3>
                                            <p className="text-gray-400 text-sm mb-4">
                                                by <span className="text-indigo-400 font-medium">{manga.creator}</span>
                                            </p>

                                            {/* Genres */}
                                            <div className="flex flex-wrap gap-2 mb-4">
                                                {manga.genres.map((genre) => (
                                                    <span
                                                        key={genre}
                                                        className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-xs font-medium border border-indigo-500/30"
                                                    >
                                                        {genre}
                                                    </span>
                                                ))}
                                            </div>

                                            {/* Stats */}
                                            <div className="flex items-center justify-between text-sm text-gray-500">
                                                <div className="flex items-center space-x-1">
                                                    <FaEye />
                                                    <span>{manga.views.toLocaleString()}</span>
                                                </div>
                                                <div className="flex items-center space-x-1">
                                                    <FaHeart className="text-red-400" />
                                                    <span>Like</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Buy Me a Coffee Section - Only for logged-in users */}
            {isAuthenticated && (
                <section className="py-16 px-4">
                    <div className="container mx-auto max-w-4xl">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            viewport={{ once: true }}
                            className="text-center"
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                                viewport={{ once: true }}
                                className="bg-gradient-to-br from-slate-800/50 via-slate-700/50 to-slate-800/50 rounded-3xl p-12 border border-slate-700/50 backdrop-blur-sm shadow-2xl"
                            >
                                <motion.div
                                    animate={{ 
                                        scale: [1, 1.05, 1],
                                        rotate: [0, 5, -5, 0]
                                    }}
                                    transition={{ duration: 4, repeat: Infinity }}
                                    className="text-7xl mb-6"
                                >
                                    ☕
                                </motion.div>
                                
                                <h2 className="text-4xl font-bold mb-4">
                                    <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400 bg-clip-text text-transparent">
                                        Enjoying Our Platform?
                                    </span>
                                </h2>
                                
                                <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
                                    Your support helps us keep the platform running, add new features, and support manga creators. 
                                    <span className="block mt-2 text-amber-400 font-semibold">Every contribution matters! 💖</span>
                                </p>

                                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
                                    <BuyMeACoffee />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 text-sm text-gray-400">
                                    <div className="flex items-center justify-center space-x-2">
                                        <span className="text-2xl">🚀</span>
                                        <span>Support Development</span>
                                    </div>
                                    <div className="flex items-center justify-center space-x-2">
                                        <span className="text-2xl">🎨</span>
                                        <span>Help Creators</span>
                                    </div>
                                    <div className="flex items-center justify-center space-x-2">
                                        <span className="text-2xl">⚡</span>
                                        <span>Keep it Free</span>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>
                </section>
            )}

            {/* Enhanced Genres Section */}
            <section className="py-16 px-4">
                <div className="container mx-auto max-w-7xl">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-4xl font-bold mb-4">
                            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                                🎭 Explore Genres
                            </span>
                        </h2>
                        <p className="text-gray-400 text-lg">
                            Find your perfect manga across diverse themes
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {genresList.map((genre, index) => (
                            <motion.div
                                key={genre.name}
                                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                viewport={{ once: true }}
                                whileHover={{ scale: 1.05, y: -5 }}
                                className="group"
                            >
                                <Link
                                    href={`/genres?filter=${genre.name.toLowerCase()}`}
                                    className={`block p-8 rounded-2xl bg-gradient-to-br ${genre.color} relative overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300`}
                                >
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                                    <div className="relative z-10 text-center">
                                        <motion.div
                                            animate={{
                                                scale: [1, 1.2, 1],
                                                rotate: [0, 10, -10, 0]
                                            }}
                                            transition={{ duration: 4, repeat: Infinity, delay: index * 0.2 }}
                                            className="text-5xl mb-4"
                                        >
                                            {genre.icon}
                                        </motion.div>
                                        <h3 className="text-white font-bold text-lg mb-2">{genre.name}</h3>
                                        <div className="text-white/80 text-sm flex items-center justify-center space-x-1">
                                            <span>Explore</span>
                                            <motion.div
                                                animate={{ x: [0, 5, 0] }}
                                                transition={{ duration: 2, repeat: Infinity, delay: index * 0.1 }}
                                            >
                                                <FaArrowRight />
                                            </motion.div>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Enhanced CTA Section */}
            <section className="py-20 px-4 bg-gradient-to-r from-indigo-900/50 via-purple-900/50 to-pink-900/50">
                <div className="container mx-auto max-w-4xl text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                    >
                        <motion.h2
                            animate={{
                                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
                            }}
                            transition={{ duration: 5, repeat: Infinity }}
                            className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-[length:200%_100%] bg-clip-text text-transparent"
                        >
                            Ready to Start Your Journey?
                        </motion.h2>
                        <p className="text-xl text-gray-300 mb-12 leading-relaxed max-w-3xl mx-auto">
                            Join millions of readers and creators in the most advanced manga platform.
                            Your next favorite story is just one click away.
                        </p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            viewport={{ once: true }}
                            className="flex flex-col sm:flex-row items-center justify-center gap-6"
                        >
                            {!isAuthenticated ? (
                                <>
                                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                        <Link
                                            href="/signup"
                                            className="relative group bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-10 py-5 rounded-2xl font-bold text-xl shadow-2xl transition-all duration-300 flex items-center space-x-3 overflow-hidden"
                                        >
                                            <FaRocket />
                                            <span>Get Started Free</span>
                                            <motion.div
                                                className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity blur-xl"
                                                animate={{ scale: [1, 1.1, 1] }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                            />
                                        </Link>
                                    </motion.div>
                                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                        <Link
                                            href="/manga"
                                            className="bg-slate-800/80 hover:bg-slate-700/80 border border-slate-600/50 hover:border-indigo-500/50 text-white px-10 py-5 rounded-2xl font-bold text-xl shadow-xl transition-all duration-300 flex items-center space-x-3 backdrop-blur-sm"
                                        >
                                            <FaBookOpen />
                                            <span>Browse Library</span>
                                        </Link>
                                    </motion.div>
                                </>
                            ) : (
                                <>
                                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                        <Link
                                            href="/upload"
                                            className="relative group bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-10 py-5 rounded-2xl font-bold text-xl shadow-2xl transition-all duration-300 flex items-center space-x-3"
                                        >
                                            <FaRocket />
                                            <span>Create Your Manga</span>
                                        </Link>
                                    </motion.div>
                                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                        <Link
                                            href="/library"
                                            className="bg-slate-800/80 hover:bg-slate-700/80 border border-slate-600/50 hover:border-green-500/50 text-white px-10 py-5 rounded-2xl font-bold text-xl shadow-xl transition-all duration-300 flex items-center space-x-3 backdrop-blur-sm"
                                        >
                                            <FaBookOpen />
                                            <span>Your Library</span>
                                        </Link>
                                    </motion.div>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-16 px-4 bg-slate-900 border-t border-slate-700">
                <div className="container mx-auto max-w-7xl text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                    >
                        <Link href="/" className="inline-flex items-center space-x-3 group mb-8">
                            <motion.div
                                whileHover={{ rotate: 360 }}
                                transition={{ duration: 0.5 }}
                                className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg"
                            >
                                <span className="text-white font-bold text-xl">M</span>
                            </motion.div>
                            <div className="text-left">
                                <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                                    MangaReader
                                </h3>
                                <p className="text-sm text-gray-400">Professional Platform</p>
                            </div>
                        </Link>

                        <div className="flex flex-wrap gap-8 justify-center text-sm mb-8">
                            {[
                                { href: '/about', label: 'About' },
                                { href: '/contact', label: 'Contact' },
                                { href: '/terms', label: 'Terms' },
                                { href: '/privacy', label: 'Privacy' },
                                { href: '/refund', label: 'Refund Policy' },
                                { href: '/shipping', label: 'Shipping Policy' },
                                { href: '/help', label: 'Help' },
                                { href: '/pricing', label: 'Pricing' }
                            ].map((link) => (
                                <motion.div key={link.href} whileHover={{ y: -2 }}>
                                    <Link
                                        href={link.href}
                                        className="text-gray-400 hover:text-indigo-400 transition-colors duration-300 font-medium"
                                    >
                                        {link.label}
                                    </Link>
                                </motion.div>
                            ))}
                        </div>

                        <div className="border-t border-slate-700 pt-8">
                            <p className="text-gray-400">
                                © 2024 MangaReader. All rights reserved. Built with ❤️ for manga lovers worldwide.
                            </p>
                        </div>
                    </motion.div>
                </div>
            </footer>
        </div>
    );
}





