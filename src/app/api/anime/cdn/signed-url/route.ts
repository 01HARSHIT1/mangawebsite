import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { cdnUrlGenerator } from '@/lib/cdn-url-generator';

// Generate signed URL for secure media access
export async function POST(request: NextRequest) {
    try {
        const user = await requireAuth(request);
        const body = await request.json();

        const { url, expiresIn, episodeId, seriesId } = body;

        if (!url) {
            return NextResponse.json(
                { error: 'URL is required' },
                { status: 400 }
            );
        }

        // Generate signed URL
        const signedUrl = await cdnUrlGenerator.generateSignedURL({
            url,
            expiresIn: expiresIn || 3600, // Default 1 hour
            userId: user._id.toString(),
            episodeId,
            seriesId
        });

        return NextResponse.json({
            signedUrl,
            expiresIn: expiresIn || 3600,
            originalUrl: url
        });
    } catch (error: any) {
        console.error('Error generating signed URL:', error);
        return NextResponse.json(
            { error: 'Failed to generate signed URL', details: error.message },
            { status: 500 }
        );
    }
}

// Verify signed URL
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const url = searchParams.get('url');

        if (!url) {
            return NextResponse.json(
                { error: 'URL is required' },
                { status: 400 }
            );
        }

        const isValid = cdnUrlGenerator.verifySignedURL(url);

        return NextResponse.json({
            valid: isValid,
            url
        });
    } catch (error: any) {
        console.error('Error verifying signed URL:', error);
        return NextResponse.json(
            { error: 'Failed to verify signed URL', details: error.message },
            { status: 500 }
        );
    }
}

