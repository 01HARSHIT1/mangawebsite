import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Create Razorpay order for subscription
export async function POST(request: NextRequest) {
    try {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = verifyToken(token);
        if (!payload) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const body = await request.json();
        const { planId } = body;

        if (!planId) {
            return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
        }

        const validPlans = ['premium', 'premium_plus'];
        if (!validPlans.includes(planId)) {
            return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
        }

        // Get plan details
        const plans = {
            premium: { name: 'Premium', price: 9.99, priceINR: 749 }, // ~$9.99 USD = ₹749
            premium_plus: { name: 'Premium Plus', price: 14.99, priceINR: 1124 }, // ~$14.99 USD = ₹1124
        };

        const plan = plans[planId as keyof typeof plans];
        if (!plan) {
            return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
        }

        // Initialize Razorpay (dynamic import to prevent build-time evaluation)
        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;

        if (!keyId || !keySecret) {
            return NextResponse.json({ error: 'Payment service not configured' }, { status: 500 });
        }

        // Dynamic import to prevent build-time initialization
        const Razorpay = (await import('razorpay')).default;
        const razorpay = new Razorpay({
            key_id: keyId,
            key_secret: keySecret,
        });

        // Create Razorpay order
        const order = await razorpay.orders.create({
            amount: plan.priceINR * 100, // Amount in paise
            currency: 'INR',
            receipt: `sub_${planId}_${payload.userId}_${Date.now()}`,
            notes: {
                userId: payload.userId,
                planId: planId,
                planName: plan.name,
                type: 'subscription',
                description: `Anime ${plan.name} Subscription`,
            },
        });

        // Store order in database
        const client = await clientPromise;
        const db = client.db('mangawebsite');

        await db.collection('anime_subscription_orders').insertOne({
            orderId: order.id,
            userId: payload.userId,
            planId: planId,
            planName: plan.name,
            amount: plan.priceINR,
            currency: 'INR',
            status: 'created',
            createdAt: new Date(),
        });

        return NextResponse.json({
            success: true,
            order: {
                id: order.id,
                amount: order.amount,
                currency: order.currency,
                key: keyId,
            },
            plan: {
                id: planId,
                name: plan.name,
                price: plan.price,
                priceINR: plan.priceINR,
            },
        });
    } catch (error: any) {
        console.error('Error creating subscription order:', error);
        return NextResponse.json(
            { error: 'Failed to create order', details: error.message },
            { status: 500 }
        );
    }
}

