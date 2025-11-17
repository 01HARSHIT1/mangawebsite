import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
    try {
        await requireAdmin(request);
        const { searchParams } = new URL(request.url);
        const range = searchParams.get('range') || '30d';

        const client = await clientPromise;
        const db = client.db();

        // Calculate date range
        const now = new Date();
        const startDate = new Date();
        switch (range) {
            case '7d':
                startDate.setDate(now.getDate() - 7);
                break;
            case '30d':
                startDate.setDate(now.getDate() - 30);
                break;
            case '90d':
                startDate.setDate(now.getDate() - 90);
                break;
            case '1y':
                startDate.setFullYear(now.getFullYear() - 1);
                break;
        }

        // Platform Analytics
        const [
            totalVisitors,
            totalViews,
            activeUsers,
            deviceBreakdown,
            visitorsOverTime,
        ] = await Promise.all([
            db.collection('users').countDocuments({ createdAt: { $gte: startDate } }),
            db.collection('manga').aggregate([
                { $group: { _id: null, total: { $sum: '$views' } } }
            ]).toArray().then(r => r[0]?.total || 0),
            db.collection('users').countDocuments({ lastLogin: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
            Promise.resolve([
                { name: 'Mobile', value: 65 },
                { name: 'Desktop', value: 25 },
                { name: 'Tablet', value: 10 },
            ]),
            generateVisitorsOverTime(startDate, now),
        ]);

        // Content Analytics
        const [
            totalManga,
            totalChapters,
            topManga,
        ] = await Promise.all([
            db.collection('manga').countDocuments({ status: { $ne: 'removed' } }),
            db.collection('chapters').countDocuments({ status: { $ne: 'removed' } }),
            db.collection('manga').find(
                { status: { $ne: 'removed' } },
                { sort: { views: -1 }, limit: 10 }
            ).toArray(),
        ]);

        const mangaWithStats = await Promise.all(topManga.map(async (manga: any) => {
            const [likes, comments, chapters] = await Promise.all([
                db.collection('favorites').countDocuments({ mangaId: manga._id.toString() }),
                db.collection('comments').countDocuments({ mangaId: manga._id.toString() }),
                db.collection('chapters').countDocuments({ mangaId: manga._id.toString() }),
            ]);
            return {
                _id: manga._id.toString(),
                title: manga.title,
                views: manga.views || 0,
                likes,
                comments,
                completionRate: chapters > 0 ? Math.round((manga.views || 0) / chapters) : 0,
            };
        }));

        // Creator Analytics
        const creators = await db.collection('users').find({ role: 'creator' }).toArray();
        const creatorStats = await Promise.all(creators.map(async (creator: any) => {
            const [seriesCount, totalViews, earnings] = await Promise.all([
                db.collection('manga').countDocuments({ uploaderId: creator._id.toString() }),
                db.collection('manga').aggregate([
                    { $match: { uploaderId: creator._id.toString() } },
                    { $group: { _id: null, total: { $sum: '$views' } } }
                ]).toArray().then(r => r[0]?.total || 0),
                db.collection('donations').aggregate([
                    { $match: { recipientId: creator._id.toString(), status: 'completed' } },
                    { $group: { _id: null, total: { $sum: '$amount' } } }
                ]).toArray().then(r => r[0]?.total || 0),
            ]);
            return {
                _id: creator._id.toString(),
                username: creator.username || creator.nickname,
                seriesCount,
                totalViews,
                earnings,
            };
        }));

        const topCreators = creatorStats.sort((a, b) => b.totalViews - a.totalViews).slice(0, 10);

        return NextResponse.json({
            platform: {
                totalVisitors,
                totalViews,
                activeUsers,
                avgReadingTime: 12, // Mock data - calculate from reading history
                bounceRate: 35, // Mock data
            },
            visitorsOverTime,
            deviceBreakdown,
            content: {
                totalManga,
                totalChapters,
                avgCompletionRate: 68, // Mock data
                topManga: mangaWithStats,
            },
            creators: {
                totalCreators: creators.length,
                activeCreators: creators.filter((c: any) => c.lastLogin && new Date(c.lastLogin) > startDate).length,
                totalEarnings: creatorStats.reduce((sum, c) => sum + c.earnings, 0),
                avgUploads: Math.round(totalChapters / creators.length) || 0,
                topCreators,
            },
        });
    } catch (error) {
        console.error('Analytics fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch analytics' },
            { status: 500 }
        );
    }
}

function generateVisitorsOverTime(startDate: Date, endDate: Date) {
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const data = [];
    for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        data.push({
            date: date.toISOString().split('T')[0],
            visitors: Math.floor(Math.random() * 500) + 100, // Mock data
        });
    }
    return data;
}

