import { NextRequest, NextResponse } from 'next/server';
import { requireCreator } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { mkdir, writeFile, readdir, stat, unlink } from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { promisify } from 'util';
import { exec } from 'child_process';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const execAsync = promisify(exec);

async function ensureMangaOwnership(mangaId: string, userId: string) {
    const client = await clientPromise;
    const db = client.db();
    const manga = await db.collection('manga').findOne({ _id: new ObjectId(mangaId) });

    if (!manga) {
        throw new Error('MANGA_NOT_FOUND');
    }

    if (manga.uploaderId?.toString() !== userId.toString()) {
        throw new Error('FORBIDDEN');
    }

    return manga;
}

async function processPdf(pdfFile: File, outputDir: string, mangaTitle: string, chapterNumber: string | number) {
    const tempPdfPath = path.join(outputDir, `chapter-${chapterNumber}-${Date.now()}.pdf`);
    const pdfBuffer = Buffer.from(await pdfFile.arrayBuffer());
    await writeFile(tempPdfPath, pdfBuffer);

    try {
        try {
            await execAsync('pdftoppm -v');
        } catch {
            // Poppler not installed - create placeholder
            const { createCanvas } = await import('canvas');
            const fallbackPath = path.join(outputDir, 'page-1.png');
            const canvas = createCanvas(800, 1200);
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(0, 0, 800, 1200);
            ctx.fillStyle = '#e2e8f0';
            ctx.font = 'bold 36px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('PDF Upload Pending', 400, 420);
            ctx.font = '24px Arial';
            ctx.fillText(mangaTitle, 400, 470);
            ctx.fillText(`Chapter ${chapterNumber}`, 400, 510);
            ctx.fillText('Install Poppler to enable conversion', 400, 580);
            await writeFile(fallbackPath, canvas.toBuffer('image/png'));
            return [fallbackPath];
        }

        const convertCommand = `pdftoppm -png -r 250 "${tempPdfPath}" "${path.join(outputDir, 'page')}"`;
        const { stderr } = await execAsync(convertCommand);
        if (stderr) {
            console.warn('pdftoppm stderr:', stderr);
        }

        const files = (await readdir(outputDir))
            .filter((file) => file.startsWith('page') && file.endsWith('.png'))
            .map((file) => path.join(outputDir, file))
            .sort((a, b) => a.localeCompare(b));

        if (files.length === 0) {
            throw new Error('PDF_CONVERSION_FAILED');
        }

        return files;
    } finally {
        try {
            await unlink(tempPdfPath);
        } catch {
            // ignore
        }
    }
}

async function processImages(files: File[], outputDir: string, prefix: string) {
    const savedFiles: string[] = [];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!(file instanceof File)) continue;

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const filename = `${prefix}-page-${i + 1}-${Date.now()}.webp`;
        const targetPath = path.join(outputDir, filename);

        await sharp(buffer)
            .resize(1200, 1800, { fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 90 })
            .toFile(targetPath);

        savedFiles.push(targetPath);
    }

    return savedFiles;
}

export async function POST(req: NextRequest) {
    try {
        const user = await requireCreator(req);
        const formData = await req.formData();

        const mangaId = formData.get('mangaId')?.toString();
        const rawChapterNumber = formData.get('chapterNumber')?.toString();
        const chapterTitle = formData.get('title')?.toString();
        const status = formData.get('status')?.toString() || 'draft';
        const publishDate = formData.get('publishDate')?.toString();
        const pdfFile = formData.get('pdf') as File | null;
        const imageFiles = formData.getAll('pages') as File[];

        if (!mangaId || !rawChapterNumber || !chapterTitle) {
            return NextResponse.json({
                error: 'Missing required fields',
                missing: {
                    mangaId: !mangaId,
                    chapterNumber: !rawChapterNumber,
                    title: !chapterTitle
                }
            }, { status: 400 });
        }

        const chapterNumber = isNaN(Number(rawChapterNumber)) ? rawChapterNumber : Number(rawChapterNumber);

        const manga = await ensureMangaOwnership(mangaId, user._id);
        const client = await clientPromise;
        const db = client.db();

        const baseDir = path.join(
            process.cwd(),
            'public',
            'manga-content',
            mangaId,
            `chapter-${chapterNumber}`
        );
        await mkdir(baseDir, { recursive: true });

        let storedFiles: string[] = [];
        if (pdfFile) {
            storedFiles = await processPdf(pdfFile, baseDir, manga.title, chapterNumber);
        } else if (imageFiles && imageFiles.length > 0) {
            storedFiles = await processImages(imageFiles, baseDir, mangaId);
        } else {
            return NextResponse.json({ error: 'No pages provided' }, { status: 400 });
        }

        const pages = await Promise.all(
            storedFiles.map(async (filePath, index) => {
                const fileStats = await stat(filePath);
                const relativePath = filePath.replace(process.cwd() + path.sep + 'public', '').replace(/\\/g, '/');

                return {
                    pageNumber: index + 1,
                    imagePath: relativePath,
                    size: fileStats.size,
                    format: path.extname(filePath).replace('.', '') || 'png',
                };
            })
        );

        const now = new Date();
        const chapterDoc = {
            mangaId,
            title: chapterTitle,
            chapterNumber,
            status,
            pages: pages.map((page) => page.imagePath),
            pageMetadata: pages,
            pageCount: pages.length,
            views: 0,
            likes: [],
            comments: [],
            createdAt: now,
            updatedAt: now,
            publishDate: publishDate ? new Date(publishDate) : now,
            uploaderId: user._id.toString()
        };

        const result = await db.collection('chapters').insertOne(chapterDoc);

        await db.collection('manga').updateOne(
            { _id: new ObjectId(mangaId) },
            { $set: { updatedAt: now, lastPublishedAt: now }, $inc: { chapterCount: 1 } }
        );

        return NextResponse.json({
            success: true,
            chapterId: result.insertedId.toString(),
            chapter: {
                _id: result.insertedId.toString(),
                ...chapterDoc
            }
        }, { status: 201 });
    } catch (error) {
        console.error('Upload chapter error:', error);

        if (error instanceof Error) {
            if (error.message === 'MANGA_NOT_FOUND') {
                return NextResponse.json({ error: 'Manga not found' }, { status: 404 });
            }
            if (error.message === 'FORBIDDEN') {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
            if (error.message === 'PDF_CONVERSION_FAILED') {
                return NextResponse.json({
                    error: 'Failed to convert PDF into images. Please upload images instead.'
                }, { status: 422 });
            }
        }

        return NextResponse.json({
            error: 'Failed to upload chapter',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

