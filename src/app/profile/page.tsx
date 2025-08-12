"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FaUser, FaEdit, FaSave, FaTimes, FaCamera, FaTrash, FaHeart, FaBookmark, FaHistory, FaCoins, FaCrown, FaStar, FaEye, FaDownload, FaShare, FaComment, FaThumbsUp, FaThumbsDown, FaFlag, FaBan, FaCheck, FaExclamationTriangle, FaInfoCircle, FaQuestionCircle, FaCog, FaSignOutAlt, FaBell, FaEnvelope, FaPhone, FaGlobe, FaMapMarkerAlt, FaCalendar, FaClock, FaTag, FaLink, FaImage, FaFileAlt, FaVideo, FaCode, FaPalette, FaMagic, FaRocket, FaTrophy, FaMedal, FaGem, FaInfinity, FaFire, FaSnowflake, FaLeaf, FaSun, FaMoon, FaCloud, FaUmbrella, FaMountain, FaTree, FaSeedling, FaRecycle, FaBiohazard, FaRadiation, FaAtom, FaDna, FaVirus, FaBacteria, FaMicroscope, FaSatellite, FaSpaceShuttle, FaRobot, FaAndroid, FaApple, FaWindows, FaLinux, FaUbuntu, FaCentos, FaRedhat, FaSuse, FaUpload, FaShieldAlt, FaUserPlus, FaCheckCircle, FaExclamationCircle, FaChartLine } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';

async function fetchMangaTitle(id: string) {
    try {
        const res = await fetch(`/api/manga/${id}`);
        if (!res.ok) return id;
        const data = await res.json();
        return data.title || id;
    } catch {
        return id;
    }
}

async function fetchChapterTitle(id: string) {
    try {
        const response = await fetch(`/api/chapters/${id}`);
        const data = await response.json();
        return data.title || id;
    } catch {
        return id;
    }
}

