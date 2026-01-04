import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Get most favourite anime (by favorite count or rating)
        // You can add a favorites collection or use rating as proxy
        const mostFavourite = await db.collection('anime_series')
            .find({})
            .sort({ 
                favoriteCount: -1, // If you have this field
                rating: -1,
                viewCount: -1 
            })
            .limit(20)
            .toArray();

        const animeWithCounts = await Promise.all(
            mostFavourite.map(async (series) => {
                const episodeCount = await db.collection('anime_episodes')
                    .countDocuments({ seriesId: series._id.toString() });
                
                // Count favorites from my_list collection
                const favoriteCount = await db.collection('anime_my_list')
                    .countDocuments({ 
                        seriesId: series._id.toString(),
                        type: 'favorite' 
                    });
                
                return {
                    _id: series._id.toString(),
                    title: series.title,
                    coverImage: series.coverImage,
                    genres: series.genres || [],
                    rating: series.rating || 0,
                    year: series.year || new Date().getFullYear(),
                    episodeCount: episodeCount || series.episodeCount || 0,
                    favoriteCount: favoriteCount || series.favoriteCount || 0,
                };
            })
        );

        return NextResponse.json({ anime: animeWithCounts });
    } catch (error) {
        console.error('Error fetching most favourite anime:', error);
        return NextResponse.json({ anime: [] });
    }
}

