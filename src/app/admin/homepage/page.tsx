'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { FaSlidersH, FaPlus, FaEdit, FaTrash, FaArrowUp, FaArrowDown, FaImage, FaLink } from 'react-icons/fa';

interface Banner {
    _id?: string;
    title: string;
    imageUrl: string;
    linkUrl: string;
    order: number;
    isActive: boolean;
    startDate?: string;
    endDate?: string;
}

interface Section {
    _id?: string;
    type: 'popular' | 'trending' | 'new' | 'completed' | 'staff-picks';
    title: string;
    order: number;
    isActive: boolean;
}

export default function AdminHomepagePage() {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [loading, setLoading] = useState(true);
    const [showBannerModal, setShowBannerModal] = useState(false);
    const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isAuthenticated || user?.role !== 'admin') {
            router.push('/admin/login');
            return;
        }
        fetchHomepageData();
    }, [isAuthenticated, user, router]);

    const fetchHomepageData = async () => {
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            if (!token) {
                setLoading(false);
                return;
            }

            // Fetch banners
            const bannersRes = await fetch('/api/admin/homepage/banners', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (bannersRes.ok) {
                const bannersData = await bannersRes.json();
                setBanners(bannersData.banners || []);
            }

            // Fetch sections
            const sectionsRes = await fetch('/api/admin/homepage/sections', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (sectionsRes.ok) {
                const sectionsData = await sectionsRes.json();
                setSections(sectionsData.sections || []);
            }
        } catch (error) {
            console.error('Failed to fetch homepage data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveBanner = async (banner: Banner) => {
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            if (!token) return;

            if (editingBanner && editingBanner._id) {
                // Update existing banner
                const response = await fetch('/api/admin/homepage/banners', {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ _id: editingBanner._id, ...banner })
                });
                if (response.ok) {
                    fetchHomepageData();
                }
            } else {
                // Create new banner
                const response = await fetch('/api/admin/homepage/banners', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(banner)
                });
                if (response.ok) {
                    fetchHomepageData();
                }
            }
            setShowBannerModal(false);
            setEditingBanner(null);
        } catch (error) {
            console.error('Failed to save banner:', error);
            alert('Failed to save banner');
        }
    };

    const handleDeleteBanner = async (bannerId: string) => {
        if (!confirm('Are you sure you want to delete this banner?')) return;

        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            if (!token) return;

            const response = await fetch(`/api/admin/homepage/banners?id=${bannerId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                fetchHomepageData();
            } else {
                alert('Failed to delete banner');
            }
        } catch (error) {
            console.error('Failed to delete banner:', error);
            alert('Failed to delete banner');
        }
    };

    const handleReorderSection = async (sectionId: string, direction: 'up' | 'down') => {
        const section = sections.find(s => s._id === sectionId);
        if (!section) return;

        const newOrder = direction === 'up' ? section.order - 1 : section.order + 1;
        const swapSection = sections.find(s => s.order === newOrder);
        
        if (swapSection) {
            const updatedSections = sections.map(s => 
                s._id === sectionId ? { ...s, order: newOrder } :
                s._id === swapSection._id ? { ...s, order: section.order } : s
            );

            try {
                const token = localStorage.getItem('authToken') || localStorage.getItem('token');
                if (!token) return;

                const response = await fetch('/api/admin/homepage/sections', {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ sections: updatedSections })
                });
                if (response.ok) {
                    setSections(updatedSections);
                }
            } catch (error) {
                console.error('Failed to reorder sections:', error);
            }
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
                        Homepage Control
                    </h1>
                    <p className="text-gray-400">Manage banners, sliders, and homepage sections</p>
                </div>

                {/* Banners Section */}
                <div className="bg-slate-800/50 rounded-2xl p-6 backdrop-blur-sm mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">Banners & Sliders</h2>
                        <button
                            onClick={() => {
                                setEditingBanner(null);
                                setShowBannerModal(true);
                            }}
                            className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg"
                        >
                            <FaPlus className="mr-2" />
                            Add Banner
                        </button>
                    </div>
                    <div className="space-y-4">
                        {banners.map((banner) => (
                            <div key={banner._id} className="bg-slate-700/50 rounded-lg p-4 flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <img src={banner.imageUrl} alt={banner.title} className="w-24 h-16 object-cover rounded" />
                                    <div>
                                        <h3 className="font-semibold">{banner.title}</h3>
                                        <p className="text-sm text-gray-400">{banner.linkUrl}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className={`px-2 py-1 rounded text-xs ${banner.isActive ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'}`}>
                                        {banner.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                    <button
                                        onClick={() => {
                                            setEditingBanner(banner);
                                            setShowBannerModal(true);
                                        }}
                                        className="p-2 text-blue-400 hover:text-blue-300"
                                    >
                                        <FaEdit />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteBanner(banner._id!)}
                                        className="p-2 text-red-400 hover:text-red-300"
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sections Section */}
                <div className="bg-slate-800/50 rounded-2xl p-6 backdrop-blur-sm">
                    <h2 className="text-xl font-bold mb-4">Homepage Sections</h2>
                    <div className="space-y-3">
                        {sections.sort((a, b) => a.order - b.order).map((section) => (
                            <div key={section._id} className="bg-slate-700/50 rounded-lg p-4 flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="flex flex-col">
                                        <button
                                            onClick={() => handleReorderSection(section._id!, 'up')}
                                            className="p-1 text-gray-400 hover:text-white"
                                        >
                                            <FaArrowUp />
                                        </button>
                                        <button
                                            onClick={() => handleReorderSection(section._id!, 'down')}
                                            className="p-1 text-gray-400 hover:text-white"
                                        >
                                            <FaArrowDown />
                                        </button>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">{section.title}</h3>
                                        <p className="text-sm text-gray-400">Type: {section.type}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className={`px-2 py-1 rounded text-xs ${section.isActive ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'}`}>
                                        {section.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                    <button className="p-2 text-blue-400 hover:text-blue-300">
                                        <FaEdit />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Banner Modal */}
                {showBannerModal && (
                    <BannerModal
                        banner={editingBanner}
                        onSave={handleSaveBanner}
                        onClose={() => {
                            setShowBannerModal(false);
                            setEditingBanner(null);
                        }}
                    />
                )}
            </div>
        </div>
    );
}

function BannerModal({ banner, onSave, onClose }: { banner: Banner | null; onSave: (banner: Banner) => void; onClose: () => void }) {
    const [formData, setFormData] = useState<Banner>(banner || {
        title: '',
        imageUrl: '',
        linkUrl: '',
        order: 0,
        isActive: true
    });

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl p-6 max-w-2xl w-full">
                <h2 className="text-2xl font-bold mb-4">{banner ? 'Edit Banner' : 'Add Banner'}</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Title</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Image URL</label>
                        <input
                            type="url"
                            value={formData.imageUrl}
                            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Link URL</label>
                        <input
                            type="url"
                            value={formData.linkUrl}
                            onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white"
                        />
                    </div>
                    <div className="flex items-center space-x-4">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={formData.isActive}
                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                className="mr-2"
                            />
                            <span className="text-sm">Active</span>
                        </label>
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

