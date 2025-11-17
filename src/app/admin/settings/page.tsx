'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { FaCog, FaDatabase, FaServer, FaShieldAlt, FaSave, FaToggleOn, FaToggleOff } from 'react-icons/fa';

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState({
        maintenanceMode: false,
        allowRegistrations: true,
        requireEmailVerification: false,
        maxUploadSize: 50,
        cdnEnabled: false,
        cacheEnabled: true,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isAuthenticated || user?.role !== 'admin') {
            router.push('/admin/login');
            return;
        }
        fetchSettings();
    }, [isAuthenticated, user, router]);

    const fetchSettings = async () => {
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const response = await fetch('/api/admin/settings', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setSettings(data.settings || settings);
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const response = await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ settings })
            });

            if (response.ok) {
                alert('Settings saved successfully!');
            }
        } catch (error) {
            console.error('Failed to save settings:', error);
            alert('Failed to save settings');
        } finally {
            setSaving(false);
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
                        System Settings
                    </h1>
                    <p className="text-gray-400">Configure platform settings and system controls</p>
                </div>

                <div className="space-y-6">
                    {/* General Settings */}
                    <div className="bg-slate-800/50 rounded-2xl p-6 backdrop-blur-sm">
                        <h2 className="text-xl font-bold mb-4 flex items-center">
                            <FaCog className="mr-2" />
                            General Settings
                        </h2>
                        <div className="space-y-4">
                            <SettingToggle
                                label="Maintenance Mode"
                                description="Put the site in maintenance mode (only admins can access)"
                                checked={settings.maintenanceMode}
                                onChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
                            />
                            <SettingToggle
                                label="Allow New Registrations"
                                description="Allow new users to register"
                                checked={settings.allowRegistrations}
                                onChange={(checked) => setSettings({ ...settings, allowRegistrations: checked })}
                            />
                            <SettingToggle
                                label="Require Email Verification"
                                description="Require users to verify their email before accessing the platform"
                                checked={settings.requireEmailVerification}
                                onChange={(checked) => setSettings({ ...settings, requireEmailVerification: checked })}
                            />
                        </div>
                    </div>

                    {/* Upload Settings */}
                    <div className="bg-slate-800/50 rounded-2xl p-6 backdrop-blur-sm">
                        <h2 className="text-xl font-bold mb-4 flex items-center">
                            <FaDatabase className="mr-2" />
                            Upload Settings
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">
                                    Max Upload Size (MB)
                                </label>
                                <input
                                    type="number"
                                    value={settings.maxUploadSize}
                                    onChange={(e) => setSettings({ ...settings, maxUploadSize: parseInt(e.target.value) })}
                                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Performance Settings */}
                    <div className="bg-slate-800/50 rounded-2xl p-6 backdrop-blur-sm">
                        <h2 className="text-xl font-bold mb-4 flex items-center">
                            <FaServer className="mr-2" />
                            Performance Settings
                        </h2>
                        <div className="space-y-4">
                            <SettingToggle
                                label="CDN Enabled"
                                description="Use CDN for static assets"
                                checked={settings.cdnEnabled}
                                onChange={(checked) => setSettings({ ...settings, cdnEnabled: checked })}
                            />
                            <SettingToggle
                                label="Cache Enabled"
                                description="Enable caching for better performance"
                                checked={settings.cacheEnabled}
                                onChange={(checked) => setSettings({ ...settings, cacheEnabled: checked })}
                            />
                        </div>
                    </div>

                    {/* Security Settings */}
                    <div className="bg-slate-800/50 rounded-2xl p-6 backdrop-blur-sm">
                        <h2 className="text-xl font-bold mb-4 flex items-center">
                            <FaShieldAlt className="mr-2" />
                            Security Settings
                        </h2>
                        <div className="space-y-4">
                            <div className="text-gray-400 text-sm">
                                Security settings and access controls are managed through the admin authentication system.
                            </div>
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg disabled:opacity-50"
                        >
                            {saving ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <FaSave className="mr-2" />
                                    Save Settings
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SettingToggle({ label, description, checked, onChange }: {
    label: string;
    description: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}) {
    return (
        <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
            <div className="flex-1">
                <h3 className="font-semibold mb-1">{label}</h3>
                <p className="text-sm text-gray-400">{description}</p>
            </div>
            <button
                onClick={() => onChange(!checked)}
                className={`ml-4 p-2 rounded-lg transition-colors ${
                    checked ? 'bg-purple-600' : 'bg-slate-600'
                }`}
            >
                {checked ? <FaToggleOn className="text-2xl" /> : <FaToggleOff className="text-2xl" />}
            </button>
        </div>
    );
}

