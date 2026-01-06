import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

// POST: Create a new W2G room
export async function POST(request: NextRequest) {
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

        const body = await request.json();
        const { seriesId, episodeId, episodeNumber, isPublic = false, roomName } = body;

        if (!seriesId || !episodeId) {
            return NextResponse.json(
                { error: 'Series ID and Episode ID are required' },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Verify episode exists
        const episode = await db.collection('anime_episodes').findOne({
            _id: new ObjectId(episodeId),
        });

        if (!episode) {
            return NextResponse.json({ error: 'Episode not found' }, { status: 404 });
        }

        // Generate unique room ID
        const roomId = generateRoomId();

        // Create room document
        const roomData = {
            _id: new ObjectId(),
            roomId,
            seriesId: new ObjectId(seriesId),
            episodeId: new ObjectId(episodeId),
            episodeNumber: episodeNumber || 1,
            hostUserId: new ObjectId(userId),
            hostUsername: username,
            roomName: roomName || `${episode.title || `Episode ${episodeNumber}`} - Watch Together`,
            isPublic,
            playbackTime: 0,
            isPlaying: false,
            currentAudioTrack: null,
            currentSubtitle: null,
            participants: [
                {
                    userId: new ObjectId(userId),
                    username,
                    joinedAt: new Date(),
                    isHost: true,
                    isMuted: false,
                },
            ],
            chatMessages: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        };

        await db.collection('w2g_rooms').insertOne(roomData);

        return NextResponse.json({
            success: true,
            room: {
                roomId,
                joinLink: `/w2g/${roomId}`,
                hostUserId: userId,
                episodeId,
                seriesId,
                isPublic,
            },
        });
    } catch (error) {
        console.error('Error creating W2G room:', error);
        return NextResponse.json(
            { error: 'Failed to create room' },
            { status: 500 }
        );
    }
}

