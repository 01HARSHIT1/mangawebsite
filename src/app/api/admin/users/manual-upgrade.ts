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

    // Check if the requesting user is an admin
    const adminUser = await users.findOne({ _id: new ObjectId(payload.userId) });
    if (!adminUser || adminUser.role !== 'admin') {
        return NextResponse.json({ error: 'Only admins can perform manual upgrades' }, { status: 403 });
    }

    const { userId, newRole } = await req.json();

    if (!userId || !newRole) {
        return NextResponse.json({ error: 'Missing userId or newRole' }, { status: 400 });
    }

    if (!['creator', 'admin'].includes(newRole)) {
        return NextResponse.json({ error: 'Invalid role. Must be creator or admin' }, { status: 400 });
    }

    try {
        // Find the user to be upgraded
        const userToUpgrade = await users.findOne({ _id: new ObjectId(userId) });
        if (!userToUpgrade) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Prevent self-upgrade to avoid admin lockout
        if (userToUpgrade._id.toString() === payload.userId) {
            return NextResponse.json({ error: 'Cannot upgrade yourself' }, { status: 400 });
        }

        // Update the user's role
        await users.updateOne(
            { _id: new ObjectId(userId) },
            { $set: { role: newRole } }
        );

        return NextResponse.json({
            success: true,
            message: `User ${userToUpgrade.nickname || userToUpgrade.email} upgraded to ${newRole}`,
            userId,
            newRole
        });
    } catch (error) {
        console.error('Manual upgrade error:', error);
        return NextResponse.json({ error: 'Failed to upgrade user' }, { status: 500 });
    }
} 