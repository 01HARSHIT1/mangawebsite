"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { FaCoins, FaGift, FaCreditCard, FaCalendar, FaArrowUp, FaArrowDown, FaSpinner } from 'react-icons/fa';

interface Transaction {
    _id: string;
    type: 'purchase' | 'tip_sent' | 'tip_received';
    amount: number;
    createdAt: string;
    paymentId?: string;
    mangaTitle?: string;
    creatorName?: string;
    tipperName?: string;
}

export default function CoinHistoryPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [currentBalance, setCurrentBalance] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'purchase' | 'tip_sent' | 'tip_received'>('all');
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }

        fetchTransactions();
    }, [isAuthenticated, router]);

    const fetchTransactions = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('/api/coins', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setCurrentBalance(data.coins || 0);
                setTransactions(data.transactions || []);
            }
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredTransactions = transactions.filter(transaction => {
        if (filter === 'all') return true;
        return transaction.type === filter;
    });

    const getTransactionIcon = (type: string) => {
        switch (type) {
            case 'purchase':
                return <FaCreditCard className="text-green-400" />;
            case 'tip_sent':
                return <FaArrowUp className="text-red-400" />;
            case 'tip_received':
                return <FaArrowDown className="text-blue-400" />;
            default:
                return <FaCoins className="text-yellow-400" />;
        }
    };

    const getTransactionColor = (type: string) => {
        switch (type) {
            case 'purchase':
                return 'text-green-400';
            case 'tip_sent':
                return 'text-red-400';
            case 'tip_received':
                return 'text-blue-400';
            default:
                return 'text-yellow-400';
        }
    };

    const getTransactionDescription = (transaction: Transaction) => {
        switch (transaction.type) {
            case 'purchase':
                return 'Purchased coins';
            case 'tip_sent':
                return `Tipped ${transaction.creatorName || 'creator'} for ${transaction.mangaTitle || 'manga'}`;
            case 'tip_received':
                return `Received tip from ${transaction.tipperName || 'reader'}`;
            default:
                return 'Transaction';
        }
    };

    const formatAmount = (amount: number, type: string) => {
        const sign = type === 'tip_sent' ? '-' : '+';
        return `${sign}${amount}`;
    };

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
            <div className="max-w-4xl mx-auto px-4 py-16">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-full mb-6">
                        <FaCoins className="text-3xl text-white" />
                    </div>
                    <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                        Transaction History
                    </h1>
                    <p className="text-xl text-gray-300 mb-6">
                        View your coin purchases and tips history
                    </p>

                    {/* Current Balance */}
                    <div className="inline-flex items-center bg-slate-800/50 rounded-full px-6 py-3 backdrop-blur-sm">
                        <FaCoins className="text-yellow-400 mr-2" />
                        <span className="text-lg font-semibold">
                            Current Balance: {loading ? '...' : `${currentBalance} coins`}
                        </span>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="bg-slate-800/50 rounded-3xl p-6 mb-8 backdrop-blur-sm">
                    <div className="flex flex-wrap gap-2 justify-center">
                        {[
                            { key: 'all', label: 'All Transactions', icon: <FaCoins /> },
                            { key: 'purchase', label: 'Purchases', icon: <FaCreditCard /> },
                            { key: 'tip_sent', label: 'Tips Sent', icon: <FaArrowUp /> },
                            { key: 'tip_received', label: 'Tips Received', icon: <FaArrowDown /> }
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setFilter(tab.key as any)}
                                className={`flex items-center px-4 py-2 rounded-xl font-medium transition-all duration-300 ${filter === tab.key
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-slate-700/50 text-gray-300 hover:bg-slate-600/50'
                                    }`}
                            >
                                <span className="mr-2">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Transactions List */}
                <div className="bg-slate-800/50 rounded-3xl p-6 backdrop-blur-sm">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <FaSpinner className="animate-spin text-3xl text-purple-400 mr-3" />
                            <span className="text-lg text-gray-300">Loading transactions...</span>
                        </div>
                    ) : filteredTransactions.length === 0 ? (
                        <div className="text-center py-12">
                            <FaCoins className="text-6xl text-gray-600 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-400 mb-2">No Transactions Found</h3>
                            <p className="text-gray-500 mb-6">
                                {filter === 'all'
                                    ? "You haven't made any transactions yet."
                                    : `No ${filter.replace('_', ' ')} transactions found.`
                                }
                            </p>
                            <button
                                onClick={() => router.push('/coins')}
                                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300"
                            >
                                Purchase Coins
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <h2 className="text-2xl font-bold text-white mb-6">
                                {filter === 'all' ? 'All Transactions' :
                                    filter === 'purchase' ? 'Coin Purchases' :
                                        filter === 'tip_sent' ? 'Tips Sent' : 'Tips Received'}
                            </h2>

                            {filteredTransactions.map((transaction) => (
                                <div
                                    key={transaction._id}
                                    className="bg-slate-700/50 rounded-xl p-4 flex items-center justify-between hover:bg-slate-600/50 transition-colors"
                                >
                                    <div className="flex items-center">
                                        <div className="w-12 h-12 bg-slate-600 rounded-full flex items-center justify-center mr-4">
                                            {getTransactionIcon(transaction.type)}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-white">
                                                {getTransactionDescription(transaction)}
                                            </h3>
                                            <div className="flex items-center text-sm text-gray-400 mt-1">
                                                <FaCalendar className="mr-1" />
                                                {new Date(transaction.createdAt).toLocaleDateString()} at{' '}
                                                {new Date(transaction.createdAt).toLocaleTimeString()}
                                            </div>
                                            {transaction.paymentId && (
                                                <div className="text-xs text-gray-500 mt-1">
                                                    ID: {transaction.paymentId}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <div className={`text-xl font-bold ${getTransactionColor(transaction.type)}`}>
                                            {formatAmount(transaction.amount, transaction.type)} coins
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-4 justify-center mt-8">
                    <button
                        onClick={() => router.push('/coins')}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105"
                    >
                        Purchase More Coins
                    </button>
                    <button
                        onClick={() => router.push('/manga')}
                        className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-6 rounded-xl transition-colors duration-300"
                    >
                        Browse Manga
                    </button>
                </div>
            </div>
        </div>
    );
}
