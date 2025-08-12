import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

// GET: fetch all reports (admin only)
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
    const reports = db.collection('reports');

    // Build query
    const query: any = {};
    if (status) query.status = status;
    if (type) query.type = type;

    // Get total count for pagination
    const total = await reports.countDocuments(query);

    // Get reports with pagination
    const reportList = await reports.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();

    return NextResponse.json({
        reports: reportList,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    });
}

// POST: create new report (any authenticated user)
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

    const { type, targetId, targetType, reason, description } = await req.json();
    if (!type || !targetId || !targetType || !reason) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    const reports = db.collection('reports');

    const report = {
        type,
        targetId,
        targetType, // 'manga', 'chapter', 'user', 'comment'
        reason,
        description: description || '',
        reporterId: payload.userId,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
    };

    const result = await reports.insertOne(report);
    return NextResponse.json({ success: true, report: { ...report, _id: result.insertedId } });
}

// PUT: update report status (admin only)
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

    const { _id, status, adminNotes, action } = await req.json();
    if (!_id || !status) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    const reports = db.collection('reports');

    // Get the report
    const report = await reports.findOne({ _id: new ObjectId(_id) });
    if (!report) {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Update report
    const update: any = { status, updatedAt: new Date() };
    if (adminNotes) update.adminNotes = adminNotes;

    await reports.updateOne({ _id: new ObjectId(_id) }, { $set: update });

    // Take action if specified
    if (action && status === 'resolved') {
        switch (action) {
            case 'ban_user':
                if (report.targetType === 'user') {
                    await db.collection('users').updateOne(
                        { _id: new ObjectId(report.targetId) },
                        { $set: { isBanned: true } }
                    );
                }
                break;
            case 'hide_content':
                if (report.targetType === 'manga') {
                    await db.collection('manga').updateOne(
                        { _id: new ObjectId(report.targetId) },
                        { $set: { isHidden: true } }
                    );
                } else if (report.targetType === 'chapter') {
                    await db.collection('chapters').updateOne(
                        { _id: new ObjectId(report.targetId) },
                        { $set: { isHidden: true } }
                    );
                }
                break;
            case 'delete_content':
                if (report.targetType === 'manga') {
                    await db.collection('manga').deleteOne({ _id: new ObjectId(report.targetId) });
                } else if (report.targetType === 'chapter') {
                    await db.collection('chapters').deleteOne({ _id: new ObjectId(report.targetId) });
                }
                break;
        }
    }

    return NextResponse.json({ success: true });
} 