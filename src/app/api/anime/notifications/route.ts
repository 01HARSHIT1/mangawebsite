import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

// GET: Get user's episode notifications
export async function GET(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
        const payload = jwt.verify(token, JWT_SECRET) as any;
        const userId = payload.userId || payload._id;

        if (!userId) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '20', 10);
        const unreadOnly = searchParams.get('unreadOnly') === 'true';

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        const query: any = { userId: new ObjectId(userId) };
        if (unreadOnly) {
            query.read = false;
        }

        const notifications = await db.collection('anime_notifications')
            .find(query)
            .sort({ createdAt: -1 })
            .limit(limit)
            .toArray();

        const unreadCount = await db.collection('anime_notifications')
            .countDocuments({ userId: new ObjectId(userId), read: false });

        return NextResponse.json({
            notifications: notifications.map((notif: any) => ({
                _id: notif._id.toString(),
                type: notif.type,
                seriesId: notif.seriesId,
                seriesTitle: notif.seriesTitle,
                episodeId: notif.episodeId,
                episodeNumber: notif.episodeNumber,
                episodeTitle: notif.episodeTitle,
                message: notif.message,
                read: notif.read || false,
                createdAt: notif.createdAt,
            })),
            unreadCount,
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return NextResponse.json(
            { error: 'Failed to fetch notifications' },
            { status: 500 }
        );
    }
}

// PUT: Mark notification as read
export async function PUT(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
        const payload = jwt.verify(token, JWT_SECRET) as any;
        const userId = payload.userId || payload._id;

        if (!userId) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const body = await request.json();
        const { notificationId, markAllAsRead = false } = body;

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        if (markAllAsRead) {
            await db.collection('anime_notifications').updateMany(
                { userId: new ObjectId(userId), read: false },
                { $set: { read: true, readAt: new Date() } }
            );
        } else if (notificationId) {
            await db.collection('anime_notifications').updateOne(
                {
                    _id: new ObjectId(notificationId),
                    userId: new ObjectId(userId),
                },
                { $set: { read: true, readAt: new Date() } }
            );
        } else {
            return NextResponse.json({ error: 'Notification ID or markAllAsRead required' }, { status: 400 });
        }

        return NextResponse.json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
        console.error('Error updating notification:', error);
        return NextResponse.json(
            { error: 'Failed to update notification' },
            { status: 500 }
        );
    }
}
