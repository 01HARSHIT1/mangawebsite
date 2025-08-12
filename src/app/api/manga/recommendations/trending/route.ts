import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

// GET: Get trending manga recommendations
export async function GET(req: NextRequest) {
    try {
        const client = await clientPromise;
        const db = client.db();
        const manga = db.collection('manga');
        // Calculate trending score based on recent activity
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const trendingManga = await manga.aggregate([
            {
                $addFields: {
                    // Calculate trending score based on views, likes, and recent activity
                    trendingScore: {
                        $add: [
                            { $multiply: ['$views', 1] },
                            { $multiply: ['$likes', 5] },
                            { $multiply: ['$rating', 100] },
                            { $multiply: ['$chapters', 10] },
                        ],
                    },
                },
            },
            { $sort: { trendingScore: -1 } },
            { $limit: 12 },
            {
                $project: {
                    _id: 1,
                    title: 1,
                    description: 1,
                    coverImage: 1,
                    genres: 1,
                    status: 1,
                    rating: 1,
                    views: 1,
                    likes: 1,
                    chapters: 1,
                    author: 1,
                    year: 1,
                },
            },
        ]).toArray();
        return NextResponse.json({ manga: trendingManga });
    } catch (error) {
        console.error('Error getting trending recommendations:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 