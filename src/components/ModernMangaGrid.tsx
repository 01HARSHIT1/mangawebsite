'use client';

import { useState, useEffect } from 'react';
import { FaTh, FaList, FaFilter, FaSort, FaSearch } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import ModernMangaCard from './ModernMangaCard';

interface MangaGridProps {
    manga: any[];
    loading?: boolean;
    title?: string;
    description?: string;
    showFilters?: boolean;
    showViewToggle?: boolean;
    showSearch?: boolean;
    defaultView?: 'grid' | 'list';
    variant?: 'default' | 'featured' | 'compact';
    itemsPerPage?: number;
}

const sortOptions = [
    { value: 'popular', label: 'Most Popular' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'updated', label: 'Recently Updated' },
    { value: 'alphabetical', label: 'A-Z' },
    { value: 'newest', label: 'Newest' }
];

const filterOptions = [
    { value: 'all', label: 'All Genres' },
    { value: 'action', label: 'Action' },
    { value: 'romance', label: 'Romance' },
    { value: 'fantasy', label: 'Fantasy' },
    { value: 'comedy', label: 'Comedy' },
    { value: 'drama', label: 'Drama' },
    { value: 'horror', label: 'Horror' },
    { value: 'sci-fi', label: 'Sci-Fi' }
];

export default function ModernMangaGrid({
    manga,
    loading = false,
    title,
    description,
    showFilters = false,
    showViewToggle = false,
    showSearch = false,
    defaultView = 'grid',
    variant = 'default',
    itemsPerPage = 20
}: MangaGridProps) {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>(defaultView);
    const [sortBy, setSortBy] = useState('popular');
    const [filterBy, setFilterBy] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [filteredManga, setFilteredManga] = useState(manga);

    // Filter and sort manga
    useEffect(() => {
        let filtered = [...manga];

        // Apply search filter
        if (searchQuery) {
            filtered = filtered.filter(item =>
                item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.creator.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.genres.some((genre: string) => genre.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }

        // Apply genre filter
        if (filterBy !== 'all') {
            filtered = filtered.filter(item =>
                item.genres.some((genre: string) => genre.toLowerCase() === filterBy)
            );
        }

        // Apply sorting
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'alphabetical':
                    return a.title.localeCompare(b.title);
                case 'rating':
                    return (b.rating || 0) - (a.rating || 0);
                case 'updated':
                    return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
                case 'newest':
                    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
                case 'popular':
                default:
                    return (b.views || 0) - (a.views || 0);
            }
        });

        setFilteredManga(filtered);
        setCurrentPage(1);
    }, [manga, searchQuery, filterBy, sortBy]);

    // Pagination
    const totalPages = Math.ceil(filteredManga.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentManga = filteredManga.slice(startIndex, endIndex);

    const gridClasses = {
        grid: {
            default: 'grid-manga',
            featured: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8',
            compact: 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4'
        },
        list: 'flex flex-col gap-4'
    };

    if (loading) {
        return (
            <div className="space-y-6">
                {title && (
                    <div className="text-center">
                        <div className="h-8 bg-slate-700 rounded w-64 mx-auto mb-4 skeleton" />
                        {description && <div className="h-4 bg-slate-800 rounded w-96 mx-auto skeleton" />}
                    </div>
                )}
                <div className={gridClasses.grid[variant]}>
                    {[...Array(12)].map((_, i) => (
                        <div key={i} className="manga-card animate-pulse">
                            <div className="aspect-[3/4] bg-slate-700 rounded-lg mb-4" />
                            <div className="space-y-2">
                                <div className="h-4 bg-slate-700 rounded w-3/4" />
                                <div className="h-3 bg-slate-800 rounded w-1/2" />
                                <div className="flex space-x-1">
                                    <div className="h-5 bg-slate-800 rounded w-16" />
                                    <div className="h-5 bg-slate-800 rounded w-20" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            {title && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center"
                >
                    <h2 className="text-4xl font-bold mb-4 text-gradient">
                        {title}
                    </h2>
                    {description && (
                        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                            {description}
                        </p>
                    )}
                </motion.div>
            )}

            {/* Controls */}
            {(showFilters || showViewToggle || showSearch) && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex flex-col lg:flex-row items-center justify-between gap-4 p-6 bg-slate-800/50 rounded-2xl border border-slate-700"
                >
                    {/* Search */}
                    {showSearch && (
                        <div className="relative flex-1 max-w-md">
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search manga, creators, genres..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="input pl-10 w-full"
                            />
                        </div>
                    )}

                    <div className="flex items-center space-x-4">
                        {/* Filters */}
                        {showFilters && (
                            <>
                                <div className="flex items-center space-x-2">
                                    <FaFilter className="text-gray-400" />
                                    <select
                                        value={filterBy}
                                        onChange={(e) => setFilterBy(e.target.value)}
                                        className="input w-auto min-w-32"
                                    >
                                        {filterOptions.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <FaSort className="text-gray-400" />
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="input w-auto min-w-36"
                                    >
                                        {sortOptions.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </>
                        )}

                        {/* View Toggle */}
                        {showViewToggle && (
                            <div className="flex bg-slate-700 rounded-lg p-1">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded ${viewMode === 'grid'
                                        ? 'bg-indigo-600 text-white'
                                        : 'text-gray-400 hover:text-white'
                                        }`}
                                >
                                    <FaTh />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded ${viewMode === 'list'
                                        ? 'bg-indigo-600 text-white'
                                        : 'text-gray-400 hover:text-white'
                                        }`}
                                >
                                    <FaList />
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}

            {/* Results Info */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-center justify-between text-sm text-gray-400"
            >
                <span>
                    Showing {startIndex + 1}-{Math.min(endIndex, filteredManga.length)} of {filteredManga.length} results
                </span>
                {totalPages > 1 && (
                    <span>
                        Page {currentPage} of {totalPages}
                    </span>
                )}
            </motion.div>

            {/* Manga Grid/List */}
            <AnimatePresence mode="wait">
                {currentManga.length > 0 ? (
                    <motion.div
                        key={`${viewMode}-${currentPage}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className={viewMode === 'grid' ? gridClasses.grid[variant] : gridClasses.list}
                    >
                        {currentManga.map((item, index) => (
                            <ModernMangaCard
                                key={item._id}
                                manga={item}
                                variant={viewMode === 'list' ? 'horizontal' : variant}
                                index={index}
                                showProgress={item.readingProgress > 0}
                            />
                        ))}
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-20"
                    >
                        <div className="text-6xl mb-4">📚</div>
                        <h3 className="text-xl font-semibold text-gray-400 mb-2">No manga found</h3>
                        <p className="text-gray-500">
                            {searchQuery || filterBy !== 'all'
                                ? 'Try adjusting your search or filters'
                                : 'No manga available at the moment'
                            }
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Pagination */}
            {totalPages > 1 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center justify-center space-x-2"
                >
                    <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="btn btn-ghost btn-sm disabled:opacity-50"
                    >
                        Previous
                    </button>

                    <div className="flex space-x-1">
                        {[...Array(Math.min(5, totalPages))].map((_, i) => {
                            const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                            return (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`btn btn-sm ${page === currentPage ? 'btn-primary' : 'btn-ghost'
                                        }`}
                                >
                                    {page}
                                </button>
                            );
                        })}
                    </div>

                    <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="btn btn-ghost btn-sm disabled:opacity-50"
                    >
                        Next
                    </button>
                </motion.div>
            )}
        </div>
    );
}
