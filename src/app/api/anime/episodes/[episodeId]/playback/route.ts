import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';
import crypto from 'crypto';

// Get playback URL with entitlement check
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
        
        if (token) {
            const payload = verifyToken(token);
            if (payload) {
                userId = payload.userId;
                
                // Get user subscription
                const client = await clientPromise;
                const db = client.db('mangawebsite');
                const user = await db.collection('users').findOne({ _id: userId });
                subscription = user?.subscription || { planName: 'free', status: 'active' };
            }
        } else {
            // Anonymous user - free tier
            subscription = { planName: 'free', status: 'active' };
        }

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Get episode data
        const episode = await db.collection('anime_episodes').findOne({ _id: episodeId });
        if (!episode) {
            return NextResponse.json({ error: 'Episode not found' }, { status: 404 });
        }

        // Get series for geo-restrictions check
        const series = await db.collection('anime_series').findOne({ _id: episode.seriesId });
        
        // Check geo-restrictions (simplified - would use actual IP geolocation in production)
        const userRegion = request.headers.get('x-vercel-ip-country') || 'US';
        if (series?.geoRestrictions?.blocked?.includes(userRegion)) {
            return NextResponse.json({ error: 'Content not available in your region' }, { status: 403 });
        }

        // Check subscription entitlement
        const isFreeEpisode = episode.isPreview || false;
        const requiresPremium = episode.drmEnabled || series?.isExclusive;
        
        if (requiresPremium && subscription.planName === 'free') {
            return NextResponse.json({ 
                error: 'Premium subscription required',
                requiresUpgrade: true 
            }, { status: 403 });
        }

        // Generate signed manifest URL (time-limited)
        const expiresIn = 3600; // 1 hour
        const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;
        
        // In production, use proper CDN signed URLs (CloudFront, Cloudflare)
        const manifestUrl = episode.hlsManifestUrl || episode.videoUrl;
        
        // For now, return the URL with expiration info
        // In production, this would be a signed CDN URL
        const playbackData = {
            manifestUrl: manifestUrl,
            expiresAt: expiresAt,
            drmEnabled: episode.drmEnabled || false,
            drmLicenseUrl: episode.drmLicenseUrl || null,
            subtitles: episode.subtitles || [],
            audioTracks: episode.audioTracks || [],
            qualityLevels: episode.qualityLevels || [],
            duration: episode.duration,
            // Add token for player to use
            playbackToken: generatePlaybackToken(episodeId, userId, expiresAt),
        };

        // Log playback request (analytics)
        if (userId) {
            await db.collection('anime_playback_events').insertOne({
                userId,
                episodeId,
                seriesId: episode.seriesId,
                eventType: 'play',
                timestamp: new Date(),
                device: 'web',
                region: userRegion,
            });
        }

        return NextResponse.json(playbackData);
    } catch (error) {
        console.error('Error getting playback URL:', error);
        return NextResponse.json({ error: 'Failed to get playback URL' }, { status: 500 });
    }
}

function generatePlaybackToken(episodeId: string, userId: string | null, expiresAt: number): string {
    // In production, use JWT or proper token generation
    const payload = {
        episodeId,
        userId: userId || 'anonymous',
        expiresAt,
    };
    
    // Simple token (in production, use proper signing)
    return Buffer.from(JSON.stringify(payload)).toString('base64');
}

