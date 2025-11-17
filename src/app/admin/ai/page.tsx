'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { FaRobot, FaBrain, FaShieldAlt, FaEye, FaTags, FaChartLine } from 'react-icons/fa';

export default function AdminAIPage() {
    const [aiSettings, setAiSettings] = useState({
        recommendationEnabled: true,
        nsfwDetection: true,
        qualityChecks: true,
        autoTagging: false,
        ocrEnabled: false,
    });
    const [loading, setLoading] = useState(true);
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isAuthenticated || user?.role !== 'admin') {
            router.push('/admin/login');
            return;
        }
        fetchAISettings();
    }, [isAuthenticated, user, router]);

    const fetchAISettings = async () => {
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            if (!token) {
                setLoading(false);
                return;
            }

            const response = await fetch('/api/admin/ai', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setAiSettings(data.aiSettings || aiSettings);
            }
        } catch (error) {
            console.error('Failed to fetch AI settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            if (!token) return;

            const response = await fetch('/api/admin/ai', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ aiSettings })
            });

            if (response.ok) {
                alert('AI settings saved successfully!');
            } else {
                alert('Failed to save AI settings');
            }
        } catch (error) {
            console.error('Failed to save AI settings:', error);
            alert('Failed to save AI settings');
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
            <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        AI-Powered Features
                    </h1>
                    <p className="text-gray-400">Configure AI features for recommendations, quality checks, and content moderation</p>
                </div>

                <div className="space-y-6">
                    <div className="bg-slate-800/50 rounded-2xl p-6 backdrop-blur-sm">
                        <h2 className="text-xl font-bold mb-4 flex items-center">
                            <FaBrain className="mr-2" />
                            Recommendation Engine
                        </h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                                <div>
                                    <h3 className="font-semibold mb-1">Enable Recommendations</h3>
                                    <p className="text-sm text-gray-400">Use AI to suggest manga to users</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={aiSettings.recommendationEnabled}
                                        onChange={(e) => setAiSettings({ ...aiSettings, recommendationEnabled: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                </label>
                            </div>
                            <button className="w-full p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700 text-left">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold mb-1">Train Model</h3>
                                        <p className="text-sm text-gray-400">Retrain recommendation model with latest data</p>
                                    </div>
                                    <FaChartLine />
                                </div>
                            </button>
                        </div>
                    </div>

                    <div className="bg-slate-800/50 rounded-2xl p-6 backdrop-blur-sm">
                        <h2 className="text-xl font-bold mb-4 flex items-center">
                            <FaShieldAlt className="mr-2" />
                            Content Safety
                        </h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                                <div>
                                    <h3 className="font-semibold mb-1">NSFW Detection</h3>
                                    <p className="text-sm text-gray-400">Automatically detect and flag inappropriate content</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={aiSettings.nsfwDetection}
                                        onChange={(e) => setAiSettings({ ...aiSettings, nsfwDetection: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-800/50 rounded-2xl p-6 backdrop-blur-sm">
                        <h2 className="text-xl font-bold mb-4 flex items-center">
                            <FaEye className="mr-2" />
                            Quality Checks
                        </h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                                <div>
                                    <h3 className="font-semibold mb-1">Auto Quality Check</h3>
                                    <p className="text-sm text-gray-400">Detect blurry images, missing pages, low resolution</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={aiSettings.qualityChecks}
                                        onChange={(e) => setAiSettings({ ...aiSettings, qualityChecks: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-800/50 rounded-2xl p-6 backdrop-blur-sm">
                        <h2 className="text-xl font-bold mb-4 flex items-center">
                            <FaTags className="mr-2" />
                            Auto Tagging
                        </h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                                <div>
                                    <h3 className="font-semibold mb-1">Auto Tag Suggestions</h3>
                                    <p className="text-sm text-gray-400">Automatically suggest tags based on content</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={aiSettings.autoTagging}
                                        onChange={(e) => setAiSettings({ ...aiSettings, autoTagging: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={handleSave}
                            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg"
                        >
                            Save AI Settings
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

