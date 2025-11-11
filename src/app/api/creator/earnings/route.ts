import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { requireCreator } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type DonationRecord = {
    _id: string;
    donorUsername?: string;
    donorId: string;
    amount: number;
    message?: string;
    createdAt: Date;
};

export async function GET(req: NextRequest) {
    try {
        const user = await requireCreator(req);
        const client = await clientPromise;
        const db = client.db();

        const creatorId = user._id.toString();

        const donations = await db.collection('donations')
            .find({ recipientId: creatorId, status: 'completed' })
            .sort({ createdAt: -1 })
            .limit(100)
            .toArray();

        const payouts = await db.collection('payouts')
            .find({ creatorId })
            .sort({ createdAt: -1 })
            .limit(50)
            .toArray();

        const totalReceived = donations.reduce((sum, donation: any) => sum + (donation.amount || 0), 0);
        const completedPayouts = payouts.filter((p: any) => p.status === 'completed');
        const pendingPayouts = payouts.filter((p: any) => p.status === 'requested' || p.status === 'processing');

        const totalPaidOut = completedPayouts.reduce((sum, payout: any) => sum + (payout.amount || 0), 0);
        const pendingBalance = pendingPayouts.reduce((sum, payout: any) => sum + (payout.amount || 0), 0);
        const currentBalance = Math.max(totalReceived - totalPaidOut - pendingBalance, 0);

        const donationResponse = donations.map((donation: any) => ({
            _id: donation._id.toString(),
            amount: donation.amount || 0,
            message: donation.message || '',
            createdAt: donation.createdAt ? donation.createdAt.toISOString() : new Date().toISOString(),
            username: donation.donorUsername || 'Supporter',
            type: donation.type || 'donation',
            mangaId: donation.mangaId || null,
            mangaTitle: donation.mangaTitle || null,
            payoutStatus: donation.payoutStatus || null,
            payoutMessage: donation.payoutMessage || '',
            payoutId: donation.payoutId || null
        }));

        const payoutResponse = payouts.map((payout: any) => ({
            _id: payout._id.toString(),
            amount: payout.amount || 0,
            status: payout.status || 'requested',
            createdAt: payout.createdAt ? payout.createdAt.toISOString() : new Date().toISOString(),
            updatedAt: payout.updatedAt ? payout.updatedAt.toISOString() : null,
            completedAt: payout.completedAt ? payout.completedAt.toISOString() : null,
            razorpayPayoutId: payout.razorpayPayoutId || null,
            fundAccountId: payout.fundAccountId || null,
            mode: payout.mode || null,
            notes: payout.notes || null,
            error: payout.error || null,
            donationId: payout.donationId || null
        }));

        return NextResponse.json({
            success: true,
            currentBalance,
            pendingBalance,
            totalEarnings: totalReceived,
            totalPaidOut,
            donations: donationResponse,
            payouts: payoutResponse
        });
    } catch (error) {
        console.error('Creator earnings error:', error);
        return NextResponse.json({
            error: 'Failed to fetch earnings data',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

