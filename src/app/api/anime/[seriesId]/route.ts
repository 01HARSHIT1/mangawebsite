import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function GET(
    request: Request,
    { params }: { params: { seriesId: string } }
) {
    try {
        const { seriesId } = params;

        // Validate ObjectId
        if (!ObjectId.isValid(seriesId)) {
            return NextResponse.json({ error: 'Invalid series ID' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Fetch series from database
        const series = await db.collection('anime_series')
            .findOne({ _id: new ObjectId(seriesId) });

        if (!series) {
            return NextResponse.json({ error: 'Series not found' }, { status: 404 });
        }

        // Get episode count
        const episodeCount = await db.collection('anime_episodes')
            .countDocuments({ seriesId: seriesId });

        // Get view count (if available)
        const viewCount = series.viewCount || 0;

        // Get creator info and verification status
        let creatorInfo = null;
        if (series.creatorId || series.uploaderId) {
            const creatorUserId = series.creatorId || new ObjectId(series.uploaderId);
            const creator = await db.collection('users').findOne({ _id: creatorUserId });
            if (creator) {
                creatorInfo = {
                    name: series.creator || creator.username || 'Unknown',
                    isVerified: creator.isVerified || false,
                };
            } else {
                creatorInfo = {
                    name: series.creator || 'Unknown',
                    isVerified: false,
                };
            }
        }

        return NextResponse.json({
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
            totalEpisodes: episodeCount || series.episodeCount || 0,
            latestEpisode: series.latestEpisode || episodeCount,
            viewCount: viewCount,
            studio: series.studio,
            director: series.director,
            releaseDate: series.releaseDate,
            completedAt: series.completedAt,
            ageRating: series.ageRating || null,
            contentWarnings: series.contentWarnings || [],
            creator: creatorInfo?.name || series.creator || null,
            creatorInfo: creatorInfo,
            createdAt: series.createdAt,
            updatedAt: series.updatedAt,
        });
    } catch (error) {
        console.error('Error fetching series:', error);
        return NextResponse.json({ error: 'Failed to fetch series' }, { status: 500 });
    }
}

