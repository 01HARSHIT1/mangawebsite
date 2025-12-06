import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';

/**
 * Creator Earnings API
 * Returns earnings breakdown by asset, revenue type, and date range
 */

export const dynamic = 'force-dynamic';

// GET /api/creators/earnings - Get earnings summary and breakdown
export async function GET(request: NextRequest) {
    try {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = verifyToken(token);
        if (!payload || (payload.role !== 'creator' && payload.role !== 'admin')) {
            return NextResponse.json(
                { error: 'Creator access required' },
                { status: 403 }
            );
        }

        const searchParams = request.nextUrl.searchParams;
        const range = searchParams.get('range') || '30d'; // 7d, 30d, 90d, all
        const creatorId = searchParams.get('creatorId') || payload.userId;

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Get creator profile
        const creator = await db.collection('creators').findOne({ 
            userId: creatorId 
        });

        if (!creator && payload.role !== 'admin') {
            return NextResponse.json(
                { error: 'Creator profile not found' },
                { status: 404 }
            );
        }

        // Calculate date range
        const now = new Date();
        let startDate: Date;
        switch (range) {
            case '7d':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '90d':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(0); // All time
        }

        // Get earnings
        const earningsQuery: any = { creatorId: creator?._id?.toString() || creatorId };
        if (range !== 'all') {
            earningsQuery.date = { $gte: startDate };
        }

        const earnings = await db.collection('creator_earnings')
            .find(earningsQuery)
            .sort({ date: -1 })
            .toArray();

        // Aggregate by revenue type
        const byType = earnings.reduce((acc: any, earning: any) => {
            const type = earning.revenueType || 'unknown';
            if (!acc[type]) {
                acc[type] = { total: 0, count: 0 };
            }
            acc[type].total += earning.amount || 0;
            acc[type].count += 1;
            return acc;
        }, {});

        // Aggregate by asset
        const byAsset = earnings.reduce((acc: any, earning: any) => {
            const assetId = earning.assetId || 'unknown';
            if (!acc[assetId]) {
                acc[assetId] = { total: 0, count: 0, assetId };
            }
            acc[assetId].total += earning.amount || 0;
            acc[assetId].count += 1;
            return acc;
        }, {});

        // Get asset details
        const assetDetails = await Promise.all(
            Object.keys(byAsset).map(async (assetId) => {
                if (assetId === 'unknown') return null;
                const asset = await db.collection('assets').findOne({ _id: new ObjectId(assetId) });
                const episode = asset?.metadata?.episodeId 
                    ? await db.collection('anime_episodes').findOne({ _id: new ObjectId(asset.metadata.episodeId) })
                    : null;
                const series = episode?.seriesId
                    ? await db.collection('anime_series').findOne({ _id: new ObjectId(episode.seriesId) })
                    : null;
                return {
                    assetId,
                    filename: asset?.filename,
                    seriesTitle: series?.title,
                    episodeTitle: episode?.title,
                    ...byAsset[assetId],
                };
            })
        );

        // Calculate totals
        const total = earnings.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
        const pending = earnings
            .filter((e: any) => e.status === 'pending')
            .reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
        const paid = earnings
            .filter((e: any) => e.status === 'paid')
            .reduce((sum: number, e: any) => sum + (e.amount || 0), 0);

        return NextResponse.json({
            summary: {
                total,
                pending,
                paid,
                currency: 'INR',
                range,
                period: {
                    start: startDate.toISOString(),
                    end: now.toISOString(),
                },
            },
            byType,
            byAsset: assetDetails.filter(Boolean),
            recentEarnings: earnings.slice(0, 50).map((e: any) => ({
                id: e._id.toString(),
                amount: e.amount,
                currency: e.currency || 'INR',
                revenueType: e.revenueType,
                status: e.status,
                date: e.date,
                assetId: e.assetId,
            })),
        });
    } catch (error: any) {
        console.error('Error fetching earnings:', error);
        return NextResponse.json(
            { error: 'Failed to fetch earnings', details: error.message },
            { status: 500 }
        );
    }
}

