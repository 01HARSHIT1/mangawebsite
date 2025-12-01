'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Play, Star, Clock } from 'lucide-react';

interface AnimeSeries {
    _id: string;
    title: string;
    description?: string;
    coverImage: string;
    genres?: string[];
    rating: number;
    year?: number;
    status?: 'ongoing' | 'completed' | 'upcoming';
    episodeCount?: number;
    latestEpisode?: number;
}

interface EpisodeCardProps {
    anime: AnimeSeries;
}

export default function EpisodeCard({ anime }: EpisodeCardProps) {
    return (
        <Link href={`/anime/${anime._id}`} className="group">
            <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-800 mb-2">
                <Image
                    src={anime.coverImage || '/placeholder.svg'}
                    alt={anime.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                {/* Play Overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
                        <Play className="w-8 h-8 text-white ml-1" />
                    </div>
                </div>

                {/* Rating Badge */}
                <div className="absolute top-2 right-2 flex items-center space-x-1 bg-gray-900/80 px-2 py-1 rounded-full">
                    <Star className="w-3 h-3 text-yellow-400 fill-current" />
                    <span className="text-xs font-semibold text-white">{anime.rating.toFixed(1)}</span>
                </div>

                {/* Status Badge */}
                {anime.status && (
                    <div className="absolute top-2 left-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            anime.status === 'ongoing' ? 'bg-green-600 text-white' :
                            anime.status === 'completed' ? 'bg-blue-600 text-white' :
                            'bg-yellow-600 text-white'
                        }`}>
                            {anime.status === 'ongoing' ? 'Ongoing' : anime.status === 'completed' ? 'Completed' : 'Upcoming'}
                        </span>
                    </div>
                )}
            </div>

            <h3 className="text-white font-semibold text-sm mb-1 line-clamp-2 group-hover:text-red-400 transition-colors">
                {anime.title}
            </h3>

            <div className="flex items-center space-x-3 text-xs text-gray-400">
                {anime.year && <span>{anime.year}</span>}
                {anime.episodeCount && (
                    <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{anime.episodeCount} eps</span>
                    </div>
                )}
            </div>
        </Link>
    );
}

