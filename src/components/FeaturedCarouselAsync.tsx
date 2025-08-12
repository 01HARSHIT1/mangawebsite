"use client";
import { useEffect, useState } from "react";
import FeaturedCarousel from "./FeaturedCarousel";

export default function FeaturedCarouselAsync() {
    const [manga, setManga] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        setError(null);
        fetch(`/api/manga?sort=featured&page=1&limit=5`)
            .then(res => {
                if (!res.ok) throw new Error('Failed to load featured manga');
                return res.json();
            })
            .then(data => {
                setManga(data.manga || []);
                setLoading(false);
            })
            .catch(err => {
                setError('Failed to load featured manga. Please try again later.');
                setLoading(false);
            });
    }, []);

    if (error) return (
        <div className="text-red-400 text-base sm:text-lg p-6 sm:p-8 text-center" role="alert" aria-live="assertive">
            {error}
        </div>
    );

    if (loading) return (
        <div className="relative w-full flex flex-col items-center">
            <div className="w-full flex justify-center items-center">
                {/* Previous Button Skeleton */}
                <div className="absolute left-2 sm:left-4 z-10 p-2 sm:p-3 text-xl sm:text-2xl text-white/70 bg-black/20 rounded-full backdrop-blur-sm min-h-[44px] min-w-[44px] flex items-center justify-center animate-pulse">
                    &#8592;
                </div>

                {/* Main Card Skeleton */}
                <div className="bg-gray-900 rounded-xl sm:rounded-2xl shadow-lg flex flex-col lg:flex-row items-center w-full max-w-4xl mx-auto overflow-hidden animate-pulse">
                    {/* Image Skeleton */}
                    <div className="flex-shrink-0 w-full lg:w-80 h-48 sm:h-64 lg:h-80 bg-gray-800" />

                    {/* Content Skeleton */}
                    <div className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col justify-center space-y-3 sm:space-y-4">
                        <div className="h-6 sm:h-8 lg:h-10 bg-gray-800 rounded w-3/4" />
                        <div className="h-4 sm:h-5 bg-gray-800 rounded w-1/2" />
                        <div className="h-4 sm:h-5 bg-gray-800 rounded w-2/3" />
                        <div className="h-12 sm:h-16 bg-gray-800 rounded w-full" />
                        <div className="h-10 sm:h-12 bg-gray-800 rounded w-32" />
                    </div>
                </div>

                {/* Next Button Skeleton */}
                <div className="absolute right-2 sm:right-4 z-10 p-2 sm:p-3 text-xl sm:text-2xl text-white/70 bg-black/20 rounded-full backdrop-blur-sm min-h-[44px] min-w-[44px] flex items-center justify-center animate-pulse">
                    &#8594;
                </div>
            </div>

            {/* Dots Skeleton */}
            <div className="flex gap-2 mt-4 sm:mt-6">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-gray-700 animate-pulse" />
                ))}
            </div>
        </div>
    );

    return <FeaturedCarousel manga={manga} />;
} 