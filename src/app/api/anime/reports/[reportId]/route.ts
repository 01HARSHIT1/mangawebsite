import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

// GET: Get report details (admin only)
export async function GET(
    request: NextRequest,
    { params }: { params: { reportId: string } }
) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
        const payload = jwt.verify(token, JWT_SECRET) as any;
        const userRole = payload.role;

        if (userRole !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const { reportId } = params;
        const client = await clientPromise;
        const db = client.db('mangawebsite');

        const report = await db.collection('anime_reports').findOne({
            _id: new ObjectId(reportId),
        });

        if (!report) {
            return NextResponse.json({ error: 'Report not found' }, { status: 404 });
        }

        // Get report actions (audit trail)
        const actions = await db.collection('anime_report_actions')
            .find({ reportId: new ObjectId(reportId) })
            .sort({ createdAt: -1 })
            .toArray();

        // Get target details based on target type
        let targetDetails = null;
        try {
            switch (report.targetType) {
                case 'anime_series':
                    targetDetails = await db.collection('anime_series').findOne({
                        _id: new ObjectId(report.targetId),
                    });
                    break;
                case 'episode':
                    targetDetails = await db.collection('anime_episodes').findOne({
                        _id: new ObjectId(report.targetId),
                    });
                    break;
                case 'comment':
                    targetDetails = await db.collection('anime_comments').findOne({
                        _id: new ObjectId(report.targetId),
                    });
                    break;
                case 'user':
                case 'creator':
                    targetDetails = await db.collection('users').findOne(
                        { _id: new ObjectId(report.targetId) },
                        { projection: { username: 1, email: 1, role: 1, createdAt: 1 } }
                    );
                    break;
                case 'w2g_room':
                    targetDetails = await db.collection('w2g_rooms').findOne({
                        roomId: report.targetId,
                    });
                    break;
                // Add more cases as needed
            }
        } catch (error) {
            console.error('Error fetching target details:', error);
        }

        // Get reporter's report count (for abuse detection)
        const reporterReportCount = await db.collection('anime_reports').countDocuments({
            reporterUserId: report.reporterUserId,
        });

        // Get target's report count (for pattern detection)
        const targetReportCount = await db.collection('anime_reports').countDocuments({
            targetType: report.targetType,
            targetId: report.targetId,
        });

        return NextResponse.json({
            report: {
                id: report._id.toString(),
                reporterUserId: report.reporterUserId.toString(),
                targetType: report.targetType,
                targetId: report.targetId,
                reason: report.reason,
                description: report.description,
                status: report.status,
                priority: report.priority,
                createdAt: report.createdAt,
                updatedAt: report.updatedAt,
            },
            targetDetails,
            actions: actions.map((action: any) => ({
                id: action._id.toString(),
                adminId: action.adminId?.toString() || null,
                actionType: action.actionType,
                notes: action.notes,
                createdAt: action.createdAt,
            })),
            statistics: {
                reporterReportCount,
                targetReportCount,
            },
        });
    } catch (error) {
        console.error('Error fetching report:', error);
        return NextResponse.json(
            { error: 'Failed to fetch report' },
            { status: 500 }
        );
    }
}

