import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

/**
 * Get episodes for a specific season
 * Returns episodes with watch progress for authenticated users
 */

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: { seasonId: string } }
) {
    try {
        const { seasonId } = params;
        const searchParams = request.nextUrl.searchParams;
        const seriesId = searchParams.get('seriesId');
        const seasonNumber = parseInt(searchParams.get('seasonNumber') || '1', 10);
        
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

        // Build query
        const query: any = {};
        if (seriesId) {
            query.seriesId = new ObjectId(seriesId);
        }
        if (seasonNumber) {
            query.seasonNumber = seasonNumber;
        }

        // Get episodes
        const episodes = await db.collection('anime_episodes')
            .find(query)
            .sort({ episodeNumber: 1 })
            .toArray();

        // Get watch history for user if authenticated
        let watchHistory: any[] = [];
        if (userId && seriesId) {
            watchHistory = await db.collection('anime_watch_history')
                .find({ userId, seriesId: new ObjectId(seriesId) })
                .toArray();
        }

        // Enrich episodes with watch progress
        const enrichedEpisodes = episodes.map((episode: any) => {
            const history = watchHistory.find(wh => wh.episodeId === episode._id.toString());
            return {
                _id: episode._id.toString(),
                episodeNumber: episode.episodeNumber,
                title: episode.title,
                description: episode.description,
                thumbnail: episode.thumbnail,
                duration: episode.duration,
                airDate: episode.airDate,
                releaseDate: episode.releaseDate,
                isPreview: episode.isPreview || false,
                watched: history ? history.completed : false,
                watchedPercentage: history ? Math.round((history.lastPosition / (episode.duration || 1)) * 100) : 0,
                lastPosition: history?.lastPosition || 0,
            };
        });

        return NextResponse.json({ 
            episodes: enrichedEpisodes,
            seasonNumber,
            totalEpisodes: enrichedEpisodes.length,
        });
    } catch (error: any) {
        console.error('Error fetching season episodes:', error);
        return NextResponse.json(
            { error: 'Failed to fetch episodes', details: error.message },
            { status: 500 }
        );
    }
}

