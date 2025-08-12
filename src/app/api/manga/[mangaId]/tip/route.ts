import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

export async function POST(req: NextRequest, { params }: { params: { mangaId: string } }) {
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
    const { amount } = await req.json();
    if (!amount || amount <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    const client = await clientPromise;
    const db = client.db();
    const users = db.collection('users');
    const manga = await db.collection('manga').findOne({ _id: new ObjectId(params.mangaId) });
    if (!manga) return NextResponse.json({ error: 'Manga not found' }, { status: 404 });
    const creatorId = manga.uploaderId;
    if (!creatorId) return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    if (creatorId === payload.userId) return NextResponse.json({ error: 'Cannot tip yourself' }, { status: 400 });
    const tipper = await users.findOne({ _id: new ObjectId(payload.userId) });
    if (!tipper) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if ((tipper.coins || 0) < amount) return NextResponse.json({ error: 'Insufficient coins' }, { status: 402 });
    const creator = await users.findOne({ _id: new ObjectId(creatorId) });
    if (!creator) return NextResponse.json({ error: 'Creator user not found' }, { status: 404 });
    // Deduct coins from tipper, credit creator
    await users.updateOne({ _id: tipper._id }, { $inc: { coins: -amount } });
    await users.updateOne({ _id: creator._id }, { $inc: { coins: amount } });
    // Log transactions for both
    await db.collection('transactions').insertOne({ userId: tipper._id.toString(), type: 'tip', amount, to: creator._id.toString(), mangaId: params.mangaId, createdAt: new Date(), description: `Tipped creator for manga ${params.mangaId}` });
    await db.collection('transactions').insertOne({ userId: creator._id.toString(), type: 'tip-received', amount, from: tipper._id.toString(), mangaId: params.mangaId, createdAt: new Date(), description: `Received tip for manga ${params.mangaId}` });
    return NextResponse.json({ success: true });
} 