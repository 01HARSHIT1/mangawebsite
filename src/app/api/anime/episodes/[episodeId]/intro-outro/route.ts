import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

// GET: Get intro/outro timestamps for an episode
export async function GET(
    request: NextRequest,
    { params }: { params: { episodeId: string } }
) {
    try {
        const { episodeId } = params;
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId'); // Optional: for user-specific overrides

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Get episode data
        const episode = await db.collection('anime_episodes').findOne({
            _id: new ObjectId(episodeId),
        });

        if (!episode) {
            return NextResponse.json({ error: 'Episode not found' }, { status: 404 });
        }

        // Get creator-set timestamps (from episode)
        const creatorTimestamps = {
            introStartTime: episode.introStartTime || null,
            introEndTime: episode.introEndTime || null,
            outroStartTime: episode.outroStartTime || null,
            outroEndTime: episode.outroEndTime || null,
        };

        // If user is authenticated, check for user-specific overrides
        let userOverrides = null;
        if (userId) {
            const token = request.headers.get('authorization')?.replace('Bearer ', '');
            if (token) {
                try {
                    const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
                    const payload = jwt.verify(token, JWT_SECRET) as any;
                    const tokenUserId = payload.userId || payload._id;

                    if (tokenUserId === userId) {
                        const userTimestamp = await db.collection('anime_episode_timestamps').findOne({
                            userId: new ObjectId(userId),
                            episodeId: new ObjectId(episodeId),
                        });

                        if (userTimestamp) {
                            userOverrides = {
                                introStartTime: userTimestamp.introStartTime,
                                introEndTime: userTimestamp.introEndTime,
                                outroStartTime: userTimestamp.outroStartTime,
                                outroEndTime: userTimestamp.outroEndTime,
                            };
                        }
                    }
                } catch (error) {
                    // Invalid token, ignore user overrides
                }
            }
        }

        return NextResponse.json({
            timestamps: userOverrides || creatorTimestamps,
            source: userOverrides ? 'user' : 'creator',
            episodeId,
        });
    } catch (error) {
        console.error('Error fetching timestamps:', error);
        return NextResponse.json(
            { error: 'Failed to fetch timestamps' },
            { status: 500 }
        );
    }
}

// POST: Set intro/outro timestamps (for creators or users)
export async function POST(
    request: NextRequest,
    { params }: { params: { episodeId: string } }
) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
        const payload = jwt.verify(token, JWT_SECRET) as any;
        const userId = payload.userId || payload._id;
        const userRole = payload.role;

        if (!userId) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const { episodeId } = params;
        const body = await request.json();
        const { introStartTime, introEndTime, outroStartTime, outroEndTime, isUserOverride } = body;

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Verify episode exists
        const episode = await db.collection('anime_episodes').findOne({
            _id: new ObjectId(episodeId),
        });

        if (!episode) {
            return NextResponse.json({ error: 'Episode not found' }, { status: 404 });
        }

        // If creator/admin, update episode directly
        if ((userRole === 'creator' || userRole === 'admin') && !isUserOverride) {
            // Verify creator owns the episode
            if (userRole === 'creator' && episode.creatorId?.toString() !== userId) {
                return NextResponse.json(
                    { error: 'You do not have permission to modify this episode' },
                    { status: 403 }
                );
            }

            await db.collection('anime_episodes').updateOne(
                { _id: new ObjectId(episodeId) },
                {
                    $set: {
                        introStartTime: introStartTime || null,
                        introEndTime: introEndTime || null,
                        outroStartTime: outroStartTime || null,
                        outroEndTime: outroEndTime || null,
                        updatedAt: new Date(),
                    },
                }
            );

            return NextResponse.json({
                success: true,
                message: 'Episode timestamps updated successfully',
            });
        } else {
            // User override - store in separate collection
            const userTimestamp = await db.collection('anime_episode_timestamps').findOne({
                userId: new ObjectId(userId),
                episodeId: new ObjectId(episodeId),
            });

            const timestampData = {
                userId: new ObjectId(userId),
                episodeId: new ObjectId(episodeId),
                seriesId: episode.seriesId,
                introStartTime: introStartTime || null,
                introEndTime: introEndTime || null,
                outroStartTime: outroStartTime || null,
                outroEndTime: outroEndTime || null,
                updatedAt: new Date(),
            };

            if (userTimestamp) {
                await db.collection('anime_episode_timestamps').updateOne(
                    { _id: userTimestamp._id },
                    { $set: timestampData }
                );
            } else {
                timestampData.createdAt = new Date();
                await db.collection('anime_episode_timestamps').insertOne({
                    _id: new ObjectId(),
                    ...timestampData,
                });
            }

            return NextResponse.json({
                success: true,
                message: 'User timestamp preferences saved successfully',
            });
        }
    } catch (error) {
        console.error('Error saving timestamps:', error);
        return NextResponse.json(
            { error: 'Failed to save timestamps' },
            { status: 500 }
        );
    }
}

