import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, upgradeToCreator } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const user = await requireAuth(request);

        // Check if user is already a creator
        if (user.isCreator) {
            return NextResponse.json(
                { error: 'User is already a creator' },
                { status: 400 }
            );
        }

        const { displayName, bio, avatar, socialLinks } = await request.json();

        // Validate input
        if (!displayName) {
            return NextResponse.json(
                { error: 'Display name is required' },
                { status: 400 }
            );
        }

        // Upgrade user to creator
        const upgradedUser = await upgradeToCreator(user._id, {
            displayName,
            bio,
            avatar,
            socialLinks,
        });

        return NextResponse.json({
            message: 'Successfully upgraded to creator',
            user: {
                _id: upgradedUser._id,
                email: upgradedUser.email,
                username: upgradedUser.username,
                role: upgradedUser.role,
                isCreator: upgradedUser.isCreator,
                creatorProfile: upgradedUser.creatorProfile,
                createdAt: upgradedUser.createdAt,
            },
        });

    } catch (error) {
        console.error('Creator upgrade error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Upgrade failed' },
            { status: 500 }
        );
    }
}

