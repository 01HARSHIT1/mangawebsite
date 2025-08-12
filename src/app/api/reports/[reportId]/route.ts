import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: { reportId: string } }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await verifyToken(token);
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    const { db } = await connectToDatabase();
    const report = await db.collection('reports').findOne({ _id: params.reportId });
    if (!report) return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    return NextResponse.json({ report });
  } catch (error) {
    console.error('Error fetching report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { reportId: string } }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await verifyToken(token);
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

    const body = await request.json();
    const { action, contentAction } = body as { action: 'approve' | 'reject' | 'dismiss'; contentAction?: 'remove' };
    if (!action || !['approve', 'reject', 'dismiss'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const report = await db.collection('reports').findOne({ _id: params.reportId });
    if (!report) return NextResponse.json({ error: 'Report not found' }, { status: 404 });

    const status = action === 'approve' ? 'resolved' : action === 'reject' ? 'reviewed' : 'dismissed';
    await db.collection('reports').updateOne(
      { _id: params.reportId },
      { $set: { status, updatedAt: new Date(), moderatorId: user._id } }
    );

    if (action === 'approve' && contentAction === 'remove') {
      const collection = report.contentType === 'manga' ? 'manga'
        : report.contentType === 'chapter' ? 'chapters'
        : report.contentType === 'comment' ? 'comments'
        : report.contentType === 'user' ? 'users' : null;
      if (collection) {
        const update = collection === 'users'
          ? { $set: { status: 'suspended', suspendedAt: new Date(), suspendedBy: user._id } }
          : { $set: { status: 'removed', removedAt: new Date(), removedBy: user._id } };
        await db.collection(collection).updateOne({ _id: report.contentId }, update);
      }
    }

    return NextResponse.json({ success: true, message: `Report ${action}ed successfully` });
  } catch (error) {
    console.error('Error updating report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 