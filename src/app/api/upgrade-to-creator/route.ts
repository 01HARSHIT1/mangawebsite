import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    try {
        // Require authentication
        const user = await requireAuth(request);

        console.log('🔄 Upgrading user to creator:', user._id);

        // Direct database update to avoid potential issues with upgradeToCreator
        const client = await clientPromise;
        const db = client.db('mangawebsite');
        
        const now = new Date();
        const result = await db.collection('users').updateOne(
            { _id: new ObjectId(user._id) },
            {
                $set: {
                    role: 'creator',
                    isCreator: true,
                    creatorProfile: {
                        displayName: user.username || 'Creator',
                        bio: 'Aspiring manga creator',
                    },
                    updatedAt: now
                }
            }
        );

        if (result.modifiedCount === 0) {
            console.log('⚠️ User might already be a creator or not found');
        }

        console.log('✅ User successfully upgraded to creator');

        return NextResponse.json({
            success: true,
            message: 'Successfully upgraded to creator status',
            userId: user._id,
            role: 'creator'
        });

    } catch (error) {
        console.error('❌ Error upgrading to creator:', error);
        return NextResponse.json({
            error: 'Failed to upgrade to creator',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

