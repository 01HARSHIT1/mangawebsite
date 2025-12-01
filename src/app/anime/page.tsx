'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppMode } from '@/contexts/AppModeContext';
import AnimeHome from '@/components/anime/screens/AnimeHome';

export default function AnimePage() {
    const router = useRouter();
    const { appMode, switchToAnime } = useAppMode();

    useEffect(() => {
        // Ensure we're in anime mode
        if (appMode !== 'anime') {
            switchToAnime();
        }
    }, [appMode, switchToAnime]);

    return <AnimeHome />;
}

