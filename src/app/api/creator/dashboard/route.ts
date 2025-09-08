import { NextRequest, NextResponse } from 'next/server';
import { requireCreator } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
    try {
        const user = await requireCreator(request);
        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Get creator's manga
        const manga = await db.collection('manga')
            .find({ creatorId: user._id })
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
        const recentManga = await Promise.all(
            manga.slice(0, 5).map(async (m) => {
                const chapterCount = await db.collection('chapters')
                    .countDocuments({ mangaId: m._id.toString() });

                return {
                    _id: m._id.toString(),
                    title: m.title,
                    coverImage: m.coverImage,
                    views: m.views || 0,
                    likes: m.likes || 0,
                    chapterCount,
                    createdAt: m.createdAt,
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
            recentManga,
        });

    } catch (error) {
        console.error('Creator dashboard error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch creator dashboard data' },
            { status: 500 }
        );
    }
}

