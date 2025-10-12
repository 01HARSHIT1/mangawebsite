import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
    try {
        const auth = req.headers.get('authorization');
        if (!auth || !auth.startsWith('Bearer ')) {
            return NextResponse.json({ 
                error: 'Missing or invalid token',
                isAuthenticated: false
            }, { status: 401 });
        }

        const token = auth.replace('Bearer ', '');
        let payload: any;
        
        try {
            payload = jwt.verify(token, process.env.JWT_SECRET || 'changeme');
        } catch (error) {
            return NextResponse.json({ 
                error: 'Invalid token',
                isAuthenticated: false
            }, { status: 401 });
        }

        const userId = payload.userId || payload._id || payload.id;

        const client = await clientPromise;
        const db = client.db();
        
        // Get all manga in database
        const allManga = await db.collection('manga').find({}).toArray();
        
        // Get all chapters
        const allChapters = await db.collection('chapters').find({}).toArray();
        
        // Get user info
        const user = await db.collection('users').findOne({ 
            _id: typeof userId === 'string' ? new ObjectId(userId) : userId 
        });

        return NextResponse.json({
            userId,
            userIdType: typeof userId,
            userFound: !!user,
            userRole: user?.role,
            totalMangaInDB: allManga.length,
            totalChaptersInDB: allChapters.length,
            allManga: allManga.map(m => ({
                _id: m._id.toString(),
                title: m.title,
                creatorId: m.creatorId,
                creatorIdType: typeof m.creatorId,
                creator: m.creator,
                views: m.views,
                likes: m.likes
            })),
            allChapters: allChapters.map(c => ({
                _id: c._id.toString(),
                mangaId: c.mangaId,
                chapterNumber: c.chapterNumber,
                title: c.title,
                views: c.views || 0,
                likes: c.likes || 0
            }))
        });

    } catch (error) {
        console.error('❌ Debug manga error:', error);
        return NextResponse.json({ 
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
