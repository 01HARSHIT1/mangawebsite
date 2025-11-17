import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET: Fetch all notifications
export async function GET(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await verifyToken(token);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        const notifications = await db.collection('admin_notifications')
            .find({})
            .sort({ createdAt: -1 })
            .limit(100)
            .toArray();

        return NextResponse.json({
            notifications: notifications.map(n => ({
                ...n,
                _id: n._id.toString(),
                scheduledAt: n.scheduledAt ? n.scheduledAt.toISOString() : null,
                sentAt: n.sentAt ? n.sentAt.toISOString() : null
            }))
        });
    } catch (error) {
        console.error('Failed to fetch notifications:', error);
        return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }
}

// POST: Create and send notification
export async function POST(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await verifyToken(token);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const body = await request.json();
        const { title, message, type, target, targetIds, scheduledAt } = body;

        if (!title || !message || !type || !target) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        const notification = {
            title,
            message,
            type,
            target,
            targetIds: targetIds || [],
            scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
            status: scheduledAt ? 'scheduled' : 'draft',
            sentAt: null,
            createdAt: new Date(),
            createdBy: user._id.toString()
        };

        const result = await db.collection('admin_notifications').insertOne(notification);

        // If not scheduled, send immediately
        if (!scheduledAt) {
            // TODO: Implement actual notification sending logic
            await db.collection('admin_notifications').updateOne(
                { _id: result.insertedId },
                { $set: { status: 'sent', sentAt: new Date() } }
            );
        }

        return NextResponse.json({
            success: true,
            notification: { ...notification, _id: result.insertedId.toString() }
        });
    } catch (error) {
        console.error('Failed to create notification:', error);
        return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
    }
}

