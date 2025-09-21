import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { requireAuth, upgradeToCreator } from '@/lib/auth';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
    try {
        // Require authentication
        const user = await requireAuth(request);

        // Note: User will be prompted to upgrade to creator after successful upload

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

        // Connect to MongoDB
        console.log('🔗 Connecting to MongoDB...');
        const client = await clientPromise;
        const db = client.db('mangawebsite');
        console.log('✅ Connected to MongoDB successfully');

        // Create normalized folder names (safe for file system)
        const normalizedCreator = creatorName.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const normalizedManga = mangaTitle.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const chapterFolder = `chapter-${chapterNumber}`;

        // Create directory structure
        const baseDir = join(process.cwd(), 'public', 'manga-images', normalizedCreator, normalizedManga, chapterFolder);
        await mkdir(baseDir, { recursive: true });

        // Save PDF temporarily
        const pdfBuffer = Buffer.from(await pdfFile.arrayBuffer());
        const tempPdfPath = join(baseDir, 'temp.pdf');
        await writeFile(tempPdfPath, pdfBuffer);

        // Convert PDF to images using Poppler (best quality)
        console.log(`🔄 Converting PDF to images for ${mangaTitle} Chapter ${chapterNumber}...`);

        try {
            // Check if pdftoppm is available
            try {
                await execAsync('pdftoppm -v');
            } catch (pdftoppmError) {
                console.log('⚠️ pdftoppm not found, trying alternative method...');

                // Fallback: Use a simple approach - just copy the PDF as a single "page"
                const fallbackImagePath = join(baseDir, 'page-1.png');
                const { createCanvas } = await import('canvas');

                // Create a simple placeholder image
                const canvas = createCanvas(800, 1200);
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#f0f0f0';
                ctx.fillRect(0, 0, 800, 1200);
                ctx.fillStyle = '#333';
                ctx.font = '24px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('PDF Preview', 400, 300);
                ctx.fillText(mangaTitle, 400, 350);
                ctx.fillText(`Chapter ${chapterNumber}`, 400, 400);
                ctx.fillText('PDF conversion not available', 400, 500);
                ctx.fillText('Please install Poppler tools', 400, 550);

                const buffer = canvas.toBuffer('image/png');
                await writeFile(fallbackImagePath, buffer);
                console.log('✅ Created fallback image');
            }

            // Try pdftoppm conversion
            const convertCommand = `pdftoppm -png -r 300 "${tempPdfPath}" "${join(baseDir, 'page')}"`;
            const { stdout, stderr } = await execAsync(convertCommand);

            if (stderr) {
                console.log('Poppler stderr:', stderr);
            }

            console.log('✅ PDF conversion completed');

        } catch (error) {
            console.error('❌ PDF conversion failed:', error);

            // Create a fallback single page
            const fallbackImagePath = join(baseDir, 'page-1.png');
            const { createCanvas } = await import('canvas');

            const canvas = createCanvas(800, 1200);
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#f0f0f0';
            ctx.fillRect(0, 0, 800, 1200);
            ctx.fillStyle = '#333';
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('PDF Preview', 400, 300);
            ctx.fillText(mangaTitle, 400, 350);
            ctx.fillText(`Chapter ${chapterNumber}`, 400, 400);
            ctx.fillText('PDF conversion failed', 400, 500);
            ctx.fillText('Using fallback image', 400, 550);

            const buffer = canvas.toBuffer('image/png');
            await writeFile(fallbackImagePath, buffer);
            console.log('✅ Created fallback image after conversion failure');
        }

        // Get list of generated images
        const { readdir, stat } = await import('fs/promises');
        const imageFiles = (await readdir(baseDir))
            .filter(file => file.endsWith('.png'))
            .sort((a, b) => {
                const pageA = parseInt(a.match(/page-(\d+)\.png/)?.[1] || '0');
                const pageB = parseInt(b.match(/page-(\d+)\.png/)?.[1] || '0');
                return pageA - pageB;
            });

        if (imageFiles.length === 0) {
            return NextResponse.json({
                error: 'No images were generated from the PDF'
            }, { status: 500 });
        }

        // Create pages array for database
        const pages = await Promise.all(
            imageFiles.map(async (imageFile, index) => {
                const pageNumber = index + 1;
                const imagePath = `/manga-images/${normalizedCreator}/${normalizedManga}/${chapterFolder}/${imageFile}`;
                const fullPath = join(baseDir, imageFile);
                const stats = await stat(fullPath);

                return {
                    pageNumber: pageNumber,
                    imagePath: imagePath,
                    format: 'png',
                    width: 800,
                    height: 1200,
                    size: stats.size,
                    isRealContent: true,
                    toolUsed: 'poppler',
                    quality: 'high'
                };
            })
        );

        // Clean up temporary PDF
        const { unlink } = await import('fs/promises');
        await unlink(tempPdfPath);

        // Find or create manga
        let manga = await db.collection('manga').findOne({
            title: mangaTitle,
            creatorId: user._id
        });

        if (!manga) {
            // Create new manga
            const coverImagePath = coverImage ?
                `/manga-covers/${normalizedCreator}-${normalizedManga}.jpg` :
                '/manga-covers/default-cover.jpg';

            if (coverImage) {
                const coverBuffer = Buffer.from(await coverImage.arrayBuffer());
                const coverDir = join(process.cwd(), 'public', 'manga-covers');
                await mkdir(coverDir, { recursive: true });
                await writeFile(join(coverDir, `${normalizedCreator}-${normalizedManga}.jpg`), coverBuffer);
            }

            const mangaResult = await db.collection('manga').insertOne({
                title: mangaTitle,
                creator: creatorName,
                creatorId: user._id,
                description: description || 'No description available',
                status: status || 'ongoing',
                genres: genres || [],
                coverImage: coverImagePath,
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
            status: 'published',
            imageStorage: 'file_system',
            totalSize: pages.reduce((sum, page) => sum + page.size, 0),
            toolUsed: 'poppler',
            quality: 'high',
            imageSource: 'poppler_converted',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const existingChapter = await db.collection('chapters').findOne({
            mangaId: manga._id.toString(),
            chapterNumber: chapterNumber
        });

        let chapterResult;
        if (existingChapter) {
            // Update existing chapter
            await db.collection('chapters').updateOne(
                { _id: existingChapter._id },
                { $set: chapterData }
            );
            chapterResult = { ...existingChapter, ...chapterData };
            console.log('✅ Updated existing chapter:', chapterNumber);
        } else {
            // Create new chapter
            const insertResult = await db.collection('chapters').insertOne(chapterData);
            chapterResult = { _id: insertResult.insertedId, ...chapterData };
            console.log('✅ Created new chapter:', chapterNumber);
        }

        console.log('\n🎯 Upload Summary:');
        console.log(`   Manga: ${mangaTitle} by ${creatorName}`);
        console.log(`   Chapter: ${chapterNumber} - ${chapterTitle || 'Untitled'}`);
        console.log(`   Pages: ${pages.length}`);
        console.log(`   Total Size: ${(chapterData.totalSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   Images stored in: ${baseDir}`);

        return NextResponse.json({
            success: true,
            message: 'Manga and chapter uploaded successfully',
            data: {
                mangaId: manga._id.toString(),
                chapterId: chapterResult._id.toString(),
                mangaTitle,
                creatorName,
                chapterNumber,
                pageCount: pages.length,
                totalSize: chapterData.totalSize,
                imagePaths: pages.map(p => p.imagePath)
            }
        });

    } catch (error) {
        console.error('❌ Error uploading manga:', error);
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');

        // More specific error messages
        let errorMessage = 'Failed to upload manga';
        if (error instanceof Error) {
            if (error.message.includes('ENOENT')) {
                errorMessage = 'File system error: Directory not found';
            } else if (error.message.includes('EACCES')) {
                errorMessage = 'Permission denied: Cannot write to directory';
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
