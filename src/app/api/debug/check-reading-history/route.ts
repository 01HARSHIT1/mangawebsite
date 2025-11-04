import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

export async function GET(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'No token provided' }, { status: 401 });
        }

        const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
        const client = await clientPromise;
        const db = client.db('mangawebsite');
        
        const user = await db.collection('users').findOne({ _id: new ObjectId(payload.userId) });
        
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            userId: user._id.toString(),
            username: user.username,
            email: user.email,
            hasReadingHistory: !!user.readingHistory,
            readingHistoryCount: user.readingHistory?.length || 0,
            readingHistory: user.readingHistory || [],
            hasBookmarks: !!user.bookmarks,
            bookmarksCount: user.bookmarks?.length || 0,
            bookmarks: user.bookmarks || [],
            latestReadingEntry: user.readingHistory?.[0] || null,
        });
    } catch (error) {
        console.error('Error checking reading history:', error);
        return NextResponse.json({ error: 'Failed to check reading history', details: error.message }, { status: 500 });
    }
}

