'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    FaDollarSign, FaDownload, FaHistory, FaClock, 
    FaCheckCircle, FaExclamationCircle, FaMoneyBillWave
} from 'react-icons/fa';
import DashboardLayout from './DashboardLayout';

interface EarningsData {
    currentBalance: number;
    pendingBalance: number;
    totalEarnings: number;
    donations: Array<{
        _id: string;
        amount: number;
        message: string;
        createdAt: string;
        username: string;
        type?: string;
        mangaTitle?: string | null;
        payoutStatus?: string | null;
        payoutMessage?: string | null;
        payoutId?: string | null;
    }>;
    payouts: Array<{
        _id: string;
        amount: number;
        status: string;
        createdAt: string;
        completedAt?: string;
        razorpayPayoutId?: string | null;
        fundAccountId?: string | null;
        mode?: string | null;
        notes?: Record<string, string> | null;
        error?: string | null;
        donationId?: string | null;
    }>;
}

export default function EarningsPage() {
    const [earnings, setEarnings] = useState<EarningsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [showPayoutModal, setShowPayoutModal] = useState(false);
    const [payoutAmount, setPayoutAmount] = useState('');
    const [requestingPayout, setRequestingPayout] = useState(false);

    useEffect(() => {
        fetchEarnings();
    }, []);

    const fetchEarnings = async () => {
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            
            const response = await fetch('/api/creator/earnings', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                setEarnings({
                    currentBalance: data.currentBalance || 0,
                    pendingBalance: data.pendingBalance || 0,
                    totalEarnings: data.totalEarnings || 0,
                    donations: data.donations || [],
                    payouts: data.payouts || []
                });
            }
        } catch (error) {
            console.error('Error fetching earnings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRequestPayout = async () => {
        const amount = parseFloat(payoutAmount);
        
        if (!amount || amount < 100) {
            alert('Minimum payout amount is ₹100');
            return;
        }

        if (amount > (earnings?.currentBalance || 0)) {
            alert('Insufficient balance');
            return;
        }

        setRequestingPayout(true);

        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const response = await fetch('/api/creator/payouts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ amount })
            });

            if (response.ok) {
                alert('Payout request submitted successfully!');
                setShowPayoutModal(false);
                setPayoutAmount('');
                fetchEarnings();
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to request payout');
            }
        } catch (error) {
            console.error('Error requesting payout:', error);
            alert('Failed to request payout');
        } finally {
            setRequestingPayout(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                        <p className="text-gray-400">Loading earnings...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Earnings & Payouts</h1>
                    <p className="text-gray-400">Manage your revenue and withdraw funds</p>
                </div>

                {/* Balance Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 rounded-2xl p-6 border border-green-500/20"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
                                <FaDollarSign className="text-2xl text-white" />
                            </div>
                            <button
                                onClick={() => setShowPayoutModal(true)}
                                disabled={(earnings?.currentBalance || 0) < 100}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-colors"
                            >
                                Withdraw
                            </button>
                        </div>
                        <h3 className="text-sm font-semibold text-gray-400 mb-1">Available Balance</h3>
                        <p className="text-4xl font-bold text-white">₹{earnings?.currentBalance?.toLocaleString() || '0'}</p>
                        <p className="text-xs text-gray-500 mt-2">Ready for withdrawal</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 rounded-2xl p-6 border border-blue-500/20"
                    >
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl w-fit mb-4">
                            <FaClock className="text-2xl text-white" />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-400 mb-1">Pending Balance</h3>
                        <p className="text-4xl font-bold text-white">₹{earnings?.pendingBalance?.toLocaleString() || '0'}</p>
                        <p className="text-xs text-gray-500 mt-2">Processing (3-5 days)</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-2xl p-6 border border-purple-500/20"
                    >
                        <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl w-fit mb-4">
                            <FaMoneyBillWave className="text-2xl text-white" />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-400 mb-1">Total Earnings</h3>
                        <p className="text-4xl font-bold text-white">₹{earnings?.totalEarnings?.toLocaleString() || '0'}</p>
                        <p className="text-xs text-gray-500 mt-2">All-time revenue</p>
                    </motion.div>
                </div>

                {/* Recent Donations */}
                <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-white flex items-center">
                            <FaHistory className="mr-3 text-green-400" />
                            Recent Donations
                        </h2>
                        <button className="text-sm font-semibold text-purple-400 hover:text-purple-300">
                            Export CSV
                        </button>
                    </div>

                    {earnings?.donations && earnings.donations.length > 0 ? (
                        <div className="space-y-3">
                            {earnings.donations.map((donation) => (
                                <div
                                    key={donation._id}
                                    className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl border border-slate-700/30"
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                                            <span className="text-white font-bold">
                                                {donation.username?.charAt(0).toUpperCase() || 'U'}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-white">{donation.username || 'Anonymous'}</p>
                                            {donation.message && (
                                                <p className="text-sm text-gray-400 italic">"{donation.message}"</p>
                                            )}
                                        {donation.mangaTitle && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                For <span className="text-gray-300">{donation.mangaTitle}</span>
                                            </p>
                                        )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-green-400">+₹{donation.amount}</p>
                                        <p className="text-xs text-gray-500">
                                            {new Date(donation.createdAt).toLocaleDateString()}
                                        </p>
                                    {donation.type && (
                                        <p className="text-xs text-purple-300 uppercase tracking-wide mt-1">
                                            {donation.type === 'creator-tip' ? 'Creator Tip' : donation.type}
                                        </p>
                                    )}
                                        {donation.payoutStatus && (
                                            <p className="text-xs text-gray-400 mt-1">
                                                Payout:{' '}
                                                <span className="capitalize text-gray-200">
                                                    {donation.payoutStatus}
                                                </span>
                                            </p>
                                        )}
                                        {donation.payoutMessage && (
                                            <p className="text-xs text-gray-500 italic mt-1">
                                                {donation.payoutMessage}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">💰</div>
                            <p className="text-gray-400">No donations yet</p>
                        </div>
                    )}
                </div>

                {/* Payout History */}
                <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                        <FaDownload className="mr-3 text-blue-400" />
                        Payout History
                    </h2>

                    {earnings?.payouts && earnings.payouts.length > 0 ? (
                        <div className="space-y-3">
                            {earnings.payouts.map((payout) => (
                                <div
                                    key={payout._id}
                                    className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl border border-slate-700/30"
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className={`p-3 rounded-xl ${
                                            payout.status === 'completed' 
                                                ? 'bg-green-900/30' 
                                                : payout.status === 'processing'
                                                ? 'bg-blue-900/30'
                                                : payout.status === 'requested'
                                                ? 'bg-amber-900/30'
                                                : 'bg-red-900/30'
                                        }`}>
                                            {payout.status === 'completed' ? (
                                                <FaCheckCircle className="text-green-400" />
                                            ) : payout.status === 'processing' ? (
                                                <FaClock className="text-blue-400" />
                                            ) : payout.status === 'requested' ? (
                                                <FaClock className="text-amber-400" />
                                            ) : (
                                                <FaExclamationCircle className="text-red-400" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-white capitalize">{payout.status}</p>
                                            <p className="text-sm text-gray-400">
                                                Requested: {new Date(payout.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-white">₹{payout.amount.toLocaleString()}</p>
                                        {payout.completedAt && (
                                            <p className="text-xs text-gray-500">
                                                Completed: {new Date(payout.completedAt).toLocaleDateString()}
                                            </p>
                                        )}
                                        {payout.razorpayPayoutId && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                Ref:{' '}
                                                <span className="text-gray-300">
                                                    {payout.razorpayPayoutId}
                                                </span>
                                            </p>
                                        )}
                                        {payout.mode && (
                                            <p className="text-xs text-gray-500 mt-1 uppercase">
                                                Mode: {payout.mode}
                                            </p>
                                        )}
                                        {payout.error && (
                                            <p className="text-xs text-red-400 mt-1">
                                                {payout.error}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">📤</div>
                            <p className="text-gray-400">No payout requests yet</p>
                            <p className="text-sm text-gray-500 mt-2">Minimum withdrawal: ₹100</p>
                        </div>
                    )}
                </div>

                {/* Payout Modal */}
                {showPayoutModal && (
                    <div 
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowPayoutModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-slate-900 rounded-2xl p-8 max-w-md w-full border border-slate-700"
                        >
                            <h3 className="text-2xl font-bold text-white mb-4">Request Payout</h3>
                            
                            <div className="mb-6">
                                <p className="text-gray-400 mb-2">Available Balance:</p>
                                <p className="text-3xl font-bold text-green-400">
                                    ₹{earnings?.currentBalance?.toLocaleString() || '0'}
                                </p>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-400 mb-2">
                                    Withdrawal Amount:
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-xl font-bold text-gray-400">
                                        ₹
                                    </span>
                                    <input
                                        type="number"
                                        min="100"
                                        max={earnings?.currentBalance || 0}
                                        value={payoutAmount}
                                        onChange={(e) => setPayoutAmount(e.target.value)}
                                        placeholder="Enter amount"
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white text-lg focus:outline-none focus:border-purple-500"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    Minimum: ₹100 • Maximum: ₹{earnings?.currentBalance?.toLocaleString() || '0'}
                                </p>
                            </div>

                            <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 mb-6">
                                <p className="text-sm text-blue-300">
                                    ℹ️ Payouts are processed within 3-5 business days to your registered bank account.
                                </p>
                            </div>

                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setShowPayoutModal(false)}
                                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-semibold transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRequestPayout}
                                    disabled={requestingPayout || !payoutAmount}
                                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 text-white py-3 rounded-xl font-semibold transition-all disabled:cursor-not-allowed"
                                >
                                    {requestingPayout ? 'Processing...' : 'Request Payout'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

