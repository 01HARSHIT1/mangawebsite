import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

// POST: Host actions (kick, mute, transfer host)
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

        if (!userId) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const { roomId } = params;
        const body = await request.json();
        const { action, targetUserId, reason } = body;

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        const room = await db.collection('w2g_rooms').findOne({ roomId });

        if (!room) {
            return NextResponse.json({ error: 'Room not found' }, { status: 404 });
        }

        // Verify user is host
        if (room.hostUserId.toString() !== userId) {
            return NextResponse.json(
                { error: 'Only the host can perform this action' },
                { status: 403 }
            );
        }

        switch (action) {
            case 'kick':
                // Remove participant from room
                await db.collection('w2g_rooms').updateOne(
                    { roomId },
                    {
                        $pull: {
                            participants: { userId: new ObjectId(targetUserId) },
                        },
                        $set: { updatedAt: new Date() },
                    }
                );
                return NextResponse.json({
                    success: true,
                    message: 'User kicked from room',
                });

            case 'mute':
                // Mute/unmute participant
                await db.collection('w2g_rooms').updateOne(
                    {
                        roomId,
                        'participants.userId': new ObjectId(targetUserId),
                    },
                    {
                        $set: {
                            'participants.$.isMuted': true,
                            updatedAt: new Date(),
                        },
                    }
                );
                return NextResponse.json({
                    success: true,
                    message: 'User muted',
                });

            case 'unmute':
                await db.collection('w2g_rooms').updateOne(
                    {
                        roomId,
                        'participants.userId': new ObjectId(targetUserId),
                    },
                    {
                        $set: {
                            'participants.$.isMuted': false,
                            updatedAt: new Date(),
                        },
                    }
                );
                return NextResponse.json({
                    success: true,
                    message: 'User unmuted',
                });

            case 'transfer_host':
                // Transfer host to another participant
                const targetParticipant = room.participants.find(
                    (p: any) => p.userId.toString() === targetUserId
                );

                if (!targetParticipant) {
                    return NextResponse.json(
                        { error: 'Target user not found in room' },
                        { status: 404 }
                    );
                }

                await db.collection('w2g_rooms').updateOne(
                    { roomId },
                    {
                        $set: {
                            hostUserId: new ObjectId(targetUserId),
                            hostUsername: targetParticipant.username,
                            'participants.$[oldHost].isHost': false,
                            'participants.$[newHost].isHost': true,
                            updatedAt: new Date(),
                        },
                    },
                    {
                        arrayFilters: [
                            { 'oldHost.userId': new ObjectId(userId) },
                            { 'newHost.userId': new ObjectId(targetUserId) },
                        ],
                    }
                );

                return NextResponse.json({
                    success: true,
                    message: 'Host transferred successfully',
                });

            default:
                return NextResponse.json(
                    { error: 'Invalid action' },
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error('Error performing host action:', error);
        return NextResponse.json(
            { error: 'Failed to perform action' },
            { status: 500 }
        );
    }
}

