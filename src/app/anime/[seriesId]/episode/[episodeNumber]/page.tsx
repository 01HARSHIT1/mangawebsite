'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppMode } from '@/contexts/AppModeContext';
import VideoPlayer from '@/components/anime/components/VideoPlayer';

interface Episode {
    _id: string;
    episodeNumber: number;
    title: string;
    description?: string;
    videoUrl: string;
    thumbnail?: string;
    duration?: number;
    airDate?: string;
}

interface Series {
    _id: string;
    title: string;
    coverImage: string;
}

export default function EpisodePage() {
    const params = useParams();
    const router = useRouter();
    const { appMode, switchToAnime } = useAppMode();
    const seriesId = params?.seriesId as string;
    const episodeNumber = parseInt(params?.episodeNumber as string, 10);
    const [episode, setEpisode] = useState<Episode | null>(null);
    const [series, setSeries] = useState<Series | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (appMode !== 'anime') {
            switchToAnime();
        }
    }, [appMode, switchToAnime]);

    useEffect(() => {
        if (seriesId && episodeNumber) {
            fetchEpisodeData();
        }
    }, [seriesId, episodeNumber]);

    const fetchEpisodeData = async () => {
        try {
            setLoading(true);
            // Fetch series info
            const seriesRes = await fetch(`/api/anime/${seriesId}`);
            if (seriesRes.ok) {
                const seriesData = await seriesRes.json();
                setSeries(seriesData);
            }

            // Fetch episode info
            const episodeRes = await fetch(`/api/anime/${seriesId}/episodes/${episodeNumber}`);
            if (episodeRes.ok) {
                const episodeData = await episodeRes.json();
                setEpisode(episodeData);
            }
        } catch (error) {
            console.error('Error fetching episode data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
                    <p className="text-white text-xl">Loading episode...</p>
                </div>
            </div>
        );
    }

    if (!episode || !series) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-white text-xl mb-4">Episode not found</p>
                    <button
                        onClick={() => router.push(`/anime/${seriesId}`)}
                        className="text-red-400 hover:text-red-500"
                    >
                        Back to Series
                    </button>
                </div>
            </div>
        );
    }

    return (
        <VideoPlayer
            episode={episode}
            series={series}
            onNextEpisode={() => {
                router.push(`/anime/${seriesId}/episode/${episodeNumber + 1}`);
            }}
            onPreviousEpisode={() => {
                if (episodeNumber > 1) {
                    router.push(`/anime/${seriesId}/episode/${episodeNumber - 1}`);
                }
            }}
            onBackToSeries={() => {
                router.push(`/anime/${seriesId}`);
            }}
        />
    );
}

