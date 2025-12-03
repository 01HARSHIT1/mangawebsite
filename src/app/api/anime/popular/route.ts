import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
    try {
        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Get popular anime (high rating, high view count, or manually curated)
        const popularAnime = await db.collection('anime_series')
            .find({})
            .sort({ rating: -1, year: -1 })
            .limit(20)
            .toArray();

        if (popularAnime.length === 0) {
            // Return mock data if no anime in database
            return NextResponse.json({ anime: getMockPopularAnime() });
        }

        // Get episode counts for each series
        const animeWithCounts = await Promise.all(
            popularAnime.map(async (series) => {
                const episodeCount = await db.collection('anime_episodes')
                    .countDocuments({ seriesId: series._id.toString() });
                return {
                    _id: series._id.toString(),
                    title: series.title,
                    description: series.description || '',
                    coverImage: series.coverImage,
                    bannerImage: series.bannerImage || series.coverImage,
                    genres: series.genres || [],
                    rating: series.rating || 0,
                    year: series.year || new Date().getFullYear(),
                    status: series.status || 'ongoing',
                    episodeCount: episodeCount || series.episodeCount || 0,
                    latestEpisode: series.latestEpisode || episodeCount,
                };
            })
        );

        return NextResponse.json({ anime: animeWithCounts });
    } catch (error) {
        console.error('Error fetching popular anime:', error);
        return NextResponse.json({ error: 'Failed to fetch popular anime' }, { status: 500 });
    }
}

function getMockPopularAnime() {
    return [
        {
            _id: '1',
            title: 'One Piece',
            coverImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400',
            genres: ['Action', 'Adventure', 'Fantasy'],
            rating: 9.5,
            year: 1999,
            status: 'ongoing',
            episodeCount: 1000,
        },
        {
            _id: '2',
            title: 'Naruto Shippuden',
            coverImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400',
            genres: ['Action', 'Fantasy', 'Adventure'],
            rating: 9.0,
            year: 2007,
            status: 'completed',
            episodeCount: 500,
        },
        {
            _id: '3',
            title: 'Dragon Ball Super',
            coverImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400',
            genres: ['Action', 'Adventure', 'Fantasy'],
            rating: 8.5,
            year: 2015,
            status: 'completed',
            episodeCount: 131,
        },
        {
            _id: '4',
            title: 'My Hero Academia',
            coverImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400',
            genres: ['Action', 'Superpower'],
            rating: 9.1,
            year: 2016,
            status: 'ongoing',
            episodeCount: 100,
        },
    ];
}
