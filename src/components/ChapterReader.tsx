"use client";
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { FaChevronLeft, FaChevronRight, FaHome, FaList, FaCog } from 'react-icons/fa';

interface ChapterReaderProps {
    manga: any;
    chapter: any;
    allChapters: any[];
    prevChapter: any;
    nextChapter: any;
    currentIndex: number;
}

export default function ChapterReader({
    manga,
    chapter,
    allChapters,
    prevChapter,
    nextChapter,
    currentIndex
}: ChapterReaderProps) {
    const [currentPage, setCurrentPage] = useState(0);
    const [loading, setLoading] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [readingMode, setReadingMode] = useState<'vertical' | 'horizontal'>('vertical');
    const [imageQuality, setImageQuality] = useState<'high' | 'medium' | 'low'>('high');

    const containerRef = useRef<HTMLDivElement>(null);
    const controlsTimeoutRef = useRef<NodeJS.Timeout>();

    // Get chapter pages (assuming pages are stored as an array of image URLs)
    const pages = Array.isArray(chapter.pages) ? chapter.pages : [];

    // Ensure all IDs are strings
    const mangaId = typeof manga._id === 'string' ? manga._id : manga._id?.toString() || '';
    const chapterId = typeof chapter._id === 'string' ? chapter._id : chapter._id?.toString() || '';

    // Auto-hide controls after 3 seconds of inactivity
    const hideControls = useCallback(() => {
        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }
        controlsTimeoutRef.current = setTimeout(() => {
            setShowControls(false);
        }, 3000);
    }, []);

    // Show controls on mouse move or touch
    const showControlsTemporarily = useCallback(() => {
        setShowControls(true);
        hideControls();
    }, [hideControls]);

    // Navigation functions
    const goToNextPage = useCallback(() => {
        if (currentPage < pages.length - 1) {
            setCurrentPage(prev => prev + 1);
        } else if (nextChapter) {
            // Go to next chapter
            const nextChapterId = typeof nextChapter._id === 'string' ? nextChapter._id : nextChapter._id?.toString() || '';
            window.location.href = `/manga/${mangaId}/chapter/${nextChapterId}`;
        }
    }, [currentPage, pages.length, nextChapter, mangaId]);

    const goToPrevPage = useCallback(() => {
        if (currentPage > 0) {
            setCurrentPage(prev => prev - 1);
        } else if (prevChapter) {
            // Go to previous chapter
            const prevChapterId = typeof prevChapter._id === 'string' ? prevChapter._id : prevChapter._id?.toString() || '';
            window.location.href = `/manga/${mangaId}/chapter/${prevChapterId}`;
        }
    }, [currentPage, prevChapter, mangaId]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'ArrowRight':
                case ' ':
                    e.preventDefault();
                    goToNextPage();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    goToPrevPage();
                    break;
                case 'Escape':
                    setShowControls(prev => !prev);
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [goToNextPage, goToPrevPage]);

    // Mouse/touch events for controls
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        container.addEventListener('mousemove', showControlsTemporarily);
        container.addEventListener('touchstart', showControlsTemporarily);

        return () => {
            container.removeEventListener('mousemove', showControlsTemporarily);
            container.removeEventListener('touchstart', showControlsTemporarily);
        };
    }, [showControlsTemporarily]);

    // Auto-hide controls
    useEffect(() => {
        hideControls();
        return () => {
            if (controlsTimeoutRef.current) {
                clearTimeout(controlsTimeoutRef.current);
            }
        };
    }, [hideControls]);

    // Record reading progress
    useEffect(() => {
        const recordProgress = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    await fetch('/api/profile', {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            action: 'recordReading',
                            mangaId: mangaId,
                            chapterId: chapterId,
                            currentPage: currentPage
                        })
                    });
                } catch (error) {
                    console.error('Failed to record reading progress:', error);
                }
            }
        };

        recordProgress();
    }, [mangaId, chapterId, currentPage]);

    if (!pages || pages.length === 0) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">No Pages Available</h1>
                    <p className="text-gray-400">This chapter has no pages to display.</p>
                    <Link href={`/manga/${mangaId}`} className="mt-4 inline-block bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg">
                        Back to Manga
                    </Link>
                    <div className="mt-4">
                        <img src="/placeholder-page.svg" alt="Placeholder" className="w-64 h-auto mx-auto opacity-50" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className="min-h-screen bg-black relative overflow-hidden"
            onMouseMove={showControlsTemporarily}
            onTouchStart={showControlsTemporarily}
        >
            {/* Top Navigation Bar */}
            {showControls && (
                <div className="absolute top-0 left-0 right-0 z-50 bg-black bg-opacity-80 backdrop-blur-sm transition-opacity duration-300">
                    <div className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-4">
                            <Link
                                href={`/manga/${mangaId}`}
                                className="flex items-center gap-2 text-white hover:text-blue-400 transition-colors"
                            >
                                <FaHome />
                                <span className="hidden sm:inline">{manga.title}</span>
                            </Link>
                            <span className="text-gray-400">|</span>
                            <span className="text-white font-semibold">
                                Chapter {chapter.chapterNumber}
                            </span>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="text-white text-sm">
                                Page {currentPage + 1} of {pages.length}
                            </div>
                            <button
                                onClick={() => setReadingMode(prev => prev === 'vertical' ? 'horizontal' : 'vertical')}
                                className="text-white hover:text-blue-400 transition-colors"
                                title={`Switch to ${readingMode === 'vertical' ? 'horizontal' : 'vertical'} reading`}
                            >
                                {readingMode === 'vertical' ? '↔' : '↕'}
                            </button>
                            <Link
                                href={`/manga/${mangaId}`}
                                className="text-white hover:text-blue-400 transition-colors"
                                title="Chapter List"
                            >
                                <FaList />
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Chapter Pages */}
            <div className={`pt-16 ${readingMode === 'vertical' ? 'space-y-2' : 'flex overflow-x-auto'}`}>
                {pages.map((page: any, index: number) => {
                    // Handle both MongoDB-stored images and file paths
                    let imageSrc = '';
                    let imageAlt = `Page ${index + 1}`;

                    if (typeof page === 'string') {
                        // File path (legacy format)
                        imageSrc = page;
                    } else if (page && page.imagePath) {
                        // Use the imagePath directly from the database
                        imageSrc = page.imagePath;
                        imageAlt = `Page ${page.pageNumber || index + 1}`;
                    } else if (page && page.pageNumber) {
                        // Fallback to API endpoint if imagePath doesn't exist
                        imageSrc = `/api/manga/chapter/${chapterId}/page/${page.pageNumber}`;
                        imageAlt = `Page ${page.pageNumber}`;
                    } else {
                        // Final fallback
                        imageSrc = '/placeholder-page.svg';
                    }

                    return (
                        <div
                            key={index}
                            className={`${readingMode === 'vertical'
                                ? 'w-full max-w-4xl mx-auto'
                                : 'flex-shrink-0 w-full max-w-4xl'
                                }`}
                        >
                            <img
                                src={imageSrc}
                                alt={imageAlt}
                                className={`w-full h-auto ${imageQuality === 'high' ? 'max-w-none' :
                                    imageQuality === 'medium' ? 'max-w-3xl' : 'max-w-2xl'
                                    } mx-auto transition-opacity duration-300`}
                                onLoad={() => {
                                    if (index === currentPage) {
                                        setLoading(false);
                                    }
                                }}
                                onLoadStart={() => {
                                    if (index === currentPage) {
                                        setLoading(true);
                                    }
                                }}
                                onError={(e) => {
                                    console.error(`Failed to load page ${index + 1}:`, page);
                                    console.error(`Image source was:`, imageSrc);
                                    console.error(`Page data:`, page);
                                    // Use local SVG placeholders for reliable fallback
                                    const pageNumber = index + 1;
                                    if (pageNumber >= 1 && pageNumber <= 5) {
                                        e.currentTarget.src = `/placeholder-page-${pageNumber}.svg`;
                                    } else {
                                        e.currentTarget.src = '/placeholder-page.svg';
                                    }
                                }}
                            />
                        </div>
                    );
                })}
            </div>

            {/* Navigation Controls */}
            {showControls && (
                <>
                    {/* Previous Page/Chapter Button */}
                    {(currentPage > 0 || prevChapter) && (
                        <button
                            onClick={goToPrevPage}
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-3 rounded-full transition-all duration-200 z-40"
                            title={currentPage > 0 ? 'Previous Page' : 'Previous Chapter'}
                        >
                            <FaChevronLeft size={24} />
                        </button>
                    )}

                    {/* Next Page/Chapter Button */}
                    {(currentPage < pages.length - 1 || nextChapter) && (
                        <button
                            onClick={goToNextPage}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-3 rounded-full transition-all duration-200 z-40"
                            title={currentPage < pages.length - 1 ? 'Next Page' : 'Next Chapter'}
                        >
                            <FaChevronRight size={24} />
                        </button>
                    )}

                    {/* Chapter Navigation */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-40">
                        <div className="flex items-center gap-4 bg-black bg-opacity-80 backdrop-blur-sm rounded-lg px-6 py-3">
                            {prevChapter && (
                                <Link
                                    href={`/manga/${mangaId}/chapter/${typeof prevChapter._id === 'string' ? prevChapter._id : prevChapter._id?.toString() || ''}`}
                                    className="text-white hover:text-blue-400 transition-colors flex items-center gap-2"
                                >
                                    <FaChevronLeft />
                                    <span className="hidden sm:inline">Chapter {prevChapter.chapterNumber}</span>
                                </Link>
                            )}

                            <span className="text-white font-semibold">
                                Chapter {chapter.chapterNumber}
                            </span>

                            {nextChapter && (
                                <Link
                                    href={`/manga/${mangaId}/chapter/${typeof nextChapter._id === 'string' ? nextChapter._id : nextChapter._id?.toString() || ''}`}
                                    className="text-white hover:text-blue-400 transition-colors flex items-center gap-2"
                                >
                                    <span className="hidden sm:inline">Chapter {nextChapter.chapterNumber}</span>
                                    <FaChevronRight />
                                </Link>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* Loading Indicator */}
            {loading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="text-white text-xl">Loading...</div>
                </div>
            )}

            {/* Quick Navigation Menu */}
            {showControls && (
                <div className="absolute top-20 right-4 z-40">
                    <div className="bg-black bg-opacity-80 backdrop-blur-sm rounded-lg p-4">
                        <h3 className="text-white font-semibold mb-3">Quick Navigation</h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {allChapters.map((ch) => (
                                <Link
                                    key={ch._id}
                                    href={`/manga/${mangaId}/chapter/${typeof ch._id === 'string' ? ch._id : ch._id?.toString() || ''}`}
                                    className={`block px-3 py-2 rounded text-sm transition-colors ${ch._id === chapter._id
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                        }`}
                                >
                                    Chapter {ch.chapterNumber}
                                    {ch.subtitle && ` - ${ch.subtitle}`}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
