'use client';

import { useState, useEffect } from 'react';
import { FaDownload, FaTrash, FaWifi, FaWifiSlash, FaHardDrive, FaCheck } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

interface OfflineManga {
    mangaId: string;
    title: string;
    coverImage: string;
    chapters: string[];
    downloadedAt: Date;
    size: number;
}

interface OfflineManagerProps {
    mangaId?: string;
    mangaTitle?: string;
    chapters?: any[];
}

export default function OfflineManager({ mangaId, mangaTitle, chapters = [] }: OfflineManagerProps) {
    const [isOnline, setIsOnline] = useState(true);
    const [offlineManga, setOfflineManga] = useState<OfflineManga[]>([]);
    const [downloading, setDownloading] = useState<string | null>(null);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [storageUsed, setStorageUsed] = useState(0);
    const [storageQuota, setStorageQuota] = useState(0);

    useEffect(() => {
        // Monitor online status
        const updateOnlineStatus = () => setIsOnline(navigator.onLine);
        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);

        // Load offline manga list
        loadOfflineManga();

        // Get storage usage
        getStorageInfo();

        return () => {
            window.removeEventListener('online', updateOnlineStatus);
            window.removeEventListener('offline', updateOnlineStatus);
        };
    }, []);

    const loadOfflineManga = async () => {
        try {
            const stored = localStorage.getItem('offline-manga');
            if (stored) {
                setOfflineManga(JSON.parse(stored));
            }
        } catch (error) {
            console.error('Failed to load offline manga:', error);
        }
    };

    const getStorageInfo = async () => {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            try {
                const estimate = await navigator.storage.estimate();
                setStorageUsed(estimate.usage || 0);
                setStorageQuota(estimate.quota || 0);
            } catch (error) {
                console.error('Failed to get storage info:', error);
            }
        }
    };

    const downloadForOffline = async () => {
        if (!mangaId || !mangaTitle || downloading) return;

        setDownloading(mangaId);
        setDownloadProgress(0);

        try {
            // Register service worker if not already registered
            if ('serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.register('/sw-advanced.js');
                console.log('Service Worker registered:', registration);
            }

            const totalChapters = chapters.length;
            let downloadedChapters = 0;

            // Download manga data and images
            for (const chapter of chapters) {
                try {
                    // Cache chapter data
                    const chapterResponse = await fetch(`/api/manga/${mangaId}/chapters/${chapter._id}`);
                    if (chapterResponse.ok) {
                        const chapterData = await chapterResponse.json();
                        
                        // Cache chapter images
                        if (chapterData.pages) {
                            for (const page of chapterData.pages) {
                                try {
                                    await fetch(page); // This will be cached by service worker
                                } catch (error) {
                                    console.log('Failed to cache page:', page);
                                }
                            }
                        }
                    }
                    
                    downloadedChapters++;
                    setDownloadProgress((downloadedChapters / totalChapters) * 100);
                } catch (error) {
                    console.error('Failed to download chapter:', chapter._id);
                }
            }

            // Save to offline storage
            const offlineData: OfflineManga = {
                mangaId,
                title: mangaTitle,
                coverImage: '/placeholder-page-1.svg', // You'd get this from manga data
                chapters: chapters.map(c => c._id),
                downloadedAt: new Date(),
                size: 0 // Calculate actual size
            };

            const updatedOfflineManga = [...offlineManga.filter(m => m.mangaId !== mangaId), offlineData];
            setOfflineManga(updatedOfflineManga);
            localStorage.setItem('offline-manga', JSON.stringify(updatedOfflineManga));

            console.log(`✅ Downloaded ${mangaTitle} for offline reading`);
        } catch (error) {
            console.error('Failed to download for offline:', error);
        } finally {
            setDownloading(null);
            setDownloadProgress(0);
            await getStorageInfo();
        }
    };

    const removeOfflineManga = async (mangaIdToRemove: string) => {
        try {
            // Remove from service worker cache
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                    action: 'REMOVE_MANGA_CACHE',
                    data: { mangaId: mangaIdToRemove }
                });
            }

            // Remove from local storage
            const updatedOfflineManga = offlineManga.filter(m => m.mangaId !== mangaIdToRemove);
            setOfflineManga(updatedOfflineManga);
            localStorage.setItem('offline-manga', JSON.stringify(updatedOfflineManga));

            await getStorageInfo();
            console.log(`🗑️ Removed offline manga: ${mangaIdToRemove}`);
        } catch (error) {
            console.error('Failed to remove offline manga:', error);
        }
    };

    const clearAllOfflineData = async () => {
        if (confirm('Are you sure you want to clear all offline data? This cannot be undone.')) {
            try {
                // Clear service worker caches
                if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                    navigator.serviceWorker.controller.postMessage({
                        action: 'CLEAR_CACHE'
                    });
                }

                // Clear local storage
                setOfflineManga([]);
                localStorage.removeItem('offline-manga');

                await getStorageInfo();
                console.log('🗑️ All offline data cleared');
            } catch (error) {
                console.error('Failed to clear offline data:', error);
            }
        }
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const isCurrentMangaOffline = mangaId && offlineManga.some(m => m.mangaId === mangaId);

    return (
        <div className="space-y-4">
            {/* Online Status Indicator */}
            <div className={`flex items-center space-x-2 p-3 rounded-lg ${
                isOnline ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}>
                {isOnline ? <FaWifi /> : <FaWifiSlash />}
                <span className="text-sm font-medium">
                    {isOnline ? 'Online' : 'Offline Mode'}
                </span>
            </div>

            {/* Download for Offline (if viewing a specific manga) */}
            {mangaId && mangaTitle && (
                <div className="bg-slate-800/50 rounded-2xl p-4 border border-purple-500/20">
                    <h3 className="text-white font-semibold mb-3 flex items-center space-x-2">
                        <FaDownload />
                        <span>Offline Reading</span>
                    </h3>
                    
                    {isCurrentMangaOffline ? (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2 text-green-400">
                                <FaCheck />
                                <span className="text-sm">Available offline</span>
                            </div>
                            <button
                                onClick={() => removeOfflineManga(mangaId)}
                                className="text-red-400 hover:text-red-300 transition-colors"
                                title="Remove offline data"
                            >
                                <FaTrash />
                            </button>
                        </div>
                    ) : (
                        <div>
                            <p className="text-gray-300 text-sm mb-3">
                                Download this manga to read offline. Includes all {chapters.length} chapters.
                            </p>
                            
                            {downloading === mangaId ? (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-300">Downloading...</span>
                                        <span className="text-purple-400">{Math.round(downloadProgress)}%</span>
                                    </div>
                                    <div className="w-full bg-gray-700 rounded-full h-2">
                                        <div 
                                            className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${downloadProgress}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={downloadForOffline}
                                    disabled={!isOnline}
                                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 px-4 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                                >
                                    <FaDownload className="inline mr-2" />
                                    Download for Offline
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Storage Usage */}
            <div className="bg-slate-800/50 rounded-2xl p-4 border border-purple-500/20">
                <h3 className="text-white font-semibold mb-3 flex items-center space-x-2">
                    <FaHardDrive />
                    <span>Storage Usage</span>
                </h3>
                
                <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-300">Used</span>
                        <span className="text-white">{formatBytes(storageUsed)}</span>
                    </div>
                    
                    {storageQuota > 0 && (
                        <>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-300">Available</span>
                                <span className="text-white">{formatBytes(storageQuota)}</span>
                            </div>
                            
                            <div className="w-full bg-gray-700 rounded-full h-2">
                                <div 
                                    className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full"
                                    style={{ width: `${(storageUsed / storageQuota) * 100}%` }}
                                ></div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Offline Manga List */}
            {offlineManga.length > 0 && (
                <div className="bg-slate-800/50 rounded-2xl p-4 border border-purple-500/20">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-white font-semibold flex items-center space-x-2">
                            <FaDownload />
                            <span>Offline Manga ({offlineManga.length})</span>
                        </h3>
                        <button
                            onClick={clearAllOfflineData}
                            className="text-red-400 hover:text-red-300 text-sm transition-colors"
                        >
                            Clear All
                        </button>
                    </div>
                    
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {offlineManga.map((manga) => (
                            <div key={manga.mangaId} className="flex items-center justify-between p-2 bg-slate-700/30 rounded-lg">
                                <div className="flex-1">
                                    <p className="text-white text-sm font-medium">{manga.title}</p>
                                    <p className="text-gray-400 text-xs">
                                        {manga.chapters.length} chapters • Downloaded {new Date(manga.downloadedAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <button
                                    onClick={() => removeOfflineManga(manga.mangaId)}
                                    className="text-red-400 hover:text-red-300 transition-colors ml-2"
                                    title="Remove offline data"
                                >
                                    <FaTrash className="text-sm" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Offline Reading Tips */}
            {!isOnline && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-yellow-500/20 border border-yellow-500/30 rounded-2xl p-4"
                >
                    <h3 className="text-yellow-400 font-semibold mb-2 flex items-center space-x-2">
                        <FaWifiSlash />
                        <span>Offline Mode</span>
                    </h3>
                    <p className="text-yellow-200 text-sm">
                        You're currently offline. You can still read downloaded manga and browse cached content. 
                        Your actions will be synced when you're back online.
                    </p>
                </motion.div>
            )}
        </div>
    );
}
