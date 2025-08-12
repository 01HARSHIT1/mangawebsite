import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

export async function GET(req: NextRequest) {
    const auth = req.headers.get('authorization');
    if (!auth || !auth.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Missing or invalid token' }, { status: 401 });
    }
    let payload;
    try {
        payload = jwt.verify(auth.replace('Bearer ', ''), JWT_SECRET);
    } catch {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    const client = await clientPromise;
    const db = client.db();
    const users = db.collection('users');
    const user = await users.findOne({ _id: new ObjectId(payload.userId) });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    // Don't return sensitive fields
    const { password, verificationToken, resetToken, ...safeUser } = user;
    // Convert ObjectId to string for consistency
    safeUser.id = safeUser._id.toString();
    delete safeUser._id;

    if (safeUser.avatarUrl) {
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        const filePath = path.join(uploadsDir, path.basename(safeUser.avatarUrl));
        if (!fs.existsSync(filePath)) {
            delete safeUser.avatarUrl;
        }
    }
    // Add readingHistory and bookmarks (default to [] if missing)
    safeUser.readingHistory = user.readingHistory || [];
    safeUser.bookmarks = user.bookmarks || [];
    safeUser.coins = typeof user.coins === 'number' ? user.coins : 0;

    console.log('Profile API GET: Returning user data:', {
        id: safeUser.id,
        nickname: safeUser.nickname,
        bio: safeUser.bio,
        avatarUrl: safeUser.avatarUrl,
        hasBio: !!safeUser.bio,
        hasAvatar: !!safeUser.avatarUrl,
        timestamp: new Date().toISOString()
    });

    return NextResponse.json({ user: safeUser });
}

export async function POST(req: NextRequest) {
    const auth = req.headers.get('authorization');
    if (!auth || !auth.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Missing or invalid token' }, { status: 401 });
    }
    let payload;
    try {
        payload = jwt.verify(auth.replace('Bearer ', ''), JWT_SECRET);
    } catch {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    const client = await clientPromise;
    const db = client.db();
    const users = db.collection('users');
    const user = await users.findOne({ _id: new ObjectId(payload.userId) });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Parse multipart form data
    const formData = await req.formData();
    const bio = formData.get('bio');
    let avatarUrl = user.avatarUrl;
    const avatar = formData.get('avatar');

    console.log('Profile API: Processing update for user:', user._id);
    console.log('Profile API: Bio from form:', bio);
    console.log('Profile API: Avatar file present:', !!avatar);

    if (avatar && typeof avatar === 'object' && 'arrayBuffer' in avatar) {
        const buffer = Buffer.from(await avatar.arrayBuffer());
        const filename = `avatar_${user._id}_${Date.now()}.webp`;
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        const uploadPath = path.join(uploadsDir, filename);

        // Ensure uploads directory exists
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        // Convert to webp
        await sharp(buffer).webp({ quality: 80 }).toFile(uploadPath);
        avatarUrl = `/uploads/${filename}`;
        console.log('Profile API: Avatar saved to:', avatarUrl);
    }

    const updateData = { bio: bio || '', avatarUrl };
    console.log('Profile API: Updating user with data:', updateData);

    await users.updateOne(
        { _id: user._id },
        { $set: updateData }
    );

    const updated = await users.findOne({ _id: user._id });
    const { password, verificationToken, resetToken, ...safeUser } = updated;
    // Convert ObjectId to string for consistency
    safeUser.id = safeUser._id.toString();
    delete safeUser._id;
    safeUser.coins = typeof updated.coins === 'number' ? updated.coins : 0;

    console.log('Profile API: Final user data being returned:', {
        id: safeUser.id,
        nickname: safeUser.nickname,
        bio: safeUser.bio,
        avatarUrl: safeUser.avatarUrl,
        hasBio: !!safeUser.bio,
        hasAvatar: !!safeUser.avatarUrl,
        timestamp: new Date().toISOString()
    });

    return NextResponse.json({ user: safeUser });
}

export async function PUT(req: NextRequest) {
    // Add or remove bookmarks, or record reading history
    const auth = req.headers.get('authorization');
    if (!auth || !auth.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Missing or invalid token' }, { status: 401 });
    }
    let payload;
    try {
        payload = jwt.verify(auth.replace('Bearer ', ''), JWT_SECRET);
    } catch {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    const client = await clientPromise;
    const db = client.db();
    const users = db.collection('users');
    const user = await users.findOne({ _id: new ObjectId(payload.userId) });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const { action, mangaId, chapterId } = await req.json();
    if (action === 'addBookmark' && mangaId && !chapterId) {
        // Add manga bookmark (legacy)
        await users.updateOne({ _id: user._id }, { $addToSet: { bookmarks: mangaId } });
    } else if (action === 'removeBookmark' && mangaId && !chapterId) {
        await users.updateOne({ _id: user._id }, { $pull: { bookmarks: mangaId } });
    } else if (action === 'addChapterBookmark' && mangaId && chapterId) {
        await users.updateOne({ _id: user._id }, { $addToSet: { bookmarks: { mangaId, chapterId } } });
    } else if (action === 'removeChapterBookmark' && mangaId && chapterId) {
        await users.updateOne({ _id: user._id }, { $pull: { bookmarks: { mangaId, chapterId } } });
    } else if (action === 'recordReading' && (mangaId || chapterId)) {
        const { source, campaign, cohort } = await req.json();
        const entry = chapterId ? { mangaId, chapterId, timestamp: new Date().toISOString(), source, campaign, cohort } : { mangaId, timestamp: new Date().toISOString(), source, campaign, cohort };
        await users.updateOne({ _id: user._id }, { $push: { readingHistory: { $each: [entry], $position: 0 } } });
        // Optionally limit history length
        await users.updateOne({ _id: user._id }, [{ $set: { readingHistory: { $slice: ["$readingHistory", 50] } } }]);
    } else if (action === 'completeReading' && (mangaId || chapterId)) {
        // Find the latest matching readingHistory entry and update it
        const filter = { _id: user._id, 'readingHistory.0': { $exists: true } };
        const match = chapterId ? { mangaId, chapterId } : { mangaId };
        // Find the index of the most recent matching entry
        const userDoc = await users.findOne({ _id: user._id });
        if (userDoc && Array.isArray(userDoc.readingHistory)) {
            const idx = userDoc.readingHistory.findIndex((entry: any) => {
                if (chapterId) return entry.mangaId === mangaId && entry.chapterId === chapterId;
                return entry.mangaId === mangaId && !entry.chapterId;
            });
            if (idx !== -1) {
                const path = `readingHistory.${idx}`;
                await users.updateOne(
                    { _id: user._id },
                    { $set: { [`${path}.completed`]: true, [`${path}.endTimestamp`]: new Date().toISOString() } }
                );
            }
        }
    } else {
        return NextResponse.json({ error: 'Invalid action or missing parameters' }, { status: 400 });
    }
    const updated = await users.findOne({ _id: user._id });
    const { password, verificationToken, resetToken, ...safeUser } = updated;
    safeUser.readingHistory = updated.readingHistory || [];
    safeUser.bookmarks = updated.bookmarks || [];
    safeUser.coins = typeof updated.coins === 'number' ? updated.coins : 0;
    return NextResponse.json({ user: safeUser });
} 