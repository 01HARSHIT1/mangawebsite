'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { FaStar, FaEye, FaBookmark, FaPlay, FaClock, FaFire, FaHeart, FaShare, FaPlus } from 'react-icons/fa';
import { RippleButton, InteractiveLikeButton, AnimatedBookmarkButton, HoverCard } from './MicroInteractions';
// import { AdvancedImageLoader } from './AdvancedLoadingStates';

interface EnhancedMangaCardProps {
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
        likes?: number;
        isLiked?: boolean;
        isBookmarked?: boolean;
    };
    variant?: 'default' | 'featured' | 'compact' | 'horizontal';
    showProgress?: boolean;
    showActions?: boolean;
    className?: string;
    index?: number;
    onLike?: (mangaId: string, liked: boolean) => void;
    onBookmark?: (mangaId: string, bookmarked: boolean) => void;
}

export default function EnhancedMangaCard({
    manga,
    variant = 'default',
    showProgress = false,
    showActions = true,
    className = '',
    index = 0,
    onLike,
    onBookmark
}: EnhancedMangaCardProps) {
    const [isHovered, setIsHovered] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    // 3D Tilt Effect
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotateX = useSpring(useTransform(y, [-100, 100], [30, -30]));
    const rotateY = useSpring(useTransform(x, [-100, 100], [-30, 30]));

    const handleMouseMove = (event: React.MouseEvent) => {
        if (!cardRef.current) return;

        const rect = cardRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        x.set((event.clientX - centerX) / 5);
        y.set((event.clientY - centerY) / 5);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
        setIsHovered(false);
    };

    const cardVariants = {
        default: "aspect-[3/4] w-full",
        featured: "aspect-[3/4] w-full scale-105",
        compact: "aspect-[3/4] w-full",
        horizontal: "flex space-x-4 h-48"
    };

    const hoverCardContent = (
        <div className="space-y-3 max-w-xs">
            <div>
                <h4 className="font-semibold text-white mb-1">{manga.title}</h4>
                <p className="text-sm text-gray-400">by {manga.creator}</p>
            </div>
            {manga.description && (
                <p className="text-sm text-gray-300 line-clamp-3">{manga.description}</p>
            )}
            <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-1 text-yellow-400">
                    <FaStar />
                    <span>{manga.rating}</span>
                </div>
                <div className="flex items-center space-x-1 text-gray-400">
                    <FaEye />
                    <span>{manga.views?.toLocaleString()}</span>
                </div>
            </div>
            <div className="flex flex-wrap gap-1">
                {manga.genres.slice(0, 3).map(genre => (
                    <span key={genre} className="badge badge-primary text-xs">
                        {genre}
                    </span>
                ))}
            </div>
        </div>
    );

    return (
        <motion.div
            ref={cardRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className={`group cursor-pointer ${className}`}
            style={{
                perspective: 1000,
            }}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={handleMouseLeave}
        >
            <motion.div
                style={{
                    rotateX: variant === 'featured' ? rotateX : 0,
                    rotateY: variant === 'featured' ? rotateY : 0,
                }}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className={`card hover-glow transition-all duration-300 ${cardVariants[variant]} overflow-hidden`}
            >
                <Link href={`/manga/${manga._id}`}>
                    {/* Image Container */}
                    <div className={`relative overflow-hidden ${variant === 'horizontal' ? 'w-32 flex-shrink-0' : 'aspect-[3/4]'
                        }`}>
                        {/* Advanced Image with Loading */}
                        <div className="relative w-full h-full">
                            {!imageLoaded && (
                                <div className="absolute inset-0 bg-slate-700 animate-pulse" />
                            )}
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
                        </div>

                        {/* Animated Overlay */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: isHovered ? 1 : 0 }}
                            transition={{ duration: 0.3 }}
                            className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"
                        />

                        {/* Status Badges with Animations */}
                        <div className="absolute top-3 left-3 flex flex-col gap-2">
                            {manga.isNew && (
                                <motion.div
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: "spring", stiffness: 500, delay: 0.2 }}
                                    className="badge badge-new flex items-center space-x-1"
                                >
                                    <span>🆕</span>
                                    <span>NEW</span>
                                </motion.div>
                            )}
                            {manga.isTrending && (
                                <motion.div
                                    animate={{
                                        scale: [1, 1.1, 1],
                                        rotate: [0, 5, -5, 0]
                                    }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="badge badge-warning flex items-center space-x-1"
                                >
                                    <FaFire />
                                    <span>HOT</span>
                                </motion.div>
                            )}
                        </div>

                        {/* Rating Badge */}
                        <motion.div
                            initial={{ scale: 0, x: 20 }}
                            animate={{ scale: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm rounded-full px-3 py-1 flex items-center space-x-1"
                        >
                            <FaStar className="text-yellow-400 text-xs" />
                            <span className="text-white text-xs font-semibold">
                                {manga.rating ? manga.rating.toFixed(1) : 'N/A'}
                            </span>
                        </motion.div>

                        {/* Reading Progress */}
                        {showProgress && manga.readingProgress && (
                            <div className="absolute bottom-0 left-0 right-0">
                                <motion.div
                                    initial={{ scaleX: 0 }}
                                    animate={{ scaleX: 1 }}
                                    transition={{ delay: 0.5, duration: 0.8 }}
                                    className="progress"
                                >
                                    <motion.div
                                        className="progress-bar"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${manga.readingProgress}%` }}
                                        transition={{ delay: 0.7, duration: 1 }}
                                    />
                                </motion.div>
                            </div>
                        )}

                        {/* Hover Actions */}
                        {showActions && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{
                                    opacity: isHovered ? 1 : 0,
                                    scale: isHovered ? 1 : 0.8
                                }}
                                transition={{ duration: 0.3 }}
                                className="absolute inset-0 flex items-center justify-center"
                            >
                                <div className="flex items-center space-x-3">
                                    <AnimatedBookmarkButton
                                        initialBookmarked={manga.isBookmarked}
                                        onBookmark={(bookmarked) => onBookmark?.(manga._id, bookmarked)}
                                    />

                                    <RippleButton
                                        className="p-4 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            // Handle direct read
                                        }}
                                    >
                                        <FaPlay />
                                    </RippleButton>

                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            // Handle share
                                        }}
                                        className="p-3 rounded-full bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm transition-all duration-200 hover:scale-110"
                                    >
                                        <FaShare />
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Content */}
                    <div className={`p-4 ${variant === 'horizontal' ? 'flex-1' : ''}`}>
                        <HoverCard hoverContent={hoverCardContent} delay={0.8}>
                            <div>
                                {/* Title */}
                                <motion.h3
                                    whileHover={{ color: '#6366f1' }}
                                    className="text-white font-semibold text-lg mb-2 line-clamp-2 transition-colors"
                                >
                                    {manga.title}
                                </motion.h3>

                                {/* Creator */}
                                <p className="text-gray-400 text-sm mb-3">
                                    by <span className="text-indigo-400 font-medium hover:text-indigo-300 transition-colors">{manga.creator}</span>
                                </p>

                                {/* Description for horizontal variant */}
                                {variant === 'horizontal' && manga.description && (
                                    <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                                        {manga.description}
                                    </p>
                                )}

                                {/* Genres */}
                                <div className="flex flex-wrap gap-1 mb-3">
                                    {manga.genres.slice(0, variant === 'horizontal' ? 4 : 3).map((genre, i) => (
                                        <motion.span
                                            key={genre}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.1 * i }}
                                            className="genre-tag text-xs hover:scale-105 transition-transform cursor-pointer"
                                        >
                                            {genre}
                                        </motion.span>
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
                                        <motion.div
                                            whileHover={{ scale: 1.1 }}
                                            className="flex items-center space-x-1"
                                        >
                                            <FaEye />
                                            <span>{manga.views?.toLocaleString() || '0'}</span>
                                        </motion.div>
                                        <motion.div
                                            whileHover={{ scale: 1.1 }}
                                            className="flex items-center space-x-1"
                                        >
                                            <FaBookmark />
                                            <span>{manga.chapters?.length || 0} ch</span>
                                        </motion.div>
                                    </div>
                                    {manga.lastUpdated && (
                                        <div className="flex items-center space-x-1 text-indigo-400">
                                            <FaClock />
                                            <span>Updated</span>
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex space-x-2">
                                    <RippleButton
                                        className="btn btn-primary btn-sm flex-1 justify-center group"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            // Handle read action
                                        }}
                                    >
                                        <FaPlay className="mr-2 group-hover:scale-110 transition-transform" />
                                        Read Now
                                    </RippleButton>

                                    {variant !== 'compact' && (
                                        <div className="flex space-x-1">
                                            <InteractiveLikeButton
                                                initialLiked={manga.isLiked}
                                                likeCount={manga.likes || 0}
                                                onLike={(liked) => onLike?.(manga._id, liked)}
                                            />

                                            <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                className="btn btn-ghost btn-sm px-3"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    // Handle add to list
                                                }}
                                            >
                                                <FaPlus />
                                            </motion.button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </HoverCard>
                    </div>
                </Link>

                {/* Floating Stats on Hover */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{
                        opacity: isHovered ? 1 : 0,
                        y: isHovered ? 0 : 20
                    }}
                    transition={{ duration: 0.3 }}
                    className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-2 space-y-1"
                >
                    <div className="flex items-center space-x-1 text-xs text-white">
                        <FaEye className="text-blue-400" />
                        <span>{manga.views?.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-xs text-white">
                        <FaHeart className="text-red-400" />
                        <span>{manga.likes || 0}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-xs text-white">
                        <FaStar className="text-yellow-400" />
                        <span>{manga.rating || 'N/A'}</span>
                    </div>
                </motion.div>
            </motion.div>
        </motion.div>
    );
}
