import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '@/lib/config';

export async function DELETE(req: NextRequest, { params }: { params: { chapterId: string } }) {
    const client = await clientPromise;
    const db = client.db();
    const chapterId = params.chapterId;
    await db.collection('chapters').deleteOne({ _id: new ObjectId(chapterId) });
    return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest, { params }: { params: { chapterId: string } }) {
    const client = await clientPromise;
    const db = client.db();
    const chapterId = params.chapterId;
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
        if (body.tags) update.tags = body.tags;
        if (body.publishDate) update.publishDate = body.publishDate;
        if (typeof body.order === 'number') update.order = body.order;
        if (Array.isArray(body.likes)) update.likes = body.likes;
        if (Array.isArray(body.comments)) update.comments = body.comments;
        if (Array.isArray(body.ratings)) update.ratings = body.ratings;
        if (typeof body.coinPrice === 'number') update.coinPrice = body.coinPrice;
        // Like/unlike logic
        if (body.action === 'like' && body.userId) {
            await db.collection('chapters').updateOne({ _id: new ObjectId(chapterId) }, { $addToSet: { likes: body.userId } });
        } else if (body.action === 'unlike' && body.userId) {
            await db.collection('chapters').updateOne({ _id: new ObjectId(chapterId) }, { $pull: { likes: body.userId } });
        }
    } else {
        const formData = await req.formData();
        if (formData.get('title')) update.title = formData.get('title');
        if (formData.get('description')) update.description = formData.get('description');
        if (formData.get('tags')) update.tags = formData.get('tags');
        if (formData.get('publishDate')) update.publishDate = formData.get('publishDate');
        if (formData.get('order')) update.order = Number(formData.get('order'));
        if (formData.get('likes')) update.likes = JSON.parse(formData.get('likes'));
        if (formData.get('comments')) update.comments = JSON.parse(formData.get('comments'));
        if (formData.get('ratings')) update.ratings = JSON.parse(formData.get('ratings'));
        // Bulk image upload for pages
        const pages = formData.getAll('pages');
        if (pages && pages.length > 0) {
            update.pages = [];
            for (const page of pages) {
                if (typeof page === 'object' && 'arrayBuffer' in page) {
                    const buffer = Buffer.from(await page.arrayBuffer());
                    const filename = `page_${chapterId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.webp`;
                    const uploadPath = path.join(process.cwd(), 'public', 'manga-images', filename);
                    // Convert to webp
                    await sharp(buffer).webp({ quality: 80 }).toFile(uploadPath);
                    update.pages.push(`/manga-images/${filename}`);
                }
            }
        }
    }
    await db.collection('chapters').updateOne({ _id: new ObjectId(chapterId) }, { $set: update });
    return NextResponse.json({ success: true });
}

export async function POST(req: NextRequest, { params }: { params: { chapterId: string } }) {
    // Unlock chapter with coins
    const auth = req.headers.get('authorization');
    if (!auth || !auth.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Missing or invalid token' }, { status: 401 });
    }
    let payload;
    try {
        payload = jwt.verify(auth.replace('Bearer ', ''), JWT_SECRET);
    } catch {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    const client = await clientPromise;
    const db = client.db();
    const user = await db.collection('users').findOne({ _id: new ObjectId(payload.userId) });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const chapter = await db.collection('chapters').findOne({ _id: new ObjectId(params.chapterId) });
    if (!chapter) return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    const coinPrice = chapter.coinPrice || 0;
    if (coinPrice <= 0) return NextResponse.json({ error: 'This chapter is free' }, { status: 400 });
    if ((user.coins || 0) < coinPrice) return NextResponse.json({ error: 'Insufficient coins' }, { status: 402 });
    // Check if already unlocked
    if (Array.isArray(user.unlockedChapters) && user.unlockedChapters.includes(params.chapterId)) {
        return NextResponse.json({ success: true, alreadyUnlocked: true });
    }
    // Deduct coins and unlock
    await db.collection('users').updateOne(
        { _id: user._id },
        { $inc: { coins: -coinPrice }, $addToSet: { unlockedChapters: params.chapterId } }
    );
    await db.collection('transactions').insertOne({ userId: user._id.toString(), type: 'spend', amount: coinPrice, description: `Unlock chapter ${params.chapterId}`, chapterId: params.chapterId, createdAt: new Date() });
    return NextResponse.json({ success: true });
} 