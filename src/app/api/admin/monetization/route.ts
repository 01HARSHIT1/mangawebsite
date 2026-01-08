import { NextRequest, NextResponse } from 'next/server';
import { requireAdminPermission } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/admin/monetization - Get platform monetization stats
 */
export async function GET(request: NextRequest) {
    try {
        const admin = await requireAdminPermission(request, 'canViewRevenue');
        
        const client = await clientPromise;
        const db = client.db('mangawebsite');
        
        const { searchParams } = new URL(request.url);
        const range = searchParams.get('range') || '30d'; // 7d, 30d, 90d, all
        
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
        
        // Platform Revenue
        const revenueQuery: any = {};
        if (range !== 'all') {
            revenueQuery.timestamp = { $gte: startDate };
        }
        
        const payments = await db.collection('payments').find(revenueQuery).toArray();
        const donations = await db.collection('donations').find({ 
            ...revenueQuery, 
            status: 'completed' 
        }).toArray();
        
        const totalRevenue = payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
        const donationRevenue = donations.reduce((sum: number, d: any) => sum + (d.amount || 0), 0);
        const subscriptionRevenue = payments.filter((p: any) => p.type === 'subscription').reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
        const coinRevenue = payments.filter((p: any) => p.type === 'coins' || p.type === 'chapter').reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
        
        // Creator Earnings
        const creators = await db.collection('creators').find({}).toArray();
        const creatorEarnings = await Promise.all(creators.map(async (creator: any) => {
            const creatorEarningsQuery: any = { creatorId: creator._id.toString() };
            if (range !== 'all') {
                creatorEarningsQuery.date = { $gte: startDate };
            }
            
            const earnings = await db.collection('creator_earnings')
                .find(creatorEarningsQuery)
                .toArray();
            
            const totalEarned = earnings.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
            const pendingEarned = earnings.filter((e: any) => e.status === 'pending').reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
            const paidEarned = earnings.filter((e: any) => e.status === 'paid').reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
            
            const user = await db.collection('users').findOne({ _id: new ObjectId(creator.userId) });
            
            return {
                creatorId: creator._id.toString(),
                userId: creator.userId,
                username: user?.username || 'Unknown',
                email: user?.email || '',
                displayName: creator.displayName || user?.username || 'Unknown',
                isVerified: creator.verificationStatus === 'verified' || user?.isVerified || false,
                totalEarned,
                pendingEarned,
                paidEarned,
                monetizationEnabled: creator.monetizationEnabled !== false,
                revenueShare: creator.revenueShare || 70,
            };
        }));
        
        // Payout Requests
        const payoutRequests = await db.collection('payout_requests')
            .find({})
            .sort({ requestedAt: -1 })
            .limit(50)
            .toArray();
        
        const pendingPayouts = payoutRequests.filter((p: any) => p.status === 'pending' || p.status === 'processing');
        const completedPayouts = payoutRequests.filter((p: any) => p.status === 'completed');
        const failedPayouts = payoutRequests.filter((p: any) => p.status === 'failed');
        
        const totalPendingAmount = pendingPayouts.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
        const totalPaidOut = completedPayouts.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
        const totalFailedAmount = failedPayouts.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
        
        // Platform Statistics
        const totalCreators = creators.length;
        const monetizedCreators = creators.filter((c: any) => c.monetizationEnabled !== false).length;
        const verifiedCreators = creators.filter((c: any) => c.verificationStatus === 'verified' || c.kycStatus === 'verified').length;
        
        // Revenue breakdown by day
        const dailyRevenue: Record<string, number> = {};
        payments.forEach((p: any) => {
            if (p.timestamp) {
                const date = new Date(p.timestamp).toISOString().split('T')[0];
                dailyRevenue[date] = (dailyRevenue[date] || 0) + (p.amount || 0);
            }
        });
        
        const dailyRevenueArray = Object.entries(dailyRevenue)
            .map(([date, amount]) => ({ date, amount }))
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(-30); // Last 30 days
        
        return NextResponse.json({
            platform: {
                totalRevenue,
                donationRevenue,
                subscriptionRevenue,
                coinRevenue,
                totalPaidOut,
                totalPendingAmount,
                netRevenue: totalRevenue - totalPaidOut - totalPendingAmount,
            },
            creators: {
                total: totalCreators,
                monetized: monetizedCreators,
                verified: verifiedCreators,
                earnings: creatorEarnings.sort((a, b) => b.totalEarned - a.totalEarned),
            },
            payouts: {
                pending: pendingPayouts.map((p: any) => ({
                    _id: p._id.toString(),
                    creatorId: p.creatorId,
                    userId: p.userId,
                    amount: p.amount,
                    currency: p.currency || 'INR',
                    status: p.status,
                    requestedAt: p.requestedAt,
                    notes: p.notes || '',
                })),
                completed: completedPayouts.length,
                failed: failedPayouts.length,
                totalPendingAmount,
                totalPaidOut,
                totalFailedAmount,
            },
            analytics: {
                dailyRevenue: dailyRevenueArray,
            },
        });
    } catch (error: any) {
        console.error('Error fetching monetization stats:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch monetization stats' },
            { status: error.message?.includes('Permission') ? 403 : 500 }
        );
    }
}

