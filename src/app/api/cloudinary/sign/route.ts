import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function signParams(params: Record<string, string | number | boolean | undefined>, apiSecret: string) {
    const filtered: Record<string, string> = {};
    Object.keys(params).sort().forEach((key) => {
        const value = params[key];
        if (value !== undefined && value !== '' && value !== null && key !== 'file' && key !== 'api_key' && key !== 'signature') {
            filtered[key] = String(value);
        }
    });
    const toSign = Object.entries(filtered)
        .map(([k, v]) => `${k}=${v}`)
        .join('&');
    const signature = crypto.createHash('sha1').update(toSign + apiSecret).digest('hex');
    return { signature, stringToSign: toSign };
}

export async function POST(request: NextRequest) {
    try {
        const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env as Record<string, string | undefined>;
        if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
            return NextResponse.json({ error: 'Cloudinary environment variables are missing' }, { status: 500 });
        }

        const body = await request.json().catch(() => ({}));
        const timestamp = Math.floor(Date.now() / 1000);

        // Sign ONLY the params that will be sent to Cloudinary in the form body.
        // Our client sends: file, api_key, timestamp, signature, folder
        const paramsToSign: Record<string, string | number | boolean | undefined> = {
            timestamp,
            folder: body.folder || 'mangawebsite',
            // If client includes additional signed params (e.g., public_id), include them here:
            public_id: body.public_id,
            eager: body.eager,
            transformation: body.transformation,
            context: body.context,
            tags: body.tags,
        };

        // Remove undefined so signature string matches exactly
        Object.keys(paramsToSign).forEach((k) => paramsToSign[k] === undefined && delete paramsToSign[k]);

        const { signature } = signParams(paramsToSign, CLOUDINARY_API_SECRET);

        return NextResponse.json({
            cloudName: CLOUDINARY_CLOUD_NAME,
            apiKey: CLOUDINARY_API_KEY,
            timestamp,
            folder: paramsToSign.folder,
            signature,
        });
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}


