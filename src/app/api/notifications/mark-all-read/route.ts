import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const user = await requireAuth(request);
        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Mark all user's notifications as read
        const result = await db.collection('notifications').updateMany(
            {
                userId: user._id,
                read: { $ne: true }
            },
            {
                $set: {
                    read: true,
                    updatedAt: new Date()
                }
            }
        );

        return NextResponse.json({
            success: true,
            updatedCount: result.modifiedCount
        });

    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        return NextResponse.json(
            { error: 'Failed to mark notifications as read' },
            { status: 500 }
        );
    }
}
