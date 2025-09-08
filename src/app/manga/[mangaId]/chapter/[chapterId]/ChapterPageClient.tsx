'use client';

import { useState, useCallback } from 'react';
import { ChapterData, MangaPage } from '@/lib/mangaData';
import MangaReader from '@/components/MangaReader';

interface ChapterPageClientProps {
    chapterData: ChapterData;
    mangaId: string;
    chapterId: string;
}

export default function ChapterPageClient({
    chapterData,
    mangaId,
    chapterId
}: ChapterPageClientProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handlePageLoad = useCallback((pageIndex: number, success: boolean) => {
        if (!success) {
            setError(`Failed to load page ${pageIndex + 1}`);
        }
    }, []);

    if (error) {
        return (
            <div className="min-h-screen bg-gray-900 text-white p-8">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-3xl font-bold text-red-400 mb-4">
                        Error Loading Chapter
                    </h1>
                    <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
                        <p className="text-red-300 mb-4">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900">
            {/* Header */}
            <div className="bg-gray-800 border-b border-gray-700">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-semibold text-white">
                                {chapterData.manga.title}
                            </h1>
                            <p className="text-gray-300">
                                {chapterData.title} • {chapterData.pages.length} pages
                            </p>
                        </div>
                        <div className="text-right text-sm text-gray-400">
                            <p>By {chapterData.manga.creator.displayName}</p>
                            <p>{new Date(chapterData.createdAt).toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Manga Reader */}
            <MangaReader
                pages={chapterData.pages}
                chapterTitle={chapterData.title}
                mangaTitle={chapterData.manga.title}
                onPageLoad={handlePageLoad}
                isLoading={isLoading}
            />

            {/* Navigation Footer */}
            <div className="bg-gray-800 border-t border-gray-700 py-4">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex items-center justify-between text-sm text-gray-400">
                        <div>
                            <p>Chapter {chapterData.number}</p>
                            <p>{chapterData.pages.length} pages</p>
                        </div>
                        <div className="text-right">
                            <p>Views: {chapterData.views}</p>
                            <p>Published: {new Date(chapterData.createdAt).toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
