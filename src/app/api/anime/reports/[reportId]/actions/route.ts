import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

// Action types
const ACTION_TYPES = {
    // Content actions
    HIDE_CONTENT: 'hide_content',
    DELETE_CONTENT: 'delete_content',
    GEO_BLOCK: 'geo_block',
    DEMONETIZE: 'demonetize',
    REQUIRE_REUPLOAD: 'require_reupload',
    
    // User/Creator actions
    WARNING: 'warning',
    TEMP_MUTE: 'temp_mute',
    UPLOAD_RESTRICTION: 'upload_restriction',
    STRIKE: 'strike',
    ACCOUNT_SUSPENSION: 'account_suspension',
    PERMANENT_BAN: 'permanent_ban',
    
    // Report actions
    RESOLVE: 'resolve',
    REJECT: 'reject',
    ESCALATE: 'escalate_to_legal',
} as const;

// POST: Admin action on a report
export async function POST(
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
        const userId = payload.userId || payload._id;
        const userRole = payload.role;

        if (!userId || userRole !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const { reportId } = params;
        const body = await request.json();
        const { actionType, notes, targetAction } = body;

        if (!actionType || !Object.values(ACTION_TYPES).includes(actionType)) {
            return NextResponse.json(
                { error: 'Valid action type is required' },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Get report
        const report = await db.collection('anime_reports').findOne({
            _id: new ObjectId(reportId),
        });

        if (!report) {
            return NextResponse.json({ error: 'Report not found' }, { status: 404 });
        }

        // Perform action based on type
        let statusUpdate = report.status;
        let targetActionResult = null;

        switch (actionType) {
            case ACTION_TYPES.RESOLVE:
                statusUpdate = 'resolved';
                break;
            case ACTION_TYPES.REJECT:
                statusUpdate = 'rejected';
                break;
            case ACTION_TYPES.ESCALATE:
                statusUpdate = 'reviewing';
                // Could add escalation logic here
                break;
            case ACTION_TYPES.STRIKE:
                // Add strike to user/creator
                if (report.targetType === 'user' || report.targetType === 'creator') {
                    const targetUser = await db.collection('users').findOne({
                        _id: new ObjectId(report.targetId),
                    });

                    if (targetUser) {
                        const currentStrikes = targetUser.strikes || [];
                        const newStrike = {
                            reportId: report._id.toString(),
                            reason: report.reason,
                            createdAt: new Date(),
                            expiresAt: report.reason === 'hate_speech' || report.reason === 'nsfw_sexual_content'
                                ? null // Never expires for severe violations
                                : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
                        };

                        await db.collection('users').updateOne(
                            { _id: new ObjectId(report.targetId) },
                            {
                                $push: { strikes: newStrike },
                                $set: { updatedAt: new Date() },
                            }
                        );

                        // Check if ban threshold reached
                        const totalStrikes = currentStrikes.length + 1;
                        if (totalStrikes >= 3) {
                            await db.collection('users').updateOne(
                                { _id: new ObjectId(report.targetId) },
                                {
                                    $set: {
                                        isBanned: true,
                                        bannedAt: new Date(),
                                        banReason: 'Reached strike limit',
                                    },
                                }
                            );
                            targetActionResult = { banned: true, reason: 'Reached strike limit' };
                        } else if (targetUser.role === 'creator' && totalStrikes >= 2) {
                            // Remove monetization for creators at 2 strikes
                            await db.collection('users').updateOne(
                                { _id: new ObjectId(report.targetId) },
                                {
                                    $set: {
                                        monetizationEnabled: false,
                                    },
                                }
                            );
                            targetActionResult = { monetizationRemoved: true };
                        }

                        targetActionResult = {
                            ...targetActionResult,
                            strikesAdded: 1,
                            totalStrikes,
                        };
                    }
                }
                statusUpdate = 'resolved';
                break;
            case ACTION_TYPES.DELETE_CONTENT:
                // Delete content based on target type
                switch (report.targetType) {
                    case 'episode':
                        await db.collection('anime_episodes').deleteOne({
                            _id: new ObjectId(report.targetId),
                        });
                        break;
                    case 'comment':
                        await db.collection('anime_comments').deleteOne({
                            _id: new ObjectId(report.targetId),
                        });
                        break;
                    // Add more cases as needed
                }
                statusUpdate = 'resolved';
                break;
            case ACTION_TYPES.HIDE_CONTENT:
                // Hide content (soft delete)
                switch (report.targetType) {
                    case 'episode':
                        await db.collection('anime_episodes').updateOne(
                            { _id: new ObjectId(report.targetId) },
                            { $set: { isHidden: true, hiddenAt: new Date() } }
                        );
                        break;
                    case 'comment':
                        await db.collection('anime_comments').updateOne(
                            { _id: new ObjectId(report.targetId) },
                            { $set: { isHidden: true, hiddenAt: new Date() } }
                        );
                        break;
                }
                statusUpdate = 'resolved';
                break;
            case ACTION_TYPES.WARNING:
                // Add warning to user
                if (report.targetType === 'user' || report.targetType === 'creator') {
                    await db.collection('users').updateOne(
                        { _id: new ObjectId(report.targetId) },
                        {
                            $push: {
                                warnings: {
                                    reportId: report._id.toString(),
                                    reason: report.reason,
                                    createdAt: new Date(),
                                },
                            },
                        }
                    );
                }
                statusUpdate = 'resolved';
                break;
            // Add more action handlers as needed
        }

        // Update report status
        await db.collection('anime_reports').updateOne(
            { _id: new ObjectId(reportId) },
            {
                $set: {
                    status: statusUpdate,
                    updatedAt: new Date(),
                },
            }
        );

        // Log action in audit trail
        await db.collection('anime_report_actions').insertOne({
            _id: new ObjectId(),
            reportId: new ObjectId(reportId),
            adminId: new ObjectId(userId),
            actionType,
            notes: notes || null,
            targetAction: targetActionResult,
            createdAt: new Date(),
        });

        // Log admin action
        await db.collection('admin_audit_logs').insertOne({
            _id: new ObjectId(),
            adminId: new ObjectId(userId),
            action: `report_${actionType}`,
            targetType: 'report',
            targetId: reportId,
            details: {
                reportId,
                actionType,
                notes,
                targetAction: targetActionResult,
            },
            createdAt: new Date(),
        });

        return NextResponse.json({
            success: true,
            message: 'Action performed successfully',
            reportStatus: statusUpdate,
            targetAction: targetActionResult,
        });
    } catch (error) {
        console.error('Error performing report action:', error);
        return NextResponse.json(
            { error: 'Failed to perform action' },
            { status: 500 }
        );
    }
}

