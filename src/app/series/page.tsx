"use client";
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import OptimizedImage from '../../components/OptimizedImage';

const genresList = [
    "Romance", "Action", "Fantasy", "Drama", "Comedy", "Slice of Life", "Adventure", "Horror", "Sci-Fi", "Mystery", "Supernatural"
];
const statusList = ["Ongoing", "Completed", "Hiatus"];

export default function SeriesPage() {
    const [mangaList, setMangaList] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [genre, setGenre] = useState('');
    const [status, setStatus] = useState('');
    const [type, setType] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        setLoading(true);
        const params = new URLSearchParams({
            page: page.toString(),
            limit: '16',
            search,
            genre,
            status,
            type
        });
        fetch(`/api/manga?${params.toString()}`)
            .then(res => res.json())
            .then(data => {
                setMangaList(data.manga || []);
                setTotalPages(data.pagination?.totalPages || 1);
                setLoading(false);
            });
    }, [page, search, genre, status, type]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
    };

    const clearFilters = () => {
        setSearch('');
        setGenre('');
        setStatus('');
        setType('');
        setPage(1);
    };

    return (
        <div className="bg-gradient-to-b from-gray-950 to-gray-900 min-h-screen text-white font-sans">
            <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 lg:py-12">
                {/* Header */}
                <div className="text-center mb-8 sm:mb-12">
                    <div className="flex items-center justify-center gap-2 sm:gap-4 text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-2">
                        <span role="img" aria-label="books">📚</span>
                        <span>Series</span>
                    </div>
                    <div className="text-gray-400 text-sm sm:text-base lg:text-lg mb-6 sm:mb-8">
                        Explore a vast array of distinctive and exclusive works on our platform
                    </div>
                </div>

                {/* Search and Filters */}
                <form className="mb-8 sm:mb-10" onSubmit={handleSearch}>
                    {/* Search Bar */}
                    <div className="flex flex-col sm:flex-row gap-3 mb-4">
                        <input
                            placeholder="Search manga, author, or tags..."
                            className="flex-1 px-4 py-3 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:outline-none text-sm sm:text-base min-h-[44px]"
                            aria-label="Search series"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />

                        {/* Mobile Filter Toggle */}
                        <button
                            type="button"
                            onClick={() => setShowFilters(!showFilters)}
                            className="sm:hidden px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors min-h-[44px] flex items-center justify-center"
                            aria-label="Toggle filters"
                            aria-expanded={showFilters}
                        >
                            <span className="mr-2">Filters</span>
                            <svg className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    </div>

                    {/* Filters Section */}
                    <div className={`${showFilters ? 'block' : 'hidden'} sm:block`}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                            <select
                                className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-blue-400 focus:outline-none text-sm sm:text-base min-h-[44px]"
                                aria-label="Filter by status"
                                value={status}
                                onChange={e => { setStatus(e.target.value); setPage(1); }}
                            >
                                <option value="">All Statuses</option>
                                {statusList.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>

                            <select
                                className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-blue-400 focus:outline-none text-sm sm:text-base min-h-[44px]"
                                aria-label="Filter by type"
                                value={type}
                                onChange={e => { setType(e.target.value); setPage(1); }}
                            >
                                <option value="">All Types</option>
                                <option value="Manga">Manga</option>
                                <option value="Webtoon">Webtoon</option>
                            </select>

                            <select
                                className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-blue-400 focus:outline-none text-sm sm:text-base min-h-[44px]"
                                aria-label="Filter by genre"
                                value={genre}
                                onChange={e => { setGenre(e.target.value); setPage(1); }}
                            >
                                <option value="">All Genres</option>
                                {genresList.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>

                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors text-sm sm:text-base min-h-[44px]"
                                >
                                    Search
                                </button>
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors text-sm sm:text-base min-h-[44px]"
                                    aria-label="Clear all filters"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>
                    </div>
                </form>

                {/* Manga Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="bg-gray-900 rounded-xl sm:rounded-2xl shadow-lg overflow-hidden relative animate-pulse">
                                <div className="w-full h-48 sm:h-56 lg:h-60 bg-gray-800" />
                                <div className="p-3 sm:p-4">
                                    <div className="h-4 sm:h-5 w-3/4 bg-gray-700 rounded mb-2 sm:mb-3" />
                                    <div className="h-3 sm:h-4 w-1/2 bg-gray-700 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                        {mangaList.map((m: any) => (
                            <Link key={m._id} href={`/manga/${m._id}`} className="group focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-xl">
                                <div className="bg-gray-900 rounded-xl sm:rounded-2xl shadow-lg overflow-hidden relative cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-blue-400/30">
                                    <div className="w-full h-48 sm:h-56 lg:h-60 bg-gray-800 relative">
                                        {m.coverImage ? (
                                            <img src={m.coverImage} alt={m.title} width={320} height={240} className="object-cover w-full h-full" style={{ maxWidth: '100%', maxHeight: '100%' }} />
                                        ) : (
                                            <img src="/file.svg" alt={m.title} width={320} height={240} className="object-cover w-full h-full" />
                                        )}
                                        {m.type && (
                                            <span className="absolute top-2 sm:top-3 right-2 sm:right-3 bg-pink-600 text-white rounded-full px-2 sm:px-4 py-1 font-bold text-xs shadow">
                                                {m.type}
                                            </span>
                                        )}
                                    </div>
                                    <div className="p-3 sm:p-4">
                                        <div className="font-bold text-sm sm:text-base lg:text-lg mb-2 line-clamp-2 leading-tight">
                                            {m.title}
                                        </div>
                                        {m.genre && (
                                            <div className="flex flex-wrap gap-1 sm:gap-2">
                                                {m.genre.split(',').slice(0, 2).map((g: string, i: number) => (
                                                    <span key={g.trim() ? g.trim() + '-' + i : 'genre-' + i} className="bg-gray-800 text-blue-300 rounded-full px-2 sm:px-3 py-1 text-xs font-semibold">
                                                        {g.trim()}
                                                    </span>
                                                ))}
                                                {m.genre.split(',').length > 2 && (
                                                    <span className="text-gray-500 text-xs px-2 py-1">
                                                        +{m.genre.split(',').length - 2} more
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!loading && mangaList.length === 0 && (
                    <div className="text-center py-12 sm:py-16" role="status" aria-live="polite">
                        <div className="text-4xl sm:text-6xl mb-4">📚</div>
                        <h3 className="text-lg sm:text-xl font-semibold mb-2">No manga found</h3>
                        <p className="text-gray-400 text-sm sm:text-base mb-6">
                            Try adjusting your search criteria or filters
                        </p>
                        <button
                            onClick={clearFilters}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
                        >
                            Clear Filters
                        </button>
                    </div>
                )}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 py-6 sm:py-8">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 rounded-lg bg-gray-800 text-white disabled:opacity-50 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors min-h-[44px] text-sm sm:text-base"
                        >
                            Previous
                        </button>

                        <div className="flex flex-wrap justify-center gap-1 sm:gap-2">
                            {[...Array(Math.min(5, totalPages))].map((_, i) => {
                                const pageNum = i + 1;
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setPage(pageNum)}
                                        className={`px-3 sm:px-4 py-2 rounded-lg min-h-[44px] text-sm sm:text-base transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 transition-transform duration-150 hover:scale-105 focus:scale-105 ${page === pageNum
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                            }`}
                                        aria-current={page === pageNum ? 'page' : undefined}
                                        tabIndex={0}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                            {totalPages > 5 && (
                                <span className="px-3 py-2 text-gray-400 text-sm sm:text-base">...</span>
                            )}
                        </div>

                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="px-4 py-2 rounded-lg bg-gray-800 text-white disabled:opacity-50 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors min-h-[44px] text-sm sm:text-base"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
} 