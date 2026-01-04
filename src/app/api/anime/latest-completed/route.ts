import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Get latest completed anime
        const latestCompleted = await db.collection('anime_series')
            .find({ status: 'completed' })
            .sort({ 
                completedAt: -1, // If you have this field
                updatedAt: -1,
                createdAt: -1 
            })
            .limit(20)
            .toArray();

        const animeWithCounts = await Promise.all(
            latestCompleted.map(async (series) => {
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
                    status: 'completed',
                };
            })
        );

        return NextResponse.json({ anime: animeWithCounts });
    } catch (error) {
        console.error('Error fetching latest completed anime:', error);
        return NextResponse.json({ anime: [] });
    }
}

