import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(request: NextRequest) {
    try {
        // Check environment variables
        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            console.error('❌ Missing Razorpay environment variables');
            return NextResponse.json({
                error: 'Payment service not configured',
                details: 'Razorpay credentials not found'
            }, { status: 500 });
        }

        const user = await requireAuth(request);
        const requestBody = await request.json();
        const { amount, currency = 'INR', description, metadata = {} } = requestBody;

        console.log('🔍 Full request body:', JSON.stringify(requestBody, null, 2));
        console.log('🔍 Creating order for amount:', amount, 'type:', typeof amount, 'currency:', currency);

        // Validate amount
        if (!amount || amount <= 0) {
            console.error('❌ Invalid amount received:', amount);
            return NextResponse.json({ 
                error: 'Invalid amount', 
                details: `Amount must be greater than 0, received: ${amount}` 
            }, { status: 400 });
        }

        // Convert to paise for Razorpay (minimum 100 paise = 1 rupee)
        const amountInPaise = Math.round(amount * 100);
        if (amountInPaise < 100) {
            console.error('❌ Amount too small for Razorpay:', amountInPaise);
            return NextResponse.json({ 
                error: 'Amount too small', 
                details: 'Minimum amount is ₹1.00' 
            }, { status: 400 });
        }

        // Create Razorpay order
        const order = await razorpay.orders.create({
            amount: amountInPaise, // Use pre-calculated paise amount
            currency,
            receipt: `receipt_${Date.now()}_${user._id}`,
            notes: {
                userId: user._id,
                userEmail: user.email,
                description: description || 'MangaReader Payment',
                ...metadata
            }
        });

        console.log('✅ Razorpay order created:', order.id);

        return NextResponse.json({
            success: true,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            key: process.env.RAZORPAY_KEY_ID
        });

    } catch (error) {
        console.error('❌ Razorpay order creation failed:', error);
        return NextResponse.json({
            error: 'Payment initialization failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
