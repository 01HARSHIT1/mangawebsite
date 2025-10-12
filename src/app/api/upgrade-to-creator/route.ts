import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, upgradeToCreator } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    try {
        // Require authentication
        const user = await requireAuth(request);

        console.log('🔄 Upgrading user to creator:', user._id);

        // Upgrade user to creator with default profile
        await upgradeToCreator(user._id, {
            displayName: user.username,
            bio: 'Aspiring manga creator',
        });

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

