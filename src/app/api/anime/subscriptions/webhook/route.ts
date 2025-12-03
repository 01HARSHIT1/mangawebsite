import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import crypto from 'crypto';

function verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex');
    return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
    );
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.text();
        const signature = request.headers.get('x-razorpay-signature');
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

        if (!signature || !webhookSecret) {
            console.error('❌ Missing webhook signature or secret');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify webhook signature
        if (!verifyWebhookSignature(body, signature, webhookSecret)) {
            console.error('❌ Invalid webhook signature');
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        const event = JSON.parse(body);
        console.log('🔔 Anime Subscription webhook received:', event.event);

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Handle different payment events
        switch (event.event) {
            case 'payment.captured':
                await handlePaymentCaptured(db, event.payload);
                break;
            case 'payment.failed':
                await handlePaymentFailed(db, event.payload);
                break;
            case 'order.paid':
                await handleOrderPaid(db, event.payload);
                break;
            default:
                console.log('ℹ️ Unhandled webhook event:', event.event);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('❌ Webhook processing failed:', error);
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
}

async function handlePaymentCaptured(db: any, payload: any) {
    try {
        const payment = payload.payment.entity;
        const order = payload.order.entity;

        console.log('💰 Subscription payment captured:', payment.id, 'Amount:', payment.amount / 100);

        // Find the subscription order
        const subscriptionOrder = await db.collection('anime_subscription_orders').findOne({
            orderId: order.id,
        });

        if (!subscriptionOrder) {
            console.error('❌ Subscription order not found:', order.id);
            return;
        }

        // Update order status
        await db.collection('anime_subscription_orders').updateOne(
            { orderId: order.id },
            {
                $set: {
                    status: 'captured',
                    razorpayPaymentId: payment.id,
                    paymentMethod: payment.method,
                    capturedAt: new Date(),
                },
            }
        );

        // Activate user subscription
        const now = new Date();
        const endsAt = new Date(now);
        endsAt.setMonth(endsAt.getMonth() + 1); // Monthly subscription

        await db.collection('users').updateOne(
            { _id: subscriptionOrder.userId },
            {
                $set: {
                    'subscription.planId': subscriptionOrder.planId,
                    'subscription.planName': subscriptionOrder.planId,
                    'subscription.status': 'active',
                    'subscription.startsAt': now,
                    'subscription.endsAt': endsAt,
                    'subscription.paymentProviderId': payment.id,
                    updatedAt: now,
                },
            }
        );

        console.log('✅ Subscription activated for user:', subscriptionOrder.userId);
    } catch (error) {
        console.error('❌ Error handling payment captured:', error);
    }
}

async function handlePaymentFailed(db: any, payload: any) {
    try {
        const payment = payload.payment.entity;
        const order = payload.order.entity;

        console.log('❌ Subscription payment failed:', payment.id);

        await db.collection('anime_subscription_orders').updateOne(
            { orderId: order.id },
            {
                $set: {
                    status: 'failed',
                    failedAt: new Date(),
                    failureReason: payment.error_description || 'Payment failed',
                },
            }
        );
    } catch (error) {
        console.error('❌ Error handling payment failed:', error);
    }
}

async function handleOrderPaid(db: any, payload: any) {
    try {
        const order = payload.order.entity;
        console.log('✅ Subscription order paid:', order.id);
        // Additional handling if needed
    } catch (error) {
        console.error('❌ Error handling order paid:', error);
    }
}

