import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { verifyToken, requireAuth } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export const runtime = 'nodejs';

// Configure Cloudinary (using existing setup)
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Handle both file uploads (FormData) and series creation (JSON)
export async function POST(request: NextRequest) {
    try {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = verifyToken(token);
        if (!payload) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const contentType = request.headers.get('content-type') || '';

        // Check if request is JSON (series data) or FormData (file upload)
        if (contentType.includes('application/json')) {
            // Handle anime series creation (like manga upload)
            const body = await request.json();
            const { type, title, creatorName, description, genres, status, coverImage, tags } = body;

            if (type !== 'series') {
                return NextResponse.json({ error: 'Invalid type. Expected "series"' }, { status: 400 });
            }

            if (!title || !creatorName || !description || !genres || !coverImage) {
                return NextResponse.json({ 
                    error: 'Missing required fields: title, creatorName, description, genres, coverImage' 
                }, { status: 400 });
            }

            const client = await clientPromise;
            const db = client.db('mangawebsite');

            // Get user (using requireAuth to get full user object)
            const user = await requireAuth(request);

            // Create anime series document
            const now = new Date();
            const animeSeries = {
                title,
                creator: creatorName,
                creatorId: user._id,
                uploaderId: user._id.toString(),
                description,
                genres: Array.isArray(genres) ? genres : genres.split(',').map((g: string) => g.trim()),
                tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map((t: string) => t.trim())) : [],
                status: status || 'ongoing',
                coverImage,
                views: 0,
                likes: 0,
                rating: 0,
                episodeCount: 0,
                totalEpisodes: 0,
                createdAt: now,
                updatedAt: now
            };

            const result = await db.collection('anime_series').insertOne(animeSeries);
            console.log('✅ Created new anime series:', title);

            // Upgrade user to creator if they aren't already (like manga does)
            if (user.role !== 'creator' && user.role !== 'admin') {
                try {
                    const existingUser = await db.collection('users').findOne({ _id: new ObjectId(user._id) });
                    
                    if (existingUser) {
                        await db.collection('users').updateOne(
                            { _id: new ObjectId(user._id) },
                            {
                                $set: {
                                    role: 'creator',
                                    isCreator: true,
                                    creatorProfile: {
                                        displayName: creatorName || existingUser.username || 'Creator',
                                        bio: `Creator of ${title}`,
                                    },
                                    updatedAt: now
                                }
                            }
                        );
                        console.log('✅ User upgraded to creator after anime upload');
                    }
                } catch (upgradeError) {
                    console.error('⚠️ Error upgrading user to creator (non-fatal):', upgradeError);
                    // Don't fail the upload if upgrade fails
                }
            }

            return NextResponse.json({
                success: true,
                seriesId: result.insertedId.toString(),
                message: 'Anime series created successfully'
            });

        } else {
            // Handle file upload (FormData) - existing behavior for creators/admins
            if (payload.role !== 'admin' && payload.role !== 'creator') {
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
        }
    } catch (error: any) {
        console.error('Error in anime upload:', error);
        return NextResponse.json(
            { error: 'Upload failed', details: error.message },
            { status: 500 }
        );
    }
}

