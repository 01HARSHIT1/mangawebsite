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

            {/* Navigation Buttons */}
            <button
                onClick={() => scroll('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 bg-gray-900/80 hover:bg-gray-800 rounded-full flex items-center justify-center transition-all z-10"
            >
                <ChevronLeft className="w-6 h-6 text-white" />
            </button>
            <button
                onClick={() => scroll('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 bg-gray-900/80 hover:bg-gray-800 rounded-full flex items-center justify-center transition-all z-10"
            >
                <ChevronRight className="w-6 h-6 text-white" />
            </button>
        </div>
    );
}

