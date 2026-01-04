import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    try {
        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Get trending anime based on recent views (last 7 days) and rating
        // Calculate trending score: (recent views * 0.6) + (rating * 0.4)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // Get all anime with recent views from watch_history
        const recentViews = await db.collection('anime_watch_history')
            .aggregate([
                {
                    $match: {
                        watchedAt: { $gte: sevenDaysAgo }
                    }
                },
                {
                    $group: {
                        _id: '$seriesId',
                        recentViewCount: { $sum: 1 }
                    }
                }
            ])
            .toArray();

        const viewCountMap = new Map();
        recentViews.forEach((item: any) => {
            viewCountMap.set(item._id.toString(), item.recentViewCount);
        });

        // Get all anime and calculate trending score
        const allAnime = await db.collection('anime_series')
            .find({})
            .toArray();

        const animeWithScores = allAnime.map((series: any) => {
            const recentViews = viewCountMap.get(series._id.toString()) || 0;
            const rating = series.rating || 0;
            // Normalize scores: views (0-100 scale), rating (0-10 scale)
            const normalizedViews = Math.min(recentViews / 10, 100); // Max 100
            const normalizedRating = rating * 10; // 0-10 scale
            const trendingScore = (normalizedViews * 0.6) + (normalizedRating * 0.4);
            
            return {
                ...series,
                trendingScore,
                recentViewCount: recentViews
            };
        });

        // Sort by trending score and limit
        const trendingAnime = animeWithScores
            .sort((a: any, b: any) => b.trendingScore - a.trendingScore)
            .slice(0, 20);

        if (trendingAnime.length === 0) {
            // Return mock data if no anime in database
            return NextResponse.json({ anime: getMockTrendingAnime() });
        }

        // Get episode counts for each series
        const animeWithCounts = await Promise.all(
            trendingAnime.map(async (series) => {
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
        console.error('Error fetching trending anime:', error);
        return NextResponse.json({ error: 'Failed to fetch trending anime' }, { status: 500 });
    }
}

function getMockTrendingAnime() {
    return [
            {
                _id: '1',
                title: 'Demon Slayer: Kimetsu no Yaiba',
                description: 'Tanjiro Kamado sets out to become a demon slayer to avenge his family and cure his sister.',
                coverImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400',
                bannerImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1920',
                genres: ['Action', 'Supernatural'],
                rating: 9.2,
                year: 2019,
                status: 'completed' as const,
                episodeCount: 44,
                latestEpisode: 44,
            },
            {
                _id: '2',
                title: 'Attack on Titan',
                description: 'Humanity fights against giant humanoid Titans in a post-apocalyptic world.',
                coverImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400',
                bannerImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1920',
                genres: ['Action', 'Drama'],
                rating: 9.5,
                year: 2013,
                status: 'completed' as const,
                episodeCount: 75,
                latestEpisode: 75,
            },
            {
                _id: '3',
                title: 'Jujutsu Kaisen',
                description: 'A high school student who swallows a cursed talisman becomes embroiled in a dark world of curses and sorcerers.',
                coverImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400',
                bannerImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1920',
                genres: ['Action', 'Supernatural'],
                rating: 8.9,
                year: 2020,
                status: 'ongoing' as const,
                episodeCount: 47,
                latestEpisode: 47,
            },
            {
                _id: '4',
                title: 'Spy x Family',
                description: 'A spy, an assassin, and a psychic adopt a fake family to maintain peace.',
                coverImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400',
                bannerImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1920',
                genres: ['Action', 'Comedy', 'Slice of Life'],
                rating: 8.8,
                year: 2022,
                status: 'ongoing' as const,
                episodeCount: 37,
                latestEpisode: 37,
            },
            {
                _id: '5',
                title: 'Chainsaw Man',
                description: 'Denji merges with his pet devil Pochita to become a Chainsaw Man.',
                coverImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400',
                bannerImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1920',
                genres: ['Action', 'Dark Fantasy'],
                rating: 8.7,
                year: 2022,
                status: 'completed' as const,
                episodeCount: 12,
                latestEpisode: 12,
            },
    ];
}

