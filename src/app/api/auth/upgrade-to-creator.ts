import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

export async function POST(req: NextRequest) {
    const auth = req.headers.get('authorization');
    if (!auth || !auth.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Missing or invalid token' }, { status: 401 });
    }
    const token = auth.replace('Bearer ', '');
    let payload;
    try {
        payload = jwt.verify(token, JWT_SECRET);
    } catch {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    const client = await clientPromise;
    const db = client.db();
    const users = db.collection('users');
    const manga = db.collection('manga');

    // Only viewers can be upgraded
    const user = await users.findOne({ _id: new ObjectId(payload.userId) });
    if (!user || user.role !== 'viewer') {
        return NextResponse.json({ error: 'Only viewers can be upgraded' }, { status: 403 });
    }
    // Check if user has uploaded at least one manga
    const uploaded = await manga.findOne({ uploaderId: user._id.toString() });
    if (!uploaded) {
        return NextResponse.json({
            error: 'You must upload a manga to become a creator',
            suggestion: 'Visit /upload to upload your first manga series'
        }, { status: 403 });
    }

    // Update user role to creator
    await users.updateOne({ _id: user._id }, { $set: { role: 'creator' } });

    return NextResponse.json({
        success: true,
        role: 'creator',
        message: 'Congratulations! You are now a creator and can access the Creator Panel.'
    });
} 