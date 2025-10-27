import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    try {
        // Check if Cloudinary is configured
        const hasCloudinary = process.env.CLOUDINARY_CLOUD_NAME &&
            process.env.CLOUDINARY_API_KEY &&
            process.env.CLOUDINARY_API_SECRET;

        console.log('🔍 Cloudinary Check:', {
            hasCloudinary,
            cloudName: process.env.CLOUDINARY_CLOUD_NAME ? '✅ Set' : '❌ Missing',
            apiKey: process.env.CLOUDINARY_API_KEY ? '✅ Set' : '❌ Missing',
            apiSecret: process.env.CLOUDINARY_API_SECRET ? '✅ Set' : '❌ Missing'
        });

        // Get the raw body stream
        const body = await request.arrayBuffer();

        // Redirect to appropriate upload endpoint
        if (hasCloudinary) {
            console.log('☁️ Using Cloudinary for upload');
            // Use Cloudinary for production
            const cloudinaryUrl = `${request.nextUrl.origin}/api/upload-manga-cloudinary`;

            // Forward the request to Cloudinary endpoint
            const response = await fetch(cloudinaryUrl, {
                method: 'POST',
                headers: {
                    ...Object.fromEntries(request.headers.entries()),
                    'Content-Type': request.headers.get('Content-Type') || 'multipart/form-data'
                },
                body: body
            });

            const data = await response.json();
            return NextResponse.json(data, { status: response.status });

        } else {
            console.log('💾 Using local file system for upload (Cloudinary not configured)');
            // Use local file system for development
            const localUrl = `${request.nextUrl.origin}/api/upload-manga`;

            // Forward the request to local endpoint
            const response = await fetch(localUrl, {
                method: 'POST',
                headers: {
                    ...Object.fromEntries(request.headers.entries()),
                    'Content-Type': request.headers.get('Content-Type') || 'multipart/form-data'
                },
                body: body
            });

            const data = await response.json();
            return NextResponse.json(data, { status: response.status });
        }

    } catch (error) {
        console.error('❌ Smart upload error:', error);
        console.error('Error details:', error instanceof Error ? error.stack : 'Unknown error');
        return NextResponse.json({
            error: 'Upload service unavailable',
            details: error instanceof Error ? error.message : 'Unknown error',
            hint: 'Check if Cloudinary credentials are configured in Vercel environment variables'
        }, { status: 500 });
    }
}
