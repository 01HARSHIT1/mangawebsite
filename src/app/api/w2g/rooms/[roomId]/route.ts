import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

// GET: Get room details and current state
export async function GET(
    request: NextRequest,
    { params }: { params: { roomId: string } }
) {
    try {
        const { roomId } = params;
        const token = request.headers.get('authorization')?.replace('Bearer ', '');

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

        // Get episode details
        const episode = await db.collection('anime_episodes').findOne({
            _id: room.episodeId,
        });

        const series = await db.collection('anime_series').findOne({
            _id: room.seriesId,
        });

        // Check if user is authenticated
        let userId = null;
        let isParticipant = false;
        if (token) {
            try {
                const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
                const payload = jwt.verify(token, JWT_SECRET) as any;
                userId = payload.userId || payload._id;
                
                isParticipant = room.participants.some(
                    (p: any) => p.userId.toString() === userId
                );
            } catch (error) {
                // Invalid token, continue as guest
            }
        }

        return NextResponse.json({
            room: {
                roomId: room.roomId,
                roomName: room.roomName,
                hostUserId: room.hostUserId.toString(),
                hostUsername: room.hostUsername,
                isPublic: room.isPublic,
                playbackTime: room.playbackTime,
                isPlaying: room.isPlaying,
                currentAudioTrack: room.currentAudioTrack,
                currentSubtitle: room.currentSubtitle,
                participantCount: room.participants.length,
                episode: episode
                    ? {
                          _id: episode._id.toString(),
                          title: episode.title,
                          episodeNumber: episode.episodeNumber,
                          thumbnail: episode.thumbnail,
                      }
                    : null,
                series: series
                    ? {
                          _id: series._id.toString(),
                          title: series.title,
                          coverImage: series.coverImage,
                      }
                    : null,
                isParticipant,
                isHost: userId && room.hostUserId.toString() === userId,
            },
        });
    } catch (error) {
        console.error('Error fetching room:', error);
        return NextResponse.json(
            { error: 'Failed to fetch room' },
            { status: 500 }
        );
    }
}

// DELETE: End/delete a room (host only)
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

        // Verify user is host
        if (room.hostUserId.toString() !== userId) {
            return NextResponse.json(
                { error: 'Only the host can delete the room' },
                { status: 403 }
            );
        }

        await db.collection('w2g_rooms').deleteOne({ roomId });

        return NextResponse.json({
            success: true,
            message: 'Room deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting room:', error);
        return NextResponse.json(
            { error: 'Failed to delete room' },
            { status: 500 }
        );
    }
}

