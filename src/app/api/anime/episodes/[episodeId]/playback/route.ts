import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import crypto from 'crypto';

/**
 * Playback API - Get playback URL with entitlement check
 * This endpoint uses the streaming service logic directly
 * For new implementations, use /api/streaming/playback-request
 */

export const dynamic = 'force-dynamic';

// GET /api/anime/episodes/{episodeId}/playback - Get playback URL
export async function GET(
    request: NextRequest,
    { params }: { params: { episodeId: string } }
) {
    try {
        const { episodeId } = params;
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');
        
        // Get user info if authenticated
        let userId: string | null = null;
        let subscription: any = null;
        let user: any = null;
        
        if (token) {
            const payload = verifyToken(token);
            if (payload) {
                userId = payload.userId;
                const client = await clientPromise;
                const db = client.db('mangawebsite');
                user = await db.collection('users').findOne({ 
                    _id: new ObjectId(payload.userId) 
                });
                subscription = user?.subscription || { planName: 'free', status: 'active' };
            }
        } else {
            subscription = { planName: 'free', status: 'active' };
        }

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Get episode data - handle both ObjectId and string formats
        let episode: any = null;
        try {
            episode = await db.collection('anime_episodes').findOne({ 
            _id: new ObjectId(episodeId) 
        });
        } catch (error) {
            // Try with string format
            episode = await db.collection('anime_episodes').findOne({ 
                _id: episodeId 
            });
        }
        
        if (!episode) {
            return NextResponse.json({ error: 'Episode not found' }, { status: 404 });
        }

        // Get series for geo-restrictions check - handle both ObjectId and string formats
        let series: any = null;
        try {
            const seriesId = episode.seriesId?.toString ? episode.seriesId.toString() : episode.seriesId;
            if (ObjectId.isValid(seriesId)) {
                series = await db.collection('anime_series').findOne({ 
                    _id: new ObjectId(seriesId) 
                });
            } else {
                series = await db.collection('anime_series').findOne({ 
                    _id: seriesId 
                });
            }
        } catch (error) {
            // Fallback
            series = await db.collection('anime_series').findOne({ 
                _id: episode.seriesId 
        });
        }
        
        if (!series) {
            return NextResponse.json({ error: 'Series not found' }, { status: 404 });
        }

        // Check geo-restrictions
        const userRegion = request.headers.get('x-vercel-ip-country') || 
                          request.headers.get('cf-ipcountry') || 
                          'US';
        
        if (series.geoRestrictions?.blocked?.includes(userRegion)) {
            return NextResponse.json(
                { error: 'Content not available in your region' },
                { status: 403 }
            );
        }

        // Check subscription entitlement
        const isFreeEpisode = episode.isPreview || false;
        const requiresPremium = episode.drmEnabled || series.isExclusive || series.drmEnabled;
        
        if (requiresPremium && subscription.planName === 'free') {
            return NextResponse.json({ 
                error: 'Premium subscription required',
                requiresUpgrade: true,
                upgradeUrl: '/anime/subscriptions',
            }, { status: 403 });
        }

        // Generate signed manifest URL (time-limited)
        const expiresIn = 3600; // 1 hour
        const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;
        
        // Get manifest URL from episode or transcode job
        let manifestUrl = episode.hlsManifestUrl;
        
        if (!manifestUrl && episode.assetId) {
            const transcodeJob = await db.collection('transcode_jobs').findOne({
                assetId: episode.assetId,
                status: 'completed',
            });
            
            if (transcodeJob?.outputManifests?.hls) {
                manifestUrl = transcodeJob.outputManifests.hls;
            }
        }

        if (!manifestUrl) {
            manifestUrl = episode.videoUrl; // Fallback to direct URL
        }

        // Generate playback token
        const playbackToken = generatePlaybackToken(episodeId, userId, expiresAt, 'web', userRegion);
        const signedManifestUrl = `${manifestUrl}?token=${playbackToken}&exp=${expiresAt}`;

        // DRM config
        let drmConfig = null;
        if (episode.drmEnabled || series.drmEnabled) {
            drmConfig = {
                enabled: true,
                licenseUrl: episode.drmLicenseUrl || `${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/drm/license`,
                licenseToken: generateDRMToken(episodeId, userId, expiresAt),
            };
        }

        const playbackData = {
            manifestUrl: signedManifestUrl,
            manifestExpiry: expiresAt,
            drm: drmConfig,
            subtitles: episode.subtitles || [],
            audioTracks: episode.audioTracks || [],
            qualityLevels: episode.qualityLevels || [],
            duration: episode.duration,
            playbackToken,
        };

        // Log playback request (analytics)
        await db.collection('anime_playback_events').insertOne({
            userId: userId || null,
            episodeId,
            seriesId: episode.seriesId,
            eventType: 'playback_request',
            timestamp: new Date(),
            device: 'web',
            region: userRegion,
            subscriptionTier: subscription.planName,
        });

        return NextResponse.json(playbackData);
    } catch (error: any) {
        console.error('Error getting playback URL:', error);
        return NextResponse.json(
            { error: 'Failed to get playback URL', details: error.message },
            { status: 500 }
        );
    }
}

function generatePlaybackToken(
    episodeId: string,
    userId: string | null,
    expiresAt: number,
    clientId?: string,
    region?: string
): string {
    const payload = {
        episodeId,
        userId: userId || 'anonymous',
        expiresAt,
        clientId: clientId || 'web',
        region: region || 'US',
        timestamp: Date.now(),
    };
    
    const secret = process.env.PLAYBACK_TOKEN_SECRET || 'playback-secret';
    const token = Buffer.from(JSON.stringify(payload)).toString('base64');
    
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(token);
    const signature = hmac.digest('hex');
    
    return `${token}.${signature}`;
}

function generateDRMToken(episodeId: string, userId: string | null, expiresAt: number): string {
    const payload = {
        episodeId,
        userId: userId || 'anonymous',
        expiresAt,
        timestamp: Date.now(),
    };
    
    const secret = process.env.DRM_TOKEN_SECRET || 'drm-secret';
    const token = Buffer.from(JSON.stringify(payload)).toString('base64');
    
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(token);
    const signature = hmac.digest('hex');
    
    return `${token}.${signature}`;
}

