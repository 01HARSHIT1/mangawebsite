import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET: Get detailed earnings for a creator (admin only)
export async function GET(
    request: NextRequest,
    { params }: { params: { creatorId: string } }
) {
    try {
        // Verify admin authentication
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await verifyToken(token);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        // Get query parameters
        const { searchParams } = new URL(request.url);
        const period = searchParams.get('period') || 'all'; // 'all', 'weekly', 'monthly', 'yearly'
        const mangaId = searchParams.get('mangaId') || null;

        // Connect to database
        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Validate creatorId
        if (!ObjectId.isValid(params.creatorId)) {
            return NextResponse.json({ error: 'Invalid creator ID' }, { status: 400 });
        }

        // Calculate date range based on period
        const now = new Date();
        let startDate: Date | null = null;
        
        switch (period) {
            case 'weekly':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'monthly':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case 'yearly':
                startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
                break;
            default:
                startDate = null; // All time
        }

        // Build donation query
        const donationQuery: any = {
            recipientId: params.creatorId,
            status: 'completed'
        };

        if (startDate) {
            donationQuery.createdAt = { $gte: startDate };
        }

        if (mangaId) {
            donationQuery.mangaId = mangaId;
        }

        // Fetch all donations for this creator
        const donations = await db.collection('donations')
            .find(donationQuery)
            .sort({ createdAt: -1 })
            .toArray();

        // Calculate total earnings
        const totalEarnings = donations.reduce((sum, d: any) => sum + (d.amount || 0), 0);

        // Group earnings by manga
        const earningsByManga: Record<string, {
            mangaId: string;
            mangaTitle: string;
            totalEarnings: number;
            donationCount: number;
            donations: any[];
        }> = {};

        donations.forEach((donation: any) => {
            const mangaIdKey = donation.mangaId || 'general';
            const mangaTitle = donation.mangaTitle || 'General Tips';

            if (!earningsByManga[mangaIdKey]) {
                earningsByManga[mangaIdKey] = {
                    mangaId: mangaIdKey,
                    mangaTitle,
                    totalEarnings: 0,
                    donationCount: 0,
                    donations: []
                };
            }

            earningsByManga[mangaIdKey].totalEarnings += donation.amount || 0;
            earningsByManga[mangaIdKey].donationCount += 1;
            earningsByManga[mangaIdKey].donations.push({
                _id: donation._id.toString(),
                amount: donation.amount || 0,
                message: donation.message || '',
                donorUsername: donation.donorUsername || 'Anonymous',
                createdAt: donation.createdAt ? donation.createdAt.toISOString() : new Date().toISOString(),
                type: donation.type || 'creator-tip'
            });
        });

        // Get manga details for each mangaId
        const mangaDetails = await Promise.all(
            Object.keys(earningsByManga).map(async (mangaIdKey) => {
                if (mangaIdKey === 'general') {
                    return null;
                }
                try {
                    if (ObjectId.isValid(mangaIdKey)) {
                        const manga = await db.collection('manga').findOne({ _id: new ObjectId(mangaIdKey) });
                        if (manga) {
                            // Get chapters for this manga
                            const chapters = await db.collection('chapters')
                                .find({ mangaId: mangaIdKey })
                                .sort({ chapterNumber: 1 })
                                .toArray();

                            // Calculate earnings per chapter (from donations that mention the manga)
                            const chapterEarnings: Record<string, {
                                chapterId: string;
                                chapterNumber: number;
                                chapterTitle: string;
                                totalEarnings: number;
                                donationCount: number;
                            }> = {};

                            // For now, we'll distribute manga earnings across chapters proportionally
                            // In the future, if donations have chapterId, we can track per chapter
                            const mangaEarnings = earningsByManga[mangaIdKey].totalEarnings;
                            const chapterCount = chapters.length;

                            chapters.forEach((chapter: any) => {
                                // For now, distribute evenly (or you could use views/engagement)
                                const estimatedEarnings = chapterCount > 0 ? mangaEarnings / chapterCount : 0;
                                
                                chapterEarnings[chapter._id.toString()] = {
                                    chapterId: chapter._id.toString(),
                                    chapterNumber: chapter.chapterNumber || 0,
                                    chapterTitle: chapter.title || `Chapter ${chapter.chapterNumber}`,
                                    totalEarnings: estimatedEarnings,
                                    donationCount: Math.round(earningsByManga[mangaIdKey].donationCount / chapterCount)
                                };
                            });

                            return {
                                mangaId: mangaIdKey,
                                mangaTitle: manga.title || earningsByManga[mangaIdKey].mangaTitle,
                                totalEarnings: earningsByManga[mangaIdKey].totalEarnings,
                                donationCount: earningsByManga[mangaIdKey].donationCount,
                                chapterCount: chapters.length,
                                chapters: Object.values(chapterEarnings),
                                donations: earningsByManga[mangaIdKey].donations
                            };
                        }
                    }
                } catch (error) {
                    console.error(`Error fetching manga ${mangaIdKey}:`, error);
                }
                return null;
            })
        );

        // Filter out null values
        const mangaEarningsDetails = mangaDetails.filter(m => m !== null);

        // Add general tips (donations without mangaId)
        const generalTips = earningsByManga['general'] || null;
        if (generalTips && generalTips.totalEarnings > 0) {
            mangaEarningsDetails.push({
                mangaId: 'general',
                mangaTitle: 'General Tips',
                totalEarnings: generalTips.totalEarnings,
                donationCount: generalTips.donationCount,
                chapterCount: 0,
                chapters: [],
                donations: generalTips.donations
            });
        }

        // Calculate period summaries
        const periodSummaries = {
            weekly: calculatePeriodEarnings(donations, 7),
            monthly: calculatePeriodEarnings(donations, 30),
            yearly: calculatePeriodEarnings(donations, 365),
            all: { total: totalEarnings, count: donations.length }
        };

        return NextResponse.json({
            creatorId: params.creatorId,
            period,
            totalEarnings,
            totalDonations: donations.length,
            periodSummaries,
            earningsByManga: mangaEarningsDetails,
            recentDonations: donations.slice(0, 20).map((d: any) => ({
                _id: d._id.toString(),
                amount: d.amount || 0,
                message: d.message || '',
                donorUsername: d.donorUsername || 'Anonymous',
                mangaId: d.mangaId || null,
                mangaTitle: d.mangaTitle || null,
                createdAt: d.createdAt ? d.createdAt.toISOString() : new Date().toISOString(),
                type: d.type || 'creator-tip'
            }))
        });
    } catch (error) {
        console.error('Admin creator earnings error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch creator earnings' },
            { status: 500 }
        );
    }
}

function calculatePeriodEarnings(donations: any[], days: number): { total: number; count: number } {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const periodDonations = donations.filter((d: any) => {
        const donationDate = d.createdAt instanceof Date ? d.createdAt : new Date(d.createdAt);
        return donationDate >= cutoffDate;
    });

    return {
        total: periodDonations.reduce((sum, d: any) => sum + (d.amount || 0), 0),
        count: periodDonations.length
    };
}

