import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

/**
 * Moderation Service - Automated Content Classification
 * Runs automated checks: copyright detection, NSFW, violence, profanity
 */

export const dynamic = 'force-dynamic';

interface ModerationFlags {
    copyright?: {
        detected: boolean;
        confidence: number;
        reason?: string;
    };
    nsfw?: {
        detected: boolean;
        confidence: number;
        category?: 'explicit' | 'suggestive' | 'mild';
    };
    violence?: {
        detected: boolean;
        confidence: number;
        severity?: 'mild' | 'moderate' | 'severe';
    };
    profanity?: {
        detected: boolean;
        confidence: number;
        words?: string[];
    };
}

// POST /api/moderation/process - Process moderation task
export async function POST(request: NextRequest) {
    try {
        // This endpoint should be called by a background worker or admin
        // For now, we'll allow admin access
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { verifyToken } = await import('@/lib/auth');
        const payload = verifyToken(token);
        if (!payload || payload.role !== 'admin') {
            return NextResponse.json(
                { error: 'Admin access required' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { taskId, assetId } = body;

        if (!taskId && !assetId) {
            return NextResponse.json(
                { error: 'taskId or assetId required' },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Get moderation task or asset
        let task;
        let asset;

        if (taskId) {
            task = await db.collection('moderation_tasks').findOne({ _id: new ObjectId(taskId) });
            if (task?.assetId) {
                asset = await db.collection('assets').findOne({ _id: new ObjectId(task.assetId) });
            }
        } else if (assetId) {
            asset = await db.collection('assets').findOne({ _id: new ObjectId(assetId) });
            task = await db.collection('moderation_tasks').findOne({ assetId });
        }

        if (!asset && !task) {
            return NextResponse.json(
                { error: 'Task or asset not found' },
                { status: 404 }
            );
        }

        // Run automated moderation checks
        const flags: ModerationFlags = {
            copyright: await checkCopyright(asset || task),
            nsfw: await checkNSFW(asset || task),
            violence: await checkViolence(asset || task),
            profanity: await checkProfanity(asset || task),
        };

        // Determine overall status
        const hasCriticalFlags = 
            flags.copyright?.detected ||
            flags.nsfw?.detected && flags.nsfw.confidence > 0.8 ||
            flags.violence?.detected && flags.violence.severity === 'severe';

        const status = hasCriticalFlags ? 'flagged' : 'passed';
        const requiresManualReview = hasCriticalFlags || 
            (flags.nsfw?.detected && flags.nsfw.confidence > 0.6) ||
            (flags.violence?.detected && flags.violence.confidence > 0.6);

        // Update moderation task
        if (task) {
            await db.collection('moderation_tasks').updateOne(
                { _id: task._id },
                {
                    $set: {
                        status: requiresManualReview ? 'pending_review' : 'approved',
                        automatedFlags: flags,
                        reviewedAt: new Date(),
                        updatedAt: new Date(),
                    },
                }
            );
        }

        // Update asset status
        if (asset) {
            await db.collection('assets').updateOne(
                { _id: asset._id },
                {
                    $set: {
                        moderationStatus: status,
                        automatedFlags: flags,
                        updatedAt: new Date(),
                    },
                }
            );

            // If passed and no manual review needed, move to transcoding
            if (status === 'passed' && !requiresManualReview && asset.filetype === 'video') {
                // Asset is ready for transcoding
                await db.collection('assets').updateOne(
                    { _id: asset._id },
                    { $set: { status: 'ready_for_transcode' } }
                );
            }
        }

        return NextResponse.json({
            success: true,
            status,
            requiresManualReview,
            flags,
            message: requiresManualReview 
                ? 'Content flagged for manual review' 
                : 'Content passed automated moderation',
        });
    } catch (error: any) {
        console.error('Moderation process error:', error);
        return NextResponse.json(
            { error: 'Failed to process moderation', details: error.message },
            { status: 500 }
        );
    }
}

// Automated check functions (simplified - in production, use ML models)
async function checkCopyright(asset: any): Promise<ModerationFlags['copyright']> {
    // In production: Use audio fingerprinting (e.g., AcoustID) or image hashing
    // For now, return mock
    return {
        detected: false,
        confidence: 0.1,
    };
}

async function checkNSFW(asset: any): Promise<ModerationFlags['nsfw']> {
    // In production: Use image/video classification models (e.g., TensorFlow, AWS Rekognition)
    // For now, return mock
    return {
        detected: false,
        confidence: 0.05,
    };
}

async function checkViolence(asset: any): Promise<ModerationFlags['violence']> {
    // In production: Use video classification models
    return {
        detected: false,
        confidence: 0.1,
    };
}

async function checkProfanity(asset: any): Promise<ModerationFlags['profanity']> {
    // Check subtitles/metadata for profanity
    const profanityWords = ['bad', 'word']; // In production, use comprehensive list
    const text = asset?.metadata?.description || asset?.metadata?.title || '';
    const detectedWords = profanityWords.filter(word => 
        text.toLowerCase().includes(word.toLowerCase())
    );

    return {
        detected: detectedWords.length > 0,
        confidence: detectedWords.length > 0 ? 0.8 : 0.1,
        words: detectedWords,
    };
}



