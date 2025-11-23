"use client";
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaChevronLeft, FaChevronRight, FaHome, FaChevronDown, FaFacebook, FaTwitter, FaInstagram, FaDiscord, FaWhatsapp, FaShareAlt } from 'react-icons/fa';
import { socialMediaLinks, websiteInfo } from '@/config/socialMedia';
import VoiceAssistant from './VoiceAssistant';
import EyeTracking from './EyeTracking';
import LightDetection from './LightDetection';
import ChapterSummary from './ChapterSummary';
import PreviouslyOnRecap from './PreviouslyOnRecap';
import { useAIFeatures } from '@/hooks/useAIFeatures';

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

    // AI Features
    const { voiceAssistantEnabled, eyeTrackingEnabled, autoBrightnessEnabled, isFeatureEnabled } = useAIFeatures();
    const chapterSummariesEnabled = isFeatureEnabled('chapterSummaries');
    const previouslyOnEnabled = isFeatureEnabled('previouslyOnRecap');

    const mangaId = typeof manga._id === 'string' ? manga._id : manga._id?.toString() || '';
    const chapterId = typeof chapter._id === 'string' ? chapter._id : chapter._id?.toString() || '';

    // Get chapter pages
    const pages = Array.isArray(chapter.pages) ? chapter.pages : [];
    const pdfUrl = chapter?.pdfUrl || chapter?.pdfFile?.secure_url || '';

    // Convert PDF pages to Cloudinary image URLs
    const [loadedPageCount, setLoadedPageCount] = useState(0);
    const [failedPages, setFailedPages] = useState(0);
    const maxPages = 100; // Maximum pages to try loading
    const maxConsecutiveFailures = 3; // Stop after 3 consecutive failures

    const chapterImages: string[] = [];

    if (pdfUrl && pdfUrl.includes('cloudinary.com')) {
        // Cloudinary PDF to image transformation
        // We'll try loading pages until we hit consecutive failures
        for (let i = 1; i <= maxPages; i++) {
            // Transform: /upload/ -> /upload/f_jpg,pg_{pageNumber},q_auto/
            const imageUrl = pdfUrl.replace('/upload/', `/upload/f_jpg,pg_${i},q_auto/`);
            chapterImages.push(imageUrl);
        }
    } else if (pages.length > 0) {
        // Use existing pages
        pages.forEach((page: any) => {
            if (typeof page === 'string') {
                chapterImages.push(page);
            } else if (page?.imagePath) {
                chapterImages.push(page.imagePath);
            }
        });
    }

    // Track image load errors
    const handleImageError = (pageIndex: number) => {
        setFailedPages(prev => {
            const newFailedCount = prev + 1;
            // If we have too many consecutive failures near the end, we've reached the last page
            if (pageIndex > 5 && newFailedCount >= maxConsecutiveFailures) {
                console.log(`📄 Detected end of chapter at page ${pageIndex}`);
            }
            return newFailedCount;
        });
    };

    const handleImageLoad = (pageIndex: number) => {
        setLoadedPageCount(pageIndex + 1);
        setFailedPages(0); // Reset consecutive failures
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
                console.log('Unknown voice command:', command);
        }
    };

    // Check if user is logged in
    useEffect(() => {
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        if (token) {
            setIsLoggedIn(true);
            // Fetch user info
            fetch('/api/profile', {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(data => {
                    if (data.user) {
                        setUsername(data.user.username || 'Anonymous');
                    }
                })
                .catch(err => console.error('Failed to fetch user info:', err));
        }
    }, []);

    // Load comments
    useEffect(() => {
        if (chapterId) {
            fetch(`/api/comments/${chapterId}`)
                .then(res => res.json())
                .then(data => {
                    if (data.comments) {
                        setComments(data.comments);
                    }
                })
                .catch(err => console.error('Failed to load comments:', err));
        }
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

            {/* AI Features: Previously On Recap & Chapter Summary */}
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

            {/* Manga Content */}
            <div className="w-full max-w-4xl mx-auto py-8 px-4">
                {chapterImages.length > 0 ? (
                    <div className="space-y-2">
                        {chapterImages.map((imageSrc, index) => {
                            // Stop rendering after too many consecutive failures
                            if (index > loadedPageCount + maxConsecutiveFailures) {
                                return null;
                    }

                    return (
                                <img
                            key={index}
                                src={imageSrc}
                                    alt={`Page ${index + 1}`}
                                    className="w-full h-auto"
                                    onLoad={() => handleImageLoad(index)}
                                onError={(e) => {
                                        handleImageError(index);
                                        // Hide broken images (pages beyond actual count)
                                        e.currentTarget.style.display = 'none';
                                    }}
                                    loading="lazy"
                                />
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

            {/* Voice Assistant */}
            {voiceAssistantEnabled && (
                <VoiceAssistant
                    onCommand={handleVoiceCommand}
                    enabled={voiceAssistantEnabled}
                    showUI={true}
                />
            )}

            {/* Eye Tracking - Always show on chapter pages for visibility */}
            <EyeTracking
                onGazeDetected={(direction) => {
                    console.log('👁️ Eye Tracking: Gaze detected in ChapterReader', direction);
                    if (direction === 'down' && isFeatureEnabled('autoScroll')) {
                        window.scrollBy({ top: window.innerHeight * 0.5, behavior: 'smooth' });
                    }
                }}
                enabled={eyeTrackingEnabled}
                showUI={true}
            />

            {/* Light Detection */}
            {autoBrightnessEnabled && (
                <LightDetection
                    enabled={autoBrightnessEnabled}
                    showUI={true}
                />
            )}

            {/* Light Detection */}
            {autoBrightnessEnabled && (
                <LightDetection
                    enabled={autoBrightnessEnabled}
                    showUI={true}
                />
            )}
        </div>
    );
}
