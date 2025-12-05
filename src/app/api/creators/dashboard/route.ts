import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';

/**
 * Creator Dashboard Service
 * Provides creator with upload status, earnings, analytics, and payout info
 */

export const dynamic = 'force-dynamic';

// GET /api/creators/dashboard - Get creator dashboard data
export async function GET(request: NextRequest) {
    try {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = verifyToken(token);
        if (!payload || (payload.role !== 'creator' && payload.role !== 'admin')) {
            return NextResponse.json(
                { error: 'Creator access required' },
                { status: 403 }
            );
        }

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Get creator profile
        const creator = await db.collection('creators').findOne({ 
            userId: payload.userId 
        });

        if (!creator && payload.role !== 'admin') {
            return NextResponse.json(
                { error: 'Creator profile not found' },
                { status: 404 }
            );
        }

        const creatorId = creator?._id?.toString() || payload.userId;

        // Get uploads status
        const uploads = await db.collection('ingest_uploads')
            .find({ userId: payload.userId })
            .sort({ createdAt: -1 })
            .limit(20)
            .toArray();

        // Get assets with status
        const assets = await db.collection('assets')
            .find({ userId: payload.userId })
            .sort({ createdAt: -1 })
            .limit(20)
            .toArray();

        // Get moderation tasks
        const moderationTasks = await db.collection('moderation_tasks')
            .find({ userId: payload.userId })
            .sort({ createdAt: -1 })
            .limit(10)
            .toArray();

        // Get transcode jobs
        const transcodeJobs = await db.collection('transcode_jobs')
            .find({ 
                $or: [
                    { userId: payload.userId },
                    { seriesId: { $in: assets.map(a => a.metadata?.seriesId).filter(Boolean) } },
                ],
            })
            .sort({ createdAt: -1 })
            .limit(10)
            .toArray();

        // Get earnings summary
        const earnings = await db.collection('creator_earnings')
            .aggregate([
                { $match: { creatorId } },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$amount' },
                        pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0] } },
                        paid: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0] } },
                    },
                },
            ])
            .toArray();

        const earningsSummary = earnings[0] || { total: 0, pending: 0, paid: 0 };

        // Get analytics (views, watch time, etc.)
        const analytics = await db.collection('anime_playback_events')
            .aggregate([
                {
                    $match: {
                        seriesId: { $in: assets.map(a => a.metadata?.seriesId).filter(Boolean) },
                    },
                },
                {
                    $group: {
                        _id: '$seriesId',
                        views: { $sum: { $cond: [{ $eq: ['$eventType', 'play'] }, 1, 0] } },
                        watchTime: { $sum: '$position' },
                        completions: { $sum: { $cond: [{ $eq: ['$eventType', 'complete'] }, 1, 0] } },
                    },
                },
            ])
            .toArray();

        // Get recent payouts
        const payouts = await db.collection('payouts')
            .find({ creatorId })
            .sort({ createdAt: -1 })
            .limit(10)
            .toArray();

        return NextResponse.json({
            creator: {
                displayName: creator?.displayName,
                kycStatus: creator?.kycStatus,
                verificationStatus: creator?.verificationStatus,
            },
            stats: {
                totalUploads: uploads.length,
                totalAssets: assets.length,
                pendingModeration: moderationTasks.filter(t => t.status === 'pending').length,
                transcoding: transcodeJobs.filter(j => j.status === 'processing').length,
            },
            earnings: earningsSummary,
            uploads: uploads.map(upload => ({
                uploadId: upload.uploadId,
                filename: upload.filename,
                status: upload.status,
                progress: {
                    chunks: `${upload.uploadedChunks}/${upload.totalChunks}`,
                    percentage: Math.round((upload.uploadedChunks / upload.totalChunks) * 100),
                },
                createdAt: upload.createdAt,
            })),
            assets: assets.map(asset => ({
                assetId: asset._id,
                filename: asset.filename,
                status: asset.status,
                moderationStatus: asset.moderationStatus,
                transcodeStatus: asset.transcodeStatus,
                createdAt: asset.createdAt,
            })),
            moderation: moderationTasks.map(task => ({
                taskId: task._id,
                type: task.type,
                status: task.status,
                flags: task.automatedFlags,
                createdAt: task.createdAt,
            })),
            transcoding: transcodeJobs.map(job => ({
                jobId: job._id,
                status: job.status,
                progress: job.progress,
                qualityLevels: job.qualityOutputs,
                createdAt: job.createdAt,
            })),
            analytics,
            payouts: payouts.map(payout => ({
                payoutId: payout._id,
                amount: payout.amount,
                currency: payout.currency,
                status: payout.status,
                scheduledAt: payout.scheduledAt,
                createdAt: payout.createdAt,
            })),
        });
    } catch (error: any) {
        console.error('Creator dashboard error:', error);
        return NextResponse.json(
            { error: 'Failed to load dashboard', details: error.message },
            { status: 500 }
        );
    }
}



