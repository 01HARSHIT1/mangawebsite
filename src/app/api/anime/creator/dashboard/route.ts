import { NextRequest, NextResponse } from 'next/server';
import { requireCreator } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
    try {
        const user = await requireCreator(request);
        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Get creator's anime series (check both creatorId and uploaderId for compatibility)
        const animeSeries = await db.collection('anime_series')
            .find({ 
                $or: [
                    { creatorId: user._id },
                    { uploaderId: user._id.toString() }
                ]
            })
            .sort({ createdAt: -1 })
            .toArray();

        // Calculate stats
        const totalAnime = animeSeries.length;
        let totalEpisodes = 0;
        let totalViews = 0;
        let totalLikes = 0;

        for (const a of animeSeries) {
            const episodes = await db.collection('anime_episodes')
                .find({ seriesId: a._id.toString() })
                .toArray();

            totalEpisodes += episodes.length;
            totalViews += a.views || 0;
            totalLikes += a.likes || 0;
        }

        // Get recent anime with additional info
        const series = await Promise.all(
            animeSeries.map(async (a) => {
                const episodeCount = await db.collection('anime_episodes')
                    .countDocuments({ seriesId: a._id.toString() });

                return {
                    _id: a._id.toString(),
                    title: a.title,
                    description: a.description || a.synopsis || '',
                    status: a.status || 'draft',
                    coverImage: a.coverImage || a.bannerImage || '',
                    views: a.views || 0,
                    likes: a.likes || 0,
                    genres: a.genres || [],
                    episodeCount,
                    createdAt: a.createdAt,
                    updatedAt: a.updatedAt || a.createdAt,
                    lastPublishedAt: a.lastPublishedAt || null
                };
            })
        );

        // Return stats even if no anime uploaded (for dashboard check)
        return NextResponse.json({
            stats: {
                totalAnime,
                totalEpisodes,
                totalViews,
                totalLikes,
            },
            series: series || [],
        });

    } catch (error) {
        console.error('Anime creator dashboard error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch anime creator dashboard data' },
            { status: 500 }
        );
    }
}

