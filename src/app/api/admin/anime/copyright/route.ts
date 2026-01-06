import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/anime/copyright
 * Get copyright claims and DMCA takedowns
 */
export async function GET(request: NextRequest) {
    try {
        const admin = await requireAdmin(request);
        const { searchParams } = new URL(request.url);
        
        const status = searchParams.get('status') || 'all'; // all, pending, processing, resolved, rejected
        const type = searchParams.get('type') || 'all'; // all, dmca, manual, auto
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '20', 10);
        const skip = (page - 1) * limit;

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Build query
        const query: any = {};
        if (status !== 'all') {
            query.status = status;
        }
        if (type !== 'all') {
            query.type = type;
        }

        // Get copyright claims
        const claims = await db.collection('anime_copyright_claims')
            .find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();

        // Enrich with episode/series info
        const enrichedClaims = await Promise.all(
            claims.map(async (claim: any) => {
                let episode = null;
                let series = null;

                if (claim.episodeId) {
                    episode = await db.collection('anime_episodes').findOne({
                        _id: new ObjectId(claim.episodeId)
                    });
                    if (episode) {
                        series = await db.collection('anime_series').findOne({
                            _id: episode.seriesId instanceof ObjectId ? episode.seriesId : new ObjectId(episode.seriesId)
                        });
                    }
                } else if (claim.seriesId) {
                    series = await db.collection('anime_series').findOne({
                        _id: new ObjectId(claim.seriesId)
                    });
                }

                // Get counter-claim if exists
                const counterClaim = claim.counterClaimId
                    ? await db.collection('anime_copyright_claims').findOne({
                          _id: new ObjectId(claim.counterClaimId)
                      })
                    : null;

                // Get strike history for creator
                const creatorId = episode?.creatorId || series?.creatorId;
                const strikes = creatorId
                    ? await db.collection('anime_copyright_strikes').countDocuments({
                          creatorId: creatorId.toString(),
                          status: 'active'
                      })
                    : 0;

                return {
                    _id: claim._id.toString(),
                    type: claim.type, // 'dmca', 'manual', 'auto'
                    status: claim.status, // 'pending', 'processing', 'resolved', 'rejected', 'counter_claimed'
                    // Claimant info
                    claimantName: claim.claimantName,
                    claimantEmail: claim.claimantEmail,
                    claimantType: claim.claimantType, // 'studio', 'individual', 'organization'
                    // Content info
                    episodeId: claim.episodeId,
                    seriesId: claim.seriesId,
                    episode: episode ? {
                        _id: episode._id.toString(),
                        title: episode.title,
                        episodeNumber: episode.episodeNumber,
                    } : null,
                    series: series ? {
                        _id: series._id.toString(),
                        title: series.title,
                        coverImage: series.coverImage,
                    } : null,
                    // Claim details
                    reason: claim.reason,
                    description: claim.description,
                    timestamp: claim.timestamp, // Specific timestamp in video
                    evidence: claim.evidence || [], // Array of evidence URLs
                    legalDocument: claim.legalDocument, // DMCA document URL
                    // Processing
                    assignedTo: claim.assignedTo,
                    reviewedBy: claim.reviewedBy,
                    reviewedAt: claim.reviewedAt,
                    reviewNotes: claim.reviewNotes,
                    // Counter-claim
                    counterClaimId: claim.counterClaimId,
                    counterClaim: counterClaim ? {
                        _id: counterClaim._id.toString(),
                        status: counterClaim.status,
                        submittedAt: counterClaim.createdAt,
                    } : null,
                    // Region blocking
                    regionBlocked: claim.regionBlocked || [],
                    // Strike info
                    strikeIssued: claim.strikeIssued || false,
                    strikeId: claim.strikeId,
                    creatorStrikes: strikes,
                    // Metadata
                    createdAt: claim.createdAt,
                    updatedAt: claim.updatedAt,
                };
            })
        );

        // Get total count
        const total = await db.collection('anime_copyright_claims').countDocuments(query);

        // Get statistics
        const stats = {
            total: await db.collection('anime_copyright_claims').countDocuments({}),
            pending: await db.collection('anime_copyright_claims').countDocuments({ status: 'pending' }),
            processing: await db.collection('anime_copyright_claims').countDocuments({ status: 'processing' }),
            resolved: await db.collection('anime_copyright_claims').countDocuments({ status: 'resolved' }),
            counterClaimed: await db.collection('anime_copyright_claims').countDocuments({ status: 'counter_claimed' }),
        };

        return NextResponse.json({
            claims: enrichedClaims,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
            stats,
        });
    } catch (error: any) {
        console.error('Error fetching copyright claims:', error);
        return NextResponse.json(
            { error: 'Failed to fetch copyright claims', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/anime/copyright
 * Process copyright claim (approve, reject, issue strike, block region)
 */
export async function POST(request: NextRequest) {
    try {
        const admin = await requireAdmin(request);
        const body = await request.json();

        const { 
            claimId, 
            action, // 'approve', 'reject', 'issue_strike', 'block_region', 'assign', 'add_evidence'
            updates 
        } = body;

        if (!claimId || !action) {
            return NextResponse.json(
                { error: 'claimId and action are required' },
                { status: 400 }
            );
        }

        const validActions = ['approve', 'reject', 'issue_strike', 'block_region', 'assign', 'add_evidence', 'process_dmca'];
        if (!validActions.includes(action)) {
            return NextResponse.json(
                { error: `Invalid action. Must be one of: ${validActions.join(', ')}` },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Get claim
        const claim = await db.collection('anime_copyright_claims').findOne({
            _id: new ObjectId(claimId)
        });

        if (!claim) {
            return NextResponse.json(
                { error: 'Copyright claim not found' },
                { status: 404 }
            );
        }

        const now = new Date();
        const updateData: any = {
            updatedAt: now,
        };

        switch (action) {
            case 'approve':
                updateData.status = 'resolved';
                updateData.reviewedBy = admin._id.toString();
                updateData.reviewedAt = now;
                updateData.reviewNotes = updates?.notes || 'Claim approved';

                // If strike should be issued
                if (updates?.issueStrike) {
                    const episode = claim.episodeId
                        ? await db.collection('anime_episodes').findOne({
                              _id: new ObjectId(claim.episodeId)
                          })
                        : null;
                    const series = claim.seriesId
                        ? await db.collection('anime_series').findOne({
                              _id: new ObjectId(claim.seriesId)
                          })
                        : null;

                    const creatorId = episode?.creatorId || series?.creatorId;
                    if (creatorId) {
                        const strikeResult = await db.collection('anime_copyright_strikes').insertOne({
                            creatorId: creatorId.toString(),
                            claimId: claimId,
                            type: 'copyright',
                            severity: updates?.strikeSeverity || 'warning',
                            reason: updates?.strikeReason || claim.reason,
                            status: 'active',
                            issuedBy: admin._id.toString(),
                            issuedAt: now,
                            expiresAt: updates?.strikeExpiresAt || null,
                        });

                        updateData.strikeIssued = true;
                        updateData.strikeId = strikeResult.insertedId.toString();
                    }
                }

                // If region blocking
                if (updates?.blockRegions && Array.isArray(updates.blockRegions)) {
                    updateData.regionBlocked = updates.blockRegions;
                    
                    // Update episode/series with region block
                    if (claim.episodeId) {
                        await db.collection('anime_episodes').updateOne(
                            { _id: new ObjectId(claim.episodeId) },
                            { 
                                $set: { 
                                    'geoRestrictions.blocked': updates.blockRegions,
                                    updatedAt: now
                                } 
                            }
                        );
                    } else if (claim.seriesId) {
                        await db.collection('anime_series').updateOne(
                            { _id: new ObjectId(claim.seriesId) },
                            { 
                                $set: { 
                                    'geoRestrictions.blocked': updates.blockRegions,
                                    updatedAt: now
                                } 
                            }
                        );
                    }
                }

                // If content should be taken down
                if (updates?.takeDown) {
                    if (claim.episodeId) {
                        await db.collection('anime_episodes').updateOne(
                            { _id: new ObjectId(claim.episodeId) },
                            { 
                                $set: { 
                                    isPublished: false,
                                    takedownReason: 'Copyright claim',
                                    takedownAt: now,
                                    updatedAt: now
                                } 
                            }
                        );
                    } else if (claim.seriesId) {
                        await db.collection('anime_series').updateOne(
                            { _id: new ObjectId(claim.seriesId) },
                            { 
                                $set: { 
                                    status: 'cancelled',
                                    takedownReason: 'Copyright claim',
                                    takedownAt: now,
                                    updatedAt: now
                                } 
                            }
                        );
                    }
                }
                break;

            case 'reject':
                updateData.status = 'rejected';
                updateData.reviewedBy = admin._id.toString();
                updateData.reviewedAt = now;
                updateData.reviewNotes = updates?.notes || 'Claim rejected';
                break;

            case 'issue_strike':
                const episode = claim.episodeId
                    ? await db.collection('anime_episodes').findOne({
                          _id: new ObjectId(claim.episodeId)
                      })
                    : null;
                const series = claim.seriesId
                    ? await db.collection('anime_series').findOne({
                          _id: new ObjectId(claim.seriesId)
                      })
                    : null;

                const creatorId = episode?.creatorId || series?.creatorId;
                if (!creatorId) {
                    return NextResponse.json(
                        { error: 'Creator not found for this claim' },
                        { status: 404 }
                    );
                }

                const strikeResult = await db.collection('anime_copyright_strikes').insertOne({
                    creatorId: creatorId.toString(),
                    claimId: claimId,
                    type: 'copyright',
                    severity: updates?.severity || 'warning',
                    reason: updates?.reason || claim.reason,
                    status: 'active',
                    issuedBy: admin._id.toString(),
                    issuedAt: now,
                    expiresAt: updates?.expiresAt || null,
                });

                updateData.strikeIssued = true;
                updateData.strikeId = strikeResult.insertedId.toString();
                break;

            case 'block_region':
                if (!updates?.regions || !Array.isArray(updates.regions)) {
                    return NextResponse.json(
                        { error: 'regions array is required' },
                        { status: 400 }
                    );
                }

                updateData.regionBlocked = updates.regions;

                // Update episode/series
                if (claim.episodeId) {
                    await db.collection('anime_episodes').updateOne(
                        { _id: new ObjectId(claim.episodeId) },
                        { 
                            $set: { 
                                'geoRestrictions.blocked': updates.regions,
                                updatedAt: now
                            } 
                        }
                    );
                } else if (claim.seriesId) {
                    await db.collection('anime_series').updateOne(
                        { _id: new ObjectId(claim.seriesId) },
                        { 
                            $set: { 
                                'geoRestrictions.blocked': updates.regions,
                                updatedAt: now
                            } 
                        }
                    );
                }
                break;

            case 'assign':
                updateData.assignedTo = updates?.assignedTo || admin._id.toString();
                updateData.status = 'processing';
                break;

            case 'add_evidence':
                if (!updates?.evidence || !Array.isArray(updates.evidence)) {
                    return NextResponse.json(
                        { error: 'evidence array is required' },
                        { status: 400 }
                    );
                }

                const currentEvidence = claim.evidence || [];
                updateData.evidence = [...currentEvidence, ...updates.evidence];
                break;

            case 'process_dmca':
                updateData.status = 'processing';
                updateData.reviewedBy = admin._id.toString();
                updateData.reviewedAt = now;
                updateData.reviewNotes = updates?.notes || 'DMCA claim being processed';
                break;
        }

        // Update claim
        await db.collection('anime_copyright_claims').updateOne(
            { _id: new ObjectId(claimId) },
            { $set: updateData }
        );

        // Log admin action (audit trail)
        await db.collection('admin_audit_logs').insertOne({
            adminId: admin._id.toString(),
            adminEmail: admin.email,
            action: `copyright_${action}`,
            targetType: 'copyright_claim',
            targetId: claimId,
            details: {
                claimType: claim.type,
                claimStatus: updateData.status || claim.status,
                updates: updates || {},
            },
            timestamp: now,
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown',
        });

        return NextResponse.json({
            success: true,
            message: `Copyright claim ${action} successful`,
            claimId,
            status: updateData.status || claim.status,
        });
    } catch (error: any) {
        console.error('Error processing copyright claim:', error);
        return NextResponse.json(
            { error: 'Failed to process copyright claim', details: error.message },
            { status: 500 }
        );
    }
}

