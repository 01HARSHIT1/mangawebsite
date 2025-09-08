import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

interface ServerMangaReaderProps {
    params: {
        mangaId: string;
        chapterId: string;
    };
}

async function getChapterData(chapterId: string) {
    try {
        const client = await clientPromise;
        const db = client.db();

        const chapter = await db.collection('chapters').findOne({
            _id: new ObjectId(chapterId)
        });

        console.log('🔍 ServerMangaReader: Chapter data fetched:', chapter ? 'success' : 'not found');
        return chapter;
    } catch (error) {
        console.error('❌ ServerMangaReader: Error fetching chapter:', error);
        return null;
    }
}

export default async function ServerMangaReader({ params }: ServerMangaReaderProps) {
    console.log('🔍 ServerMangaReader: Starting with params:', params);

    const chapter = await getChapterData(params.chapterId);
    console.log('🔍 ServerMangaReader: Chapter data:', chapter ? 'loaded' : 'failed');

    if (!chapter) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">Chapter Not Found</h1>
                    <p className="text-gray-600">The requested chapter could not be found.</p>
                    <p className="text-sm text-gray-500 mt-2">Chapter ID: {params.chapterId}</p>
                </div>
            </div>
        );
    }

    // Use the original chapter data
    const { title, chapterNumber, pages, mangaId } = chapter;
    console.log('🔍 ServerMangaReader: Rendering chapter:', { title, chapterNumber, pagesCount: pages?.length });

    // DEBUG: Log the actual pages data
    console.log('🔍 ServerMangaReader: FULL PAGES DATA:', JSON.stringify(pages, null, 2));

    // DEBUG: Log each page individually
    if (pages && pages.length > 0) {
        pages.forEach((page, index) => {
            console.log(`🔍 ServerMangaReader: Page ${index + 1}:`, {
                imagePath: page.imagePath,
                path: page.path,
                src: page.src,
                fullPage: page
            });
        });
    }

    return (
        <div className="min-h-screen bg-gray-900">
            {/* CLEAN WORKING VERSION */}
            <div className="bg-green-600 text-white p-6 text-center font-bold text-2xl border-4 border-yellow-400">
                ✅ MANGA READER IS WORKING! ✅
                <br />
                Chapter: {title} | Pages: {pages?.length || 0}
            </div>

            {/* Header */}
            <div className="bg-gray-800 text-white p-4 shadow-lg">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-2xl font-bold">{title}</h1>
                    <p className="text-gray-300">Chapter {chapterNumber}</p>
                    <p className="text-sm text-gray-400">Manga ID: {mangaId}</p>
                </div>
            </div>

            {/* Manga Reader */}
            <div className="max-w-6xl mx-auto p-4">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    {/* Navigation Controls */}
                    <div className="bg-gray-100 p-4 border-b">
                        <div className="flex items-center justify-between">
                            <div className="flex space-x-2">
                                <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                                    Previous Chapter
                                </button>
                                <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                                    Next Chapter
                                </button>
                            </div>
                            <div className="text-sm text-gray-600">
                                {pages?.length || 0} pages
                            </div>
                        </div>
                    </div>

                    {/* Manga Pages */}
                    <div className="p-4">
                        {/* Status Indicator */}
                        <div className="bg-blue-600 text-white p-4 mb-4 text-center font-bold text-lg border-4 border-yellow-400">
                            🎯 RENDERING {pages?.length || 0} PAGES
                            <br />
                            Images should appear below this blue box
                        </div>

                        {pages && pages.length > 0 ? (
                            <div className="space-y-4">
                                {pages.map((page, index) => (
                                    <div key={index} className="flex justify-center">
                                        <div className="relative group">
                                            {/* Page Label */}
                                            <div className="bg-gray-800 text-white p-2 text-center font-bold mb-2 rounded">
                                                Page {index + 1} of {pages.length}
                                            </div>

                                            {/* The Actual Image */}
                                            <img
                                                src={page.imagePath || page.path || page.src || page}
                                                alt={`Page ${index + 1}`}
                                                className="manga-page-image max-w-full h-auto rounded-lg shadow-lg cursor-pointer hover:shadow-2xl transition-shadow duration-300 border-4 border-blue-500"
                                                style={{
                                                    maxHeight: '90vh',
                                                    minHeight: '400px',
                                                    minWidth: '300px',
                                                    display: 'block',
                                                    visibility: 'visible',
                                                    opacity: '1',
                                                    border: '2px solid red'
                                                }}
                                            />

                                            {/* Debug Info - Remove this after fixing */}
                                            <div className="mt-2 p-2 bg-yellow-100 border border-yellow-400 rounded text-xs text-yellow-800">
                                                <strong>Debug:</strong> Image path: {page.imagePath || page.path || page.src || page} |
                                                Expected size: {page.width || 'unknown'} x {page.height || 'unknown'}
                                            </div>

                                            {/* Page Number Overlay */}
                                            <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm">
                                                Page {index + 1} of {pages.length}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="text-6xl mb-4">📖</div>
                                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Pages Available</h3>
                                <p className="text-gray-500">This chapter doesn't have any pages yet.</p>
                                <p className="text-sm text-gray-400 mt-2">Pages array: {JSON.stringify(pages)}</p>
                            </div>
                        )}
                    </div>

                    {/* Bottom Navigation */}
                    <div className="bg-gray-100 p-4 border-t">
                        <div className="flex items-center justify-center space-x-4">
                            <button className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors">
                                Previous Chapter
                            </button>
                            <button className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors">
                                Next Chapter
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
