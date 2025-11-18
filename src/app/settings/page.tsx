'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { FaUser, FaBell, FaLock, FaEye, FaPalette, FaSave, FaSpinner, FaRobot } from 'react-icons/fa';
import { AI_FEATURES, DEFAULT_AI_PREFERENCES, type UserAIPreferences } from '@/lib/ai-features-config';

export default function SettingsPage() {
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');
    const [activeTab, setActiveTab] = useState('profile');

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        bio: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const [preferences, setPreferences] = useState({
        emailNotifications: true,
        pushNotifications: true,
        newChapterAlerts: true,
        darkMode: true,
        autoplay: false,
    });

    const [aiPreferences, setAiPreferences] = useState<Partial<UserAIPreferences>>(DEFAULT_AI_PREFERENCES);
    const [loadingAIPrefs, setLoadingAIPrefs] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }

        if (user) {
            setFormData({
                username: user.username || '',
                email: user.email || '',
                bio: user.bio || '',
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            });
        }

        // Load AI preferences
        loadAIPreferences();
    }, [isAuthenticated, user, router]);

    const loadAIPreferences = async () => {
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            if (!token) return;

            const response = await fetch('/api/user/ai-preferences', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.preferences) {
                    setAiPreferences(data.preferences);
                }
            }
        } catch (error) {
            console.error('Failed to load AI preferences:', error);
        }
    };

    const handleAIPreferenceChange = (key: keyof UserAIPreferences) => {
        setAiPreferences(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const handleSaveAIPreferences = async () => {
        setLoadingAIPrefs(true);
        setSaveMessage('');

        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const response = await fetch('/api/user/ai-preferences', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ preferences: aiPreferences }),
            });

            if (response.ok) {
                setSaveMessage('✅ AI preferences saved successfully!');
                setTimeout(() => setSaveMessage(''), 3000);
            } else {
                const data = await response.json();
                setSaveMessage(`❌ ${data.error || 'Failed to save AI preferences'}`);
            }
        } catch (error) {
            setSaveMessage('❌ Error saving AI preferences');
        } finally {
            setLoadingAIPrefs(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePreferenceChange = (key: string) => {
        setPreferences({ ...preferences, [key]: !preferences[key] });
    };

    const handleSaveProfile = async () => {
        setLoading(true);
        setSaveMessage('');

        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const response = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    username: formData.username,
                    bio: formData.bio,
                }),
            });

            if (response.ok) {
                setSaveMessage('✅ Profile updated successfully!');
                // Update local user data if needed
                setTimeout(() => setSaveMessage(''), 3000);
            } else {
                const data = await response.json();
                setSaveMessage(`❌ ${data.error || 'Failed to update profile'}`);
            }
        } catch (error) {
            setSaveMessage('❌ Error updating profile');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (formData.newPassword !== formData.confirmPassword) {
            setSaveMessage('❌ Passwords do not match');
            return;
        }

        if (formData.newPassword.length < 6) {
            setSaveMessage('❌ Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        setSaveMessage('');

        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const response = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword: formData.currentPassword,
                    newPassword: formData.newPassword,
                }),
            });

            if (response.ok) {
                setSaveMessage('✅ Password changed successfully!');
                setFormData({ ...formData, currentPassword: '', newPassword: '', confirmPassword: '' });
                setTimeout(() => setSaveMessage(''), 3000);
            } else {
                const data = await response.json();
                setSaveMessage(`❌ ${data.error || 'Failed to change password'}`);
            }
        } catch (error) {
            setSaveMessage('❌ Error changing password');
        } finally {
            setLoading(false);
        }
    };

    const handleSavePreferences = async () => {
        setLoading(true);
        setSaveMessage('');

        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const response = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ preferences }),
            });

            if (response.ok) {
                setSaveMessage('✅ Preferences saved successfully!');
                setTimeout(() => setSaveMessage(''), 3000);
            } else {
                const data = await response.json();
                setSaveMessage(`❌ ${data.error || 'Failed to save preferences'}`);
            }
        } catch (error) {
            setSaveMessage('❌ Error saving preferences');
        } finally {
            setLoading(false);
        }
    };

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pt-24 pb-12">
            <div className="container mx-auto px-4 max-w-5xl">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
                    <p className="text-gray-400">Manage your account settings and preferences</p>
                </div>

                {/* Tabs */}
                <div className="flex space-x-1 mb-6 bg-slate-800/50 rounded-lg p-1">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                            activeTab === 'profile'
                                ? 'bg-indigo-600 text-white'
                                : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
                        }`}
                    >
                        <FaUser />
                        <span>Profile</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('security')}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                            activeTab === 'security'
                                ? 'bg-indigo-600 text-white'
                                : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
                        }`}
                    >
                        <FaLock />
                        <span>Security</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('notifications')}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                            activeTab === 'notifications'
                                ? 'bg-indigo-600 text-white'
                                : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
                        }`}
                    >
                        <FaBell />
                        <span>Notifications</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('preferences')}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                            activeTab === 'preferences'
                                ? 'bg-indigo-600 text-white'
                                : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
                        }`}
                    >
                        <FaPalette />
                        <span>Preferences</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('ai-features')}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                            activeTab === 'ai-features'
                                ? 'bg-indigo-600 text-white'
                                : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
                        }`}
                    >
                        <FaRobot />
                        <span>AI Features</span>
                    </button>
                </div>

                {/* Content */}
                <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
                    {saveMessage && (
                        <div className={`mb-4 p-3 rounded-lg ${
                            saveMessage.includes('✅') ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                        }`}>
                            {saveMessage}
                        </div>
                    )}

                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-white mb-4">Profile Information</h2>
                            
                            <div>
                                <label className="block text-gray-300 mb-2">Username</label>
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-300 mb-2">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    disabled
                                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-gray-400 cursor-not-allowed"
                                />
                                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                            </div>

                            <div>
                                <label className="block text-gray-300 mb-2">Bio</label>
                                <textarea
                                    name="bio"
                                    value={formData.bio}
                                    onChange={handleInputChange}
                                    rows={4}
                                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
                                    placeholder="Tell us about yourself..."
                                />
                            </div>

                            <button
                                onClick={handleSaveProfile}
                                disabled={loading}
                                className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50"
                            >
                                {loading ? <FaSpinner className="animate-spin" /> : <FaSave />}
                                <span>Save Changes</span>
                            </button>
                        </div>
                    )}

                    {/* Security Tab */}
                    {activeTab === 'security' && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-white mb-4">Change Password</h2>

                            <div>
                                <label className="block text-gray-300 mb-2">Current Password</label>
                                <input
                                    type="password"
                                    name="currentPassword"
                                    value={formData.currentPassword}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-300 mb-2">New Password</label>
                                <input
                                    type="password"
                                    name="newPassword"
                                    value={formData.newPassword}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-300 mb-2">Confirm New Password</label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
                                />
                            </div>

                            <button
                                onClick={handleChangePassword}
                                disabled={loading}
                                className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50"
                            >
                                {loading ? <FaSpinner className="animate-spin" /> : <FaLock />}
                                <span>Change Password</span>
                            </button>
                        </div>
                    )}

                    {/* Notifications Tab */}
                    {activeTab === 'notifications' && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-white mb-4">Notification Preferences</h2>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-white font-medium">Email Notifications</h3>
                                        <p className="text-sm text-gray-400">Receive updates via email</p>
                                    </div>
                                    <button
                                        onClick={() => handlePreferenceChange('emailNotifications')}
                                        className={`relative w-12 h-6 rounded-full transition-colors ${
                                            preferences.emailNotifications ? 'bg-indigo-600' : 'bg-slate-600'
                                        }`}
                                    >
                                        <div
                                            className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${
                                                preferences.emailNotifications ? 'translate-x-6' : 'translate-x-0.5'
                                            }`}
                                        />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-white font-medium">Push Notifications</h3>
                                        <p className="text-sm text-gray-400">Receive push notifications</p>
                                    </div>
                                    <button
                                        onClick={() => handlePreferenceChange('pushNotifications')}
                                        className={`relative w-12 h-6 rounded-full transition-colors ${
                                            preferences.pushNotifications ? 'bg-indigo-600' : 'bg-slate-600'
                                        }`}
                                    >
                                        <div
                                            className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${
                                                preferences.pushNotifications ? 'translate-x-6' : 'translate-x-0.5'
                                            }`}
                                        />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-white font-medium">New Chapter Alerts</h3>
                                        <p className="text-sm text-gray-400">Get notified when new chapters are released</p>
                                    </div>
                                    <button
                                        onClick={() => handlePreferenceChange('newChapterAlerts')}
                                        className={`relative w-12 h-6 rounded-full transition-colors ${
                                            preferences.newChapterAlerts ? 'bg-indigo-600' : 'bg-slate-600'
                                        }`}
                                    >
                                        <div
                                            className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${
                                                preferences.newChapterAlerts ? 'translate-x-6' : 'translate-x-0.5'
                                            }`}
                                        />
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={handleSavePreferences}
                                disabled={loading}
                                className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50"
                            >
                                {loading ? <FaSpinner className="animate-spin" /> : <FaSave />}
                                <span>Save Preferences</span>
                            </button>
                        </div>
                    )}

                    {/* Preferences Tab */}
                    {activeTab === 'preferences' && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-white mb-4">Reading Preferences</h2>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-white font-medium">Dark Mode</h3>
                                        <p className="text-sm text-gray-400">Use dark theme</p>
                                    </div>
                                    <button
                                        onClick={() => handlePreferenceChange('darkMode')}
                                        className={`relative w-12 h-6 rounded-full transition-colors ${
                                            preferences.darkMode ? 'bg-indigo-600' : 'bg-slate-600'
                                        }`}
                                    >
                                        <div
                                            className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${
                                                preferences.darkMode ? 'translate-x-6' : 'translate-x-0.5'
                                            }`}
                                        />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-white font-medium">Autoplay Next Chapter</h3>
                                        <p className="text-sm text-gray-400">Automatically load next chapter</p>
                                    </div>
                                    <button
                                        onClick={() => handlePreferenceChange('autoplay')}
                                        className={`relative w-12 h-6 rounded-full transition-colors ${
                                            preferences.autoplay ? 'bg-indigo-600' : 'bg-slate-600'
                                        }`}
                                    >
                                        <div
                                            className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${
                                                preferences.autoplay ? 'translate-x-6' : 'translate-x-0.5'
                                            }`}
                                        />
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={handleSavePreferences}
                                disabled={loading}
                                className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50"
                            >
                                {loading ? <FaSpinner className="animate-spin" /> : <FaSave />}
                                <span>Save Preferences</span>
                            </button>
                        </div>
                    )}

                    {/* AI Features Tab */}
                    {activeTab === 'ai-features' && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-2">AI-Powered Features</h2>
                                <p className="text-gray-400">Enable or disable advanced AI features to enhance your reading experience</p>
                            </div>

                            {/* Discovery Features */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-white border-b border-slate-700 pb-2">Discovery & Recommendations</h3>
                                
                                {AI_FEATURES.filter(f => f.category === 'discovery').map(feature => {
                                    const key = feature.id === 'smart-recommendations' ? 'smartRecommendations' :
                                                feature.id === 'semantic-search' ? 'semanticSearch' :
                                                feature.id === 'personalized-filtering' ? 'personalizedFiltering' :
                                                feature.id === 'mood-discovery' ? 'moodBasedDiscovery' : null;
                                    
                                    if (!key) return null;
                                    
                                    return (
                                        <div key={feature.id} className="flex items-start justify-between p-4 bg-slate-700/30 rounded-lg">
                                            <div className="flex-1">
                                                <h4 className="text-white font-medium mb-1">{feature.name}</h4>
                                                <p className="text-sm text-gray-400">{feature.description}</p>
                                                {feature.requiresPermission && (
                                                    <p className="text-xs text-yellow-400 mt-1">⚠️ Requires permission</p>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => key && handleAIPreferenceChange(key as keyof UserAIPreferences)}
                                                className={`ml-4 relative w-12 h-6 rounded-full transition-colors ${
                                                    aiPreferences[key as keyof UserAIPreferences] ? 'bg-indigo-600' : 'bg-slate-600'
                                                }`}
                                            >
                                                <div
                                                    className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${
                                                        aiPreferences[key as keyof UserAIPreferences] ? 'translate-x-6' : 'translate-x-0.5'
                                                    }`}
                                                />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Reading Features */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-white border-b border-slate-700 pb-2">Reading Enhancements</h3>
                                
                                {AI_FEATURES.filter(f => f.category === 'reading').map(feature => {
                                    const key = feature.id === 'eye-tracking' ? 'eyeTracking' :
                                                feature.id === 'auto-brightness' ? 'autoBrightness' :
                                                feature.id === 'chapter-summaries' ? 'chapterSummaries' :
                                                feature.id === 'previously-on' ? 'previouslyOnRecap' : null;
                                    
                                    if (!key) return null;
                                    
                                    return (
                                        <div key={feature.id} className="flex items-start justify-between p-4 bg-slate-700/30 rounded-lg">
                                            <div className="flex-1">
                                                <h4 className="text-white font-medium mb-1">{feature.name}</h4>
                                                <p className="text-sm text-gray-400">{feature.description}</p>
                                                {feature.requiresPermission && (
                                                    <p className="text-xs text-yellow-400 mt-1">⚠️ Requires permission</p>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => key && handleAIPreferenceChange(key as keyof UserAIPreferences)}
                                                className={`ml-4 relative w-12 h-6 rounded-full transition-colors ${
                                                    aiPreferences[key as keyof UserAIPreferences] ? 'bg-indigo-600' : 'bg-slate-600'
                                                }`}
                                            >
                                                <div
                                                    className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${
                                                        aiPreferences[key as keyof UserAIPreferences] ? 'translate-x-6' : 'translate-x-0.5'
                                                    }`}
                                                />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Accessibility Features */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-white border-b border-slate-700 pb-2">Accessibility</h3>
                                
                                {AI_FEATURES.filter(f => f.category === 'accessibility').map(feature => {
                                    const key = feature.id === 'voice-assistant' ? 'voiceAssistant' : null;
                                    
                                    if (!key) return null;
                                    
                                    return (
                                        <div key={feature.id} className="flex items-start justify-between p-4 bg-slate-700/30 rounded-lg">
                                            <div className="flex-1">
                                                <h4 className="text-white font-medium mb-1">{feature.name}</h4>
                                                <p className="text-sm text-gray-400">{feature.description}</p>
                                                {feature.requiresPermission && (
                                                    <p className="text-xs text-yellow-400 mt-1">⚠️ Requires permission</p>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => key && handleAIPreferenceChange(key as keyof UserAIPreferences)}
                                                className={`ml-4 relative w-12 h-6 rounded-full transition-colors ${
                                                    aiPreferences[key as keyof UserAIPreferences] ? 'bg-indigo-600' : 'bg-slate-600'
                                                }`}
                                            >
                                                <div
                                                    className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${
                                                        aiPreferences[key as keyof UserAIPreferences] ? 'translate-x-6' : 'translate-x-0.5'
                                                    }`}
                                                />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Analytics Features */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-white border-b border-slate-700 pb-2">Analytics & Stats</h3>
                                
                                {AI_FEATURES.filter(f => f.category === 'analytics').map(feature => {
                                    const key = feature.id === 'reading-stats' ? 'readingStats' : null;
                                    
                                    if (!key) return null;
                                    
                                    return (
                                        <div key={feature.id} className="flex items-start justify-between p-4 bg-slate-700/30 rounded-lg">
                                            <div className="flex-1">
                                                <h4 className="text-white font-medium mb-1">{feature.name}</h4>
                                                <p className="text-sm text-gray-400">{feature.description}</p>
                                            </div>
                                            <button
                                                onClick={() => key && handleAIPreferenceChange(key as keyof UserAIPreferences)}
                                                className={`ml-4 relative w-12 h-6 rounded-full transition-colors ${
                                                    aiPreferences[key as keyof UserAIPreferences] ? 'bg-indigo-600' : 'bg-slate-600'
                                                }`}
                                            >
                                                <div
                                                    className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${
                                                        aiPreferences[key as keyof UserAIPreferences] ? 'translate-x-6' : 'translate-x-0.5'
                                                    }`}
                                                />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>

                            <button
                                onClick={handleSaveAIPreferences}
                                disabled={loadingAIPrefs}
                                className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50"
                            >
                                {loadingAIPrefs ? <FaSpinner className="animate-spin" /> : <FaSave />}
                                <span>Save AI Preferences</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

