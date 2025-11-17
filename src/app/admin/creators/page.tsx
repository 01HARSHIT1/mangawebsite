'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { FaCrown, FaCheckCircle, FaTimesCircle, FaEdit, FaUserCheck, FaMoneyBillWave, FaChartLine, FaChevronDown, FaChevronUp, FaBook, FaFileAlt, FaCalendar } from 'react-icons/fa';

interface Creator {
    _id: string;
    username: string;
    email: string;
    isVerified: boolean;
    createdAt: string;
    seriesCount?: number;
    totalViews?: number;
    earnings?: number;
    uploadLimit?: number;
    revenueShare?: number;
}

interface EarningsData {
    creatorId: string;
    period: string;
    totalEarnings: number;
    totalDonations: number;
    periodSummaries: {
        weekly: { total: number; count: number };
        monthly: { total: number; count: number };
        yearly: { total: number; count: number };
        all: { total: number; count: number };
    };
    earningsByManga: Array<{
        mangaId: string;
        mangaTitle: string;
        totalEarnings: number;
        donationCount: number;
        chapterCount: number;
        chapters: Array<{
            chapterId: string;
            chapterNumber: number;
            chapterTitle: string;
            totalEarnings: number;
            donationCount: number;
        }>;
        donations: any[];
    }>;
    recentDonations: any[];
}

