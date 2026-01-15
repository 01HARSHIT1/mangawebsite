'use client';

import { useState, useEffect } from 'react';
import { useAppMode } from '@/contexts/AppModeContext';
import EpisodeCard from '@/components/anime/components/EpisodeCard';
import { Search, Filter } from 'lucide-react';

interface AnimeSeries {
    _id: string;
    title: string;
    coverImage: string;
    genres: string[];
    rating: number;
    year: number;
    status: 'ongoing' | 'completed' | 'upcoming';
    episodeCount: number;
}

export default function BrowsePage() {
    const { appMode, switchToAnime } = useAppMode();
    const [anime, setAnime] = useState<AnimeSeries[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGenre, setSelectedGenre] = useState<string>('all');
    const [selectedStatus, setSelectedStatus] = useState<string>('all');

    useEffect(() => {
        if (appMode !== 'anime') {
            switchToAnime();
        }
    }, [appMode, switchToAnime]);

    useEffect(() => {
        fetchAnime();
    }, [selectedGenre, selectedStatus]);

    const fetchAnime = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (selectedGenre !== 'all') params.append('genre', selectedGenre);
            if (selectedStatus !== 'all') params.append('status', selectedStatus);
            if (searchQuery) params.append('search', searchQuery);

            const response = await fetch(`/api/anime/browse?${params.toString()}`);
            if (response.ok) {
                const data = await response.json();
                setAnime(data.anime || []);
            }
        } catch (error) {
            console.error('Error fetching anime:', error);
        } finally {
            setLoading(false);
        }
    };

    const genres = ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural'];
    const statuses = ['all', 'ongoing', 'completed', 'upcoming'];

    return (
        <div className="min-h-screen bg-gray-950 text-white pt-16 sm:pt-0">
            {/* Navigation is handled by AnimeAppNavigator */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
                <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 md:mb-8">Browse Anime</h1>

                {/* Search and Filters - Responsive */}
                <div className="mb-6 sm:mb-8 space-y-3 sm:space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search anime..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    fetchAnime();
                                }
                            }}
                            className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 bg-gray-900 border border-gray-800 rounded-lg text-white text-sm sm:text-base placeholder-gray-400 focus:outline-none focus:border-red-500 touch-manipulation"
                        />
                    </div>

                    <div className="flex flex-wrap gap-3 sm:gap-4">
                        <div className="flex items-center space-x-2 flex-1 min-w-[140px]">
                            <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                            <span className="text-gray-400 text-sm sm:text-base hidden sm:inline">Genre:</span>
                            <select
                                value={selectedGenre}
                                onChange={(e) => setSelectedGenre(e.target.value)}
                                className="flex-1 px-3 sm:px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white text-sm sm:text-base focus:outline-none focus:border-red-500 touch-manipulation"
                            >
                                <option value="all">All Genres</option>
                                {genres.map((genre) => (
                                    <option key={genre} value={genre.toLowerCase()}>
                                        {genre}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center space-x-2 flex-1 min-w-[140px]">
                            <span className="text-gray-400 text-sm sm:text-base hidden sm:inline">Status:</span>
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="flex-1 px-3 sm:px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white text-sm sm:text-base focus:outline-none focus:border-red-500 touch-manipulation"
                            >
                                {statuses.map((status) => (
                                    <option key={status} value={status}>
                                        {status === 'all' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Results - Responsive Grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-12 sm:py-20">
                        <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-red-500"></div>
                    </div>
                ) : anime.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                        {anime.map((item) => (
                            <EpisodeCard key={item._id} anime={item} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 sm:py-20">
                        <p className="text-gray-400 text-lg sm:text-xl">No anime found</p>
                    </div>
                )}
            </div>
        </div>
    );
}

