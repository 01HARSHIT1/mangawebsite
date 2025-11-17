'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { FaSearch, FaEdit, FaGlobe, FaFileAlt, FaSave } from 'react-icons/fa';

export default function AdminSEOPage() {
    const [seoSettings, setSeoSettings] = useState({
        siteTitle: 'Manga Website',
        siteDescription: 'Read and discover amazing manga',
        siteKeywords: 'manga, comics, reading',
        ogImage: '',
        canonicalUrl: '',
    });
    const [loading, setLoading] = useState(true);
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isAuthenticated || user?.role !== 'admin') {
            router.push('/admin/login');
            return;
        }
        fetchSEOSettings();
    }, [isAuthenticated, user, router]);

    const fetchSEOSettings = async () => {
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            if (!token) {
                setLoading(false);
                return;
            }

            const response = await fetch('/api/admin/seo', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setSeoSettings(data.seoSettings || seoSettings);
            }
        } catch (error) {
            console.error('Failed to fetch SEO settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            if (!token) return;

            const response = await fetch('/api/admin/seo', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ seoSettings })
            });

            if (response.ok) {
                alert('SEO settings saved successfully!');
            } else {
                alert('Failed to save SEO settings');
            }
        } catch (error) {
            console.error('Failed to save SEO settings:', error);
            alert('Failed to save SEO settings');
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
                        SEO & Metadata Management
                    </h1>
                    <p className="text-gray-400">Configure SEO settings, meta tags, and structured data</p>
                </div>

                <div className="space-y-6">
                    <div className="bg-slate-800/50 rounded-2xl p-6 backdrop-blur-sm">
                        <h2 className="text-xl font-bold mb-4">Global SEO Settings</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Site Title</label>
                                <input
                                    type="text"
                                    value={seoSettings.siteTitle}
                                    onChange={(e) => setSeoSettings({ ...seoSettings, siteTitle: e.target.value })}
                                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Site Description</label>
                                <textarea
                                    value={seoSettings.siteDescription}
                                    onChange={(e) => setSeoSettings({ ...seoSettings, siteDescription: e.target.value })}
                                    rows={3}
                                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Keywords (comma-separated)</label>
                                <input
                                    type="text"
                                    value={seoSettings.siteKeywords}
                                    onChange={(e) => setSeoSettings({ ...seoSettings, siteKeywords: e.target.value })}
                                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">OG Image URL</label>
                                <input
                                    type="url"
                                    value={seoSettings.ogImage}
                                    onChange={(e) => setSeoSettings({ ...seoSettings, ogImage: e.target.value })}
                                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Canonical URL</label>
                                <input
                                    type="url"
                                    value={seoSettings.canonicalUrl}
                                    onChange={(e) => setSeoSettings({ ...seoSettings, canonicalUrl: e.target.value })}
                                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-800/50 rounded-2xl p-6 backdrop-blur-sm">
                        <h2 className="text-xl font-bold mb-4">Tools</h2>
                        <div className="space-y-4">
                            <button className="w-full flex items-center justify-between p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700">
                                <div className="flex items-center">
                                    <FaFileAlt className="mr-3" />
                                    <span>Generate Sitemap</span>
                                </div>
                                <span className="text-gray-400">Generate</span>
                            </button>
                            <button className="w-full flex items-center justify-between p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700">
                                <div className="flex items-center">
                                    <FaGlobe className="mr-3" />
                                    <span>Google Search Console</span>
                                </div>
                                <span className="text-gray-400">Connect</span>
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={handleSave}
                            className="flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg"
                        >
                            <FaSave className="mr-2" />
                            Save SEO Settings
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

