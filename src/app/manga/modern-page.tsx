'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch, FaFilter, FaTh, FaList, FaStar, FaEye, FaBookmark, FaPlay, FaFire, FaHeart, FaClock } from 'react-icons/fa';

interface Manga {
    _id: string;
    title: string;
    creator: string;
    description: string;
    genres: string[];
    status: string;
    coverImage: string;
    views: number;
    likes: number;
    rating: number;
    createdAt: string;
    isNew?: boolean;
    isTrending?: boolean;
}

const sampleManga: Manga[] = [
    {
        _id: '1',
        title: 'Dragon Quest Chronicles',
        creator: 'Akira Toriyama',
        description: 'An epic fantasy adventure following a young hero on his quest to save the world.',
        genres: ['Fantasy', 'Adventure', 'Action'],
        status: 'ongoing',
        coverImage: '/placeholder.svg',
        views: 1250000,
        likes: 45000,
        rating: 4.8,
        createdAt: '2024-01-15',
        isNew: true
    },
    {
        _id: '2',
        title: 'Love in Tokyo',
        creator: 'Naoko Takeuchi',
        description: 'A heartwarming romance story set in modern Tokyo.',
        genres: ['Romance', 'Drama', 'Slice of Life'],
        status: 'ongoing',
        coverImage: '/placeholder.svg',
        views: 980000,
        likes: 38000,
        rating: 4.6,
        createdAt: '2024-02-01',
        isTrending: true
    },
    {
        _id: '3',
        title: 'Shadow Ninja',
        creator: 'Masashi Kishimoto',
        description: 'A thrilling tale of ninjas and supernatural powers.',
        genres: ['Action', 'Supernatural', 'Martial Arts'],
        status: 'completed',
        coverImage: '/placeholder.svg',
        views: 2100000,
        likes: 67000,
        rating: 4.9,
        createdAt: '2023-12-10',
        isNew: false
    },
    {
        _id: '4',
        title: 'Space Odyssey',
        creator: 'Hiromu Arakawa',
        description: 'Humanity\'s journey to explore the vast cosmos.',
        genres: ['Sci-Fi', 'Adventure', 'Drama'],
        status: 'ongoing',
        coverImage: '/placeholder.svg',
        views: 750000,
        likes: 28000,
        rating: 4.4,
        createdAt: '2024-03-01',
        isNew: true
    },
    {
        _id: '5',
        title: 'Comedy Central',
        creator: 'Rumiko Takahashi',
        description: 'Hilarious daily life adventures of high school students.',
        genres: ['Comedy', 'School', 'Slice of Life'],
        status: 'ongoing',
        coverImage: '/placeholder.svg',
        views: 560000,
        likes: 22000,
        rating: 4.3,
        createdAt: '2024-02-15',
        isTrending: true
    },
    {
        _id: '6',
        title: 'Horror Nights',
        creator: 'Junji Ito',
        description: 'Spine-chilling horror stories that will keep you awake.',
        genres: ['Horror', 'Supernatural', 'Thriller'],
        status: 'completed',
        coverImage: '/placeholder.svg',
        views: 890000,
        likes: 35000,
        rating: 4.7,
        createdAt: '2023-10-31',
        isNew: false
    }
];

