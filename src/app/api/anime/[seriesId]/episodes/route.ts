import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: { seriesId: string } }
) {
    try {
        const { seriesId } = params;
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');
        
        let userId: string | null = null;
        if (token) {
            const { verifyToken } = await import('@/lib/auth');
            const payload = verifyToken(token);
            if (payload) {
                userId = payload.userId;
            }
        }

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Try to convert seriesId to ObjectId
        let seriesObjectId: ObjectId;
        try {
            seriesObjectId = new ObjectId(seriesId);
        } catch (error) {
            return NextResponse.json({ error: 'Invalid series ID format' }, { status: 400 });
        }

        // Get all episodes for this series
        let episodes = await db.collection('anime_episodes')
            .find({ seriesId: seriesObjectId })
            .sort({ seasonNumber: 1, episodeNumber: 1 })
            .toArray();

        // If no episodes found, try with string format
        if (episodes.length === 0) {
            episodes = await db.collection('anime_episodes')
                .find({ seriesId: seriesId })
                .sort({ seasonNumber: 1, episodeNumber: 1 })
                .toArray();
        }

        // Get watch history for user if authenticated
        let watchHistory: any[] = [];
        if (userId) {
            watchHistory = await db.collection('anime_watch_history')
                .find({ userId, seriesId: seriesObjectId })
                .toArray();
        }

        // Check if user is creator/admin (can see scheduled episodes)
        let canViewScheduled = false;
        if (userId) {
            const series = await db.collection('anime_series').findOne({ _id: seriesObjectId });
            const isCreator = series && (series.creatorId?.toString() === userId || series.uploaderId === userId);
            const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
            canViewScheduled = user?.role === 'admin' || isCreator || false;
        }

        // Filter episodes: hide scheduled episodes from non-creators/admin
        const now = new Date();
        let visibleEpisodes = episodes;
        if (!canViewScheduled) {
            visibleEpisodes = episodes.filter((ep: any) => {
                if (ep.isScheduled && ep.scheduledAt) {
                    const scheduledDate = new Date(ep.scheduledAt);
                    return scheduledDate <= now; // Only show if scheduled time has passed
                }
                return true;
            });
        }

        // Enrich episodes with watch progress
        const enrichedEpisodes = visibleEpisodes.map((episode: any) => {
            const history = watchHistory.find(wh => wh.episodeId === episode._id.toString());
            const scheduledDate = episode.scheduledAt ? new Date(episode.scheduledAt) : null;
            const isScheduled = episode.isScheduled && scheduledDate && scheduledDate > now;
            
            return {
                _id: episode._id.toString(),
                episodeNumber: episode.episodeNumber,
                title: episode.title || `Episode ${episode.episodeNumber}`,
                description: episode.description,
                thumbnail: episode.thumbnail || episode.coverImage,
                duration: episode.duration,
                airDate: episode.airDate,
                releaseDate: episode.releaseDate,
                scheduledAt: episode.scheduledAt,
                isScheduled: isScheduled,
                status: episode.status || (isScheduled ? 'scheduled' : 'published'),
                watched: history ? history.completed : false,
                watchedPercentage: history && episode.duration 
                    ? Math.round((history.lastPosition / episode.duration) * 100) 
                    : 0,
                lastPosition: history?.lastPosition || 0,
                // Include audio tracks and subtitles for episode list
                audioTracks: episode.audioTracks || [],
                subtitles: episode.subtitles || [],
                availableTracks: {
                    audio: episode.audioTracks || [],
                    subtitles: episode.subtitles || [],
                },
            };
        });

        return NextResponse.json({ 
            episodes: enrichedEpisodes,
            totalEpisodes: enrichedEpisodes.length,
        });
    } catch (error: any) {
        console.error('Error fetching episodes:', error);
        return NextResponse.json(
            { error: 'Failed to fetch episodes', details: error.message },
            { status: 500 }
        );
    }
}
