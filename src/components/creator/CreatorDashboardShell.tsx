'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/creator/DashboardLayout';
import OverviewPage from '@/components/creator/OverviewPage';

export default function CreatorDashboardShell() {
    const { isAuthenticated, isCreator, isLoading, user } = useAuth();
    const router = useRouter();
    const [hasUploadedContent, setHasUploadedContent] = useState(false);
    const [checkingContent, setCheckingContent] = useState(true);

    // Check if admin has uploaded content
    useEffect(() => {
        if (isLoading || !isAuthenticated) {
            return;
        }

        const checkUploadedContent = async () => {
            if (user?.role === 'admin') {
                try {
                    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
                    const response = await fetch('/api/creator/dashboard', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (response.ok) {
                        const data = await response.json();
                        const hasContent = data.stats?.totalManga > 0 || data.series?.length > 0;
                        setHasUploadedContent(hasContent);
                    } else {
                        setHasUploadedContent(false);
                    }
                } catch (error) {
                    setHasUploadedContent(false);
                }
            }
            setCheckingContent(false);
        };

        checkUploadedContent();
    }, [isAuthenticated, isLoading, user]);

    useEffect(() => {
        if (isLoading || checkingContent) {
            return;
        }

        if (!isAuthenticated) {
            router.replace('/login');
            return;
        }

        // Allow admins to access creator dashboard if they have uploaded content
        // Otherwise, redirect non-creator users to upload page
        if (user?.role === 'admin') {
            // Admin can access creator dashboard if they have uploaded content
            if (!hasUploadedContent) {
                router.replace('/admin/dashboard');
                return;
            }
            // If admin has uploaded content, allow them to stay on creator dashboard
        } else if (!isCreator) {
            router.replace('/upload');
        }
    }, [isAuthenticated, isCreator, isLoading, user, router, hasUploadedContent, checkingContent]);

    if (isLoading || checkingContent || !isAuthenticated || (!isCreator && user?.role !== 'admin')) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                    <p className="text-gray-400">
                        {isLoading || checkingContent ? 'Checking access...' : 'Redirecting...'}
                    </p>
                </div>
            </div>
        );
    }

    // If admin doesn't have uploaded content, they'll be redirected in useEffect
    if (user?.role === 'admin' && !hasUploadedContent) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                    <p className="text-gray-400">Redirecting...</p>
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