/**
 * POST /api/admin/monetization/process-payout - Process a payout request
 */
export async function POST(request: NextRequest) {
    try {
        const admin = await requireAdminPermission(request, 'canProcessPayouts');
        
        const { payoutRequestId, action, notes } = await request.json();
        
        if (!payoutRequestId || !action) {
            return NextResponse.json(
                { error: 'payoutRequestId and action are required' },
                { status: 400 }
            );
        }
        
        const validActions = ['approve', 'reject', 'process'];
        if (!validActions.includes(action)) {
            return NextResponse.json(
                { error: 'Invalid action. Must be: approve, reject, or process' },
                { status: 400 }
            );
        }
        
        const client = await clientPromise;
        const db = client.db('mangawebsite');
        
        const payoutRequest = await db.collection('payout_requests').findOne({
            _id: new ObjectId(payoutRequestId)
        });
        
        if (!payoutRequest) {
            return NextResponse.json(
                { error: 'Payout request not found' },
                { status: 404 }
            );
        }
        
        const now = new Date();
        
        if (action === 'reject') {
            // Reject payout
            await db.collection('payout_requests').updateOne(
                { _id: new ObjectId(payoutRequestId) },
                {
                    $set: {
                        status: 'rejected',
                        processedAt: now,
                        processedBy: admin._id.toString(),
                        notes: notes || 'Payout rejected',
                        updatedAt: now,
                    }
                }
            );
            
            // Mark earnings back to pending
            await db.collection('creator_earnings').updateMany(
                { payoutRequestId: payoutRequestId },
                {
                    $set: {
                        status: 'pending',
                        payoutRequestId: null,
                        updatedAt: now,
                    }
                }
            );
            
            // Log action
            await db.collection('admin_audit_logs').insertOne({
                adminId: admin._id,
                adminEmail: admin.email,
                action: 'reject_payout',
                targetId: payoutRequestId,
                details: {
                    creatorId: payoutRequest.creatorId,
                    amount: payoutRequest.amount,
                    notes,
                },
                timestamp: now,
                ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
                userAgent: request.headers.get('user-agent') || 'unknown',
            });
            
            return NextResponse.json({
                success: true,
                message: 'Payout request rejected',
            });
        }
        
        // For approve/process, execute payout via Razorpay
        if (action === 'approve' || action === 'process') {
            // Get creator info
            const creator = await db.collection('creators').findOne({
                _id: new ObjectId(payoutRequest.creatorId)
            });
            
            if (!creator) {
                return NextResponse.json(
                    { error: 'Creator not found' },
                    { status: 404 }
                );
            }
            
            const user = await db.collection('users').findOne({
                _id: new ObjectId(creator.userId)
            });
            
            // Execute payout via Razorpay
            const { executeCreatorPayout } = await import('@/lib/razorpay/payouts');
            const payoutResult = await executeCreatorPayout({
                creator: {
                    _id: new ObjectId(creator._id),
                    username: user?.username || '',
                    displayName: creator.displayName || user?.username || '',
                    email: user?.email || '',
                    phone: user?.phone || creator.phone || '',
                    payoutInfo: creator.payoutInfo || {},
                } as any,
                amount: payoutRequest.amount,
                referenceId: `payout_${payoutRequestId}`,
                notes: {
                    admin: admin.email,
                    notes: notes || '',
                },
                narration: `Payout to ${creator.displayName || user?.username || 'Creator'}`,
            });
            
            // Update payout request
            await db.collection('payout_requests').updateOne(
                { _id: new ObjectId(payoutRequestId) },
                {
                    $set: {
                        status: payoutResult.status === 'completed' ? 'completed' : 'processing',
                        razorpayPayoutId: payoutResult.payoutId || null,
                        processedAt: now,
                        processedBy: admin._id.toString(),
                        notes: notes || payoutResult.message || '',
                        mode: payoutResult.mode || null,
                        error: payoutResult.error || null,
                        updatedAt: now,
                    }
                }
            );
            
            // If completed, mark earnings as paid
            if (payoutResult.status === 'completed') {
                await db.collection('creator_earnings').updateMany(
                    { payoutRequestId: payoutRequestId },
                    {
                        $set: {
                            status: 'paid',
                            paidAt: now,
                            updatedAt: now,
                        }
                    }
                );
            }
            
            // Log action
            await db.collection('admin_audit_logs').insertOne({
                adminId: admin._id,
                adminEmail: admin.email,
                action: 'process_payout',
                targetId: payoutRequestId,
                details: {
                    creatorId: payoutRequest.creatorId,
                    amount: payoutRequest.amount,
                    razorpayPayoutId: payoutResult.payoutId,
                    status: payoutResult.status,
                    notes,
                },
                timestamp: now,
                ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
                userAgent: request.headers.get('user-agent') || 'unknown',
            });
            
            return NextResponse.json({
                success: true,
                message: payoutResult.message || 'Payout processed',
                payoutId: payoutResult.payoutId,
                status: payoutResult.status,
            });
        }
        
        return NextResponse.json(
            { error: 'Invalid action' },
            { status: 400 }
        );
    } catch (error: any) {
        console.error('Error processing payout:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to process payout' },
            { status: error.message?.includes('Permission') ? 403 : 500 }
        );
    }
}
