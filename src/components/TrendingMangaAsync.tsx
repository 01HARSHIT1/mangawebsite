"use client";
import { useEffect, useState } from "react";
import TrendingManga from "./TrendingManga";

export default function TrendingMangaAsync({ sort }: { sort: string }) {
    const [manga, setManga] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setManga([]);
        setPage(1);
        setHasMore(true);
        setError(null);
    }, [sort]);

    useEffect(() => {
        setLoading(true);
        setError(null);
        fetch(`/api/manga?sort=${sort}&page=${page}&limit=8`)
            .then(res => {
                if (!res.ok) throw new Error('Failed to load manga');
                return res.json();
            })
            .then(data => {
                setManga(prev => page === 1 ? data.manga : [...prev, ...data.manga]);
                setHasMore(data.pagination?.hasNext || false);
                setLoading(false);
            })
            .catch(err => {
                setError('Failed to load manga. Please try again later.');
                setLoading(false);
            });
    }, [sort, page]);

    const SkeletonLoader = () => (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-gray-900 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 shadow-lg animate-pulse">
                    <div className="w-full h-32 sm:h-36 lg:h-40 rounded-lg sm:rounded-xl bg-gray-800 mb-3 sm:mb-4" />
                    <div className="space-y-2">
                        <div className="h-4 sm:h-5 bg-gray-800 rounded w-3/4" />
                        <div className="h-3 sm:h-4 bg-gray-800 rounded w-1/2" />
                        <div className="h-3 sm:h-4 bg-gray-800 rounded w-2/3" />
                        <div className="h-10 sm:h-11 bg-gray-800 rounded-lg mt-3" />
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div>
            {error ? (
                <div className="text-red-400 text-base sm:text-lg p-6 sm:p-8 text-center" role="alert" aria-live="assertive">
                    {error}
                </div>
            ) : loading && manga.length === 0 ? (
                <SkeletonLoader />
            ) : (
                <TrendingManga manga={manga} />
            )}

            {loading && manga.length > 0 && (
                <div className="text-center py-4 sm:py-6">
                    <div className="inline-flex items-center space-x-2 text-gray-400">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                        <span className="text-sm sm:text-base">Loading more...</span>
                    </div>
                </div>
            )}

            {hasMore && !loading && !error && (
                <div className="text-center mt-6 sm:mt-8">
                    <button
                        onClick={() => setPage(p => p + 1)}
                        className="px-6 sm:px-8 py-2 sm:py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors text-sm sm:text-base min-h-[44px]"
                    >
                        Load More
                    </button>
                </div>
            )}
        </div>
    );
} 