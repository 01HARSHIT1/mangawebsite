'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FaEdit, FaTrash, FaEye, FaPlus, FaChartLine, FaCog,
    FaBook, FaCalendar, FaGlobe, FaLock, FaSave, FaTimes,
    FaArrowLeft, FaUpload
} from 'react-icons/fa';
import Image from 'next/image';
import DashboardLayout from './DashboardLayout';

interface SeriesDetailPageProps {
    seriesId: string;
}

export default function SeriesDetailPage({ seriesId }: SeriesDetailPageProps) {
    const [series, setSeries] = useState<any>(null);
    const [chapters, setChapters] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'chapters' | 'analytics' | 'settings'>('chapters');
    const [editMode, setEditMode] = useState(false);
    const [editedSeries, setEditedSeries] = useState<any>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSeriesData();
    }, [seriesId]);

    const fetchSeriesData = async () => {
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            
            // Fetch series details
            const seriesRes = await fetch(`/api/manga/${seriesId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (seriesRes.ok) {
                const data = await seriesRes.json();
                setSeries(data.manga);
                setEditedSeries(data.manga);
                
                // Fetch chapters
                if (data.manga.chapters) {
                    setChapters(data.manga.chapters);
                }
            }
        } catch (error) {
            console.error('Error fetching series:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const response = await fetch(`/api/manga/${seriesId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: editedSeries.title,
                    description: editedSeries.description,
                    genres: editedSeries.genres,
                    status: editedSeries.status
                })
            });

            if (response.ok) {
                setSeries(editedSeries);
                setEditMode(false);
                alert('Series updated successfully!');
            } else {
                alert('Failed to update series');
            }
        } catch (error) {
            console.error('Error saving series:', error);
            alert('Failed to update series');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteChapter = async (chapterId: string) => {
        if (!confirm('Are you sure you want to delete this chapter?')) return;

        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const response = await fetch(`/api/chapters/${chapterId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                setChapters(chapters.filter(c => c._id !== chapterId));
                alert('Chapter deleted successfully!');
            } else {
                alert('Failed to delete chapter');
            }
        } catch (error) {
            console.error('Error deleting chapter:', error);
            alert('Failed to delete chapter');
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                        <p className="text-gray-400">Loading series...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (!series) {
        return (
            <DashboardLayout>
                <div className="text-center py-20">
                    <div className="text-6xl mb-4">❌</div>
                    <h3 className="text-xl font-bold text-white mb-2">Series Not Found</h3>
                    <Link
                        href="/creator/dashboard/series"
                        className="text-purple-400 hover:text-purple-300"
                    >
                        ← Back to Series List
                    </Link>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Back Button */}
                <Link
                    href="/creator/dashboard/series"
                    className="inline-flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
                >
                    <FaArrowLeft />
                    <span>Back to Series</span>
                </Link>

                {/* Series Header */}
                <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Cover Image */}
                        <div className="relative w-full md:w-48 aspect-[3/4] rounded-xl overflow-hidden">
                            <Image
                                src={series.coverImage || '/placeholder.svg'}
                                alt={series.title}
                                fill
                                className="object-cover"
                            />
                        </div>

                        {/* Series Info */}
                        <div className="flex-1">
                            {editMode ? (
                                <div className="space-y-4">
                                    <input
                                        type="text"
                                        value={editedSeries.title}
                                        onChange={(e) => setEditedSeries({...editedSeries, title: e.target.value})}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white text-2xl font-bold focus:outline-none focus:border-purple-500"
                                    />
                                    <textarea
                                        value={editedSeries.description}
                                        onChange={(e) => setEditedSeries({...editedSeries, description: e.target.value})}
                                        rows={4}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                                    />
                                    <select
                                        value={editedSeries.status}
                                        onChange={(e) => setEditedSeries({...editedSeries, status: e.target.value})}
                                        className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                                    >
                                        <option value="ongoing">Ongoing</option>
                                        <option value="completed">Completed</option>
                                        <option value="hiatus">Hiatus</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                    <div className="flex space-x-3">
                                        <button
                                            onClick={handleSave}
                                            disabled={saving}
                                            className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-2 rounded-lg font-semibold transition-all disabled:opacity-50"
                                        >
                                            <FaSave />
                                            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                setEditMode(false);
                                                setEditedSeries(series);
                                            }}
                                            className="flex items-center space-x-2 bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                                        >
                                            <FaTimes />
                                            <span>Cancel</span>
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h1 className="text-3xl font-bold text-white mb-2">{series.title}</h1>
                                            <p className="text-gray-400">by {series.creator}</p>
                                        </div>
                                        <button
                                            onClick={() => setEditMode(true)}
                                            className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                                        >
                                            <FaEdit />
                                            <span>Edit</span>
                                        </button>
                                    </div>
                                    <p className="text-gray-300 mb-4">{series.description}</p>
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {series.genres?.map((genre: string) => (
                                            <span
                                                key={genre}
                                                className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm font-medium border border-purple-500/30"
                                            >
                                                {genre}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="flex items-center space-x-6 text-sm text-gray-400">
                                        <span className="flex items-center">
                                            <FaBook className="mr-2" />
                                            {chapters.length} chapters
                                        </span>
                                        <span className="flex items-center">
                                            <FaEye className="mr-2" />
                                            {(series.views || 0).toLocaleString()} views
                                        </span>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                            series.status === 'ongoing' ? 'bg-green-500/20 text-green-400' :
                                            series.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                                            'bg-yellow-500/20 text-yellow-400'
                                        }`}>
                                            {series.status}
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex space-x-2 border-b border-slate-700">
                    {[
                        { id: 'chapters', label: 'Chapters', icon: FaBook },
                        { id: 'analytics', label: 'Analytics', icon: FaChartLine },
                        { id: 'settings', label: 'Settings', icon: FaCog }
                    ].map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center space-x-2 px-6 py-3 font-semibold transition-all ${
                                    activeTab === tab.id
                                        ? 'text-purple-400 border-b-2 border-purple-400'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                <Icon />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                    {activeTab === 'chapters' && (
                        <motion.div
                            key="chapters"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white">Chapters ({chapters.length})</h2>
                                <Link
                                    href={`/creator/dashboard/series/${seriesId}/add-chapter`}
                                    className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-2 rounded-lg font-semibold transition-all"
                                >
                                    <FaPlus />
                                    <span>Add Chapter</span>
                                </Link>
                            </div>

                            {chapters.length > 0 ? (
                                <div className="space-y-3">
                                    {chapters.map((chapter, index) => (
                                        <div
                                            key={chapter._id}
                                            className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 hover:border-purple-500/30 transition-all"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-4">
                                                    <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg font-bold text-white">
                                                        {chapter.chapterNumber}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-white">{chapter.title}</h3>
                                                        <p className="text-sm text-gray-400">
                                                            {chapter.pageCount || 0} pages • 
                                                            {chapter.views || 0} views
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Link
                                                        href={`/manga/${seriesId}/chapter/${chapter._id}`}
                                                        className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                                                        title="View Chapter"
                                                    >
                                                        <FaEye />
                                                    </Link>
                                                    <Link
                                                        href={`/creator/dashboard/series/${seriesId}/chapter/${chapter._id}/edit`}
                                                        className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                                                        title="Edit Chapter"
                                                    >
                                                        <FaEdit />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDeleteChapter(chapter._id)}
                                                        className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                                                        title="Delete Chapter"
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 bg-slate-800/30 rounded-2xl border border-slate-700/50">
                                    <div className="text-6xl mb-4">📖</div>
                                    <h3 className="text-xl font-bold text-white mb-2">No Chapters Yet</h3>
                                    <p className="text-gray-400 mb-6">Add your first chapter to this series</p>
                                    <Link
                                        href={`/creator/dashboard/series/${seriesId}/add-chapter`}
                                        className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all"
                                    >
                                        <FaPlus />
                                        <span>Add First Chapter</span>
                                    </Link>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'analytics' && (
                        <motion.div
                            key="analytics"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                                    <div className="flex items-center space-x-3 mb-4">
                                        <FaEye className="text-2xl text-blue-400" />
                                        <h3 className="text-lg font-bold text-white">Total Views</h3>
                                    </div>
                                    <p className="text-3xl font-bold text-white">{(series.views || 0).toLocaleString()}</p>
                                    <p className="text-sm text-gray-400 mt-2">All-time views</p>
                                </div>

                                <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                                    <div className="flex items-center space-x-3 mb-4">
                                        <FaBook className="text-2xl text-green-400" />
                                        <h3 className="text-lg font-bold text-white">Chapters</h3>
                                    </div>
                                    <p className="text-3xl font-bold text-white">{chapters.length}</p>
                                    <p className="text-sm text-gray-400 mt-2">Published chapters</p>
                                </div>

                                <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                                    <div className="flex items-center space-x-3 mb-4">
                                        <FaChartLine className="text-2xl text-purple-400" />
                                        <h3 className="text-lg font-bold text-white">Engagement</h3>
                                    </div>
                                    <p className="text-3xl font-bold text-white">{(series.likes || 0).toLocaleString()}</p>
                                    <p className="text-sm text-gray-400 mt-2">Total likes</p>
                                </div>
                            </div>

                            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 text-center">
                                <div className="text-6xl mb-4">📊</div>
                                <h3 className="text-xl font-bold text-white mb-2">Detailed Analytics</h3>
                                <p className="text-gray-400 mb-4">View comprehensive performance metrics</p>
                                <Link
                                    href="/creator/dashboard/analytics"
                                    className="inline-flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                                >
                                    <FaChartLine />
                                    <span>View Full Analytics</span>
                                </Link>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'settings' && (
                        <motion.div
                            key="settings"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <div className="space-y-6">
                                {/* Visibility Settings */}
                                <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                                    <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                                        <FaGlobe className="mr-3 text-blue-400" />
                                        Visibility Settings
                                    </h3>
                                    <div className="space-y-3">
                                        <label className="flex items-center space-x-3 cursor-pointer">
                                            <input type="checkbox" className="w-5 h-5" defaultChecked />
                                            <span className="text-gray-300">Visible in browse page</span>
                                        </label>
                                        <label className="flex items-center space-x-3 cursor-pointer">
                                            <input type="checkbox" className="w-5 h-5" defaultChecked />
                                            <span className="text-gray-300">Allow comments</span>
                                        </label>
                                        <label className="flex items-center space-x-3 cursor-pointer">
                                            <input type="checkbox" className="w-5 h-5" />
                                            <span className="text-gray-300">Mature content (18+)</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Monetization */}
                                <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                                    <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                                        <FaLock className="mr-3 text-yellow-400" />
                                        Monetization
                                    </h3>
                                    <p className="text-gray-400 mb-4">Configure pricing and premium access</p>
                                    <Link
                                        href="/creator/dashboard/monetization"
                                        className="inline-flex items-center space-x-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                                    >
                                        <span>Configure Monetization</span>
                                    </Link>
                                </div>

                                {/* Danger Zone */}
                                <div className="bg-red-900/20 rounded-xl p-6 border border-red-500/30">
                                    <h3 className="text-lg font-bold text-red-400 mb-4">Danger Zone</h3>
                                    <p className="text-gray-400 mb-4">Permanently delete this series and all its chapters</p>
                                    <button
                                        onClick={() => {
                                            if (confirm('Are you sure? This action cannot be undone!')) {
                                                // TODO: Implement series deletion
                                                alert('Series deletion will be implemented soon');
                                            }
                                        }}
                                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                                    >
                                        Delete Series
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </DashboardLayout>
    );
}

