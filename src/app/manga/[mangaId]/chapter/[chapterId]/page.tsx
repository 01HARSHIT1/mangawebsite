"use client";
import { useEffect, useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaArrowLeft, FaBookmark, FaRegBookmark, FaSpinner, FaHeart, FaRegHeart, FaChevronLeft, FaChevronRight, FaExpand, FaCompress, FaEye, FaEyeSlash, FaPlay, FaPause, FaCog, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import AdSlot from '@/components/AdSlot';
import OptimizedImage from '@/components/OptimizedImage';
const ChapterComments = dynamic(() => import('@/components/ChapterComments'), { ssr: false });

// Reading mode types
type ReadingMode = 'vertical' | 'horizontal' | 'single';
type ZoomLevel = 0.5 | 0.75 | 1 | 1.25 | 1.5 | 2;

export default function ChapterPage({ params }: { params: { mangaId: string, chapterId: string } }) {
    const [chapter, setChapter] = useState<any>(null);
    const [allChapters, setAllChapters] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        Promise.all([
            fetch(`/api/chapters/${params.chapterId}`).then(res => res.json()),
            fetch(`/api/chapters?mangaId=${params.mangaId}`).then(res => res.json())
        ]).then(([chapterData, allChaptersData]) => {
            setChapter(chapterData);
            setAllChapters(Array.isArray(allChaptersData.chapters) ? allChaptersData.chapters : []);
            setLoading(false);
        });
    }, [params.chapterId, params.mangaId]);

    if (loading) return (
        <div className="max-w-4xl mx-auto px-2 sm:px-4 pt-4 sm:pt-8 pb-16">
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="w-full flex justify-center mb-4 sm:mb-8 animate-pulse">
                    <div className="rounded-lg shadow-lg bg-gray-800 w-full max-w-md sm:max-w-lg lg:max-w-2xl" style={{ height: '60vh', maxHeight: 900 }} />
                </div>
            ))}
            <div className="text-white p-6 sm:p-10 text-center">
                <FaSpinner className="animate-spin text-blue-400 text-2xl sm:text-3xl mx-auto mb-2" />
                <span className="text-sm sm:text-base">Loading...</span>
            </div>
        </div>
    );
    if (!chapter) return <div className="text-white p-6 sm:p-10 text-center">Chapter not found.</div>;
    return <ChapterClient chapter={chapter} params={params} allChapters={allChapters} />;
}

