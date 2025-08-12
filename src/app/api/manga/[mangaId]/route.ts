import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

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
            const uploadPath = path.join(process.cwd(), 'public', 'uploads', filename);
            // Convert to webp
            await sharp(buffer).webp({ quality: 80 }).toFile(uploadPath);
            update.coverImage = `/uploads/${filename}`;
        }
    }
    await db.collection('manga').updateOne({ _id: new ObjectId(mangaId) }, { $set: update });
    return NextResponse.json({ success: true });
} 