'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

/**
 * This page redirects to the SeriesDetails page with episode query parameter
 * The episode playback page is no longer used - all video playback happens in SeriesDetails
 */
export default function EpisodePage() {
    const params = useParams();
    const router = useRouter();
    const seriesId = params?.seriesId as string;
    const episodeNumber = params?.episodeNumber as string;

    useEffect(() => {
        // Redirect to series page with episode query parameter
        if (seriesId && episodeNumber) {
            router.replace(`/anime/${seriesId}?episode=${episodeNumber}`);
        } else if (seriesId) {
            router.replace(`/anime/${seriesId}`);
        }
    }, [seriesId, episodeNumber, router]);

    // Show loading while redirecting
    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
                <p className="text-white text-xl">Redirecting...</p>
            </div>
        </div>
    );
}
