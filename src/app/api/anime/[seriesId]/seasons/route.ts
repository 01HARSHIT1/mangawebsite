import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

/**
 * Get seasons for a series
 * Returns all seasons with episode counts
 */

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

        // Get all episodes grouped by season
        const episodes = await db.collection('anime_episodes')
            .find({ seriesId: new ObjectId(seriesId) })
            .sort({ seasonNumber: 1, episodeNumber: 1 })
            .toArray();

        // Group episodes by season
        const seasonsMap = new Map<number, any>();
        
        episodes.forEach((episode: any) => {
            const seasonNum = episode.seasonNumber || 1;
            if (!seasonsMap.has(seasonNum)) {
                seasonsMap.set(seasonNum, {
                    seasonNumber: seasonNum,
                    episodeCount: 0,
                    episodes: [],
                    releaseDate: null,
                    endDate: null,
                });
            }
            const season = seasonsMap.get(seasonNum);
            season.episodeCount++;
            season.episodes.push({
                _id: episode._id.toString(),
                episodeNumber: episode.episodeNumber,
                title: episode.title,
                thumbnail: episode.thumbnail,
                duration: episode.duration,
                airDate: episode.airDate,
            });
            if (episode.airDate && (!season.releaseDate || new Date(episode.airDate) < new Date(season.releaseDate))) {
                season.releaseDate = episode.airDate;
            }
            if (episode.airDate && (!season.endDate || new Date(episode.airDate) > new Date(season.endDate))) {
                season.endDate = episode.airDate;
            }
        });

        // Get watch history for user if authenticated
        let watchHistory: any[] = [];
        if (userId) {
            watchHistory = await db.collection('anime_watch_history')
                .find({ userId, seriesId: new ObjectId(seriesId) })
                .toArray();
        }

        // Convert to array and add watch progress
        const seasons = Array.from(seasonsMap.values()).map(season => {
            // Calculate watched episodes
            const watchedEpisodes = season.episodes.filter((ep: any) => 
                watchHistory.some(wh => wh.episodeId === ep._id && wh.completed)
            ).length;

            return {
                ...season,
                watchedEpisodes,
                progress: season.episodeCount > 0 
                    ? Math.round((watchedEpisodes / season.episodeCount) * 100) 
                    : 0,
            };
        });

        return NextResponse.json({ seasons });
    } catch (error: any) {
        console.error('Error fetching seasons:', error);
        return NextResponse.json(
            { error: 'Failed to fetch seasons', details: error.message },
            { status: 500 }
        );
    }
}

