import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

// POST: Subscribe to episode notifications for a series
export async function POST(request: NextRequest) {
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
        const { seriesId, enabled = true } = body;

        if (!seriesId) {
            return NextResponse.json({ error: 'Series ID is required' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        const now = new Date();

        // Subscribe/unsubscribe from episode notifications
        await db.collection('anime_notification_subscriptions').updateOne(
            {
                userId: new ObjectId(userId),
                seriesId: seriesId.toString(),
            },
            {
                $set: {
                    enabled,
                    updatedAt: now,
                },
                $setOnInsert: {
                    userId: new ObjectId(userId),
                    seriesId: seriesId.toString(),
                    enabled,
                    createdAt: now,
                },
            },
            { upsert: true }
        );

        return NextResponse.json({
            success: true,
            message: enabled ? 'Subscribed to episode notifications' : 'Unsubscribed from episode notifications',
        });
    } catch (error) {
        console.error('Error subscribing to notifications:', error);
        return NextResponse.json(
            { error: 'Failed to subscribe to notifications' },
            { status: 500 }
        );
    }
}

// GET: Get user's notification subscriptions
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

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        const subscriptions = await db.collection('anime_notification_subscriptions')
            .find({ userId: new ObjectId(userId), enabled: true })
            .toArray();

        return NextResponse.json({
            subscriptions: subscriptions.map((sub: any) => ({
                seriesId: sub.seriesId,
                enabled: sub.enabled,
                createdAt: sub.createdAt,
            })),
        });
    } catch (error) {
        console.error('Error fetching notification subscriptions:', error);
        return NextResponse.json(
            { error: 'Failed to fetch subscriptions' },
            { status: 500 }
        );
    }
}
