"use client";
import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaChevronLeft, FaChevronRight, FaHome, FaChevronDown, FaFacebook, FaTwitter, FaInstagram, FaDiscord, FaWhatsapp, FaShareAlt } from 'react-icons/fa';
import { socialMediaLinks, websiteInfo } from '@/config/socialMedia';
// Re-enabling with optimizations
import { useAIFeatures } from '@/hooks/useAIFeatures';
// Lazy load heavy components to prevent blocking
import dynamic from 'next/dynamic';

const ChapterSummary = dynamic(() => import('./ChapterSummary'), { 
    ssr: false,
    loading: () => null // Don't show loading state to prevent blocking
});

const PreviouslyOnRecap = dynamic(() => import('./PreviouslyOnRecap'), { 
    ssr: false,
    loading: () => null // Don't show loading state to prevent blocking
});

// AutoBrightness - Re-enabled with optimized position locking (no longer blocks)
const AutoBrightness = dynamic(() => import('./AutoBrightness'), { 
    ssr: false,
    loading: () => null
});

const EyeTracking = dynamic(() => import('./EyeTracking'), { 
    ssr: false,
    loading: () => null
});

// VoiceAssistant - REMOVED: Now rendered globally in ClientLayoutShell for all pages

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
    const [showChapterDropdown, setShowChapterDropdown] = useState(false);
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const synthRef = useRef<SpeechSynthesis | null>(null);

    // AI Features - Hook call deferred by 2 seconds in useAIFeatures.ts to prevent blocking
    const { voiceAssistantEnabled, eyeTrackingEnabled, autoBrightnessEnabled, isFeatureEnabled, loading: aiFeaturesLoading } = useAIFeatures();
    
    // Use deferred loading - only enable after page is interactive
    const [pageInteractive, setPageInteractive] = useState(false);
    const [userInteracted, setUserInteracted] = useState(false);
    
    useEffect(() => {
        // Mark page as interactive after initial render completes
        const timer = setTimeout(() => setPageInteractive(true), 500);
        return () => clearTimeout(timer);
    }, []);
    
    // Only load heavy AI features after user interaction (scroll, click, etc.)
    useEffect(() => {
        if (!pageInteractive) return;
        
        const handleInteraction = () => {
            setUserInteracted(true);
            // Remove listeners after first interaction
            window.removeEventListener('scroll', handleInteraction, { passive: true });
            window.removeEventListener('click', handleInteraction);
            window.removeEventListener('touchstart', handleInteraction, { passive: true });
        };
        
        // Wait for user to interact before loading heavy features
        window.addEventListener('scroll', handleInteraction, { passive: true });
        window.addEventListener('click', handleInteraction);
        window.addEventListener('touchstart', handleInteraction, { passive: true });
        
        return () => {
            window.removeEventListener('scroll', handleInteraction);
            window.removeEventListener('click', handleInteraction);
            window.removeEventListener('touchstart', handleInteraction);
        };
    }, [pageInteractive]);
    
    // Only enable features after page is interactive AND preferences are loaded
    const chapterSummariesEnabled = useMemo(() => 
        pageInteractive && !aiFeaturesLoading && isFeatureEnabled('chapterSummaries'), 
        [pageInteractive, aiFeaturesLoading, isFeatureEnabled]
    );
    const previouslyOnEnabled = useMemo(() => 
        pageInteractive && !aiFeaturesLoading && isFeatureEnabled('previouslyOnRecap'), 
        [pageInteractive, aiFeaturesLoading, isFeatureEnabled]
    );

    const mangaId = typeof manga._id === 'string' ? manga._id : manga._id?.toString() || '';
    const chapterId = typeof chapter._id === 'string' ? chapter._id : chapter._id?.toString() || '';

    // Get chapter pages
    const pages = Array.isArray(chapter.pages) ? chapter.pages : [];
    const pdfUrl = chapter?.pdfUrl || chapter?.pdfFile?.secure_url || '';

    // Convert PDF pages to Cloudinary image URLs
    const [loadedPageCount, setLoadedPageCount] = useState(0);
    const [failedPages, setFailedPages] = useState(0);
    const [maxPageReached, setMaxPageReached] = useState(false);
    const maxPages = 100; // Maximum pages to try loading
    const maxConsecutiveFailures = 3; // Stop after 3 consecutive failures

    // Use useMemo to prevent recreating array on every render (prevents infinite loops)
    // Create stable string reference for pages to detect actual changes
    const pagesKey = useMemo(() => {
        if (pages.length === 0) return '';
        // Create stable key from first and last page URLs
        const first = typeof pages[0] === 'string' ? pages[0] : pages[0]?.imagePath || '';
        const last = pages.length > 1 ? (typeof pages[pages.length - 1] === 'string' ? pages[pages.length - 1] : pages[pages.length - 1]?.imagePath || '') : '';
        return `${pages.length}-${first}-${last}`;
    }, [pages]);
    
    const chapterImages: string[] = useMemo(() => {
        const images: string[] = [];
        
        if (pdfUrl && pdfUrl.includes('cloudinary.com')) {
            // Cloudinary PDF to image transformation
            // Start with fewer pages to prevent blocking (lazy load more as needed)
            const initialPages = Math.min(maxPages, 10); // Reduced from 50 to 10 to prevent blocking
            for (let i = 1; i <= initialPages; i++) {
                // Transform: /upload/ -> /upload/f_jpg,pg_{pageNumber},q_auto/
                // Use proper Cloudinary transformation format
                const imageUrl = pdfUrl.replace('/upload/', `/upload/f_jpg,pg_${i},q_auto/`);
                images.push(imageUrl);
            }
        } else if (pages.length > 0) {
            // Use existing pages (limit to prevent blocking)
            const limitedPages = pages.slice(0, 50); // Limit to 50 pages initially
            limitedPages.forEach((page: any) => {
                if (typeof page === 'string') {
                    images.push(page);
                } else if (page?.imagePath) {
                    images.push(page.imagePath);
                }
            });
        }
        
        return images;
    }, [pdfUrl, pagesKey, maxPages]); // Use stable pagesKey instead of array

    // Track image load errors - throttled to prevent infinite loops
    const failedPagesRef = useRef<number>(0);
    const handleImageError = (pageIndex: number, event: React.SyntheticEvent<HTMLImageElement, Event>) => {
        const img = event.currentTarget;
        // Silently handle 400/404 errors for non-existent PDF pages
        if (img.src.includes('cloudinary.com') && (img.src.includes('.pdf') || img.src.includes('f_jpg,pg_'))) {
            // This is a Cloudinary PDF transformation that failed (page doesn't exist)
            // Silently hide it - don't log to console to avoid spam
            img.style.display = 'none';
            img.style.visibility = 'hidden';
            // Prevent error from bubbling to console
            event.preventDefault();
            event.stopPropagation();
            return;
        }
        
        // Throttle state updates to prevent infinite loops
        failedPagesRef.current += 1;
        const newFailedCount = failedPagesRef.current;
        
        // Batch state updates (only update if significant change)
        if (newFailedCount % maxConsecutiveFailures === 0 || (pageIndex > 5 && newFailedCount >= maxConsecutiveFailures)) {
            setFailedPages(newFailedCount);
            // If we have too many consecutive failures near the end, we've reached the last page
            if (pageIndex > 5 && newFailedCount >= maxConsecutiveFailures) {
                setMaxPageReached(true);
            }
        }
    };

    // Use refs to prevent infinite re-renders from image load handlers
    const loadedPagesRef = useRef<Set<number>>(new Set());
    const lastUpdateRef = useRef<number>(0);
    
    const handleImageLoad = (pageIndex: number) => {
        // Prevent rapid state updates (throttle to max once per 100ms)
        const now = Date.now();
        if (now - lastUpdateRef.current < 100) {
            return; // Skip if updated recently
        }
        
        if (!loadedPagesRef.current.has(pageIndex)) {
            loadedPagesRef.current.add(pageIndex);
            // Use reduce instead of Math.max with spread to prevent blocking on large sets
            const maxLoaded = Array.from(loadedPagesRef.current).reduce((max, idx) => Math.max(max, idx), 0);
            setLoadedPageCount(maxLoaded + 1);
            setFailedPages(0); // Reset consecutive failures
            lastUpdateRef.current = now;
        }
    };

    // Initialize speech synthesis and close dropdown when clicking outside
    useEffect(() => {
        // Initialize speech synthesis
        if (typeof window !== 'undefined') {
            synthRef.current = window.speechSynthesis;
        }

        // Close dropdown when clicking outside
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowChapterDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Listen for voice commands from global VoiceAssistant
    useEffect(() => {
        const handleVoiceCommandEvent = (event: CustomEvent) => {
            const { command, params } = event.detail;
            handleVoiceCommand(command, params);
        };

        window.addEventListener('voiceCommand', handleVoiceCommandEvent as EventListener);
        return () => {
            window.removeEventListener('voiceCommand', handleVoiceCommandEvent as EventListener);
        };
    }, [chapterImages.length, nextChapter, prevChapter, allChapters, mangaId, chapterId]); // Re-bind when dependencies change

    // Helper function to find which page is currently in viewport
    const findCurrentPageInViewport = (): number => {
        const viewportTop = window.scrollY;
        const viewportBottom = viewportTop + window.innerHeight;
        const viewportCenter = viewportTop + window.innerHeight / 2;

        let closestPageIndex = -1;
        let closestDistance = Infinity;

        for (let i = 0; i < chapterImages.length; i++) {
            const pageElement = document.getElementById(`chapter-page-${i}`);
            if (pageElement) {
                const rect = pageElement.getBoundingClientRect();
                const pageTop = rect.top + window.scrollY;
                const pageBottom = pageTop + rect.height;
                const pageCenter = pageTop + rect.height / 2;

                // Check if page is in viewport
                if (pageTop <= viewportBottom && pageBottom >= viewportTop) {
                    // Calculate distance from viewport center
                    const distance = Math.abs(pageCenter - viewportCenter);
                    if (distance < closestDistance) {
                        closestDistance = distance;
                        closestPageIndex = i;
                    }
                }
            }
        }

        return closestPageIndex;
    };

    // Handle voice commands
    const handleVoiceCommand = (command: string, params?: any) => {
        switch (command) {
            case 'next':
                if (nextChapter) {
                    router.push(`/manga/${mangaId}/chapter/${nextChapter._id}`);
                }
                break;
            case 'previous':
                if (prevChapter) {
                    router.push(`/manga/${mangaId}/chapter/${prevChapter._id}`);
                }
                break;
            case 'goToChapter':
                if (params?.chapterNumber) {
                    const targetChapter = allChapters.find(ch => ch.chapterNumber === params.chapterNumber);
                    if (targetChapter) {
                        router.push(`/manga/${mangaId}/chapter/${targetChapter._id}`);
                    }
                }
                break;
            case 'goToPage':
                if (params?.pageNumber) {
                    const pageNumber = params.pageNumber;
                    if (pageNumber >= 1 && pageNumber <= chapterImages.length) {
                        // Find the page element by ID and scroll to it
                        const pageElement = document.getElementById(`chapter-page-${pageNumber - 1}`);
                        if (pageElement) {
                            pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        } else {
                            // If element not found yet, wait a bit and try again
                            setTimeout(() => {
                                const retryElement = document.getElementById(`chapter-page-${pageNumber - 1}`);
                                if (retryElement) {
                                    retryElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }
                            }, 500);
                        }
                    }
                }
                break;
            case 'nextPage':
                // Find current page by checking which page is in viewport
                const currentPageIndex = findCurrentPageInViewport();
                if (currentPageIndex >= 0 && currentPageIndex < chapterImages.length - 1) {
                    const nextPageElement = document.getElementById(`chapter-page-${currentPageIndex + 1}`);
                    if (nextPageElement) {
                        nextPageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }
                break;
            case 'previousPage':
                // Find current page by checking which page is in viewport
                const currentPageIdx = findCurrentPageInViewport();
                if (currentPageIdx > 0) {
                    const prevPageElement = document.getElementById(`chapter-page-${currentPageIdx - 1}`);
                    if (prevPageElement) {
                        prevPageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }
                break;
            case 'goToLastPage':
                if (chapterImages.length > 0) {
                    const lastPageElement = document.getElementById(`chapter-page-${chapterImages.length - 1}`);
                    if (lastPageElement) {
                        lastPageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }
                break;
            case 'bookmark':
                // Trigger bookmark action
                const bookmarkBtn = document.querySelector('[data-bookmark-btn]');
                if (bookmarkBtn) {
                    (bookmarkBtn as HTMLElement).click();
                }
                break;
            case 'toggleTheme':
                // Toggle dark mode
                document.documentElement.classList.toggle('dark');
                break;
            case 'scroll':
                if (params?.direction === 'down') {
                    window.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' });
                } else {
                    window.scrollBy({ top: -window.innerHeight * 0.8, behavior: 'smooth' });
                }
                break;
            case 'zoom':
                // Zoom functionality would go here
                break;
            case 'share':
                handleShare();
                break;
            case 'close':
                router.push(`/manga/${mangaId}`);
                break;
            // Manga-specific commands
            case 'startReading':
                // Scroll to top of chapter content
                window.scrollTo({ top: 0, behavior: 'smooth' });
                break;
            case 'pauseReading':
                // Could pause autoplay if implemented
                break;
            case 'currentChapter':
                // Announce current chapter (could use text-to-speech)
                if (synthRef.current) {
                    const utterance = new SpeechSynthesisUtterance(`You are reading Chapter ${chapter.chapterNumber}`);
                    synthRef.current.speak(utterance);
                }
                break;
            case 'goToManga':
                router.push(`/manga/${mangaId}`);
                break;
            case 'increaseBrightness':
                // Increase screen brightness
                const currentBrightness = parseFloat(getComputedStyle(document.documentElement).filter.match(/brightness\(([^)]+)\)/)?.[1] || '1');
                const newBrightness = Math.min(1.5, currentBrightness + 0.1);
                document.documentElement.style.filter = `brightness(${newBrightness})`;
                break;
            case 'decreaseBrightness':
                // Decrease screen brightness
                const currentBright = parseFloat(getComputedStyle(document.documentElement).filter.match(/brightness\(([^)]+)\)/)?.[1] || '1');
                const newBright = Math.max(0.3, currentBright - 0.1);
                document.documentElement.style.filter = `brightness(${newBright})`;
                    break;
            case 'toggleEyeTracking':
                // Toggle eye tracking (would need to communicate with EyeTracking component)
                // This could be handled via a custom event or context
                window.dispatchEvent(new CustomEvent('toggleEyeTracking'));
                    break;
            default:
                // Silently ignore unknown commands
                    break;
            }
        };

    // Check if user is logged in (with timeout to prevent hanging)
    useEffect(() => {
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        if (!token) return;
        
        setIsLoggedIn(true);
        
        // Add timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        // Fetch user info
        fetch('/api/profile', {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal
        })
            .then(res => res.json())
            .then(data => {
                if (data.user) {
                    setUsername(data.user.username || 'Anonymous');
                }
            })
            .catch(err => {
                if (err.name !== 'AbortError') {
                    // Silently handle errors
                }
            })
            .finally(() => {
                clearTimeout(timeoutId);
            });

        return () => {
            controller.abort();
            clearTimeout(timeoutId);
        };
    }, []);

    // Load comments (with timeout and deferred loading to prevent blocking)
    useEffect(() => {
        if (!chapterId) return;
        
        // Defer comments loading to prevent blocking initial page render
        const delayTimer = setTimeout(() => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
            
            fetch(`/api/comments/${chapterId}`, {
                signal: controller.signal
            })
                .then(res => res.json())
                .then(data => {
                    if (data.comments) {
                        setComments(data.comments);
                    }
                })
                .catch(err => {
                    if (err.name !== 'AbortError') {
                        // Silently handle errors
                    }
                })
                .finally(() => {
                    clearTimeout(timeoutId);
                });
        }, 1500); // Wait 1.5 seconds before loading comments
        
        return () => {
            clearTimeout(delayTimer);
        };
    }, [chapterId]);

    // Handle comment submission
    const handleSubmitComment = async () => {
        if (!newComment.trim()) return;
        if (!isLoggedIn) {
            alert('Please login to comment');
            return;
        }

        setSubmittingComment(true);
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');

        try {
            const response = await fetch(`/api/comments/${chapterId}`, {
                method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ content: newComment })
            });

            if (response.ok) {
                const data = await response.json();
                setComments([data.comment, ...comments]);
                setNewComment('');
            } else {
                alert('Failed to post comment');
            }
                } catch (error) {
            console.error('Error posting comment:', error);
            alert('Error posting comment');
        } finally {
            setSubmittingComment(false);
        }
    };

    // Handle share
    const handleShare = () => {
        const shareUrl = window.location.href;
        if (navigator.share) {
            navigator.share({
                title: `${manga.title} - Chapter ${chapter.chapterNumber}`,
                url: shareUrl
            });
        } else {
            navigator.clipboard.writeText(shareUrl);
            alert('Link copied to clipboard!');
        }
    };

        return (
        <div className="min-h-screen bg-gray-950 text-white">
            {/* Top Navigation */}
            <div className="w-full bg-black border-b border-gray-800 py-6">
                <div className="max-w-4xl mx-auto px-4">
                    {/* Chapter Cover and Title */}
                    <div className="flex items-center gap-6 mb-6">
                        {chapter.coverPage && (
                            <img
                                src={chapter.coverPage}
                                alt={`Chapter ${chapter.chapterNumber}`}
                                className="w-32 h-auto rounded-lg border border-gray-700 shadow-lg"
                            />
                        )}
                        <div>
                            <h1 className="text-3xl font-bold mb-2">
                                {manga.title} Chapter {chapter.chapterNumber}
                            </h1>
                            {chapter.subtitle && (
                                <p className="text-gray-400 text-lg">{chapter.subtitle}</p>
                            )}
                            <p className="text-gray-500 text-sm mt-2">
                                {new Date(chapter.createdAt).toLocaleDateString()}
                            </p>
                </div>
            </div>

                    {/* Navigation Buttons */}
                    <div className="flex flex-col items-center gap-3">
                        <div className="flex items-center gap-4">
                            {/* Previous Button */}
                            {prevChapter ? (
                                <Link
                                    href={`/manga/${mangaId}/chapter/${prevChapter._id}`}
                                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-semibold transition-all shadow-lg"
                                >
                                    <FaChevronLeft />
                                    <span>Prev</span>
                                </Link>
                            ) : (
                                <div className="w-24"></div>
                            )}

                            {/* Home Button */}
                            <Link
                                href={`/manga/${mangaId}`}
                                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-full font-semibold transition-all shadow-lg"
                            >
                                <FaHome />
                                <span>Home</span>
                            </Link>

                            {/* Next Button */}
                            {nextChapter ? (
                                <Link
                                    href={`/manga/${mangaId}/chapter/${nextChapter._id}`}
                                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-semibold transition-all shadow-lg"
                                >
                                    <span>Next</span>
                                    <FaChevronRight />
                            </Link>
                            ) : (
                                <div className="w-24"></div>
                            )}
                        </div>

                        {/* Chapter Dropdown */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setShowChapterDropdown(!showChapterDropdown)}
                                className="flex items-center gap-3 bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-full font-semibold transition-all shadow-lg min-w-[200px] justify-center"
                            >
                                <span>Chapter {chapter.chapterNumber}</span>
                                <FaChevronDown className={`transition-transform ${showChapterDropdown ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Dropdown Menu */}
                            {showChapterDropdown && (
                                <div className="absolute top-full mt-2 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl overflow-hidden z-50 min-w-[200px]">
                                    <div className="max-h-[280px] overflow-y-auto chapter-dropdown-scroll">
                                        {allChapters.map((ch) => (
                            <Link
                                                key={ch._id}
                                                href={`/manga/${mangaId}/chapter/${ch._id}`}
                                                className={`block px-4 py-3 hover:bg-gray-800 transition-colors ${ch._id === chapterId
                                                    ? 'bg-blue-600 text-white font-bold'
                                                    : 'text-gray-300'
                                                    }`}
                                                onClick={() => setShowChapterDropdown(false)}
                                            >
                                                Chapter {ch.chapterNumber}
                                                {ch.subtitle && <span className="text-sm opacity-75"> - {ch.subtitle}</span>}
                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        </div>
                    </div>
            </div>

            {/* AI Features: Previously On Recap & Chapter Summary - Re-enabled with lazy loading */}
            {pageInteractive && !aiFeaturesLoading && (
                <div className="w-full max-w-4xl mx-auto px-4 pt-4">
                    {previouslyOnEnabled && (
                        <PreviouslyOnRecap mangaId={mangaId} enabled={previouslyOnEnabled} />
                    )}
                    {chapterSummariesEnabled && (
                        <ChapterSummary
                            chapterId={chapterId}
                            chapterNumber={chapter.chapterNumber}
                            enabled={chapterSummariesEnabled}
                        />
                    )}
                </div>
            )}

            {/* Manga Content */}
            <div className="w-full max-w-4xl mx-auto py-8 px-4">
                {chapterImages.length > 0 ? (
                    <div className="space-y-2">
                        {chapterImages.slice(0, Math.min(Math.max(loadedPageCount, 3), chapterImages.length)).map((imageSrc, index) => {
                            // Only render first 3 images initially, then progressively load more
                            // Stop rendering after too many consecutive failures or if max page reached
                            if (maxPageReached && index > loadedPageCount) {
                                return null;
                            }
                            if (index > loadedPageCount + maxConsecutiveFailures && !maxPageReached) {
                                return null;
                    }

                    return (
                        <div
                                    key={`page-${index}-${imageSrc.slice(-20)}`}
                                    id={`chapter-page-${index}`}
                                    className="w-full mb-4"
                        >
                            <img
                                src={imageSrc}
                                        alt={`Page ${index + 1}`}
                                        className="w-full h-auto rounded-lg shadow-2xl"
                                onLoad={() => {
                                            // Use requestAnimationFrame to batch updates
                                            requestAnimationFrame(() => handleImageLoad(index));
                                }}
                                onError={(e) => {
                                            handleImageError(index, e);
                                            // Hide broken images (pages beyond actual count)
                                            e.currentTarget.style.display = 'none';
                                            e.currentTarget.style.visibility = 'hidden';
                                        }}
                                        loading="lazy"
                                        decoding="async"
                            />
                        </div>
                    );
                })}
            </div>
                ) : (
                    <div className="text-center py-20">
                        <p className="text-gray-400 text-lg">No pages available for this chapter</p>
                    </div>
                )}
            </div>

            {/* Bottom Navigation (Repeat) */}
            <div className="w-full bg-black border-t border-gray-800 py-6">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="flex flex-col items-center gap-3">
                        <div className="flex items-center gap-4">
                            {/* Previous Button */}
                            {prevChapter ? (
                                <Link
                                    href={`/manga/${mangaId}/chapter/${prevChapter._id}`}
                                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-semibold transition-all shadow-lg"
                                >
                                    <FaChevronLeft />
                                    <span>Prev</span>
                                </Link>
                            ) : (
                                <div className="w-24"></div>
                            )}

                            {/* Home Button */}
                            <Link
                                href={`/manga/${mangaId}`}
                                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-full font-semibold transition-all shadow-lg"
                            >
                                <FaHome />
                                <span>Home</span>
                            </Link>

                            {/* Next Button */}
                            {nextChapter ? (
                                <Link
                                    href={`/manga/${mangaId}/chapter/${nextChapter._id}`}
                                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-semibold transition-all shadow-lg"
                                >
                                    <span>Next</span>
                                    <FaChevronRight />
                                </Link>
                            ) : (
                                <div className="w-24"></div>
                            )}
                        </div>

                        {/* Chapter Dropdown (Repeat) */}
                        <div className="relative">
                            <button
                                onClick={() => setShowChapterDropdown(!showChapterDropdown)}
                                className="flex items-center gap-3 bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-full font-semibold transition-all shadow-lg min-w-[200px] justify-center"
                            >
                                <span>Chapter {chapter.chapterNumber}</span>
                                <FaChevronDown className={`transition-transform ${showChapterDropdown ? 'rotate-180' : ''}`} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Social Media Share Section */}
            <div className="w-full bg-gray-900 border-t border-gray-800 py-8">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Share */}
                        <div className="bg-gray-800 rounded-lg p-6 text-center">
                            <h3 className="font-semibold mb-3 text-lg">Share This Chapter</h3>
                            <button
                                onClick={handleShare}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                            >
                                <FaShareAlt />
                                Share
                            </button>
                        </div>

                        {/* Join Our Socials */}
                        <div className="bg-gray-800 rounded-lg p-6 text-center">
                            <h3 className="font-semibold mb-3 text-lg">Join Our Socials</h3>
                            <div className="flex items-center justify-center gap-3">
                                {socialMediaLinks.facebook && (
                                    <a href={socialMediaLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-400 text-2xl">
                                        <FaFacebook />
                                    </a>
                                )}
                                {socialMediaLinks.twitter && (
                                    <a href={socialMediaLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-2xl">
                                        <FaTwitter />
                                    </a>
                                )}
                                {socialMediaLinks.instagram && (
                                    <a href={socialMediaLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-pink-500 hover:text-pink-400 text-2xl">
                                        <FaInstagram />
                                    </a>
                                )}
                                {socialMediaLinks.discord && (
                                    <a href={socialMediaLinks.discord} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:text-indigo-400 text-2xl">
                                        <FaDiscord />
                                    </a>
                                )}
                                {socialMediaLinks.whatsapp && (
                                    <a href={socialMediaLinks.whatsapp} target="_blank" rel="noopener noreferrer" className="text-green-500 hover:text-green-400 text-2xl">
                                        <FaWhatsapp />
                                    </a>
                                )}
                    </div>
                            {!socialMediaLinks.facebook && !socialMediaLinks.twitter && !socialMediaLinks.instagram && !socialMediaLinks.discord && !socialMediaLinks.whatsapp && (
                                <p className="text-gray-500 text-sm">Social links coming soon!</p>
                            )}
                        </div>

                        {/* Support Us */}
                        <div className="bg-gray-800 rounded-lg p-6 text-center">
                            <h3 className="font-semibold mb-3 text-lg">Support Us</h3>
                            <button
                                onClick={() => alert('Support/Donation feature coming soon!')}
                                className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-all"
                            >
                                Donate
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Comments Section */}
            <div className="w-full bg-gray-950 border-t border-gray-800 py-8">
                <div className="max-w-4xl mx-auto px-4">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        💬 Comments ({comments.length})
                    </h2>

                    {/* Comments List - SHOW FIRST */}
                    <div className="space-y-4 mb-6">
                        {comments.length > 0 ? (
                            comments.map((comment) => (
                                <div key={comment._id} className="bg-gray-900 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-semibold text-blue-400">{comment.username}</span>
                                        <span className="text-gray-500 text-sm">
                                            {new Date(comment.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-gray-300">{comment.content}</p>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                No comments yet. Be the first to comment!
                </div>
            )}
                    </div>

                    {/* Comment Input - SHOW AFTER COMMENTS */}
                    {isLoggedIn ? (
                        <div className="bg-gray-900 rounded-lg p-4 border-t-2 border-blue-600">
                            <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Write your comment..."
                                className="w-full bg-gray-800 text-white rounded-lg p-3 min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <div className="flex justify-between items-center mt-3">
                                <span className="text-gray-400 text-sm">Commenting as {username}</span>
                                <button
                                    onClick={handleSubmitComment}
                                    disabled={submittingComment || !newComment.trim()}
                                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-semibold transition-all"
                                >
                                    {submittingComment ? 'Posting...' : 'Post Comment'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gray-900 rounded-lg p-6 text-center border-t-2 border-blue-600">
                            <p className="text-gray-400 mb-3">Please login to comment</p>
                            <Link href="/login" className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-all">
                                Login
                                </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="w-full bg-black border-t border-gray-800 py-8">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div>
                            <h3 className="text-xl font-bold text-red-500 mb-1">{websiteInfo.name}</h3>
                            <p className="text-gray-400 text-sm">{websiteInfo.tagline}</p>
                            <p className="text-gray-600 text-xs mt-2">{websiteInfo.copyright} • v{websiteInfo.version}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <div className="flex gap-4 text-gray-400 text-sm">
                                <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                                <Link href="/dmca" className="hover:text-white transition-colors">DMCA</Link>
                                {socialMediaLinks.discord && (
                                    <a href={socialMediaLinks.discord} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Discord</a>
                                )}
                            </div>
                            <div className="text-gray-600 text-xs">Made by {websiteInfo.developer}</div>
                        </div>
                        </div>
                    </div>
                </div>

            {/* AI Features - Re-enabled with deferred initialization */}
            {/* Voice Assistant - REMOVED: Now rendered globally in ClientLayoutShell for all pages */}
            
            {/* Eye Tracking - Only load after user interaction to prevent blocking */}
            {pageInteractive && userInteracted && !aiFeaturesLoading && (
                <EyeTracking
                    onGazeDetected={(direction) => {
                        // Actual scrolling is handled in EyeTracking component
                    }}
                    enabled={eyeTrackingEnabled}
                    showUI={true}
                />
            )}

            {/* Auto-Brightness - Re-enabled with optimized position locking (no longer blocks) */}
            {pageInteractive && userInteracted && !aiFeaturesLoading && (
                <AutoBrightness
                    enabled={autoBrightnessEnabled}
                    showUI={true}
                />
            )}

            {/* Note: LightDetection removed - AutoBrightness handles all brightness adjustments */}
        </div>
    );
}
