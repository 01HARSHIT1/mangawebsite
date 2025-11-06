import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

// GET - Fetch comments for a manga
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const mangaId = searchParams.get('mangaId');

        if (!mangaId) {
            return NextResponse.json({ error: 'mangaId is required' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db();

        const comments = await db.collection('manga_comments')
            .find({ mangaId })
            .sort({ createdAt: -1 })
            .toArray();

        // Serialize and populate user data
        const serializedComments = comments.map(comment => ({
            ...comment,
            _id: comment._id.toString(),
            createdAt: comment.createdAt.toISOString(),
            user: {
                username: comment.username || 'Anonymous'
            }
        }));

        return NextResponse.json(serializedComments);
    } catch (error) {
        console.error('Error fetching manga comments:', error);
        return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
    }
}

// POST - Add a new comment to a manga (login required)
export async function POST(request: NextRequest) {
    try {
        // Check authentication
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        const secret = process.env.JWT_SECRET || 'default-secret-key';
        
        let userId: string;
        let username: string;
        
        try {
            const decoded = jwt.verify(token, secret) as any;
            userId = decoded.userId || decoded.id;
            
            // Fetch username from database to ensure accuracy
            const client = await clientPromise;
            const db = client.db();
            const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
            
            if (!user) {
                return NextResponse.json({ error: 'User not found' }, { status: 404 });
            }
            
            username = user.username || 'Anonymous';
        } catch (err) {
            console.error('Error verifying token or fetching user:', err);
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        // Get request body
        const body = await request.json();
        const { mangaId, text } = body;

        if (!mangaId) {
            return NextResponse.json({ error: 'mangaId is required' }, { status: 400 });
        }

        if (!text || typeof text !== 'string' || text.trim().length === 0) {
            return NextResponse.json({ error: 'Comment text is required' }, { status: 400 });
        }

        if (text.length > 1000) {
            return NextResponse.json({ error: 'Comment is too long (max 1000 characters)' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db();

        // Verify manga exists
        const manga = await db.collection('manga').findOne({ _id: new ObjectId(mangaId) });
        if (!manga) {
            return NextResponse.json({ error: 'Manga not found' }, { status: 404 });
        }

        // Create comment document
        const commentDoc = {
            mangaId: mangaId,
            userId: userId,
            username: username,
            text: text.trim(),
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await db.collection('manga_comments').insertOne(commentDoc);

        // Return the created comment with user data
        const createdComment = {
            ...commentDoc,
            _id: result.insertedId.toString(),
            createdAt: commentDoc.createdAt.toISOString(),
            user: {
                username: username
            }
        };

        return NextResponse.json({ comment: createdComment }, { status: 201 });
    } catch (error) {
        console.error('Error creating manga comment:', error);
        return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
    }
}

