'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
    FaCog, FaSave, FaUndo, FaVideo, FaMicrophone, FaClosedCaptioning,
    FaUpload, FaComment, FaBell, FaGlobe, FaShieldAlt, FaUsers,
    FaFileVideo, FaFileAlt, FaInfoCircle, FaCheckCircle
} from 'react-icons/fa';
import { motion } from 'framer-motion';

interface PlatformConfig {
    supportedAudioLanguages: string[];
    supportedSubtitleLanguages: string[];
    defaultAudioLanguage: string;
    defaultSubtitleLanguage: string;
    maxVideoSizeMB: number;
    maxEpisodeSizeMB: number;
    allowedVideoCodecs: string[];
    allowedVideoFormats: string[];
    videoQualityPresets: Array<'360p' | '480p' | '720p' | '1080p'>;
    maxUploadsPerDay: number;
    maxUploadsPerCreator: number;
    maxEpisodesPerSeries: number;
    allowedSubtitleFormats: string[];
    maxSubtitleFileSizeMB: number;
    commentMaxLength: number;
    requireCommentApproval: boolean;
    allowAnonymousComments: boolean;
    maxCommentsPerEpisode: number;
    siteMaintenance: boolean;
    registrationEnabled: boolean;
    uploadEnabled: boolean;
    creatorApplicationsEnabled: boolean;
    recommendationCacheHours: number;
    trendingWindowDays: number;
    enableEmailNotifications: boolean;
    enablePushNotifications: boolean;
}

