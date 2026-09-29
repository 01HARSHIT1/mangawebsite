import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import Link from 'next/link';
import MangaDetailClient from '@/components/MangaDetailClient';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** Convert Mongo/BSON values into plain JSON-safe props for Client Components */
function toPlain<T>(value: T): T {
    return JSON.parse(
        JSON.stringify(value, (_key, v) => {
            if (v == null) return v;
            if (typeof v === 'object' && v._bsontype === 'ObjectID') return String(v);
            if (typeof v === 'object' && typeof v.toHexString === 'function') return v.toHexString();
            if (v instanceof Date) return v.toISOString();
            if (typeof v === 'object' && typeof v.toJSON === 'function') {
                try {
                    return v.toJSON();
                } catch {
                    return String(v);
                }
            }
            return v;
        })
    );
}

function normalizeGenres(manga: any): string[] {
    if (Array.isArray(manga?.genres)) {
        return manga.genres.map(String).filter(Boolean);
    }
    if (Array.isArray(manga?.genre)) {
        return manga.genre.map(String).filter(Boolean);
    }
    if (typeof manga?.genre === 'string' && manga.genre.trim()) {
        return manga.genre.split(',').map((g: string) => g.trim()).filter(Boolean);
    }
    return [];
}

function coverUrl(cover: any): string {
    if (!cover) return '/placeholder.svg';
    if (typeof cover === 'string') return cover;
    if (typeof cover === 'object' && cover.secure_url) return String(cover.secure_url);
    if (typeof cover === 'object' && cover.url) return String(cover.url);
    return '/placeholder.svg';
}

export default async function MangaDetailPage({ params }: { params: { mangaId: string } }) {
    const mangaId = params?.mangaId;

    try {
        if (!mangaId) {
            return <MangaNotFound mangaId="unknown" />;
        }

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        let mangaRaw: any = null;
        if (ObjectId.isValid(mangaId)) {
            mangaRaw = await db.collection('manga').findOne({ _id: new ObjectId(mangaId) });
        }
        if (!mangaRaw) {
            // Fallback: some older docs may store string ids
            mangaRaw = await db.collection('manga').findOne({ _id: mangaId as any });
        }

        if (!mangaRaw) {
            return <MangaNotFound mangaId={mangaId} />;
        }

        const chapters = await db
            .collection('chapters')
            .find({ mangaId })
            .sort({ chapterNumber: -1 })
            .toArray()
            .catch(() => [] as any[]);

        const manga = toPlain({
            _id: mangaRaw._id?.toString?.() ?? String(mangaRaw._id),
            title: mangaRaw.title || 'Untitled',
            creator: mangaRaw.creator || mangaRaw.author || 'Unknown',
            author: mangaRaw.author || mangaRaw.creator || 'Unknown',
            description: mangaRaw.description || '',
            coverImage: coverUrl(mangaRaw.coverImage),
            status: mangaRaw.status || 'ongoing',
            type: mangaRaw.type || 'Manga',
            genres: normalizeGenres(mangaRaw),
            tags: Array.isArray(mangaRaw.tags) ? mangaRaw.tags.map(String) : [],
            views: Number(mangaRaw.views) || 0,
            likes: Number(mangaRaw.likes) || 0,
            createdAt: mangaRaw.createdAt
                ? new Date(mangaRaw.createdAt).toISOString()
                : null,
            updatedAt: mangaRaw.updatedAt
                ? new Date(mangaRaw.updatedAt).toISOString()
                : null,
            uploaderId: mangaRaw.uploaderId != null ? String(mangaRaw.uploaderId) : null,
            creatorId: mangaRaw.creatorId != null ? String(mangaRaw.creatorId) : null,
        });

        const chaptersPlain = toPlain(
            chapters.map((ch: any) => ({
                _id: ch._id?.toString?.() ?? String(ch._id),
                mangaId: ch.mangaId != null ? String(ch.mangaId) : mangaId,
                title: ch.title || '',
                subtitle: ch.subtitle || '',
                chapterNumber: Number(ch.chapterNumber) || 0,
                pages: Array.isArray(ch.pages) ? ch.pages : [],
                pdfUrl: typeof ch.pdfUrl === 'string' ? ch.pdfUrl : null,
                createdAt: ch.createdAt ? new Date(ch.createdAt).toISOString() : null,
                publishDate: ch.publishDate ? new Date(ch.publishDate).toISOString() : null,
            }))
        );

        const ratings = 9.87;
        const favorites = 1600;
        const author = manga.author || manga.creator || 'Unknown';
        const lastUpdate = manga.createdAt
            ? new Date(manga.createdAt).toLocaleString()
            : 'Unknown';
        const status = manga.status || 'Ongoing';
        const type = manga.type || 'Manga';
        const genres = manga.genres || [];
        const tags = manga.tags || [];

        return (
            <MangaDetailClient
                manga={manga}
                chapters={chaptersPlain}
                ratings={ratings}
                favorites={favorites}
                author={author}
                lastUpdate={lastUpdate}
                status={status}
                type={type}
                genres={genres}
                tags={tags}
            />
        );
    } catch (error: any) {
        console.error('Error loading manga detail:', {
            mangaId,
            message: error?.message,
            name: error?.name,
        });

        return (
            <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
                <div className="text-center max-w-2xl px-4">
                    <h1 className="text-3xl font-bold mb-4 text-red-400">Error Loading Manga</h1>
                    <p className="text-gray-300 mb-2">We couldn&apos;t load the manga you requested.</p>
                    <p className="text-gray-400 text-sm mb-6">Manga ID: {mangaId}</p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link
                            href="/manga"
                            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                        >
                            Browse All Manga
                        </Link>
                        <Link
                            href={`/manga/${mangaId}`}
                            className="inline-block bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                        >
                            Try Again
                        </Link>
                    </div>
                </div>
            </div>
        );
    }
}

function MangaNotFound({ mangaId }: { mangaId: string }) {
    return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
            <div className="text-center max-w-2xl px-4">
                <h1 className="text-3xl font-bold mb-4 text-red-400">Manga Not Found</h1>
                <p className="text-gray-300 mb-2">
                    The manga you&apos;re looking for doesn&apos;t exist or has been removed.
                </p>
                <p className="text-gray-400 text-sm mb-6">Manga ID: {mangaId}</p>
                <Link
                    href="/manga"
                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                    Browse All Manga
                </Link>
            </div>
        </div>
    );
}
