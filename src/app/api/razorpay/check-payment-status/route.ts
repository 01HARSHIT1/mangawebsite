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
            console.log('📊 Order attempts:', order.attempts);
            console.log('📊 Full order details:', JSON.stringify(order, null, 2));

            // ALWAYS fetch payments to see what's there, regardless of order status
            const payments = await razorpay.orders.fetchPayments(orderId);
            console.log('💰 Total payments found:', payments.count);
            
            if (payments.count > 0) {
                console.log('📋 All payment items:', JSON.stringify(payments.items, null, 2));
                
                // Log each payment's status
                payments.items.forEach((payment: any, index: number) => {
                    console.log(`💳 Payment ${index + 1}:`, {
                        id: payment.id,
                        status: payment.status,
                        method: payment.method,
                        amount: payment.amount / 100,
                        error: payment.error_description || 'none'
                    });
                });
            }

            // Check if order has been paid OR attempted (sometimes payments succeed even when order shows 'attempted')
            if (order.status === 'paid' || order.status === 'attempted') {
                console.log('🔍 Checking for successful payments in attempted/paid order...');

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
                    } else {
                        // Check if there are any failed payments
                        const failedPayment = payments.items.find(
                            (payment: any) => payment.status === 'failed'
                        );
                        
                        if (failedPayment) {
                            console.log('❌ Found failed payment:', failedPayment.id);
                            console.log('❌ Failure reason:', failedPayment.error_description || 'Unknown');
                        }
                    }
                }
            }

            console.log('ℹ️ Order not paid yet, status:', order.status);
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