function ChapterClient({ chapter, params, allChapters }: { chapter: any, params: { mangaId: string, chapterId: string }, allChapters: any[] }) {
    const [role, setRole] = useState<string | null>(null);
    const [bookmarked, setBookmarked] = useState(false);
    const [loading, setLoading] = useState(true);
    const [feedback, setFeedback] = useState('');
    const [pages, setPages] = useState<string[]>(chapter.pages || []);
    const [currentIdx, setCurrentIdx] = useState(() => allChapters.findIndex((c: any) => c._id.toString() === params.chapterId));
    const [autoLoading, setAutoLoading] = useState(false);
    const [endReached, setEndReached] = useState(false);
    const [showMobileNav, setShowMobileNav] = useState(false);
    const observer = useRef<IntersectionObserver | null>(null);
    const lastImgRef = useRef<HTMLDivElement | null>(null);
    const startTimeRef = useRef<number | null>(null);
    const [imgLoaded, setImgLoaded] = useState<boolean[]>(() => Array((chapter.pages || []).length).fill(false));
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(chapter.likes ? chapter.likes.length : 0);
    const [viewCount, setViewCount] = useState<number | null>(typeof chapter.views === 'number' ? chapter.views : null);
    const feedbackRef = useRef<HTMLSpanElement>(null);
    const [unlocked, setUnlocked] = useState(false);
    const [coinPrice, setCoinPrice] = useState(chapter.coinPrice || 0);
    const [unlockLoading, setUnlockLoading] = useState(false);
    const [unlockError, setUnlockError] = useState('');
    const [showUnlockSuccess, setShowUnlockSuccess] = useState(false);

    // Advanced Reader Features
    const [readingMode, setReadingMode] = useState<ReadingMode>('vertical');
    const [zoomLevel, setZoomLevel] = useState<ZoomLevel>(1);
    const [currentPage, setCurrentPage] = useState(0);
    const [showControls, setShowControls] = useState(true);
    const [autoScroll, setAutoScroll] = useState(false);
    const [autoScrollSpeed, setAutoScrollSpeed] = useState(50); // pixels per second
    const [autoScrollInterval, setAutoScrollInterval] = useState<NodeJS.Timeout | null>(null);
    const [showSettings, setShowSettings] = useState(false);
    const [muted, setMuted] = useState(false);
    const [readingProgress, setReadingProgress] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const [fullscreen, setFullscreen] = useState(false);

    // Preload next images
    const preloadImages = useCallback((imgs: string[]) => {
        imgs.forEach(src => {
            const img = new window.Image();
            img.src = src;
        });
    }, []);

    useEffect(() => {
        if (pages.length > 0) {
            preloadImages(pages.slice(0, 3));
        }
    }, [pages, preloadImages]);

    // Auto-scroll functionality
    useEffect(() => {
        if (autoScroll && readingMode === 'vertical') {
            const interval = setInterval(() => {
                if (containerRef.current) {
                    containerRef.current.scrollTop += autoScrollSpeed / 10;
                }
            }, 100);
            setAutoScrollInterval(interval);
            return () => clearInterval(interval);
        } else if (autoScrollInterval) {
            clearInterval(autoScrollInterval);
            setAutoScrollInterval(null);
        }
    }, [autoScroll, autoScrollSpeed, readingMode]);

    // Reading progress calculation
    useEffect(() => {
        const handleScroll = () => {
            if (containerRef.current && pages.length > 0) {
                const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
                const progress = Math.min((scrollTop / (scrollHeight - clientHeight)) * 100, 100);
                setReadingProgress(progress);
            }
        };

        const container = containerRef.current;
        if (container) {
            container.addEventListener('scroll', handleScroll);
            return () => container.removeEventListener('scroll', handleScroll);
        }
    }, [pages.length]);

    // Fullscreen functionality
    useEffect(() => {
        const handleFullscreenChange = () => {
            setFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const toggleFullscreen = async () => {
        if (!document.fullscreenElement) {
            await document.documentElement.requestFullscreen();
        } else {
            await document.exitFullscreen();
        }
    };

    // Keyboard shortcuts for reader controls
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') {
                if (readingMode === 'horizontal' || readingMode === 'single') {
                    setCurrentPage(prev => Math.max(0, prev - 1));
                } else {
                    navigateChapter('prev');
                }
            } else if (e.key === 'ArrowRight') {
                if (readingMode === 'horizontal' || readingMode === 'single') {
                    setCurrentPage(prev => Math.min(pages.length - 1, prev + 1));
                } else {
                    navigateChapter('next');
                }
            } else if (e.key === 'ArrowUp') {
                if (readingMode === 'vertical') {
                    setCurrentPage(prev => Math.max(0, prev - 1));
                }
            } else if (e.key === 'ArrowDown') {
                if (readingMode === 'vertical') {
                    setCurrentPage(prev => Math.min(pages.length - 1, prev + 1));
                }
            } else if (e.key === 'b' || e.key === 'B') {
                handleBookmark();
            } else if (e.key === 'f' || e.key === 'F') {
                toggleFullscreen();
            } else if (e.key === 'c' || e.key === 'C') {
                setShowControls(prev => !prev);
            } else if (e.key === 's' || e.key === 'S') {
                setShowSettings(prev => !prev);
            } else if (e.key === 'a' || e.key === 'A') {
                setAutoScroll(prev => !prev);
            } else if (e.key === 'm' || e.key === 'M') {
                setMuted(prev => !prev);
            } else if (e.key === 'Escape') {
                if (showSettings) setShowSettings(false);
                if (showControls) setShowControls(false);
                if (document.fullscreenElement) document.exitFullscreen();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [readingMode, pages.length, currentPage]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetch('/api/profile', { headers: { Authorization: `Bearer ${token}` } })
                .then(res => res.json())
                .then(data => {
                    setRole(data.user?.role || null);
                    // Check for chapter bookmark
                    if (data.user && data.user.bookmarks && Array.isArray(data.user.bookmarks)) {
                        setBookmarked(data.user.bookmarks.some((b: any) => typeof b === 'object' && b.chapterId === params.chapterId));
                        setLiked(chapter.likes && Array.isArray(chapter.likes) && chapter.likes.includes(data.user.id));
                    }
                    // Check if chapter is unlocked
                    if (data.user && Array.isArray(data.user.unlockedChapters) && data.user.unlockedChapters.includes(params.chapterId)) {
                        setUnlocked(true);
                    }
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }
        // Increment view count in chapter document
        fetch(`/api/chapters/${params.chapterId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'incrementView' })
        }).then(() => setViewCount(v => (typeof v === 'number' ? v + 1 : 1)));
        // Record reading history
        if (token) {
            fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ action: 'recordReading', mangaId: params.mangaId, chapterId: params.chapterId })
            });
        }
        startTimeRef.current = Date.now();
        return () => {
            const endTime = Date.now();
            const duration = endTime - (startTimeRef.current || endTime);
            if (duration > 5000 && token) {
                fetch('/api/profile', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ action: 'completeReading', mangaId: params.mangaId, chapterId: params.chapterId })
                });
            }
        };
    }, [params.mangaId, params.chapterId]);

    // Infinite scroll: auto-load next episode
    useEffect(() => {
        if (!lastImgRef.current) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && !endReached && !autoLoading) {
                handleAutoNext();
            }
        }, { threshold: 0.8 });
        observer.current.observe(lastImgRef.current);
        return () => observer.current?.disconnect();
        // eslint-disable-next-line
    }, [pages, autoLoading, endReached]);

    const handleAutoNext = async () => {
        if (autoLoading || endReached) return;
        setAutoLoading(true);
        // Find next episode
        const nextIdx = currentIdx + 1;
        if (nextIdx < allChapters.length) {
            const nextId = allChapters[nextIdx]._id.toString();
            const res = await fetch(`/api/chapters/${nextId}`);
            if (res.ok) {
                const data = await res.json();
                if (data.pages && data.pages.length > 0) {
                    setPages(p => [...p, ...data.pages]);
                    setCurrentIdx(nextIdx);
                    preloadImages(data.pages.slice(0, 3));
                } else {
                    setEndReached(true);
                }
            } else {
                setEndReached(true);
            }
        } else {
            setEndReached(true);
        }
        setAutoLoading(false);
    };

    const handleBookmark = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        setLoading(true);
        await fetch('/api/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ action: bookmarked ? 'removeChapterBookmark' : 'addChapterBookmark', mangaId: params.mangaId, chapterId: params.chapterId })
        });
        setBookmarked(b => !b);
        setFeedback(bookmarked ? 'Bookmark removed!' : 'Bookmarked!');
        if (feedbackRef.current) feedbackRef.current.focus();
        setTimeout(() => setFeedback(''), 1200);
        setLoading(false);
    };

    const handleLike = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        setLoading(true);
        // Resolve userId from profile to ensure correct like attribution
        let userId: string | null = null;
        try {
            const profileRes = await fetch('/api/profile', { headers: { Authorization: `Bearer ${token}` } });
            const profileData = await profileRes.json();
            userId = profileData?.user?.id || null;
        } catch {}
        const res = await fetch(`/api/chapters/${params.chapterId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ action: liked ? 'unlike' : 'like', userId })
        });
        if (res.ok) {
            setLiked(l => !l);
            setLikeCount((c: number) => liked ? c - 1 : c + 1);
            setFeedback(liked ? 'Like removed!' : 'Liked!');
            if (feedbackRef.current) feedbackRef.current.focus();
            setTimeout(() => setFeedback(''), 1200);
        }
        setLoading(false);
    };

    const handleUnlock = async () => {
        setUnlockLoading(true);
        setUnlockError('');
        const token = localStorage.getItem('token');
        if (!token) { setUnlockError('You must be logged in.'); setUnlockLoading(false); return; }
        const res = await fetch(`/api/chapters/${params.chapterId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok && data.success) {
            setUnlocked(true);
            setFeedback('Chapter unlocked!');
            setShowUnlockSuccess(true);
            setTimeout(() => setFeedback(''), 1200);
        } else {
            setUnlockError(data.error || 'Failed to unlock');
        }
        setUnlockLoading(false);
    };

    const navigateChapter = (direction: 'prev' | 'next') => {
        if (direction === 'prev' && currentIdx > 0) {
            window.location.href = `/manga/${params.mangaId}/chapter/${allChapters[currentIdx - 1]._id}`;
        } else if (direction === 'next' && currentIdx < allChapters.length - 1) {
            window.location.href = `/manga/${params.mangaId}/chapter/${allChapters[currentIdx + 1]._id}`;
        }
    };

    // Only show if published, unless creator/admin
    const isScheduled = chapter.publishDate && new Date(chapter.publishDate) > new Date();
    if (isScheduled && role !== 'creator' && role !== 'admin') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white p-4">
                <div className="text-center">
                    <div className="text-4xl mb-4">⏰</div>
                    <h2 className="text-xl sm:text-2xl font-bold mb-2">Chapter Scheduled</h2>
                    <p className="text-gray-400 text-sm sm:text-base">
                        This episode is scheduled for {new Date(chapter.publishDate).toLocaleString()}.
                    </p>
                </div>
            </div>
        );
    }

    // Paid/early access logic
    if (coinPrice > 0 && !unlocked && role !== 'creator' && role !== 'admin') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white p-4">
                <div className="bg-gray-900 rounded-xl sm:rounded-2xl shadow-2xl p-6 sm:p-10 max-w-md w-full text-center">
                    <h2 className="text-xl sm:text-2xl font-bold mb-4 text-yellow-400">Paid Chapter</h2>
                    <div className="text-base sm:text-lg mb-4">Unlock this chapter for <span className="text-yellow-300 font-bold">{coinPrice} Coins</span></div>
                    {unlockError && <div className="text-red-400 mb-2 text-sm sm:text-base" role="status">{unlockError}</div>}
                    <button
                        onClick={handleUnlock}
                        disabled={unlockLoading}
                        className="w-full py-3 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold text-base sm:text-lg shadow focus:ring-2 focus:ring-yellow-500 focus:outline-none transition min-h-[44px]"
                        aria-label="Unlock with Coins"
                    >
                        {unlockLoading ? 'Unlocking...' : `Unlock with Coins`}
                    </button>
                    <button
                        onClick={() => window.location.href = '/profile'}
                        className="mt-4 px-6 sm:px-8 py-2 sm:py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-sm sm:text-base min-h-[44px]"
                    >
                        Go to Profile
                    </button>
                </div>

                {/* Unlock Success Modal & Confetti */}
                {showUnlockSuccess && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                        <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl p-6 sm:p-10 max-w-md w-full text-center relative">
                            <span className="absolute top-2 sm:top-4 right-2 sm:right-4 text-gray-400 hover:text-red-400 text-xl sm:text-2xl font-bold cursor-pointer" onClick={() => setShowUnlockSuccess(false)}>&times;</span>
                            <div className="text-3xl sm:text-4xl mb-4" aria-hidden="true">🎉🎊✨</div>
                            <h2 className="text-xl sm:text-2xl font-bold mb-2 text-yellow-500">Unlocked!</h2>
                            <div className="text-base sm:text-lg mb-2 text-gray-800">You've unlocked this chapter for <span className="text-yellow-500 font-bold">{coinPrice} Coins</span>.</div>
                            <div className="text-green-600 font-bold mb-4 text-sm sm:text-base" role="status" aria-live="polite">Enjoy your reading!</div>
                            <button
                                onClick={() => setShowUnlockSuccess(false)}
                                className="mt-4 px-6 sm:px-8 py-3 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold rounded-lg focus:ring-2 focus:ring-yellow-500 focus:outline-none transition text-base sm:text-lg min-h-[44px]"
                            >
                                Continue Reading
                            </button>
                        </div>
                        {/* Simple confetti effect (emoji fallback) */}
                        <div className="fixed inset-0 pointer-events-none z-40">
                            {Array.from({ length: 20 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="absolute animate-bounce text-2xl"
                                    style={{
                                        left: `${Math.random() * 100}%`,
                                        top: `${Math.random() * 100}%`,
                                        animationDelay: `${Math.random() * 2}s`,
                                        animationDuration: `${1 + Math.random() * 2}s`
                                    }}
                                    aria-hidden="true"
                                >
                                    {['🎉', '🎊', '✨', '💫', '🌟'][Math.floor(Math.random() * 5)]}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Render different reading modes
    const renderReadingContent = () => {
        switch (readingMode) {
            case 'horizontal':
                return (
                    <div className="flex overflow-x-auto snap-x snap-mandatory h-screen">
                        {pages.map((img: string, i: number) => (
                            <div key={i} className="flex-shrink-0 w-full h-full snap-center flex items-center justify-center">
                                <OptimizedImage
                                    src={img}
                                    alt={`Page ${i + 1} of chapter ${chapter.chapterNumber}`}
                                    width={800}
                                    height={1200}
                                    className="max-h-full max-w-full object-contain"
                                    style={{ transform: `scale(${zoomLevel})` }}
                                    loading={i < 3 ? 'eager' : 'lazy'}
                                    quality={80}
                                    priority={i < 2}
                                    fallbackSrc="/file.svg"
                                />
                            </div>
                        ))}
                    </div>
                );
            case 'single':
                return (
                    <div className="flex items-center justify-center h-screen">
                        {pages[currentPage] && (
                            <div className="relative">
                                <OptimizedImage
                                    src={pages[currentPage]}
                                    alt={`Page ${currentPage + 1} of chapter ${chapter.chapterNumber}`}
                                    width={800}
                                    height={1200}
                                    className="max-h-full max-w-full object-contain"
                                    style={{ transform: `scale(${zoomLevel})` }}
                                    quality={80}
                                    priority={true}
                                    fallbackSrc="/file.svg"
                                />
                            </div>
                        )}
                    </div>
                );
            default: // vertical
                return (
                    <div
                        ref={containerRef}
                        className="flex flex-col gap-4 sm:gap-6 overflow-y-auto"
                        style={{ height: fullscreen ? '100vh' : 'calc(100vh - 120px)' }}
                    >
                        {pages.map((img: string, i: number) => (
                            <motion.div
                                key={i}
                                ref={i === pages.length - 1 ? lastImgRef : undefined}
                                className="w-full flex justify-center"
                                initial={{ opacity: 0, y: 24 }}
                                animate={{ opacity: imgLoaded[i] ? 1 : 0, y: imgLoaded[i] ? 0 : 24 }}
                                transition={{ duration: 0.5, delay: i * 0.05 }}
                            >
                                <div className="relative w-full max-w-md sm:max-w-lg lg:max-w-2xl">
                                    <OptimizedImage
                                        src={img}
                                        alt={`Page ${i + 1} of chapter ${chapter.chapterNumber}`}
                                        width={600}
                                        height={900}
                                        className="rounded-lg shadow-lg transition-all duration-300 hover:scale-105 focus:scale-105 outline-none w-full h-auto"
                                        style={{ transform: `scale(${zoomLevel})` }}
                                        loading={i < 3 ? 'eager' : 'lazy'}
                                        quality={80}
                                        unoptimized={false}
                                        priority={i < 2}
                                        fallbackSrc="/file.svg"
                                        tabIndex={0}
                                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 90vw, (max-width: 1024px) 80vw, 600px"
                                        onLoad={() => setImgLoaded(prev => { const next = [...prev]; next[i] = true; return next; })}
                                    />
                                    {!imgLoaded[i] && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 rounded-lg">
                                            <FaSpinner className="animate-spin text-blue-400 text-2xl sm:text-3xl" />
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                );
        }
    };

    return (
        <div className="bg-gray-900 min-h-screen text-white font-sans relative">
            {/* Reading Progress Bar */}
            <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gray-800">
                <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${readingProgress}%` }}
                    aria-label={`Reading progress: ${Math.round(readingProgress)}%`}
                />
            </div>

            {/* Sticky nav */}
            <div className="sticky top-0 z-30 bg-gray-900/90 backdrop-blur flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-800" role="navigation" aria-label="Chapter Navigation">
                <Link href={`/manga/${params.mangaId}`} className="flex items-center gap-1 sm:gap-2 text-blue-400 hover:text-blue-300 focus:ring-2 focus:ring-blue-400 focus:outline-none text-sm sm:text-base" aria-label="Back to Series">
                    <FaArrowLeft className="text-sm sm:text-base" />
                    <span className="hidden sm:inline">Back to Series</span>
                    <span className="sm:hidden">Back</span>
                </Link>

                {/* Mobile Navigation Toggle */}
                <button
                    onClick={() => setShowMobileNav(!showMobileNav)}
                    className="sm:hidden p-2 text-white hover:text-blue-400 transition focus:outline-blue-400 focus-visible:ring-2 focus-visible:ring-blue-400"
                    aria-label="Toggle mobile navigation"
                    aria-expanded={showMobileNav}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>

                {/* Desktop Actions */}
                <div className="hidden sm:flex items-center gap-3 sm:gap-4">
                    <button
                        onClick={handleLike}
                        disabled={loading}
                        className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg ${liked ? 'bg-pink-600' : 'bg-gray-700'} hover:bg-pink-500 text-white font-semibold focus:ring-2 focus:ring-pink-400 focus:outline-none transition min-h-[44px]`}
                        aria-label={liked ? 'Unlike' : 'Like'}
                        title={liked ? 'Unlike this chapter' : 'Like this chapter'}
                        style={{ transition: 'transform 0.2s', transform: feedback === 'Liked!' ? 'scale(1.15)' : 'scale(1)' }}
                    >
                        {liked ? <FaHeart style={{ animation: feedback === 'Liked!' ? 'pulse 0.4s' : undefined }} /> : <FaRegHeart />}
                        <span className="hidden lg:inline">{likeCount}</span>
                    </button>
                    <button
                        onClick={handleBookmark}
                        disabled={loading}
                        className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold focus:ring-2 focus:ring-blue-400 focus:outline-none transition min-h-[44px]"
                        aria-label={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
                        title={bookmarked ? 'Remove bookmark' : 'Bookmark this chapter'}
                        style={{ transition: 'transform 0.2s', transform: feedback === 'Bookmarked!' ? 'scale(1.15)' : 'scale(1)' }}
                    >
                        {bookmarked ? <FaBookmark style={{ animation: feedback === 'Bookmarked!' ? 'pulse 0.4s' : undefined }} /> : <FaRegBookmark />}
                        <span className="hidden lg:inline">{bookmarked ? 'Bookmarked' : 'Bookmark'}</span>
                    </button>
                    {feedback && <span ref={feedbackRef} tabIndex={-1} className="text-yellow-400 font-semibold ml-2 text-sm" role="status" aria-live="polite">{feedback}</span>}
                </div>
            </div>

            {/* Mobile Navigation Menu */}
            {showMobileNav && (
                <div className="sm:hidden bg-gray-800/95 backdrop-blur-md border-b border-gray-700">
                    <div className="px-4 py-3 space-y-3">
                        <div className="flex justify-between items-center">
                            <button
                                onClick={() => navigateChapter('prev')}
                                disabled={currentIdx === 0}
                                className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors disabled:opacity-50 min-h-[44px]"
                                aria-label="Previous chapter"
                            >
                                <FaChevronLeft />
                                <span>Previous</span>
                            </button>
                            <button
                                onClick={() => navigateChapter('next')}
                                disabled={currentIdx === allChapters.length - 1}
                                className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors disabled:opacity-50 min-h-[44px]"
                                aria-label="Next chapter"
                            >
                                <span>Next</span>
                                <FaChevronRight />
                            </button>
                        </div>
                        <div className="flex justify-between items-center">
                            <button
                                onClick={handleLike}
                                disabled={loading}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-700 hover:bg-pink-500 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-pink-400 transition min-h-[44px]"
                                aria-label={liked ? 'Unlike' : 'Like'}
                            >
                                {liked ? <FaHeart /> : <FaRegHeart />}
                                <span>{likeCount}</span>
                            </button>
                            <button
                                onClick={handleBookmark}
                                disabled={loading}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 transition min-h-[44px]"
                                aria-label={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
                            >
                                {bookmarked ? <FaBookmark /> : <FaRegBookmark />}
                                <span>{bookmarked ? 'Bookmarked' : 'Bookmark'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reader Controls */}
            {showControls && (
                <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40 bg-gray-800/90 backdrop-blur rounded-lg p-3 shadow-lg">
                    <div className="flex items-center gap-2 sm:gap-4">
                        {/* Reading Mode */}
                        <select
                            value={readingMode}
                            onChange={(e) => setReadingMode(e.target.value as ReadingMode)}
                            className="bg-gray-700 text-white rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                            aria-label="Reading mode"
                        >
                            <option value="vertical">Vertical</option>
                            <option value="horizontal">Horizontal</option>
                            <option value="single">Single</option>
                        </select>

                        {/* Zoom Controls */}
                        <select
                            value={zoomLevel}
                            onChange={(e) => setZoomLevel(Number(e.target.value) as ZoomLevel)}
                            className="bg-gray-700 text-white rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                            aria-label="Zoom level"
                        >
                            <option value={0.5}>50%</option>
                            <option value={0.75}>75%</option>
                            <option value={1}>100%</option>
                            <option value={1.25}>125%</option>
                            <option value={1.5}>150%</option>
                            <option value={2}>200%</option>
                        </select>

                        {/* Auto-scroll */}
                        <button
                            onClick={() => setAutoScroll(!autoScroll)}
                            className={`p-2 rounded ${autoScroll ? 'bg-green-600' : 'bg-gray-700'} hover:bg-green-500 text-white focus:ring-2 focus:ring-green-400 focus:outline-none transition`}
                            aria-label={autoScroll ? 'Stop auto-scroll' : 'Start auto-scroll'}
                            title={autoScroll ? 'Stop auto-scroll' : 'Start auto-scroll'}
                        >
                            {autoScroll ? <FaPause /> : <FaPlay />}
                        </button>

                        {/* Fullscreen */}
                        <button
                            onClick={toggleFullscreen}
                            className="p-2 rounded bg-gray-700 hover:bg-gray-600 text-white focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
                            aria-label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                            title={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                        >
                            {fullscreen ? <FaCompress /> : <FaExpand />}
                        </button>

                        {/* Settings */}
                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className="p-2 rounded bg-gray-700 hover:bg-gray-600 text-white focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
                            aria-label="Reader settings"
                            title="Reader settings"
                        >
                            <FaCog />
                        </button>

                        {/* Hide Controls */}
                        <button
                            onClick={() => setShowControls(false)}
                            className="p-2 rounded bg-gray-700 hover:bg-gray-600 text-white focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
                            aria-label="Hide controls"
                            title="Hide controls"
                        >
                            <FaEyeSlash />
                        </button>
                    </div>
                </div>
            )}

            {/* Show Controls Button (when hidden) */}
            {!showControls && (
                <button
                    onClick={() => setShowControls(true)}
                    className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40 p-3 bg-gray-800/90 backdrop-blur rounded-lg shadow-lg text-white hover:bg-gray-700 focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
                    aria-label="Show controls"
                    title="Show controls"
                >
                    <FaEye />
                </button>
            )}

            {/* Settings Panel */}
            {showSettings && (
                <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-gray-800 rounded-lg p-6 shadow-2xl max-w-md w-full mx-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold">Reader Settings</h3>
                        <button
                            onClick={() => setShowSettings(false)}
                            className="text-gray-400 hover:text-white"
                            aria-label="Close settings"
                        >
                            ×
                        </button>
                    </div>

                    <div className="space-y-4">
                        {/* Auto-scroll Speed */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Auto-scroll Speed</label>
                            <input
                                type="range"
                                min="10"
                                max="100"
                                value={autoScrollSpeed}
                                onChange={(e) => setAutoScrollSpeed(Number(e.target.value))}
                                className="w-full"
                                aria-label="Auto-scroll speed"
                            />
                            <div className="text-xs text-gray-400 mt-1">{autoScrollSpeed} pixels/second</div>
                        </div>

                        {/* Sound Toggle */}
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Sound Effects</span>
                            <button
                                onClick={() => setMuted(!muted)}
                                className={`p-2 rounded ${muted ? 'bg-red-600' : 'bg-green-600'} hover:opacity-80 transition`}
                                aria-label={muted ? 'Unmute' : 'Mute'}
                            >
                                {muted ? <FaVolumeMute /> : <FaVolumeUp />}
                            </button>
                        </div>

                        {/* Keyboard Shortcuts Info */}
                        <div className="bg-gray-700 rounded p-3">
                            <h4 className="text-sm font-medium mb-2">Keyboard Shortcuts</h4>
                            <div className="text-xs space-y-1">
                                <div>← → : Navigate pages</div>
                                <div>F : Toggle fullscreen</div>
                                <div>C : Toggle controls</div>
                                <div>S : Toggle settings</div>
                                <div>A : Toggle auto-scroll</div>
                                <div>B : Toggle bookmark</div>
                                <div>M : Toggle sound</div>
                                <div>ESC : Close/exit</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Page Navigation for Single Mode */}
            {readingMode === 'single' && (
                <div className="fixed top-1/2 left-4 z-40 flex flex-col gap-2">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                        disabled={currentPage === 0}
                        className="p-3 bg-gray-800/90 backdrop-blur rounded-full text-white hover:bg-gray-700 focus:ring-2 focus:ring-blue-400 focus:outline-none transition disabled:opacity-50"
                        aria-label="Previous page"
                    >
                        <FaChevronLeft />
                    </button>
                    <button
                        onClick={() => setCurrentPage(prev => Math.min(pages.length - 1, prev + 1))}
                        disabled={currentPage === pages.length - 1}
                        className="p-3 bg-gray-800/90 backdrop-blur rounded-full text-white hover:bg-gray-700 focus:ring-2 focus:ring-blue-400 focus:outline-none transition disabled:opacity-50"
                        aria-label="Next page"
                    >
                        <FaChevronRight />
                    </button>
                </div>
            )}

            {/* Page Counter */}
            {readingMode === 'single' && (
                <div className="fixed top-4 right-4 z-40 bg-gray-800/90 backdrop-blur rounded-lg px-3 py-2 text-sm">
                    {currentPage + 1} / {pages.length}
                </div>
            )}

            <div className="max-w-4xl mx-auto px-2 sm:px-4 pt-4 sm:pt-8 pb-16">
                <h2 className="text-xl sm:text-2xl font-extrabold mb-2 flex flex-col sm:flex-row sm:items-center gap-2" tabIndex={0} aria-live="polite">
                    <span>Chapter {chapter.chapterNumber}{chapter.subtitle ? `: ${chapter.subtitle}` : ''}</span>
                    {viewCount !== null && (
                        <span className="text-xs sm:text-sm text-gray-400" style={{ transition: 'opacity 0.3s', opacity: viewCount !== null ? 1 : 0 }} aria-label="View count">
                            <span className="sr-only">Total views: </span>👁️ {viewCount} views
                        </span>
                    )}
                </h2>
                <div className="text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base">{chapter.description}</div>

                {/* Reading Content */}
                {renderReadingContent()}

                {autoLoading && (
                    <motion.div className="flex justify-center py-6 sm:py-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
                        <FaSpinner className="animate-spin text-blue-400 text-2xl sm:text-3xl" />
                        <span className="ml-3 text-blue-300 font-semibold text-sm sm:text-base">Loading next episode...</span>
                    </motion.div>
                )}

                {endReached && (
                    <motion.div className="flex flex-col items-center py-6 sm:py-8 text-gray-400" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
                        <span className="text-sm sm:text-base">No more episodes.</span>
                        <Link
                            href={`/manga/${params.mangaId}`}
                            className="mt-4 px-6 py-2 bg-blue-700 hover:bg-blue-600 rounded-lg text-white font-semibold focus:ring-2 focus:ring-blue-400 focus:outline-none transition-colors text-sm sm:text-base min-h-[44px] flex items-center justify-center"
                            aria-label="Return to Series"
                        >
                            Return to Series
                        </Link>
                    </motion.div>
                )}

                {/* Chapter comments section */}
                <ChapterComments chapterId={params.chapterId} />

                {/* AdSlot for chapter page */}
                <div className="mt-8">
                    <AdSlot adType="rectangle" location="chapter" />
                </div>
            </div>
        </div>
    );
} 