'use client';

import SeriesDetailPage from '@/components/creator/SeriesDetailPage';

export const dynamic = 'force-dynamic';

export default function CreatorSeriesDetail({ params }: { params: { seriesId: string } }) {
    return <SeriesDetailPage seriesId={params.seriesId} />;
}

