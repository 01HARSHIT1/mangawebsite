'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/creator/DashboardLayout';
import OverviewPage from '@/components/creator/OverviewPage';

export default function CreatorDashboardClient() {
    const { isAuthenticated, isCreator } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }

        if (!isCreator) {
            router.push('/upload');
            return;
        }
    }, [isAuthenticated, isCreator, router]);

    if (!isAuthenticated || !isCreator) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                    <p className="text-gray-400">Checking access...</p>
                </div>
            </div>
        );
    }

    return (
        <DashboardLayout>
            <OverviewPage />
        </DashboardLayout>
    );
}
