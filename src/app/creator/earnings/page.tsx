'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { DollarSign, TrendingUp, Clock, CheckCircle, XCircle, Download, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

interface EarningsSummary {
    total: number;
    pending: number;
    paid: number;
    currency: string;
    range: string;
}

interface EarningsEntry {
    id: string;
    amount: number;
    currency: string;
    revenueType: string;
    status: string;
    date: string;
    assetId?: string;
}

interface PayoutRequest {
    id: string;
    amount: number;
    currency: string;
    status: string;
    requestedAt: string;
    processedAt?: string;
    notes?: string;
}

export default function CreatorEarningsPage() {
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState<EarningsSummary | null>(null);
    const [earnings, setEarnings] = useState<EarningsEntry[]>([]);
    const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
    const [selectedRange, setSelectedRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
    const [payoutAmount, setPayoutAmount] = useState('');
    const [showPayoutModal, setShowPayoutModal] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }
        fetchEarnings();
        fetchPayouts();
    }, [isAuthenticated, selectedRange]);

    const fetchEarnings = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            if (!token) return;

            const response = await fetch(`/api/creators/earnings?range=${selectedRange}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                setSummary(data.summary);
                setEarnings(data.recentEarnings || []);
            }
        } catch (error) {
            console.error('Error fetching earnings:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPayouts = async () => {
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            if (!token) return;

            const response = await fetch('/api/creators/payout-requests', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                setPayouts(data.payouts || []);
            }
        } catch (error) {
            console.error('Error fetching payouts:', error);
        }
    };

    const handleRequestPayout = async () => {
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            if (!token) return;

            const amount = parseFloat(payoutAmount);
            if (isNaN(amount) || amount <= 0) {
                alert('Please enter a valid amount');
                return;
            }

            const response = await fetch('/api/creators/payout-requests', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ amount }),
            });

            if (response.ok) {
                const data = await response.json();
                alert('Payout request submitted successfully!');
                setShowPayoutModal(false);
                setPayoutAmount('');
                fetchEarnings();
                fetchPayouts();
            } else {
                const error = await response.json();
                alert(error.error || 'Failed to request payout');
            }
        } catch (error) {
            console.error('Error requesting payout:', error);
            alert('Failed to request payout');
        }
    };

    const formatCurrency = (amount: number, currency: string = 'INR') => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency,
            minimumFractionDigits: 0,
        }).format(amount);
    };

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-8">
                    <h1 className="text-4xl font-black mb-2 bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                        Creator Earnings
                    </h1>
                    <p className="text-gray-400">Track your earnings and request payouts</p>
                </div>

                {/* Range Selector */}
                <div className="mb-6 flex gap-2">
                    {(['7d', '30d', '90d', 'all'] as const).map((range) => (
                        <button
                            key={range}
                            onClick={() => setSelectedRange(range)}
                            className={`
                                px-4 py-2 rounded-lg font-semibold transition-all
                                ${selectedRange === range
                                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
                                    : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
                                }
                            `}
                        >
                            {range === 'all' ? 'All Time' : range.toUpperCase()}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
                    </div>
                ) : (
                    <>
                        {/* Summary Cards */}
                        {summary && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-md rounded-xl p-6 border border-purple-500/30"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-gray-400 font-semibold">Total Earnings</h3>
                                        <DollarSign className="w-6 h-6 text-purple-400" />
                                    </div>
                                    <p className="text-3xl font-black text-white">
                                        {formatCurrency(summary.total, summary.currency)}
                                    </p>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 backdrop-blur-md rounded-xl p-6 border border-yellow-500/30"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-gray-400 font-semibold">Pending</h3>
                                        <Clock className="w-6 h-6 text-yellow-400" />
                                    </div>
                                    <p className="text-3xl font-black text-white">
                                        {formatCurrency(summary.pending, summary.currency)}
                                    </p>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 backdrop-blur-md rounded-xl p-6 border border-green-500/30"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-gray-400 font-semibold">Paid</h3>
                                        <CheckCircle className="w-6 h-6 text-green-400" />
                                    </div>
                                    <p className="text-3xl font-black text-white">
                                        {formatCurrency(summary.paid, summary.currency)}
                                    </p>
                                </motion.div>
                            </div>
                        )}

                        {/* Request Payout Button */}
                        {summary && summary.pending > 0 && (
                            <div className="mb-8">
                                <button
                                    onClick={() => setShowPayoutModal(true)}
                                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-purple-500/50"
                                >
                                    Request Payout
                                </button>
                            </div>
                        )}

                        {/* Earnings Table */}
                        <div className="bg-slate-800/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-6 mb-8">
                            <h2 className="text-2xl font-bold mb-4">Recent Earnings</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-slate-700">
                                            <th className="text-left py-3 px-4 text-gray-400">Date</th>
                                            <th className="text-left py-3 px-4 text-gray-400">Type</th>
                                            <th className="text-left py-3 px-4 text-gray-400">Amount</th>
                                            <th className="text-left py-3 px-4 text-gray-400">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {earnings.map((earning) => (
                                            <tr key={earning.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                                                <td className="py-3 px-4">
                                                    {new Date(earning.date).toLocaleDateString()}
                                                </td>
                                                <td className="py-3 px-4 capitalize">{earning.revenueType}</td>
                                                <td className="py-3 px-4 font-semibold">
                                                    {formatCurrency(earning.amount, earning.currency)}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`
                                                        px-2 py-1 rounded text-xs font-semibold
                                                        ${earning.status === 'paid' 
                                                            ? 'bg-green-500/20 text-green-400'
                                                            : earning.status === 'pending'
                                                            ? 'bg-yellow-500/20 text-yellow-400'
                                                            : 'bg-gray-500/20 text-gray-400'
                                                        }
                                                    `}>
                                                        {earning.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Payout History */}
                        <div className="bg-slate-800/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-6">
                            <h2 className="text-2xl font-bold mb-4">Payout History</h2>
                            <div className="space-y-4">
                                {payouts.length > 0 ? (
                                    payouts.map((payout) => (
                                        <div
                                            key={payout.id}
                                            className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700/50"
                                        >
                                            <div>
                                                <p className="font-bold text-lg">
                                                    {formatCurrency(payout.amount, payout.currency)}
                                                </p>
                                                <p className="text-sm text-gray-400">
                                                    Requested: {new Date(payout.requestedAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <span className={`
                                                    px-3 py-1 rounded-full text-sm font-semibold
                                                    ${payout.status === 'completed'
                                                        ? 'bg-green-500/20 text-green-400'
                                                        : payout.status === 'processing'
                                                        ? 'bg-yellow-500/20 text-yellow-400'
                                                        : payout.status === 'failed'
                                                        ? 'bg-red-500/20 text-red-400'
                                                        : 'bg-gray-500/20 text-gray-400'
                                                    }
                                                `}>
                                                    {payout.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-400 text-center py-8">No payout requests yet</p>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Payout Modal */}
            {showPayoutModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-slate-800 rounded-xl p-6 max-w-md w-full border border-slate-700"
                    >
                        <h3 className="text-2xl font-bold mb-4">Request Payout</h3>
                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-gray-400 mb-2">
                                Amount (Available: {summary ? formatCurrency(summary.pending) : '0'})
                            </label>
                            <input
                                type="number"
                                value={payoutAmount}
                                onChange={(e) => setPayoutAmount(e.target.value)}
                                placeholder="Enter amount"
                                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                            />
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowPayoutModal(false)}
                                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRequestPayout}
                                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg font-semibold transition-all"
                            >
                                Request
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}

