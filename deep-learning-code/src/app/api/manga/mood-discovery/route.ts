import { NextRequest, NextResponse } from 'next/server';
import { findMangaByMood, getMoodRecommendations, MoodType, MOOD_PROFILES } from '@/lib/ai-mood-discovery';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

// GET: Get manga recommendations based on mood
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const mood = searchParams.get('mood') as MoodType;
        const limit = parseInt(searchParams.get('limit') || '12');
        
        if (!mood || !MOOD_PROFILES[mood]) {
            return NextResponse.json(
                { error: 'Invalid mood. Valid moods: funny, dark, chill, emotional, fast-paced, romantic, mysterious, action-packed' },
                { status: 400 }
            );
        }
        
        // Get user ID if authenticated
        const auth = request.headers.get('authorization');
        let userId: string | undefined;
        
        if (auth && auth.startsWith('Bearer ')) {
            try {
                const token = auth.replace('Bearer ', '');
                const user = jwt.verify(token, JWT_SECRET) as any;
                userId = user._id || user.userId;
            } catch {
                // Continue without user ID
            }
        }
        
        // Get mood-based recommendations
        let manga;
        if (userId) {
            manga = await getMoodRecommendations(userId, mood, limit);
        } else {
            manga = await findMangaByMood(mood, undefined, limit);
        }
        
        // Format response
        const formattedManga = manga.map((m: any) => ({
            _id: m._id.toString(),
            title: m.title,
            description: m.description,
            coverImage: m.coverImage,
            genres: m.genres || [],
            tags: m.tags || [],
            rating: m.rating || 0,
            views: m.views || 0,
            likes: m.likes || 0,
            status: m.status,
            author: m.author
        }));
        
        return NextResponse.json({
            manga: formattedManga,
            mood: mood,
            moodDescription: MOOD_PROFILES[mood].description,
            count: formattedManga.length
        });
    } catch (error) {
        console.error('Error getting mood-based recommendations:', error);
        return NextResponse.json(
            { error: 'Failed to get mood-based recommendations' },
            { status: 500 }
        );
    }
}

// POST: Get mood recommendations with additional filters
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { mood, limit = 12, excludeMangaIds = [] } = body;
        
        if (!mood || !MOOD_PROFILES[mood]) {
            return NextResponse.json(
                { error: 'Invalid mood. Valid moods: funny, dark, chill, emotional, fast-paced, romantic, mysterious, action-packed' },
                { status: 400 }
            );
        }
        
        // Get user ID if authenticated
        const auth = request.headers.get('authorization');
        let userId: string | undefined;
        
        if (auth && auth.startsWith('Bearer ')) {
            try {
                const token = auth.replace('Bearer ', '');
                const user = jwt.verify(token, JWT_SECRET) as any;
                userId = user._id || user.userId;
            } catch {
                // Continue without user ID
            }
        }
        
        // Get mood-based recommendations
        let manga;
        if (userId) {
            manga = await getMoodRecommendations(userId, mood, limit + excludeMangaIds.length);
        } else {
            manga = await findMangaByMood(mood, undefined, limit + excludeMangaIds.length);
        }
        
        // Filter out excluded manga
        const excludeSet = new Set(excludeMangaIds.map((id: string) => id.toString()));
        const filteredManga = manga.filter((m: any) => !excludeSet.has(m._id.toString()));
        
        // Format response
        const formattedManga = filteredManga.slice(0, limit).map((m: any) => ({
            _id: m._id.toString(),
            title: m.title,
            description: m.description,
            coverImage: m.coverImage,
            genres: m.genres || [],
            tags: m.tags || [],
            rating: m.rating || 0,
            views: m.views || 0,
            likes: m.likes || 0,
            status: m.status,
            author: m.author
        }));
        
        return NextResponse.json({
            manga: formattedManga,
            mood: mood,
            moodDescription: MOOD_PROFILES[mood].description,
            count: formattedManga.length
        });
    } catch (error) {
        console.error('Error getting mood-based recommendations:', error);
        return NextResponse.json(
            { error: 'Failed to get mood-based recommendations' },
            { status: 500 }
        );
    }
}

