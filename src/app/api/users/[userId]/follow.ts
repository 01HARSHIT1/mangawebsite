import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

// POST: Follow a user
export async function POST(req: NextRequest, { params }: { params: { userId: string } }) {
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
    const followerId = payload.userId;
    const followeeId = params.userId;
    if (!followerId || !followeeId) {
        return NextResponse.json({ error: 'Missing user ID' }, { status: 400 });
    }
    if (followerId === followeeId) {
        return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }
    const client = await clientPromise;
    const db = client.db();
    const users = db.collection('users');
    // Add followeeId to follower's following, and followerId to followee's followers
    await users.updateOne(
        { _id: new ObjectId(followerId) },
        { $addToSet: { following: followeeId } }
    );
    await users.updateOne(
        { _id: new ObjectId(followeeId) },
        { $addToSet: { followers: followerId } }
    );
    return NextResponse.json({ success: true });
}

// DELETE: Unfollow a user
export async function DELETE(req: NextRequest, { params }: { params: { userId: string } }) {
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
    const followerId = payload.userId;
    const followeeId = params.userId;
    if (!followerId || !followeeId) {
        return NextResponse.json({ error: 'Missing user ID' }, { status: 400 });
    }
    if (followerId === followeeId) {
        return NextResponse.json({ error: 'Cannot unfollow yourself' }, { status: 400 });
    }
    const client = await clientPromise;
    const db = client.db();
    const users = db.collection('users');
    // Remove followeeId from follower's following, and followerId from followee's followers
    await users.updateOne(
        { _id: new ObjectId(followerId) },
        { $pull: { following: followeeId } }
    );
    await users.updateOne(
        { _id: new ObjectId(followeeId) },
        { $pull: { followers: followerId } }
    );
    return NextResponse.json({ success: true });
} 