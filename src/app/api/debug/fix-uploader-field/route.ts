import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

/**
 * Migration script to fix manga documents that have createdBy instead of uploaderId
 * This fixes the issue where old manga won't show in the creator's dropdown
 */
export async function POST(request: NextRequest) {
    try {
        const client = await clientPromise;
        const db = client.db();

        // Find all manga with createdBy but no uploaderId
        const mangaToFix = await db.collection('manga')
            .find({
                createdBy: { $exists: true },
                uploaderId: { $exists: false }
            })
            .toArray();

        console.log(`Found ${mangaToFix.length} manga to fix`);

        const results = [];
        for (const manga of mangaToFix) {
            const uploaderId = manga.createdBy instanceof ObjectId 
                ? manga.createdBy.toString() 
                : String(manga.createdBy);

            await db.collection('manga').updateOne(
                { _id: manga._id },
                {
                    $set: { uploaderId },
                    $unset: { createdBy: '' }
                }
            );

            results.push({
                mangaId: manga._id.toString(),
                title: manga.title,
                oldField: 'createdBy',
                newUploaderId: uploaderId
            });

            console.log(`✅ Fixed manga: ${manga.title} (uploaderId: ${uploaderId})`);
        }

        return NextResponse.json({
            success: true,
            message: `Fixed ${results.length} manga documents`,
            fixed: results
        });

    } catch (error) {
        console.error('❌ Error fixing uploader fields:', error);
        return NextResponse.json({
            error: 'Failed to fix uploader fields',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

