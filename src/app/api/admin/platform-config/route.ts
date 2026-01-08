import { NextRequest, NextResponse } from 'next/server';
import { requireAdminPermission } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface PlatformConfig {
    // Audio & Language
    supportedAudioLanguages: string[];
    supportedSubtitleLanguages: string[];
    defaultAudioLanguage: string;
    defaultSubtitleLanguage: string;
    
    // Video
    maxVideoSizeMB: number;
    maxEpisodeSizeMB: number;
    allowedVideoCodecs: string[];
    allowedVideoFormats: string[];
    videoQualityPresets: Array<'360p' | '480p' | '720p' | '1080p'>;
    
    // Upload Limits
    maxUploadsPerDay: number;
    maxUploadsPerCreator: number;
    maxEpisodesPerSeries: number;
    
    // Subtitles
    allowedSubtitleFormats: string[];
    maxSubtitleFileSizeMB: number;
    
    // Comments
    commentMaxLength: number;
    requireCommentApproval: boolean;
    allowAnonymousComments: boolean;
    maxCommentsPerEpisode: number;
    
    // General
    siteMaintenance: boolean;
    registrationEnabled: boolean;
    uploadEnabled: boolean;
    creatorApplicationsEnabled: boolean;
    
    // Recommendations
    recommendationCacheHours: number;
    trendingWindowDays: number;
    
    // Notifications
    enableEmailNotifications: boolean;
    enablePushNotifications: boolean;
    
    updatedAt: Date;
    updatedBy: string;
}

/**
 * GET /api/admin/platform-config - Get platform configuration
 */
export async function GET(request: NextRequest) {
    try {
        const admin = await requireAdminPermission(request, 'canManageSettings');
        
        const client = await clientPromise;
        const db = client.db('mangawebsite');
        
        // Get or create default config
        let config = await db.collection('platform_config').findOne({});
        
        if (!config) {
            // Create default config
            const defaultConfig: PlatformConfig = {
                supportedAudioLanguages: ['English', 'Japanese', 'Spanish', 'French', 'German', 'Chinese'],
                supportedSubtitleLanguages: ['English', 'Japanese', 'Spanish', 'French', 'German', 'Chinese', 'Portuguese', 'Italian', 'Korean'],
                defaultAudioLanguage: 'Japanese',
                defaultSubtitleLanguage: 'English',
                maxVideoSizeMB: 2048, // 2GB
                maxEpisodeSizeMB: 1024, // 1GB
                allowedVideoCodecs: ['h264', 'h265', 'vp9'],
                allowedVideoFormats: ['mp4', 'mkv', 'webm'],
                videoQualityPresets: ['360p', '480p', '720p', '1080p'],
                maxUploadsPerDay: 10,
                maxUploadsPerCreator: 100,
                maxEpisodesPerSeries: 200,
                allowedSubtitleFormats: ['vtt', 'srt', 'ass'],
                maxSubtitleFileSizeMB: 5,
                commentMaxLength: 1000,
                requireCommentApproval: false,
                allowAnonymousComments: true,
                maxCommentsPerEpisode: 1000,
                siteMaintenance: false,
                registrationEnabled: true,
                uploadEnabled: true,
                creatorApplicationsEnabled: true,
                recommendationCacheHours: 24,
                trendingWindowDays: 7,
                enableEmailNotifications: true,
                enablePushNotifications: true,
                updatedAt: new Date(),
                updatedBy: admin._id.toString(),
            };
            
            await db.collection('platform_config').insertOne(defaultConfig);
            config = defaultConfig;
        }
        
        return NextResponse.json({ config });
    } catch (error: any) {
        console.error('Error fetching platform config:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch platform config' },
            { status: error.message?.includes('Permission') ? 403 : 500 }
        );
    }
}

/**
 * PUT /api/admin/platform-config - Update platform configuration
 */
export async function PUT(request: NextRequest) {
    try {
        const admin = await requireAdminPermission(request, 'canManageSettings');
        
        const { config: updates } = await request.json();
        
        if (!updates) {
            return NextResponse.json(
                { error: 'config updates are required' },
                { status: 400 }
            );
        }
        
        const client = await clientPromise;
        const db = client.db('mangawebsite');
        
        // Get current config
        const currentConfig = await db.collection('platform_config').findOne({});
        
        // Merge updates
        const now = new Date();
        const updatedConfig = {
            ...(currentConfig || {}),
            ...updates,
            updatedAt: now,
            updatedBy: admin._id.toString(),
        };
        
        // Update or create config
        await db.collection('platform_config').updateOne(
            {},
            { $set: updatedConfig },
            { upsert: true }
        );
        
        // Log config change
        await db.collection('admin_audit_logs').insertOne({
            adminId: admin._id,
            adminEmail: admin.email,
            action: 'update_platform_config',
            details: {
                updates,
                previousConfig: currentConfig || {},
            },
            timestamp: now,
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown',
        });
        
        return NextResponse.json({
            success: true,
            message: 'Platform configuration updated successfully',
            config: updatedConfig,
        });
    } catch (error: any) {
        console.error('Error updating platform config:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update platform config' },
            { status: error.message?.includes('Permission') ? 403 : 500 }
        );
    }
}
