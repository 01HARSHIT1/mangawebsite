'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
    FaMoneyBillWave, FaUsers, FaCheckCircle, FaClock, FaTimes, 
    FaChartLine, FaDollarSign, FaPercentage, FaSearch, FaFilter,
    FaDownload, FaPlay, FaStop, FaBan
} from 'react-icons/fa';
import { motion } from 'framer-motion';

interface MonetizationStats {
    platform: {
        totalRevenue: number;
        donationRevenue: number;
        subscriptionRevenue: number;
        coinRevenue: number;
        totalPaidOut: number;
        totalPendingAmount: number;
        netRevenue: number;
    };
    creators: {
        total: number;
        monetized: number;
        verified: number;
        earnings: Array<{
            creatorId: string;
            userId: string;
            username: string;
            email: string;
            displayName: string;
            isVerified: boolean;
            totalEarned: number;
            pendingEarned: number;
            paidEarned: number;
            monetizationEnabled: boolean;
            revenueShare: number;
        }>;
    };
    payouts: {
        pending: Array<{
            _id: string;
            creatorId: string;
            userId: string;
            amount: number;
            currency: string;
            status: string;
            requestedAt: string;
            notes: string;
        }>;
        completed: number;
        failed: number;
        totalPendingAmount: number;
        totalPaidOut: number;
        totalFailedAmount: number;
    };
    analytics: {
        dailyRevenue: Array<{ date: string; amount: number }>;
    };
}

