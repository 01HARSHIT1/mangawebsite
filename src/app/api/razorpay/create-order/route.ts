import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    try {
        // Check environment variables first
        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        
        console.log('🔍 Environment check:', {
            hasKeyId: !!keyId,
            hasKeySecret: !!keySecret,
            keyIdLength: keyId?.length,
            keySecretLength: keySecret?.length
        });

        if (!keyId || !keySecret) {
            console.error('❌ Missing Razorpay environment variables');
            return NextResponse.json({
                error: 'Payment service not configured',
                details: 'Razorpay credentials not found. Please check environment variables.'
            }, { status: 500 });
        }

        // Initialize Razorpay with error handling
        let razorpay;
        try {
            razorpay = new Razorpay({
                key_id: keyId,
                key_secret: keySecret,
            });
            console.log('✅ Razorpay initialized successfully');
        } catch (initError) {
            console.error('❌ Failed to initialize Razorpay:', initError);
            return NextResponse.json({
                error: 'Payment service initialization failed',
                details: initError instanceof Error ? initError.message : 'Failed to initialize Razorpay SDK'
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
        console.log('📦 Creating Razorpay order with params:', {
            amount: amountInPaise,
            currency,
            receipt: `receipt_${Date.now()}_${user._id}`,
        });

        let order;
        try {
            order = await razorpay.orders.create({
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
            console.log('✅ Razorpay order created successfully:', order.id);
        } catch (orderError) {
            console.error('❌ Razorpay order creation error:', orderError);
            const errorDetails = orderError instanceof Error 
                ? `${orderError.message}${(orderError as any).description ? ` - ${(orderError as any).description}` : ''}`
                : JSON.stringify(orderError);
            
            return NextResponse.json({
                error: 'Failed to create payment order',
                details: errorDetails,
                hint: 'Please check your Razorpay credentials and account status'
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            key: keyId
        });

    } catch (error) {
        console.error('❌ Unexpected error in payment API:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        const errorStack = error instanceof Error ? error.stack : '';
        
        console.error('Error stack:', errorStack);
        
        return NextResponse.json({
            error: 'Payment initialization failed',
            details: errorMessage,
            type: error instanceof Error ? error.constructor.name : typeof error
        }, { status: 500 });
    }
}
