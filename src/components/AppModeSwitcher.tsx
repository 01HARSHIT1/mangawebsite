'use client';

import { useAppMode } from '@/contexts/AppModeContext';
import { useRouter, usePathname } from 'next/navigation';
import { BookOpen, Play } from 'lucide-react';

interface AppModeSwitcherProps {
    className?: string;
    onSwitch?: () => void; // Optional callback for when mode is switched (e.g., to close mobile menu)
}

export default function AppModeSwitcher({ className = '', onSwitch }: AppModeSwitcherProps) {
    const { appMode, switchToAnime, switchToManga } = useAppMode();
    const router = useRouter();
    const pathname = usePathname();

    const handleSwitchToAnime = () => {
        // Set mode first
        switchToAnime();
        // Always navigate to anime page when switching to anime mode
        if (pathname !== '/anime' && !pathname?.startsWith('/anime/')) {
            router.replace('/anime');
        }
        // Call optional callback (e.g., to close mobile menu)
        if (onSwitch) {
            onSwitch();
        }
    };

    const handleSwitchToManga = () => {
        // Set mode first
        switchToManga();
        // Always navigate to manga home when switching to manga mode
        // Use replace to avoid adding to history
        router.replace('/');
        // Call optional callback (e.g., to close mobile menu)
        if (onSwitch) {
            onSwitch();
        }
    };

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <button
                onClick={handleSwitchToManga}
                className={`
                    flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg font-semibold text-sm sm:text-base transition-all duration-300 touch-manipulation min-h-[44px] sm:min-h-0
                    ${appMode === 'manga'
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50 active:bg-purple-700'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600 active:bg-gray-500'
                    }
                `}
                title="Switch to Manga Reading Mode"
            >
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden xs:inline sm:inline">Manga</span>
            </button>
            <button
                onClick={handleSwitchToAnime}
                className={`
                    flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg font-semibold text-sm sm:text-base transition-all duration-300 touch-manipulation min-h-[44px] sm:min-h-0
                    ${appMode === 'anime'
                        ? 'bg-red-600 text-white shadow-lg shadow-red-500/50 active:bg-red-700'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600 active:bg-gray-500'
                    }
                `}
                title="Switch to Anime Watching Mode"
            >
                <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden xs:inline sm:inline">Anime</span>
            </button>
        </div>
    );
}

