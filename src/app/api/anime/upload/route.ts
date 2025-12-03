import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { verifyToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export const runtime = 'nodejs';

// Configure Cloudinary (using existing setup)
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload anime series cover/banner images to Cloudinary
export async function POST(request: NextRequest) {
    try {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = verifyToken(token);
        if (!payload || (payload.role !== 'admin' && payload.role !== 'creator')) {
            return NextResponse.json({ error: 'Forbidden - Admin or Creator access required' }, { status: 403 });
        }

        const formData = await request.formData();
        const type = formData.get('type') as string; // 'series' or 'episode'
        const file = formData.get('file') as File;

        if (!file || !type) {
            return NextResponse.json({ error: 'File and type are required' }, { status: 400 });
        }

        // Convert File to Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to Cloudinary
        const folder = type === 'series' ? 'anime/series' : 'anime/episodes';
        const uploadResult = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                {
                    folder: folder,
                    resource_type: 'auto',
                    allowed_formats: ['jpg', 'png', 'webp', 'mp4', 'mov', 'avi'],
                    transformation: type === 'series' ? [
                        { width: 400, height: 600, crop: 'fill', quality: 'auto' }, // Cover image
                    ] : [],
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            ).end(buffer);
        }) as any;

        return NextResponse.json({
            success: true,
            url: uploadResult.secure_url,
            publicId: uploadResult.public_id,
            width: uploadResult.width,
            height: uploadResult.height,
            format: uploadResult.format,
        });
    } catch (error: any) {
        console.error('Error uploading to Cloudinary:', error);
        return NextResponse.json(
            { error: 'Upload failed', details: error.message },
            { status: 500 }
        );
    }
}

