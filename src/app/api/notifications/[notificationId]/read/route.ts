import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';

/**
 * Mark notification as read
 */

export const dynamic = 'force-dynamic';

export async function PUT(
    request: NextRequest,
    { params }: { params: { notificationId: string } }
) {
    try {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = verifyToken(token);
        if (!payload) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const { notificationId } = params;

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        await db.collection('notifications').updateOne(
            {
                _id: new ObjectId(notificationId),
                userId: payload.userId,
            },
            {
                $set: {
                    read: true,
                    readAt: new Date(),
                    updatedAt: new Date(),
                },
            }
        );

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error marking notification as read:', error);
        return NextResponse.json(
            { error: 'Failed to mark notification as read' },
            { status: 500 }
        );
    }
}

