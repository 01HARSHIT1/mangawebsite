'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAppMode } from '@/contexts/AppModeContext';
import AppModeSwitcher from '@/components/AppModeSwitcher';

interface MangaAppNavigatorProps {
    children: React.ReactNode;
}

export default function MangaAppNavigator({ children }: MangaAppNavigatorProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { appMode, switchToAnime } = useAppMode();

    // Redirect to manga home if in anime mode and on manga routes
    useEffect(() => {
        if (appMode === 'anime' && !pathname?.startsWith('/anime') && !pathname?.startsWith('/api')) {
            switchToAnime();
            router.push('/anime');
        }
    }, [appMode, pathname, router, switchToAnime]);

    // If not in manga mode, don't render manga content
    if (appMode !== 'manga') {
        return null;
    }

    return (
        <div className="min-h-screen">
            {children}
        </div>
    );
}

