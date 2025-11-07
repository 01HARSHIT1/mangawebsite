import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

export default function AddChapterPage({ params }: { params: { seriesId: string } }) {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen bg-slate-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading editor...</p>
                </div>
            </div>
        }>
            <ChapterEditorClient seriesId={params.seriesId} />
        </Suspense>
    );
}

function ChapterEditorClient({ seriesId }: { seriesId: string }) {
    const ChapterEditor = require('@/components/creator/ChapterEditor').default;
    return <ChapterEditor seriesId={seriesId} />;
}

