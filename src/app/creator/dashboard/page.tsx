import { Suspense } from 'react';
import { requireCreator } from '@/lib/auth';
import CreatorDashboardClient from './CreatorDashboardClient';

export default async function CreatorDashboard() {
    // This will be called on the server side
    // For now, we'll handle auth in the client component
    return (
        <div className="min-h-screen bg-gray-50">
            <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                <CreatorDashboardClient />
            </Suspense>
        </div>
    );
}

