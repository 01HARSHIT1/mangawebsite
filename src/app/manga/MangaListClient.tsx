'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {manga.map((mangaItem) => (
                <Link
                    key={mangaItem._id}
                    href={`/manga/${mangaItem._id}`}
                    className="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                    <div className="aspect-[3/4] relative overflow-hidden">
                        <Image
                            src={mangaItem.coverImage}
                            alt={mangaItem.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                        />
                        <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
                            {mangaItem.status}
                        </div>
                    </div>

                    <div className="p-4">
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                            {mangaItem.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">by {mangaItem.creator}</p>

                        <div className="flex flex-wrap gap-1 mt-2">
                            {mangaItem.genres.slice(0, 2).map((genre, index) => (
                                <span
                                    key={index}
                                    className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                                >
                                    {genre}
                                </span>
                            ))}
                            {mangaItem.genres.length > 2 && (
                                <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                                    +{mangaItem.genres.length - 2}
                                </span>
                            )}
                        </div>

                        <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
                            <div className="flex items-center space-x-3">
                                <span className="flex items-center">
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    {mangaItem.views.toLocaleString()}
                                </span>
                                <span className="flex items-center">
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                    {mangaItem.likes.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    );
}

