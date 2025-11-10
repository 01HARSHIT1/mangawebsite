import NextDynamic from 'next/dynamic';

const SeriesDetailPage = NextDynamic(() => import('@/components/creator/SeriesDetailPage'), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center min-h-screen bg-slate-900">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                <p className="text-gray-400">Loading series...</p>
            </div>
        </div>
    )
});

export const dynamic = 'force-dynamic';

export default function CreatorSeriesDetail({ params }: { params: { seriesId: string } }) {
    return <SeriesDetailPage seriesId={params.seriesId} />;
}

