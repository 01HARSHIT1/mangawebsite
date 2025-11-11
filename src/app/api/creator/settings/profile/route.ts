import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { requireCreator } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_BIO_LENGTH = 500;
const MAX_DISPLAY_NAME = 80;

function sanitizeProfile(body: any) {
    if (!body || typeof body !== 'object') {
        throw new Error('Invalid payload');
    }

    const errors: Record<string, string> = {};

    if (body.displayName !== undefined) {
        if (typeof body.displayName !== 'string' || !body.displayName.trim()) {
            errors.displayName = 'Display name is required';
        } else if (body.displayName.length > MAX_DISPLAY_NAME) {
            errors.displayName = `Display name must be less than ${MAX_DISPLAY_NAME} characters`;
        }
    }

    if (body.bio !== undefined) {
        if (typeof body.bio !== 'string') {
            errors.bio = 'Bio must be a string';
        } else if (body.bio.length > MAX_BIO_LENGTH) {
            errors.bio = `Bio must be less than ${MAX_BIO_LENGTH} characters`;
        }
    }

    if (body.socialLinks && typeof body.socialLinks !== 'object') {
        errors.socialLinks = 'Social links must be an object';
    }

    if (Object.keys(errors).length > 0) {
        const error = new Error('VALIDATION_FAILED');
        (error as any).details = errors;
        throw error;
    }

    const update: any = {};

    if (body.displayName !== undefined) {
        update['creatorProfile.displayName'] = body.displayName.trim();
    }

    if (body.bio !== undefined) {
        update['creatorProfile.bio'] = body.bio.trim();
    }

    if (body.avatar !== undefined) {
        update['creatorProfile.avatar'] = typeof body.avatar === 'string' ? body.avatar.trim() : null;
    }

    if (body.socialLinks) {
        const socialLinks: Record<string, string> = {};
        for (const [key, value] of Object.entries(body.socialLinks)) {
            if (typeof value === 'string' && value.trim()) {
                socialLinks[key] = value.trim();
            }
        }
        update['creatorProfile.socialLinks'] = socialLinks;
    }

    update['creatorProfile.updatedAt'] = new Date();

    return update;
}

export async function GET(request: NextRequest) {
    try {
        const user = await requireCreator(request);
        const client = await clientPromise;
        const db = client.db();

        const document = await db.collection('users').findOne(
            { _id: new ObjectId(user._id) },
            {
                projection: {
                    creatorProfile: 1,
                    email: 1,
                    username: 1
                }
            }
        );

        if (!document) {
            return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
        }

        const profile = document.creatorProfile || {};

        return NextResponse.json({
            success: true,
            profile: {
                displayName: profile.displayName || document.username || '',
                bio: profile.bio || '',
                avatar: profile.avatar || '',
                socialLinks: profile.socialLinks || {},
                updatedAt: profile.updatedAt || null
            }
        });
    } catch (error) {
        console.error('Creator profile fetch error:', error);
        return NextResponse.json(
            {
                error: 'Failed to load creator profile',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const user = await requireCreator(request);
        const client = await clientPromise;
        const db = client.db();

        const body = await request.json();
        const updates = sanitizeProfile(body);

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ error: 'No changes provided' }, { status: 400 });
        }

        const result = await db.collection('users').findOneAndUpdate(
            { _id: new ObjectId(user._id) },
            { $set: updates },
            { returnDocument: 'after', projection: { creatorProfile: 1 } }
        );

        if (!result.value) {
            return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
        }

        const profile = result.value.creatorProfile || {};

        return NextResponse.json({
            success: true,
            profile: {
                displayName: profile.displayName || '',
                bio: profile.bio || '',
                avatar: profile.avatar || '',
                socialLinks: profile.socialLinks || {},
                updatedAt: profile.updatedAt || null
            }
        });
    } catch (error) {
        if (error instanceof Error && error.message === 'VALIDATION_FAILED') {
            return NextResponse.json(
                { error: 'Validation failed', details: (error as any).details },
                { status: 400 }
            );
        }

        console.error('Creator profile update error:', error);
        return NextResponse.json(
            {
                error: 'Failed to update creator profile',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

