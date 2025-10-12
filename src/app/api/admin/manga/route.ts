import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
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

        // Get query parameters
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const status = searchParams.get('status') || '';
        const creatorId = searchParams.get('creatorId') || '';

        // Connect to database
        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Build query
        const query: any = {};
        if (status) query.status = status;
        if (creatorId) query.uploaderId = creatorId;

        // Fetch manga with creator info
        const manga = await db.collection('manga')
            .find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .toArray();

        // Get creator info for each manga
        const mangaWithCreators = await Promise.all(
            manga.map(async (m) => {
                const creator = await db.collection('users').findOne({ _id: m.uploaderId });
                return {
                    ...m,
                    _id: m._id.toString(),
                    creator: creator?.nickname || creator?.username || 'Unknown',
                    creatorId: creator?._id?.toString() || ''
                };
            })
        );

        const total = await db.collection('manga').countDocuments(query);

        return NextResponse.json({
            manga: mangaWithCreators,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Admin manga fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch manga' },
            { status: 500 }
        );
    }
}
