'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppMode } from '@/contexts/AppModeContext';
import EnhancedVideoPlayer from '@/components/anime/components/EnhancedVideoPlayer';

interface Episode {
    _id?: string;
    id?: string;
    episodeNumber: number;
    seasonNumber?: number;
    title: string;
    description?: string;
    videoUrl?: string;
    hlsManifestUrl?: string;
    dashManifestUrl?: string;
    thumbnail?: string;
    duration?: number;
    airDate?: string;
    availableTracks?: any;
    qualityLevels?: any[];
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

    const [prevEpisode, setPrevEpisode] = useState<any>(null);
    const [nextEpisode, setNextEpisode] = useState<any>(null);

    const fetchEpisodeData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            
            // Fetch episode info with prev/next
            const episodeRes = await fetch(`/api/anime/${seriesId}/episodes/${episodeNumber}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (episodeRes.ok) {
                const episodeData = await episodeRes.json();
                // Map API response to component format
                const mappedEpisode: Episode = {
                    _id: episodeData.id || episodeData._id,
                    id: episodeData.id,
                    episodeNumber: episodeData.episodeNumber,
                    seasonNumber: episodeData.seasonNumber,
                    title: episodeData.title || `Episode ${episodeData.episodeNumber}`,
                    description: episodeData.description,
                    videoUrl: episodeData.videoUrl,
                    hlsManifestUrl: episodeData.hlsManifestUrl,
                    dashManifestUrl: episodeData.dashManifestUrl,
                    thumbnail: episodeData.thumbnail,
                    duration: episodeData.duration,
                    airDate: episodeData.airDate,
                    availableTracks: episodeData.availableTracks,
                    qualityLevels: episodeData.qualityLevels,
                };
                setEpisode(mappedEpisode);
                setSeries(episodeData.series || { _id: seriesId, title: 'Loading...', coverImage: '' });
                setPrevEpisode(episodeData.prevEpisode);
                setNextEpisode(episodeData.nextEpisode);
            } else {
                const errorData = await episodeRes.json().catch(() => ({}));
                console.error('Failed to fetch episode:', errorData);
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

    const handleNextEpisode = () => {
        if (nextEpisode) {
            router.push(`/anime/${seriesId}/episode/${nextEpisode.episodeNumber}`);
        }
    };

    const handlePreviousEpisode = () => {
        if (prevEpisode) {
            router.push(`/anime/${seriesId}/episode/${prevEpisode.episodeNumber}`);
        }
    };

    return (
        <EnhancedVideoPlayer
            episode={episode}
            series={series || { _id: seriesId, title: 'Loading...', coverImage: '' }}
            onNextEpisode={handleNextEpisode}
            onPreviousEpisode={handlePreviousEpisode}
            hasNextEpisode={!!nextEpisode}
            hasPreviousEpisode={!!prevEpisode}
            onBackToSeries={() => {
                router.push(`/anime/${seriesId}`);
            }}
        />
    );
}

