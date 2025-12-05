import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';

/**
 * Moderation Service - Manual Review
 * Admin interface for reviewing flagged content
 */

export const dynamic = 'force-dynamic';

// GET /api/moderation/review - Get pending review queue
export async function GET(request: NextRequest) {
    try {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = verifyToken(token);
        if (!payload || payload.role !== 'admin') {
            return NextResponse.json(
                { error: 'Admin access required' },
                { status: 403 }
            );
        }

        const searchParams = request.nextUrl.searchParams;
        const status = searchParams.get('status') || 'pending_review';
        const limit = parseInt(searchParams.get('limit') || '50');
        const skip = parseInt(searchParams.get('skip') || '0');

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        const tasks = await db.collection('moderation_tasks')
            .find({ status })
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip)
            .toArray();

        // Enrich with asset data
        const enrichedTasks = await Promise.all(
            tasks.map(async (task) => {
                let asset = null;
                if (task.assetId) {
                    asset = await db.collection('assets').findOne({ 
                        _id: new ObjectId(task.assetId) 
                    });
                }

                let creator = null;
                if (task.userId) {
                    const user = await db.collection('users').findOne({ 
                        _id: new ObjectId(task.userId) 
                    });
                    if (user) {
                        creator = await db.collection('creators').findOne({ 
                            userId: user._id.toString() 
                        });
                    }
                }

                return {
                    ...task,
                    asset,
                    creator: creator ? {
                        displayName: creator.displayName,
                        kycStatus: creator.kycStatus,
                    } : null,
                };
            })
        );

        const total = await db.collection('moderation_tasks').countDocuments({ status });

        return NextResponse.json({
            tasks: enrichedTasks,
            pagination: {
                total,
                limit,
                skip,
                hasMore: skip + limit < total,
            },
        });
    } catch (error: any) {
        console.error('Get moderation queue error:', error);
        return NextResponse.json(
            { error: 'Failed to get moderation queue' },
            { status: 500 }
        );
    }
}

// POST /api/moderation/review - Submit review decision
export async function POST(request: NextRequest) {
    try {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = verifyToken(token);
        if (!payload || payload.role !== 'admin') {
            return NextResponse.json(
                { error: 'Admin access required' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { taskId, decision, comments } = body; // decision: 'approve' | 'reject' | 'request_changes'

        if (!taskId || !decision) {
            return NextResponse.json(
                { error: 'taskId and decision are required' },
                { status: 400 }
            );
        }

        if (!['approve', 'reject', 'request_changes'].includes(decision)) {
            return NextResponse.json(
                { error: 'Invalid decision. Must be: approve, reject, or request_changes' },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        const task = await db.collection('moderation_tasks').findOne({ 
            _id: new ObjectId(taskId) 
        });

        if (!task) {
            return NextResponse.json(
                { error: 'Moderation task not found' },
                { status: 404 }
            );
        }

        // Update task
        await db.collection('moderation_tasks').updateOne(
            { _id: task._id },
            {
                $set: {
                    status: decision === 'approve' ? 'approved' : decision === 'reject' ? 'rejected' : 'pending_changes',
                    reviewerId: payload.userId,
                    reviewComments: comments || '',
                    reviewedAt: new Date(),
                    updatedAt: new Date(),
                },
            }
        );

        // Update asset status
        if (task.assetId) {
            const asset = await db.collection('assets').findOne({ 
                _id: new ObjectId(task.assetId) 
            });

            if (asset) {
                if (decision === 'approve') {
                    // Move to transcoding if video
                    await db.collection('assets').updateOne(
                        { _id: asset._id },
                        {
                            $set: {
                                status: asset.filetype === 'video' ? 'ready_for_transcode' : 'ready',
                                moderationStatus: 'approved',
                                updatedAt: new Date(),
                            },
                        }
                    );

                    // Trigger transcoding if video
                    if (asset.filetype === 'video') {
                        await db.collection('transcode_jobs').insertOne({
                            assetId: asset._id.toString(),
                            episodeId: asset.metadata?.episodeId || null,
                            seriesId: asset.metadata?.seriesId || null,
                            status: 'pending',
                            inputUrl: asset.storagePath,
                            qualityLevels: ['1080p', '720p', '480p', '360p'],
                            progress: 0,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        });
                    }
                } else if (decision === 'reject') {
                    await db.collection('assets').updateOne(
                        { _id: asset._id },
                        {
                            $set: {
                                status: 'rejected',
                                moderationStatus: 'rejected',
                                updatedAt: new Date(),
                            },
                        }
                    );
                }
            }
        }

        // Notify creator (in production, send email/notification)
        if (task.userId) {
            await db.collection('notifications').insertOne({
                userId: task.userId,
                type: 'moderation_decision',
                title: decision === 'approve' 
                    ? 'Content Approved' 
                    : decision === 'reject' 
                    ? 'Content Rejected' 
                    : 'Content Changes Requested',
                message: comments || `Your content has been ${decision}d.`,
                read: false,
                createdAt: new Date(),
            });
        }

        return NextResponse.json({
            success: true,
            decision,
            message: `Content ${decision}d successfully`,
        });
    } catch (error: any) {
        console.error('Review submission error:', error);
        return NextResponse.json(
            { error: 'Failed to submit review', details: error.message },
            { status: 500 }
        );
    }
}



