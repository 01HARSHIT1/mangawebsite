'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { FaPlay, FaBookOpen, FaStar, FaClock, FaUsers, FaArrowRight, FaFire, FaGem, FaRocket } from 'react-icons/fa';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import TrendingMangaAsync from '@/components/TrendingMangaAsync';
import FeaturedCarouselAsync from '@/components/FeaturedCarouselAsync';
import ContinueReading from '@/components/ContinueReading';
import RecentlyUpdated from '@/components/RecentlyUpdated';
import AIRecommendations from '@/components/AIRecommendations';
import ActivityFeed from '@/components/ActivityFeed';

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

export default function ModernHomePage() {
    const { user, isAuthenticated } = useAuth();
    const [mounted, setMounted] = useState(false);

    const heroRef = useRef(null);
    const statsRef = useRef(null);
    const genresRef = useRef(null);

    const heroInView = useInView(heroRef, { once: true });
    const statsInView = useInView(statsRef, { once: true });
    const genresInView = useInView(genresRef, { once: true });

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <motion.div
                        animate={{
                            scale: [1, 1.2, 1],
                            rotate: [0, 180, 360]
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-2xl"
                    >
                        <FaBookOpen className="text-white text-3xl" />
                    </motion.div>
                    <h2 className="text-2xl font-bold text-white mb-2">Loading MangaReader</h2>
                    <p className="text-gray-400">Preparing your manga experience...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Hero Section */}
            <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
                {/* Background Effects */}
                <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-purple-900/20 to-pink-900/20"></div>
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
                    <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
                </div>

                <div className="container-fluid relative z-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                        transition={{ duration: 0.8 }}
                        className="max-w-4xl mx-auto"
                    >
                        {/* Badge */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={heroInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="inline-flex items-center space-x-2 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-full px-6 py-3 mb-8"
                        >
                            <FaRocket className="text-indigo-400" />
                            <span className="text-sm font-semibold text-indigo-300">The Future of Manga Reading</span>
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        </motion.div>

                        {/* Main Headline */}
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                            className="text-5xl md:text-7xl font-black mb-6 leading-tight"
                        >
                            <span className="text-gradient bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent">
                                Discover Amazing
                            </span>
                            <br />
                            <span className="text-gradient bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                                Manga Stories
                            </span>
                        </motion.h1>

                        {/* Subtitle */}
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                            transition={{ duration: 0.8, delay: 0.4 }}
                            className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed"
                        >
                            Join millions of readers in the world's most advanced manga platform.
                            Read, create, and connect with AI-powered recommendations and real-time features.
                        </motion.p>

                        {/* CTA Buttons */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                            transition={{ duration: 0.8, delay: 0.5 }}
                            className="flex flex-col sm:flex-row items-center justify-center gap-6"
                        >
                            <Link href="/manga" className="btn btn-primary btn-lg group">
                                <FaPlay className="group-hover:translate-x-1 transition-transform" />
                                Start Reading Now
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity blur-xl"></div>
                            </Link>

                            {!isAuthenticated && (
                                <Link href="/signup" className="btn btn-secondary btn-lg group">
                                    <FaUsers className="group-hover:scale-110 transition-transform" />
                                    Join Community
                                    <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                                </Link>
                            )}

                            {isAuthenticated && (
                                <Link href="/library" className="btn btn-secondary btn-lg group">
                                    <FaBookOpen className="group-hover:scale-110 transition-transform" />
                                    My Library
                                    <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                                </Link>
                            )}
                        </motion.div>

                        {/* Quick Stats */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                            transition={{ duration: 0.8, delay: 0.6 }}
                            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8"
                        >
                            {stats.map((stat, index) => (
                                <div key={stat.label} className="text-center">
                                    <div className={`text-3xl font-bold ${stat.color} mb-2`}>
                                        {stat.value}
                                    </div>
                                    <div className="text-sm text-gray-400 flex items-center justify-center space-x-2">
                                        <stat.icon className={stat.color} />
                                        <span>{stat.label}</span>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    </motion.div>
                </div>

                {/* Scroll Indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
                >
                    <div className="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center">
                        <div className="w-1 h-3 bg-gray-400 rounded-full mt-2 animate-bounce"></div>
                    </div>
                </motion.div>
            </section>

            {/* Featured Carousel */}
            <section className="section-padding">
                <div className="container-fluid">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-4xl font-bold mb-4">
                            <span className="text-gradient">🌟 Featured Stories</span>
                        </h2>
                        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                            Handpicked by our editorial team - the best manga you shouldn't miss
                        </p>
                    </motion.div>
                    <FeaturedCarouselAsync />
                </div>
            </section>

            {/* Continue Reading - For Authenticated Users */}
            {isAuthenticated && (
                <section className="section-padding bg-gradient-to-r from-slate-800/50 to-slate-700/50">
                    <div className="container-fluid">
                        <ContinueReading limit={6} variant="horizontal" />
                    </div>
                </section>
            )}

            {/* Trending Section */}
            <section className="section-padding">
                <div className="container-fluid">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-4xl font-bold mb-4">
                            <span className="text-gradient">🔥 Trending Now</span>
                        </h2>
                        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                            The hottest manga everyone's reading right now
                        </p>
                    </motion.div>
                    <TrendingMangaAsync sort="trending" />
                </div>
            </section>

            {/* Recently Updated */}
            <section className="section-padding bg-gradient-to-r from-slate-800/30 to-slate-700/30">
                <div className="container-fluid">
                    <RecentlyUpdated limit={12} variant="grid" />
                </div>
            </section>

            {/* AI Recommendations */}
            <section className="section-padding">
                <div className="container-fluid">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-4xl font-bold mb-4">
                            <span className="text-gradient">🤖 AI Recommendations</span>
                        </h2>
                        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                            Personalized suggestions powered by advanced machine learning
                        </p>
                    </motion.div>
                    <AIRecommendations limit={6} variant="carousel" />
                </div>
            </section>

            {/* Genres Section */}
            <section ref={genresRef} className="section-padding bg-gradient-to-r from-slate-800/50 to-slate-700/50">
                <div className="container-fluid">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={genresInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-4xl font-bold mb-4">
                            <span className="text-gradient">🎭 Explore Genres</span>
                        </h2>
                        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                            Find your perfect manga across diverse genres and themes
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {genresList.map((genre, index) => (
                            <motion.div
                                key={genre.name}
                                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                animate={genresInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 20, scale: 0.9 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                whileHover={{ scale: 1.05, y: -5 }}
                                className="group"
                            >
                                <Link
                                    href={`/genres?filter=${genre.name.toLowerCase()}`}
                                    className={`card hover-lift block p-6 text-center bg-gradient-to-br ${genre.color} relative overflow-hidden`}
                                >
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                                    <div className="relative z-10">
                                        <div className="text-4xl mb-3">{genre.icon}</div>
                                        <h3 className="text-white font-bold text-lg mb-2">{genre.name}</h3>
                                        <div className="text-white/80 text-sm flex items-center justify-center space-x-1">
                                            <span>Explore</span>
                                            <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Community Activity */}
            <section className="section-padding">
                <div className="container-fluid">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-4xl font-bold mb-4">
                            <span className="text-gradient">🌟 Community Activity</span>
                        </h2>
                        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                            See what the manga community is up to - new uploads, ratings, and discussions
                        </p>
                    </motion.div>

                    <div className="max-w-4xl mx-auto">
                        <ActivityFeed feedType="global" limit={10} />
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="section-padding bg-gradient-to-r from-indigo-900/50 via-purple-900/50 to-pink-900/50">
                <div className="container-fluid text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                        className="max-w-3xl mx-auto"
                    >
                        <h2 className="text-4xl md:text-5xl font-bold mb-6">
                            <span className="text-gradient">Ready to Start Your Journey?</span>
                        </h2>
                        <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                            Join millions of readers and creators in the most advanced manga platform.
                            Your next favorite story is waiting.
                        </p>

                        {!isAuthenticated ? (
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                                <Link href="/signup" className="btn btn-primary btn-lg group">
                                    <FaRocket className="group-hover:scale-110 transition-transform" />
                                    Get Started Free
                                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity blur-xl"></div>
                                </Link>
                                <Link href="/manga" className="btn btn-secondary btn-lg group">
                                    <FaBookOpen className="group-hover:scale-110 transition-transform" />
                                    Browse Library
                                </Link>
                            </div>
                        ) : (
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                                <Link href="/upload" className="btn btn-primary btn-lg group">
                                    <FaRocket className="group-hover:scale-110 transition-transform" />
                                    Create Your Manga
                                </Link>
                                <Link href="/library" className="btn btn-secondary btn-lg group">
                                    <FaBookOpen className="group-hover:scale-110 transition-transform" />
                                    Your Library
                                </Link>
                            </div>
                        )}
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="section-padding bg-slate-900 border-t border-slate-700">
                <div className="container-fluid">
                    <div className="text-center">
                        <div className="mb-8">
                            <Link href="/" className="inline-flex items-center space-x-3 group">
                                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                                    <span className="text-white font-bold text-xl">M</span>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gradient">MangaReader</h3>
                                    <p className="text-sm text-gray-400">Professional Platform</p>
                                </div>
                            </Link>
                        </div>

                        <div className="flex flex-wrap gap-8 justify-center text-sm mb-8">
                            <Link href="/about" className="nav-link">About</Link>
                            <Link href="/contact" className="nav-link">Contact</Link>
                            <Link href="/terms" className="nav-link">Terms</Link>
                            <Link href="/privacy" className="nav-link">Privacy</Link>
                            <Link href="/refund" className="nav-link">Refund Policy</Link>
                            <Link href="/shipping" className="nav-link">Shipping Policy</Link>
                            <Link href="/help" className="nav-link">Help</Link>
                            <Link href="/pricing" className="nav-link">Pricing</Link>
                        </div>

                        <div className="border-t border-slate-700 pt-8">
                            <p className="text-gray-400">
                                © 2024 MangaReader. All rights reserved. Built with ❤️ for manga lovers worldwide.
                            </p>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
