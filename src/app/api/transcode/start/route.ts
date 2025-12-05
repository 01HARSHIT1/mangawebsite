import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';

/**
 * Transcoding Service - Start Transcode Job
 * Creates transcode job for video assets
 * In production, this would trigger FFmpeg workers or cloud transcoding service
 */

export const dynamic = 'force-dynamic';

interface TranscodeStartRequest {
    assetId: string;
    qualityLevels?: string[]; // ['1080p', '720p', '480p', '360p']
    outputFormat?: 'hls' | 'dash' | 'both';
    generateThumbnails?: boolean;
    generateSubtitles?: boolean;
}

// POST /api/transcode/start - Start transcoding job
export async function POST(request: NextRequest) {
    try {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = verifyToken(token);
        if (!payload || (payload.role !== 'admin' && payload.role !== 'creator')) {
            return NextResponse.json(
                { error: 'Admin or Creator access required' },
                { status: 403 }
            );
        }

        const body: TranscodeStartRequest = await request.json();
        const { assetId, qualityLevels = ['1080p', '720p', '480p', '360p'], outputFormat = 'both', generateThumbnails = true, generateSubtitles = true } = body;

        if (!assetId) {
            return NextResponse.json(
                { error: 'assetId is required' },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Get asset
        const asset = await db.collection('assets').findOne({ 
            _id: new ObjectId(assetId) 
        });

        if (!asset) {
            return NextResponse.json(
                { error: 'Asset not found' },
                { status: 404 }
            );
        }

        // Verify ownership (unless admin)
        if (payload.role !== 'admin' && asset.userId !== payload.userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            );
        }

        // Check if asset is ready for transcoding
        if (asset.status !== 'ready_for_transcode' && asset.status !== 'moderated') {
            return NextResponse.json(
                { error: `Asset not ready for transcoding. Current status: ${asset.status}` },
                { status: 400 }
            );
        }

        // Check if transcode job already exists
        const existingJob = await db.collection('transcode_jobs').findOne({ 
            assetId,
            status: { $in: ['pending', 'processing'] }
        });

        if (existingJob) {
            return NextResponse.json(
                { error: 'Transcode job already in progress', jobId: existingJob._id },
                { status: 400 }
            );
        }

        // Create transcode job
        const jobId = new ObjectId();
        const job = {
            _id: jobId,
            assetId,
            episodeId: asset.metadata?.episodeId || null,
            seriesId: asset.metadata?.seriesId || null,
            status: 'pending', // 'pending' | 'processing' | 'completed' | 'failed'
            inputUrl: asset.storagePath,
            inputFormat: asset.contentType,
            outputFormat,
            qualityLevels,
            generateThumbnails,
            generateSubtitles,
            outputManifests: {
                hls: null,
                dash: null,
            },
            qualityOutputs: qualityLevels.map(quality => ({
                quality,
                status: 'pending',
                outputUrl: null,
                manifestUrl: null,
            })),
            thumbnails: [],
            subtitles: [],
            progress: 0,
            error: null,
            logs: [],
            workerId: null,
            startedAt: null,
            completedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        await db.collection('transcode_jobs').insertOne(job);

        // Update asset status
        await db.collection('assets').updateOne(
            { _id: asset._id },
            {
                $set: {
                    transcodeStatus: 'pending',
                    updatedAt: new Date(),
                },
            }
        );

        // In production, trigger actual transcoding worker
        // For now, we'll simulate it or queue it
        // await triggerTranscodeWorker(jobId.toString());

        return NextResponse.json({
            success: true,
            jobId: jobId.toString(),
            status: 'pending',
            message: 'Transcode job created. Processing will begin shortly.',
        });
    } catch (error: any) {
        console.error('Transcode start error:', error);
        return NextResponse.json(
            { error: 'Failed to start transcoding', details: error.message },
            { status: 500 }
        );
    }
}

// GET /api/transcode/status/{jobId} - Get transcode job status
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const jobId = searchParams.get('jobId');
        const assetId = searchParams.get('assetId');

        if (!jobId && !assetId) {
            return NextResponse.json(
                { error: 'jobId or assetId required' },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        let job;
        if (jobId) {
            job = await db.collection('transcode_jobs').findOne({ 
                _id: new ObjectId(jobId) 
            });
        } else {
            job = await db.collection('transcode_jobs').findOne({ assetId });
        }

        if (!job) {
            return NextResponse.json(
                { error: 'Transcode job not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            jobId: job._id.toString(),
            status: job.status,
            progress: job.progress,
            qualityLevels: job.qualityOutputs,
            outputManifests: job.outputManifests,
            thumbnails: job.thumbnails,
            subtitles: job.subtitles,
            error: job.error,
            startedAt: job.startedAt,
            completedAt: job.completedAt,
        });
    } catch (error: any) {
        console.error('Get transcode status error:', error);
        return NextResponse.json(
            { error: 'Failed to get transcode status' },
            { status: 500 }
        );
    }
}



