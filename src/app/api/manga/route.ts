import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import fs from 'fs';
import path from 'path';

// GET: List manga with pagination and sorting
export async function GET(req: NextRequest) {
    try {
        const client = await clientPromise;
        const db = client.db();
        const mangaCol = db.collection('manga');

        const { searchParams } = new URL(req.url);
        const sort = searchParams.get('sort') || 'latest';
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const skip = (page - 1) * limit;

        // Sorting logic
        let sortObj: any = { createdAt: -1 };
        if (sort === 'title') sortObj = { title: 1 };
        if (sort === 'popular') sortObj = { views: -1 };
        if (sort === 'likes') sortObj = { likes: -1 };

        // Query all manga
        const totalCount = await mangaCol.countDocuments();
        const manga = await mangaCol.find({})
            .sort(sortObj)
            .skip(skip)
            .limit(limit)
            .toArray();

        // Convert ObjectId to string and validate coverImage path
        const mangaList = manga.map(m => {
            let coverImage = m.coverImage;
            if (coverImage && typeof coverImage === 'string' && coverImage.startsWith('/uploads/')) {
                const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
                const filePath = path.join(uploadsDir, path.basename(coverImage));
                if (!fs.existsSync(filePath)) {
                    coverImage = '/images/default-cover.jpg';
                }
            } else if (!coverImage) {
                coverImage = '/images/default-cover.jpg';
            }
            return {
                ...m,
                _id: m._id.toString(),
                createdAt: m.createdAt ? m.createdAt.toString() : null,
                coverImage,
            };
        });

        return NextResponse.json({
            manga: mangaList,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalCount / limit),
                totalCount,
                hasNextPage: page * limit < totalCount,
                hasPrevPage: page > 1,
                limit
            },
            sort
        });
    } catch (error) {
        console.error('Manga API error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

// POST: Upload new manga
export async function POST(req: NextRequest) {
    try {
        const client = await clientPromise;
        const db = client.db();
        const mangaCol = db.collection('manga');

        let data: any = {};
        let isJson = false;
        const contentType = req.headers.get('content-type') || '';
        let coverImagePath = '/images/default-cover.jpg';
        if (contentType.includes('application/json')) {
            data = await req.json();
            isJson = true;
        } else {
            const formData = await req.formData();
            data = {
                title: formData.get('title'),
                description: formData.get('description'),
                genre: formData.get('genre'),
                chapterNumber: formData.get('chapterNumber'),
                tags: formData.get('tags'),
                status: formData.get('status'),
                coverImage: formData.get('coverImage'),
                pdfFile: formData.get('pdfFile'),
                chapterUpload: formData.get('chapterUpload'),
                mangaId: formData.get('mangaId'),
                subtitle: formData.get('subtitle'),
                coverPage: formData.get('coverPage'),
            };
            // Save cover image file if present
            const coverImageFile = data.coverImage;
            if (coverImageFile && typeof coverImageFile === 'object' && 'arrayBuffer' in coverImageFile) {
                const buffer = Buffer.from(await coverImageFile.arrayBuffer());
                const filename = `cover_${Date.now()}_${coverImageFile.name}`;
                const uploadPath = path.join(process.cwd(), 'public', 'uploads', filename);
                fs.mkdirSync(path.dirname(uploadPath), { recursive: true });
                fs.writeFileSync(uploadPath, buffer);
                coverImagePath = `/uploads/${filename}`;
            }
        }

        const { title, description, genre, chapterNumber, tags, status, chapterUpload, mangaId, subtitle, coverPage } = data;

        // Validate based on upload type
        if (chapterUpload === '1') {
            if (!mangaId) return NextResponse.json({ error: 'Missing manga ID' }, { status: 400 });
            if (!chapterNumber) return NextResponse.json({ error: 'Missing chapter number' }, { status: 400 });
            if (!description) return NextResponse.json({ error: 'Missing description' }, { status: 400 });
            if (!coverPage) return NextResponse.json({ error: 'Missing cover page' }, { status: 400 });
            // TODO: Save coverPage and pdfFile for chapters
            return NextResponse.json({ success: true, message: 'Chapter uploaded successfully!' });
        } else {
            if (!title) return NextResponse.json({ error: 'Missing title' }, { status: 400 });
            if (!description) return NextResponse.json({ error: 'Missing description' }, { status: 400 });
            if (!genre) return NextResponse.json({ error: 'Missing genre' }, { status: 400 });
            if (!chapterNumber) return NextResponse.json({ error: 'Missing chapter number' }, { status: 400 });
            if (!isJson) {
                if (!data.coverImage) return NextResponse.json({ error: 'Missing cover image' }, { status: 400 });
                if (!data.pdfFile) return NextResponse.json({ error: 'Missing PDF file' }, { status: 400 });
            }
            // coverImagePath is always set (default or uploaded)

            // Insert new manga into MongoDB
            const newManga = {
                title,
                description,
                genre,
                chapterNumber,
                tags,
                status: status || 'Ongoing',
                coverImage: coverImagePath,
                likes: 0,
                views: 0,
                createdAt: new Date(),
            };
            const result = await mangaCol.insertOne(newManga);
            const inserted = { ...newManga, _id: result.insertedId.toString(), createdAt: newManga.createdAt.toISOString() };
            return NextResponse.json({ success: true, message: 'Manga uploaded successfully!', manga: inserted });
        }
    } catch (error) {
        console.error('Manga upload API error:', error);
        return NextResponse.json(
            { error: 'Upload failed', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
} 