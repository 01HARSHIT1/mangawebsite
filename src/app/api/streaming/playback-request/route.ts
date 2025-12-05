import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import crypto from 'crypto';

/**
 * Streaming Service - Playback Request
 * Handles entitlement checks, geo-restrictions, age checks, and generates signed manifests
 */

export const dynamic = 'force-dynamic';

interface PlaybackRequest {
    episodeId: string;
    clientId?: string;
    deviceInfo?: {
        type: 'web' | 'mobile' | 'tv' | 'tablet';
        os?: string;
        browser?: string;
        ip?: string;
    };
    preferSSAI?: boolean; // Server-side ad insertion
}

// POST /api/streaming/playback-request - Request playback URL with entitlement check
export async function POST(request: NextRequest) {
    try {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');
        const body: PlaybackRequest = await request.json();
        const { episodeId, clientId, deviceInfo, preferSSAI = false } = body;

        if (!episodeId) {
            return NextResponse.json(
                { error: 'episodeId is required' },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Get user info if authenticated
        let userId: string | null = null;
        let subscription: any = null;
        let user: any = null;

        if (token) {
            const payload = verifyToken(token);
            if (payload) {
                userId = payload.userId;
                user = await db.collection('users').findOne({ 
                    _id: new ObjectId(payload.userId) 
                });
                subscription = user?.subscription || { planName: 'free', status: 'active' };
            }
        } else {
            // Anonymous user - free tier
            subscription = { planName: 'free', status: 'active' };
        }

        // Get episode data
        const episode = await db.collection('anime_episodes').findOne({ 
            _id: new ObjectId(episodeId) 
        });

        if (!episode) {
            return NextResponse.json(
                { error: 'Episode not found' },
                { status: 404 }
            );
        }

        // Get series for metadata and restrictions
        const series = await db.collection('anime_series').findOne({ 
            _id: new ObjectId(episode.seriesId) 
        });

        if (!series) {
            return NextResponse.json(
                { error: 'Series not found' },
                { status: 404 }
            );
        }

        // 1. Check geo-restrictions
        const userRegion = request.headers.get('x-vercel-ip-country') || 
                          request.headers.get('cf-ipcountry') || 
                          'US';
        
        if (series.geoRestrictions?.blocked?.includes(userRegion)) {
            return NextResponse.json(
                { 
                    error: 'Content not available in your region',
                    region: userRegion,
                },
                { status: 403 }
            );
        }

        if (series.geoRestrictions?.allowed && 
            !series.geoRestrictions.allowed.includes(userRegion)) {
            return NextResponse.json(
                { 
                    error: 'Content not available in your region',
                    region: userRegion,
                },
                { status: 403 }
            );
        }

        // 2. Check age rating / parental controls
        if (userId && user) {
            const ageRating = series.ageRating || 'PG-13';
            const userAge = user.age || null;
            const isKidsMode = user.preferences?.kidsMode || false;

            if (isKidsMode && (ageRating === 'R' || ageRating === 'NC-17')) {
                return NextResponse.json(
                    { error: 'Content not suitable for kids mode' },
                    { status: 403 }
                );
            }
        }

        // 3. Check subscription entitlement
        const isFreeEpisode = episode.isPreview || false;
        const requiresPremium = episode.drmEnabled || series.isExclusive || series.drmEnabled;
        
        if (requiresPremium && subscription.planName === 'free') {
            return NextResponse.json(
                { 
                    error: 'Premium subscription required',
                    requiresUpgrade: true,
                    upgradeUrl: '/anime/subscriptions',
                },
                { status: 403 }
            );
        }

        // 4. Check if episode is published
        if (episode.status !== 'published' && subscription.planName !== 'premium') {
            return NextResponse.json(
                { error: 'Episode not yet available' },
                { status: 403 }
            );
        }

        // 5. Generate signed manifest URL (time-limited)
        const expiresIn = 3600; // 1 hour
        const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;
        
        // Get manifest URL from episode or transcode job
        let manifestUrl = episode.hlsManifestUrl;
        
        // If no manifest, check transcode job
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
            return NextResponse.json(
                { error: 'Video not yet available. Transcoding in progress.' },
                { status: 503 }
            );
        }

        // Generate signed URL token
        const playbackToken = generatePlaybackToken(
            episodeId,
            userId,
            expiresAt,
            clientId,
            userRegion
        );

        // In production, use CDN signed URLs (CloudFront, Cloudflare)
        // For now, append token to URL
        const signedManifestUrl = `${manifestUrl}?token=${playbackToken}&exp=${expiresAt}`;

        // 6. DRM configuration (if required)
        let drmConfig = null;
        if (episode.drmEnabled || series.drmEnabled) {
            drmConfig = {
                enabled: true,
                licenseUrl: episode.drmLicenseUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/api/drm/license`,
                licenseToken: generateDRMToken(episodeId, userId, expiresAt),
                systems: ['widevine', 'playready', 'fairplay'], // Supported DRM systems
            };
        }

        // 7. Ad configuration (for free tier)
        let adConfig = null;
        if (subscription.planName === 'free' && !isFreeEpisode && preferSSAI) {
            // Server-side ad insertion
            adConfig = {
                type: 'ssai',
                vastUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/ads/vast?episodeId=${episodeId}`,
                adBreaks: [
                    { time: 0, type: 'pre-roll' },
                    { time: Math.floor(episode.duration / 2), type: 'mid-roll' },
                ],
            };
        } else if (subscription.planName === 'free' && !isFreeEpisode) {
            // Client-side ad insertion
            adConfig = {
                type: 'client',
                vastUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/ads/vast?episodeId=${episodeId}`,
            };
        }

        // 8. Prepare playback response
        const playbackData = {
            manifestUrl: signedManifestUrl,
            manifestExpiry: expiresAt,
            drm: drmConfig,
            ads: adConfig,
            subtitles: episode.subtitles || [],
            audioTracks: episode.audioTracks || [],
            qualityLevels: episode.qualityLevels || [],
            duration: episode.duration,
            playbackToken,
            metadata: {
                episodeId: episode._id.toString(),
                seriesId: series._id.toString(),
                title: episode.title,
                seriesTitle: series.title,
            },
        };

        // 9. Log playback request (analytics)
        await db.collection('anime_playback_events').insertOne({
            userId: userId || null,
            episodeId,
            seriesId: episode.seriesId,
            eventType: 'playback_request',
            timestamp: new Date(),
            device: deviceInfo?.type || 'web',
            region: userRegion,
            subscriptionTier: subscription.planName,
            ipAddress: deviceInfo?.ip || request.headers.get('x-forwarded-for') || null,
        });

        return NextResponse.json(playbackData);
    } catch (error: any) {
        console.error('Playback request error:', error);
        return NextResponse.json(
            { error: 'Failed to process playback request', details: error.message },
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
    
    // In production, use proper JWT signing with secret
    const secret = process.env.PLAYBACK_TOKEN_SECRET || 'playback-secret';
    const token = Buffer.from(JSON.stringify(payload)).toString('base64');
    
    // Add HMAC signature
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



