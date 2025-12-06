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

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        const notifications = await db.collection('notifications')
            .find({ userId: payload.userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();

        return NextResponse.json({
            notifications: notifications.map((n: any) => ({
                _id: n._id.toString(),
                type: n.type,
                title: n.title,
                message: n.message,
                read: n.read || false,
                createdAt: n.createdAt,
            })),
            total: notifications.length,
        });
    } catch (error: any) {
        console.error('Error fetching notifications:', error);
        return NextResponse.json(
            { error: 'Failed to fetch notifications' },
            { status: 500 }
        );
    }
}
