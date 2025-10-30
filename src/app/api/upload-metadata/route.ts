import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// This route saves metadata for manga or chapter after files are uploaded to Cloudinary directly.
// Expected body (JSON):
// {
//   type: 'manga' | 'chapter',
//   userId: string,
//   manga: { title, creatorName, description, genres, status, coverImage: { public_id, secure_url }, pdfFile: { public_id, secure_url } }
// }
// or for chapters:
// {
//   type: 'chapter',
//   userId: string,
//   mangaId: string,
//   chapter: { chapterNumber, chapterTitle, chapterSubtitle, coverImage: { public_id, secure_url }, pdfFile: { public_id, secure_url }, description }
// }

export async function POST(request: NextRequest) {
    try {
        const dbClient = await clientPromise;
        const db = dbClient.db(process.env.MONGODB_DB || 'mangawebsite');

        const body = await request.json();
        const { type, userId } = body || {};
        if (!type || !userId) {
            return NextResponse.json({ error: 'Missing required fields: type, userId' }, { status: 400 });
        }

        if (type === 'manga') {
            const { manga } = body;
            if (!manga?.title || !manga?.creatorName || !manga?.description || !manga?.genres || !manga?.status || !manga?.coverImage?.public_id || !manga?.pdfFile?.public_id) {
                return NextResponse.json({ error: 'Missing manga fields or Cloudinary public IDs' }, { status: 400 });
            }

            // Insert manga document
            const mangaDoc = {
                title: manga.title,
                creator: manga.creatorName,
                description: manga.description,
                genres: typeof manga.genres === 'string' ? manga.genres.split(',').map((g: string) => g.trim()).filter(Boolean) : manga.genres,
                status: manga.status,
                coverImage: manga.coverImage, // { public_id, secure_url }
                pdfFile: manga.pdfFile,       // { public_id, secure_url }
                createdBy: new ObjectId(userId),
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            const result = await db.collection('manga').insertOne(mangaDoc);

            // Also create initial chapter entry using provided chapterNumber/Title (if present)
            if (manga.chapterNumber) {
                await db.collection('chapters').insertOne({
                    mangaId: String(result.insertedId),
                    chapterNumber: Number(manga.chapterNumber),
                    title: manga.chapterTitle || `Chapter ${manga.chapterNumber}`,
                    subtitle: manga.chapterSubtitle || '',
                    description: manga.description || '',
                    coverPage: manga.coverImage?.secure_url || null,
                    pages: [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    publishDate: new Date().toISOString(),
                });
            }

            return NextResponse.json({ success: true, mangaId: String(result.insertedId) });
        }

        if (type === 'chapter') {
            const { mangaId, chapter } = body;
            if (!mangaId || !chapter?.chapterNumber || !chapter?.description || !chapter?.coverImage?.public_id || !chapter?.pdfFile?.public_id) {
                return NextResponse.json({ error: 'Missing chapter fields or Cloudinary public IDs' }, { status: 400 });
            }

            // Ensure manga exists
            const manga = await db.collection('manga').findOne({ _id: new ObjectId(mangaId) });
            if (!manga) {
                return NextResponse.json({ error: 'Manga not found' }, { status: 404 });
            }

            const chapterDoc = {
                mangaId: String(mangaId),
                chapterNumber: Number(chapter.chapterNumber),
                title: chapter.chapterTitle || `Chapter ${chapter.chapterNumber}`,
                subtitle: chapter.chapterSubtitle || '',
                description: chapter.description,
                coverPage: chapter.coverImage?.secure_url || null,
                pages: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                publishDate: new Date().toISOString(),
            };
            const result = await db.collection('chapters').insertOne(chapterDoc);
            return NextResponse.json({ success: true, chapterId: String(result.insertedId) });
        }

        return NextResponse.json({ error: 'Unsupported type' }, { status: 400 });
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}


