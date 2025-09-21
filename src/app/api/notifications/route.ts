import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
    try {
        const user = await requireAuth(request);
        const client = await clientPromise;
        const db = client.db('mangawebsite');

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const unreadOnly = searchParams.get('unread') === 'true';

        // Build query
        const query: any = { userId: user._id };
        if (unreadOnly) {
            query.read = false;
        }

        // Get notifications with pagination
        const notifications = await db.collection('notifications')
            .find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .toArray();

        // Get total count
        const total = await db.collection('notifications').countDocuments(query);

        // Transform notifications
        const transformedNotifications = notifications.map(n => ({
            _id: n._id.toString(),
            userId: n.userId,
            type: n.type,
            title: n.title,
            message: n.message,
            read: n.read || false,
            createdAt: n.createdAt,
            data: n.data || {}
        }));

        return NextResponse.json({
            notifications: transformedNotifications,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Error fetching notifications:', error);
        return NextResponse.json(
            { error: 'Failed to fetch notifications' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await requireAuth(request);
        const { type, title, message, targetUserId, data } = await request.json();

        if (!type || !title || !message) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Create notification
        const notification = {
            userId: targetUserId || user._id,
            type,
            title,
            message,
            read: false,
            createdAt: new Date(),
            data: data || {}
        };

        const result = await db.collection('notifications').insertOne(notification);

        return NextResponse.json({
            success: true,
            notificationId: result.insertedId.toString()
        });

    } catch (error) {
        console.error('Error creating notification:', error);
        return NextResponse.json(
            { error: 'Failed to create notification' },
            { status: 500 }
        );
    }
}
