import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

export async function GET(req: NextRequest) {
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
    const client = await clientPromise;
    const db = client.db();
    const user = await db.collection('users').findOne({ _id: new ObjectId(payload.userId) });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const transactions = await db.collection('transactions').find({ userId: user._id.toString() }).sort({ createdAt: -1 }).toArray();
    return NextResponse.json({ coins: user.coins || 0, transactions });
}

export async function POST(req: NextRequest) {
    // Placeholder: In production, verify Stripe/PayPal webhook, then credit coins
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
    const { amount, paymentId } = await req.json(); // amount in coins, paymentId for reference
    if (!amount || amount <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    const client = await clientPromise;
    const db = client.db();
    const user = await db.collection('users').findOne({ _id: new ObjectId(payload.userId) });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    // Credit coins
    await db.collection('users').updateOne({ _id: user._id }, { $inc: { coins: amount } });
    // Log transaction
    await db.collection('transactions').insertOne({ userId: user._id.toString(), type: 'purchase', amount, paymentId, createdAt: new Date() });
    return NextResponse.json({ success: true });
} 