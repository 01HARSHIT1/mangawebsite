import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { verifyToken } from '@/lib/auth';

/**
 * Get episode details with prev/next episode information
 */

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: { seriesId: string; episodeNumber: string } }
) {
    try {
        const { seriesId, episodeNumber } = params;
        const epNum = parseInt(episodeNumber, 10);
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');
        
        let userId: string | null = null;
        if (token) {
            const payload = verifyToken(token);
            if (payload) {
                userId = payload.userId;
            }
        }

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Get current episode
        const episode = await db.collection('anime_episodes').findOne({
            seriesId: new ObjectId(seriesId),
            episodeNumber: epNum,
        });

        if (!episode) {
            return NextResponse.json({ error: 'Episode not found' }, { status: 404 });
        }

        // Get all episodes in the series sorted by episode number
        const allEpisodes = await db.collection('anime_episodes')
            .find({ seriesId: new ObjectId(seriesId) })
            .sort({ seasonNumber: 1, episodeNumber: 1 })
            .toArray();

        // Find current episode index
        const currentIndex = allEpisodes.findIndex(
            (ep: any) => ep._id.toString() === episode._id.toString()
        );

        // Get prev and next episodes
        const prevEpisode = currentIndex > 0 ? allEpisodes[currentIndex - 1] : null;
        const nextEpisode = currentIndex < allEpisodes.length - 1 ? allEpisodes[currentIndex + 1] : null;

        // Get series info
        const series = await db.collection('anime_series').findOne({ 
            _id: new ObjectId(seriesId) 
        });

        // Get watch history if authenticated
        let watchHistory: any = null;
        if (userId) {
            watchHistory = await db.collection('anime_watch_history').findOne({
                userId,
                episodeId: episode._id.toString(),
            });
        }

        // Get available tracks
        const availableTracks = {
            audio: episode.audioTracks || [],
            subtitles: episode.subtitles || [],
        };

        return NextResponse.json({
            id: episode._id.toString(),
            episodeNumber: episode.episodeNumber,
            seasonNumber: episode.seasonNumber || 1,
            title: episode.title,
            description: episode.description,
            thumbnail: episode.thumbnail,
            duration: episode.duration,
            airDate: episode.airDate,
            releaseDate: episode.releaseDate,
            videoUrl: episode.videoUrl,
            hlsManifestUrl: episode.hlsManifestUrl,
            dashManifestUrl: episode.dashManifestUrl,
            isPreview: episode.isPreview || false,
            drmEnabled: episode.drmEnabled || false,
            drmLicenseUrl: episode.drmLicenseUrl,
            availableTracks,
            qualityLevels: episode.qualityLevels || [],
            prevEpisode: prevEpisode ? {
                id: prevEpisode._id.toString(),
                episodeNumber: prevEpisode.episodeNumber,
                title: prevEpisode.title,
            } : null,
            nextEpisode: nextEpisode ? {
                id: nextEpisode._id.toString(),
                episodeNumber: nextEpisode.episodeNumber,
                title: nextEpisode.title,
            } : null,
            series: series ? {
                id: series._id.toString(),
                title: series.title,
                coverImage: series.coverImage,
            } : null,
            watchHistory: watchHistory ? {
                lastPosition: watchHistory.lastPosition,
                watchedPercentage: watchHistory.watchedPercentage,
                completed: watchHistory.completed,
            } : null,
            entitlements: {
                isPremium: series?.isExclusive || episode.drmEnabled || false,
                geoBlocked: false, // Would check geo-restrictions here
            },
        });
    } catch (error: any) {
        console.error('Error fetching episode:', error);
        return NextResponse.json(
            { error: 'Failed to fetch episode', details: error.message },
            { status: 500 }
        );
    }
}

