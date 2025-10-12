import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, upgradeToCreator } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    try {
        // Check if Cloudinary is configured
        const hasCloudinary = process.env.CLOUDINARY_CLOUD_NAME &&
            process.env.CLOUDINARY_API_KEY &&
            process.env.CLOUDINARY_API_SECRET;

        // Redirect to appropriate upload endpoint
        if (hasCloudinary) {
            // Use Cloudinary for production
            const cloudinaryUrl = `${request.nextUrl.origin}/api/upload-manga-cloudinary`;

            // Forward the request to Cloudinary endpoint
            const response = await fetch(cloudinaryUrl, {
                method: 'POST',
                headers: request.headers,
                body: request.body
            });

            const data = await response.json();
            return NextResponse.json(data, { status: response.status });

        } else {
            // Use local file system for development
            const localUrl = `${request.nextUrl.origin}/api/upload-manga`;

            // Forward the request to local endpoint
            const response = await fetch(localUrl, {
                method: 'POST',
                headers: request.headers,
                body: request.body
            });

            const data = await response.json();
            return NextResponse.json(data, { status: response.status });
        }

    } catch (error) {
        console.error('❌ Smart upload error:', error);
        return NextResponse.json({
            error: 'Upload service unavailable',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
