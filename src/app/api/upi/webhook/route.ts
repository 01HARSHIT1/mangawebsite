import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        console.log('🔔 UPI webhook received:', body);

        const { 
            transactionId, 
            amount, 
            status, 
            upiTransactionId, 
            paymentMethod,
            userId,
            coins 
        } = body;

        if (status !== 'success') {
            console.log('❌ UPI payment failed:', transactionId);
            return NextResponse.json({ success: true });
        }

        const client = await clientPromise;
        const db = client.db();

        // Update user's coin balance
        await db.collection('users').updateOne(
            { _id: new ObjectId(userId) },
            { $inc: { coins: parseInt(coins) } }
        );

        // Record the payment
        await db.collection('payments').insertOne({
            userId: new ObjectId(userId),
            transactionId: transactionId,
            upiTransactionId: upiTransactionId,
            amount: parseFloat(amount),
            currency: 'INR',
            status: 'success',
            paymentMethod: 'upi',
            coinsAdded: parseInt(coins),
            timestamp: new Date(),
            webhookData: body
        });

        console.log('✅ UPI payment processed:', {
            transactionId,
            userId,
            coinsAdded: coins
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('❌ UPI webhook error:', error);
        return NextResponse.json({ 
            error: 'Webhook processing failed' 
        }, { status: 500 });
    }
}
