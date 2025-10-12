import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import clientPromise from '@/lib/mongodb';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_...';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_...';
const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2022-11-15' });

export async function POST(req: NextRequest) {
    const sig = req.headers.get('stripe-signature');
    const buf = await req.arrayBuffer();
    let event;
    try {
        event = stripe.webhooks.constructEvent(Buffer.from(buf), sig!, STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
    }
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        // Assume userId and amount are in session.metadata
        const userId = session.metadata?.userId;
        const amount = Number(session.metadata?.amount);
        if (userId && amount > 0) {
            const client = await clientPromise;
            const db = client.db();
            await db.collection('users').updateOne({ _id: new stripe.mongodb.ObjectId(userId) }, { $inc: { coins: amount } });
            await db.collection('transactions').insertOne({ userId, type: 'purchase', amount, paymentId: session.id, createdAt: new Date() });
        }
    }
    return NextResponse.json({ received: true });
} 