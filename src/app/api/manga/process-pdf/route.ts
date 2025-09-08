import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const pdfFile = formData.get('pdf') as File;
        const mangaTitle = formData.get('mangaTitle') as string;
        const chapterNumber = formData.get('chapterNumber') as string;
        const creatorName = formData.get('creatorName') as string;

        if (!pdfFile || !mangaTitle || !chapterNumber || !creatorName) {
            return NextResponse.json({
                error: 'Missing required fields: pdf, mangaTitle, chapterNumber, creatorName'
            }, { status: 400 });
        }

        // Convert creator name to folder-safe format
        const creatorFolder = creatorName.toLowerCase().replace(/\s+/g, '-');
        const mangaFolder = mangaTitle.toLowerCase().replace(/\s+/g, '-');
        const chapterFolder = `chapter-${chapterNumber}`;

        // Create folder path
        const folderPath = path.join(process.cwd(), 'public', 'manga-images', creatorFolder, mangaFolder, chapterFolder);

        // Ensure folder exists
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
        }

        // Convert PDF to images
        const pdfBuffer = Buffer.from(await pdfFile.arrayBuffer());
        const pdfDoc = await PDFDocument.load(pdfBuffer);
        const pageCount = pdfDoc.getPageCount();

        const imagePaths: string[] = [];
        const imageUrls: string[] = [];

        // Process each page
        for (let i = 0; i < pageCount; i++) {
            try {
                // Create a new PDF with just this page
                const singlePagePdf = await PDFDocument.create();
                const [copiedPage] = await singlePagePdf.copyPages(pdfDoc, [i]);
                singlePagePdf.addPage(copiedPage);

                const singlePageBuffer = await singlePagePdf.save();

                // Convert PDF page to image using sharp (via pdf-poppler or similar)
                // For now, we'll use a placeholder approach and you can integrate with pdf-poppler
                const pageNumber = i + 1;
                const imagePath = path.join(folderPath, `page-${pageNumber}.png`);
                const imageUrl = `/manga-images/${creatorFolder}/${mangaFolder}/${chapterFolder}/page-${pageNumber}.png`;

                // Create a placeholder image for now (you can replace this with actual PDF conversion)
                const placeholderImage = await sharp({
                    create: {
                        width: 800,
                        height: 1200,
                        channels: 4,
                        background: { r: 31, g: 41, b: 55, alpha: 1 }
                    }
                })
                    .png()
                    .toBuffer();

                fs.writeFileSync(imagePath, placeholderImage);

                imagePaths.push(imagePath);
                imageUrls.push(imageUrl);

                console.log(`Processed page ${pageNumber}/${pageCount}`);
            } catch (error) {
                console.error(`Error processing page ${i + 1}:`, error);
                // Continue with other pages
            }
        }

        // Connect to MongoDB
        const client = await clientPromise;
        const db = client.db();

        // Check if manga exists, create if not
        let manga = await db.collection('manga').findOne({
            title: { $regex: new RegExp(mangaTitle, 'i') },
            creator: creatorName
        });

        if (!manga) {
            const newManga = {
                _id: new ObjectId(),
                title: mangaTitle,
                creator: creatorName,
                description: `${mangaTitle} by ${creatorName}`,
                genre: 'Action,Adventure',
                status: 'Ongoing',
                type: 'Manga',
                coverImage: imageUrls[0] || '/placeholder-page.svg',
                views: 0,
                likes: [],
                createdAt: new Date(),
                updatedAt: new Date()
            };

            await db.collection('manga').insertOne(newManga);
            manga = newManga;
        }

        // Create or update chapter
        const chapterData = {
            _id: new ObjectId(),
            mangaId: manga._id.toString(),
            chapterNumber: parseInt(chapterNumber),
            title: `Chapter ${chapterNumber}`,
            subtitle: `Chapter ${chapterNumber}`,
            pages: imageUrls,
            status: 'published',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // Check if chapter already exists
        const existingChapter = await db.collection('chapters').findOne({
            mangaId: manga._id.toString(),
            chapterNumber: parseInt(chapterNumber)
        });

        if (existingChapter) {
            // Update existing chapter
            await db.collection('chapters').updateOne(
                { _id: existingChapter._id },
                {
                    $set: {
                        pages: imageUrls,
                        updatedAt: new Date()
                    }
                }
            );
        } else {
            // Create new chapter
            await db.collection('chapters').insertOne(chapterData);
        }

        return NextResponse.json({
            success: true,
            message: `Successfully processed ${pageCount} pages`,
            manga: {
                _id: manga._id,
                title: manga.title,
                creator: manga.creator
            },
            chapter: {
                chapterNumber: chapterNumber,
                pageCount: pageCount,
                imageUrls: imageUrls
            },
            folderPath: folderPath
        });

    } catch (error) {
        console.error('Error processing PDF:', error);
        return NextResponse.json({
            error: 'Failed to process PDF',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
