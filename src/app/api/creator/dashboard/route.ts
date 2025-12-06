import { NextRequest, NextResponse } from 'next/server';
import { requireCreator } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
    try {
        const user = await requireCreator(request);
        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Get creator's manga
        const manga = await db.collection('manga')
            .find({ uploaderId: user._id })
            .sort({ createdAt: -1 })
            .toArray();

        // Calculate stats
        const totalManga = manga.length;
        let totalChapters = 0;
        let totalViews = 0;
        let totalLikes = 0;

        for (const m of manga) {
            const chapters = await db.collection('chapters')
                .find({ mangaId: m._id.toString() })
                .toArray();

            totalChapters += chapters.length;
            totalViews += m.views || 0;
            totalLikes += m.likes || 0;
        }

        // Get recent manga with additional info
        const series = await Promise.all(
            manga.map(async (m) => {
                const chapterCount = await db.collection('chapters')
                    .countDocuments({ mangaId: m._id.toString() });

                return {
                    _id: m._id.toString(),
                    title: m.title,
                    description: m.description || '',
                    status: m.status || 'draft',
                    coverImage: typeof m.coverImage === 'string'
                        ? m.coverImage
                        : m.coverImage?.secure_url || '',
                    views: m.views || 0,
                    likes: Array.isArray(m.likes) ? m.likes.length : m.likes || 0,
                    genres: m.genres || [],
                    chapterCount,
                    createdAt: m.createdAt,
                    updatedAt: m.updatedAt || m.createdAt,
                    lastPublishedAt: m.lastPublishedAt || null
                };
            })
        );

        return NextResponse.json({
            stats: {
                totalManga,
                totalChapters,
                totalViews,
                totalLikes,
            },
            series,
        });

    } catch (error) {
        console.error('Creator dashboard error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch creator dashboard data' },
            { status: 500 }
        );
    }
}

