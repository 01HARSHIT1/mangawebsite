import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

export default function SeriesDetailPage({ params }: { params: { seriesId: string } }) {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen bg-slate-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading series...</p>
                </div>
            </div>
        }>
            <SeriesDetailClient seriesId={params.seriesId} />
        </Suspense>
    );
}

function SeriesDetailClient({ seriesId }: { seriesId: string }) {
    const SeriesDetailComponent = require('@/components/creator/SeriesDetailPage').default;
    return <SeriesDetailComponent seriesId={seriesId} />;
}

