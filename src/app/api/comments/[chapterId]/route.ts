import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

// GET - Fetch comments for a chapter
export async function GET(
    request: NextRequest,
    { params }: { params: { chapterId: string } }
) {
    try {
        const client = await clientPromise;
        const db = client.db();

        const comments = await db.collection('comments')
            .find({ chapterId: params.chapterId })
            .sort({ createdAt: -1 })
            .toArray();

        // Serialize
        const serializedComments = comments.map(comment => ({
            ...comment,
            _id: comment._id.toString(),
            createdAt: comment.createdAt.toISOString()
        }));

        return NextResponse.json({ comments: serializedComments });
    } catch (error) {
        console.error('Error fetching comments:', error);
        return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
    }
}

// POST - Add a new comment (login required)
export async function POST(
    request: NextRequest,
    { params }: { params: { chapterId: string } }
) {
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

        // Get comment content from body
        const body = await request.json();
        const { content } = body;

        if (!content || typeof content !== 'string' || content.trim().length === 0) {
            return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
        }

        if (content.length > 1000) {
            return NextResponse.json({ error: 'Comment is too long (max 1000 characters)' }, { status: 400 });
        }

        // Client and db already initialized above in try block
        const client = await clientPromise;
        const db = client.db();

        // Create comment document
        const commentDoc = {
            chapterId: params.chapterId,
            userId: userId,
            username: username,
            content: content.trim(),
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await db.collection('comments').insertOne(commentDoc);

        // Return the created comment
        const createdComment = {
            ...commentDoc,
            _id: result.insertedId.toString(),
            createdAt: commentDoc.createdAt.toISOString()
        };

        return NextResponse.json({ comment: createdComment }, { status: 201 });
    } catch (error) {
        console.error('Error creating comment:', error);
        return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
    }
}

