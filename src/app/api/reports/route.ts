import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const user = await verifyToken(token);
        if (!user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }
        const body = await request.json();
        const { contentId, contentType, reason, details } = body;
        // Validate required fields
        if (!contentId || !contentType || !reason) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }
        const { db } = await connectToDatabase();
        // Create report
        const report = {
            contentId,
            contentType,
            reason,
            details: details || '',
            reporterId: user._id,
            reporterEmail: user.email,
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        const result = await db.collection('reports').insertOne(report);
        // Update content flags if needed
        if (contentType === 'manga') {
            await db.collection('manga').updateOne(
                { _id: contentId },
                { $inc: { reportCount: 1 } }
            );
        } else if (contentType === 'chapter') {
            await db.collection('chapters').updateOne(
                { _id: contentId },
                { $inc: { reportCount: 1 } }
            );
        } else if (contentType === 'comment') {
            await db.collection('comments').updateOne(
                { _id: contentId },
                { $inc: { reportCount: 1 } }
            );
        }
        return NextResponse.json({
            success: true,
            reportId: result.insertedId,
            message: 'Report submitted successfully',
        });
    } catch (error) {
        console.error('Error submitting report:', error);
        return NextResponse.json({
            error: 'Internal server error',
        }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const user = await verifyToken(token);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({
                error: 'Admin access required',
            }, { status: 403 });
        }
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') || 'pending';
        const contentType = searchParams.get('contentType');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const skip = (page - 1) * limit;
        const { db } = await connectToDatabase();
        // Build filter
        const filter: any = { status };
        if (contentType) {
            filter.contentType = contentType;
        }
        // Get reports with pagination
        const reports = await db.collection('reports')
            .find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();
        // Get total count
        const total = await db.collection('reports').countDocuments(filter);
        return NextResponse.json({
            reports,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching reports:', error);
        return NextResponse.json({
            error: 'Internal server error',
        }, { status: 500 });
    }
} 