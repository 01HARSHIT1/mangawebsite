'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type AppMode = 'manga' | 'anime';

interface AppModeContextType {
    appMode: AppMode;
    setAppMode: (mode: AppMode) => void;
    switchToAnime: () => void;
    switchToManga: () => void;
}

const AppModeContext = createContext<AppModeContextType | undefined>(undefined);

export function AppModeProvider({ children }: { children: React.ReactNode }) {
    const [appMode, setAppModeState] = useState<AppMode>(() => {
        // Initialize from localStorage only on client side
        if (typeof window !== 'undefined') {
            const savedMode = localStorage.getItem('appMode') as AppMode;
            if (savedMode === 'manga' || savedMode === 'anime') {
                return savedMode;
            }
        }
        return 'manga';
    });

    // Save mode to localStorage when it changes (client-side only)
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('appMode', appMode);
        }
    }, [appMode]);

    // Save mode to localStorage when it changes
    const setAppMode = (mode: AppMode) => {
        setAppModeState(mode);
        if (typeof window !== 'undefined') {
            localStorage.setItem('appMode', mode);
        }
    };

    const switchToAnime = () => {
        setAppMode('anime');
        // Clear any manga-specific navigation state
        if (typeof window !== 'undefined') {
            window.history.replaceState({}, '', '/anime');
        }
    };

    const switchToManga = () => {
        setAppMode('manga');
        // Clear any anime-specific navigation state
        if (typeof window !== 'undefined') {
            window.history.replaceState({}, '', '/');
        }
    };

    return (
        <AppModeContext.Provider value={{ appMode, setAppMode, switchToAnime, switchToManga }}>
            {children}
        </AppModeContext.Provider>
    );
}

export function useAppMode() {
    const context = useContext(AppModeContext);
    if (context === undefined) {
        throw new Error('useAppMode must be used within an AppModeProvider');
    }
    return context;
}

