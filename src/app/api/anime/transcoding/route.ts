import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireCreator } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface TranscodingJob {
    jobId: string;
    episodeId: string;
    seriesId: string;
    inputUrl: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    outputs: {
        quality: string;
        url?: string;
        manifestUrl?: string;
        status: 'pending' | 'processing' | 'completed' | 'failed';
    }[];
    createdAt: Date;
    updatedAt: Date;
}

// Submit video for transcoding
export async function POST(request: NextRequest) {
    try {
        const user = await requireAuth(request);
        const body = await request.json();

        const { episodeId, videoUrl, qualities } = body;

        if (!episodeId || !videoUrl) {
            return NextResponse.json(
                { error: 'Episode ID and video URL are required' },
                { status: 400 }
            );
        }

        // Verify user has permission
        const client = await clientPromise;
        const db = client.db('mangawebsite');

        const episode = await db.collection('anime_episodes').findOne({
            _id: new ObjectId(episodeId)
        });

        if (!episode) {
            return NextResponse.json(
                { error: 'Episode not found' },
                { status: 404 }
            );
        }

        const series = await db.collection('anime_series').findOne({
            _id: new ObjectId(episode.seriesId)
        });

        if (!series) {
            return NextResponse.json(
                { error: 'Series not found' },
                { status: 404 }
            );
        }

        // Check permissions
        if (user.role !== 'admin' && series.creatorId !== user._id.toString()) {
            return NextResponse.json(
                { error: 'Forbidden - You do not have permission to transcode this episode' },
                { status: 403 }
            );
        }

        // Default qualities if not specified
        const targetQualities = qualities || ['1080p', '720p', '480p', '360p'];

        // Create transcoding job
        const jobId = new ObjectId().toString();
        const now = new Date();

        const transcodingJob: TranscodingJob = {
            jobId,
            episodeId,
            seriesId: episode.seriesId,
            inputUrl: videoUrl,
            status: 'pending',
            outputs: targetQualities.map(quality => ({
                quality,
                status: 'pending'
            })),
            createdAt: now,
            updatedAt: now
        };

        // Save job to database
        await db.collection('anime_transcoding_jobs').insertOne(transcodingJob);

        // In production, you would:
        // 1. Use a video processing service (AWS MediaConvert, Cloudinary Video API, Mux, etc.)
        // 2. Submit job to processing queue
        // 3. Process asynchronously
        // 4. Generate HLS/DASH manifests

        // For now, simulate transcoding with Cloudinary
        // Cloudinary supports video transcoding with automatic format conversion
        try {
            // Upload video to Cloudinary for processing
            // In production, use Cloudinary's video transformation API
            const uploadResult = await cloudinary.uploader.upload(videoUrl, {
                resource_type: 'video',
                folder: `anime/episodes/${episodeId}`,
                eager: targetQualities.map(quality => {
                    const height = quality === '1080p' ? 1080 : quality === '720p' ? 720 : quality === '480p' ? 480 : 360;
                    return {
                        format: 'mp4',
                        height: height,
                        quality: 'auto',
                        video_codec: 'h264',
                        audio_codec: 'aac'
                    };
                }),
                eager_async: true
            });

            // Update job with Cloudinary URLs
            const outputs = targetQualities.map((quality, index) => {
                const eagerResult = uploadResult.eager?.[index];
                return {
                    quality,
                    url: eagerResult?.secure_url || '',
                    status: eagerResult ? 'completed' : 'processing'
                };
            });

            await db.collection('anime_transcoding_jobs').updateOne(
                { jobId },
                {
                    $set: {
                        outputs,
                        status: outputs.every(o => o.status === 'completed') ? 'completed' : 'processing',
                        cloudinaryPublicId: uploadResult.public_id,
                        updatedAt: new Date()
                    }
                }
            );

            // Update episode with transcoded URLs
            await db.collection('anime_episodes').updateOne(
                { _id: new ObjectId(episodeId) },
                {
                    $set: {
                        videoUrl: uploadResult.secure_url,
                        qualityLevels: outputs.map(o => ({
                            quality: o.quality,
                            url: o.url,
                            manifestUrl: o.url // In production, generate HLS manifest
                        })),
                        transcodingJobId: jobId,
                        updatedAt: new Date()
                    }
                }
            );

            return NextResponse.json({
                success: true,
                jobId,
                status: 'processing',
                outputs,
                message: 'Transcoding job submitted successfully'
            });
        } catch (cloudinaryError: any) {
            console.error('Cloudinary transcoding error:', cloudinaryError);
            
            // Update job status to failed
            await db.collection('anime_transcoding_jobs').updateOne(
                { jobId },
                {
                    $set: {
                        status: 'failed',
                        error: cloudinaryError.message,
                        updatedAt: new Date()
                    }
                }
            );

            return NextResponse.json(
                { error: 'Transcoding failed', details: cloudinaryError.message },
                { status: 500 }
            );
        }
    } catch (error: any) {
        console.error('Transcoding error:', error);
        return NextResponse.json(
            { error: 'Failed to submit transcoding job', details: error.message },
            { status: 500 }
        );
    }
}

// Get transcoding job status
export async function GET(request: NextRequest) {
    try {
        const user = await requireAuth(request);
        const { searchParams } = new URL(request.url);
        const jobId = searchParams.get('jobId');
        const episodeId = searchParams.get('episodeId');

        if (!jobId && !episodeId) {
            return NextResponse.json(
                { error: 'Job ID or Episode ID is required' },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        const query: any = {};
        if (jobId) {
            query.jobId = jobId;
        }
        if (episodeId) {
            query.episodeId = episodeId;
        }

        const job = await db.collection('anime_transcoding_jobs')
            .findOne(query, { sort: { createdAt: -1 } });

        if (!job) {
            return NextResponse.json(
                { error: 'Transcoding job not found' },
                { status: 404 }
            );
        }

        // Verify permissions
        const series = await db.collection('anime_series').findOne({
            _id: new ObjectId(job.seriesId)
        });

        if (user.role !== 'admin' && series?.creatorId !== user._id.toString()) {
            return NextResponse.json(
                { error: 'Forbidden' },
                { status: 403 }
            );
        }

        return NextResponse.json({
            job: {
                jobId: job.jobId,
                episodeId: job.episodeId,
                seriesId: job.seriesId,
                status: job.status,
                outputs: job.outputs,
                createdAt: job.createdAt,
                updatedAt: job.updatedAt,
                error: job.error || null
            }
        });
    } catch (error: any) {
        console.error('Error fetching transcoding job:', error);
        return NextResponse.json(
            { error: 'Failed to fetch transcoding job', details: error.message },
            { status: 500 }
        );
    }
}

