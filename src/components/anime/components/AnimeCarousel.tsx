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
                className="flex space-x-3 sm:space-x-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4 touch-pan-x"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
            >
                {anime.map((item) => (
                    <div key={item._id} className="flex-shrink-0 w-[160px] sm:w-[200px] md:w-[240px] lg:w-[280px]">
                        <EpisodeCard anime={item} />
                    </div>
                ))}
            </div>

            {/* Navigation Buttons - Responsive, hidden on mobile */}
            <button
                onClick={() => scroll('left')}
                className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-6 w-10 h-10 md:w-12 md:h-12 bg-black/80 backdrop-blur-sm hover:bg-orange-500/20 active:bg-orange-500/30 border border-orange-500/30 rounded-full items-center justify-center transition-all z-10 group touch-manipulation"
                aria-label="Scroll left"
            >
                <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-orange-400 group-hover:text-orange-300" />
            </button>
            <button
                onClick={() => scroll('right')}
                className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-6 w-10 h-10 md:w-12 md:h-12 bg-black/80 backdrop-blur-sm hover:bg-orange-500/20 active:bg-orange-500/30 border border-orange-500/30 rounded-full items-center justify-center transition-all z-10 group touch-manipulation"
                aria-label="Scroll right"
            >
                <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-orange-400 group-hover:text-orange-300" />
            </button>
        </div>
    );
}

