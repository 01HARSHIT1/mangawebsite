import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { requireAdmin } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(
    request: NextRequest,
    { params }: { params: { creatorId: string } }
) {
    try {
        await requireAdmin(request);
        const client = await clientPromise;
        const db = client.db();

        const result = await db.collection('users').updateOne(
            { _id: new ObjectId(params.creatorId) },
            { $set: { isVerified: true, updatedAt: new Date() } }
        );

        if (result.modifiedCount === 0) {
            return NextResponse.json(
                { error: 'Creator not found or already verified' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, message: 'Creator verified successfully' });
    } catch (error) {
        console.error('Failed to verify creator:', error);
        return NextResponse.json(
            { error: 'Failed to verify creator' },
            { status: 500 }
        );
    }
}

