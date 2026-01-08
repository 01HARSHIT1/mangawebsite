import { NextRequest, NextResponse } from 'next/server';
import { requireAdminPermission } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/admin/anime/visibility - Get visibility controls for anime
 */
export async function GET(request: NextRequest) {
    try {
        const admin = await requireAdminPermission(request, 'canFeatureContent');
        
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const search = searchParams.get('search') || '';
        
        const client = await clientPromise;
        const db = client.db('mangawebsite');
        
        // Build filter
        const filter: any = {};
        if (search) {
            filter.title = { $regex: search, $options: 'i' };
        }
        
        // Get anime with visibility metadata
        const skip = (page - 1) * limit;
        const anime = await db.collection('anime_series')
            .find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();
        
        const total = await db.collection('anime_series').countDocuments(filter);
        
        const animeWithVisibility = anime.map((series: any) => ({
            _id: series._id.toString(),
            title: series.title,
            coverImage: series.coverImage,
            rating: series.rating || 0,
            episodeCount: series.episodeCount || 0,
            status: series.status || 'ongoing',
            isFeatured: series.isFeatured || false,
            isTrending: series.isTrending || false,
            isHidden: series.isHidden || false,
            isSuppressed: series.isSuppressed || false,
            visibilityBoost: series.visibilityBoost || 0, // Manual boost score (0-100)
            discoverability: series.discoverability || 'normal', // 'featured' | 'boosted' | 'normal' | 'suppressed' | 'hidden'
            manualRank: series.manualRank || null, // Manual ranking override
            featuredUntil: series.featuredUntil || null,
            suppressedUntil: series.suppressedUntil || null,
            createdAt: series.createdAt,
        }));
        
        return NextResponse.json({
            anime: animeWithVisibility,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error: any) {
        console.error('Error fetching visibility controls:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch visibility controls' },
            { status: error.message?.includes('Permission') ? 403 : 500 }
        );
    }
}

/**
 * POST /api/admin/anime/visibility - Update visibility controls for anime
 */
export async function POST(request: NextRequest) {
    try {
        const admin = await requireAdminPermission(request, 'canFeatureContent');
        
        const { seriesId, updates } = await request.json();
        
        if (!seriesId || !updates) {
            return NextResponse.json(
                { error: 'seriesId and updates are required' },
                { status: 400 }
            );
        }
        
        const client = await clientPromise;
        const db = client.db('mangawebsite');
        
        // Check if series exists
        const series = await db.collection('anime_series').findOne({
            _id: new ObjectId(seriesId)
        });
        
        if (!series) {
            return NextResponse.json(
                { error: 'Anime series not found' },
                { status: 404 }
            );
        }
        
        const now = new Date();
        const updateData: any = {
            updatedAt: now,
        };
        
        // Process visibility updates
        if ('isFeatured' in updates) {
            updateData.isFeatured = updates.isFeatured;
            if (updates.isFeatured) {
                updateData.featuredAt = now;
                if (updates.featuredUntil) {
                    updateData.featuredUntil = new Date(updates.featuredUntil);
                }
            } else {
                updateData.featuredUntil = null;
            }
        }
        
        if ('isTrending' in updates) {
            updateData.isTrending = updates.isTrending;
        }
        
        if ('isHidden' in updates) {
            updateData.isHidden = updates.isHidden;
            updateData.hiddenAt = updates.isHidden ? now : null;
        }
        
        if ('isSuppressed' in updates) {
            updateData.isSuppressed = updates.isSuppressed;
            if (updates.isSuppressed) {
                updateData.suppressedAt = now;
                if (updates.suppressedUntil) {
                    updateData.suppressedUntil = new Date(updates.suppressedUntil);
                }
            } else {
                updateData.suppressedUntil = null;
            }
        }
        
        if ('visibilityBoost' in updates) {
            const boost = Math.max(0, Math.min(100, updates.visibilityBoost || 0));
            updateData.visibilityBoost = boost;
        }
        
        if ('discoverability' in updates) {
            const validDiscoverability = ['featured', 'boosted', 'normal', 'suppressed', 'hidden'];
            if (validDiscoverability.includes(updates.discoverability)) {
                updateData.discoverability = updates.discoverability;
            }
        }
        
        if ('manualRank' in updates) {
            updateData.manualRank = updates.manualRank !== null ? parseInt(updates.manualRank) : null;
        }
        
        // Update series
        await db.collection('anime_series').updateOne(
            { _id: new ObjectId(seriesId) },
            { $set: updateData }
        );
        
        // Log action
        await db.collection('admin_audit_logs').insertOne({
            adminId: admin._id,
            adminEmail: admin.email,
            action: 'update_visibility',
            targetId: seriesId,
            details: {
                title: series.title,
                updates,
            },
            timestamp: now,
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown',
        });
        
        return NextResponse.json({
            success: true,
            message: 'Visibility controls updated successfully',
        });
    } catch (error: any) {
        console.error('Error updating visibility controls:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update visibility controls' },
            { status: error.message?.includes('Permission') ? 403 : 500 }
        );
    }
}
