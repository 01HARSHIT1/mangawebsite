import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

// Report target types
export const REPORT_TARGET_TYPES = {
    ANIME_SERIES: 'anime_series',
    EPISODE: 'episode',
    VIDEO: 'video',
    SUBTITLE: 'subtitle',
    AUDIO_TRACK: 'audio_track',
    COMMENT: 'comment',
    USER: 'user',
    CREATOR: 'creator',
    W2G_ROOM: 'w2g_room',
    CHAT_MESSAGE: 'chat_message',
} as const;

// Report reasons
export const REPORT_REASONS = {
    COPYRIGHT: 'copyright_infringement',
    NSFW: 'nsfw_sexual_content',
    VIOLENCE: 'violence_gore',
    HATE_SPEECH: 'hate_speech',
    HARASSMENT: 'harassment_bullying',
    SPAM: 'spam_scam',
    MISINFORMATION: 'misinformation',
    AUDIO_SUBTITLE_MISMATCH: 'audio_subtitle_mismatch',
    SPOILERS: 'spoilers',
    OTHER: 'other',
} as const;

// Priority levels
export const PRIORITY_LEVELS = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical',
} as const;

// Report statuses
export const REPORT_STATUSES = {
    PENDING: 'pending',
    REVIEWING: 'reviewing',
    RESOLVED: 'resolved',
    REJECTED: 'rejected',
} as const;

// Auto-assign priority based on reason
function assignPriority(reason: string): string {
    switch (reason) {
        case REPORT_REASONS.NSFW:
        case REPORT_REASONS.COPYRIGHT:
        case REPORT_REASONS.HATE_SPEECH:
            return PRIORITY_LEVELS.CRITICAL;
        case REPORT_REASONS.HARASSMENT:
        case REPORT_REASONS.VIOLENCE:
            return PRIORITY_LEVELS.HIGH;
        case REPORT_REASONS.AUDIO_SUBTITLE_MISMATCH:
        case REPORT_REASONS.MISINFORMATION:
            return PRIORITY_LEVELS.MEDIUM;
        case REPORT_REASONS.SPAM:
        case REPORT_REASONS.SPOILERS:
        case REPORT_REASONS.OTHER:
        default:
            return PRIORITY_LEVELS.LOW;
    }
}

// POST: Create a new report
export async function POST(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
        const payload = jwt.verify(token, JWT_SECRET) as any;
        const userId = payload.userId || payload._id;

        if (!userId) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const body = await request.json();
        const { targetType, targetId, reason, description } = body;

        // Validation
        if (!targetType || !targetId || !reason) {
            return NextResponse.json(
                { error: 'Target type, target ID, and reason are required' },
                { status: 400 }
            );
        }

        if (!Object.values(REPORT_TARGET_TYPES).includes(targetType)) {
            return NextResponse.json(
                { error: 'Invalid target type' },
                { status: 400 }
            );
        }

        if (!Object.values(REPORT_REASONS).includes(reason)) {
            return NextResponse.json(
                { error: 'Invalid report reason' },
                { status: 400 }
            );
        }

        if (reason === REPORT_REASONS.OTHER && (!description || description.trim().length === 0)) {
            return NextResponse.json(
                { error: 'Description is required for "Other" reason' },
                { status: 400 }
            );
        }

        if (description && description.length > 300) {
            return NextResponse.json(
                { error: 'Description must be 300 characters or less' },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Rate limiting: Check if user has exceeded daily limit (10 reports/day)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const reportsToday = await db.collection('anime_reports').countDocuments({
            reporterUserId: new ObjectId(userId),
            createdAt: { $gte: today },
        });

        if (reportsToday >= 10) {
            return NextResponse.json(
                { error: 'Daily report limit reached. Please try again tomorrow.' },
                { status: 429 }
            );
        }

        // Check if user already reported this target
        const existingReport = await db.collection('anime_reports').findOne({
            reporterUserId: new ObjectId(userId),
            targetType,
            targetId: targetId.toString(),
            status: { $in: [REPORT_STATUSES.PENDING, REPORT_STATUSES.REVIEWING] },
        });

        if (existingReport) {
            return NextResponse.json(
                { error: 'You have already reported this item' },
                { status: 409 }
            );
        }

        // Auto-assign priority
        const priority = assignPriority(reason);

        // Create report
        const report = {
            _id: new ObjectId(),
            reporterUserId: new ObjectId(userId),
            targetType,
            targetId: targetId.toString(),
            reason,
            description: description?.trim() || null,
            status: REPORT_STATUSES.PENDING,
            priority,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        await db.collection('anime_reports').insertOne(report);

        // Log report creation action
        await db.collection('anime_report_actions').insertOne({
            _id: new ObjectId(),
            reportId: report._id,
            adminId: null, // User-created report
            actionType: 'created',
            notes: 'Report created by user',
            createdAt: new Date(),
        });

        return NextResponse.json({
            success: true,
            message: 'Report submitted successfully. Thank you for helping keep the community safe.',
            reportId: report._id.toString(),
        });
    } catch (error) {
        console.error('Error creating report:', error);
        return NextResponse.json(
            { error: 'Failed to submit report' },
            { status: 500 }
        );
    }
}

// GET: List reports (admin only)
export async function GET(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
        const payload = jwt.verify(token, JWT_SECRET) as any;
        const userId = payload.userId || payload._id;
        const userRole = payload.role;

        if (!userId || userRole !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const priority = searchParams.get('priority');
        const targetType = searchParams.get('targetType');
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '20', 10);
        const skip = (page - 1) * limit;

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Build query
        const query: any = {};
        if (status) query.status = status;
        if (priority) query.priority = priority;
        if (targetType) query.targetType = targetType;

        // Get reports
        const reports = await db.collection('anime_reports')
            .find(query)
            .sort({ priority: -1, createdAt: -1 }) // Critical first, then by date
            .skip(skip)
            .limit(limit)
            .toArray();

        // Get total count
        const total = await db.collection('anime_reports').countDocuments(query);

        // Get reporter info (count only, not full details for privacy)
        const reporterIds = [...new Set(reports.map((r: any) => r.reporterUserId.toString()))];
        const reporterCounts = await db.collection('anime_reports').aggregate([
            { $match: { reporterUserId: { $in: reporterIds.map(id => new ObjectId(id)) } } },
            { $group: { _id: '$reporterUserId', count: { $sum: 1 } } },
        ]).toArray();

        const reporterCountMap = new Map(
            reporterCounts.map((r: any) => [r._id.toString(), r.count])
        );

        // Format reports (hide sensitive info)
        const formattedReports = reports.map((report: any) => ({
            id: report._id.toString(),
            targetType: report.targetType,
            targetId: report.targetId,
            reason: report.reason,
            description: report.description,
            status: report.status,
            priority: report.priority,
            createdAt: report.createdAt,
            updatedAt: report.updatedAt,
            reporterReportCount: reporterCountMap.get(report.reporterUserId.toString()) || 1,
        }));

        return NextResponse.json({
            reports: formattedReports,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching reports:', error);
        return NextResponse.json(
            { error: 'Failed to fetch reports' },
            { status: 500 }
        );
    }
}

