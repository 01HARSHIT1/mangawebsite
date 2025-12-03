'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Star, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface AnimeSeries {
    _id: string;
    title: string;
    coverImage: string;
    description?: string;
    genres?: string[];
    episodes?: number;
    status?: string;
    rating: number;
    type?: string;
    latestEpisode?: number;
    episodeCount?: number;
}

interface EpisodeCardProps {
    anime: AnimeSeries;
    episodeNumber?: number;
    progress?: number;
}

export default function EpisodeCard({ anime, episodeNumber, progress }: EpisodeCardProps) {
    const watchLink = episodeNumber 
        ? `/anime/${anime._id}/episode/${episodeNumber}` 
        : `/anime/${anime._id}`;

    return (
        <motion.div
            whileHover={{ scale: 1.05, y: -8 }}
            whileTap={{ scale: 0.98 }}
            className="group relative w-full rounded-xl overflow-hidden bg-gradient-to-br from-orange-950/50 to-red-950/50 border border-orange-500/20 hover:border-orange-500/50 transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-orange-500/20"
        >
            <Link href={watchLink}>
                <div className="relative w-full aspect-[2/3] overflow-hidden">
                    <Image
                        src={anime.coverImage}
                        alt={anime.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <motion.div
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-2xl shadow-orange-500/50"
                        >
                            <Play className="w-8 h-8 text-white fill-white ml-1" />
                        </motion.div>
                    </div>

                    {/* Episode Badge */}
                    {episodeNumber && (
                        <div className="absolute top-3 left-3 px-2.5 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-black rounded-md shadow-lg">
                            EP {episodeNumber}
                        </div>
                    )}

                    {/* Rating Badge */}
                    <div className="absolute top-3 right-3 px-2.5 py-1 bg-black/70 backdrop-blur-sm text-yellow-400 text-xs font-bold rounded-md flex items-center space-x-1 border border-yellow-500/30">
                        <Star className="w-3 h-3 fill-yellow-400" />
                        <span>{anime.rating?.toFixed(1) || 'N/A'}</span>
                    </div>

                    {/* Progress Bar */}
                    {progress !== undefined && (
                        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/50">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.5 }}
                                className="h-full bg-gradient-to-r from-orange-500 to-red-500"
                            />
                        </div>
                    )}
                </div>

                {/* Card Info */}
                <div className="p-4 bg-gradient-to-br from-black/80 to-black/60 backdrop-blur-sm">
                    <h3 className="text-white font-bold text-sm mb-2 line-clamp-2 group-hover:text-orange-400 transition-colors">
                        {anime.title}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                        <div className="flex items-center space-x-2">
                            {anime.episodes && (
                                <>
                                    <Clock className="w-3 h-3" />
                                    <span>{anime.episodes} Eps</span>
                                </>
                            )}
                        </div>
                        {anime.status && (
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                anime.status === 'ongoing' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                                anime.status === 'completed' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                            }`}>
                                {anime.status.toUpperCase()}
                            </span>
                        )}
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}
