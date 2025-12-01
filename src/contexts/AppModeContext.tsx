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
    const [appMode, setAppModeState] = useState<AppMode>('manga');

    // Load mode from localStorage on mount
    useEffect(() => {
        const savedMode = localStorage.getItem('appMode') as AppMode;
        if (savedMode === 'manga' || savedMode === 'anime') {
            setAppModeState(savedMode);
        }
    }, []);

    // Save mode to localStorage when it changes
    const setAppMode = (mode: AppMode) => {
        setAppModeState(mode);
        localStorage.setItem('appMode', mode);
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

