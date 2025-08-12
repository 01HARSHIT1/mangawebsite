import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const mangaId = searchParams.get('mangaId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100); // Cap at 100
    const skip = (page - 1) * limit;

    if (!mangaId) return NextResponse.json({ chapters: [], pagination: { page, limit, total: 0, totalPages: 0 } });

    const auth = req.headers.get('authorization');
    let role = 'viewer';
    if (auth && auth.startsWith('Bearer ')) {
        try {
            const payload = jwt.verify(auth.replace('Bearer ', ''), process.env.JWT_SECRET || 'changeme');
            role = payload.role || 'viewer';
        } catch { }
    }

    const client = await clientPromise;
    const db = client.db();

    let query: any = { mangaId };
    if (role !== 'creator' && role !== 'admin') {
        query = {
            ...query, $or: [
                { publishDate: { $exists: false } },
                { publishDate: { $lte: new Date().toISOString() } }
            ]
        };
    }

    // Get total count for pagination
    const total = await db.collection('chapters').countDocuments(query);

    // Get chapters with pagination and projection
    const chapters = await db.collection('chapters')
        .find(query)
        .project({
            title: 1,
            chapterNumber: 1,
            subtitle: 1,
            description: 1,
            coverPage: 1,
            pages: 1,
            publishDate: 1,
            createdAt: 1,
            likes: 1,
            views: 1,
            comments: 1,
            ratings: 1
        })
        .sort({ chapterNumber: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();

    const chaptersWithIds = chapters.map((ch: any) => {
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        if (ch.coverPage) {
            const filePath = path.join(uploadsDir, path.basename(ch.coverPage));
            if (!fs.existsSync(filePath)) {
                delete ch.coverPage;
            }
        }
        if (Array.isArray(ch.pages)) {
            ch.pages = ch.pages.filter((p: string) => {
                const filePath = path.join(uploadsDir, path.basename(p));
                return fs.existsSync(filePath);
            });
        }
        return {
            ...ch,
            _id: ch._id.toString(),
            createdAt: ch.createdAt ? ch.createdAt.toString() : null,
            publishDate: ch.publishDate ? ch.publishDate.toString() : null
        };
    });

    return NextResponse.json({
        chapters: chaptersWithIds,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNext: page * limit < total,
            hasPrev: page > 1
        }
    });
} 