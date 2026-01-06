import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

// POST: Join a W2G room
export async function POST(
    request: NextRequest,
    { params }: { params: { roomId: string } }
) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
        const payload = jwt.verify(token, JWT_SECRET) as any;
        const userId = payload.userId || payload._id;
        const username = payload.username || payload.email?.split('@')[0] || 'User';

        if (!userId) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const { roomId } = params;
        const client = await clientPromise;
        const db = client.db('mangawebsite');

        const room = await db.collection('w2g_rooms').findOne({ roomId });

        if (!room) {
            return NextResponse.json({ error: 'Room not found' }, { status: 404 });
        }

        // Check if room expired
        if (new Date(room.expiresAt) < new Date()) {
            return NextResponse.json({ error: 'Room has expired' }, { status: 410 });
        }

        // Check if user is already a participant
        const existingParticipant = room.participants.find(
            (p: any) => p.userId.toString() === userId
        );

        if (existingParticipant) {
            return NextResponse.json({
                success: true,
                message: 'Already in room',
                roomState: {
                    playbackTime: room.playbackTime,
                    isPlaying: room.isPlaying,
                    currentAudioTrack: room.currentAudioTrack,
                    currentSubtitle: room.currentSubtitle,
                },
            });
        }

        // Add user to participants
        await db.collection('w2g_rooms').updateOne(
            { roomId },
            {
                $push: {
                    participants: {
                        userId: new ObjectId(userId),
                        username,
                        joinedAt: new Date(),
                        isHost: false,
                        isMuted: false,
                    },
                },
                $set: {
                    updatedAt: new Date(),
                },
            }
        );

        // Get updated room
        const updatedRoom = await db.collection('w2g_rooms').findOne({ roomId });

        return NextResponse.json({
            success: true,
            message: 'Joined room successfully',
            roomState: {
                playbackTime: updatedRoom.playbackTime,
                isPlaying: updatedRoom.isPlaying,
                currentAudioTrack: updatedRoom.currentAudioTrack,
                currentSubtitle: updatedRoom.currentSubtitle,
            },
        });
    } catch (error) {
        console.error('Error joining room:', error);
        return NextResponse.json(
            { error: 'Failed to join room' },
            { status: 500 }
        );
    }
}

// DELETE: Leave a room
export async function DELETE(
    request: NextRequest,
    { params }: { params: { roomId: string } }
) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
        const payload = jwt.verify(token, JWT_SECRET) as any;
        const userId = payload.userId || payload._id;

        if (!userId) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const { roomId } = params;
        const client = await clientPromise;
        const db = client.db('mangawebsite');

        const room = await db.collection('w2g_rooms').findOne({ roomId });

        if (!room) {
            return NextResponse.json({ error: 'Room not found' }, { status: 404 });
        }

        // If user is host, delete room or transfer host
        if (room.hostUserId.toString() === userId) {
            // If only one participant, delete room
            if (room.participants.length === 1) {
                await db.collection('w2g_rooms').deleteOne({ roomId });
            } else {
                // Transfer host to next participant
                const nextHost = room.participants.find(
                    (p: any) => p.userId.toString() !== userId
                );
                if (nextHost) {
                    await db.collection('w2g_rooms').updateOne(
                        { roomId },
                        {
                            $set: {
                                hostUserId: nextHost.userId,
                                hostUsername: nextHost.username,
                                'participants.$[elem].isHost': true,
                            },
                            $pull: {
                                participants: { userId: new ObjectId(userId) },
                            },
                        },
                        {
                            arrayFilters: [{ 'elem.userId': nextHost.userId }],
                        }
                    );
                }
            }
        } else {
            // Just remove participant
            await db.collection('w2g_rooms').updateOne(
                { roomId },
                {
                    $pull: {
                        participants: { userId: new ObjectId(userId) },
                    },
                    $set: {
                        updatedAt: new Date(),
                    },
                }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Left room successfully',
        });
    } catch (error) {
        console.error('Error leaving room:', error);
        return NextResponse.json(
            { error: 'Failed to leave room' },
            { status: 500 }
        );
    }
}

