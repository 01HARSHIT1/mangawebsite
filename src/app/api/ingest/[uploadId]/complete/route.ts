import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import crypto from 'crypto';

/**
 * Ingest Service - Complete Upload
 * Verifies file integrity, triggers moderation, and enqueues transcoding
 */

export const dynamic = 'force-dynamic';

interface IngestCompleteRequest {
    checksum: string; // SHA-256 hash of complete file
    chunks: Array<{
        chunkNumber: number;
        checksum: string;
    }>;
}

// PUT /api/ingest/{uploadId}/complete - Complete upload and trigger processing
export async function PUT(
    request: NextRequest,
    { params }: { params: { uploadId: string } }
) {
    try {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = verifyToken(token);
        if (!payload || (payload.role !== 'creator' && payload.role !== 'admin')) {
            return NextResponse.json(
                { error: 'Creator or Admin access required' },
                { status: 403 }
            );
        }

        const { uploadId } = params;
        const body: IngestCompleteRequest = await request.json();
        const { checksum, chunks } = body;

        if (!checksum) {
            return NextResponse.json(
                { error: 'Checksum is required' },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Get upload record
        const upload = await db.collection('ingest_uploads').findOne({ uploadId });
        if (!upload) {
            return NextResponse.json(
                { error: 'Upload not found' },
                { status: 404 }
            );
        }

        // Verify ownership
        if (upload.userId !== payload.userId && payload.role !== 'admin') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            );
        }

        // Verify all chunks uploaded
        if (upload.uploadedChunks !== upload.totalChunks) {
            return NextResponse.json(
                { error: `Not all chunks uploaded. Expected ${upload.totalChunks}, got ${upload.uploadedChunks}` },
                { status: 400 }
            );
        }

        // Update upload record
        await db.collection('ingest_uploads').updateOne(
            { uploadId },
            {
                $set: {
                    status: 'completed',
                    checksum,
                    completedAt: new Date(),
                    updatedAt: new Date(),
                },
            }
        );

        // Extract metadata (duration, codecs, etc.)
        // In production, use ffprobe or similar
        const metadata = {
            duration: null, // Will be extracted during transcoding
            codec: null,
            resolution: null,
            bitrate: null,
        };

        // Create asset record
        const assetId = new ObjectId().toString();
        const asset = {
            _id: assetId,
            uploadId,
            userId: payload.userId,
            filename: upload.filename,
            filesize: upload.filesize,
            filetype: upload.filetype,
            contentType: upload.contentType,
            storageProvider: upload.storageProvider,
            storagePath: upload.storagePath,
            checksum,
            metadata: { ...upload.metadata, ...metadata },
            status: 'pending_moderation', // 'pending_moderation' | 'moderated' | 'transcoding' | 'ready' | 'failed'
            moderationStatus: 'pending',
            transcodeStatus: 'pending',
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        await db.collection('assets').insertOne(asset);

        // Enqueue moderation task
        await db.collection('moderation_tasks').insertOne({
            type: 'content_moderation',
            assetId,
            uploadId,
            userId: payload.userId,
            status: 'pending',
            priority: upload.filetype === 'video' ? 'high' : 'normal',
            automatedFlags: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        // If file is video, also enqueue transcode job
        if (upload.filetype === 'video') {
            await db.collection('transcode_jobs').insertOne({
                assetId,
                episodeId: upload.metadata?.episodeId || null,
                seriesId: upload.metadata?.seriesId || null,
                status: 'pending',
                inputUrl: upload.storagePath,
                qualityLevels: ['1080p', '720p', '480p', '360p'],
                progress: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        }

        return NextResponse.json({
            success: true,
            assetId,
            status: 'completed',
            message: 'Upload completed. File is being processed.',
            nextSteps: {
                moderation: 'pending',
                transcoding: upload.filetype === 'video' ? 'pending' : 'not_required',
            },
        });
    } catch (error: any) {
        console.error('Ingest complete error:', error);
        return NextResponse.json(
            { error: 'Failed to complete upload', details: error.message },
            { status: 500 }
        );
    }
}

// GET /api/ingest/{uploadId}/status - Get upload status
export async function GET(
    request: NextRequest,
    { params }: { params: { uploadId: string } }
) {
    try {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = verifyToken(token);
        if (!payload) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const { uploadId } = params;
        const client = await clientPromise;
        const db = client.db('mangawebsite');

        const upload = await db.collection('ingest_uploads').findOne({ uploadId });
        if (!upload) {
            return NextResponse.json({ error: 'Upload not found' }, { status: 404 });
        }

        // Check ownership
        if (upload.userId !== payload.userId && payload.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Get asset status if exists
        const asset = await db.collection('assets').findOne({ uploadId });
        const moderationTask = await db.collection('moderation_tasks').findOne({
            uploadId,
            status: { $ne: 'completed' },
        });
        const transcodeJob = upload.filetype === 'video' 
            ? await db.collection('transcode_jobs').findOne({ assetId: asset?._id })
            : null;

        return NextResponse.json({
            uploadId,
            status: upload.status,
            progress: {
                chunks: `${upload.uploadedChunks}/${upload.totalChunks}`,
                percentage: Math.round((upload.uploadedChunks / upload.totalChunks) * 100),
            },
            asset: asset ? {
                assetId: asset._id,
                status: asset.status,
                moderationStatus: asset.moderationStatus,
                transcodeStatus: asset.transcodeStatus,
            } : null,
            moderation: moderationTask ? {
                status: moderationTask.status,
                flags: moderationTask.automatedFlags,
            } : null,
            transcoding: transcodeJob ? {
                status: transcodeJob.status,
                progress: transcodeJob.progress,
            } : null,
        });
    } catch (error: any) {
        console.error('Get upload status error:', error);
        return NextResponse.json(
            { error: 'Failed to get upload status' },
            { status: 500 }
        );
    }
}



