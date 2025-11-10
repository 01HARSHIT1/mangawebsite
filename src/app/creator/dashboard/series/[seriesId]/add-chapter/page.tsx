import NextDynamic from 'next/dynamic';

const ChapterEditor = NextDynamic(() => import('@/components/creator/ChapterEditor'), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center min-h-screen bg-slate-900">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                <p className="text-gray-400">Loading editor...</p>
            </div>
        </div>
    )
});

export const dynamic = 'force-dynamic';

export default function AddChapterPage({ params }: { params: { seriesId: string } }) {
    return <ChapterEditor seriesId={params.seriesId} />;
}

