import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { SvgIcon } from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite"; // Romance
import SportsMmaIcon from "@mui/icons-material/SportsMma"; // Action
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome"; // Fantasy
import TheaterComedyIcon from "@mui/icons-material/TheaterComedy"; // Comedy
import DramaMasksIcon from "@mui/icons-material/TheaterComedy"; // Drama (no direct, reuse Comedy)
import WbSunnyIcon from "@mui/icons-material/WbSunny"; // Slice of Life
import ExploreIcon from "@mui/icons-material/Explore"; // Adventure
import NightlightIcon from "@mui/icons-material/Nightlight"; // Horror
import ScienceIcon from "@mui/icons-material/Science"; // Sci-Fi
import SearchIcon from "@mui/icons-material/Search"; // Mystery
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh"; // Supernatural
import OptimizedImage from './OptimizedImage';

const genreIcons: Record<string, React.ReactNode> = {
    "Romance": <FavoriteIcon fontSize="small" className="text-pink-400 inline mr-1" />,
    "Action": <SportsMmaIcon fontSize="small" className="text-red-500 inline mr-1" />,
    "Fantasy": <AutoAwesomeIcon fontSize="small" className="text-purple-400 inline mr-1" />,
    "Drama": <DramaMasksIcon fontSize="small" className="text-yellow-400 inline mr-1" />,
    "Comedy": <TheaterComedyIcon fontSize="small" className="text-green-400 inline mr-1" />,
    "Slice of Life": <WbSunnyIcon fontSize="small" className="text-orange-300 inline mr-1" />,
    "Adventure": <ExploreIcon fontSize="small" className="text-blue-400 inline mr-1" />,
    "Horror": <NightlightIcon fontSize="small" className="text-gray-500 inline mr-1" />,
    "Sci-Fi": <ScienceIcon fontSize="small" className="text-cyan-400 inline mr-1" />,
    "Mystery": <SearchIcon fontSize="small" className="text-indigo-400 inline mr-1" />,
    "Supernatural": <AutoFixHighIcon fontSize="small" className="text-violet-400 inline mr-1" />,
};

export default function FeaturedCarousel({ manga }: { manga: any[] }) {
    const [idx, setIdx] = useState(0);

    if (!manga || manga.length === 0) return null;

    const next = () => setIdx(i => (i + 1) % manga.length);
    const prev = () => setIdx(i => (i - 1 + manga.length) % manga.length);

    return (
        <div className="relative w-full flex flex-col items-center">
            <div className="w-full flex justify-center items-center">
                {/* Previous Button */}
                <button
                    onClick={prev}
                    className="absolute left-2 sm:left-4 z-10 p-2 sm:p-3 text-xl sm:text-2xl text-white/70 hover:text-blue-400 focus:ring-2 focus:ring-blue-400 focus:outline-none bg-black/20 rounded-full backdrop-blur-sm min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label="Previous featured manga"
                >
                    &#8592;
                </button>

                {/* Main Carousel Card */}
                <div className="bg-gray-900 rounded-xl sm:rounded-2xl shadow-lg flex flex-col lg:flex-row items-center w-full max-w-4xl mx-auto overflow-hidden transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-blue-400/30 focus-within:scale-105 focus-within:shadow-blue-400/40 outline-none" tabIndex={0}>
                    {/* Image Section */}
                    <div className="flex-shrink-0 w-full lg:w-80 h-48 sm:h-64 lg:h-80 relative">
                        <img src={manga[idx].coverImage || '/file.svg'} alt={manga[idx].title} className="object-cover w-full h-full" style={{ width: '100%', height: '100%' }} onError={e => { e.currentTarget.src = '/file.svg'; }} />
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col justify-center">
                        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 sm:mb-3">{manga[idx].title}</h2>

                        <div className="text-gray-400 mb-3 text-sm sm:text-base">
                            {manga[idx].genre && manga[idx].genre.split(',').slice(0, 3).map((g: string, i: number) => {
                                const genre = g.trim();
                                if (!genre) return null;
                                return (
                                    <span key={`${genre}-${i}`} className="inline-block mr-2 mb-1">
                                        {genreIcons[genre] || null}
                                        <span className="align-middle">{genre}</span>
                                    </span>
                                );
                            })}
                            {manga[idx].genre && manga[idx].genre.split(',').length > 3 && (
                                <span className="text-gray-500 text-xs">+{manga[idx].genre.split(',').length - 3} more</span>
                            )}
                        </div>

                        <div className="mb-4 text-xs sm:text-sm text-gray-300 line-clamp-2 sm:line-clamp-3 leading-relaxed">
                            {manga[idx].description}
                        </div>

                        <Link
                            href={`/manga/${manga[idx]._id}`}
                            className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg px-4 sm:px-6 py-2 sm:py-3 mt-2 focus:ring-2 focus:ring-blue-400 focus:outline-none transition-colors text-sm sm:text-base min-h-[44px] flex items-center justify-center"
                            aria-label={`Read ${manga[idx].title}`}
                        >
                            Read Now
                        </Link>
                    </div>
                </div>

                {/* Next Button */}
                <button
                    onClick={next}
                    className="absolute right-2 sm:right-4 z-10 p-2 sm:p-3 text-xl sm:text-2xl text-white/70 hover:text-blue-400 focus:ring-2 focus:ring-blue-400 focus:outline-none bg-black/20 rounded-full backdrop-blur-sm min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label="Next featured manga"
                >
                    &#8594;
                </button>
            </div>

            {/* Dots Indicator */}
            <div className="flex gap-2 mt-4 sm:mt-6">
                {manga.map((m, i) => (
                    <button
                        key={m._id ? m._id : `dot-${i}`}
                        onClick={() => setIdx(i)}
                        className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-colors ${i === idx ? 'bg-blue-500' : 'bg-gray-500 hover:bg-gray-400'}`}
                        aria-label={`Go to slide ${i + 1}`}
                    />
                ))}
            </div>
        </div>
    );
} 