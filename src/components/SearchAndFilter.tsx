"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function SearchAndFilter({ genres }: { genres: string[] }) {
    const router = useRouter();
    const params = useSearchParams();
    const [search, setSearch] = useState(params.get('q') || '');
    const [selected, setSelected] = useState(params.get('genre') || '');
    const [status, setStatus] = useState(params.get('status') || '');
    const [animate, setAnimate] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setAnimate(true);
        const url = new URL(window.location.href);
        if (search) url.searchParams.set('q', search); else url.searchParams.delete('q');
        if (selected) url.searchParams.set('genre', selected); else url.searchParams.delete('genre');
        if (status) url.searchParams.set('status', status); else url.searchParams.delete('status');
        router.push(url.pathname + url.search);
        setTimeout(() => setAnimate(false), 400);
    };

    const handleClear = () => {
        setSearch('');
        setSelected('');
        setStatus('');
        setAnimate(true);
        setTimeout(() => setAnimate(false), 400);
        const url = new URL(window.location.href);
        url.searchParams.delete('q');
        url.searchParams.delete('genre');
        url.searchParams.delete('status');
        router.push(url.pathname + url.search);
    };

    return (
        <form onSubmit={handleSearch} className={`flex flex-col gap-4 w-full transition-all duration-300 ${animate ? 'ring-2 ring-blue-400 scale-105' : ''}`} aria-label="Search and filter manga">
            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
                <input
                    type="text"
                    placeholder="Search manga, author, or tags..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base min-h-[44px]"
                    aria-label="Search input"
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
                <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
                    {/* Status Filter */}
                    <select
                        value={status}
                        onChange={e => setStatus(e.target.value)}
                        className="w-full sm:w-auto px-4 py-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base min-h-[44px]"
                        aria-label="Filter by status"
                    >
                        <option value="">All Statuses</option>
                        <option value="Ongoing">Ongoing</option>
                        <option value="Completed">Completed</option>
                        <option value="Hiatus">Hiatus</option>
                    </select>

                    {/* Genre Filters */}
                    <div className="flex flex-wrap gap-2 w-full lg:w-auto" role="group" aria-label="Filter by genre">
                        {genres.slice(0, 6).map(g => (
                            <button
                                key={g}
                                type="button"
                                onClick={() => setSelected(selected === g ? '' : g)}
                                className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[44px] ${selected === g ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-800 text-gray-200 border-gray-700 hover:bg-gray-700'}`}
                                aria-pressed={selected === g}
                                aria-label={`Filter by genre: ${g}`}
                            >
                                {g}
                            </button>
                        ))}
                        {genres.length > 6 && (
                            <button
                                type="button"
                                className="px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold border border-gray-700 bg-gray-800 text-gray-200 hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[44px]"
                                aria-label="Show more genres"
                            >
                                +{genres.length - 6}
                            </button>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 mt-4 lg:mt-0 lg:ml-auto">
                    <button
                        type="submit"
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors text-sm sm:text-base min-h-[44px]"
                        aria-label="Apply filters"
                    >
                        Search
                    </button>
                    <button
                        type="button"
                        onClick={handleClear}
                        className="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors text-sm sm:text-base min-h-[44px]"
                        aria-label="Clear all filters"
                    >
                        Clear Filters
                    </button>
                </div>
            </div>
        </form>
    );
} 