'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const popularGenres = [
    'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror',
    'Mystery', 'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural',
    'Thriller', 'Psychological', 'Historical', 'Military', 'School Life',
    'Shounen', 'Shoujo', 'Seinen', 'Josei', 'Ecchi', 'Harem', 'Isekai'
];

export default function GenresPage() {
    const [genreStats, setGenreStats] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchGenreStats();
    }, []);

    const fetchGenreStats = async () => {
        try {
            const response = await fetch('/api/genres');
            if (response.ok) {
                const data = await response.json();
                setGenreStats(data.stats || {});
            }
        } catch (error) {
            console.error('Error fetching genre stats:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Manga Genres</h1>
                    <p className="text-gray-600 mt-2">Explore manga by genre</p>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading genres...</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {popularGenres.map((genre) => (
                            <Link
                                key={genre}
                                href={`/manga?genre=${encodeURIComponent(genre)}`}
                                className="group bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-shadow"
                            >
                                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                    {genre}
                                </h3>
                                {genreStats[genre] && (
                                    <p className="text-sm text-gray-500 mt-1">
                                        {genreStats[genre]} manga
                                    </p>
                                )}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

