import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const period = searchParams.get('period') || 'today'; // today, week, month

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Calculate date range based on period
        const now = new Date();
        let startDate = new Date();
        
        if (period === 'today') {
            startDate.setHours(0, 0, 0, 0);
        } else if (period === 'week') {
            startDate.setDate(now.getDate() - 7);
        } else if (period === 'month') {
            startDate.setMonth(now.getMonth() - 1);
        }

        // Get top anime by views/rating (you can adjust the logic)
        const topAnime = await db.collection('anime_series')
            .find({})
            .sort({ 
                rating: -1,
                viewCount: -1,
                createdAt: -1 
            })
            .limit(10)
            .toArray();

        // Get episode counts
        const animeWithCounts = await Promise.all(
            topAnime.map(async (series) => {
                const episodeCount = await db.collection('anime_episodes')
                    .countDocuments({ seriesId: series._id.toString() });
                
                return {
                    _id: series._id.toString(),
                    title: series.title,
                    coverImage: series.coverImage,
                    rating: series.rating || 0,
                    episodeCount: episodeCount || series.episodeCount || 0,
                    viewCount: series.viewCount || 0,
                };
            })
        );

        return NextResponse.json({ anime: animeWithCounts });
    } catch (error) {
        console.error('Error fetching top 10 anime:', error);
        return NextResponse.json({ anime: [] });
    }
}

