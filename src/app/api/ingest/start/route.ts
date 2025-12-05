import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import crypto from 'crypto';

/**
 * Ingest Service - Chunked Upload Initiation
 * Handles large file uploads via chunked uploads with presigned URLs
 * Supports Cloudflare Stream or S3-compatible storage
 */

export const dynamic = 'force-dynamic';

interface IngestStartRequest {
    filename: string;
    filesize: number; // bytes
    filetype: 'video' | 'audio' | 'subtitle' | 'thumbnail';
    contentType: string; // MIME type
    metadata?: {
        seriesId?: string;
        episodeId?: string;
        title?: string;
        description?: string;
    };
    chunkSize?: number; // Default 5MB chunks
}

// POST /api/ingest/start - Initialize chunked upload
export async function POST(request: NextRequest) {
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

        const body: IngestStartRequest = await request.json();
        const { filename, filesize, filetype, contentType, metadata, chunkSize = 5 * 1024 * 1024 } = body;

        // Validation
        if (!filename || !filesize || !filetype || !contentType) {
            return NextResponse.json(
                { error: 'Missing required fields: filename, filesize, filetype, contentType' },
                { status: 400 }
            );
        }

        // Validate file size (max 10GB for videos)
        const maxSize = filetype === 'video' ? 10 * 1024 * 1024 * 1024 : 100 * 1024 * 1024;
        if (filesize > maxSize) {
            return NextResponse.json(
                { error: `File size exceeds maximum allowed size (${maxSize / (1024 * 1024 * 1024)}GB)` },
                { status: 400 }
            );
        }

        // Validate file type
        const allowedTypes = {
            video: ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'],
            audio: ['audio/mpeg', 'audio/mp4', 'audio/wav'],
            subtitle: ['text/vtt', 'text/srt', 'application/x-subrip'],
            thumbnail: ['image/jpeg', 'image/png', 'image/webp'],
        };

        if (!allowedTypes[filetype]?.includes(contentType)) {
            return NextResponse.json(
                { error: `Invalid content type for ${filetype}` },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Generate upload ID
        const uploadId = crypto.randomBytes(16).toString('hex');
        const totalChunks = Math.ceil(filesize / chunkSize);

        // Create upload record
        const uploadRecord = {
            uploadId,
            userId: payload.userId,
            filename,
            filesize,
            filetype,
            contentType,
            chunkSize,
            totalChunks,
            uploadedChunks: 0,
            status: 'pending', // 'pending' | 'uploading' | 'completed' | 'failed'
            metadata: metadata || {},
            checksum: null, // Will be calculated after upload
            storageProvider: process.env.STORAGE_PROVIDER || 'cloudflare', // 'cloudflare' | 's3' | 'cloudinary'
            storagePath: null, // Will be set after upload
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        await db.collection('ingest_uploads').insertOne(uploadRecord);

        // Generate presigned URLs for each chunk
        // For Cloudflare Stream, we'll use direct upload API
        // For S3, we'll generate presigned POST URLs
        const chunkUrls: Array<{
            chunkNumber: number;
            url: string;
            method: 'PUT' | 'POST';
            headers?: Record<string, string>;
            expiresIn: number;
        }> = [];

        if (process.env.STORAGE_PROVIDER === 'cloudflare') {
            // Cloudflare Stream direct upload
            // In production, use Cloudflare Stream API to create upload URL
            const cloudflareAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;
            const cloudflareApiToken = process.env.CLOUDFLARE_API_TOKEN;

            if (cloudflareAccountId && cloudflareApiToken) {
                // Create Cloudflare Stream upload URL
                const response = await fetch(
                    `https://api.cloudflare.com/client/v4/accounts/${cloudflareAccountId}/stream`,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${cloudflareApiToken}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            maxDurationSeconds: 3600, // 1 hour max
                            allowedOrigins: [process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'],
                        }),
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    chunkUrls.push({
                        chunkNumber: 0,
                        url: data.result.uploadURL || data.result.uploadUrl,
                        method: 'POST',
                        expiresIn: 3600,
                    });
                }
            }
        } else {
            // S3-compatible presigned URLs (for chunked uploads)
            // In production, use AWS SDK or similar
            for (let i = 0; i < totalChunks; i++) {
                const chunkKey = `uploads/${uploadId}/chunk-${i}`;
                // Generate presigned URL (mock for now - implement with actual S3 SDK)
                chunkUrls.push({
                    chunkNumber: i,
                    url: `/api/ingest/upload-chunk?uploadId=${uploadId}&chunk=${i}`, // Temporary
                    method: 'PUT',
                    expiresIn: 3600,
                });
            }
        }

        return NextResponse.json({
            uploadId,
            chunkSize,
            totalChunks,
            chunkUrls,
            expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(), // 1 hour
        });
    } catch (error: any) {
        console.error('Ingest start error:', error);
        return NextResponse.json(
            { error: 'Failed to initialize upload', details: error.message },
            { status: 500 }
        );
    }
}



