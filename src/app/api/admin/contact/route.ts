import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

// GET: fetch all contact/feedback messages (admin only)
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
    const status = url.searchParams.get('status') || '';
    const type = url.searchParams.get('type') || '';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const client = await clientPromise;
    const db = client.db();
    const contacts = db.collection('contacts');

    // Build query
    const query: any = {};
    if (status) query.status = status;
    if (type) query.type = type;

    // Get total count for pagination
    const total = await contacts.countDocuments(query);

    // Get contacts with pagination
    const contactList = await contacts.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();

    return NextResponse.json({
        contacts: contactList,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    });
}

// POST: create new contact/feedback message (anyone)
export async function POST(req: NextRequest) {
    const { name, email, subject, message, type = 'general' } = await req.json();

    if (!name || !email || !subject || !message) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    const contacts = db.collection('contacts');

    const contact = {
        name,
        email,
        subject,
        message,
        type, // 'general', 'bug', 'feature', 'support', 'feedback'
        status: 'unread',
        createdAt: new Date(),
        updatedAt: new Date()
    };

    const result = await contacts.insertOne(contact);
    return NextResponse.json({ success: true, contact: { ...contact, _id: result.insertedId } });
}

// PUT: update contact status (admin only)
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

    const { _id, status, adminResponse } = await req.json();
    if (!_id || !status) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    const contacts = db.collection('contacts');

    // Update contact
    const update: any = { status, updatedAt: new Date() };
    if (adminResponse) update.adminResponse = adminResponse;

    const result = await contacts.updateOne(
        { _id: new ObjectId(_id) },
        { $set: update }
    );

    if (result.matchedCount === 0) {
        return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
} 