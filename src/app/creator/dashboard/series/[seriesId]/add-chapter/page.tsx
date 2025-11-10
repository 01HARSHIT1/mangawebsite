'use client';

import ChapterEditor from '@/components/creator/ChapterEditor';

export const dynamic = 'force-dynamic';

export default function AddChapterPage({ params }: { params: { seriesId: string } }) {
    return <ChapterEditor seriesId={params.seriesId} />;
}

