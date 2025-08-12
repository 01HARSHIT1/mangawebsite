import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import jwt from 'jsonwebtoken';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_...';
const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2022-11-15' });
const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

export async function POST(req: NextRequest) {
    const { amount } = await req.json(); // amount in coins
    if (!amount || amount < 100) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    // 1 USD = 100 coins
    const usd = (amount / 100).toFixed(2);
    // Get userId from JWT
    const auth = req.headers.get('authorization');
    if (!auth || !auth.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Missing or invalid token' }, { status: 401 });
    }
    let payload;
    try {
        payload = jwt.verify(auth.replace('Bearer ', ''), JWT_SECRET);
    } catch {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    const userId = payload.userId || payload._id || payload.id;
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: { name: `${amount} Coins` },
                        unit_amount: Math.round(Number(usd) * 100),
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/coins/success?amount=${amount}`,
            cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/coins/cancel`,
            metadata: { userId, amount: String(amount) },
        });
        return NextResponse.json({ url: session.url });
    } catch (err) {
        return NextResponse.json({ error: 'Failed to create Stripe session' }, { status: 500 });
    }
} 