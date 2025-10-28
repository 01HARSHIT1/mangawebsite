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

        console.log('🔍 Verifying payment:', {
            razorpay_payment_id,
            razorpay_order_id,
            userId: user._id
        });

        // Verify payment signature
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
            .update(body)
            .digest('hex');

        const isValidSignature = expectedSignature === razorpay_signature;

        console.log('🔍 Signature check:', {
            isValidSignature,
            expectedSignature: expectedSignature.substring(0, 20) + '...',
            receivedSignature: razorpay_signature.substring(0, 20) + '...'
        });

        if (!isValidSignature) {
            console.error('❌ Invalid signature');
            return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
        }

        // Get payment details from Razorpay
        const payment = await razorpay.payments.fetch(razorpay_payment_id);
        const order = await razorpay.orders.fetch(razorpay_order_id);

        console.log('🔍 Payment details:', {
            paymentStatus: payment.status,
            paymentAmount: payment.amount / 100,
            orderNotes: order.notes
        });

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
            // Check for coins in metadata or notes (case-insensitive)
            const description = (order.notes?.description || '').toLowerCase();
            const metadata = order.notes?.metadata || {};
            
            console.log('🔍 Processing coins:', {
                description,
                metadata,
                hasPackageId: !!metadata.packageId,
                hasCoins: !!metadata.coins,
                descriptionIncludesCoins: description.includes('coins')
            });
            
            if (description.includes('coins') || metadata.packageId || metadata.coins) {
                // Get coins amount from metadata or calculate from payment amount
                const coinsToAdd = metadata.coins || Math.floor(payment.amount / 100) || 1;
                
                console.log('💰 Adding coins:', {
                    coinsToAdd,
                    userId: user._id,
                    fromMetadata: metadata.coins,
                    fromAmount: Math.floor(payment.amount / 100)
                });
                
                await db.collection('users').updateOne(
                    { _id: new (await import('mongodb')).ObjectId(user._id) },
                    { $inc: { coins: coinsToAdd } }
                );
                console.log('✅ Added coins to user:', coinsToAdd);
            } else {
                console.log('⚠️ No coins to add - conditions not met');
            }

            if (description.includes('creator') || metadata.type === 'creator') {
                await db.collection('users').updateOne(
                    { _id: new (await import('mongodb')).ObjectId(user._id) },
                    { $set: { role: 'creator', isCreator: true } }
                );
                console.log('👑 User upgraded to creator');
            }
        } else {
            console.log('⚠️ Payment not captured, status:', payment.status);
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
