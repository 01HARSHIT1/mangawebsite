'use client';

import Link from 'next/link';
import Image from 'next/image';
import { FaHeart, FaEye, FaCalendar, FaStar, FaBookmark } from 'react-icons/fa';

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
    rating?: number;
    chapters?: number;
}

interface MangaGridProps {
    manga: Manga[];
    viewMode: 'grid' | 'list' | 'large-grid';
    isLoading?: boolean;
}

export default function MangaGrid({ manga, viewMode, isLoading }: MangaGridProps) {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    const truncateText = (text: string, maxLength: number) => {
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    };

    if (isLoading) {
        const skeletonCount = viewMode === 'list' ? 6 : viewMode === 'large-grid' ? 8 : 12;

        return (
            <div className={`grid gap-6 ${viewMode === 'list'
                    ? 'grid-cols-1'
                    : viewMode === 'large-grid'
                        ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                        : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
                }`}>
                {Array.from({ length: skeletonCount }).map((_, i) => (
                    <div key={i} className={`bg-slate-800/50 rounded-xl overflow-hidden animate-pulse ${viewMode === 'list' ? 'flex gap-4 p-4' : 'p-4'
                        }`}>
                        <div className={`bg-slate-700 rounded-lg ${viewMode === 'list'
                                ? 'w-24 h-32 flex-shrink-0'
                                : viewMode === 'large-grid'
                                    ? 'w-full h-48'
                                    : 'w-full h-32'
                            }`} />
                        <div className={`space-y-2 ${viewMode === 'list' ? 'flex-1' : 'mt-3'}`}>
                            <div className="h-4 bg-slate-700 rounded w-3/4" />
                            <div className="h-3 bg-slate-700 rounded w-1/2" />
                            {(viewMode === 'list' || viewMode === 'large-grid') && (
                                <>
                                    <div className="h-3 bg-slate-700 rounded w-full" />
                                    <div className="h-3 bg-slate-700 rounded w-2/3" />
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (manga.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-xl font-bold text-gray-400 mb-2">No manga found</h3>
                <p className="text-gray-500">Try adjusting your search or filters</p>
            </div>
        );
    }

    return (
        <div className={`grid gap-6 ${viewMode === 'list'
                ? 'grid-cols-1'
                : viewMode === 'large-grid'
                    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                    : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
            }`}>
            {manga.map((item) => (
                <Link
                    key={item._id}
                    href={`/manga/${item._id}`}
                    className={`group bg-slate-800/50 rounded-xl overflow-hidden hover:bg-slate-700/50 transition-all duration-300 hover:scale-105 hover:shadow-xl backdrop-blur-sm ${viewMode === 'list' ? 'flex gap-4 p-4' : 'p-4'
                        }`}
                >
                    {/* Cover Image */}
                    <div className={`relative overflow-hidden rounded-lg ${viewMode === 'list'
                            ? 'w-24 h-32 flex-shrink-0'
                            : viewMode === 'large-grid'
                                ? 'w-full h-48'
                                : 'w-full h-32'
                        }`}>
                        <Image
                            src={item.coverImage || '/file.svg'}
                            alt={item.title}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-300"
                            onError={(e) => {
                                e.currentTarget.src = '/file.svg';
                            }}
                        />

                        {/* Status Badge */}
                        <div className="absolute top-2 left-2">
                            <span className={`px-2 py-1 text-xs font-bold rounded-full ${item.status === 'Completed'
                                    ? 'bg-green-500 text-white'
                                    : item.status === 'Ongoing'
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-yellow-500 text-black'
                                }`}>
                                {item.status}
                            </span>
                        </div>

                        {/* Quick Actions (Large Grid Only) */}
                        {viewMode === 'large-grid' && (
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <button className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-sm">
                                    <FaBookmark />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className={`${viewMode === 'list' ? 'flex-1' : 'mt-3'}`}>
                        <h3 className={`font-bold text-white group-hover:text-purple-400 transition-colors duration-300 ${viewMode === 'large-grid' ? 'text-lg mb-2' : 'text-sm mb-1'
                            }`}>
                            {viewMode === 'list' || viewMode === 'large-grid'
                                ? item.title
                                : truncateText(item.title, 20)
                            }
                        </h3>

                        <p className="text-gray-400 text-sm mb-2">
                            by {item.creator}
                        </p>

                        {/* Description (List and Large Grid) */}
                        {(viewMode === 'list' || viewMode === 'large-grid') && (
                            <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                                {truncateText(item.description, viewMode === 'list' ? 150 : 100)}
                            </p>
                        )}

                        {/* Genres */}
                        <div className="flex flex-wrap gap-1 mb-3">
                            {item.genres?.slice(0, viewMode === 'list' ? 4 : 2).map((genre) => (
                                <span
                                    key={genre}
                                    className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full"
                                >
                                    {genre}
                                </span>
                            ))}
                        </div>

                        {/* Stats */}
                        <div className={`flex items-center gap-3 text-xs text-gray-400 ${viewMode === 'list' ? 'flex-wrap' : ''
                            }`}>
                            <div className="flex items-center gap-1">
                                <FaEye />
                                <span>{item.views?.toLocaleString() || 0}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <FaHeart />
                                <span>{item.likes?.toLocaleString() || 0}</span>
                            </div>
                            {item.rating && (
                                <div className="flex items-center gap-1">
                                    <FaStar className="text-yellow-400" />
                                    <span>{item.rating.toFixed(1)}</span>
                                </div>
                            )}
                            {item.chapters && (
                                <div className="flex items-center gap-1">
                                    <span>{item.chapters} chapters</span>
                                </div>
                            )}
                        </div>

                        {/* Date (List View) */}
                        {viewMode === 'list' && (
                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
                                <FaCalendar />
                                <span>Updated {formatDate(item.createdAt)}</span>
                            </div>
                        )}
                    </div>
                </Link>
            ))}
        </div>
    );
}
