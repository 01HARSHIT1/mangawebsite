import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    try {
        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Get popular anime based on rating and total view count
        // Calculate popularity score: (rating * 40%) + (viewCount * 60%)
        const allAnime = await db.collection('anime_series')
            .find({})
            .toArray();

        // Get view counts from watch_history
        const viewCounts = await db.collection('anime_watch_history')
            .aggregate([
                {
                    $group: {
                        _id: '$seriesId',
                        totalViewCount: { $sum: 1 }
                    }
                }
            ])
            .toArray();

        const viewCountMap = new Map();
        viewCounts.forEach((item: any) => {
            viewCountMap.set(item._id.toString(), item.totalViewCount);
        });

        // Calculate popularity scores
        const animeWithScores = allAnime.map((series: any) => {
            const viewCount = viewCountMap.get(series._id.toString()) || series.viewCount || 0;
            const rating = series.rating || 0;
            // Normalize: rating (0-10) * 0.4, views (0-1000) * 0.6
            const normalizedRating = rating * 10; // 0-10 scale
            const normalizedViews = Math.min(viewCount / 10, 100); // Max 100
            const popularityScore = (normalizedRating * 0.4) + (normalizedViews * 0.6);
            
            return {
                ...series,
                popularityScore,
                viewCount: viewCount
            };
        });

        // Sort by popularity score and limit
        const popularAnime = animeWithScores
            .sort((a: any, b: any) => b.popularityScore - a.popularityScore)
            .slice(0, 20);

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
