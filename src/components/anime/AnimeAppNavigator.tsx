'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAppMode } from '@/contexts/AppModeContext';

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
            {children}
        </div>
    );
}

