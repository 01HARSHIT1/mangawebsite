import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

export async function GET(req: NextRequest, { params }: { params: { chapterId: string } }) {
    const client = await clientPromise;
    const db = client.db();
    const comments = await db.collection('comments')
        .find({ chapterId: params.chapterId })
        .sort({ createdAt: -1 })
        .toArray();
    return NextResponse.json(comments);
}

export async function POST(req: NextRequest, { params }: { params: { chapterId: string } }) {
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
    const { text } = await req.json();
    if (!text || !text.trim()) {
        return NextResponse.json({ error: 'Comment text required' }, { status: 400 });
    }
    const client = await clientPromise;
    const db = client.db();
    const users = db.collection('users');
    const user = await users.findOne({ _id: new ObjectId(payload.userId) });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const comment = {
        chapterId: params.chapterId,
        user: {
            _id: user._id,
            nickname: user.nickname || user.username || 'User',
            avatarUrl: user.avatarUrl || null,
        },
        text,
        createdAt: new Date(),
    };
    const result = await db.collection('comments').insertOne(comment);
    return NextResponse.json({ comment: { ...comment, _id: result.insertedId } });
} 