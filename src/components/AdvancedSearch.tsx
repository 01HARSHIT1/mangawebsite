"use client";
import { useState, useEffect, useCallback, useMemo } from 'react';
import { FaSearch, FaFilter, FaSort, FaTimes, FaStar, FaEye, FaHeart, FaBookmark, FaSpinner, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import OptimizedImage from './OptimizedImage';

interface Manga {
    _id: string;
    title: string;
    description: string;
    coverImage: string;
    genres: string[];
    status: 'ongoing' | 'completed' | 'hiatus' | 'cancelled';
    rating: number;
    views: number;
    likes: number;
    chapters: number;
    author: string;
    year: number;
}

interface SearchFilters {
    query: string;
    genres: string[];
    status: string[];
    rating: number;
    yearFrom: number;
    yearTo: number;
    sortBy: 'relevance' | 'title' | 'rating' | 'views' | 'likes' | 'newest' | 'oldest';
    sortOrder: 'asc' | 'desc';
}

interface AdvancedSearchProps {
    onSearch?: (results: Manga[], filters: SearchFilters) => void;
    initialFilters?: Partial<SearchFilters>;
}

const GENRES = ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural', 'Thriller', 'Psychological', 'Historical', 'Martial Arts', 'Mecha', 'Music', 'School Life', 'Shoujo', 'Shounen', 'Seinen', 'Josei', 'Ecchi', 'Harem', 'Isekai', 'Yaoi', 'Yuri'];

const STATUS_OPTIONS = ['ongoing', 'completed', 'hiatus', 'cancelled'];

export default function AdvancedSearch({ onSearch, initialFilters }: AdvancedSearchProps) {
    const [filters, setFilters] = useState<SearchFilters>({
        query: '',
        genres: [],
        status: [],
        rating: 0,
        yearFrom: 1990,
        yearTo: new Date().getFullYear(),
        sortBy: 'relevance',
        sortOrder: 'desc',
        ...initialFilters
    });

    const [results, setResults] = useState<Manga[]>([]);
    const [loading, setLoading] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Debounced search function
    const debouncedSearch = useMemo(
        () => {
            let timeoutId: NodeJS.Timeout;
            return (searchFilters: SearchFilters) => {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    performSearch(searchFilters);
                }, 300);
            };
        },
        []
    );

    // Perform search
    const performSearch = useCallback(async (searchFilters: SearchFilters) => {
        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams();
            
            if (searchFilters.query) params.append('q', searchFilters.query);
            if (searchFilters.genres.length > 0) params.append('genres', searchFilters.genres.join(','));
            if (searchFilters.status.length > 0) params.append('status', searchFilters.status.join(','));
            if (searchFilters.rating > 0) params.append('rating', searchFilters.rating.toString());
            if (searchFilters.yearFrom > 1990) params.append('yearFrom', searchFilters.yearFrom.toString());
            if (searchFilters.yearTo < new Date().getFullYear()) params.append('yearTo', searchFilters.yearTo.toString());
            params.append('sortBy', searchFilters.sortBy);
            params.append('sortOrder', searchFilters.sortOrder);

            const res = await fetch(`/api/manga/search?${params.toString()}`);
            
            if (!res.ok) {
                throw new Error('Failed to search manga');
            }

            const data = await res.json();
            setResults(data.manga || []);
            if (onSearch) {
                onSearch(data.manga || [], searchFilters);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Search failed');
        } finally {
            setLoading(false);
        }
    }, [onSearch]);

    // Get search suggestions
    const getSuggestions = useCallback(async (query: string) => {
        if (query.length < 2) {
            setSuggestions([]);
            return;
        }

        try {
            const res = await fetch(`/api/manga/suggestions?q=${encodeURIComponent(query)}`);
            if (res.ok) {
                const data = await res.json();
                setSuggestions(data.suggestions || []);
            }
        } catch (err) {
            console.error('Failed to get suggestions:', err);
        }
    }, []);

    // Handle filter changes
    const handleFilterChange = useCallback((key: keyof SearchFilters, value: any) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        debouncedSearch(newFilters);
    }, [filters, debouncedSearch]);

    // Handle query change
    const handleQueryChange = useCallback((query: string) => {
        setFilters(prev => ({ ...prev, query }));
        setShowSuggestions(true);
        getSuggestions(query);
        debouncedSearch({ ...filters, query });
    }, [filters, debouncedSearch, getSuggestions]);

    // Handle suggestion selection
    const handleSuggestionSelect = useCallback((suggestion: string) => {
        setFilters(prev => ({ ...prev, query: suggestion }));
        setShowSuggestions(false);
        performSearch({ ...filters, query: suggestion });
    }, [filters, performSearch]);

    // Toggle genre filter
    const toggleGenre = useCallback((genre: string) => {
        const newGenres = filters.genres.includes(genre)
            ? filters.genres.filter(g => g !== genre)
            : [...filters.genres, genre];
        handleFilterChange('genres', newGenres);
    }, [filters.genres, handleFilterChange]);

    // Toggle status filter
    const toggleStatus = useCallback((status: string) => {
        const newStatus = filters.status.includes(status)
            ? filters.status.filter(s => s !== status)
            : [...filters.status, status];
        handleFilterChange('status', newStatus);
    }, [filters.status, handleFilterChange]);

    // Clear all filters
    const clearFilters = useCallback(() => {
        const clearedFilters = {
            query: '',
            genres: [],
            status: [],
            rating: 0,
            yearFrom: 1990,
            yearTo: new Date().getFullYear(),
            sortBy: 'relevance' as const,
            sortOrder: 'desc' as const
        };
        setFilters(clearedFilters);
        performSearch(clearedFilters);
    }, [performSearch]);

    // Initial search
    useEffect(() => {
        if (filters.query || filters.genres.length > 0 || filters.status.length > 0) {
            performSearch(filters);
        }
    }, []);

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setShowSuggestions(false);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const activeFiltersCount = filters.genres.length + filters.status.length + 
        (filters.rating > 0 ? 1 : 0) + 
        (filters.yearFrom > 1990 || filters.yearTo < new Date().getFullYear() ? 1 : 0);

    return (
        <div className="bg-gray-900 rounded-2xl shadow-xl p-6">        {/* Search Header */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Discover Manga</h2>
                <p className="text-gray-400">your next favorite series</p>
            </div>

            {/* Search Bar */}
            <div className="relative mb-4">
                <div className="relative">
                    <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={filters.query}
                        onChange={(e) => handleQueryChange(e.target.value)}
                        placeholder="Search manga by title, author, or description..."
                        className="w-full bg-gray-800 text-white rounded-lg pl-12 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    {filters.query && (
                        <button
                            onClick={() => handleQueryChange('')}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                            <FaTimes />
                        </button>
                    )}
                </div>

                {/* Search Suggestions */}
                <AnimatePresence>
                    {showSuggestions && suggestions.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-full left-0 right-0 bg-gray-800 rounded-lg mt-2 shadow-xl z-50 max-h-60 overflow-y-auto"
                        >
                            {suggestions.map((suggestion, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleSuggestionSelect(suggestion)}
                                    className="w-full text-left px-4 py-3 hover:bg-gray-700 text-white border-b border-gray-70 last:border-b-0"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Filter Toggle */}
            <div className="flex items-center justify-between mb-4">
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 px-4 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                    <FaFilter />
                    Filters
                    {activeFiltersCount > 0 && (
                        <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-1">
                            {activeFiltersCount}
                        </span>
                    )}
                    {showFilters ? <FaChevronUp /> : <FaChevronDown />}
                </button>

                {activeFiltersCount > 0 && (
                    <button
                        onClick={clearFilters}
                        className="text-gray-400 hover:text-white text-sm"
                    >
                        Clear all
                    </button>
                )}
            </div>

            {/* Advanced Filters */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-gray-800 rounded-lg p-4"
                    >
                        {/* Genres */}
                        <div>
                            <h3 className="text-white font-semibold mb-2">Genres</h3>
                            <div className="flex flex-wrap gap-2">
                                {GENRES.map((genre) => (
                                    <button
                                        key={genre}
                                        onClick={() => toggleGenre(genre)}
                                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                                            filters.genres.includes(genre)
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        }`}
                                    >
                                        {genre}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Status */}
                        <div>
                            <h3 className="text-white font-semibold mb-2">Status</h3>
                            <div className="flex flex-wrap gap-2">
                                {STATUS_OPTIONS.map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => toggleStatus(status)}
                                        className={`px-3 py-1 rounded-full text-sm transition-colors capitalize ${
                                            filters.status.includes(status)
                                                ? 'bg-green-600 text-white'
                                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        }`}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Rating */}
                        <div>
                            <h3 className="text-white font-semibold mb-2">Minimum Rating</h3>
                            <div className="flex items-center gap-2">
                                <input
                                    type="range"
                                    min="0"
                                    max="5"
                                    step="0.5"
                                    value={filters.rating}
                                    onChange={(e) => handleFilterChange('rating', parseFloat(e.target.value))}
                                    className="flex-1"
                                />
                                <span className="text-white min-w-[3rem]">
                                    {filters.rating > 0 ? `${filters.rating}★` : 'Any'}
                                </span>
                            </div>
                        </div>

                        {/* Year Range */}
                        <div>
                            <h3 className="text-white font-semibold mb-2">Year Range</h3>
                            <div className="flex items-center gap-4">
                                <div>
                                    <label className="text-gray-400 text-sm">From</label>
                                    <input
                                        type="number"
                                        min="1990"
                                        max={new Date().getFullYear()}
                                        value={filters.yearFrom}
                                        onChange={(e) => handleFilterChange('yearFrom', parseInt(e.target.value))}
                                        className="w-full bg-gray-700 text-white rounded px-3 py-1 mt-1"
                                    />
                                </div>
                                <div>
                                    <label className="text-gray-400 text-sm">To</label>
                                    <input
                                        type="number"
                                        min="1990"
                                        max={new Date().getFullYear()}
                                        value={filters.yearTo}
                                        onChange={(e) => handleFilterChange('yearTo', parseInt(e.target.value))}
                                        className="w-full bg-gray-700 text-white rounded px-3 py-1 mt-1"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Sort Options */}
                        <div>
                            <h3 className="text-white font-semibold mb-2">Sort By</h3>
                            <div className="flex items-center gap-4">
                                <select
                                    value={filters.sortBy}
                                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                                    className="bg-gray-700 text-white rounded px-3 py-2"
                                >
                                    <option value="relevance">Relevance</option>
                                    <option value="title">Title</option>
                                    <option value="rating">Rating</option>
                                    <option value="views">Views</option>
                                    <option value="likes">Likes</option>
                                    <option value="newest">Newest</option>
                                    <option value="oldest">Oldest</option>
                                </select>
                                <button
                                    onClick={() => handleFilterChange('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
                                    className="flex items-center gap-2 px-3 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
                                >
                                    <FaSort />
                                    {filters.sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Results */}
            <div className="space-y-4">
                {loading ? (
                    <div className="flex justify-center py-8">
                        <FaSpinner className="animate-spin text-3xl text-blue-400" />
                    </div>
                ) : error ? (
                    <div className="text-center py-8">
                        <p className="text-red-400 mb-2">{error}</p>
                        <button
                            onClick={() => performSearch(filters)}
                            className="px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg"
                        >
                            Try Again
                        </button>
                    </div>
                ) : results.length === 0 ? (
                    <div className="text-center py-8">
                        <div className="text-4xl mb-2">🔍</div>
                        <p className="text-gray-400">No manga found</p>
                        <p className="text-sm text-gray-500">Try adjusting your search criteria</p>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between">
                            <p className="text-gray-400">
                                Found {results.length} manga
                            </p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {results.map((manga, index) => (
                                <motion.div
                                    key={manga._id ? manga._id : index}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2, delay: index * 0.1 }}
                                    className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-750 transition-colors"
                                >
                                    <Link href={`/manga/${manga._id}`}>
                                        <div className="relative">
                                            <OptimizedImage src={manga.coverImage} alt={manga.title} width={120} height={180} className="object-cover w-full h-full" fallbackSrc="/file.svg" />
                                            <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
                                                {manga.status}
                                            </div>
                                            {manga.rating > 0 && (
                                                <div className="absolute bottom-2 left-2 bg-yellow-600 text-white px-2 py-1 rounded text-sm flex items-center gap-1">
                                                    <FaStar />
                                                    {manga.rating.toFixed(1)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-4">
                                            <h3 className="font-semibold text-white mb-1">{manga.title}</h3>
                                            <p className="text-gray-400 text-sm mb-2">{manga.description}</p>
                                            <div className="flex items-center justify-between text-sm text-gray-500">
                                                <span>{manga.author}</span>
                                                <span>{manga.year}</span>
                                            </div>
                                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                                                <span className="flex items-center gap-1">
                                                    <FaEye />
                                                    {manga.views.toLocaleString()}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <FaHeart />
                                                    {manga.likes.toLocaleString()}
                                                </span>
                                                <span>{manga.chapters} ch</span>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
} 