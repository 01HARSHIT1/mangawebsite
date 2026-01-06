import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/anime/review
 * Get episode review queue for content moderation
 */
export async function GET(request: NextRequest) {
    try {
        const admin = await requireAdmin(request);
        const { searchParams } = new URL(request.url);
        
        const status = searchParams.get('status') || 'pending_review'; // pending_review, approved, rejected
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '20', 10);
        const skip = (page - 1) * limit;

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Build query
        const query: any = {};
        
        // Filter by moderation status
        if (status === 'pending_review') {
            query.$or = [
                { moderationStatus: 'pending_review' },
                { moderationStatus: { $exists: false } },
                { moderationStatus: null }
            ];
        } else {
            query.moderationStatus = status;
        }

        // Get episodes needing review
        const episodes = await db.collection('anime_episodes')
            .find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();

        // Get series info for each episode
        const enrichedEpisodes = await Promise.all(
            episodes.map(async (episode: any) => {
                const series = await db.collection('anime_series').findOne({
                    _id: episode.seriesId instanceof ObjectId ? episode.seriesId : new ObjectId(episode.seriesId)
                });

                return {
                    _id: episode._id.toString(),
                    episodeNumber: episode.episodeNumber,
                    seasonNumber: episode.seasonNumber || 1,
                    title: episode.title,
                    description: episode.description,
                    videoUrl: episode.videoUrl,
                    thumbnail: episode.thumbnail,
                    duration: episode.duration,
                    // Audio/Subtitle info
                    audioTracks: episode.audioTracks || [],
                    subtitles: episode.subtitles || [],
                    // Validation info
                    validation: episode.validation || null,
                    videoAnalysis: episode.videoAnalysis || null,
                    // Moderation info
                    moderationStatus: episode.moderationStatus || 'pending_review',
                    moderationFlags: episode.moderationFlags || [],
                    reviewedBy: episode.reviewedBy || null,
                    reviewedAt: episode.reviewedAt || null,
                    reviewReason: episode.reviewReason || null,
                    // Series info
                    series: series ? {
                        _id: series._id.toString(),
                        title: series.title,
                        coverImage: series.coverImage,
                        ageRating: series.ageRating,
                        status: series.status,
                    } : null,
                    // Metadata
                    createdAt: episode.createdAt,
                    updatedAt: episode.updatedAt,
                };
            })
        );

        // Get total count
        const total = await db.collection('anime_episodes').countDocuments(query);

        return NextResponse.json({
            episodes: enrichedEpisodes,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
            status,
        });
    } catch (error: any) {
        console.error('Error fetching review queue:', error);
        return NextResponse.json(
            { error: 'Failed to fetch review queue', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/anime/review
 * Update episode moderation status (approve/reject/request changes)
 */
export async function POST(request: NextRequest) {
    try {
        const admin = await requireAdmin(request);
        const body = await request.json();

        const { episodeId, action, reason, scheduledPublishTime } = body;

        if (!episodeId || !action) {
            return NextResponse.json(
                { error: 'episodeId and action are required' },
                { status: 400 }
            );
        }

        const validActions = ['approve', 'reject', 'request_changes'];
        if (!validActions.includes(action)) {
            return NextResponse.json(
                { error: `Invalid action. Must be one of: ${validActions.join(', ')}` },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Get episode
        const episode = await db.collection('anime_episodes').findOne({
            _id: new ObjectId(episodeId)
        });

        if (!episode) {
            return NextResponse.json(
                { error: 'Episode not found' },
                { status: 404 }
            );
        }

        const now = new Date();
        const updateData: any = {
            moderationStatus: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'pending_changes',
            reviewedBy: admin._id.toString(),
            reviewedAt: now,
            reviewReason: reason || '',
            updatedAt: now,
        };

        // If scheduling publish time
        if (action === 'approve' && scheduledPublishTime) {
            updateData.scheduledPublishTime = new Date(scheduledPublishTime);
            updateData.isPublished = false; // Will be published at scheduled time
        } else if (action === 'approve' && !scheduledPublishTime) {
            updateData.isPublished = true; // Publish immediately
            updateData.publishedAt = now;
        }

        // Update episode
        await db.collection('anime_episodes').updateOne(
            { _id: new ObjectId(episodeId) },
            { $set: updateData }
        );

        // Log admin action (audit trail)
        await db.collection('admin_audit_logs').insertOne({
            adminId: admin._id.toString(),
            adminEmail: admin.email,
            action: `episode_${action}`,
            targetType: 'episode',
            targetId: episodeId,
            details: {
                episodeNumber: episode.episodeNumber,
                seriesId: episode.seriesId.toString(),
                reason: reason || null,
                scheduledPublishTime: scheduledPublishTime || null,
            },
            timestamp: now,
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown',
        });

        // If approved, notify creator (if applicable)
        if (action === 'approve' && episode.creatorId) {
            await db.collection('notifications').insertOne({
                userId: episode.creatorId,
                type: 'episode_approved',
                title: 'Episode Approved',
                message: `Your episode "${episode.title}" has been approved and ${scheduledPublishTime ? 'scheduled for publication' : 'published'}.`,
                link: `/anime/${episode.seriesId}`,
                read: false,
                createdAt: now,
            });
        }

        return NextResponse.json({
            success: true,
            message: `Episode ${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'marked for changes'}`,
            episodeId,
            status: updateData.moderationStatus,
        });
    } catch (error: any) {
        console.error('Error updating episode review:', error);
        return NextResponse.json(
            { error: 'Failed to update episode review', details: error.message },
            { status: 500 }
        );
    }
}

