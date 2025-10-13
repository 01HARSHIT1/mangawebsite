import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Verify webhook signature
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
        console.log('🔔 Razorpay webhook received:', event.event);

        const client = await clientPromise;
        const db = client.db();

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
            case 'refund.processed':
                await handleRefundProcessed(db, event.payload);
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
        
        console.log('💰 Payment captured:', payment.id, 'Amount:', payment.amount / 100);

        // Update payment record
        await db.collection('payments').updateOne(
            { razorpayOrderId: order.id },
            {
                $set: {
                    status: 'captured',
                    razorpayPaymentId: payment.id,
                    paymentMethod: payment.method,
                    capturedAt: new Date(),
                    amount: payment.amount / 100,
                    currency: payment.currency
                }
            }
        );

        // Add coins to user account
        if (order.notes?.userId && order.notes?.description?.includes('coins')) {
            const coinsToAdd = Math.floor(payment.amount / 100); // 1 coin per rupee
            await db.collection('users').updateOne(
                { _id: order.notes.userId },
                { $inc: { coins: coinsToAdd } }
            );
            console.log('🪙 Added coins to user:', coinsToAdd);
        }

        // Upgrade to creator if it's a creator upgrade payment
        if (order.notes?.description?.includes('creator')) {
            await db.collection('users').updateOne(
                { _id: order.notes.userId },
                { $set: { role: 'creator', isCreator: true } }
            );
            console.log('👑 User upgraded to creator');
        }

    } catch (error) {
        console.error('❌ Error handling payment captured:', error);
    }
}

async function handlePaymentFailed(db: any, payload: any) {
    try {
        const payment = payload.payment.entity;
        const order = payload.order.entity;
        
        console.log('❌ Payment failed:', payment.id);

        await db.collection('payments').updateOne(
            { razorpayOrderId: order.id },
            {
                $set: {
                    status: 'failed',
                    failureReason: payment.error_description,
                    failedAt: new Date()
                }
            }
        );

    } catch (error) {
        console.error('❌ Error handling payment failed:', error);
    }
}

async function handleOrderPaid(db: any, payload: any) {
    try {
        const order = payload.order.entity;
        
        console.log('✅ Order paid:', order.id);

        await db.collection('payments').updateOne(
            { razorpayOrderId: order.id },
            {
                $set: {
                    status: 'paid',
                    paidAt: new Date()
                }
            }
        );

    } catch (error) {
        console.error('❌ Error handling order paid:', error);
    }
}

async function handleRefundProcessed(db: any, payload: any) {
    try {
        const refund = payload.refund.entity;
        
        console.log('💸 Refund processed:', refund.id, 'Amount:', refund.amount / 100);

        await db.collection('refunds').insertOne({
            razorpayRefundId: refund.id,
            razorpayPaymentId: refund.payment_id,
            amount: refund.amount / 100,
            currency: refund.currency,
            status: refund.status,
            processedAt: new Date(),
            reason: refund.notes?.reason || 'Refund processed'
        });

    } catch (error) {
        console.error('❌ Error handling refund processed:', error);
    }
}
