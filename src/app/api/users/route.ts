import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

// TODO: Move user-specific actions (follow/unfollow, followers/following) to /api/users/[userId]/ for RESTful design.
// GET: fetch all users with search/filter (admin only)
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
    if (payload.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const url = new URL(req.url);
    const search = url.searchParams.get('search') || '';
    const role = url.searchParams.get('role') || '';
    const status = url.searchParams.get('status') || '';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const client = await clientPromise;
    const db = client.db();
    const users = db.collection('users');

    // Build query
    const query: any = {};
    if (search) {
        query.$or = [
            { email: { $regex: search, $options: 'i' } },
            { nickname: { $regex: search, $options: 'i' } },
            { username: { $regex: search, $options: 'i' } }
        ];
    }
    if (role) query.role = role;
    if (status === 'banned') query.isBanned = true;
    if (status === 'active') query.isBanned = { $ne: true };

    // Get total count for pagination
    const total = await users.countDocuments(query);

    // Get users with pagination
    const userList = await users.find(query)
        .project({ password: 0, verificationToken: 0, resetToken: 0 }) // Exclude sensitive fields
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();

    return NextResponse.json({
        users: userList,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    });
}

// PUT: update user (admin only)
export async function PUT(req: NextRequest) {
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
    if (payload.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { _id, ...update } = await req.json();
    if (!_id) return NextResponse.json({ error: 'Missing user ID' }, { status: 400 });

    // Prevent admin from banning themselves
    if (update.isBanned && _id === payload.userId) {
        return NextResponse.json({ error: 'Cannot ban yourself' }, { status: 400 });
    }

    // Prevent role changes that would remove all admins
    if (update.role && update.role !== 'admin') {
        const client = await clientPromise;
        const db = client.db();
        const adminCount = await db.collection('users').countDocuments({ role: 'admin' });
        if (adminCount <= 1) {
            return NextResponse.json({ error: 'Cannot remove the last admin' }, { status: 400 });
        }
    }

    const client = await clientPromise;
    const db = client.db();
    const users = db.collection('users');

    // Update user
    const result = await users.updateOne(
        { _id: new ObjectId(_id) },
        { $set: { ...update, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
}

// DELETE: delete user (admin only)
export async function DELETE(req: NextRequest) {
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
    if (payload.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { _id } = await req.json();
    if (!_id) return NextResponse.json({ error: 'Missing user ID' }, { status: 400 });

    // Prevent admin from deleting themselves
    if (_id === payload.userId) {
        return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    const users = db.collection('users');

    // Check if this is the last admin
    const user = await users.findOne({ _id: new ObjectId(_id) });
    if (user && user.role === 'admin') {
        const adminCount = await users.countDocuments({ role: 'admin' });
        if (adminCount <= 1) {
            return NextResponse.json({ error: 'Cannot delete the last admin' }, { status: 400 });
        }
    }

    // Delete user
    const result = await users.deleteOne({ _id: new ObjectId(_id) });

    if (result.deletedCount === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
} 