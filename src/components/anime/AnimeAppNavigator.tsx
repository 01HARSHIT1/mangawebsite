'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAppMode } from '@/contexts/AppModeContext';
import AnimeNavigation from './AnimeNavigation';

interface AnimeAppNavigatorProps {
    children: React.ReactNode;
}

export default function AnimeAppNavigator({ children }: AnimeAppNavigatorProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { appMode, switchToAnime } = useAppMode();

    // Ensure we're in anime mode when on anime routes
    useEffect(() => {
        if (pathname?.startsWith('/anime') && appMode !== 'anime') {
            switchToAnime();
        }
    }, [appMode, pathname, router, switchToAnime]);

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            {/* Shared Navigation for all anime pages */}
            <AnimeNavigation />
            {/* Content with top padding to account for fixed nav */}
            <div className="pt-16">
                {children}
            </div>
        </div>
    );
}

