import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';

// Subscribe to a plan
export async function POST(request: NextRequest) {
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
        const { planId, paymentProviderId } = body;

        if (!planId) {
            return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
        }

        const validPlans = ['free', 'premium', 'premium_plus'];
        if (!validPlans.includes(planId)) {
            return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Get plan details
        const plans = {
            free: { name: 'Free', price: 0, features: { adsAllowed: true, maxQuality: '720p' } },
            premium: { name: 'Premium', price: 9.99, features: { adsAllowed: false, maxQuality: '1080p' } },
            premium_plus: { name: 'Premium Plus', price: 14.99, features: { adsAllowed: false, maxQuality: '4K' } },
        };

        const plan = plans[planId as keyof typeof plans];
        if (!plan) {
            return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
        }

        // Calculate subscription end date
        const now = new Date();
        const endsAt = new Date(now);
        endsAt.setMonth(endsAt.getMonth() + 1); // Monthly subscription

        // Update user subscription
        await db.collection('users').updateOne(
            { _id: payload.userId },
            {
                $set: {
                    'subscription.planId': planId,
                    'subscription.planName': planId,
                    'subscription.status': 'active',
                    'subscription.startsAt': now,
                    'subscription.endsAt': endsAt,
                    'subscription.paymentProviderId': paymentProviderId || null,
                    updatedAt: now,
                },
            }
        );

        return NextResponse.json({ 
            success: true, 
            message: 'Subscription activated',
            subscription: {
                planId,
                planName: planId,
                status: 'active',
                startsAt: now,
                endsAt,
            }
        });
    } catch (error) {
        console.error('Error subscribing:', error);
        return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
    }
}

// Cancel subscription
export async function DELETE(request: NextRequest) {
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

        // Cancel subscription (keep until end date)
        await db.collection('users').updateOne(
            { _id: payload.userId },
            {
                $set: {
                    'subscription.status': 'cancelled',
                    updatedAt: new Date(),
                },
            }
        );

        return NextResponse.json({ success: true, message: 'Subscription cancelled' });
    } catch (error) {
        console.error('Error cancelling subscription:', error);
        return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 });
    }
}

