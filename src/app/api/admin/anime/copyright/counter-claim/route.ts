import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/anime/copyright/counter-claim
 * Process counter-claim (approve or reject)
 */
export async function POST(request: NextRequest) {
    try {
        const admin = await requireAdmin(request);
        const body = await request.json();

        const { 
            counterClaimId, 
            action, // 'approve', 'reject'
            notes 
        } = body;

        if (!counterClaimId || !action) {
            return NextResponse.json(
                { error: 'counterClaimId and action are required' },
                { status: 400 }
            );
        }

        if (action !== 'approve' && action !== 'reject') {
            return NextResponse.json(
                { error: 'action must be "approve" or "reject"' },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Get counter-claim
        const counterClaim = await db.collection('anime_copyright_claims').findOne({
            _id: new ObjectId(counterClaimId),
            type: 'counter_claim'
        });

        if (!counterClaim) {
            return NextResponse.json(
                { error: 'Counter-claim not found' },
                { status: 404 }
            );
        }

        // Get original claim
        const originalClaim = await db.collection('anime_copyright_claims').findOne({
            _id: new ObjectId(counterClaim.originalClaimId)
        });

        if (!originalClaim) {
            return NextResponse.json(
                { error: 'Original claim not found' },
                { status: 404 }
            );
        }

        const now = new Date();

        if (action === 'approve') {
            // Approve counter-claim - reject original claim
            await db.collection('anime_copyright_claims').updateOne(
                { _id: new ObjectId(counterClaimId) },
                { 
                    $set: { 
                        status: 'resolved',
                        reviewedBy: admin._id.toString(),
                        reviewedAt: now,
                        reviewNotes: notes || 'Counter-claim approved',
                        updatedAt: now
                    } 
                }
            );

            await db.collection('anime_copyright_claims').updateOne(
                { _id: new ObjectId(counterClaim.originalClaimId) },
                { 
                    $set: { 
                        status: 'rejected',
                        reviewNotes: 'Rejected due to approved counter-claim',
                        updatedAt: now
                    } 
                }
            );

            // Restore content if it was taken down
            if (originalClaim.episodeId) {
                await db.collection('anime_episodes').updateOne(
                    { _id: new ObjectId(originalClaim.episodeId) },
                    { 
                        $set: { 
                            isPublished: true,
                            takedownReason: null,
                            takedownAt: null,
                            updatedAt: now
                        } 
                    }
                );
            } else if (originalClaim.seriesId) {
                await db.collection('anime_series').updateOne(
                    { _id: new ObjectId(originalClaim.seriesId) },
                    { 
                        $set: { 
                            status: originalClaim.seriesStatus || 'ongoing',
                            takedownReason: null,
                            takedownAt: null,
                            updatedAt: now
                        } 
                    }
                );
            }

            // Remove region blocks if any
            if (originalClaim.regionBlocked && originalClaim.regionBlocked.length > 0) {
                if (originalClaim.episodeId) {
                    await db.collection('anime_episodes').updateOne(
                        { _id: new ObjectId(originalClaim.episodeId) },
                        { 
                            $set: { 
                                'geoRestrictions.blocked': [],
                                updatedAt: now
                            } 
                        }
                    );
                } else if (originalClaim.seriesId) {
                    await db.collection('anime_series').updateOne(
                        { _id: new ObjectId(originalClaim.seriesId) },
                        { 
                            $set: { 
                                'geoRestrictions.blocked': [],
                                updatedAt: now
                            } 
                        }
                    );
                }
            }

        } else {
            // Reject counter-claim - original claim stands
            await db.collection('anime_copyright_claims').updateOne(
                { _id: new ObjectId(counterClaimId) },
                { 
                    $set: { 
                        status: 'rejected',
                        reviewedBy: admin._id.toString(),
                        reviewedAt: now,
                        reviewNotes: notes || 'Counter-claim rejected',
                        updatedAt: now
                    } 
                }
            );
        }

        // Log admin action
        await db.collection('admin_audit_logs').insertOne({
            adminId: admin._id.toString(),
            adminEmail: admin.email,
            action: `counter_claim_${action}`,
            targetType: 'copyright_claim',
            targetId: counterClaimId,
            details: {
                originalClaimId: counterClaim.originalClaimId,
                notes: notes || null,
            },
            timestamp: now,
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown',
        });

        return NextResponse.json({
            success: true,
            message: `Counter-claim ${action} successful`,
            counterClaimId,
        });
    } catch (error: any) {
        console.error('Error processing counter-claim:', error);
        return NextResponse.json(
            { error: 'Failed to process counter-claim', details: error.message },
            { status: 500 }
        );
    }
}

