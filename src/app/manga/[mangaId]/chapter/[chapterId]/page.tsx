import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import ChapterReader from '@/components/ChapterReader';

export default async function ChapterPage({
    params
}: {
    params: { mangaId: string; chapterId: string }
}) {
    try {
        const client = await clientPromise;
        const db = client.db();

        // Get manga details
        const manga = await db.collection('manga').findOne({
            _id: new ObjectId(params.mangaId)
        });

        if (!manga) {
            return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Manga Not Found</h1>
                    <p className="text-gray-400">The manga you're looking for doesn't exist.</p>
                </div>
            </div>;
        }

        // Get current chapter
        const chapter = await db.collection('chapters').findOne({
            _id: new ObjectId(params.chapterId)
        });

        if (!chapter) {
            return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Chapter Not Found</h1>
                    <p className="text-gray-400">This chapter doesn't exist.</p>
                </div>
            </div>;
        }

        // Get all chapters for navigation
        const allChapters = await db.collection('chapters')
            .find({ mangaId: params.mangaId })
            .sort({ chapterNumber: 1 })
            .toArray();

        // Find current chapter index
        const currentIndex = allChapters.findIndex(ch => ch._id.toString() === params.chapterId);
        const prevChapter = currentIndex > 0 ? allChapters[currentIndex - 1] : null;
        const nextChapter = currentIndex < allChapters.length - 1 ? allChapters[currentIndex + 1] : null;

        // Serialize MongoDB objects to plain objects for client components
        const serializedManga = {
            ...manga,
            _id: manga._id.toString(),
            createdAt: manga.createdAt?.toISOString(),
            updatedAt: manga.updatedAt?.toISOString()
        };

        const serializedChapter = {
            ...chapter,
            _id: chapter._id.toString(),
            mangaId: chapter.mangaId,
            createdAt: chapter.createdAt?.toISOString(),
            updatedAt: chapter.updatedAt?.toISOString()
        };

        const serializedAllChapters = allChapters.map(ch => ({
            ...ch,
            _id: ch._id.toString(),
            mangaId: ch.mangaId,
            createdAt: ch.createdAt?.toISOString(),
            updatedAt: ch.updatedAt?.toISOString()
        }));

        const serializedPrevChapter = prevChapter ? {
            ...prevChapter,
            _id: prevChapter._id.toString(),
            mangaId: prevChapter.mangaId,
            createdAt: prevChapter.createdAt?.toISOString(),
            updatedAt: prevChapter.updatedAt?.toISOString()
        } : null;

        const serializedNextChapter = nextChapter ? {
            ...nextChapter,
            _id: nextChapter._id.toString(),
            mangaId: nextChapter.mangaId,
            createdAt: nextChapter.createdAt?.toISOString(),
            updatedAt: nextChapter.updatedAt?.toISOString()
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
    } catch (error) {
        console.error('Error loading chapter:', error);
        return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-2xl font-bold mb-4">Error Loading Chapter</h1>
                <p className="text-gray-400">Something went wrong. Please try again.</p>
            </div>
        </div>;
    }
} 