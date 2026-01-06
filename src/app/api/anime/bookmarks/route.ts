import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

// GET: Fetch user's bookmarks
export async function GET(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
        const payload = jwt.verify(token, JWT_SECRET) as any;
        const userId = payload.userId || payload._id;

        if (!userId) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const seriesId = searchParams.get('seriesId');
        const episodeId = searchParams.get('episodeId');

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        const query: any = { userId: new ObjectId(userId) };
        if (seriesId) query.seriesId = new ObjectId(seriesId);
        if (episodeId) query.episodeId = new ObjectId(episodeId);

        const bookmarks = await db.collection('anime_bookmarks').find(query).toArray();

        return NextResponse.json({ bookmarks });
    } catch (error) {
        console.error('Error fetching bookmarks:', error);
        return NextResponse.json(
            { error: 'Failed to fetch bookmarks' },
            { status: 500 }
        );
    }
}

// POST: Create or update a bookmark
export async function POST(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
        const payload = jwt.verify(token, JWT_SECRET) as any;
        const userId = payload.userId || payload._id;

        if (!userId) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const body = await request.json();
        const { seriesId, episodeId, episodeNumber, position, note } = body;

        if (!seriesId || !episodeId) {
            return NextResponse.json(
                { error: 'Series ID and Episode ID are required' },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Check if bookmark already exists
        const existingBookmark = await db.collection('anime_bookmarks').findOne({
            userId: new ObjectId(userId),
            seriesId: new ObjectId(seriesId),
            episodeId: new ObjectId(episodeId),
        });

        const bookmarkData = {
            userId: new ObjectId(userId),
            seriesId: new ObjectId(seriesId),
            episodeId: new ObjectId(episodeId),
            episodeNumber: episodeNumber || 1,
            position: position || 0,
            note: note || null,
            updatedAt: new Date(),
        };

        if (existingBookmark) {
            // Update existing bookmark
            await db.collection('anime_bookmarks').updateOne(
                { _id: existingBookmark._id },
                { $set: bookmarkData }
            );
        } else {
            // Create new bookmark
            bookmarkData.createdAt = new Date();
            await db.collection('anime_bookmarks').insertOne({
                _id: new ObjectId(),
                ...bookmarkData,
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Bookmark saved successfully',
        });
    } catch (error) {
        console.error('Error saving bookmark:', error);
        return NextResponse.json(
            { error: 'Failed to save bookmark' },
            { status: 500 }
        );
    }
}

// DELETE: Remove a bookmark
export async function DELETE(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
        const payload = jwt.verify(token, JWT_SECRET) as any;
        const userId = payload.userId || payload._id;

        if (!userId) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const seriesId = searchParams.get('seriesId');
        const episodeId = searchParams.get('episodeId');

        if (!seriesId || !episodeId) {
            return NextResponse.json(
                { error: 'Series ID and Episode ID are required' },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        await db.collection('anime_bookmarks').deleteOne({
            userId: new ObjectId(userId),
            seriesId: new ObjectId(seriesId),
            episodeId: new ObjectId(episodeId),
        });

        return NextResponse.json({
            success: true,
            message: 'Bookmark removed successfully',
        });
    } catch (error) {
        console.error('Error deleting bookmark:', error);
        return NextResponse.json(
            { error: 'Failed to delete bookmark' },
            { status: 500 }
        );
    }
}

