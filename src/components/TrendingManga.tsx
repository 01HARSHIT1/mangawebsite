"use client";
import Image from "next/image";
import Link from "next/link";
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

export default function TrendingManga({ manga }: { manga: any[] }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8" role="list" aria-label="Trending Manga List">
            {manga.length === 0 ? (
                <div className="col-span-full text-gray-400 text-base sm:text-lg p-6 sm:p-8 text-center" role="status" aria-live="polite">
                    No manga found in this section.
                </div>
            ) : manga.map((m, i) => (
                <Link
                    key={m._id ? m._id : `manga-${i}`}
                    href={`/manga/${m._id}`}
                    className="transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-blue-400/30 focus:scale-105 focus:shadow-blue-400/40 outline-none focus:ring-2 focus:ring-blue-400 rounded-xl sm:rounded-2xl"
                    aria-label={`View details for ${m.title}`}
                    tabIndex={0}
                    role="listitem"
                >
                    <div
                        className="bg-gray-900 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out cursor-pointer min-h-[280px] sm:min-h-[320px] flex flex-col"
                        title={m.title}
                        tabIndex={-1}
                    >
                        <div className="w-full h-32 sm:h-36 lg:h-40 rounded-lg sm:rounded-xl overflow-hidden mb-3 sm:mb-4 bg-gray-800 flex-shrink-0">
                            {m.coverImage ? (
                                <img src={m.coverImage} alt={m.title} width={120} height={180} className="object-cover w-full h-full" onError={e => { e.currentTarget.src = '/file.svg'; }} />
                            ) : (
                                <img src="/file.svg" alt={m.title} width={120} height={180} className="object-cover w-full h-full" />
                            )}
                        </div>

                        <div className="flex-1 flex flex-col">
                            <h3 className="font-bold text-sm sm:text-base lg:text-lg mb-2 line-clamp-2 leading-tight">
                                {m.title}
                            </h3>

                            <div className="text-gray-400 text-xs sm:text-sm mb-3 flex-1">
                                {m.genre && m.genre.split(',').slice(0, 2).map((g, idx) => {
                                    const genre = g.trim();
                                    if (!genre) return null;
                                    return (
                                        <span key={`${genre}-${idx}`} className="inline-block mr-2 mb-1">
                                            {genreIcons[genre] || null}
                                            <span className="align-middle">{genre}</span>
                                        </span>
                                    );
                                })}
                                {m.genre && m.genre.split(',').length > 2 && (
                                    <span className="text-gray-500 text-xs">+{m.genre.split(',').length - 2} more</span>
                                )}
                            </div>

                            <button
                                className="bg-blue-600 hover:bg-blue-500 text-white border-none rounded-lg px-3 sm:px-4 py-2 font-medium text-sm sm:text-base transition-colors focus:ring-2 focus:ring-blue-400 focus:outline-none min-h-[44px] mt-auto transition-transform duration-150 hover:scale-105 focus:scale-105"
                                onClick={e => { e.preventDefault(); window.location.href = `/manga/${m._id}`; }}
                                aria-label={`Read ${m.title}`}
                            >
                                Read
                            </button>
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    );
} 