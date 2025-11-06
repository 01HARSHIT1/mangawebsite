import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { requireAuth } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    try {
        const user = await requireAuth(request);
        const { orderId } = await request.json();

        if (!orderId) {
            return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
        }

        console.log('🔍 Checking payment status for order:', orderId);

        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;

        if (!keyId || !keySecret) {
            console.error('❌ Missing Razorpay credentials');
            return NextResponse.json({ error: 'Payment service not configured' }, { status: 500 });
        }

        const razorpay = new Razorpay({
            key_id: keyId,
            key_secret: keySecret,
        });

        try {
            // Fetch order details from Razorpay
            const order = await razorpay.orders.fetch(orderId);
            console.log('📦 Order status:', order.status);
            console.log('📊 Order payments:', order.attempts);

            // Check if order has been paid
            if (order.status === 'paid') {
                // Fetch all payments for this order
                const payments = await razorpay.orders.fetchPayments(orderId);
                console.log('💰 Payments found:', payments.count);

                if (payments.count > 0) {
                    // Find the successful payment
                    const successfulPayment = payments.items.find(
                        (payment: any) => payment.status === 'captured' || payment.status === 'authorized'
                    );

                    if (successfulPayment) {
                        console.log('✅ Found successful payment:', successfulPayment.id);
                        
                        return NextResponse.json({
                            success: true,
                            paymentCompleted: true,
                            paymentId: successfulPayment.id,
                            orderId: orderId,
                            amount: successfulPayment.amount / 100,
                            status: successfulPayment.status,
                            method: successfulPayment.method
                        });
                    }
                }
            }

            console.log('ℹ️ Order not paid yet');
            return NextResponse.json({
                success: true,
                paymentCompleted: false,
                orderStatus: order.status,
                orderId: orderId
            });

        } catch (razorpayError: any) {
            console.error('❌ Razorpay API error:', razorpayError);
            
            // If order not found, payment likely wasn't completed
            if (razorpayError.statusCode === 400) {
                return NextResponse.json({
                    success: true,
                    paymentCompleted: false,
                    message: 'Order not found or invalid'
                });
            }

            throw razorpayError;
        }

    } catch (error) {
        console.error('❌ Error checking payment status:', error);
        return NextResponse.json({
            error: 'Failed to check payment status',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

