import { Suspense } from 'react';
import DashboardLayout from '@/components/creator/DashboardLayout';

export const dynamic = 'force-dynamic';

export default function UploadPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen bg-slate-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading upload...</p>
                </div>
            </div>
        }>
            <UploadPageClient />
        </Suspense>
    );
}

function UploadPageClient() {
    // Reuse existing upload page component
    const UploadComponent = require('@/app/upload/page').default;
    
    return (
        <DashboardLayout>
            <div className="bg-slate-900 rounded-2xl -m-6">
                <UploadComponent />
            </div>
        </DashboardLayout>
    );
}

