import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const user = await requireAuth(request);
        const { subscription } = await request.json();

        if (!subscription) {
            return NextResponse.json(
                { error: 'Subscription data required' },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Store or update push subscription for user
        await db.collection('push_subscriptions').updateOne(
            { userId: user._id },
            {
                $set: {
                    userId: user._id,
                    subscription,
                    createdAt: new Date(),
                    active: true
                }
            },
            { upsert: true }
        );

        return NextResponse.json({
            success: true,
            message: 'Push notification subscription saved'
        });

    } catch (error) {
        console.error('Error saving push subscription:', error);
        return NextResponse.json(
            { error: 'Failed to save subscription' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const user = await requireAuth(request);
        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Deactivate push subscription
        await db.collection('push_subscriptions').updateOne(
            { userId: user._id },
            {
                $set: {
                    active: false,
                    unsubscribedAt: new Date()
                }
            }
        );

        return NextResponse.json({
            success: true,
            message: 'Push notifications disabled'
        });

    } catch (error) {
        console.error('Error unsubscribing from push notifications:', error);
        return NextResponse.json(
            { error: 'Failed to unsubscribe' },
            { status: 500 }
        );
    }
}
