'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FaBookmark, FaHistory, FaClock, FaStar, FaEye, FaSearch, FaFilter, FaTh, FaList, FaTrash, FaPlus } from 'react-icons/fa';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

interface MangaItem {
    _id: string;
    title: string;
    creator: string;
    coverImage: string;
    genres: string[];
    rating: number;
    status: string;
    lastReadChapter?: number;
    lastReadDate?: string;
    addedToLibraryDate?: string;
    readingProgress?: number;
    totalChapters?: number;
}

interface ReadingList {
    _id: string;
    name: string;
    description: string;
    manga: string[];
    createdAt: string;
    isDefault: boolean;
}

export default function LibraryPage() {
    const { user, isAuthenticated } = useAuth();
    const [activeTab, setActiveTab] = useState<'bookmarks' | 'history' | 'lists' | 'continue'>('bookmarks');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'recent' | 'alphabetical' | 'rating' | 'progress'>('recent');
    const [filterGenre, setFilterGenre] = useState<string>('all');

    // Data states
    const [bookmarkedManga, setBookmarkedManga] = useState<MangaItem[]>([]);
    const [readingHistory, setReadingHistory] = useState<MangaItem[]>([]);
    const [continueReading, setContinueReading] = useState<MangaItem[]>([]);
    const [readingLists, setReadingLists] = useState<ReadingList[]>([]);
    const [selectedList, setSelectedList] = useState<string>('');

    // UI states
    const [showCreateList, setShowCreateList] = useState(false);
    const [newListName, setNewListName] = useState('');
    const [newListDescription, setNewListDescription] = useState('');

    useEffect(() => {
        if (!isAuthenticated) {
            setLoading(false);
            return;
        }
        loadLibraryData();
    }, [isAuthenticated]);

    const loadLibraryData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            if (!token) {
                console.warn('⚠️ No token found in library page');
                return;
            }

            // Load user profile with bookmarks and history
            const profileResponse = await fetch('/api/profile', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (profileResponse.ok) {
                const profileData = await profileResponse.json();
                const user = profileData.user;

                // Load bookmarked manga and chapters
                if (user.bookmarks && user.bookmarks.length > 0) {
                    console.log('🔖 Processing bookmarks:', user.bookmarks.length, 'items');
                    const bookmarkPromises = user.bookmarks.map(async (bookmark: any) => {
                        try {
                            // Handle both legacy manga bookmarks (string) and new chapter bookmarks (object)
                            const mangaId = typeof bookmark === 'string' ? bookmark : bookmark.mangaId;
                            const chapterId = typeof bookmark === 'object' ? bookmark.chapterId : null;
                            
                            const response = await fetch(`/api/manga/${mangaId}`);
                            if (response.ok) {
                                const mangaData = await response.json();
                                return {
                                    ...mangaData.manga,
                                    addedToLibraryDate: new Date().toISOString(),
                                    bookmarkedChapterId: chapterId,
                                    bookmarkedChapterNumber: chapterId ? await getChapterNumber(mangaId, chapterId) : null
                                };
                            }
                        } catch (error) {
                            console.error(`Failed to load manga ${typeof bookmark === 'string' ? bookmark : bookmark.mangaId}:`, error);
                        }
                        return null;
                    });

                    const bookmarks = (await Promise.all(bookmarkPromises)).filter(Boolean);
                    setBookmarkedManga(bookmarks);
                    console.log('✅ Loaded bookmarks:', bookmarks.length, 'manga/chapters');
                }

                async function getChapterNumber(mangaId: string, chapterId: string) {
                    try {
                        const response = await fetch(`/api/chapters/${chapterId}`);
                        if (response.ok) {
                            const data = await response.json();
                            return data.chapter?.chapterNumber || null;
                        }
                    } catch (error) {
                        console.error('Failed to get chapter number:', error);
                    }
                    return null;
                }

                // Process reading history
                if (user.readingHistory && user.readingHistory.length > 0) {
                    console.log('📚 Processing reading history:', user.readingHistory.length, 'entries');
                    console.log('📖 Raw history sample:', user.readingHistory.slice(0, 3));
                    
                    const historyPromises = user.readingHistory.slice(0, 20).map(async (entry: any) => {
                        try {
                            const response = await fetch(`/api/manga/${entry.mangaId}`);
                            if (response.ok) {
                                const mangaData = await response.json();
                                return {
                                    ...mangaData.manga,
                                    lastReadChapter: entry.chapterNumber || 1,
                                    lastReadDate: entry.timestamp,
                                    lastReadChapterId: entry.chapterId || null
                                };
                            }
                        } catch (error) {
                            console.error(`Failed to load manga ${entry.mangaId}:`, error);
                        }
                        return null;
                    });

                    const history = (await Promise.all(historyPromises)).filter(Boolean);
                    setReadingHistory(history);
                    console.log('✅ Loaded reading history:', history.length, 'manga');

                    // Continue reading: Only show manga where user actually read a chapter (has chapterId)
                    // This filters out manga that were just browsed but not read
                    const continueReadingCandidates = user.readingHistory.filter((entry: any) => entry.chapterId);
                    console.log('📖 Continue reading candidates:', continueReadingCandidates.length, 'entries with chapters');
                    
                    const continuePromises = continueReadingCandidates.slice(0, 10).map(async (entry: any) => {
                        try {
                            const response = await fetch(`/api/manga/${entry.mangaId}`);
                            if (response.ok) {
                                const mangaData = await response.json();
                                return {
                                    ...mangaData.manga,
                                    lastReadChapter: entry.chapterNumber || 1,
                                    lastReadDate: entry.timestamp,
                                    lastReadChapterId: entry.chapterId
                                };
                            }
                        } catch (error) {
                            console.error(`Failed to load manga ${entry.mangaId}:`, error);
                        }
                        return null;
                    });
                    
                    const continueList = (await Promise.all(continuePromises)).filter(Boolean);
                    
                    // Get unique manga (most recent reading of each)
                    const uniqueContinue = continueList.reduce((acc: MangaItem[], current: MangaItem) => {
                        if (!acc.find(item => item._id === current._id)) {
                            acc.push(current);
                        }
                        return acc;
                    }, []);
                    
                    setContinueReading(uniqueContinue);
                    console.log('✅ Continue reading list:', uniqueContinue.length, 'manga');
                }

                // Load reading lists (mock data for now - you can implement this properly)
                setReadingLists([
                    {
                        _id: 'default-reading',
                        name: 'Currently Reading',
                        description: 'Manga you are currently reading',
                        manga: user.bookmarks || [],
                        createdAt: new Date().toISOString(),
                        isDefault: true
                    },
                    {
                        _id: 'default-completed',
                        name: 'Completed',
                        description: 'Manga you have finished reading',
                        manga: [],
                        createdAt: new Date().toISOString(),
                        isDefault: true
                    },
                    {
                        _id: 'default-plan',
                        name: 'Plan to Read',
                        description: 'Manga you want to read later',
                        manga: [],
                        createdAt: new Date().toISOString(),
                        isDefault: true
                    }
                ]);
            }
        } catch (error) {
            console.error('Failed to load library data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveBookmark = async (mangaId: string) => {
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            if (!token) return;

            const response = await fetch('/api/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    action: 'removeBookmark',
                    mangaId
                })
            });

            if (response.ok) {
                setBookmarkedManga(prev => prev.filter(manga => manga._id !== mangaId));
            }
        } catch (error) {
            console.error('Failed to remove bookmark:', error);
        }
    };

    const createReadingList = async () => {
        if (!newListName.trim()) return;

        // Mock implementation - you can implement proper API endpoint
        const newList: ReadingList = {
            _id: `list-${Date.now()}`,
            name: newListName,
            description: newListDescription,
            manga: [],
            createdAt: new Date().toISOString(),
            isDefault: false
        };

        setReadingLists(prev => [...prev, newList]);
        setNewListName('');
        setNewListDescription('');
        setShowCreateList(false);
    };

    const filteredManga = (manga: MangaItem[]) => {
        let filtered = manga;

        // Search filter
        if (searchQuery) {
            filtered = filtered.filter(item =>
                item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.creator.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Genre filter
        if (filterGenre !== 'all') {
            filtered = filtered.filter(item =>
                item.genres.some(genre => genre.toLowerCase() === filterGenre.toLowerCase())
            );
        }

        // Sort
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'alphabetical':
                    return a.title.localeCompare(b.title);
                case 'rating':
                    return (b.rating || 0) - (a.rating || 0);
                case 'progress':
                    return (b.readingProgress || 0) - (a.readingProgress || 0);
                case 'recent':
                default:
                    const dateA = new Date(a.lastReadDate || a.addedToLibraryDate || 0);
                    const dateB = new Date(b.lastReadDate || b.addedToLibraryDate || 0);
                    return dateB.getTime() - dateA.getTime();
            }
        });

        return filtered;
    };

    const renderMangaGrid = (manga: MangaItem[], showRemove = false) => (
        <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' : 'grid-cols-1'}`}>
            <AnimatePresence>
                {manga.map((item, index) => (
                    <motion.div
                        key={item._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.1 }}
                        className={`group bg-slate-800/50 rounded-xl overflow-hidden border border-purple-500/10 hover:border-purple-500/30 transition-all duration-300 ${viewMode === 'list' ? 'flex items-center space-x-4 p-4' : ''
                            }`}
                    >
                        <Link href={`/manga/${item._id}`} className={viewMode === 'list' ? 'flex-shrink-0' : 'block'}>
                            <div className={`relative overflow-hidden ${viewMode === 'list' ? 'w-16 h-20' : 'aspect-[3/4]'}`}>
                                <Image
                                    src={item.coverImage || '/placeholder.svg'}
                                    alt={item.title}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                    sizes={viewMode === 'list' ? '64px' : '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw'}
                                />
                                {item.readingProgress && (
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                                        <div className="w-full bg-gray-600 rounded-full h-1">
                                            <div
                                                className="bg-purple-500 h-1 rounded-full"
                                                style={{ width: `${item.readingProgress}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Link>

                        <div className={`${viewMode === 'list' ? 'flex-1' : 'p-4'}`}>
                            <Link href={`/manga/${item._id}`}>
                                <h3 className="text-white font-semibold mb-1 group-hover:text-purple-400 transition-colors line-clamp-2">
                                    {item.title}
                                </h3>
                                <p className="text-gray-400 text-sm mb-2">by {item.creator}</p>
                            </Link>

                            {item.lastReadChapter && (
                                <div className="text-xs text-purple-400 mb-2">
                                    Last read: Chapter {item.lastReadChapter}
                                </div>
                            )}
                            {item.bookmarkedChapterNumber && (
                                <div className="text-xs text-yellow-400 mb-2">
                                    🔖 Bookmarked: Chapter {item.bookmarkedChapterNumber}
                                </div>
                            )}

                            <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                                <div className="flex items-center space-x-1">
                                    <FaStar className="text-yellow-400" />
                                    <span>{item.rating || 'N/A'}</span>
                                </div>
                                <span className="capitalize">{item.status || 'Unknown'}</span>
                            </div>

                            <div className="flex items-center justify-between">
                                {item.lastReadChapterId || item.bookmarkedChapterId ? (
                                    <Link
                                        href={`/manga/${item._id}/chapter/${item.lastReadChapterId || item.bookmarkedChapterId}`}
                                        className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-full transition-colors"
                                    >
                                        {item.lastReadChapterId ? `Continue Ch. ${item.lastReadChapter}` : `Go to Ch. ${item.bookmarkedChapterNumber}`}
                                    </Link>
                                ) : (
                                    <Link
                                        href={`/manga/${item._id}`}
                                        className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-full transition-colors"
                                    >
                                        Read
                                    </Link>
                                )}

                                {showRemove && (
                                    <button
                                        onClick={() => handleRemoveBookmark(item._id)}
                                        className="text-xs text-red-400 hover:text-red-300 transition-colors"
                                        title="Remove from library"
                                    >
                                        <FaTrash />
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
                <div className="container mx-auto px-4 py-20 text-center">
                    <div className="max-w-md mx-auto">
                        <FaBookmark className="mx-auto text-6xl text-purple-400 mb-6" />
                        <h1 className="text-3xl font-bold mb-4">Library Access Required</h1>
                        <p className="text-gray-400 mb-8">
                            Please sign in to access your personal manga library, bookmarks, and reading history.
                        </p>
                        <div className="space-x-4">
                            <Link
                                href="/login"
                                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                            >
                                Sign In
                            </Link>
                            <Link
                                href="/signup"
                                className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                            >
                                Sign Up
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">My Library</h1>
                        <p className="text-gray-400">Manage your manga collection and reading progress</p>
                    </div>

                    <div className="flex items-center space-x-4">
                        {/* View Mode Toggle */}
                        <div className="flex bg-slate-800 rounded-lg p-1">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-purple-600 text-white' : 'text-gray-400'}`}
                            >
                                <FaTh />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded ${viewMode === 'list' ? 'bg-purple-600 text-white' : 'text-gray-400'}`}
                            >
                                <FaList />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex space-x-1 mb-8 bg-slate-800/50 rounded-lg p-1">
                    {[
                        { id: 'continue', label: 'Continue Reading', icon: FaClock },
                        { id: 'bookmarks', label: 'Bookmarks', icon: FaBookmark },
                        { id: 'history', label: 'Reading History', icon: FaHistory },
                        { id: 'lists', label: 'Reading Lists', icon: FaStar }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${activeTab === tab.id
                                ? 'bg-purple-600 text-white'
                                : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
                                }`}
                        >
                            <tab.icon className="text-sm" />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Filters and Search */}
                <div className="flex flex-wrap items-center gap-4 mb-8">
                    <div className="flex-1 min-w-64">
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search your library..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-800/50 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                            />
                        </div>
                    </div>

                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="bg-slate-800/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                    >
                        <option value="recent">Recently Added</option>
                        <option value="alphabetical">Alphabetical</option>
                        <option value="rating">Rating</option>
                        <option value="progress">Reading Progress</option>
                    </select>

                    <select
                        value={filterGenre}
                        onChange={(e) => setFilterGenre(e.target.value)}
                        className="bg-slate-800/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                    >
                        <option value="all">All Genres</option>
                        <option value="action">Action</option>
                        <option value="romance">Romance</option>
                        <option value="fantasy">Fantasy</option>
                        <option value="comedy">Comedy</option>
                        <option value="drama">Drama</option>
                    </select>
                </div>

                {/* Content */}
                <div className="min-h-96">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
                        </div>
                    ) : (
                        <AnimatePresence mode="wait">
                            {activeTab === 'continue' && (
                                <motion.div
                                    key="continue"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                >
                                    <div className="mb-6">
                                        <h2 className="text-xl font-semibold mb-2">Continue Reading</h2>
                                        <p className="text-gray-400">Pick up where you left off</p>
                                    </div>
                                    {continueReading.length > 0 ? (
                                        renderMangaGrid(filteredManga(continueReading))
                                    ) : (
                                        <div className="text-center py-20">
                                            <FaClock className="mx-auto text-6xl text-gray-600 mb-4" />
                                            <h3 className="text-xl font-semibold text-gray-400 mb-2">No Reading Progress Yet</h3>
                                            <p className="text-gray-500 mb-4">
                                                Start reading manga chapters to track your progress here!
                                            </p>
                                            <div className="max-w-md mx-auto bg-purple-900/20 border border-purple-500/30 rounded-lg p-4 text-sm text-gray-300">
                                                <p className="font-semibold mb-2">💡 How it works:</p>
                                                <ol className="text-left space-y-1 list-decimal list-inside">
                                                    <li>Browse and find a manga you like</li>
                                                    <li><strong>Open and read a chapter</strong> (not just the manga page)</li>
                                                    <li>Come back here to continue where you left off!</li>
                                                </ol>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {activeTab === 'bookmarks' && (
                                <motion.div
                                    key="bookmarks"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                >
                                    <div className="mb-6">
                                        <h2 className="text-xl font-semibold mb-2">Bookmarked Manga</h2>
                                        <p className="text-gray-400">Your saved manga collection ({bookmarkedManga.length} manga)</p>
                                    </div>
                                    {bookmarkedManga.length > 0 ? (
                                        renderMangaGrid(filteredManga(bookmarkedManga), true)
                                    ) : (
                                        <div className="text-center py-20">
                                            <FaBookmark className="mx-auto text-6xl text-gray-600 mb-4" />
                                            <h3 className="text-xl font-semibold text-gray-400 mb-2">No Bookmarks Yet</h3>
                                            <p className="text-gray-500">Bookmark manga you want to read or keep track of!</p>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {activeTab === 'history' && (
                                <motion.div
                                    key="history"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                >
                                    <div className="mb-6">
                                        <h2 className="text-xl font-semibold mb-2">Reading History</h2>
                                        <p className="text-gray-400">Your recent reading activity</p>
                                    </div>
                                    {readingHistory.length > 0 ? (
                                        renderMangaGrid(filteredManga(readingHistory))
                                    ) : (
                                        <div className="text-center py-20">
                                            <FaHistory className="mx-auto text-6xl text-gray-600 mb-4" />
                                            <h3 className="text-xl font-semibold text-gray-400 mb-2">No Reading History</h3>
                                            <p className="text-gray-500">Start reading manga to build your history!</p>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {activeTab === 'lists' && (
                                <motion.div
                                    key="lists"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                >
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h2 className="text-xl font-semibold mb-2">Reading Lists</h2>
                                            <p className="text-gray-400">Organize your manga into custom lists</p>
                                        </div>
                                        <button
                                            onClick={() => setShowCreateList(true)}
                                            className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                                        >
                                            <FaPlus />
                                            <span>New List</span>
                                        </button>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
                                        {readingLists.map((list) => (
                                            <div key={list._id} className="bg-slate-800/50 rounded-xl p-6 border border-purple-500/10">
                                                <div className="flex items-center justify-between mb-3">
                                                    <h3 className="font-semibold text-white">{list.name}</h3>
                                                    <span className="text-sm text-gray-400">{list.manga.length} manga</span>
                                                </div>
                                                <p className="text-gray-400 text-sm mb-4">{list.description}</p>
                                                <button
                                                    onClick={() => setSelectedList(list._id)}
                                                    className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors"
                                                >
                                                    View List →
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Create List Modal */}
                                    {showCreateList && (
                                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                                            <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md">
                                                <h3 className="text-xl font-semibold mb-4">Create New Reading List</h3>
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="block text-sm font-medium mb-2">List Name</label>
                                                        <input
                                                            type="text"
                                                            value={newListName}
                                                            onChange={(e) => setNewListName(e.target.value)}
                                                            className="w-full bg-slate-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                                                            placeholder="e.g., Favorites, To Read Later"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium mb-2">Description (Optional)</label>
                                                        <textarea
                                                            value={newListDescription}
                                                            onChange={(e) => setNewListDescription(e.target.value)}
                                                            className="w-full bg-slate-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                                                            placeholder="Describe your reading list..."
                                                            rows={3}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex space-x-3 mt-6">
                                                    <button
                                                        onClick={createReadingList}
                                                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg transition-colors"
                                                    >
                                                        Create List
                                                    </button>
                                                    <button
                                                        onClick={() => setShowCreateList(false)}
                                                        className="flex-1 bg-slate-600 hover:bg-slate-500 text-white py-2 rounded-lg transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    )}
                </div>
            </div>
        </div>
    );
}
