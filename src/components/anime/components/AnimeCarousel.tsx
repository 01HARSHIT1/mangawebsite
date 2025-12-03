'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import EpisodeCard from './EpisodeCard';

interface AnimeSeries {
    _id: string;
    title: string;
    description: string;
    coverImage: string;
    bannerImage?: string;
    genres: string[];
    rating: number;
    year: number;
    status: 'ongoing' | 'completed' | 'upcoming';
    episodeCount: number;
    latestEpisode?: number;
}

interface AnimeCarouselProps {
    anime: AnimeSeries[];
}

export default function AnimeCarousel({ anime }: AnimeCarouselProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = 400;
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth',
            });
        }
    };

    if (anime.length === 0) {
        return null;
    }

    return (
        <div className="relative">
            <div
                ref={scrollRef}
                className="flex space-x-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {anime.map((item) => (
                    <div key={item._id} className="flex-shrink-0 w-[280px]">
                        <EpisodeCard anime={item} />
                    </div>
                ))}
            </div>

            {/* Navigation Buttons - Crunchyroll Style */}
            <button
                onClick={() => scroll('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 w-12 h-12 bg-black/80 backdrop-blur-sm hover:bg-orange-500/20 border border-orange-500/30 rounded-full flex items-center justify-center transition-all z-10 group"
            >
                <ChevronLeft className="w-6 h-6 text-orange-400 group-hover:text-orange-300" />
            </button>
            <button
                onClick={() => scroll('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-6 w-12 h-12 bg-black/80 backdrop-blur-sm hover:bg-orange-500/20 border border-orange-500/30 rounded-full flex items-center justify-center transition-all z-10 group"
            >
                <ChevronRight className="w-6 h-6 text-orange-400 group-hover:text-orange-300" />
            </button>
        </div>
    );
}

