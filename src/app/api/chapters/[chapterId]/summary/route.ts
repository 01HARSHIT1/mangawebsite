import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { generateChapterSummary, getChapterSummary } from '@/lib/ai-chapter-summaries';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

// GET: Get chapter summary
export async function GET(
    request: NextRequest,
    { params }: { params: { chapterId: string } }
) {
    try {
        const chapterId = params.chapterId;
        
        if (!chapterId || !ObjectId.isValid(chapterId)) {
            return NextResponse.json({ error: 'Invalid chapter ID' }, { status: 400 });
        }
        
        // Check if summary exists
        let summary = await getChapterSummary(chapterId);
        
        // If summary doesn't exist, generate it
        if (!summary) {
            const client = await clientPromise;
            const db = client.db('mangawebsite');
            
            // Get chapter data
            const chapter = await db.collection('chapters').findOne({
                _id: new ObjectId(chapterId)
            });
            
            if (!chapter) {
                return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
            }
            
            // Get manga data
            const manga = await db.collection('manga').findOne({
                _id: new ObjectId(chapter.mangaId)
            });
            
            if (!manga) {
                return NextResponse.json({ error: 'Manga not found' }, { status: 404 });
            }
            
            // Generate summary
            summary = await generateChapterSummary(chapterId, {
                title: chapter.title || `Chapter ${chapter.chapterNumber}`,
                subtitle: chapter.subtitle,
                description: chapter.description,
                chapterNumber: chapter.chapterNumber,
                mangaId: chapter.mangaId,
                mangaTitle: manga.title,
                mangaGenres: manga.genres || []
            });
        }
        
        return NextResponse.json({ summary });
    } catch (error) {
        console.error('Error getting chapter summary:', error);
        return NextResponse.json(
            { error: 'Failed to get chapter summary' },
            { status: 500 }
        );
    }
}

// POST: Force regenerate chapter summary
export async function POST(
    request: NextRequest,
    { params }: { params: { chapterId: string } }
) {
    try {
        // Verify admin or creator
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
        
        if (user.role !== 'admin' && user.role !== 'creator') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        
        const chapterId = params.chapterId;
        
        if (!chapterId || !ObjectId.isValid(chapterId)) {
            return NextResponse.json({ error: 'Invalid chapter ID' }, { status: 400 });
        }
        
        const client = await clientPromise;
        const db = client.db('mangawebsite');
        
        // Get chapter data
        const chapter = await db.collection('chapters').findOne({
            _id: new ObjectId(chapterId)
        });
        
        if (!chapter) {
            return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
        }
        
        // Get manga data
        const manga = await db.collection('manga').findOne({
            _id: new ObjectId(chapter.mangaId)
        });
        
        if (!manga) {
            return NextResponse.json({ error: 'Manga not found' }, { status: 404 });
        }
        
        // Generate new summary
        const summary = await generateChapterSummary(chapterId, {
            title: chapter.title || `Chapter ${chapter.chapterNumber}`,
            subtitle: chapter.subtitle,
            description: chapter.description,
            chapterNumber: chapter.chapterNumber,
            mangaId: chapter.mangaId,
            mangaTitle: manga.title,
            mangaGenres: manga.genres || []
        });
        
        return NextResponse.json({ summary, message: 'Summary regenerated successfully' });
    } catch (error) {
        console.error('Error generating chapter summary:', error);
        return NextResponse.json(
            { error: 'Failed to generate chapter summary' },
            { status: 500 }
        );
    }
}

