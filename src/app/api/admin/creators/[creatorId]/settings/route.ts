import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { requireAdmin } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function PUT(
    request: NextRequest,
    { params }: { params: { creatorId: string } }
) {
    try {
        await requireAdmin(request);
        const body = await request.json();
        const { revenueShare, uploadLimit, verified } = body;

        const client = await clientPromise;
        const db = client.db();

        const update: any = { updatedAt: new Date() };
        if (revenueShare !== undefined) update.revenueShare = revenueShare;
        if (uploadLimit !== undefined) update.uploadLimit = uploadLimit;
        if (verified !== undefined) update.isVerified = verified;

        const result = await db.collection('users').updateOne(
            { _id: new ObjectId(params.creatorId) },
            { $set: update }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json(
                { error: 'Creator not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, message: 'Creator settings updated' });
    } catch (error) {
        console.error('Failed to update creator settings:', error);
        return NextResponse.json(
            { error: 'Failed to update creator settings' },
            { status: 500 }
        );
    }
}

