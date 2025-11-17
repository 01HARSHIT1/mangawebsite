'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { FaMoneyBillWave, FaCoins, FaTag, FaCreditCard, FaAd, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';

interface CoinPackage {
    _id?: string;
    name: string;
    coins: number;
    price: number;
    bonus?: number;
    isActive: boolean;
}

interface PromoCode {
    _id?: string;
    code: string;
    discount: number;
    type: 'percentage' | 'fixed';
    validUntil: string;
    isActive: boolean;
}

export default function AdminMonetizationPage() {
    const [coinPackages, setCoinPackages] = useState<CoinPackage[]>([]);
    const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
    const [payments, setPayments] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'packages' | 'promos' | 'payments' | 'ads'>('packages');
    const [loading, setLoading] = useState(true);
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isAuthenticated || user?.role !== 'admin') {
            router.push('/admin/login');
            return;
        }
        fetchData();
    }, [isAuthenticated, user, router]);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            // Fetch coin packages, promo codes, payments
            // Mock data for now
            setCoinPackages([
                { _id: '1', name: 'Starter Pack', coins: 100, price: 99, bonus: 0, isActive: true },
                { _id: '2', name: 'Popular Pack', coins: 500, price: 449, bonus: 50, isActive: true },
                { _id: '3', name: 'Mega Pack', coins: 1000, price: 799, bonus: 200, isActive: true },
            ]);
            setPromoCodes([
                { _id: '1', code: 'WELCOME10', discount: 10, type: 'percentage', validUntil: '2024-12-31', isActive: true },
            ]);
        } catch (error) {
            console.error('Failed to fetch monetization data:', error);
        } finally {
            setLoading(false);
        }
    };

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
                        Monetization Management
                    </h1>
                    <p className="text-gray-400">Manage coin packages, promo codes, payments, and ads</p>
                </div>

                <div className="flex gap-2 mb-6 border-b border-slate-700">
                    <button
                        onClick={() => setActiveTab('packages')}
                        className={`px-4 py-2 ${activeTab === 'packages' ? 'border-b-2 border-purple-500' : ''}`}
                    >
                        Coin Packages
                    </button>
                    <button
                        onClick={() => setActiveTab('promos')}
                        className={`px-4 py-2 ${activeTab === 'promos' ? 'border-b-2 border-purple-500' : ''}`}
                    >
                        Promo Codes
                    </button>
                    <button
                        onClick={() => setActiveTab('payments')}
                        className={`px-4 py-2 ${activeTab === 'payments' ? 'border-b-2 border-purple-500' : ''}`}
                    >
                        Payments
                    </button>
                    <button
                        onClick={() => setActiveTab('ads')}
                        className={`px-4 py-2 ${activeTab === 'ads' ? 'border-b-2 border-purple-500' : ''}`}
                    >
                        Ad Management
                    </button>
                </div>

                {activeTab === 'packages' && (
                    <div className="bg-slate-800/50 rounded-2xl p-6 backdrop-blur-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Coin Packages</h2>
                            <button className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg">
                                <FaPlus className="mr-2" />
                                Add Package
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {coinPackages.map((pkg) => (
                                <div key={pkg._id} className="bg-slate-700/50 rounded-lg p-4">
                                    <h3 className="font-semibold mb-2">{pkg.name}</h3>
                                    <p className="text-2xl font-bold text-purple-400">{pkg.coins} Coins</p>
                                    <p className="text-gray-400">₹{pkg.price}</p>
                                    {pkg.bonus && <p className="text-green-400 text-sm">+{pkg.bonus} Bonus</p>}
                                    <div className="flex gap-2 mt-4">
                                        <button className="flex-1 p-2 bg-blue-600 hover:bg-blue-700 rounded">
                                            <FaEdit />
                                        </button>
                                        <button className="flex-1 p-2 bg-red-600 hover:bg-red-700 rounded">
                                            <FaTrash />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'promos' && (
                    <div className="bg-slate-800/50 rounded-2xl p-6 backdrop-blur-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Promo Codes</h2>
                            <button className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg">
                                <FaPlus className="mr-2" />
                                Add Promo Code
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-700">
                                <thead>
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Code</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Discount</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Valid Until</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                    {promoCodes.map((promo) => (
                                        <tr key={promo._id}>
                                            <td className="px-6 py-4 font-mono">{promo.code}</td>
                                            <td className="px-6 py-4">
                                                {promo.type === 'percentage' ? `${promo.discount}%` : `₹${promo.discount}`}
                                            </td>
                                            <td className="px-6 py-4">{new Date(promo.validUntil).toLocaleDateString()}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-xs ${promo.isActive ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'}`}>
                                                    {promo.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-2">
                                                    <button className="p-2 text-blue-400 hover:text-blue-300">
                                                        <FaEdit />
                                                    </button>
                                                    <button className="p-2 text-red-400 hover:text-red-300">
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'payments' && (
                    <div className="bg-slate-800/50 rounded-2xl p-6 backdrop-blur-sm">
                        <h2 className="text-xl font-bold mb-4">Payment History</h2>
                        <div className="text-gray-400">Payment tracking and refund management coming soon...</div>
                    </div>
                )}

                {activeTab === 'ads' && (
                    <div className="bg-slate-800/50 rounded-2xl p-6 backdrop-blur-sm">
                        <h2 className="text-xl font-bold mb-4">Ad Management</h2>
                        <div className="text-gray-400">Ad placement and revenue tracking coming soon...</div>
                    </div>
                )}
            </div>
        </div>
    );
}

