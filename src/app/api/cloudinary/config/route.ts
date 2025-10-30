import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env as Record<string, string | undefined>;
    return NextResponse.json({
        cloudName: CLOUDINARY_CLOUD_NAME || null,
        apiKeyTail: CLOUDINARY_API_KEY ? CLOUDINARY_API_KEY.slice(-4) : null,
        secretLen: CLOUDINARY_API_SECRET ? CLOUDINARY_API_SECRET.length : null,
        hasAll: Boolean(CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET),
    });
}


