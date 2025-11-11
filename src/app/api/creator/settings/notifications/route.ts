import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { requireCreator } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const DEFAULT_NOTIFICATIONS = {
    newDonations: true,
    newSubscribers: true,
    chapterComments: true,
    payoutUpdates: true,
    platformAnnouncements: false
};

function sanitizeNotificationPayload(body: any) {
    if (!body || typeof body !== 'object') {
        throw new Error('Invalid payload');
    }

    const update: Record<string, boolean> = {};

    for (const key of Object.keys(DEFAULT_NOTIFICATIONS)) {
        if (body[key] !== undefined) {
            update[key] = Boolean(body[key]);
        }
    }

    return update;
}

export async function GET(request: NextRequest) {
    try {
        const user = await requireCreator(request);
        const client = await clientPromise;
        const db = client.db();

        const document = await db.collection('users').findOne(
            { _id: new ObjectId(user._id) },
            { projection: { 'creatorSettings.notifications': 1 } }
        );

        if (!document) {
            return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
        }

        const notifications = {
            ...DEFAULT_NOTIFICATIONS,
            ...(document.creatorSettings?.notifications || {})
        };

        return NextResponse.json({ success: true, notifications });
    } catch (error) {
        console.error('Creator notifications fetch error:', error);
        return NextResponse.json(
            {
                error: 'Failed to load notification settings',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const user = await requireCreator(request);
        const client = await clientPromise;
        const db = client.db();

        const body = await request.json();
        const update = sanitizeNotificationPayload(body);

        const result = await db.collection('users').findOneAndUpdate(
            { _id: new ObjectId(user._id) },
            {
                $set: {
                    'creatorSettings.notifications': {
                        ...DEFAULT_NOTIFICATIONS,
                        ...update
                    },
                    'creatorSettings.notificationsUpdatedAt': new Date()
                }
            },
            {
                returnDocument: 'after',
                projection: { 'creatorSettings.notifications': 1 }
            }
        );

        if (!result.value) {
            return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
        }

        const notifications = {
            ...DEFAULT_NOTIFICATIONS,
            ...(result.value.creatorSettings?.notifications || {})
        };

        return NextResponse.json({ success: true, notifications });
    } catch (error) {
        console.error('Creator notifications update error:', error);
        return NextResponse.json(
            {
                error: 'Failed to update notification settings',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

