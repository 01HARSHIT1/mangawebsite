import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';


export async function POST(request: NextRequest) {
    try {
        // Get auth token
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify token and get user
        const user = await verifyToken(token);
        if (!user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        // Connect to database
        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Update user to creator role
        const result = await db.collection('users').updateOne(
            { _id: user.id },
            {
                $set: {
                    role: 'creator',
                    isCreator: true,
                    creatorSince: new Date(),
                    updatedAt: new Date()
                }
            }
        );

        if (result.modifiedCount === 0) {
            return NextResponse.json({ error: 'Failed to upgrade to creator' }, { status: 500 });
        }

        // Get updated user data
        const updatedUser = await db.collection('users').findOne({ _id: user.id });

        return NextResponse.json({
            success: true,
            message: 'Successfully upgraded to creator!',
            user: {
                id: updatedUser?._id,
                email: updatedUser?.email,
                nickname: updatedUser?.nickname,
                role: updatedUser?.role,
                isCreator: true,
                creatorSince: updatedUser?.creatorSince
            }
        });
    } catch (error) {
        console.error('Creator upgrade error:', error);
        return NextResponse.json(
            { error: 'Failed to upgrade to creator' },
            { status: 500 }
        );
    }
}
