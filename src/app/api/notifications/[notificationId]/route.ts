import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export async function PATCH(
    request: NextRequest,
    { params }: { params: { notificationId: string } }
) {
    try {
        const user = await requireAuth(request);
        const { read } = await request.json();

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Update notification
        const result = await db.collection('notifications').updateOne(
            {
                _id: new ObjectId(params.notificationId),
                userId: user._id // Ensure user can only update their own notifications
            },
            {
                $set: {
                    read: Boolean(read),
                    updatedAt: new Date()
                }
            }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json(
                { error: 'Notification not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error updating notification:', error);
        return NextResponse.json(
            { error: 'Failed to update notification' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { notificationId: string } }
) {
    try {
        const user = await requireAuth(request);
        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Delete notification
        const result = await db.collection('notifications').deleteOne({
            _id: new ObjectId(params.notificationId),
            userId: user._id // Ensure user can only delete their own notifications
        });

        if (result.deletedCount === 0) {
            return NextResponse.json(
                { error: 'Notification not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error deleting notification:', error);
        return NextResponse.json(
            { error: 'Failed to delete notification' },
            { status: 500 }
        );
    }
}
