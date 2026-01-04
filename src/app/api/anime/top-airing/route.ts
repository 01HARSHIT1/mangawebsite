import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Get top airing anime (ongoing, sorted by popularity)
        const topAiring = await db.collection('anime_series')
            .find({ status: 'ongoing' })
            .sort({ 
                viewCount: -1,
                rating: -1,
                createdAt: -1 
            })
            .limit(20)
            .toArray();

        const animeWithCounts = await Promise.all(
            topAiring.map(async (series) => {
                const episodeCount = await db.collection('anime_episodes')
                    .countDocuments({ seriesId: series._id.toString() });
                
                return {
                    _id: series._id.toString(),
                    title: series.title,
                    coverImage: series.coverImage,
                    genres: series.genres || [],
                    rating: series.rating || 0,
                    year: series.year || new Date().getFullYear(),
                    episodeCount: episodeCount || series.episodeCount || 0,
                    viewCount: series.viewCount || 0,
                };
            })
        );

        return NextResponse.json({ anime: animeWithCounts });
    } catch (error) {
        console.error('Error fetching top airing anime:', error);
        return NextResponse.json({ anime: [] });
    }
}

