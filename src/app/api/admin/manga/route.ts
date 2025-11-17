import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
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
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const status = searchParams.get('status') || '';
        const creatorId = searchParams.get('creatorId') || '';

        // Connect to database
        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Build query
        const query: any = {};
        if (status) query.status = status;
        if (creatorId && creatorId !== 'all') {
            // Try both ObjectId and string formats
            if (ObjectId.isValid(creatorId)) {
                query.$or = [
                    { uploaderId: new ObjectId(creatorId) },
                    { uploaderId: creatorId },
                    { creatorId: new ObjectId(creatorId) },
                    { creatorId: creatorId }
                ];
            } else {
                query.$or = [
                    { uploaderId: creatorId },
                    { creatorId: creatorId }
                ];
            }
        }

        // Fetch manga with creator info
        const manga = await db.collection('manga')
            .find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .toArray();

        // Get creator info and chapter count for each manga
        const mangaWithCreators = await Promise.all(
            manga.map(async (m) => {
                // Try to find creator - handle both ObjectId and string formats
                let creator = null;
                let creatorId = '';
                
                // Check if manga has uploaderId or creatorId
                const uploaderId = m.uploaderId || m.creatorId;
                
                if (uploaderId) {
                    // Try as ObjectId first
                    if (ObjectId.isValid(uploaderId)) {
                        try {
                            creator = await db.collection('users').findOne({ 
                                _id: new ObjectId(uploaderId) 
                            });
                            if (creator) {
                                creatorId = creator._id.toString();
                            } else {
                                // If not found as ObjectId, try as string
                                creator = await db.collection('users').findOne({ 
                                    _id: uploaderId.toString() 
                                });
                                if (creator) {
                                    creatorId = creator._id.toString();
                                } else {
                                    // Use uploaderId as fallback
                                    creatorId = uploaderId.toString();
                                }
                            }
                        } catch (error) {
                            // If ObjectId conversion fails, try as string
                            creator = await db.collection('users').findOne({ 
                                _id: uploaderId.toString() 
                            });
                            if (creator) {
                                creatorId = creator._id.toString();
                            } else {
                                // Use uploaderId as fallback
                                creatorId = uploaderId.toString();
                            }
                        }
                    } else {
                        // Try as string
                        creator = await db.collection('users').findOne({ 
                            _id: uploaderId.toString() 
                        });
                        if (creator) {
                            creatorId = creator._id.toString();
                        } else {
                            // Use uploaderId as fallback
                            creatorId = uploaderId.toString();
                        }
                    }
                }
                
                const chapterCount = await db.collection('chapters').countDocuments({ mangaId: m._id.toString() });
                
                return {
                    ...m,
                    _id: m._id.toString(),
                    creator: creator?.nickname || creator?.username || m.creator || 'Unknown',
                    creatorId: creatorId || m.uploaderId?.toString() || m.creatorId?.toString() || '',
                    chapters: chapterCount,
                    views: m.views || 0,
                    rating: m.rating || 0,
                    description: m.description || '',
                    genre: m.genre || '',
                    tags: m.tags || [],
                    status: m.status || 'ongoing'
                };
            })
        );

        const total = await db.collection('manga').countDocuments(query);

        return NextResponse.json({
            manga: mangaWithCreators,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Admin manga fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch manga' },
            { status: 500 }
        );
    }
}
