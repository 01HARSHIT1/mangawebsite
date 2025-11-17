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
    const [showPackageModal, setShowPackageModal] = useState(false);
    const [showPromoModal, setShowPromoModal] = useState(false);
    const [editingPackage, setEditingPackage] = useState<CoinPackage | null>(null);
    const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
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
            if (!token) {
                setLoading(false);
                return;
            }

            // Fetch coin packages
            const packagesRes = await fetch('/api/admin/monetization/coin-packages', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (packagesRes.ok) {
                const packagesData = await packagesRes.json();
                setCoinPackages(packagesData.packages || []);
            }

            // Fetch promo codes
            const promosRes = await fetch('/api/admin/monetization/promo-codes', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (promosRes.ok) {
                const promosData = await promosRes.json();
                setPromoCodes(promosData.promoCodes || []);
            }

            // Fetch payments
            const paymentsRes = await fetch('/api/admin/monetization/payments', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (paymentsRes.ok) {
                const paymentsData = await paymentsRes.json();
                setPayments(paymentsData.payments || []);
            }
        } catch (error) {
            console.error('Failed to fetch monetization data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSavePackage = async (pkg: CoinPackage) => {
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            if (!token) return;

            if (editingPackage && editingPackage._id) {
                // Update
                const response = await fetch('/api/admin/monetization/coin-packages', {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ _id: editingPackage._id, ...pkg })
                });
                if (response.ok) {
                    fetchData();
                }
            } else {
                // Create
                const response = await fetch('/api/admin/monetization/coin-packages', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(pkg)
                });
                if (response.ok) {
                    fetchData();
                }
            }
            setShowPackageModal(false);
            setEditingPackage(null);
        } catch (error) {
            console.error('Failed to save package:', error);
            alert('Failed to save package');
        }
    };

    const handleDeletePackage = async (packageId: string) => {
        if (!confirm('Are you sure you want to delete this package?')) return;

        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            if (!token) return;

            const response = await fetch(`/api/admin/monetization/coin-packages?id=${packageId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                fetchData();
            } else {
                alert('Failed to delete package');
            }
        } catch (error) {
            console.error('Failed to delete package:', error);
            alert('Failed to delete package');
        }
    };

    const handleSavePromo = async (promo: PromoCode) => {
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            if (!token) return;

            if (editingPromo && editingPromo._id) {
                // Update
                const response = await fetch('/api/admin/monetization/promo-codes', {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ _id: editingPromo._id, ...promo })
                });
                if (response.ok) {
                    fetchData();
                }
            } else {
                // Create
                const response = await fetch('/api/admin/monetization/promo-codes', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(promo)
                });
                if (response.ok) {
                    fetchData();
                }
            }
            setShowPromoModal(false);
            setEditingPromo(null);
        } catch (error) {
            console.error('Failed to save promo code:', error);
            alert('Failed to save promo code');
        }
    };

    const handleDeletePromo = async (promoId: string) => {
        if (!confirm('Are you sure you want to delete this promo code?')) return;

        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            if (!token) return;

            const response = await fetch(`/api/admin/monetization/promo-codes?id=${promoId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                fetchData();
            } else {
                alert('Failed to delete promo code');
            }
        } catch (error) {
            console.error('Failed to delete promo code:', error);
            alert('Failed to delete promo code');
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
                            <button 
                                onClick={() => {
                                    setEditingPackage(null);
                                    setShowPackageModal(true);
                                }}
                                className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg"
                            >
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
                                        <button 
                                            onClick={() => {
                                                setEditingPackage(pkg);
                                                setShowPackageModal(true);
                                            }}
                                            className="flex-1 p-2 bg-blue-600 hover:bg-blue-700 rounded"
                                        >
                                            <FaEdit />
                                        </button>
                                        <button 
                                            onClick={() => handleDeletePackage(pkg._id!)}
                                            className="flex-1 p-2 bg-red-600 hover:bg-red-700 rounded"
                                        >
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
                            <button 
                                onClick={() => {
                                    setEditingPromo(null);
                                    setShowPromoModal(true);
                                }}
                                className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg"
                            >
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
                                                    <button 
                                                        onClick={() => {
                                                            setEditingPromo(promo);
                                                            setShowPromoModal(true);
                                                        }}
                                                        className="p-2 text-blue-400 hover:text-blue-300"
                                                    >
                                                        <FaEdit />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeletePromo(promo._id!)}
                                                        className="p-2 text-red-400 hover:text-red-300"
                                                    >
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
                        <h2 className="text-xl font-bold mb-4">Payment History ({payments.length})</h2>
                        {payments.length === 0 ? (
                            <div className="text-gray-400 text-center py-8">No payments found</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-700">
                                    <thead>
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Type</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Amount</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">User</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-700">
                                        {payments.map((payment) => (
                                            <tr key={payment._id}>
                                                <td className="px-6 py-4">
                                                    <span className="px-2 py-1 rounded text-xs bg-purple-500/20 text-purple-300">
                                                        {payment.type === 'coin_purchase' ? 'Coin Purchase' : 'Donation'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-semibold">₹{payment.amount}</td>
                                                <td className="px-6 py-4 text-sm text-gray-400">{payment.userId || 'N/A'}</td>
                                                <td className="px-6 py-4 text-sm text-gray-400">
                                                    {new Date(payment.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-300">
                                                        {payment.status || 'Completed'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'ads' && (
                    <div className="bg-slate-800/50 rounded-2xl p-6 backdrop-blur-sm">
                        <h2 className="text-xl font-bold mb-4">Ad Management</h2>
                        <div className="text-gray-400">Ad placement and revenue tracking coming soon...</div>
                    </div>
                )}
            </div>

            {/* Package Modal */}
            {showPackageModal && (
                <PackageModal
                    package={editingPackage}
                    onSave={handleSavePackage}
                    onClose={() => {
                        setShowPackageModal(false);
                        setEditingPackage(null);
                    }}
                />
            )}

            {/* Promo Modal */}
            {showPromoModal && (
                <PromoModal
                    promo={editingPromo}
                    onSave={handleSavePromo}
                    onClose={() => {
                        setShowPromoModal(false);
                        setEditingPromo(null);
                    }}
                />
            )}
        </div>
    );
}

function PackageModal({ package: pkg, onSave, onClose }: { package: CoinPackage | null; onSave: (pkg: CoinPackage) => void; onClose: () => void }) {
    const [formData, setFormData] = useState<CoinPackage>(pkg || {
        name: '',
        coins: 0,
        price: 0,
        bonus: 0,
        isActive: true
    });

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full">
                <h2 className="text-2xl font-bold mb-4">{pkg ? 'Edit Package' : 'Add Package'}</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Package Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Coins</label>
                        <input
                            type="number"
                            value={formData.coins}
                            onChange={(e) => setFormData({ ...formData, coins: parseInt(e.target.value) || 0 })}
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Price (₹)</label>
                        <input
                            type="number"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Bonus Coins</label>
                        <input
                            type="number"
                            value={formData.bonus || 0}
                            onChange={(e) => setFormData({ ...formData, bonus: parseInt(e.target.value) || 0 })}
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white"
                        />
                    </div>
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            checked={formData.isActive}
                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                            className="mr-2"
                        />
                        <span className="text-sm">Active</span>
                    </div>
                    <div className="flex gap-2 pt-4">
                        <button
                            onClick={() => onSave(formData)}
                            className="flex-1 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg"
                        >
                            Save
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

function PromoModal({ promo, onSave, onClose }: { promo: PromoCode | null; onSave: (promo: PromoCode) => void; onClose: () => void }) {
    const [formData, setFormData] = useState<PromoCode>(promo || {
        code: '',
        discount: 0,
        type: 'percentage',
        validUntil: '',
        isActive: true
    });

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full">
                <h2 className="text-2xl font-bold mb-4">{promo ? 'Edit Promo Code' : 'Add Promo Code'}</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Code</label>
                        <input
                            type="text"
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white font-mono"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Discount Type</label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value as 'percentage' | 'fixed' })}
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white"
                        >
                            <option value="percentage">Percentage</option>
                            <option value="fixed">Fixed Amount</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Discount Value</label>
                        <input
                            type="number"
                            value={formData.discount}
                            onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Valid Until</label>
                        <input
                            type="date"
                            value={formData.validUntil}
                            onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white"
                        />
                    </div>
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            checked={formData.isActive}
                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                            className="mr-2"
                        />
                        <span className="text-sm">Active</span>
                    </div>
                    <div className="flex gap-2 pt-4">
                        <button
                            onClick={() => onSave(formData)}
                            className="flex-1 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg"
                        >
                            Save
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

