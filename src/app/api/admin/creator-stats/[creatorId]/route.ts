import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';


export async function GET(
    request: NextRequest,
    { params }: { params: { creatorId: string } }
) {
    try {
        // Verify admin authentication
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await verifyToken(token);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        // Connect to database
        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Get creator's manga
        const manga = await db.collection('manga')
            .find({ uploaderId: params.creatorId })
            .toArray();

        // Calculate stats
        const totalManga = manga.length;
        const totalChapters = manga.reduce((sum, m) => sum + (m.chapters || 0), 0);
        const totalViews = manga.reduce((sum, m) => sum + (m.views || 0), 0);
        const totalLikes = manga.reduce((sum, m) => sum + (m.likes?.length || 0), 0);

        // Get comments count
        const mangaIds = manga.map(m => m._id.toString());
        const totalComments = await db.collection('comments')
            .countDocuments({ mangaId: { $in: mangaIds } });

        // Get followers count
        const followersCount = await db.collection('follows')
            .countDocuments({ followingId: params.creatorId });

        return NextResponse.json({
            totalManga,
            totalChapters,
            totalViews,
            totalLikes,
            totalComments,
            followers: followersCount
        });
    } catch (error) {
        console.error('Admin creator stats error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch creator stats' },
            { status: 500 }
        );
    }
}
