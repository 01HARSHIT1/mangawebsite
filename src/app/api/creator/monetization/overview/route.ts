import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { requireCreator } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type MonetizationOverviewResponse = {
    plans: Array<{
        _id: string;
        name: string;
        type: 'subscription' | 'one-time' | 'coins';
        interval: 'one-time' | 'monthly' | 'quarterly' | 'yearly';
        price: number;
        isActive: boolean;
        subscriberCount: number;
        revenue30d: number;
    }>;
    stats: {
        activePlans: number;
        inactivePlans: number;
        paidChapters: number;
        freeChapters: number;
        averageChapterPrice: number;
        donationRevenue30d: number;
        estimatedMonthlyRevenue: number;
    };
    revenueBreakdown: {
        donations: number;
        subscriptions: number;
        coins: number;
    };
};

export async function GET(request: NextRequest) {
    try {
        const user = await requireCreator(request);
        const client = await clientPromise;
        const db = client.db();

        const creatorId = user._id.toString();

        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const manga = await db.collection('manga')
            .find({ uploaderId: creatorId })
            .project({ _id: 1 })
            .toArray();

        const mangaIds = manga.map((m) => m._id.toString());

        const [plans, chapters, donations30d] = await Promise.all([
            db.collection('monetization_plans')
                .find({ creatorId })
                .sort({ createdAt: -1 })
                .toArray(),
            db.collection('chapters')
                .find({ mangaId: { $in: mangaIds } })
                .project({
                    coinPrice: 1,
                    paywallType: 1,
                    isFree: 1
                })
                .toArray(),
            db.collection('donations')
                .find({
                    recipientId: creatorId,
                    createdAt: { $gte: thirtyDaysAgo }
                })
                .toArray()
        ]);

        const paidChapters = chapters.filter((chapter) => {
            if (chapter.isFree) return false;
            if (chapter.paywallType && chapter.paywallType !== 'free') return true;
            if (typeof chapter.coinPrice === 'number' && chapter.coinPrice > 0) return true;
            return false;
        });

        const freeChapters = chapters.length - paidChapters.length;
        const averageChapterPrice = paidChapters.length > 0
            ? paidChapters.reduce((sum, chapter) => sum + (Number(chapter.coinPrice) || 0), 0) / paidChapters.length
            : 0;

        const donationRevenue30d = donations30d.reduce((sum, donation: any) => sum + (donation.amount || 0), 0);
        const subscriptionRevenue30d = plans
            .filter((plan: any) => plan.type === 'subscription')
            .reduce((sum, plan: any) => sum + (plan.revenue30d || 0), 0);
        const coinRevenue30d = paidChapters.reduce((sum, chapter: any) => sum + (Number(chapter.coinPrice) || 0), 0);

        const overview: MonetizationOverviewResponse = {
            plans: plans.map((plan: any) => ({
                _id: plan._id.toString(),
                name: plan.name,
                type: plan.type || 'subscription',
                interval: plan.interval || 'monthly',
                price: plan.price || 0,
                isActive: plan.isActive !== false,
                subscriberCount: plan.subscriberCount || 0,
                revenue30d: plan.revenue30d || 0
            })),
            stats: {
                activePlans: plans.filter((plan: any) => plan.isActive !== false).length,
                inactivePlans: plans.filter((plan: any) => plan.isActive === false).length,
                paidChapters: paidChapters.length,
                freeChapters,
                averageChapterPrice: Math.round(averageChapterPrice * 100) / 100,
                donationRevenue30d: Math.round(donationRevenue30d * 100) / 100,
                estimatedMonthlyRevenue: Math.round((donationRevenue30d + subscriptionRevenue30d + coinRevenue30d) * 100) / 100
            },
            revenueBreakdown: {
                donations: Math.round(donationRevenue30d * 100) / 100,
                subscriptions: Math.round(subscriptionRevenue30d * 100) / 100,
                coins: Math.round(coinRevenue30d * 100) / 100
            }
        };

        return NextResponse.json(overview);
    } catch (error) {
        console.error('Monetization overview error:', error);
        return NextResponse.json(
            {
                error: 'Failed to load monetization overview',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