export default function MonetizationDashboardPage() {
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState<MonetizationStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [range, setRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
    const [selectedPayout, setSelectedPayout] = useState<string | null>(null);
    const [processingPayout, setProcessingPayout] = useState(false);
    const [notes, setNotes] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (!isAuthenticated || user?.role !== 'admin') {
            router.push('/admin/login');
            return;
        }
        fetchStats();
    }, [isAuthenticated, user, router, range]);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const response = await fetch(`/api/admin/monetization?range=${range}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Error fetching monetization stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleProcessPayout = async (payoutId: string, action: 'approve' | 'reject') => {
        try {
            setProcessingPayout(true);
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const response = await fetch('/api/admin/monetization', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    payoutRequestId: payoutId,
                    action: action === 'approve' ? 'process' : 'reject',
                    notes,
                })
            });

            if (response.ok) {
                await fetchStats();
                setSelectedPayout(null);
                setNotes('');
                alert(`Payout ${action === 'approve' ? 'processed' : 'rejected'} successfully`);
            } else {
                const error = await response.json();
                alert(`Error: ${error.error}`);
            }
        } catch (error) {
            console.error('Error processing payout:', error);
            alert('Failed to process payout');
        } finally {
            setProcessingPayout(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const filteredCreators = stats?.creators.earnings.filter(c =>
        c.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    if (!isAuthenticated || user?.role !== 'admin') {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Monetization Dashboard</h1>
                        <p className="text-gray-400">Platform revenue, creator earnings, and payout management</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <select
                            value={range}
                            onChange={(e) => setRange(e.target.value as any)}
                            className="bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white"
                        >
                            <option value="7d">Last 7 days</option>
                            <option value="30d">Last 30 days</option>
                            <option value="90d">Last 90 days</option>
                            <option value="all">All time</option>
                        </select>
                        <button
                            onClick={() => fetchStats()}
                            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded text-white"
                        >
                            Refresh
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                    </div>
                ) : stats ? (
                    <>
                        {/* Platform Revenue Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-gradient-to-br from-green-900/50 to-emerald-900/50 rounded-xl p-6 border border-green-500/30"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <FaDollarSign className="text-green-400 text-2xl" />
                                    <span className="text-sm text-gray-400">Total Revenue</span>
                                </div>
                                <div className="text-3xl font-bold text-white">{formatCurrency(stats.platform.totalRevenue)}</div>
                                <div className="text-sm text-gray-400 mt-1">
                                    Net: {formatCurrency(stats.platform.netRevenue)}
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 rounded-xl p-6 border border-blue-500/30"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <FaClock className="text-blue-400 text-2xl" />
                                    <span className="text-sm text-gray-400">Pending Payouts</span>
                                </div>
                                <div className="text-3xl font-bold text-white">{formatCurrency(stats.payouts.totalPendingAmount)}</div>
                                <div className="text-sm text-gray-400 mt-1">
                                    {stats.payouts.pending.length} requests
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-gradient-to-br from-yellow-900/50 to-orange-900/50 rounded-xl p-6 border border-yellow-500/30"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <FaCheckCircle className="text-yellow-400 text-2xl" />
                                    <span className="text-sm text-gray-400">Paid Out</span>
                                </div>
                                <div className="text-3xl font-bold text-white">{formatCurrency(stats.payouts.totalPaidOut)}</div>
                                <div className="text-sm text-gray-400 mt-1">
                                    {stats.payouts.completed} completed
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-xl p-6 border border-purple-500/30"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <FaUsers className="text-purple-400 text-2xl" />
                                    <span className="text-sm text-gray-400">Monetized Creators</span>
                                </div>
                                <div className="text-3xl font-bold text-white">{stats.creators.monetized}</div>
                                <div className="text-sm text-gray-400 mt-1">
                                    of {stats.creators.total} total
                                </div>
                            </motion.div>
                        </div>

                        {/* Revenue Breakdown */}
                        <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
                            <h3 className="text-xl font-bold mb-4">Revenue Breakdown</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 bg-gray-800/50 rounded-lg">
                                    <div className="text-sm text-gray-400 mb-1">Subscriptions</div>
                                    <div className="text-2xl font-bold text-white">{formatCurrency(stats.platform.subscriptionRevenue)}</div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        {((stats.platform.subscriptionRevenue / stats.platform.totalRevenue) * 100 || 0).toFixed(1)}% of total
                                    </div>
                                </div>
                                <div className="p-4 bg-gray-800/50 rounded-lg">
                                    <div className="text-sm text-gray-400 mb-1">Coins/Chapters</div>
                                    <div className="text-2xl font-bold text-white">{formatCurrency(stats.platform.coinRevenue)}</div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        {((stats.platform.coinRevenue / stats.platform.totalRevenue) * 100 || 0).toFixed(1)}% of total
                                    </div>
                                </div>
                                <div className="p-4 bg-gray-800/50 rounded-lg">
                                    <div className="text-sm text-gray-400 mb-1">Donations</div>
                                    <div className="text-2xl font-bold text-white">{formatCurrency(stats.platform.donationRevenue)}</div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        {((stats.platform.donationRevenue / stats.platform.totalRevenue) * 100 || 0).toFixed(1)}% of total
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Daily Revenue Chart */}
                        {stats.analytics.dailyRevenue.length > 0 && (
                            <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
                                <h3 className="text-xl font-bold mb-4">Daily Revenue (Last 30 Days)</h3>
                                <div className="h-64 flex items-end space-x-1">
                                    {stats.analytics.dailyRevenue.map((item, index) => {
                                        const maxRevenue = Math.max(...stats.analytics.dailyRevenue.map(d => d.amount), 1);
                                        const height = (item.amount / maxRevenue) * 100;
                                        return (
                                            <div key={index} className="flex-1 flex flex-col items-center">
                                                <div
                                                    className="w-full bg-gradient-to-t from-green-500 to-emerald-500 rounded-t transition-all hover:opacity-80 cursor-pointer"
                                                    style={{ height: `${height}%` }}
                                                    title={`${item.date}: ${formatCurrency(item.amount)}`}
                                                />
                                                <span className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-top-left whitespace-nowrap">
                                                    {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Pending Payouts */}
                        <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
                            <h3 className="text-xl font-bold mb-4">Pending Payout Requests</h3>
                            {stats.payouts.pending.length === 0 ? (
                                <div className="text-center py-8 text-gray-400">
                                    No pending payout requests
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {stats.payouts.pending.map((payout) => {
                                        const creator = stats.creators.earnings.find(c => c.creatorId === payout.creatorId);
                                        return (
                                            <div
                                                key={payout._id}
                                                className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors"
                                            >
                                                <div className="flex-1">
                                                    <div className="font-semibold text-white">
                                                        {creator?.displayName || payout.userId}
                                                    </div>
                                                    <div className="text-sm text-gray-400">
                                                        {formatCurrency(payout.amount)} • {new Date(payout.requestedAt).toLocaleDateString()}
                                                    </div>
                                                    {payout.notes && (
                                                        <div className="text-xs text-gray-500 mt-1">{payout.notes}</div>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => setSelectedPayout(payout._id)}
                                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-semibold"
                                                    >
                                                        Review
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Top Creators by Earnings */}
                        <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold">Creator Earnings</h3>
                                <div className="relative">
                                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search creators..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                {filteredCreators.slice(0, 20).map((creator) => (
                                    <div
                                        key={creator.creatorId}
                                        className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-white">{creator.displayName}</span>
                                                {creator.isVerified && (
                                                    <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded">Verified</span>
                                                )}
                                                {!creator.monetizationEnabled && (
                                                    <span className="px-2 py-0.5 bg-red-600 text-white text-xs rounded">Disabled</span>
                                                )}
                                            </div>
                                            <div className="text-sm text-gray-400 mt-1">
                                                Total: {formatCurrency(creator.totalEarned)} • 
                                                Pending: {formatCurrency(creator.pendingEarned)} • 
                                                Paid: {formatCurrency(creator.paidEarned)}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm text-gray-400">Revenue Share</div>
                                            <div className="text-lg font-bold text-orange-400">{creator.revenueShare}%</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-20 bg-gray-900 rounded-lg">
                        <p className="text-gray-400">No monetization data available</p>
                    </div>
                )}

                {/* Payout Review Modal */}
                {selectedPayout && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                        <div className="bg-gray-900 rounded-lg max-w-md w-full p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold">Review Payout Request</h3>
                                <button
                                    onClick={() => {
                                        setSelectedPayout(null);
                                        setNotes('');
                                    }}
                                    className="text-gray-400 hover:text-white"
                                >
                                    <FaTimes className="w-5 h-5" />
                                </button>
                            </div>

                            {(() => {
                                const payout = stats?.payouts.pending.find(p => p._id === selectedPayout);
                                const creator = payout ? stats?.creators.earnings.find(c => c.creatorId === payout.creatorId) : null;
                                
                                return payout ? (
                                    <>
                                        <div className="space-y-4 mb-6">
                                            <div>
                                                <div className="text-sm text-gray-400">Creator</div>
                                                <div className="font-semibold text-white">{creator?.displayName || payout.userId}</div>
                                                <div className="text-xs text-gray-500">{creator?.email}</div>
                                            </div>
                                            <div>
                                                <div className="text-sm text-gray-400">Amount</div>
                                                <div className="text-2xl font-bold text-white">{formatCurrency(payout.amount)}</div>
                                            </div>
                                            <div>
                                                <div className="text-sm text-gray-400">Requested</div>
                                                <div className="text-white">{new Date(payout.requestedAt).toLocaleString()}</div>
                                            </div>
                                            {creator && (
                                                <div>
                                                    <div className="text-sm text-gray-400">Pending Balance</div>
                                                    <div className="text-white">{formatCurrency(creator.pendingEarned)}</div>
                                                </div>
                                            )}
                                            <div>
                                                <label className="block text-sm font-semibold mb-2">Notes (optional)</label>
                                                <textarea
                                                    value={notes}
                                                    onChange={(e) => setNotes(e.target.value)}
                                                    rows={3}
                                                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                                                    placeholder="Add notes about this payout..."
                                                />
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleProcessPayout(payout._id, 'approve')}
                                                disabled={processingPayout}
                                                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                                            >
                                                <FaCheckCircle />
                                                Approve & Process
                                            </button>
                                            <button
                                                onClick={() => handleProcessPayout(payout._id, 'reject')}
                                                disabled={processingPayout}
                                                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                                            >
                                                <FaTimes />
                                                Reject
                                            </button>
                                        </div>
                                    </>
                                ) : null;
                            })()}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
