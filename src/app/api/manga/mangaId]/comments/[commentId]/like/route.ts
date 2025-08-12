import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

export async function POST(req: NextRequest, { params }: { params: { mangaId: string; commentId: string } }) {
  try {
    const auth = req.headers.get('authorization');
    if (!auth || !auth.startsWith('Bearer ')) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    const token = auth.replace('Bearer ', '');
    const payload: any = jwt.verify(token, JWT_SECRET);
    const userId: string | undefined = payload.userId || payload._id || payload.id;
    if (!userId) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const client = await clientPromise;
    const db = client.db();
    const comments = db.collection('comments');

    const comment = await comments.findOne({ _id: new ObjectId(params.commentId), mangaId: params.mangaId });
    if (!comment) return NextResponse.json({ error: 'Comment not found' }, { status: 404 });

    if (Array.isArray(comment.likes) && comment.likes.includes(userId)) {
      return NextResponse.json({ error: 'Already liked' }, { status: 409 });
    }

    await comments.updateOne({ _id: new ObjectId(params.commentId) }, { $addToSet: { likes: userId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error liking comment:', error);
    if (error instanceof jwt.JsonWebTokenError) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { mangaId: string; commentId: string } }) {
  try {
    const auth = req.headers.get('authorization');
    if (!auth || !auth.startsWith('Bearer ')) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    const token = auth.replace('Bearer ', '');
    const payload: any = jwt.verify(token, JWT_SECRET);
    const userId: string | undefined = payload.userId || payload._id || payload.id;
    if (!userId) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const client = await clientPromise;
    const db = client.db();
    const comments = db.collection('comments');

    const comment = await comments.findOne({ _id: new ObjectId(params.commentId), mangaId: params.mangaId });
    if (!comment) return NextResponse.json({ error: 'Comment not found' }, { status: 404 });

    if (!Array.isArray(comment.likes) || !comment.likes.includes(userId)) {
      return NextResponse.json({ error: 'Not liked' }, { status: 409 });
    }

    await comments.updateOne({ _id: new ObjectId(params.commentId) }, { $pull: { likes: userId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unliking comment:', error);
    if (error instanceof jwt.JsonWebTokenError) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 