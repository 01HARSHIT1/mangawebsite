import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import ChapterReader from '@/components/ChapterReader';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function ChapterPage({
    params
}: {
    params: Promise<{ mangaId: string; chapterId: string }>
}) {
    try {
        // Await params in Next.js 13+ app router
        const { mangaId, chapterId } = await params;
        
        // Validate IDs
        if (!mangaId || !chapterId) {
            return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Invalid Chapter URL</h1>
                    <p className="text-gray-400">The chapter URL is invalid.</p>
                </div>
            </div>;
        }

        const client = await clientPromise;
        const db = client.db();

        // Get manga details - handle both string and ObjectId
        let manga;
        try {
            manga = await db.collection('manga').findOne({
                _id: new ObjectId(mangaId)
            });
        } catch (error) {
            console.error('Error fetching manga:', error);
            // Try as string if ObjectId fails
            manga = await db.collection('manga').findOne({
                _id: mangaId
            });
        }

        if (!manga) {
            return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Manga Not Found</h1>
                    <p className="text-gray-400">The manga you're looking for doesn't exist.</p>
                </div>
            </div>;
        }

        // Get current chapter - handle both string and ObjectId
        let chapter;
        try {
            chapter = await db.collection('chapters').findOne({
                _id: new ObjectId(chapterId)
            });
        } catch (error) {
            console.error('Error fetching chapter:', error);
            // Try as string if ObjectId fails
            chapter = await db.collection('chapters').findOne({
                _id: chapterId
            });
        }

        if (!chapter) {
            return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Chapter Not Found</h1>
                    <p className="text-gray-400">This chapter doesn't exist.</p>
                </div>
            </div>;
        }

        // Get all chapters for navigation
        // Handle both string and ObjectId formats for mangaId
        const allChapters = await db.collection('chapters')
            .find({ 
                $or: [
                    { mangaId: mangaId },
                    { mangaId: new ObjectId(mangaId) }
                ]
            })
            .sort({ chapterNumber: 1 })
            .toArray();

        // Find current chapter index
        const currentIndex = allChapters.findIndex(ch => ch._id.toString() === chapterId);
        const prevChapter = currentIndex > 0 ? allChapters[currentIndex - 1] : null;
        const nextChapter = currentIndex < allChapters.length - 1 ? allChapters[currentIndex + 1] : null;

        // Serialize MongoDB objects to plain objects for client components
        const serializedManga = {
            ...manga,
            _id: manga._id.toString(),
            createdAt: typeof (manga as any).createdAt === 'string' ? (manga as any).createdAt : manga.createdAt?.toISOString(),
            updatedAt: typeof (manga as any).updatedAt === 'string' ? (manga as any).updatedAt : manga.updatedAt?.toISOString()
        };

        const serializedChapter = {
            ...chapter,
            _id: chapter._id.toString(),
            mangaId: chapter.mangaId,
            createdAt: typeof (chapter as any).createdAt === 'string' ? (chapter as any).createdAt : chapter.createdAt?.toISOString(),
            updatedAt: typeof (chapter as any).updatedAt === 'string' ? (chapter as any).updatedAt : chapter.updatedAt?.toISOString()
        };

        const serializedAllChapters = allChapters.map(ch => ({
            ...ch,
            _id: ch._id.toString(),
            mangaId: ch.mangaId,
            createdAt: typeof (ch as any).createdAt === 'string' ? (ch as any).createdAt : (ch as any).createdAt?.toISOString?.(),
            updatedAt: typeof (ch as any).updatedAt === 'string' ? (ch as any).updatedAt : (ch as any).updatedAt?.toISOString?.()
        }));

        const serializedPrevChapter = prevChapter ? {
            ...prevChapter,
            _id: prevChapter._id.toString(),
            mangaId: prevChapter.mangaId,
            createdAt: typeof (prevChapter as any).createdAt === 'string' ? (prevChapter as any).createdAt : (prevChapter as any).createdAt?.toISOString?.(),
            updatedAt: typeof (prevChapter as any).updatedAt === 'string' ? (prevChapter as any).updatedAt : (prevChapter as any).updatedAt?.toISOString?.()
        } : null;

        const serializedNextChapter = nextChapter ? {
            ...nextChapter,
            _id: nextChapter._id.toString(),
            mangaId: nextChapter.mangaId,
            createdAt: typeof (nextChapter as any).createdAt === 'string' ? (nextChapter as any).createdAt : (nextChapter as any).createdAt?.toISOString?.(),
            updatedAt: typeof (nextChapter as any).updatedAt === 'string' ? (nextChapter as any).updatedAt : (nextChapter as any).updatedAt?.toISOString?.()
        } : null;

        return (
            <ChapterReader
                manga={serializedManga}
                chapter={serializedChapter}
                allChapters={serializedAllChapters}
                prevChapter={serializedPrevChapter}
                nextChapter={serializedNextChapter}
                currentIndex={currentIndex}
            />
        );
    } catch (error: any) {
        console.error('Error loading chapter:', error);
        console.error('Error stack:', error?.stack);
        console.error('Error details:', {
            message: error?.message,
            name: error?.name,
            code: error?.code
        });
        return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-2xl font-bold mb-4">Error Loading Chapter</h1>
                <p className="text-gray-400">Something went wrong. Please try again.</p>
                <p className="text-gray-500 text-sm mt-2">Error: {error?.message || 'Unknown error'}</p>
                <p className="text-gray-600 text-xs mt-1">Check the server logs for more details.</p>
            </div>
        </div>;
    }
} 