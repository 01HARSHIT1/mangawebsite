'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaStar, FaEye, FaBookmark, FaPlay, FaClock, FaFire, FaHeart, FaShare } from 'react-icons/fa';
import { motion } from 'framer-motion';

interface MangaCardProps {
    manga: {
        _id: string;
        title: string;
        creator: string;
        description?: string;
        coverImage: string;
        genres: string[];
        rating: number;
        views: number;
        status: string;
        chapters?: any[];
        isNew?: boolean;
        isTrending?: boolean;
        lastUpdated?: string;
        readingProgress?: number;
    };
    variant?: 'default' | 'featured' | 'compact' | 'horizontal';
    showProgress?: boolean;
    showActions?: boolean;
    className?: string;
    index?: number;
}

export default function ModernMangaCard({
    manga,
    variant = 'default',
    showProgress = false,
    showActions = true,
    className = '',
    index = 0
}: MangaCardProps) {
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);

    const handleBookmark = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        // Handle bookmark logic here
        setIsBookmarked(!isBookmarked);
    };

    const handleShare = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        // Handle share logic here
        if (navigator.share) {
            try {
                await navigator.share({
                    title: manga.title,
                    text: `Check out ${manga.title} by ${manga.creator}`,
                    url: `/manga/${manga._id}`
                });
            } catch (err) {
                console.log('Error sharing:', err);
            }
        }
    };

    const cardVariants = {
        default: "manga-card group cursor-pointer",
        featured: "manga-card group cursor-pointer scale-105",
        compact: "manga-card group cursor-pointer h-48",
        horizontal: "manga-card-horizontal group cursor-pointer"
    };

    const imageVariants = {
        default: "aspect-[3/4]",
        featured: "aspect-[3/4]",
        compact: "aspect-[3/4]",
        horizontal: "w-32 flex-shrink-0 aspect-[3/4]"
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className={`${cardVariants[variant]} ${className}`}
        >
            <Link href={`/manga/${manga._id}`}>
                {/* Image Container */}
                <div className={`relative overflow-hidden ${imageVariants[variant]} bg-slate-800`}>
                    {/* Loading Skeleton */}
                    {!imageLoaded && (
                        <div className="absolute inset-0 skeleton animate-pulse" />
                    )}

                    {/* Cover Image */}
                    <Image
                        src={manga.coverImage || '/placeholder.svg'}
                        alt={manga.title}
                        fill
                        className={`object-cover transition-all duration-500 group-hover:scale-110 ${imageLoaded ? 'opacity-100' : 'opacity-0'
                            }`}
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        onLoad={() => setImageLoaded(true)}
                        priority={index < 6}
                    />

                    {/* Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Status Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                        {manga.isNew && (
                            <div className="badge badge-new flex items-center space-x-1">
                                <span>🆕</span>
                                <span>NEW</span>
                            </div>
                        )}
                        {manga.isTrending && (
                            <div className="badge badge-warning flex items-center space-x-1">
                                <FaFire />
                                <span>HOT</span>
                            </div>
                        )}
                        {manga.status === 'completed' && (
                            <div className="badge badge-success">
                                <span>Complete</span>
                            </div>
                        )}
                    </div>

                    {/* Rating Badge */}
                    <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm rounded-full px-2 py-1 flex items-center space-x-1">
                        <FaStar className="text-yellow-400 text-xs" />
                        <span className="text-white text-xs font-semibold">
                            {manga.rating ? manga.rating.toFixed(1) : 'N/A'}
                        </span>
                    </div>

                    {/* Reading Progress */}
                    {showProgress && manga.readingProgress && (
                        <div className="absolute bottom-0 left-0 right-0">
                            <div className="progress">
                                <div
                                    className="progress-bar"
                                    style={{ width: `${manga.readingProgress}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Hover Actions */}
                    {showActions && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={handleBookmark}
                                    className={`p-3 rounded-full backdrop-blur-sm transition-all duration-200 hover:scale-110 ${isBookmarked
                                            ? 'bg-red-500 text-white'
                                            : 'bg-white/20 text-white hover:bg-white/30'
                                        }`}
                                    title="Bookmark"
                                >
                                    {isBookmarked ? <FaHeart /> : <FaBookmark />}
                                </button>
                                <button
                                    className="p-4 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-all duration-200 hover:scale-110 shadow-lg"
                                    title="Read Now"
                                >
                                    <FaPlay />
                                </button>
                                <button
                                    onClick={handleShare}
                                    className="p-3 rounded-full bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm transition-all duration-200 hover:scale-110"
                                    title="Share"
                                >
                                    <FaShare />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className={`p-4 ${variant === 'horizontal' ? 'flex-1' : ''}`}>
                    {/* Title */}
                    <h3 className="text-white font-semibold text-lg mb-2 line-clamp-2 group-hover:text-indigo-400 transition-colors">
                        {manga.title}
                    </h3>

                    {/* Creator */}
                    <p className="text-gray-400 text-sm mb-3">
                        by <span className="text-indigo-400 font-medium">{manga.creator}</span>
                    </p>

                    {/* Description - Only for horizontal variant */}
                    {variant === 'horizontal' && manga.description && (
                        <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                            {manga.description}
                        </p>
                    )}

                    {/* Genres */}
                    <div className="flex flex-wrap gap-1 mb-3">
                        {manga.genres.slice(0, variant === 'horizontal' ? 4 : 3).map((genre) => (
                            <span
                                key={genre}
                                className="genre-tag text-xs"
                            >
                                {genre}
                            </span>
                        ))}
                        {manga.genres.length > (variant === 'horizontal' ? 4 : 3) && (
                            <span className="genre-tag text-xs opacity-60">
                                +{manga.genres.length - (variant === 'horizontal' ? 4 : 3)}
                            </span>
                        )}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1">
                                <FaEye />
                                <span>{manga.views?.toLocaleString() || '0'}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <FaBookmark />
                                <span>{manga.chapters?.length || 0} ch</span>
                            </div>
                        </div>
                        {manga.lastUpdated && (
                            <div className="flex items-center space-x-1 text-indigo-400">
                                <FaClock />
                                <span>Updated</span>
                            </div>
                        )}
                    </div>

                    {/* Action Button */}
                    <div className="flex space-x-2">
                        <Link
                            href={`/manga/${manga._id}`}
                            className="btn btn-primary btn-sm flex-1 justify-center"
                        >
                            <FaPlay className="mr-2" />
                            Read Now
                        </Link>
                        {variant !== 'compact' && (
                            <button
                                onClick={handleBookmark}
                                className={`btn btn-sm px-3 ${isBookmarked ? 'btn-secondary' : 'btn-ghost'
                                    }`}
                            >
                                {isBookmarked ? <FaHeart /> : <FaBookmark />}
                            </button>
                        )}
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}





