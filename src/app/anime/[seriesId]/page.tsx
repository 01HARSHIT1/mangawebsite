'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppMode } from '@/contexts/AppModeContext';
import SeriesDetails from '@/components/anime/screens/SeriesDetails';

export default function AnimeSeriesPage() {
    const params = useParams();
    const router = useRouter();
    const { appMode, switchToAnime } = useAppMode();
    const seriesId = params?.seriesId as string;

    useEffect(() => {
        // Ensure we're in anime mode
        if (appMode !== 'anime') {
            switchToAnime();
        }
    }, [appMode, switchToAnime]);

    if (!seriesId) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <p className="text-white">Invalid series ID</p>
            </div>
        );
    }

    return <SeriesDetails seriesId={seriesId} />;
}

