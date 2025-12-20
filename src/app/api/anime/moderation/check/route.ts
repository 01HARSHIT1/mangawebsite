import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireAdmin } from '@/lib/auth';
import { contentModerationAI } from '@/lib/ai-content-moderation';
import clientPromise from '@/lib/mongodb';

// Check content moderation (for creators uploading content)
export async function POST(request: NextRequest) {
    try {
        const user = await requireAuth(request);
        const body = await request.json();

        const { type, title, description, tags, thumbnailUrl, imageUrl } = body;

        if (!title || !description) {
            return NextResponse.json(
                { error: 'Title and description are required' },
                { status: 400 }
            );
        }

        let moderationResult;

        if (type === 'video' || type === 'series') {
            moderationResult = await contentModerationAI.moderateVideo({
                title,
                description,
                tags: tags || [],
                thumbnailUrl: thumbnailUrl || imageUrl
            });
        } else if (type === 'image') {
            moderationResult = await contentModerationAI.moderateImage(
                imageUrl || thumbnailUrl || '',
                {
                    title,
                    description,
                    tags: tags || []
                }
            );
        } else {
            return NextResponse.json(
                { error: 'Invalid type. Must be "video", "series", or "image"' },
                { status: 400 }
            );
        }

        // Store moderation result in database
        const client = await clientPromise;
        const db = client.db('mangawebsite');

        await db.collection('anime_moderation_logs').insertOne({
            userId: user._id.toString(),
            type,
            title,
            description,
            tags: tags || [],
            thumbnailUrl: thumbnailUrl || imageUrl,
            moderationResult,
            status: moderationResult.requiresReview ? 'pending_review' : 'approved',
            createdAt: new Date()
        });

        return NextResponse.json({
            moderation: moderationResult,
            message: moderationResult.requiresReview
                ? 'Content requires manual review before publishing'
                : 'Content approved automatically'
        });
    } catch (error: any) {
        console.error('Moderation check error:', error);
        return NextResponse.json(
            { error: 'Failed to check content moderation', details: error.message },
            { status: 500 }
        );
    }
}

// Get moderation status (admin/creator)
export async function GET(request: NextRequest) {
    try {
        const user = await requireAuth(request);
        const { searchParams } = new URL(request.url);
        const seriesId = searchParams.get('seriesId');
        const status = searchParams.get('status'); // pending_review, approved, rejected

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        const query: any = {};
        
        if (seriesId) {
            query.seriesId = seriesId;
        }
        
        if (status) {
            query.status = status;
        }

        // Creators can only see their own moderation logs
        if (user.role === 'creator') {
            query.userId = user._id.toString();
        }

        const logs = await db.collection('anime_moderation_logs')
            .find(query)
            .sort({ createdAt: -1 })
            .limit(50)
            .toArray();

        return NextResponse.json({
            logs,
            total: logs.length
        });
    } catch (error: any) {
        console.error('Error fetching moderation logs:', error);
        return NextResponse.json(
            { error: 'Failed to fetch moderation logs', details: error.message },
            { status: 500 }
        );
    }
}

// Admin: Update moderation status
export async function PATCH(request: NextRequest) {
    try {
        const admin = await requireAdmin(request);
        const body = await request.json();

        const { logId, status, reason } = body;

        if (!logId || !status) {
            return NextResponse.json(
                { error: 'Log ID and status are required' },
                { status: 400 }
            );
        }

        if (!['approved', 'rejected', 'pending_review'].includes(status)) {
            return NextResponse.json(
                { error: 'Invalid status' },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        await db.collection('anime_moderation_logs').updateOne(
            { _id: logId },
            {
                $set: {
                    status,
                    reviewedBy: admin._id.toString(),
                    reviewedAt: new Date(),
                    reviewReason: reason || ''
                }
            }
        );

        return NextResponse.json({
            success: true,
            message: 'Moderation status updated'
        });
    } catch (error: any) {
        console.error('Error updating moderation status:', error);
        return NextResponse.json(
            { error: 'Failed to update moderation status', details: error.message },
            { status: 500 }
        );
    }
}

