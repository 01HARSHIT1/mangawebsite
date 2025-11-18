import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

// POST: Record user feedback (like, dislike, discontinued)
export async function POST(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = jwt.verify(token, JWT_SECRET) as any;
        const userId = payload.userId || payload._id;
        
        if (!userId) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const body = await request.json();
        const { mangaId, feedbackType, reason } = body;

        if (!mangaId || !feedbackType) {
            return NextResponse.json({ error: 'Missing mangaId or feedbackType' }, { status: 400 });
        }

        const validFeedbackTypes = ['like', 'dislike', 'discontinued', 'not-interested'];
        if (!validFeedbackTypes.includes(feedbackType)) {
            return NextResponse.json({ error: 'Invalid feedback type' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('mangawebsite');
        
        // Update user feedback
        const updateField = feedbackType === 'like' ? 'likedManga' : 
                           feedbackType === 'dislike' ? 'dislikedManga' :
                           feedbackType === 'discontinued' ? 'discontinuedManga' :
                           'notInterestedManga';

        // Add to the appropriate list
        await db.collection('users').updateOne(
            { _id: new ObjectId(userId) },
            {
                $addToSet: {
                    [updateField]: {
                        mangaId,
                        reason: reason || null,
                        timestamp: new Date()
                    }
                }
            }
        );

        // If it's a dislike/discontinued, remove from liked if present
        if (feedbackType === 'dislike' || feedbackType === 'discontinued' || feedbackType === 'not-interested') {
            await db.collection('users').updateOne(
                { _id: new ObjectId(userId) },
                {
                    $pull: {
                        likedManga: { mangaId }
                    }
                }
            );
        }

        // If it's a like, remove from disliked/discontinued
        if (feedbackType === 'like') {
            await db.collection('users').updateOne(
                { _id: new ObjectId(userId) },
                {
                    $pull: {
                        dislikedManga: { mangaId },
                        discontinuedManga: { mangaId },
                        notInterestedManga: { mangaId }
                    }
                }
            );
        }

        return NextResponse.json({
            success: true,
            message: `Feedback recorded: ${feedbackType}`
        });
    } catch (error) {
        console.error('Error recording feedback:', error);
        return NextResponse.json(
            { error: 'Failed to record feedback' },
            { status: 500 }
        );
    }
}

// GET: Get user feedback for manga
export async function GET(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = jwt.verify(token, JWT_SECRET) as any;
        const userId = payload.userId || payload._id;
        
        if (!userId) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const client = await clientPromise;
        const db = client.db('mangawebsite');
        
        const user = await db.collection('users').findOne(
            { _id: new ObjectId(userId) },
            {
                projection: {
                    likedManga: 1,
                    dislikedManga: 1,
                    discontinuedManga: 1,
                    notInterestedManga: 1
                }
            }
        );

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            liked: user.likedManga || [],
            disliked: user.dislikedManga || [],
            discontinued: user.discontinuedManga || [],
            notInterested: user.notInterestedManga || []
        });
    } catch (error) {
        console.error('Error fetching feedback:', error);
        return NextResponse.json(
            { error: 'Failed to fetch feedback' },
            { status: 500 }
        );
    }
}

