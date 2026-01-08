import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const user = await requireAuth(request);
        const body = await request.json();

        const {
            seriesId,
            title,
            description,
            videoUrl,
            thumbnail,
            episodeNumber,
            seasonNumber,
            duration,
            hlsManifestUrl,
            dashManifestUrl,
            qualityLevels,
            subtitles,
            audioTracks,
            isPreview,
            scheduledAt, // ISO date string for scheduled release
            releaseDate, // ISO date string for release date
            airDate, // ISO date string for air date
        } = body;

        if (!seriesId || !title || !videoUrl) {
            return NextResponse.json(
                { error: 'seriesId, title, and videoUrl are required' },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db('mangawebsite');
        const seriesObjectId = new ObjectId(seriesId);

        const series = await db.collection('anime_series').findOne({ _id: seriesObjectId });
        if (!series) {
            return NextResponse.json({ error: 'Series not found' }, { status: 404 });
        }

        // Only admins or the series creator/uploader can add episodes
        const isOwner = series.creatorId?.toString() === user._id?.toString() || series.uploaderId === user._id?.toString();
        if (user.role !== 'admin' && !isOwner) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const existingCount = await db.collection('anime_episodes').countDocuments({ seriesId: seriesObjectId });
        const now = new Date();
        const resolvedEpisodeNumber = episodeNumber ? parseInt(episodeNumber, 10) : existingCount + 1;
        const resolvedSeasonNumber = seasonNumber ? parseInt(seasonNumber, 10) : 1;

        // Parse scheduled dates if provided
        const scheduledDate = scheduledAt ? new Date(scheduledAt) : null;
        const releaseDateObj = releaseDate ? new Date(releaseDate) : null;
        const airDateObj = airDate ? new Date(airDate) : null;

        // If scheduledAt is in the future, mark as scheduled
        const isScheduled = scheduledDate && scheduledDate > now;

        const episodeDoc = {
            seriesId: seriesObjectId,
            title,
            description: description || series.description || '',
            episodeNumber: resolvedEpisodeNumber,
            seasonNumber: resolvedSeasonNumber,
            videoUrl: isScheduled ? null : videoUrl, // Hide video URL until scheduled time
            hlsManifestUrl: isScheduled ? null : (hlsManifestUrl || videoUrl),
            dashManifestUrl: isScheduled ? null : dashManifestUrl,
            thumbnail: thumbnail || series.coverImage,
            duration: duration ? Number(duration) : null,
            qualityLevels: qualityLevels || [],
            subtitles: subtitles || [],
            audioTracks: audioTracks || [],
            isPreview: !!isPreview,
            creatorId: user._id?.toString(),
            // Scheduling fields
            scheduledAt: scheduledDate,
            releaseDate: releaseDateObj,
            airDate: airDateObj,
            isScheduled: isScheduled, // Flag to indicate scheduled episode
            status: isScheduled ? 'scheduled' : 'published', // scheduled, published, draft
            // Validation metadata
            validation: body.validation || null,
            videoAnalysis: body.videoAnalysis || null,
            createdAt: now,
            updatedAt: now,
            views: 0,
            likes: 0,
        };

        const insertResult = await db.collection('anime_episodes').insertOne(episodeDoc);

        await db.collection('anime_series').updateOne(
            { _id: seriesObjectId },
            {
                $inc: { episodeCount: 1, totalEpisodes: 1 },
                $set: {
                    updatedAt: now,
                    latestEpisode: Math.max(series.latestEpisode || 0, resolvedEpisodeNumber)
                }
            }
        );

        // Send notifications for new episode (if not scheduled)
        if (!isScheduled) {
            try {
                // Get subscribers for this series
                const subscribers = await db.collection('anime_notification_subscriptions')
                    .find({ seriesId: seriesObjectId.toString(), enabled: true })
                    .toArray();

                // Create notifications for each subscriber
                if (subscribers.length > 0) {
                    const notifications = subscribers.map((sub: any) => ({
                        userId: sub.userId,
                        type: 'new_episode',
                        seriesId: seriesObjectId.toString(),
                        seriesTitle: series.title,
                        episodeId: insertResult.insertedId.toString(),
                        episodeNumber: resolvedEpisodeNumber,
                        episodeTitle: title,
                        message: `New episode available: ${series.title} - Episode ${resolvedEpisodeNumber}`,
                        read: false,
                        createdAt: now,
                    }));

                    await db.collection('anime_notifications').insertMany(notifications);
                }
            } catch (notifError) {
                console.error('Error sending episode notifications:', notifError);
                // Don't fail episode creation if notifications fail
            }
        }

        return NextResponse.json({
            success: true,
            episodeId: insertResult.insertedId.toString(),
            episodeNumber: resolvedEpisodeNumber,
        });
    } catch (error: any) {
        console.error('Error creating anime episode:', error);
        return NextResponse.json(
            { error: 'Failed to create episode', details: error.message },
            { status: 500 }
        );
    }
}

