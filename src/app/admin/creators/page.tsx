'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { FaCrown, FaCheckCircle, FaTimesCircle, FaEdit, FaUserCheck, FaMoneyBillWave, FaChartLine } from 'react-icons/fa';

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

export default function AdminCreatorsPage() {
    const [creators, setCreators] = useState<Creator[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
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
                                    <tr key={creator._id} className="hover:bg-slate-700/50">
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

