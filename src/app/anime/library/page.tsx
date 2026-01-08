'use client';

import { useState, useEffect } from 'react';
import { useAppMode } from '@/contexts/AppModeContext';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import EpisodeCard from '@/components/anime/components/EpisodeCard';
import ContinueWatching from '@/components/anime/components/ContinueWatching';
import { motion } from 'framer-motion';
import { Bookmark, Clock, Heart, Play, Trash2 } from 'lucide-react';

interface AnimeSeries {
    _id: string;
    title: string;
    coverImage: string;
    genres: string[];
    rating: number;
    year: number;
    status: 'ongoing' | 'completed' | 'upcoming';
    episodeCount: number;
}

interface MyListEntry {
    _id: string;
    seriesId: string;
    listType: 'favorites' | 'watchlist' | 'watching' | 'completed' | 'dropped' | 'on_hold';
    series?: AnimeSeries;
}

export default function AnimeLibraryPage() {
    const { appMode, switchToAnime } = useAppMode();
    const { isAuthenticated } = useAuth();
    const [activeTab, setActiveTab] = useState<'watching' | 'watchlist' | 'favorites' | 'completed'>('watching');
    const [myList, setMyList] = useState<MyListEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (appMode !== 'anime') {
            switchToAnime();
        }
    }, [appMode, switchToAnime]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchMyList();
        } else {
            setLoading(false);
        }
    }, [isAuthenticated, activeTab]);

    const fetchMyList = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            if (!token) {
                setLoading(false);
                return;
            }

            const response = await fetch(`/api/anime/my-list?type=${activeTab}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                const listEntries = data.myList || [];
                
                // Fetch series details for each entry
                const seriesPromises = listEntries.map(async (entry: MyListEntry) => {
                    try {
                        const seriesRes = await fetch(`/api/anime/${entry.seriesId}`);
                        if (seriesRes.ok) {
                            const seriesData = await seriesRes.json();
                            return { ...entry, series: seriesData };
                        }
                        return entry;
                    } catch (error) {
                        console.error(`Error fetching series ${entry.seriesId}:`, error);
                        return entry;
                    }
                });
                
                const entriesWithSeries = await Promise.all(seriesPromises);
                setMyList(entriesWithSeries);
            }
        } catch (error) {
            console.error('Error fetching my list:', error);
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'watching' as const, label: 'Continue Watching', icon: Play },
        { id: 'watchlist' as const, label: 'Watchlist', icon: Bookmark },
        { id: 'favorites' as const, label: 'Favorites', icon: Heart },
        { id: 'completed' as const, label: 'Completed', icon: Clock },
    ];

    const filteredList = myList.filter(item => {
        switch (activeTab) {
            case 'watching':
                return item.listType === 'watching';
            case 'watchlist':
                return item.listType === 'watchlist';
            case 'favorites':
                return item.listType === 'favorites';
            case 'completed':
                return item.listType === 'completed';
            default:
                return false;
        }
    });

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-950 via-red-950 to-black text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                    <div className="text-center">
                        <h1 className="text-4xl font-black mb-4 bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 bg-clip-text text-transparent">
                            MY LIBRARY
                        </h1>
                        <p className="text-gray-400 text-lg mb-8">
                            Sign in to access your anime library
                        </p>
                        <Link
                            href="/login"
                            className="inline-block px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-orange-500/50"
                        >
                            Sign In
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-950 via-red-950 to-black text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-8">
                    <h1 className="text-4xl font-black mb-4 bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 bg-clip-text text-transparent">
                        MY LIBRARY
                    </h1>
                    <p className="text-gray-400 text-lg">Your personal anime collection</p>
                </div>

                {/* Tabs */}
                <div className="flex flex-wrap gap-2 mb-8 border-b border-orange-500/20">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    flex items-center gap-2 px-6 py-3 font-semibold transition-all relative
                                    ${isActive
                                        ? 'text-orange-400'
                                        : 'text-gray-400 hover:text-orange-300'
                                    }
                                `}
                            >
                                <Icon className="w-5 h-5" />
                                <span>{tab.label}</span>
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-400"
                                        initial={false}
                                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                    </div>
                ) : activeTab === 'watching' ? (
                    <ContinueWatching limit={50} />
                ) : filteredList.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {filteredList.map((item) => (
                            <div key={item._id} className="relative group">
                                <EpisodeCard anime={item.series || {
                                    _id: item.seriesId,
                                    title: 'Loading...',
                                    coverImage: '',
                                    genres: [],
                                    rating: 0,
                                    year: 0,
                                    status: 'ongoing',
                                    episodeCount: 0,
                                }} />
                                <button
                                    onClick={async () => {
                                        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
                                        if (!token) return;
                                        
                                        try {
                                            const response = await fetch(`/api/anime/my-list?seriesId=${item.seriesId}&listType=${item.listType}`, {
                                                method: 'DELETE',
                                                headers: { Authorization: `Bearer ${token}` },
                                            });
                                            if (response.ok) {
                                                fetchMyList();
                                            }
                                        } catch (error) {
                                            console.error('Error removing from list:', error);
                                        }
                                    }}
                                    className="absolute top-2 right-2 p-2 bg-black/70 hover:bg-black/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                    title="Remove from list"
                                >
                                    <Trash2 className="w-4 h-4 text-red-400" />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <p className="text-gray-400 text-xl mb-4">
                            No anime in your {tabs.find(t => t.id === activeTab)?.label.toLowerCase()}
                        </p>
                        <Link
                            href="/anime/browse"
                            className="inline-block px-6 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-lg transition-colors border border-orange-500/30"
                        >
                            Browse Anime
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

