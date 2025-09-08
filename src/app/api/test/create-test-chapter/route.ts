import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
    try {
        const client = await clientPromise;
        const db = client.db();

        // Get existing test manga
        const existingManga = await db.collection('manga').findOne({ title: 'Test Manga' });

        if (!existingManga) {
            return NextResponse.json({
                error: 'No test manga found. Use POST to create one.'
            }, { status: 404 });
        }

        // Get existing test chapter
        const existingChapter = await db.collection('chapters').findOne({
            mangaId: existingManga._id.toString(),
            chapterNumber: 1
        });

        if (!existingChapter) {
            return NextResponse.json({
                error: 'No test chapter found. Use POST to create one.'
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: 'Test data found',
            manga: existingManga,
            chapter: existingChapter,
            testUrl: `/manga/${existingManga._id}/chapter/${existingChapter._id}`
        });

    } catch (error) {
        console.error('Error fetching test data:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const client = await clientPromise;
        const db = client.db();

        // Create a test manga if it doesn't exist
        const testManga = {
            _id: new ObjectId(),
            title: 'Test Manga',
            description: 'A test manga for development purposes',
            genre: 'Action,Comedy',
            status: 'Ongoing',
            type: 'Manga',
            author: 'Test Author',
            coverImage: '/file.svg',
            views: 0,
            likes: [],
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // Check if test manga already exists
        let existingManga = await db.collection('manga').findOne({ title: 'Test Manga' });
        if (!existingManga) {
            await db.collection('manga').insertOne(testManga);
            existingManga = testManga;
        }

        // Create a test chapter with sample pages
        const testChapter = {
            _id: new ObjectId(),
            mangaId: existingManga._id.toString(),
            chapterNumber: 1,
            title: 'Chapter 1: The Beginning',
            subtitle: 'The Beginning',
            pages: [
                // Sample page URLs - you can replace these with actual image URLs
                'https://via.placeholder.com/800x1200/1f2937/ffffff?text=Page+1',
                'https://via.placeholder.com/800x1200/374151/ffffff?text=Page+2',
                'https://via.placeholder.com/800x1200/4b5563/ffffff?text=Page+3',
                'https://via.placeholder.com/800x1200/6b7280/ffffff?text=Page+4',
                'https://via.placeholder.com/800x1200/9ca3af/ffffff?text=Page+5'
            ],
            status: 'published',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // Check if test chapter already exists
        const existingChapter = await db.collection('chapters').findOne({
            mangaId: existingManga._id.toString(),
            chapterNumber: 1
        });

        if (!existingChapter) {
            await db.collection('chapters').insertOne(testChapter);
        }

        return NextResponse.json({
            success: true,
            message: 'Test chapter created successfully',
            manga: existingManga,
            chapter: existingChapter || testChapter
        });

    } catch (error) {
        console.error('Error creating test chapter:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
