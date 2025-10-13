import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { requireAuth } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(request: NextRequest) {
    try {
        const user = await requireAuth(request);
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = await request.json();

        // Verify payment signature
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
            .update(body)
            .digest('hex');

        const isValidSignature = expectedSignature === razorpay_signature;

        if (!isValidSignature) {
            return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
        }

        // Get payment details from Razorpay
        const payment = await razorpay.payments.fetch(razorpay_payment_id);
        const order = await razorpay.orders.fetch(razorpay_order_id);

        const client = await clientPromise;
        const db = client.db();

        // Save payment record
        const paymentRecord = {
            userId: user._id,
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            amount: payment.amount / 100,
            currency: payment.currency,
            status: payment.status,
            paymentMethod: payment.method,
            createdAt: new Date(),
            description: order.notes?.description || 'MangaReader Payment'
        };

        await db.collection('payments').insertOne(paymentRecord);

        // Process payment based on type
        if (payment.status === 'captured') {
            if (order.notes?.description?.includes('coins')) {
                const coinsToAdd = Math.floor(payment.amount / 100);
                await db.collection('users').updateOne(
                    { _id: user._id },
                    { $inc: { coins: coinsToAdd } }
                );
                console.log('🪙 Added coins to user:', coinsToAdd);
            }

            if (order.notes?.description?.includes('creator')) {
                await db.collection('users').updateOne(
                    { _id: user._id },
                    { $set: { role: 'creator', isCreator: true } }
                );
                console.log('👑 User upgraded to creator');
            }
        }

        return NextResponse.json({
            success: true,
            paymentId: razorpay_payment_id,
            status: payment.status,
            amount: payment.amount / 100,
            currency: payment.currency
        });

    } catch (error) {
        console.error('❌ Payment verification failed:', error);
        return NextResponse.json({
            error: 'Payment verification failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
