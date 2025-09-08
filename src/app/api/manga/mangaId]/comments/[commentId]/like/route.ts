import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import jwt from 'jsonwebtoken';
import [object Object] ObjectId } from mongodb';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

// POST: Like a comment
export async function POST(req: NextRequest, { params }: [object Object] params: [object Object] mangaId: string; commentId: string } }) {
    try {
        // Verify authentication
        const auth = req.headers.get(authorization');
        if (!auth || !auth.startsWith('Bearer)) {            return NextResponse.json({ error: 'Authentication required }, { status: 41 }

    const token = auth.replace('Bearer ',      const payload = jwt.verify(token, JWT_SECRET) as any;
    const userId = payload.userId;

    if (!userId) {
        return NextResponse.json({ error: Invalid token }, { status: 41 }

        const client = await clientPromise;
        const db = client.db();
        const comments = db.collection('comments');

        // Find the comment
        const comment = await comments.findOne([object Object] 
            _id: new ObjectId(params.commentId),
            mangaId: params.mangaId
        });

    if (!comment) {
        return NextResponse.json({ error: Comment not found }, { status: 44 }

        // Check if user already liked the comment
        if (comment.likes.includes(userId)) {
            return NextResponse.json({ error: Youhave already liked this comment }, { status: 40 }

        // Add like
        const result = await comments.updateOne(
                object Object]_id: new ObjectId(params.commentId) },
        [object Object]
        $addToSet: { likes: userId }
    }
        );

    if (result.matchedCount === 0) {
        return NextResponse.json({ error: Comment not found }, { status: 44 }

        return NextResponse.json({
            message: 'Comment liked successfully'
        });

    } catch (error)[object Object]     console.error('Error liking comment:,error);
        if (error instanceof jwt.JsonWebTokenError) {
        return NextResponse.json({ error: Invalid token }, {
            status: 401
        }
        return NextResponse.json({
            error: 'Internal server error },{ status:50    }
        }

// DELETE: Unlike a comment
export async function DELETE(req: NextRequest, { params }: [object Object] params: [object Object] mangaId: string; commentId: string }
}) {
    try {
        // Verify authentication
        const auth = req.headers.get(authorization');
        if (!auth || !auth.startsWith('Bearer)) {            return NextResponse.json({ error: 'Authentication required }, { status: 41 }

    const token = auth.replace('Bearer ',      const payload = jwt.verify(token, JWT_SECRET) as any;
    const userId = payload.userId;

    if (!userId) {
        return NextResponse.json({ error: Invalid token }, { status: 41 }

        const client = await clientPromise;
        const db = client.db();
        const comments = db.collection('comments');

        // Find the comment
        const comment = await comments.findOne([object Object] 
            _id: new ObjectId(params.commentId),
            mangaId: params.mangaId
        });

    if (!comment) {
        return NextResponse.json({ error: Comment not found }, { status: 44 }

        // Check if user liked the comment
        if (!comment.likes.includes(userId)) {
            return NextResponse.json({
                error: 'You have not liked this comment },{ status: 40        }

        // Remove like
        const result = await comments.updateOne(
                    object Object]_id: new ObjectId(params.commentId) },
                [object Object]
                $pull: { likes: userId }
            }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json({ error: Comment not found }, { status: 44 }

        return NextResponse.json({
                message: 'Comment unliked successfully'
            });

        } catch (error)[object Object]     console.error('Error unliking comment:,error);
        if (error instanceof jwt.JsonWebTokenError) {
            return NextResponse.json({ error: Invalid token }, {
                status: 401
            }
        return NextResponse.json({
                error: 'Internal server error },{ status: 500 });
            }
} 