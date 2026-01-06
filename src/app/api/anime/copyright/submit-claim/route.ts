import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

/**
 * POST /api/anime/copyright/submit-claim
 * Submit a copyright claim (DMCA or manual)
 * Can be called by studios, creators, or admins
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const {
            type, // 'dmca' | 'manual'
            episodeId,
            seriesId,
            claimantName,
            claimantEmail,
            claimantType, // 'studio' | 'individual' | 'organization'
            reason,
            description,
            timestamp, // Specific timestamp in video (optional)
            evidence, // Array of evidence URLs
            legalDocument, // DMCA document URL (for DMCA claims)
            regionBlock, // Array of ISO country codes to block (optional)
        } = body;

        // Validation
        if (!type || (type !== 'dmca' && type !== 'manual')) {
            return NextResponse.json(
                { error: 'type must be "dmca" or "manual"' },
                { status: 400 }
            );
        }

        if (!episodeId && !seriesId) {
            return NextResponse.json(
                { error: 'episodeId or seriesId is required' },
                { status: 400 }
            );
        }

        if (!claimantName || !claimantEmail) {
            return NextResponse.json(
                { error: 'claimantName and claimantEmail are required' },
                { status: 400 }
            );
        }

        if (!reason || !description) {
            return NextResponse.json(
                { error: 'reason and description are required' },
                { status: 400 }
            );
        }

        if (type === 'dmca' && !legalDocument) {
            return NextResponse.json(
                { error: 'legalDocument is required for DMCA claims' },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Verify episode/series exists
        if (episodeId) {
            const episode = await db.collection('anime_episodes').findOne({
                _id: new ObjectId(episodeId)
            });
            if (!episode) {
                return NextResponse.json(
                    { error: 'Episode not found' },
                    { status: 404 }
                );
            }
        } else if (seriesId) {
            const series = await db.collection('anime_series').findOne({
                _id: new ObjectId(seriesId)
            });
            if (!series) {
                return NextResponse.json(
                    { error: 'Series not found' },
                    { status: 404 }
                );
            }
        }

        const now = new Date();

        // Create copyright claim
        const claimDoc = {
            type,
            status: 'pending',
            episodeId: episodeId || null,
            seriesId: seriesId || null,
            claimantName,
            claimantEmail,
            claimantType: claimantType || 'individual',
            reason,
            description,
            timestamp: timestamp || null,
            evidence: evidence || [],
            legalDocument: legalDocument || null,
            regionBlocked: regionBlock || [],
            assignedTo: null,
            reviewedBy: null,
            reviewedAt: null,
            reviewNotes: null,
            counterClaimId: null,
            strikeIssued: false,
            strikeId: null,
            createdAt: now,
            updatedAt: now,
        };

        const result = await db.collection('anime_copyright_claims').insertOne(claimDoc);

        // Notify admins (optional - can be done via notification system)
        // For now, just log it

        return NextResponse.json({
            success: true,
            message: 'Copyright claim submitted successfully',
            claimId: result.insertedId.toString(),
            status: 'pending',
        });
    } catch (error: any) {
        console.error('Error submitting copyright claim:', error);
        return NextResponse.json(
            { error: 'Failed to submit copyright claim', details: error.message },
            { status: 500 }
        );
    }
}

