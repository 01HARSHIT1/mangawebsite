import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    try {
        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Get recently added anime (by createdAt, updatedAt, or releaseDate)
        // Prioritize: createdAt > updatedAt > releaseDate
        const recentAnime = await db.collection('anime_series')
            .find({})
            .sort({ 
                createdAt: -1,
                updatedAt: -1,
                releaseDate: -1
            })
            .limit(20)
            .toArray();

        // If createdAt doesn't exist, sort by _id (which includes timestamp in MongoDB ObjectId)
        if (recentAnime.length > 0 && !recentAnime[0].createdAt) {
            recentAnime.sort((a: any, b: any) => {
                // Compare ObjectIds (they contain timestamp)
                return b._id.toString().localeCompare(a._id.toString());
            });
        }

        if (recentAnime.length === 0) {
            // Return mock data if no anime in database
            return NextResponse.json({ anime: getMockRecentAnime() });
        }

        // Get episode counts for each series
        const animeWithCounts = await Promise.all(
            recentAnime.map(async (series) => {
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
        console.error('Error fetching recent anime:', error);
        return NextResponse.json({ error: 'Failed to fetch recent anime' }, { status: 500 });
    }
}

function getMockRecentAnime() {
    return [
        {
            _id: '1',
            title: 'Solo Leveling',
            coverImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400',
            genres: ['Action', 'Fantasy'],
            rating: 8.5,
            year: 2024,
            status: 'ongoing',
            episodeCount: 12,
            latestEpisode: 12,
        },
        {
            _id: '2',
            title: 'Mashle: Magic and Muscles',
            coverImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400',
            genres: ['Action', 'Comedy', 'Fantasy'],
            rating: 8.2,
            year: 2023,
            status: 'ongoing',
            episodeCount: 24,
            latestEpisode: 24,
        },
        {
            _id: '3',
            title: 'The Apothecary Diaries',
            coverImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400',
            genres: ['Mystery', 'Historical', 'Drama'],
            rating: 8.7,
            year: 2023,
            status: 'completed',
            episodeCount: 24,
            latestEpisode: 24,
        },
    ];
}
