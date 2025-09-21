'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ViewToggle from '@/components/ViewToggle';
import MangaGrid from '@/components/MangaGrid';

interface Manga {
    _id: string;
    title: string;
    creator: string;
    description: string;
    genres: string[];
    status: string;
    coverImage: string;
    views: number;
    likes: number;
    createdAt: string;
}

export default function MangaListClient() {
    const [manga, setManga] = useState<Manga[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list' | 'large-grid'>('grid');

    useEffect(() => {
        fetchManga();
    }, []);

    const fetchManga = async () => {
        try {
            const response = await fetch('/api/manga');
            if (response.ok) {
                const data = await response.json();
                setManga(data.manga || []);
            } else {
                setError('Failed to load manga');
            }
        } catch (err) {
            setError('Failed to load manga');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading manga...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <p className="text-red-600 mb-4">{error}</p>
                <button
                    onClick={fetchManga}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                    Try Again
                </button>
            </div>
        );
    }

    if (manga.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-600 mb-4">No manga found.</p>
                <Link
                    href="/upload"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                    Upload First Manga
                </Link>
            </div>
        );
    }

    return (
        <div>
            {/* View Toggle */}
            <div className="flex justify-end mb-6">
                <ViewToggle
                    currentView={viewMode}
                    onViewChange={setViewMode}
                />
            </div>

            {/* Manga Grid */}
            <MangaGrid
                manga={manga}
                viewMode={viewMode}
                isLoading={isLoading}
            />
        </div>
    );
}

