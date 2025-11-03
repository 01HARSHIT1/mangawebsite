import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

/**
 * Diagnostic endpoint to debug why manga dropdown is empty
 * Shows what's in the database vs what the filter is looking for
 */
export async function GET(request: NextRequest) {
    try {
        const client = await clientPromise;
        const db = client.db();

        // Get token from header
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        
        let userId = null;
        let tokenInfo = null;
        
        if (token) {
            try {
                const { verify } = await import('jsonwebtoken');
                const secret = process.env.JWT_SECRET || 'your-secret-key';
                const decoded = verify(token, secret) as any;
                userId = decoded.userId;
                tokenInfo = {
                    userId: decoded.userId,
                    email: decoded.email,
                    username: decoded.username
                };
            } catch (e) {
                tokenInfo = { error: 'Invalid token', details: e instanceof Error ? e.message : 'Unknown' };
            }
        }

        // Get ALL manga to see what's in the database
        const allManga = await db.collection('manga')
            .find()
            .limit(20)
            .toArray();

        // Get manga filtered by uploaderId (if we have a userId)
        let filteredManga = [];
        if (userId) {
            filteredManga = await db.collection('manga')
                .find({ uploaderId: userId })
                .toArray();
        }

        // Check for manga with old createdBy field
        const oldFormatManga = await db.collection('manga')
            .find({ 
                createdBy: { $exists: true },
                uploaderId: { $exists: false }
            })
            .toArray();

        const diagnostics = {
            authentication: {
                hasToken: !!token,
                tokenInfo,
                extractedUserId: userId
            },
            database: {
                totalMangaCount: allManga.length,
                allManga: allManga.map(m => ({
                    _id: m._id.toString(),
                    title: m.title,
                    creator: m.creator,
                    uploaderId: m.uploaderId || 'MISSING',
                    createdBy: m.createdBy ? (m.createdBy.toString()) : 'N/A',
                    hasUploaderId: !!m.uploaderId,
                    hasCreatedBy: !!m.createdBy
                })),
                filteredMangaCount: filteredManga.length,
                filteredManga: filteredManga.map(m => ({
                    _id: m._id.toString(),
                    title: m.title,
                    uploaderId: m.uploaderId
                })),
                oldFormatMangaCount: oldFormatManga.length,
                oldFormatManga: oldFormatManga.map(m => ({
                    _id: m._id.toString(),
                    title: m.title,
                    createdBy: m.createdBy?.toString(),
                    needsMigration: true
                }))
            },
            recommendations: []
        };

        // Add recommendations
        if (!token) {
            diagnostics.recommendations.push('⚠️ No authentication token found in request headers');
        }
        if (oldFormatManga.length > 0) {
            diagnostics.recommendations.push(`⚠️ Found ${oldFormatManga.length} manga with old 'createdBy' field - run /api/debug/fix-uploader-field`);
        }
        if (userId && filteredManga.length === 0 && allManga.length > 0) {
            diagnostics.recommendations.push(`⚠️ User ID ${userId} has no manga with matching uploaderId`);
        }
        if (filteredManga.length > 0) {
            diagnostics.recommendations.push(`✅ Found ${filteredManga.length} manga that should appear in dropdown`);
        }

        return NextResponse.json(diagnostics, { status: 200 });

    } catch (error) {
        console.error('❌ Diagnostic error:', error);
        return NextResponse.json({
            error: 'Diagnostic failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

