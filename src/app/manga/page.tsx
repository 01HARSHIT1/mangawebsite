import { Suspense } from 'react';
import ModernMangaPage from './modern-page';

export default function MangaPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-16 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading manga...</p>
                </div>
            </div>
        }>
            <ModernMangaPage />
        </Suspense>
    );
}