export default function PlatformConfigPage() {
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();
    const [config, setConfig] = useState<PlatformConfig | null>(null);
    const [editedConfig, setEditedConfig] = useState<Partial<PlatformConfig>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'general' | 'video' | 'audio' | 'upload' | 'comments' | 'notifications'>('general');

    useEffect(() => {
        if (!isAuthenticated || user?.role !== 'admin') {
            router.push('/admin/login');
            return;
        }
        fetchConfig();
    }, [isAuthenticated, user, router]);

    const fetchConfig = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const response = await fetch('/api/admin/platform-config', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setConfig(data.config);
                setEditedConfig(data.config);
            }
        } catch (error) {
            console.error('Error fetching platform config:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const response = await fetch('/api/admin/platform-config', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ config: editedConfig })
            });

            if (response.ok) {
                const data = await response.json();
                setConfig(data.config);
                setEditedConfig(data.config);
                alert('Platform configuration saved successfully');
            } else {
                const error = await response.json();
                alert(`Error: ${error.error}`);
            }
        } catch (error) {
            console.error('Error saving platform config:', error);
            alert('Failed to save platform configuration');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        if (config) {
            setEditedConfig(config);
        }
    };

    const updateConfig = (key: keyof PlatformConfig, value: any) => {
        setEditedConfig(prev => ({ ...prev, [key]: value }));
    };

    const addLanguage = (type: 'audio' | 'subtitle', language: string) => {
        const key = type === 'audio' ? 'supportedAudioLanguages' : 'supportedSubtitleLanguages';
        const current = editedConfig[key] || [];
        if (language && !current.includes(language)) {
            updateConfig(key, [...current, language]);
        }
    };

    const removeLanguage = (type: 'audio' | 'subtitle', language: string) => {
        const key = type === 'audio' ? 'supportedAudioLanguages' : 'supportedSubtitleLanguages';
        const current = editedConfig[key] || [];
        updateConfig(key, current.filter((l: string) => l !== language));
    };

    const commonLanguages = ['English', 'Japanese', 'Spanish', 'French', 'German', 'Chinese', 'Portuguese', 'Italian', 'Korean', 'Russian', 'Arabic', 'Hindi'];

    if (!isAuthenticated || user?.role !== 'admin') {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Platform Configuration</h1>
                        <p className="text-gray-400">Manage global platform settings and limits</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleReset}
                            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white font-semibold flex items-center gap-2"
                        >
                            <FaUndo />
                            Reset
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white font-semibold disabled:opacity-50 flex items-center gap-2"
                        >
                            <FaSave />
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                    </div>
                ) : editedConfig ? (
                    <>
                        {/* Tabs */}
                        <div className="flex gap-2 border-b border-gray-800">
                            {[
                                { id: 'general', label: 'General', icon: FaCog },
                                { id: 'video', label: 'Video', icon: FaVideo },
                                { id: 'audio', label: 'Audio & Subtitles', icon: FaMicrophone },
                                { id: 'upload', label: 'Upload Limits', icon: FaUpload },
                                { id: 'comments', label: 'Comments', icon: FaComment },
                                { id: 'notifications', label: 'Notifications', icon: FaBell },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`px-4 py-2 flex items-center gap-2 border-b-2 transition-colors ${
                                        activeTab === tab.id
                                            ? 'border-orange-500 text-orange-400'
                                            : 'border-transparent text-gray-400 hover:text-white'
                                    }`}
                                >
                                    <tab.icon />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* General Settings */}
                        {activeTab === 'general' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-gray-900 rounded-lg p-6 border border-gray-800 space-y-6"
                            >
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <FaCog />
                                    General Settings
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                                        <div>
                                            <label className="block text-sm font-semibold mb-1">Site Maintenance</label>
                                            <p className="text-xs text-gray-400">Enable maintenance mode</p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={editedConfig.siteMaintenance || false}
                                            onChange={(e) => updateConfig('siteMaintenance', e.target.checked)}
                                            className="w-5 h-5"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                                        <div>
                                            <label className="block text-sm font-semibold mb-1">Registration Enabled</label>
                                            <p className="text-xs text-gray-400">Allow new user registrations</p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={editedConfig.registrationEnabled !== false}
                                            onChange={(e) => updateConfig('registrationEnabled', e.target.checked)}
                                            className="w-5 h-5"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                                        <div>
                                            <label className="block text-sm font-semibold mb-1">Upload Enabled</label>
                                            <p className="text-xs text-gray-400">Allow content uploads</p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={editedConfig.uploadEnabled !== false}
                                            onChange={(e) => updateConfig('uploadEnabled', e.target.checked)}
                                            className="w-5 h-5"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                                        <div>
                                            <label className="block text-sm font-semibold mb-1">Creator Applications</label>
                                            <p className="text-xs text-gray-400">Allow creator applications</p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={editedConfig.creatorApplicationsEnabled !== false}
                                            onChange={(e) => updateConfig('creatorApplicationsEnabled', e.target.checked)}
                                            className="w-5 h-5"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold mb-2">Recommendation Cache (hours)</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="168"
                                            value={editedConfig.recommendationCacheHours || 24}
                                            onChange={(e) => updateConfig('recommendationCacheHours', parseInt(e.target.value) || 24)}
                                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                                        />
                                        <p className="text-xs text-gray-400 mt-1">How long to cache recommendation results</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold mb-2">Trending Window (days)</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="30"
                                            value={editedConfig.trendingWindowDays || 7}
                                            onChange={(e) => updateConfig('trendingWindowDays', parseInt(e.target.value) || 7)}
                                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                                        />
                                        <p className="text-xs text-gray-400 mt-1">Days to consider for trending calculation</p>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Video Settings */}
                        {activeTab === 'video' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-gray-900 rounded-lg p-6 border border-gray-800 space-y-6"
                            >
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <FaVideo />
                                    Video Settings
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold mb-2">Max Video Size (MB)</label>
                                        <input
                                            type="number"
                                            min="100"
                                            max="10240"
                                            value={editedConfig.maxVideoSizeMB || 2048}
                                            onChange={(e) => updateConfig('maxVideoSizeMB', parseInt(e.target.value) || 2048)}
                                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold mb-2">Max Episode Size (MB)</label>
                                        <input
                                            type="number"
                                            min="50"
                                            max="5120"
                                            value={editedConfig.maxEpisodeSizeMB || 1024}
                                            onChange={(e) => updateConfig('maxEpisodeSizeMB', parseInt(e.target.value) || 1024)}
                                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold mb-2">Allowed Video Codecs</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['h264', 'h265', 'vp9', 'av1'].map((codec) => (
                                            <label key={codec} className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded cursor-pointer hover:bg-gray-700">
                                                <input
                                                    type="checkbox"
                                                    checked={(editedConfig.allowedVideoCodecs || []).includes(codec)}
                                                    onChange={(e) => {
                                                        const current = editedConfig.allowedVideoCodecs || [];
                                                        if (e.target.checked) {
                                                            updateConfig('allowedVideoCodecs', [...current, codec]);
                                                        } else {
                                                            updateConfig('allowedVideoCodecs', current.filter((c: string) => c !== codec));
                                                        }
                                                    }}
                                                    className="w-4 h-4"
                                                />
                                                <span>{codec.toUpperCase()}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold mb-2">Allowed Video Formats</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['mp4', 'mkv', 'webm', 'mov'].map((format) => (
                                            <label key={format} className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded cursor-pointer hover:bg-gray-700">
                                                <input
                                                    type="checkbox"
                                                    checked={(editedConfig.allowedVideoFormats || []).includes(format)}
                                                    onChange={(e) => {
                                                        const current = editedConfig.allowedVideoFormats || [];
                                                        if (e.target.checked) {
                                                            updateConfig('allowedVideoFormats', [...current, format]);
                                                        } else {
                                                            updateConfig('allowedVideoFormats', current.filter((f: string) => f !== format));
                                                        }
                                                    }}
                                                    className="w-4 h-4"
                                                />
                                                <span>{format.toUpperCase()}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold mb-2">Video Quality Presets</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['360p', '480p', '720p', '1080p'].map((quality) => (
                                            <label key={quality} className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded cursor-pointer hover:bg-gray-700">
                                                <input
                                                    type="checkbox"
                                                    checked={(editedConfig.videoQualityPresets || []).includes(quality as any)}
                                                    onChange={(e) => {
                                                        const current = editedConfig.videoQualityPresets || [];
                                                        if (e.target.checked) {
                                                            updateConfig('videoQualityPresets', [...current, quality as any]);
                                                        } else {
                                                            updateConfig('videoQualityPresets', current.filter((q: string) => q !== quality));
                                                        }
                                                    }}
                                                    className="w-4 h-4"
                                                />
                                                <span>{quality}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Audio & Subtitles */}
                        {activeTab === 'audio' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-gray-900 rounded-lg p-6 border border-gray-800 space-y-6"
                            >
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <FaMicrophone />
                                    Audio & Subtitle Settings
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold mb-2">Default Audio Language</label>
                                        <select
                                            value={editedConfig.defaultAudioLanguage || 'Japanese'}
                                            onChange={(e) => updateConfig('defaultAudioLanguage', e.target.value)}
                                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                                        >
                                            {(editedConfig.supportedAudioLanguages || []).map((lang) => (
                                                <option key={lang} value={lang}>{lang}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold mb-2">Default Subtitle Language</label>
                                        <select
                                            value={editedConfig.defaultSubtitleLanguage || 'English'}
                                            onChange={(e) => updateConfig('defaultSubtitleLanguage', e.target.value)}
                                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                                        >
                                            {(editedConfig.supportedSubtitleLanguages || []).map((lang) => (
                                                <option key={lang} value={lang}>{lang}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold mb-2">Supported Audio Languages</label>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {(editedConfig.supportedAudioLanguages || []).map((lang) => (
                                            <span key={lang} className="px-3 py-1 bg-gray-800 rounded flex items-center gap-2">
                                                {lang}
                                                <button
                                                    onClick={() => removeLanguage('audio', lang)}
                                                    className="text-red-400 hover:text-red-300"
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <select
                                            onChange={(e) => {
                                                if (e.target.value) {
                                                    addLanguage('audio', e.target.value);
                                                    e.target.value = '';
                                                }
                                            }}
                                            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                                        >
                                            <option value="">Add audio language...</option>
                                            {commonLanguages.filter(l => !(editedConfig.supportedAudioLanguages || []).includes(l)).map((lang) => (
                                                <option key={lang} value={lang}>{lang}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold mb-2">Supported Subtitle Languages</label>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {(editedConfig.supportedSubtitleLanguages || []).map((lang) => (
                                            <span key={lang} className="px-3 py-1 bg-gray-800 rounded flex items-center gap-2">
                                                {lang}
                                                <button
                                                    onClick={() => removeLanguage('subtitle', lang)}
                                                    className="text-red-400 hover:text-red-300"
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <select
                                            onChange={(e) => {
                                                if (e.target.value) {
                                                    addLanguage('subtitle', e.target.value);
                                                    e.target.value = '';
                                                }
                                            }}
                                            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                                        >
                                            <option value="">Add subtitle language...</option>
                                            {commonLanguages.filter(l => !(editedConfig.supportedSubtitleLanguages || []).includes(l)).map((lang) => (
                                                <option key={lang} value={lang}>{lang}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold mb-2">Allowed Subtitle Formats</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['vtt', 'srt', 'ass'].map((format) => (
                                            <label key={format} className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded cursor-pointer hover:bg-gray-700">
                                                <input
                                                    type="checkbox"
                                                    checked={(editedConfig.allowedSubtitleFormats || []).includes(format)}
                                                    onChange={(e) => {
                                                        const current = editedConfig.allowedSubtitleFormats || [];
                                                        if (e.target.checked) {
                                                            updateConfig('allowe
```dSubtitleFormats', [...current, format]);
                                                        } else {
                                                            updateConfig('allowedSubtitleFormats', current.filter((f: string) => f !== format));
                                                        }
                                                    }}
                                                    className="w-4 h-4"
                                                />
                                                <span>{format.toUpperCase()}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold mb-2">Max Subtitle File Size (MB)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="50"
                                        value={editedConfig.maxSubtitleFileSizeMB || 5}
                                        onChange={(e) => updateConfig('maxSubtitleFileSizeMB', parseInt(e.target.value) || 5)}
                                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                                    />
                                </div>
                            </motion.div>
                        )}

                        {/* Upload Limits */}
                        {activeTab === 'upload' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-gray-900 rounded-lg p-6 border border-gray-800 space-y-6"
                            >
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <FaUpload />
                                    Upload Limits
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold mb-2">Max Uploads Per Day</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="100"
                                            value={editedConfig.maxUploadsPerDay || 10}
                                            onChange={(e) => updateConfig('maxUploadsPerDay', parseInt(e.target.value) || 10)}
                                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                                        />
                                        <p className="text-xs text-gray-400 mt-1">Per user limit</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold mb-2">Max Uploads Per Creator</label>
                                        <input
                                            type="number"
                                            min="10"
                                            max="1000"
                                            value={editedConfig.maxUploadsPerCreator || 100}
                                            onChange={(e) => updateConfig('maxUploadsPerCreator', parseInt(e.target.value) || 100)}
                                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                                        />
                                        <p className="text-xs text-gray-400 mt-1">Total limit per creator</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold mb-2">Max Episodes Per Series</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="1000}
                                            value={editedConfig.maxEpisodesPerSeries || 200}
                                            onChange={(e) => updateConfig('maxEpisodesPerSeries', parseInt(e.target.value) || 200)}
                                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                                        />
                                        <p className="text-xs text-gray-400 mt-1">Episode limit per series</p>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Comments */}
                        {activeTab === 'comments' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-gray-900 rounded-lg p-6 border border-gray-800 space-y-6"
                            >
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <FaComment />
                                    Comment Settings
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold mb-2">Comment Max Length</label>
                                        <input
                                            type="number"
                                            min="100"
                                            max="5000"
                                            value={editedConfig.commentMaxLength || 1000}
                                            onChange={(e) => updateConfig('commentMaxLength', parseInt(e.target.value) || 1000)}
                                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold mb-2">Max Comments Per Episode</label>
                                        <input
                                            type="number"
                                            min="100"
                                            max="10000"
                                            value={editedConfig.maxCommentsPerEpisode || 1000}
                                            onChange={(e) => updateConfig('maxCommentsPerEpisode', parseInt(e.target.value) || 1000)}
                                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                                        <div>
                                            <label className="block text-sm font-semibold mb-1">Require Comment Approval</label>
                                            <p className="text-xs text-gray-400">Comments must be approved before appearing</p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={editedConfig.requireCommentApproval || false}
                                            onChange={(e) => updateConfig('requireCommentApproval', e.target.checked)}
                                            className="w-5 h-5"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                                        <div>
                                            <label className="block text-sm font-semibold mb-1">Allow Anonymous Comments</label>
                                            <p className="text-xs text-gray-400">Allow non-logged-in users to comment</p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={editedConfig.allowAnonymousComments !== false}
                                            onChange={(e) => updateConfig('allowAnonymousComments', e.target.checked)}
                                            className="w-5 h-5"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Notifications */}
                        {activeTab === 'notifications' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-gray-900 rounded-lg p-6 border border-gray-800 space-y-6"
                            >
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <FaBell />
                                    Notification Settings
                                </h2>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                                        <div>
                                            <label className="block text-sm font-semibold mb-1">Email Notifications</label>
                                            <p className="text-xs text-gray-400">Enable email notifications for users</p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={editedConfig.enableEmailNotifications !== false}
                                            onChange={(e) => updateConfig('enableEmailNotifications', e.target.checked)}
                                            className="w-5 h-5"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                                        <div>
                                            <label className="block text-sm font-semibold mb-1">Push Notifications</label>
                                            <p className="text-xs text-gray-400">Enable browser push notifications</p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={editedConfig.enablePushNotifications !== false}
                                            onChange={(e) => updateConfig('enablePushNotifications', e.target.checked)}
                                            className="w-5 h-5"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Save Button at Bottom */}
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={handleReset}
                                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded text-white font-semibold flex items-center gap-2"
                            >
                                <FaUndo />
                                Reset Changes
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded text-white font-semibold disabled:opacity-50 flex items-center gap-2"
                            >
                                <FaSave />
                                {saving ? 'Saving...' : 'Save All Changes'}
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-20 bg-gray-900 rounded-lg">
                        <p className="text-gray-400">Failed to load platform configuration</p>
                    </div>
                )}
            </div>
        </div>
    );
}
