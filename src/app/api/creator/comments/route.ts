import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

async function getUserFromToken(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'default-secret-key';

    try {
        const decoded = jwt.verify(token, secret) as any;
        const userId = decoded.userId || decoded.id;

        const client = await clientPromise;
        const db = client.db();
        const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });

        return user;
    } catch (err) {
        return null;
    }
}

export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromToken(request);
        
        if (!user || !user.isCreator) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const client = await clientPromise;
        const db = client.db();

        // Get all manga by this creator
        const manga = await db.collection('manga')
            .find({ uploaderId: user._id.toString() })
            .toArray();

        const mangaIds = manga.map(m => m._id.toString());

        // Get all comments on creator's manga (both manga-level and chapter-level)
        const mangaComments = await db.collection('manga_comments')
            .find({ mangaId: { $in: mangaIds } })
            .sort({ createdAt: -1 })
            .toArray();

        const chapterComments = await db.collection('comments')
            .find({ 
                chapterId: { 
                    $in: await db.collection('chapters')
                        .find({ mangaId: { $in: mangaIds } })
                        .project({ _id: 1 })
                        .toArray()
                        .then(chapters => chapters.map(c => c._id.toString()))
                }
            })
            .sort({ createdAt: -1 })
            .toArray();

        // Combine and enrich comments with manga/chapter titles
        const allComments = [
            ...mangaComments.map(c => {
                const m = manga.find(m => m._id.toString() === c.mangaId);
                return {
                    ...c,
                    _id: c._id.toString(),
                    mangaTitle: m?.title,
                    createdAt: c.createdAt.toISOString(),
                    status: c.status || 'visible'
                };
            }),
            ...chapterComments.map(c => {
                return {
                    ...c,
                    _id: c._id.toString(),
                    createdAt: c.createdAt.toISOString(),
                    status: c.status || 'visible'
                };
            })
        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return NextResponse.json({ comments: allComments });

    } catch (error) {
        console.error('Error fetching creator comments:', error);
        return NextResponse.json({ 
            error: 'Failed to fetch comments',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

