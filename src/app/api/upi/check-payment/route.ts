import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
    try {
        const user = await requireAuth(request);
        const { searchParams } = new URL(request.url);
        const transactionId = searchParams.get('transactionId');

        if (!transactionId) {
            return NextResponse.json({
                error: 'Transaction ID is required'
            }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db();

        // Check if payment exists and is successful
        const payment = await db.collection('payments').findOne({
            transactionId: transactionId,
            userId: new ObjectId(user._id),
            status: 'success'
        });

        if (payment) {
            return NextResponse.json({
                success: true,
                payment: {
                    transactionId: payment.transactionId,
                    amount: payment.amount,
                    coinsAdded: payment.coinsAdded,
                    timestamp: payment.timestamp
                }
            });
        } else {
            return NextResponse.json({
                success: false,
                message: 'Payment not found or not completed'
            });
        }

    } catch (error) {
        console.error('❌ UPI payment check error:', error);
        return NextResponse.json({
            error: 'Failed to check payment status'
        }, { status: 500 });
    }
}
