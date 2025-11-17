import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
    try {
        await requireAdmin(request);
        const client = await clientPromise;
        const db = client.db();

        const creators = await db.collection('users').find({ role: 'creator' }).toArray();

        const creatorsWithStats = await Promise.all(creators.map(async (creator: any) => {
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
                email: creator.email,
                isVerified: creator.isVerified || false,
                createdAt: creator.createdAt,
                seriesCount,
                totalViews,
                earnings,
                revenueShare: creator.revenueShare || 70,
                uploadLimit: creator.uploadLimit || 10,
            };
        }));

        return NextResponse.json({ creators: creatorsWithStats });
    } catch (error) {
        console.error('Failed to fetch creators:', error);
        return NextResponse.json(
            { error: 'Failed to fetch creators' },
            { status: 500 }
        );
    }
}

