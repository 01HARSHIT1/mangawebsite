'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/creator/DashboardLayout';
import OverviewPage from '@/components/creator/OverviewPage';

export default function CreatorDashboardClient() {
    const { isAuthenticated, isCreator, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) {
            return;
        }

        if (!isAuthenticated) {
            router.replace('/login');
            return;
        }

        if (!isCreator) {
            router.replace('/upload');
        }
    }, [isAuthenticated, isCreator, isLoading, router]);

    if (isLoading || !isAuthenticated || !isCreator) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                    <p className="text-gray-400">
                        {isLoading ? 'Checking access...' : 'Redirecting...'}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900">
            <DashboardLayout>
                <OverviewPage />
            </DashboardLayout>
        </div>
    );
}

