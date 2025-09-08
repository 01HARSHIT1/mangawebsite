import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

export async function GET(req: NextRequest, { params }: { params: { mangaId: string } }) {
    try {
        const client = await clientPromise;
        const db = client.db('mangawebsite');
        const mangaId = params.mangaId;

        // Validate ObjectId
        if (!ObjectId.isValid(mangaId)) {
            return NextResponse.json({ error: 'Invalid manga ID' }, { status: 400 });
        }

        const manga = await db.collection('manga').findOne({ _id: new ObjectId(mangaId) });

        if (!manga) {
            return NextResponse.json({ error: 'Manga not found' }, { status: 404 });
        }

        return NextResponse.json({
            manga: {
                _id: manga._id.toString(),
                title: manga.title,
                creator: manga.creator,
                description: manga.description,
                genres: manga.genres || [],
                status: manga.status || 'ongoing',
                coverImage: manga.coverImage,
                views: manga.views || 0,
                likes: manga.likes || 0,
                createdAt: manga.createdAt,
                updatedAt: manga.updatedAt
            }
        });

    } catch (error) {
        console.error('Error fetching manga:', error);
        return NextResponse.json(
            { error: 'Failed to fetch manga' },
            { status: 500 }
        );
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { mangaId: string } }) {
    const client = await clientPromise;
    const db = client.db();
    const mangaId = params.mangaId;
    await db.collection('manga').deleteOne({ _id: new ObjectId(mangaId) });
    await db.collection('chapters').deleteMany({ mangaId });
    return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest, { params }: { params: { mangaId: string } }) {
    const client = await clientPromise;
    const db = client.db();
    const mangaId = params.mangaId;
    let update: any = {};
    let isJson = false;
    let body: any;
    try {
        body = await req.json();
        isJson = true;
    } catch {
        // Not JSON, try FormData
    }
    if (isJson) {
        if (body.title) update.title = body.title;
        if (body.description) update.description = body.description;
        if (body.genre) update.genre = body.genre;
        if (body.tags) update.tags = body.tags;
        if (typeof body.order === 'number') update.order = body.order;
        if (Array.isArray(body.subscribers)) update.subscribers = body.subscribers;
        if (Array.isArray(body.likes)) update.likes = body.likes;
        if (Array.isArray(body.ratings)) update.ratings = body.ratings;
        // Like/unlike logic
        if (body.action === 'like' && body.userId) {
            await db.collection('manga').updateOne({ _id: new ObjectId(mangaId) }, { $addToSet: { likes: body.userId } });
        } else if (body.action === 'unlike' && body.userId) {
            await db.collection('manga').updateOne({ _id: new ObjectId(mangaId) }, { $pull: { likes: body.userId } });
        }
    } else {
        const formData = await req.formData();
        if (formData.get('title')) update.title = formData.get('title');
        if (formData.get('description')) update.description = formData.get('description');
        if (formData.get('genre')) update.genre = formData.get('genre');
        if (formData.get('tags')) update.tags = formData.get('tags');
        if (formData.get('order')) update.order = Number(formData.get('order'));
        if (formData.get('subscribers')) update.subscribers = JSON.parse(formData.get('subscribers'));
        if (formData.get('likes')) update.likes = JSON.parse(formData.get('likes'));
        if (formData.get('ratings')) update.ratings = JSON.parse(formData.get('ratings'));
        const coverImage = formData.get('coverImage');
        if (coverImage && typeof coverImage === 'object' && 'arrayBuffer' in coverImage) {
            const buffer = Buffer.from(await coverImage.arrayBuffer());
            const filename = `cover_${mangaId}_${Date.now()}.webp`;
            const uploadPath = path.join(process.cwd(), 'public', 'manga-covers', filename);
            // Convert to webp
            await sharp(buffer).webp({ quality: 80 }).toFile(uploadPath);
            update.coverImage = `/manga-covers/${filename}`;
        }
    }
    await db.collection('manga').updateOne({ _id: new ObjectId(mangaId) }, { $set: update });
    return NextResponse.json({ success: true });
} 