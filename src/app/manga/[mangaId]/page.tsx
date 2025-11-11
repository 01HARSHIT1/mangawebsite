import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import Image from 'next/image';
import Link from 'next/link';
import MangaTabs from '@/components/MangaTabs';
import { FaGift } from 'react-icons/fa';
import MangaDetailClient from '@/components/MangaDetailClient';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function timeAgo(date: Date) {
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    const intervals = [
        { label: 'year', seconds: 31536000 },
        { label: 'month', seconds: 2592000 },
        { label: 'day', seconds: 86400 },
        { label: 'hour', seconds: 3600 },
        { label: 'minute', seconds: 60 },
        { label: 'second', seconds: 1 },
    ];
    for (const interval of intervals) {
        const count = Math.floor(seconds / interval.seconds);
        if (count > 1) return `${count} ${interval.label}s ago`;
        if (count === 1) return `1 ${interval.label} ago`;
    }
    return 'just now';
}

export default async function MangaDetailPage({ params }: { params: { mangaId: string } }) {
    try {
        const client = await clientPromise;
        const db = client.db();

        // Try to find manga by ObjectId first, then by string ID
        let mangaRaw = null;

        // Check if the ID is a valid ObjectId format
        if (ObjectId.isValid(params.mangaId)) {
            try {
                mangaRaw = await db.collection('manga').findOne({ _id: new ObjectId(params.mangaId) });
            } catch (error) {
                console.log('Database query failed:', error);
            }
        } else {
            // If not a valid ObjectId, try to find by string ID or use test data
            try {
                mangaRaw = await db.collection('manga').findOne({ _id: params.mangaId });
            } catch (error) {
                console.log('String ID query failed, using test manga fallback');
            }
        }

        if (!mangaRaw) {
            // If not found in MongoDB, check if it's a test manga from in-memory storage
            const testManga = {
                _id: params.mangaId,
                title: params.mangaId === '1' ? 'Test Manga 1' : params.mangaId === '2' ? 'Test Manga 2' : 'Unknown Manga',
                description: 'A test manga for development',
                genre: 'Action',
                coverImage: '/images/default-cover.jpg',
                status: 'Ongoing',
                createdAt: new Date().toISOString()
            };
            mangaRaw = testManga;
        }

        const manga = {
            ...mangaRaw,
            _id: mangaRaw._id.toString(),
            createdAt: mangaRaw.createdAt ? mangaRaw.createdAt.toString() : null,
            uploaderId: mangaRaw.uploaderId
                ? (typeof mangaRaw.uploaderId === 'string'
                    ? mangaRaw.uploaderId
                    : mangaRaw.uploaderId.toString())
                : null,
            creatorId: mangaRaw.creatorId
                ? (typeof mangaRaw.creatorId === 'string'
                    ? mangaRaw.creatorId
                    : mangaRaw.creatorId.toString())
                : null,
        } as any; // Type as any to handle dynamic properties

        // Fetch chapters for this manga
        let chapters: any[] = [];
        try {
            chapters = await db.collection('chapters').find({ mangaId: params.mangaId }).sort({ chapterNumber: -1 }).toArray();
        } catch (error) {
            // If chapters not found, use empty array
            chapters = [];
        }

        const chaptersPlain = chapters.map((ch: any) => ({
            ...ch,
            _id: ch._id.toString(),
            createdAt: ch.createdAt ? ch.createdAt.toString() : null,
        }));

        // Mock data for ratings, favorites, author, last update, etc.
        const ratings = 9.87;
        const favorites = 1600;
        const author = manga.author || 'Unknown';
        const lastUpdate = manga.createdAt ? new Date(manga.createdAt).toLocaleString() : 'Unknown';
        const status = manga.status || 'Ongoing';
        const type = manga.type || 'Manga';
        const genres = manga.genre ? manga.genre.split(',').map((g: string) => g.trim()) : [];
        const tags = manga.tags || [];

        // Pass all needed data as props to the client component
        return <MangaDetailClient manga={manga} chapters={chaptersPlain} ratings={ratings} favorites={favorites} author={author} lastUpdate={lastUpdate} status={status} type={type} genres={genres} tags={tags} />;
    } catch (error) {
        console.error('Error loading manga detail:', error);
        return <div style={{ color: '#fff', padding: 40 }}>Error loading manga. Please try again.</div>;
    }
} 