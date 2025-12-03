'use client';

import { useAppMode } from '@/contexts/AppModeContext';
import { useRouter, usePathname } from 'next/navigation';
import { BookOpen, Play } from 'lucide-react';

interface AppModeSwitcherProps {
    className?: string;
}

export default function AppModeSwitcher({ className = '' }: AppModeSwitcherProps) {
    const { appMode, switchToAnime, switchToManga } = useAppMode();
    const router = useRouter();
    const pathname = usePathname();

    const handleSwitchToAnime = () => {
        switchToAnime();
        // Use Next.js router to navigate to anime page
        if (pathname !== '/anime' && !pathname?.startsWith('/anime/')) {
            router.push('/anime');
        }
    };

    const handleSwitchToManga = () => {
        switchToManga();
        // Use Next.js router to navigate to manga home
        if (pathname?.startsWith('/anime')) {
            router.push('/');
        }
    };

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <button
                onClick={handleSwitchToManga}
                className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-300
                    ${appMode === 'manga'
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }
                `}
                title="Switch to Manga Reading Mode"
            >
                <BookOpen className="w-5 h-5" />
                <span className="hidden sm:inline">Manga</span>
            </button>
            <button
                onClick={handleSwitchToAnime}
                className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-300
                    ${appMode === 'anime'
                        ? 'bg-red-600 text-white shadow-lg shadow-red-500/50'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }
                `}
                title="Switch to Anime Watching Mode"
            >
                <Play className="w-5 h-5" />
                <span className="hidden sm:inline">Anime</span>
            </button>
        </div>
    );
}