export default function ProfilePage() {
    const [user, setUser] = useState<any>(null);
    const [bio, setBio] = useState("");
    const [avatar, setAvatar] = useState<string | null>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [upgrading, setUpgrading] = useState(false);
    const [hasUploadedContent, setHasUploadedContent] = useState(false);
    const [upgradeMessage, setUpgradeMessage] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const [bookmarkTitles, setBookmarkTitles] = useState<{ [id: string]: string }>({});
    const [chapterBookmarkTitles, setChapterBookmarkTitles] = useState<{ [key: string]: { manga: string, chapter: string } }>({});
    const [historyTitles, setHistoryTitles] = useState<{ [key: string]: string }>({});
    const [transactions, setTransactions] = useState<any[]>([]);
    const { user: authUser, updateUser, refreshUser } = useAuth();

    useEffect(() => {
        if (!authUser) {
            router.push("/login");
            return;
        }

        console.log('Profile page: authUser received:', {
            nickname: authUser.nickname,
            bio: authUser.bio,
            avatarUrl: authUser.avatarUrl,
            hasBio: !!authUser.bio,
            hasAvatar: !!authUser.avatarUrl
        });

        setUser(authUser);
        setBio(authUser.bio || "");
        setAvatar(authUser.avatarUrl || null);

        console.log('Profile page: State initialized with:', {
            bio: authUser.bio || "",
            avatar: authUser.avatarUrl || null
        });

        // Force a fresh data fetch on every page load
        console.log('Profile page: Triggering fresh data fetch...');
        setTimeout(() => {
            refreshUser();
            setRefreshTrigger(prev => prev + 1);
        }, 100);
    }, [authUser, router, refreshUser]);

    // Update local state whenever authUser changes
    useEffect(() => {
        if (authUser) {
            console.log('Profile page: Updating local state from authUser:', {
                bio: authUser.bio,
                avatarUrl: authUser.avatarUrl
            });
            setBio(authUser.bio || "");
            setAvatar(authUser.avatarUrl || null);
        }
    }, [authUser]);

    // Force refresh on component mount
    useEffect(() => {
        if (authUser) {
            console.log('Profile page: Component mounted, forcing refresh...');
            // Force a refresh after a short delay to ensure AuthContext is ready
            const timer = setTimeout(() => {
                refreshUser();
                setRefreshTrigger(prev => prev + 1);
            }, 200);
            return () => clearTimeout(timer);
        }
    }, [authUser, refreshUser]);

    useEffect(() => {
        if (user && user.bookmarks) {
            user.bookmarks.forEach((b: any) => {
                if (typeof b === 'string') {
                    if (!bookmarkTitles[b]) {
                        fetchMangaTitle(b).then(title => setBookmarkTitles(t => ({ ...t, [b]: title })));
                    }
                } else if (b && b.mangaId && b.chapterId) {
                    const key = `${b.mangaId}/${b.chapterId}`;
                    if (!chapterBookmarkTitles[key]) {
                        Promise.all([
                            fetchMangaTitle(b.mangaId),
                            fetchChapterTitle(b.chapterId)
                        ]).then(([manga, chapter]) => setChapterBookmarkTitles(t => ({ ...t, [key]: { manga, chapter } })));
                    }
                }
            });
        }
        if (user && user.readingHistory) {
            user.readingHistory.forEach((entry: any) => {
                const key = entry.chapterId ? `${entry.mangaId}/${entry.chapterId}` : entry.mangaId;
                if (!historyTitles[key]) {
                    if (entry.chapterId) {
                        fetchChapterTitle(entry.chapterId).then(title => setHistoryTitles(t => ({ ...t, [key]: title })));
                    } else {
                        fetchMangaTitle(entry.mangaId).then(title => setHistoryTitles(t => ({ ...t, [key]: title })));
                    }
                }
            });
        }
        // Fetch transaction history
        const token = localStorage.getItem('token');
        if (token) {
            fetch('/api/coins', { headers: { Authorization: `Bearer ${token}` } })
                .then(res => res.json())
                .then(data => setTransactions(Array.isArray(data.transactions) ? data.transactions : []));
        }
        // eslint-disable-next-line
    }, [user]);

    // Check if user has uploaded content
    useEffect(() => {
        if (user && user.role === 'viewer') {
            const token = localStorage.getItem('token');
            if (token) {
                fetch('/api/manga', {
                    headers: { Authorization: `Bearer ${token}` }
                })
                    .then(res => res.json())
                    .then(data => {
                        if (Array.isArray(data)) {
                            const userContent = data.filter((m: any) => m.uploaderId === user.id);
                            setHasUploadedContent(userContent.length > 0);
                            if (userContent.length > 0) {
                                setUpgradeMessage("You have uploaded content! You can now request creator status.");
                            } else {
                                setUpgradeMessage("Upload your first manga to become a creator.");
                            }
                        }
                    })
                    .catch(() => {
                        setUpgradeMessage("Upload your first manga to become a creator.");
                    });
            }
        }
    }, [user]);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setAvatarFile(e.target.files[0]);
            setAvatar(URL.createObjectURL(e.target.files[0]));
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setError("");
        setSuccess("");
        const token = localStorage.getItem("token");
        const formData = new FormData();
        formData.append("bio", bio);
        if (avatarFile) formData.append("avatar", avatarFile);

        console.log('Profile page: Saving profile with bio:', bio);
        console.log('Profile page: Avatar file present:', !!avatarFile);

        const res = await fetch("/api/profile", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`
                // Don't set Content-Type for FormData - browser will set it automatically
            },
            body: formData,
        });

        console.log('Profile page: Response status:', res.status);
        const data = await res.json();
        console.log('Profile page: Response data:', data);

        setSaving(false);
        if (!res.ok) {
            setError(data.error || "Failed to update profile");
            console.error('Profile page: Update failed:', data.error);
        } else {
            setSuccess("Profile updated!");
            setAvatarFile(null);

            // Add a small delay to ensure database update is complete
            setTimeout(async () => {
                await refreshUser();
                setRefreshTrigger(prev => prev + 1);
                console.log('Profile page: Profile update completed successfully');
            }, 500);
        }
    };

    const handleUpgradeRequest = async () => {
        setUpgrading(true);
        setError("");
        setSuccess("");

        const token = localStorage.getItem('token');
        if (!token) {
            setError("Please log in to request creator status.");
            setUpgrading(false);
            return;
        }

        try {
            const response = await fetch('/api/auth/upgrade-to-creator', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setSuccess("🎉 Congratulations! You are now a creator!");
                // Refresh user data to get updated role
                setTimeout(async () => {
                    await refreshUser();
                    setRefreshTrigger(prev => prev + 1);
                }, 1000);
            } else {
                setError(data.error || "Upgrade request failed. Please try again.");
                if (data.suggestion) {
                    setError(prev => prev + " " + data.suggestion);
                }
            }
        } catch (err) {
            setError("Network error. Please try again.");
        } finally {
            setUpgrading(false);
        }
    };

    const clearMessages = () => {
        setError("");
        setSuccess("");
    };

    if (!user) return <div className="text-gray-400 p-12 text-center text-lg">Loading...</div>;

    return (
        <div className="max-w-lg mx-auto my-12 p-8 bg-gray-900 rounded-2xl shadow-2xl text-white">
            <h2 className="text-2xl font-bold mb-8 text-blue-400">My Profile</h2>

            {/* Creator Upgrade Section */}
            {user.role === 'viewer' && (
                <div className="mb-6 p-4 bg-gradient-to-r from-yellow-900 to-orange-900 rounded-lg border border-yellow-600">
                    <div className="flex items-center mb-3">
                        <FaUserPlus className="text-yellow-300 text-xl mr-2" />
                        <h3 className="font-semibold text-yellow-300 text-lg">Become a Creator</h3>
                    </div>
                    <p className="text-gray-300 mb-3">{upgradeMessage}</p>

                    <div className="space-y-3">
                        {!hasUploadedContent ? (
                            <div className="flex items-center p-3 bg-gray-800 rounded-lg">
                                <FaUpload className="text-blue-400 mr-3" />
                                <div className="flex-1">
                                    <p className="text-sm text-gray-300">Step 1: Upload your first manga</p>
                                    <p className="text-xs text-gray-400">Create and upload a manga series to get started</p>
                                </div>
                                <button
                                    onClick={() => router.push('/upload?type=manga')}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-semibold transition"
                                >
                                    Upload Manga
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center p-3 bg-green-900 rounded-lg">
                                <FaCheckCircle className="text-green-400 mr-3" />
                                <div className="flex-1">
                                    <p className="text-sm text-green-300">✓ Content uploaded successfully!</p>
                                    <p className="text-xs text-gray-400">You can now request creator status</p>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={handleUpgradeRequest}
                            disabled={upgrading || !hasUploadedContent}
                            className={`w-full py-3 px-4 rounded-lg font-semibold transition ${hasUploadedContent
                                    ? 'bg-green-600 hover:bg-green-500 text-white'
                                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            {upgrading ? (
                                <span className="flex items-center justify-center">
                                    <FaCog className="animate-spin mr-2" />
                                    Upgrading...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center">
                                    <FaCrown className="mr-2" />
                                    {hasUploadedContent ? 'Request Creator Status' : 'Upload Content First'}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Creator Success Section */}
            {user.role === 'creator' && (
                <div className="mb-6 p-4 bg-gradient-to-r from-green-900 to-emerald-900 rounded-lg border border-green-600">
                    <div className="flex items-center mb-3">
                        <FaCrown className="text-green-300 text-xl mr-2" />
                        <h3 className="font-semibold text-green-300 text-lg">Creator Status Active</h3>
                    </div>
                    <p className="text-gray-300 mb-3">You now have access to creator features and analytics!</p>
                    <button
                        onClick={() => router.push('/creator-panel')}
                        className="w-full py-3 px-4 bg-green-600 hover:bg-green-500 text-white rounded-lg font-semibold transition flex items-center justify-center"
                    >
                        <FaChartLine className="mr-2" />
                        Go to Creator Panel
                    </button>
                </div>
            )}

            {/* Admin Manual Upgrade Section */}
            {user.role === 'admin' && (
                <div className="mb-6 p-4 bg-gradient-to-r from-purple-900 to-indigo-900 rounded-lg border border-purple-600">
                    <div className="flex items-center mb-3">
                        <FaShieldAlt className="text-purple-300 text-xl mr-2" />
                        <h3 className="font-semibold text-purple-300 text-lg">Admin Controls</h3>
                    </div>
                    <p className="text-gray-300 mb-3">You can manually upgrade users to creator status.</p>
                    <button
                        onClick={() => router.push('/admin-dashboard')}
                        className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold transition flex items-center justify-center"
                    >
                        <FaCog className="mr-2" />
                        Admin Dashboard
                    </button>
                </div>
            )}

            <div className="flex items-center mb-8">
                <div className="mr-8">
                    <div
                        className="w-24 h-24 rounded-full overflow-hidden bg-gray-800 flex items-center justify-center text-4xl text-gray-400 cursor-pointer border-4 border-blue-700 shadow-lg hover:scale-105 transition"
                        onClick={() => fileInputRef.current?.click()}
                        tabIndex={0}
                        aria-label="Change avatar"
                    >
                        {avatar ? <img src={avatar} alt="avatar" className="w-full h-full object-cover" /> : user.nickname?.[0]?.toUpperCase()}
                    </div>
                    <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleAvatarChange} aria-label="Avatar File Input" />
                </div>
                <div>
                    <div className="font-bold text-xl mb-1">{user.nickname}</div>
                    <div className="text-gray-400 text-sm mb-1">{user.email}</div>
                    <div className="text-gray-400 text-sm mb-1">DOB: {user.dateOfBirth}</div>
                    <div className={`font-semibold text-sm mt-1 ${user.role === 'admin' ? 'text-purple-400' :
                            user.role === 'creator' ? 'text-green-400' :
                                'text-blue-400'
                        }`}>
                        {user.role?.toUpperCase()}
                    </div>
                </div>
            </div>
            <div className="mb-6">
                <label htmlFor="bio" className="block font-semibold mb-1">Bio</label>
                <textarea id="bio" value={bio} onChange={e => setBio(e.target.value)} rows={3} className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-blue-400 focus:outline-none" aria-label="Bio" aria-describedby="bio-description" />
                <p id="bio-description" className="text-gray-400 text-sm mt-1">Tell us about yourself.</p>
            </div>
            {/* Bookmarks */}
            <div className="mb-6">
                <div className="font-semibold text-lg mb-2">Bookmarks</div>
                {user.bookmarks && user.bookmarks.length > 0 ? (
                    <ul className="pl-4 space-y-2">
                        {user.bookmarks.map((b: any, idx: number) => {
                            if (typeof b === 'string') {
                                // Manga bookmark
                                return (
                                    <li key={b} className="flex items-center justify-between text-blue-400 text-base">
                                        <a href={`/manga/${b}`} className="underline hover:text-blue-300 focus:ring-2 focus:ring-blue-400 focus:outline-none" aria-label={`Go to manga ${bookmarkTitles[b] || b}`}>{bookmarkTitles[b] || 'Loading...'}</a>
                                        <button
                                            onClick={async () => {
                                                const token = localStorage.getItem('token');
                                                await fetch('/api/profile', {
                                                    method: 'PUT',
                                                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                                    body: JSON.stringify({ action: 'removeBookmark', mangaId: b })
                                                });
                                                setUser((u: any) => ({ ...u, bookmarks: u.bookmarks.filter((x: any) => x !== b) }));
                                            }}
                                            className="ml-4 text-red-400 hover:text-red-600 font-bold focus:ring-2 focus:ring-red-400 focus:outline-none transition"
                                            aria-label={`Remove bookmark for ${bookmarkTitles[b] || b}`}
                                        >Remove</button>
                                    </li>
                                );
                            } else if (b && b.mangaId && b.chapterId) {
                                // Chapter bookmark
                                const key = `${b.mangaId}/${b.chapterId}`;
                                const titles = chapterBookmarkTitles[key] || { manga: 'Loading...', chapter: 'Loading...' };
                                return (
                                    <li key={key} className="flex items-center justify-between text-blue-400 text-base">
                                        <a href={`/manga/${b.mangaId}/chapter/${b.chapterId}`} className="underline hover:text-blue-300 focus:ring-2 focus:ring-blue-400 focus:outline-none" aria-label={`Go to chapter ${titles.chapter} of ${titles.manga}`}>{titles.manga} — {titles.chapter}</a>
                                        <button
                                            onClick={async () => {
                                                const token = localStorage.getItem('token');
                                                await fetch('/api/profile', {
                                                    method: 'PUT',
                                                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                                    body: JSON.stringify({ action: 'removeChapterBookmark', mangaId: b.mangaId, chapterId: b.chapterId })
                                                });
                                                setUser((u: any) => ({ ...u, bookmarks: u.bookmarks.filter((x: any) => !(x && x.mangaId === b.mangaId && x.chapterId === b.chapterId)) }));
                                            }}
                                            className="ml-4 text-red-400 hover:text-red-600 font-bold focus:ring-2 focus:ring-red-400 focus:outline-none transition"
                                            aria-label={`Remove bookmark for chapter ${titles.chapter} of ${titles.manga}`}
                                        >Remove</button>
                                    </li>
                                );
                            }
                            return null;
                        })}
                    </ul>
                ) : (
                    <div className="text-gray-400 text-base">No bookmarks yet.</div>
                )}
            </div>
            {/* Reading History */}
            <div className="mb-6">
                <div className="font-semibold text-lg mb-2">Reading History</div>
                {user.readingHistory && user.readingHistory.length > 0 ? (
                    <ul className="pl-4 space-y-2">
                        {user.readingHistory.map((entry: any, i: number) => {
                            const key = entry.chapterId ? `${entry.mangaId}/${entry.chapterId}` : entry.mangaId;
                            return (
                                <li key={i} className="text-base text-blue-200">
                                    <a
                                        href={entry.chapterId ? `/manga/${entry.mangaId}/chapter/${entry.chapterId}` : `/manga/${entry.mangaId}`}
                                        className="underline hover:text-blue-300 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                                        aria-label={`Go to ${historyTitles[key] || key}`}
                                    >
                                        {historyTitles[key] || 'Loading...'}
                                    </a>
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <div className="text-gray-400 text-base">No reading history yet.</div>
                )}
            </div>
            {/* Transaction History */}
            <div className="mb-6">
                <div className="font-semibold text-lg mb-2">Transaction History</div>
                {transactions.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-gray-800 rounded-lg shadow text-white">
                            <thead>
                                <tr>
                                    <th className="px-4 py-2 text-left">Date</th>
                                    <th className="px-4 py-2 text-left">Type</th>
                                    <th className="px-4 py-2 text-left">Amount</th>
                                    <th className="px-4 py-2 text-left">Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((tx, i) => (
                                    <tr key={tx._id || i} className="border-b border-gray-700">
                                        <td className="px-4 py-2 text-gray-300">{tx.createdAt ? new Date(tx.createdAt).toLocaleString() : ''}</td>
                                        <td className="px-4 py-2 font-semibold text-blue-300">{tx.type === 'purchase' ? 'Purchase' : 'Spend'}</td>
                                        <td className="px-4 py-2 font-bold text-yellow-300">{tx.type === 'purchase' ? '+' : '-'}{tx.amount} 🪙</td>
                                        <td className="px-4 py-2 text-gray-400">{tx.type === 'purchase' ? 'Coin Purchase' : (tx.description || 'Spend')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-gray-400 text-base">No transactions yet.</div>
                )}
            </div>
            {/* Messages */}
            {(error || success) && (
                <div className="mb-6">
                    {error && (
                        <div className="p-4 bg-red-900 border border-red-600 rounded-lg text-red-300 mb-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <FaExclamationCircle className="mr-2" />
                                    <span>{error}</span>
                                </div>
                                <button onClick={clearMessages} className="text-red-400 hover:text-red-300">
                                    <FaTimes />
                                </button>
                            </div>
                        </div>
                    )}
                    {success && (
                        <div className="p-4 bg-green-900 border border-green-600 rounded-lg text-green-300 mb-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <FaCheckCircle className="mr-2" />
                                    <span>{success}</span>
                                </div>
                                <button onClick={clearMessages} className="text-green-400 hover:text-green-300">
                                    <FaTimes />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Debug button for testing */}
            {process.env.NODE_ENV === 'development' && (
                <div className="mb-4 space-y-2">
                    <button
                        onClick={() => {
                            refreshUser();
                            setRefreshTrigger(prev => prev + 1);
                        }}
                        className="w-full py-2 rounded-lg bg-yellow-600 hover:bg-yellow-500 font-bold text-white shadow focus:ring-2 focus:ring-yellow-400 focus:outline-none transition"
                    >
                        🔄 Refresh Data (Debug)
                    </button>
                    <div className="text-xs text-gray-400 text-center">
                        Current Bio: "{bio || 'Not set'}" | Avatar: {avatar ? 'Set' : 'Not set'}
                    </div>
                </div>
            )}

            <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 font-bold text-lg shadow focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
                aria-label="Save profile"
            >{saving ? 'Saving...' : 'Save'}</button>
        </div>
    );
} 