export default function AdminCreatorsPage() {
    const [creators, setCreators] = useState<Creator[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
    const [earningsCreatorId, setEarningsCreatorId] = useState<string | null>(null);
    const [earningsData, setEarningsData] = useState<EarningsData | null>(null);
    const [loadingEarnings, setLoadingEarnings] = useState(false);
    const [earningsPeriod, setEarningsPeriod] = useState<'all' | 'weekly' | 'monthly' | 'yearly'>('all');
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isAuthenticated || user?.role !== 'admin') {
            router.push('/admin/login');
            return;
        }
        fetchCreators();
    }, [isAuthenticated, user, router]);

    const fetchCreators = async () => {
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const response = await fetch('/api/admin/creators', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setCreators(data.creators || []);
            }
        } catch (error) {
            console.error('Failed to fetch creators:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCreator = async (creatorId: string) => {
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const response = await fetch(`/api/admin/creators/${creatorId}/verify`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                fetchCreators();
            }
        } catch (error) {
            console.error('Failed to verify creator:', error);
        }
    };

    const handleUpdateSettings = async (creatorId: string, settings: any) => {
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const response = await fetch(`/api/admin/creators/${creatorId}/settings`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(settings)
            });
            if (response.ok) {
                fetchCreators();
                setSelectedCreator(null);
            }
        } catch (error) {
            console.error('Failed to update creator settings:', error);
        }
    };

    const handleViewEarnings = async (creatorId: string) => {
        if (earningsCreatorId === creatorId && earningsData) {
            // Toggle off if already showing
            setEarningsCreatorId(null);
            setEarningsData(null);
            return;
        }

        setEarningsCreatorId(creatorId);
        setLoadingEarnings(true);
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const response = await fetch(`/api/admin/creators/${creatorId}/earnings?period=${earningsPeriod}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setEarningsData(data);
            }
        } catch (error) {
            console.error('Failed to fetch earnings:', error);
        } finally {
            setLoadingEarnings(false);
        }
    };

    // Refetch earnings when period changes
    useEffect(() => {
        if (earningsCreatorId) {
            handleViewEarnings(earningsCreatorId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [earningsPeriod]);

    const filteredCreators = creators.filter(creator =>
        creator.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        creator.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Creator Management
                    </h1>
                    <p className="text-gray-400">Manage creators, verification, and revenue settings</p>
                </div>

                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Search creators..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full max-w-md bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-white"
                    />
                </div>

                <div className="bg-slate-800/50 rounded-2xl p-6 backdrop-blur-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-700">
                            <thead>
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Creator</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Series</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Views</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Earnings</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {filteredCreators.map((creator) => (
                                    <React.Fragment key={creator._id}>
                                        <tr className="hover:bg-slate-700/50">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="font-semibold">{creator.username}</div>
                                                    <div className="text-sm text-gray-400">{creator.email}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                    creator.isVerified
                                                        ? 'bg-green-500/20 text-green-300'
                                                        : 'bg-yellow-500/20 text-yellow-300'
                                                }`}>
                                                    {creator.isVerified ? 'Verified' : 'Pending'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">{creator.seriesCount || 0}</td>
                                            <td className="px-6 py-4">{creator.totalViews?.toLocaleString() || 0}</td>
                                            <td className="px-6 py-4">₹{(creator.earnings || 0).toLocaleString()}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleViewEarnings(creator._id)}
                                                        className="p-2 text-purple-400 hover:text-purple-300"
                                                        title="View Earnings Details"
                                                    >
                                                        <FaMoneyBillWave />
                                                    </button>
                                                    {!creator.isVerified && (
                                                        <button
                                                            onClick={() => handleVerifyCreator(creator._id)}
                                                            className="p-2 text-green-400 hover:text-green-300"
                                                            title="Verify Creator"
                                                        >
                                                            <FaCheckCircle />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => setSelectedCreator(creator)}
                                                        className="p-2 text-blue-400 hover:text-blue-300"
                                                        title="Edit Settings"
                                                    >
                                                        <FaEdit />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        {/* Earnings Details Row */}
                                        {earningsCreatorId === creator._id && (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-4 bg-slate-900/50">
                                                    {loadingEarnings ? (
                                                        <div className="text-center py-8">
                                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
                                                            <p className="text-gray-400 mt-2">Loading earnings...</p>
                                                        </div>
                                                    ) : earningsData ? (
                                                        <EarningsDetailsView 
                                                            earnings={earningsData} 
                                                            period={earningsPeriod}
                                                            onPeriodChange={setEarningsPeriod}
                                                        />
                                                    ) : (
                                                        <div className="text-center py-4 text-gray-400">
                                                            Failed to load earnings data
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Creator Settings Modal */}
                {selectedCreator && (
                    <CreatorSettingsModal
                        creator={selectedCreator}
                        onSave={(settings) => handleUpdateSettings(selectedCreator._id, settings)}
                        onClose={() => setSelectedCreator(null)}
                    />
                )}
            </div>
        </div>
    );
}

function CreatorSettingsModal({ creator, onSave, onClose }: {
    creator: Creator;
    onSave: (settings: any) => void;
    onClose: () => void;
}) {
    const [settings, setSettings] = useState({
        revenueShare: creator.revenueShare || 70,
        uploadLimit: creator.uploadLimit || 10,
        verified: creator.isVerified,
    });

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl p-6 max-w-2xl w-full">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Creator Settings: {creator.username}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <FaTimesCircle />
                    </button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Revenue Share (%)</label>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            value={settings.revenueShare}
                            onChange={(e) => setSettings({ ...settings, revenueShare: parseInt(e.target.value) })}
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white"
                        />
                        <p className="text-xs text-gray-500 mt-1">Percentage of revenue creator receives</p>
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Monthly Upload Limit</label>
                        <input
                            type="number"
                            min="1"
                            value={settings.uploadLimit}
                            onChange={(e) => setSettings({ ...settings, uploadLimit: parseInt(e.target.value) })}
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white"
                        />
                        <p className="text-xs text-gray-500 mt-1">Maximum chapters creator can upload per month</p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={settings.verified}
                                onChange={(e) => setSettings({ ...settings, verified: e.target.checked })}
                                className="mr-2"
                            />
                            <span className="text-sm">Verified Creator</span>
                        </label>
                    </div>
                    <div className="flex gap-2 pt-4">
                        <button
                            onClick={() => onSave(settings)}
                            className="flex-1 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg"
                        >
                            Save Settings
                        </button>
                        <button
                            onClick={onClose}
                            className="flex-1 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function EarningsDetailsView({ earnings, period, onPeriodChange }: {
    earnings: EarningsData;
    period: string;
    onPeriodChange: (period: 'all' | 'weekly' | 'monthly' | 'yearly') => void;
}) {
    return (
        <div className="space-y-6">
            {/* Period Selector */}
            <div className="flex items-center justify-between border-b border-slate-700 pb-4">
                <h3 className="text-lg font-bold text-purple-400">Earnings Breakdown</h3>
                <div className="flex gap-2">
                    {(['all', 'weekly', 'monthly', 'yearly'] as const).map((p) => (
                        <button
                            key={p}
                            onClick={() => onPeriodChange(p)}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                                period === p
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                            }`}
                        >
                            {p.charAt(0).toUpperCase() + p.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-800/50 rounded-lg p-4 border border-purple-500/20">
                    <div className="flex items-center gap-2 mb-2">
                        <FaMoneyBillWave className="text-purple-400" />
                        <p className="text-gray-400 text-sm">Total Earnings</p>
                    </div>
                    <p className="text-2xl font-bold text-white">₹{earnings.totalEarnings.toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-1">{earnings.totalDonations} donations</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 border border-green-500/20">
                    <div className="flex items-center gap-2 mb-2">
                        <FaCalendar className="text-green-400" />
                        <p className="text-gray-400 text-sm">Weekly</p>
                    </div>
                    <p className="text-2xl font-bold text-white">₹{earnings.periodSummaries.weekly.total.toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-1">{earnings.periodSummaries.weekly.count} donations</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 border border-blue-500/20">
                    <div className="flex items-center gap-2 mb-2">
                        <FaCalendar className="text-blue-400" />
                        <p className="text-gray-400 text-sm">Monthly</p>
                    </div>
                    <p className="text-2xl font-bold text-white">₹{earnings.periodSummaries.monthly.total.toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-1">{earnings.periodSummaries.monthly.count} donations</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 border border-yellow-500/20">
                    <div className="flex items-center gap-2 mb-2">
                        <FaCalendar className="text-yellow-400" />
                        <p className="text-gray-400 text-sm">Yearly</p>
                    </div>
                    <p className="text-2xl font-bold text-white">₹{earnings.periodSummaries.yearly.total.toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-1">{earnings.periodSummaries.yearly.count} donations</p>
                </div>
            </div>

            {/* Earnings by Manga */}
            {earnings.earningsByManga.length > 0 && (
                <div>
                    <h4 className="text-md font-semibold text-purple-400 mb-3 flex items-center gap-2">
                        <FaBook /> Earnings by Manga
                    </h4>
                    <div className="space-y-3">
                        {earnings.earningsByManga.map((manga) => (
                            <div key={manga.mangaId} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h5 className="font-semibold text-white">{manga.mangaTitle}</h5>
                                        <p className="text-sm text-gray-400">
                                            {manga.chapterCount} chapters • {manga.donationCount} donations
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-bold text-purple-400">
                                            ₹{manga.totalEarnings.toLocaleString()}
                                        </p>
                                    </div>
                                </div>

                                {/* Chapters Breakdown */}
                                {manga.chapters.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-slate-700">
                                        <p className="text-xs text-gray-400 mb-2">Earnings by Chapter:</p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                            {manga.chapters.map((chapter) => (
                                                <div key={chapter.chapterId} className="bg-slate-900/50 rounded p-2 text-xs">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-gray-300">
                                                            Ch. {chapter.chapterNumber}: {chapter.chapterTitle}
                                                        </span>
                                                        <span className="text-purple-400 font-semibold">
                                                            ₹{chapter.totalEarnings.toFixed(2)}
                                                        </span>
                                                    </div>
                                                    <p className="text-gray-500 mt-1">{chapter.donationCount} donations</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent Donations */}
            {earnings.recentDonations.length > 0 && (
                <div>
                    <h4 className="text-md font-semibold text-purple-400 mb-3 flex items-center gap-2">
                        <FaFileAlt /> Recent Donations
                    </h4>
                    <div className="bg-slate-800/50 rounded-lg overflow-hidden border border-slate-700">
                        <table className="min-w-full divide-y divide-slate-700">
                            <thead className="bg-slate-900/50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-300">Donor</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-300">Amount</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-300">Manga</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-300">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {earnings.recentDonations.map((donation) => (
                                    <tr key={donation._id}>
                                        <td className="px-4 py-2 text-sm text-white">{donation.donorUsername}</td>
                                        <td className="px-4 py-2 text-sm font-semibold text-purple-400">₹{donation.amount}</td>
                                        <td className="px-4 py-2 text-sm text-gray-400">{donation.mangaTitle || 'General Tip'}</td>
                                        <td className="px-4 py-2 text-sm text-gray-400">
                                            {new Date(donation.createdAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {earnings.earningsByManga.length === 0 && earnings.recentDonations.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                    <FaMoneyBillWave className="text-4xl mx-auto mb-2 opacity-50" />
                    <p>No earnings data available for this period</p>
                </div>
            )}
        </div>
    );
}

