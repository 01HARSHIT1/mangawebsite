import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';

/**
 * Notification Settings API
 * Get and update user notification preferences
 */

export const dynamic = 'force-dynamic';

// GET /api/notifications/settings - Get notification preferences
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

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        const user = await db.collection('users').findOne({ 
            _id: payload.userId 
        });

        const preferences = user?.notificationPreferences || {
            email: true,
            push: true,
            newEpisodes: true,
            recommendations: true,
            moderation: true,
            payouts: true,
            comments: true,
        };

        return NextResponse.json({ preferences });
    } catch (error: any) {
        console.error('Error fetching notification settings:', error);
        return NextResponse.json(
            { error: 'Failed to fetch settings' },
            { status: 500 }
        );
    }
}

// PUT /api/notifications/settings - Update notification preferences
export async function PUT(request: NextRequest) {
    try {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = verifyToken(token);
        if (!payload) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const body = await request.json();
        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Get current preferences
        const user = await db.collection('users').findOne({ 
            _id: payload.userId 
        });

        const currentPreferences = user?.notificationPreferences || {
            email: true,
            push: true,
            newEpisodes: true,
            recommendations: true,
            moderation: true,
            payouts: true,
            comments: true,
        };

        // Update preferences
        const updatedPreferences = {
            ...currentPreferences,
            ...body,
        };

        await db.collection('users').updateOne(
            { _id: payload.userId },
            {
                $set: {
                    notificationPreferences: updatedPreferences,
                    updatedAt: new Date(),
                },
            }
        );

        return NextResponse.json({
            success: true,
            preferences: updatedPreferences,
        });
    } catch (error: any) {
        console.error('Error updating notification settings:', error);
        return NextResponse.json(
            { error: 'Failed to update settings' },
            { status: 500 }
        );
    }
}

