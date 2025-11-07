import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

export default function AnalyticsPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen bg-slate-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading analytics...</p>
                </div>
            </div>
        }>
            <AnalyticsPageClient />
        </Suspense>
    );
}

function AnalyticsPageClient() {
    // Reuse existing analytics page
    const AnalyticsComponent = require('@/app/creator/analytics/page').default;
    const DashboardLayout = require('@/components/creator/DashboardLayout').default;
    
    return (
        <DashboardLayout>
            <AnalyticsComponent />
        </DashboardLayout>
    );
}

