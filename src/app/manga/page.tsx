import { Suspense } from 'react';
import MangaListClient from './MangaListClient';

export default function MangaPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Browse Manga</h1>
                    <p className="text-gray-600 mt-2">Discover amazing manga series</p>
                </div>

                <Suspense fallback={
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading manga...</p>
                        </div>
                    </div>
                }>
                    <MangaListClient />
                </Suspense>
            </div>
        </div>
    );
}

