'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
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

function MangaBrowseContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [manga, setManga] = useState<Manga[]>([]);
    const [displayedManga, setDisplayedManga] = useState<Manga[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGenre, setSelectedGenre] = useState('all');
    const [sortBy, setSortBy] = useState('popular');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [itemsPerPage, setItemsPerPage] = useState(6);
    const [showAll, setShowAll] = useState(false);

    const genres = ['all', 'action', 'romance', 'fantasy', 'comedy', 'drama', 'horror', 'sci-fi', 'slice of life'];
    const sortOptions = [
        { value: 'popular', label: 'Most Popular' },
        { value: 'rating', label: 'Highest Rated' },
        { value: 'newest', label: 'Newest' },
        { value: 'alphabetical', label: 'A-Z' }
    ];

    // Initialize filters from URL parameters
    useEffect(() => {
        const genreParam = searchParams.get('genre');
        const searchParam = searchParams.get('search');
        const sortParam = searchParams.get('sort');

        if (genreParam) {
            setSelectedGenre(genreParam.toLowerCase());
        }
        if (searchParam) {
            setSearchQuery(searchParam);
        }
        if (sortParam && sortOptions.some(opt => opt.value === sortParam)) {
            setSortBy(sortParam);
        }
    }, [searchParams]);

    // Fetch manga from API with server-side filtering
    useEffect(() => {
        const fetchManga = async () => {
            setLoading(true);
            try {
                // Build API URL with query parameters for server-side filtering
                const params = new URLSearchParams();

                if (selectedGenre !== 'all') {
                    params.append('genre', selectedGenre);
                }
                if (searchQuery) {
                    params.append('search', searchQuery);
                }
                if (sortBy) {
                    params.append('sort', sortBy);
                }

                const apiUrl = `/api/manga${params.toString() ? '?' + params.toString() : ''}`;
                console.log('Fetching manga with filters:', apiUrl);

                const response = await fetch(apiUrl);
                if (response.ok) {
                    const data = await response.json();
                    setManga(data.manga || []);
                } else {
                    setManga([]);
                }
            } catch (error) {
                console.error('Failed to fetch manga:', error);
                setManga([]);
            } finally {
                setLoading(false);
            }
        };

        fetchManga();
    }, [selectedGenre, searchQuery, sortBy]);

    // Update displayed manga based on pagination (no client-side filtering needed)
    useEffect(() => {
        if (showAll) {
            setDisplayedManga(manga);
        } else {
            setDisplayedManga(manga.slice(0, itemsPerPage));
        }
    }, [manga, itemsPerPage, showAll]);

    const handleLoadMore = () => {
        setItemsPerPage(prev => prev + 6);
    };

    const handleShowAll = () => {
        setShowAll(true);
    };

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
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-14 sm:pt-16">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">
                        <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                            📚 Browse Manga
                        </span>
                    </h1>
                    <p className="text-gray-400 text-base sm:text-lg md:text-xl max-w-2xl mx-auto px-4">
                        Discover thousands of amazing manga stories from talented creators worldwide
                    </p>
                </motion.div>

                {/* Search and Filters - Responsive */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-slate-800/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 border border-slate-700/50 backdrop-blur-sm"
                >
                    <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 items-stretch lg:items-center">
                        {/* Search - Responsive */}
                        <div className="relative flex-1 w-full">
                            <FaSearch className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm sm:text-base" />
                            <input
                                type="text"
                                placeholder="Search manga, creators, genres..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg sm:rounded-xl pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 text-white text-sm sm:text-base placeholder-gray-400 focus:outline-none focus:border-indigo-500/50 transition-all duration-300 touch-manipulation"
                            />
                        </div>

                        {/* Filters - Responsive */}
                        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-wrap">
                            <select
                                value={selectedGenre}
                                onChange={(e) => setSelectedGenre(e.target.value)}
                                className="bg-slate-700/50 border border-slate-600/50 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base focus:outline-none focus:border-indigo-500/50 transition-all duration-300 touch-manipulation flex-1 min-w-[140px]"
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
                    <span>Showing {manga.length} results</span>
                    <span>{manga.filter(m => m.isNew).length} new releases</span>
                </motion.div>

                {/* Manga Grid */}
                <AnimatePresence mode="wait">
                    {manga.length > 0 ? (
                        <>
                            <motion.div
                                key={viewMode}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                                className={`grid gap-6 mb-8 ${viewMode === 'grid'
                                    ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6'
                                    : 'grid-cols-1'
                                    }`}
                            >
                                {displayedManga.map((item, index) => (
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
                                                <div className={`relative overflow-hidden bg-gradient-to-br from-slate-700 to-slate-800 ${viewMode === 'list' ? 'w-24 h-32 flex-shrink-0' : 'aspect-[3/4]'
                                                    }`}>
                                                    {item.coverImage && (typeof item.coverImage === 'string' || item.coverImage?.secure_url) ? (
                                                        <Image
                                                            src={
                                                                typeof item.coverImage === 'string'
                                                                    ? item.coverImage
                                                                    : item.coverImage?.secure_url || ''
                                                            }
                                                            alt={item.title}
                                                            fill
                                                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                                                            sizes={viewMode === 'list' ? '96px' : '(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw'}
                                                            unoptimized={false}
                                                            onError={(e) => {
                                                                console.error('Failed to load image:', item.coverImage);
                                                                e.currentTarget.style.display = 'none';
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <div className="text-center p-4">
                                                                <div className="text-4xl mb-2">📚</div>
                                                                <div className="text-xs text-gray-400">No Cover</div>
                                                            </div>
                                                        </div>
                                                    )}

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

                            {/* Load More and Show All Buttons */}
                            {!showAll && displayedManga.length < manga.length && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex flex-col sm:flex-row items-center justify-center gap-4 py-8"
                                >
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleLoadMore}
                                        className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl flex items-center space-x-2"
                                    >
                                        <span>Load More</span>
                                        <span className="text-sm opacity-80">({manga.length - displayedManga.length} more)</span>
                                    </motion.button>

                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleShowAll}
                                        className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl flex items-center space-x-2"
                                    >
                                        <span>Show All</span>
                                        <span className="text-sm opacity-80">({manga.length} total)</span>
                                    </motion.button>
                                </motion.div>
                            )}

                            {/* Show All Active Message */}
                            {showAll && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-center py-8"
                                >
                                    <div className="inline-flex items-center space-x-2 px-6 py-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-300">
                                        <span className="text-2xl">✅</span>
                                        <span className="font-semibold">Showing all {manga.length} manga</span>
                                    </div>
                                </motion.div>
                            )}
                        </>
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

// Wrapper component with Suspense boundary
export default function ModernMangaPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-16">
                <div className="container mx-auto px-4 py-16">
                    <div className="text-center mb-12">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-2xl animate-pulse">
                            <FaBookmark className="text-white text-2xl" />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-4">Loading Manga Library</h2>
                        <p className="text-gray-400">Discovering amazing stories for you...</p>
                    </div>
                </div>
            </div>
        }>
            <MangaBrowseContent />
        </Suspense>
    );
}
