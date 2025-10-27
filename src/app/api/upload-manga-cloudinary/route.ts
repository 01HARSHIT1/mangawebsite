import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import clientPromise from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { Readable } from 'stream';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log('☁️ Cloudinary configured:', {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    hasApiKey: !!process.env.CLOUDINARY_API_KEY,
    hasApiSecret: !!process.env.CLOUDINARY_API_SECRET
});

// Helper function to convert File to Buffer
async function fileToBuffer(file: File): Promise<Buffer> {
    const arrayBuffer = await file.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

// Helper function to upload buffer to Cloudinary
async function uploadToCloudinary(buffer: Buffer, folder: string, filename: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: folder,
                public_id: filename,
                resource_type: 'auto',
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result!.secure_url);
            }
        );

        const readableStream = new Readable();
        readableStream.push(buffer);
        readableStream.push(null);
        readableStream.pipe(uploadStream);
    });
}

export async function POST(request: NextRequest) {
    try {
        // Require authentication
        const user = await requireAuth(request);

        const formData = await request.formData();

        // Extract form data
        const mangaTitle = formData.get('mangaTitle') as string;
        const creatorName = formData.get('creatorName') as string;
        const description = formData.get('description') as string;
        const genres = (formData.get('genres') as string).split(',').map(g => g.trim());
        const status = formData.get('status') as string;
        const chapterNumber = parseInt(formData.get('chapterNumber') as string);
        const chapterTitle = formData.get('chapterTitle') as string;
        const chapterSubtitle = formData.get('chapterSubtitle') as string;
        const pdfFile = formData.get('pdfFile') as File;
        const coverImage = formData.get('coverImage') as File;

        if (!mangaTitle || !creatorName || !pdfFile) {
            return NextResponse.json({
                error: 'Missing required fields: mangaTitle, creatorName, pdfFile'
            }, { status: 400 });
        }

        console.log('🔗 Connecting to MongoDB...');
        const client = await clientPromise;
        const db = client.db('mangawebsite');
        console.log('✅ Connected to MongoDB successfully');

        // Create normalized names for Cloudinary folders
        const normalizedCreator = creatorName.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const normalizedManga = mangaTitle.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const chapterFolder = `manga/${normalizedCreator}/${normalizedManga}/chapter-${chapterNumber}`;

        console.log(`☁️ Uploading to Cloudinary: ${chapterFolder}`);

        // Upload PDF to Cloudinary
        const pdfBuffer = await fileToBuffer(pdfFile);
        const pdfUrl = await uploadToCloudinary(
            pdfBuffer,
            chapterFolder,
            `chapter-${chapterNumber}-pdf`
        );

        console.log('✅ PDF uploaded to Cloudinary:', pdfUrl);

        // For now, we'll store the PDF URL. In a production app, you'd convert PDF to images
        // Using a service like pdf2pic or Cloudinary's transformation API
        const pages = [{
            pageNumber: 1,
            imagePath: pdfUrl,
            format: 'pdf',
            width: 800,
            height: 1200,
            size: pdfBuffer.length,
            isRealContent: true,
            toolUsed: 'cloudinary',
            quality: 'high'
        }];

        // Find or create manga
        let manga = await db.collection('manga').findOne({
            title: mangaTitle,
            creatorId: user._id
        });

        if (!manga) {
            // Upload cover image to Cloudinary
            let coverImageUrl = 'https://res.cloudinary.com/demo/image/upload/sample.jpg'; // Default

            if (coverImage) {
                const coverBuffer = await fileToBuffer(coverImage);
                coverImageUrl = await uploadToCloudinary(
                    coverBuffer,
                    `manga/${normalizedCreator}/${normalizedManga}`,
                    'cover'
                );
                console.log('✅ Cover image uploaded to Cloudinary:', coverImageUrl);
            }

            const mangaResult = await db.collection('manga').insertOne({
                title: mangaTitle,
                creator: creatorName,
                creatorId: user._id,
                description: description || 'No description available',
                status: status || 'ongoing',
                genres: genres || [],
                coverImage: coverImageUrl,
                views: 0,
                likes: 0,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            manga = { _id: mangaResult.insertedId };
            console.log('✅ Created new manga:', mangaTitle);
        } else {
            console.log('✅ Found existing manga:', mangaTitle);
        }

        // Create or update chapter
        const chapterData = {
            mangaId: manga._id.toString(),
            chapterNumber: chapterNumber,
            title: chapterTitle || `Chapter ${chapterNumber}`,
            subtitle: chapterSubtitle || '',
            pages: pages,
            pdfUrl: pdfUrl,
            status: 'published',
            imageStorage: 'cloudinary',
            totalSize: pdfBuffer.length,
            toolUsed: 'cloudinary',
            quality: 'high',
            imageSource: 'cloudinary_upload',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const existingChapter = await db.collection('chapters').findOne({
            mangaId: manga._id.toString(),
            chapterNumber: chapterNumber
        });

        let chapterResult;
        if (existingChapter) {
            await db.collection('chapters').updateOne(
                { _id: existingChapter._id },
                { $set: chapterData }
            );
            chapterResult = { ...existingChapter, ...chapterData };
            console.log('✅ Updated existing chapter:', chapterNumber);
        } else {
            const insertResult = await db.collection('chapters').insertOne(chapterData);
            chapterResult = { _id: insertResult.insertedId, ...chapterData };
            console.log('✅ Created new chapter:', chapterNumber);
        }

        console.log('\n🎯 Upload Summary:');
        console.log(`   Manga: ${mangaTitle} by ${creatorName}`);
        console.log(`   Chapter: ${chapterNumber} - ${chapterTitle || 'Untitled'}`);
        console.log(`   PDF URL: ${pdfUrl}`);
        console.log(`   Total Size: ${(chapterData.totalSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   Storage: Cloudinary`);

        return NextResponse.json({
            success: true,
            message: 'Manga and chapter uploaded successfully to Cloudinary',
            data: {
                mangaId: manga._id.toString(),
                chapterId: chapterResult._id.toString(),
                mangaTitle,
                creatorName,
                chapterNumber,
                pdfUrl,
                totalSize: chapterData.totalSize,
                storage: 'cloudinary'
            }
        });

    } catch (error) {
        console.error('❌ Error uploading manga to Cloudinary:', error);
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');

        let errorMessage = 'Failed to upload manga to Cloudinary';
        if (error instanceof Error) {
            if (error.message.includes('Cloudinary')) {
                errorMessage = 'Cloudinary upload error: Check your API credentials';
            } else if (error.message.includes('MongoDB')) {
                errorMessage = 'Database connection error';
            } else {
                errorMessage = error.message;
            }
        }

        return NextResponse.json({
            error: errorMessage,
            details: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}

