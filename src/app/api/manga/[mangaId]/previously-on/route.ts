import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { generatePreviouslyOnRecap, getPreviouslyOnRecap } from '@/lib/ai-previously-on';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

// GET: Get "Previously On..." recap for a manga
export async function GET(
    request: NextRequest,
    { params }: { params: { mangaId: string } }
) {
    try {
        // Verify user
        const auth = request.headers.get('authorization');
        if (!auth || !auth.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        const token = auth.replace('Bearer ', '');
        let user: any;
        
        try {
            user = jwt.verify(token, JWT_SECRET);
        } catch {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }
        
        const userId = user._id || user.userId;
        const mangaId = params.mangaId;
        
        if (!mangaId || !ObjectId.isValid(mangaId)) {
            return NextResponse.json({ error: 'Invalid manga ID' }, { status: 400 });
        }
        
        // Get user's reading history for this manga
        const client = await clientPromise;
        const db = client.db('mangawebsite');
        
        const userDoc = await db.collection('users').findOne({
            _id: new ObjectId(userId)
        });
        
        if (!userDoc) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        
        const readingHistory = userDoc.readingHistory || [];
        const mangaHistory = readingHistory.filter((h: any) => h.mangaId === mangaId);
        
        if (mangaHistory.length === 0) {
            return NextResponse.json({ 
                recap: null, 
                message: 'No reading history found for this manga' 
            });
        }
        
        // Get last read chapter number
        const lastReadChapter = Math.max(...mangaHistory.map((h: any) => h.chapterNumber || 0));
        
        // Check if recap exists
        let recap = await getPreviouslyOnRecap(userId, mangaId);
        
        // If recap doesn't exist or is outdated, generate new one
        if (!recap || recap.lastReadChapter !== lastReadChapter) {
            recap = await generatePreviouslyOnRecap(userId, mangaId, lastReadChapter);
        }
        
        return NextResponse.json({ recap });
    } catch (error) {
        console.error('Error getting Previously On recap:', error);
        return NextResponse.json(
            { error: 'Failed to get Previously On recap' },
            { status: 500 }
        );
    }
}

// POST: Force regenerate Previously On recap
export async function POST(
    request: NextRequest,
    { params }: { params: { mangaId: string } }
) {
    try {
        // Verify user
        const auth = request.headers.get('authorization');
        if (!auth || !auth.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        const token = auth.replace('Bearer ', '');
        let user: any;
        
        try {
            user = jwt.verify(token, JWT_SECRET);
        } catch {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }
        
        const userId = user._id || user.userId;
        const mangaId = params.mangaId;
        
        if (!mangaId || !ObjectId.isValid(mangaId)) {
            return NextResponse.json({ error: 'Invalid manga ID' }, { status: 400 });
        }
        
        // Get user's reading history
        const client = await clientPromise;
        const db = client.db('mangawebsite');
        
        const userDoc = await db.collection('users').findOne({
            _id: new ObjectId(userId)
        });
        
        if (!userDoc) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        
        const readingHistory = userDoc.readingHistory || [];
        const mangaHistory = readingHistory.filter((h: any) => h.mangaId === mangaId);
        
        if (mangaHistory.length === 0) {
            return NextResponse.json({ 
                error: 'No reading history found for this manga' 
            }, { status: 400 });
        }
        
        const lastReadChapter = Math.max(...mangaHistory.map((h: any) => h.chapterNumber || 0));
        
        // Generate new recap
        const recap = await generatePreviouslyOnRecap(userId, mangaId, lastReadChapter);
        
        return NextResponse.json({ recap, message: 'Recap regenerated successfully' });
    } catch (error) {
        console.error('Error generating Previously On recap:', error);
        return NextResponse.json(
            { error: 'Failed to generate Previously On recap' },
            { status: 500 }
        );
    }
}