export default function ModernMangaPage() {
    const [manga, setManga] = useState<Manga[]>([]);
    const [filteredManga, setFilteredManga] = useState<Manga[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGenre, setSelectedGenre] = useState('all');
    const [sortBy, setSortBy] = useState('popular');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const genres = ['all', 'action', 'romance', 'fantasy', 'comedy', 'drama', 'horror', 'sci-fi', 'slice of life'];
    const sortOptions = [
        { value: 'popular', label: 'Most Popular' },
        { value: 'rating', label: 'Highest Rated' },
        { value: 'newest', label: 'Newest' },
        { value: 'alphabetical', label: 'A-Z' }
    ];

    useEffect(() => {
        // Simulate loading from API
        setTimeout(() => {
            setManga(sampleManga);
            setFilteredManga(sampleManga);
            setLoading(false);
        }, 1000);
    }, []);

    useEffect(() => {
        let filtered = [...manga];

        // Apply search filter
        if (searchQuery) {
            filtered = filtered.filter(item =>
                item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.creator.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.genres.some(genre => genre.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }

        // Apply genre filter
        if (selectedGenre !== 'all') {
            filtered = filtered.filter(item =>
                item.genres.some(genre => genre.toLowerCase() === selectedGenre)
            );
        }

        // Apply sorting
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'alphabetical':
                    return a.title.localeCompare(b.title);
                case 'rating':
                    return b.rating - a.rating;
                case 'newest':
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                case 'popular':
                default:
                    return b.views - a.views;
            }
        });

        setFilteredManga(filtered);
    }, [manga, searchQuery, selectedGenre, sortBy]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-16">
                <div className="container mx-auto px-4 py-16">
                    <div className="text-center mb-12">
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
                            className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-2xl"
                        >
                            <FaBookmark className="text-white text-2xl" />
                        </motion.div>
                        <h2 className="text-3xl font-bold text-white mb-4">Loading Manga Library</h2>
                        <p className="text-gray-400">Discovering amazing stories for you...</p>
                    </div>

                    {/* Loading Skeleton */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                        {[...Array(12)].map((_, i) => (
                            <div key={i} className="animate-pulse">
                                <div className="aspect-[3/4] bg-slate-700 rounded-xl mb-4" />
                                <div className="space-y-2">
                                    <div className="h-4 bg-slate-700 rounded w-3/4" />
                                    <div className="h-3 bg-slate-800 rounded w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-16">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <h1 className="text-5xl font-bold mb-4">
                        <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                            📚 Browse Manga
                        </span>
                    </h1>
                    <p className="text-gray-400 text-xl max-w-2xl mx-auto">
                        Discover thousands of amazing manga stories from talented creators worldwide
                    </p>
                </motion.div>

                {/* Search and Filters */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-slate-800/50 rounded-2xl p-6 mb-8 border border-slate-700/50 backdrop-blur-sm"
                >
                    <div className="flex flex-col lg:flex-row gap-4 items-center">
                        {/* Search */}
                        <div className="relative flex-1">
                            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search manga, creators, genres..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500/50 transition-all duration-300"
                            />
                        </div>

                        {/* Filters */}
                        <div className="flex items-center space-x-4">
                            <select
                                value={selectedGenre}
                                onChange={(e) => setSelectedGenre(e.target.value)}
                                className="bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50 transition-all duration-300"
                            >
                                {genres.map(genre => (
                                    <option key={genre} value={genre} className="bg-slate-800">
                                        {genre === 'all' ? 'All Genres' : genre.charAt(0).toUpperCase() + genre.slice(1)}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50 transition-all duration-300"
                            >
                                {sortOptions.map(option => (
                                    <option key={option.value} value={option.value} className="bg-slate-800">
                                        {option.label}
                                    </option>
                                ))}
                            </select>

                            {/* View Toggle */}
                            <div className="flex bg-slate-700/50 rounded-xl p-1 border border-slate-600/50">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-3 rounded-lg transition-all duration-200 ${viewMode === 'grid'
                                        ? 'bg-indigo-600 text-white shadow-lg'
                                        : 'text-gray-400 hover:text-white hover:bg-slate-600/50'
                                        }`}
                                >
                                    <FaTh />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-3 rounded-lg transition-all duration-200 ${viewMode === 'list'
                                        ? 'bg-indigo-600 text-white shadow-lg'
                                        : 'text-gray-400 hover:text-white hover:bg-slate-600/50'
                                        }`}
                                >
                                    <FaList />
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Results Info */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center justify-between mb-8 text-gray-400"
                >
                    <span>Showing {filteredManga.length} results</span>
                    <span>{filteredManga.filter(m => m.isNew).length} new releases</span>
                </motion.div>

                {/* Manga Grid */}
                <AnimatePresence mode="wait">
                    {filteredManga.length > 0 ? (
                        <motion.div
                            key={viewMode}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className={`grid gap-6 ${viewMode === 'grid'
                                ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6'
                                : 'grid-cols-1'
                                }`}
                        >
                            {filteredManga.map((item, index) => (
                                <motion.div
                                    key={item._id}
                                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ duration: 0.5, delay: index * 0.05 }}
                                    whileHover={{ y: -8, scale: 1.02 }}
                                    className="group cursor-pointer"
                                >
                                    <Link href={`/manga/${item._id}`}>
                                        <div className={`bg-slate-800/50 rounded-2xl overflow-hidden border border-slate-700/50 hover:border-indigo-500/50 transition-all duration-300 backdrop-blur-sm hover:shadow-2xl hover:shadow-indigo-500/10 ${viewMode === 'list' ? 'flex space-x-4 p-4' : ''
                                            }`}>
                                            {/* Cover Image */}
                                            <div className={`relative overflow-hidden ${viewMode === 'list' ? 'w-24 h-32 flex-shrink-0' : 'aspect-[3/4]'
                                                }`}>
                                                <Image
                                                    src={item.coverImage}
                                                    alt={item.title}
                                                    fill
                                                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                                                    sizes={viewMode === 'list' ? '96px' : '(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw'}
                                                />

                                                {/* Overlay */}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                                {/* Status Badges */}
                                                {viewMode === 'grid' && (
                                                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                                                        {item.isNew && (
                                                            <motion.div
                                                                initial={{ scale: 0 }}
                                                                animate={{ scale: 1 }}
                                                                transition={{ delay: index * 0.1 }}
                                                                className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center space-x-1"
                                                            >
                                                                <span>🆕</span>
                                                                <span>NEW</span>
                                                            </motion.div>
                                                        )}
                                                        {item.isTrending && (
                                                            <motion.div
                                                                animate={{
                                                                    scale: [1, 1.1, 1]
                                                                }}
                                                                transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                                                                className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center space-x-1"
                                                            >
                                                                <FaFire />
                                                                <span>HOT</span>
                                                            </motion.div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Rating */}
                                                {viewMode === 'grid' && (
                                                    <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm rounded-full px-2 py-1 flex items-center space-x-1">
                                                        <FaStar className="text-yellow-400 text-xs" />
                                                        <span className="text-white text-xs font-semibold">{item.rating}</span>
                                                    </div>
                                                )}

                                                {/* Hover Actions */}
                                                {viewMode === 'grid' && (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.8 }}
                                                        animate={{
                                                            opacity: 0,
                                                            scale: 0.8
                                                        }}
                                                        whileHover={{
                                                            opacity: 1,
                                                            scale: 1
                                                        }}
                                                        className="absolute inset-0 flex items-center justify-center"
                                                    >
                                                        <div className="flex items-center space-x-2">
                                                            <motion.button
                                                                whileHover={{ scale: 1.1 }}
                                                                whileTap={{ scale: 0.9 }}
                                                                className="p-3 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg"
                                                            >
                                                                <FaHeart />
                                                            </motion.button>
                                                            <motion.button
                                                                whileHover={{ scale: 1.1 }}
                                                                whileTap={{ scale: 0.9 }}
                                                                className="p-4 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg"
                                                            >
                                                                <FaPlay />
                                                            </motion.button>
                                                            <motion.button
                                                                whileHover={{ scale: 1.1 }}
                                                                whileTap={{ scale: 0.9 }}
                                                                className="p-3 rounded-full bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg"
                                                            >
                                                                <FaBookmark />
                                                            </motion.button>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className={`${viewMode === 'list' ? 'flex-1' : 'p-4'}`}>
                                                <h3 className="text-white font-semibold text-lg mb-2 group-hover:text-indigo-400 transition-colors line-clamp-2">
                                                    {item.title}
                                                </h3>
                                                <p className="text-gray-400 text-sm mb-2">
                                                    by <span className="text-indigo-400 font-medium">{item.creator}</span>
                                                </p>

                                                {viewMode === 'list' && (
                                                    <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                                                        {item.description}
                                                    </p>
                                                )}

                                                {/* Genres */}
                                                <div className="flex flex-wrap gap-1 mb-3">
                                                    {item.genres.slice(0, viewMode === 'list' ? 4 : 2).map((genre) => (
                                                        <span
                                                            key={genre}
                                                            className="bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded-full text-xs font-medium border border-indigo-500/30"
                                                        >
                                                            {genre}
                                                        </span>
                                                    ))}
                                                </div>

                                                {/* Stats */}
                                                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="flex items-center space-x-1">
                                                            <FaEye />
                                                            <span>{item.views.toLocaleString()}</span>
                                                        </div>
                                                        <div className="flex items-center space-x-1">
                                                            <FaHeart />
                                                            <span>{item.likes.toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center space-x-1 text-indigo-400">
                                                        <FaStar />
                                                        <span>{item.rating}</span>
                                                    </div>
                                                </div>

                                                {/* Action Button */}
                                                <motion.button
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2"
                                                >
                                                    <FaPlay />
                                                    <span>Read Now</span>
                                                </motion.button>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-20"
                        >
                            <div className="text-6xl mb-6">📚</div>
                            <h3 className="text-2xl font-bold text-white mb-4">No manga found</h3>
                            <p className="text-gray-400 text-lg mb-8">
                                {searchQuery || selectedGenre !== 'all'
                                    ? 'Try adjusting your search or filters'
                                    : 'No manga available at the moment'
                                }
                            </p>
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setSelectedGenre('all');
                                }}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
                            >
                                Clear Filters
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
