import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    try {
        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Get featured anime (manually curated or highest rated)
        // Check for featured anime that hasn't expired
        const now = new Date();
        const featuredAnime = await db.collection('anime_series')
            .findOne({
                isFeatured: true,
                $or: [
                    { featuredUntil: { $exists: false } },
                    { featuredUntil: null },
                    { featuredUntil: { $gte: now } }
                ],
                isHidden: { $ne: true },
                isSuppressed: { $ne: true }
            }, { sort: { manualRank: 1, rating: -1, year: -1 } }) 
            || await db.collection('anime_series')
                .findOne({
                    isHidden: { $ne: true },
                    isSuppressed: { $ne: true }
                }, { sort: { rating: -1, year: -1 } });

        if (!featuredAnime) {
            // Return mock data if no anime in database yet
            return NextResponse.json({
                anime: {
                    _id: '1',
                    title: 'Demon Slayer: Kimetsu no Yaiba',
                    description: 'Tanjiro Kamado sets out to become a demon slayer to avenge his family and cure his sister Nezuko.',
                    coverImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400',
                    bannerImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1920',
                    genres: ['Action', 'Supernatural'],
                    rating: 9.2,
                    year: 2019,
                    status: 'completed',
                    episodeCount: 44,
                    latestEpisode: 44,
                }
            });
        }

        // Get episode count
        const episodeCount = await db.collection('anime_episodes')
            .countDocuments({ seriesId: featuredAnime._id.toString() });

        return NextResponse.json({
            anime: {
                _id: featuredAnime._id.toString(),
                title: featuredAnime.title,
                description: featuredAnime.description,
                coverImage: featuredAnime.coverImage,
                bannerImage: featuredAnime.bannerImage || featuredAnime.coverImage,
                genres: featuredAnime.genres || [],
                rating: featuredAnime.rating || 0,
                year: featuredAnime.year || new Date().getFullYear(),
                status: featuredAnime.status || 'ongoing',
                episodeCount: episodeCount || featuredAnime.episodeCount || 0,
                latestEpisode: featuredAnime.latestEpisode || episodeCount,
            }
        });
    } catch (error) {
        console.error('Error fetching featured anime:', error);
        return NextResponse.json({ error: 'Failed to fetch featured anime' }, { status: 500 });
    }
}

