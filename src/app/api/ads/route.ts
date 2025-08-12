import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

// GET: fetch active ads for a location
export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const location = url.searchParams.get('location');
    const now = new Date();
    const client = await clientPromise;
    const db = client.db();
    const query: any = { active: true };
    if (location) query.location = location;
    query.$or = [
        { startDate: { $exists: false } },
        { startDate: { $lte: now } }
    ];
    query.$or.push({ endDate: { $exists: false } }, { endDate: { $gte: now } });
    const ads = await db.collection('ads').find(query).sort({ priority: -1, createdAt: -1 }).toArray();
    return NextResponse.json({ ads });
}

// POST: create new ad (admin only)
export async function POST(req: NextRequest) {
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
    const { type, content, link, location, active, startDate, endDate, priority } = await req.json();
    if (!type || !content || !location) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    const ad = {
        type,
        content,
        link: link || '',
        location,
        active: !!active,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        priority: typeof priority === 'number' ? priority : 0,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    const client = await clientPromise;
    const db = client.db();
    const result = await db.collection('ads').insertOne(ad);
    return NextResponse.json({ success: true, ad: { ...ad, _id: result.insertedId } });
}

// PUT: update ad (admin only)
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
    if (!_id) return NextResponse.json({ error: 'Missing ad ID' }, { status: 400 });
    update.updatedAt = new Date();
    if (update.startDate) update.startDate = new Date(update.startDate);
    if (update.endDate) update.endDate = new Date(update.endDate);
    const client = await clientPromise;
    const db = client.db();
    await db.collection('ads').updateOne({ _id: new ObjectId(_id) }, { $set: update });
    return NextResponse.json({ success: true });
}

// DELETE: delete ad (admin only)
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
    if (!_id) return NextResponse.json({ error: 'Missing ad ID' }, { status: 400 });
    const client = await clientPromise;
    const db = client.db();
    await db.collection('ads').deleteOne({ _id: new ObjectId(_id) });
    return NextResponse.json({ success: true });
} 