import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/anime/audio-subtitle
 * Get episodes with audio/subtitle tracks for validation panel
 */
export async function GET(request: NextRequest) {
    try {
        const admin = await requireAdmin(request);
        const { searchParams } = new URL(request.url);
        
        const seriesId = searchParams.get('seriesId');
        const episodeId = searchParams.get('episodeId');
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '20', 10);
        const skip = (page - 1) * limit;

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Build query
        const query: any = {};
        if (seriesId) {
            query.seriesId = new ObjectId(seriesId);
        }
        if (episodeId) {
            query._id = new ObjectId(episodeId);
        }

        // Get episodes with audio/subtitle tracks
        const episodes = await db.collection('anime_episodes')
            .find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();

        // Enrich with series info and validation data
        const enrichedEpisodes = await Promise.all(
            episodes.map(async (episode: any) => {
                const series = await db.collection('anime_series').findOne({
                    _id: episode.seriesId instanceof ObjectId ? episode.seriesId : new ObjectId(episode.seriesId)
                });

                // Get validation and analysis data
                const validation = episode.validation || null;
                const videoAnalysis = episode.videoAnalysis || null;

                // Process audio tracks with admin overrides
                const audioTracks = (episode.audioTracks || []).map((track: any) => ({
                    ...track,
                    isDisabled: track.isDisabled || false,
                    disabledReason: track.disabledReason || null,
                    disabledBy: track.disabledBy || null,
                    disabledAt: track.disabledAt || null,
                    isDefault: track.isDefault || false,
                    adminNotes: track.adminNotes || null,
                }));

                // Process subtitles with admin overrides
                const subtitles = (episode.subtitles || []).map((sub: any) => ({
                    ...sub,
                    isDisabled: sub.isDisabled || false,
                    disabledReason: sub.disabledReason || null,
                    disabledBy: sub.disabledBy || null,
                    disabledAt: sub.disabledAt || null,
                    isDefault: sub.isDefault || false,
                    hasTimingIssues: sub.hasTimingIssues || false,
                    timingIssues: sub.timingIssues || null,
                    isMisleading: sub.isMisleading || false,
                    misleadingReason: sub.misleadingReason || null,
                    adminNotes: sub.adminNotes || null,
                }));

                return {
                    _id: episode._id.toString(),
                    episodeNumber: episode.episodeNumber,
                    seasonNumber: episode.seasonNumber || 1,
                    title: episode.title,
                    videoUrl: episode.videoUrl,
                    thumbnail: episode.thumbnail,
                    duration: episode.duration,
                    // Audio tracks
                    audioTracks,
                    // Subtitles
                    subtitles,
                    // Validation data
                    validation: {
                        isValid: validation?.isValid ?? null,
                        warnings: validation?.warnings || [],
                        errors: validation?.errors || [],
                        detectedAudioCount: validation?.detectedAudioCount || videoAnalysis?.audioStreams?.length || 0,
                        declaredAudioCount: validation?.declaredAudioCount || audioTracks.length,
                        detectedSubtitleCount: validation?.detectedSubtitleCount || videoAnalysis?.subtitleStreams?.length || 0,
                        declaredSubtitleCount: validation?.declaredSubtitleCount || subtitles.length,
                    },
                    // Video analysis (FFmpeg detected)
                    videoAnalysis: videoAnalysis ? {
                        audioStreams: videoAnalysis.audioStreams || [],
                        subtitleStreams: videoAnalysis.subtitleStreams || [],
                        videoStreams: videoAnalysis.videoStreams || [],
                        duration: videoAnalysis.duration,
                        format: videoAnalysis.format,
                    } : null,
                    // Series info
                    series: series ? {
                        _id: series._id.toString(),
                        title: series.title,
                        coverImage: series.coverImage,
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
        });
    } catch (error: any) {
        console.error('Error fetching audio/subtitle validation data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch validation data', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/anime/audio-subtitle
 * Update audio/subtitle track settings (disable, set default, flag issues)
 */
export async function POST(request: NextRequest) {
    try {
        const admin = await requireAdmin(request);
        const body = await request.json();

        const { 
            episodeId, 
            action, 
            trackType, // 'audio' | 'subtitle'
            trackIndex, // Index in the array
            updates 
        } = body;

        if (!episodeId || !action || !trackType) {
            return NextResponse.json(
                { error: 'episodeId, action, and trackType are required' },
                { status: 400 }
            );
        }

        const validActions = ['disable', 'enable', 'set_default', 'flag_timing', 'flag_misleading', 'update_notes'];
        if (!validActions.includes(action)) {
            return NextResponse.json(
                { error: `Invalid action. Must be one of: ${validActions.join(', ')}` },
                { status: 400 }
            );
        }

        if (trackType !== 'audio' && trackType !== 'subtitle') {
            return NextResponse.json(
                { error: 'trackType must be "audio" or "subtitle"' },
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
        const tracksField = trackType === 'audio' ? 'audioTracks' : 'subtitles';
        const tracks = episode[tracksField] || [];

        if (trackIndex === undefined || trackIndex < 0 || trackIndex >= tracks.length) {
            return NextResponse.json(
                { error: 'Invalid trackIndex' },
                { status: 400 }
            );
        }

        // Update the specific track
        const updatedTracks = [...tracks];
        const track = { ...updatedTracks[trackIndex] };

        switch (action) {
            case 'disable':
                track.isDisabled = true;
                track.disabledReason = updates?.reason || 'Disabled by admin';
                track.disabledBy = admin._id.toString();
                track.disabledAt = now;
                break;

            case 'enable':
                track.isDisabled = false;
                track.disabledReason = null;
                track.disabledBy = null;
                track.disabledAt = null;
                break;

            case 'set_default':
                // Remove default from all tracks of this type
                updatedTracks.forEach((t: any) => {
                    t.isDefault = false;
                });
                // Set this track as default
                track.isDefault = true;
                break;

            case 'flag_timing':
                if (trackType === 'subtitle') {
                    track.hasTimingIssues = true;
                    track.timingIssues = updates?.issues || 'Timing issues flagged by admin';
                } else {
                    return NextResponse.json(
                        { error: 'Timing issues can only be flagged for subtitles' },
                        { status: 400 }
                    );
                }
                break;

            case 'flag_misleading':
                if (trackType === 'subtitle') {
                    track.isMisleading = true;
                    track.misleadingReason = updates?.reason || 'Misleading translation flagged by admin';
                } else {
                    return NextResponse.json(
                        { error: 'Misleading flag can only be set for subtitles' },
                        { status: 400 }
                    );
                }
                break;

            case 'update_notes':
                track.adminNotes = updates?.notes || null;
                break;
        }

        updatedTracks[trackIndex] = track;

        // Update episode
        const updateData: any = {
            [tracksField]: updatedTracks,
            updatedAt: now,
        };

        await db.collection('anime_episodes').updateOne(
            { _id: new ObjectId(episodeId) },
            { $set: updateData }
        );

        // Log admin action (audit trail)
        await db.collection('admin_audit_logs').insertOne({
            adminId: admin._id.toString(),
            adminEmail: admin.email,
            action: `track_${action}`,
            targetType: 'episode_track',
            targetId: episodeId,
            details: {
                trackType,
                trackIndex,
                trackLanguage: track.language,
                trackLanguageCode: track.languageCode,
                updates: updates || {},
            },
            timestamp: now,
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown',
        });

        return NextResponse.json({
            success: true,
            message: `Track ${action} successful`,
            episodeId,
            track: track,
        });
    } catch (error: any) {
        console.error('Error updating track:', error);
        return NextResponse.json(
            { error: 'Failed to update track', details: error.message },
            { status: 500 }
        );
    }
}

