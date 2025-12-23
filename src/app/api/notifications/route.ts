import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';

/**
 * Notifications API
 * Get user notifications
 */

export const dynamic = 'force-dynamic';

// GET /api/notifications - Get user notifications
export async function GET(request: NextRequest) {
    try {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = verifyToken(token);
        if (!payload) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const limit = parseInt(searchParams.get('limit') || '50', 10);
        const skip = parseInt(searchParams.get('skip') || '0', 10);
        const unreadOnly = searchParams.get('unread') === 'true';

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Build query
        const query: any = { userId: payload.userId };
        if (unreadOnly) {
            query.read = { $ne: true };
        }

        const notifications = await db.collection('notifications')
            .find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();

        const total = await db.collection('notifications').countDocuments(query);

        return NextResponse.json({
            notifications: notifications.map((n: any) => ({
                _id: n._id.toString(),
                type: n.type,
                title: n.title,
                message: n.message,
                read: n.read || false,
                createdAt: n.createdAt,
            })),
            pagination: {
                total,
                limit,
                skip,
                hasMore: skip + limit < total,
            },
        });
    } catch (error: any) {
        console.error('Error fetching notifications:', error);
        return NextResponse.json(
            { error: 'Failed to fetch notifications' },
            { status: 500 }
        );
    }
}
