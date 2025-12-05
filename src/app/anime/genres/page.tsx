'use client';

import { useState, useEffect } from 'react';
import { useAppMode } from '@/contexts/AppModeContext';
import Link from 'next/link';
import EpisodeCard from '@/components/anime/components/EpisodeCard';
import { motion } from 'framer-motion';

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

const popularGenres = [
    'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror',
    'Mystery', 'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural',
    'Thriller', 'Psychological', 'Historical', 'Military', 'School Life',
    'Shounen', 'Shoujo', 'Seinen', 'Josei', 'Isekai', 'Mecha', 'Music'
];

export default function AnimeGenresPage() {
    const { appMode, switchToAnime } = useAppMode();
    const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
    const [anime, setAnime] = useState<AnimeSeries[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (appMode !== 'anime') {
            switchToAnime();
        }
    }, [appMode, switchToAnime]);

    useEffect(() => {
        if (selectedGenre) {
            fetchAnimeByGenre(selectedGenre);
        } else {
            setAnime([]);
        }
    }, [selectedGenre]);

    const fetchAnimeByGenre = async (genre: string) => {
        try {
            setLoading(true);
            const response = await fetch(`/api/anime/browse?genre=${encodeURIComponent(genre)}`);
            if (response.ok) {
                const data = await response.json();
                setAnime(data.anime || []);
            }
        } catch (error) {
            console.error('Error fetching anime by genre:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-950 via-red-950 to-black text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-8">
                    <h1 className="text-4xl font-black mb-4 bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 bg-clip-text text-transparent">
                        ANIME GENRES
                    </h1>
                    <p className="text-gray-400 text-lg">Explore anime by genre</p>
                </div>

                {/* Genre Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-12">
                    {popularGenres.map((genre) => (
                        <motion.button
                            key={genre}
                            onClick={() => setSelectedGenre(selectedGenre === genre ? null : genre)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`
                                group relative p-6 rounded-xl backdrop-blur-md border-2 transition-all duration-300
                                ${selectedGenre === genre
                                    ? 'bg-orange-500/30 border-orange-400 shadow-lg shadow-orange-500/50'
                                    : 'bg-black/40 border-orange-500/20 hover:border-orange-400/50 hover:bg-orange-500/10'
                                }
                            `}
                        >
                            <h3 className={`
                                font-bold text-center transition-colors
                                ${selectedGenre === genre
                                    ? 'text-orange-300'
                                    : 'text-gray-300 group-hover:text-orange-300'
                                }
                            `}>
                                {genre}
                            </h3>
                            {selectedGenre === genre && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute -top-2 -right-2 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center"
                                >
                                    <span className="text-white text-xs">✓</span>
                                </motion.div>
                            )}
                        </motion.button>
                    ))}
                </div>

                {/* Anime Results */}
                {selectedGenre && (
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-orange-400">
                                {selectedGenre} Anime
                            </h2>
                            {anime.length > 0 && (
                                <span className="text-gray-400">
                                    {anime.length} {anime.length === 1 ? 'series' : 'series'}
                                </span>
                            )}
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                            </div>
                        ) : anime.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                {anime.map((item) => (
                                    <EpisodeCard key={item._id} anime={item} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20">
                                <p className="text-gray-400 text-xl">No anime found in this genre</p>
                            </div>
                        )}
                    </div>
                )}

                {!selectedGenre && (
                    <div className="text-center py-20">
                        <p className="text-gray-400 text-xl">Select a genre to explore anime</p>
                    </div>
                )}
            </div>
        </div>
    );
}

