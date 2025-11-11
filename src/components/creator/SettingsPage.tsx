'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from './DashboardLayout';
import { motion } from 'framer-motion';
import { FaSave, FaUserEdit, FaWallet, FaBell, FaCheckCircle } from 'react-icons/fa';

interface CreatorProfile {
    displayName: string;
    bio: string;
    avatar: string;
    socialLinks: Record<string, string>;
    updatedAt?: string | null;
}

interface PayoutInfo {
    method: 'upi' | 'bank';
    upiId?: string;
    bank?:
        | {
              accountHolder: string;
              accountNumber: string;
              ifsc: string;
              bankName: string;
          }
        | null;
    taxId?: string;
    razorpayAccountId?: string;
    verificationStatus: 'pending' | 'verified' | 'rejected';
    updatedAt?: string | null;
}

interface NotificationSettings {
    newDonations: boolean;
    newSubscribers: boolean;
    chapterComments: boolean;
    payoutUpdates: boolean;
    platformAnnouncements: boolean;
}

const notificationLabels: Record<keyof NotificationSettings, string> = {
    newDonations: 'Notify me when I receive a donation',
    newSubscribers: 'Notify me about new subscribers',
    chapterComments: 'Notify me about new chapter comments',
    payoutUpdates: 'Notify me about payout status updates',
    platformAnnouncements: 'Send platform updates & announcements'
};

const socialLinkPlaceholders: Record<string, string> = {
    twitter: 'https://twitter.com/username',
    instagram: 'https://instagram.com/username',
    website: 'https://your-website.com',
    youtube: 'https://youtube.com/@channel',
    discord: 'https://discord.gg/invite'
};

export default function SettingsPage() {
    const [profile, setProfile] = useState<CreatorProfile | null>(null);
    const [profileForm, setProfileForm] = useState<CreatorProfile>({
        displayName: '',
        bio: '',
        avatar: '',
        socialLinks: {}
    });
    const [payout, setPayout] = useState<PayoutInfo | null>(null);
    const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingPayout, setSavingPayout] = useState(false);
    const [savingNotifications, setSavingNotifications] = useState(false);
    const [activeTab, setActiveTab] = useState<'profile' | 'payout' | 'notifications'>('profile');
    const [authToken, setAuthToken] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const stored =
            localStorage.getItem('authToken') || localStorage.getItem('token');
        setAuthToken(stored);
    }, []);

    useEffect(() => {
        if (!authToken) return;
        loadData(authToken);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authToken]);

    const loadData = async (token: string) => {
        try {
            setLoading(true);

            const [profileRes, payoutRes, notificationsRes] = await Promise.all([
                fetch('/api/creator/settings/profile', {
                    headers: { Authorization: token ? `Bearer ${token}` : '' }
                }),
                fetch('/api/creator/settings/payout', {
                    headers: { Authorization: token ? `Bearer ${token}` : '' }
                }),
                fetch('/api/creator/settings/notifications', {
                    headers: { Authorization: token ? `Bearer ${token}` : '' }
                })
            ]);

            if (profileRes.ok) {
                const profileData = await profileRes.json();
                setProfile(profileData.profile);
                setProfileForm({
                    displayName: profileData.profile.displayName || '',
                    bio: profileData.profile.bio || '',
                    avatar: profileData.profile.avatar || '',
                    socialLinks: profileData.profile.socialLinks || {}
                });
            }

            if (payoutRes.ok) {
                const payoutData = await payoutRes.json();
                setPayout(payoutData.payout);
            }

            if (notificationsRes.ok) {
                const notifData = await notificationsRes.json();
                setNotificationSettings(notifData.notifications);
            }
        } catch (error) {
            console.error('Failed to load creator settings', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        if (!authToken) {
            alert('Authentication required. Please log in again.');
            return;
        }
        try {
            setSavingProfile(true);
            const response = await fetch('/api/creator/settings/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${authToken}`
                },
                body: JSON.stringify(profileForm)
            });

            if (!response.ok) {
                const error = await response.json();
                alert(error.error || 'Failed to update profile');
                return;
            }

            const data = await response.json();
            setProfile(data.profile);
            alert('Profile updated successfully!');
        } catch (error) {
            console.error('Failed to update profile', error);
            alert('Failed to update profile. Please try again.');
        } finally {
            setSavingProfile(false);
        }
    };

    const handleSavePayout = async () => {
        if (!payout) return;
        if (!authToken) {
            alert('Authentication required. Please log in again.');
            return;
        }
        try {
            setSavingPayout(true);

            const payload: any = {
                method: payout.method,
                taxId: payout.taxId,
                razorpayAccountId: payout.razorpayAccountId
            };

            if (payout.method === 'upi') {
                payload.upiId = payout.upiId;
            } else if (payout.method === 'bank' && payout.bank) {
                payload.accountHolder = payout.bank.accountHolder;
                payload.accountNumber = payout.bank.accountNumber;
                payload.ifsc = payout.bank.ifsc;
                payload.bankName = payout.bank.bankName;
            }

            const response = await fetch('/api/creator/settings/payout', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${authToken}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const error = await response.json();
                alert(error.error || 'Failed to update payout information');
                return;
            }

            const data = await response.json();
            setPayout(data.payout);
            alert('Payout information updated!');
        } catch (error) {
            console.error('Failed to update payout info', error);
            alert('Failed to update payout information. Please try again.');
        } finally {
            setSavingPayout(false);
        }
    };

    const handleSaveNotifications = async () => {
        if (!notificationSettings) return;
        if (!authToken) {
            alert('Authentication required. Please log in again.');
            return;
        }
        try {
            setSavingNotifications(true);
            const response = await fetch('/api/creator/settings/notifications', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${authToken}`
                },
                body: JSON.stringify(notificationSettings)
            });

            if (!response.ok) {
                const error = await response.json();
                alert(error.error || 'Failed to update notification settings');
                return;
            }

            alert('Notification preferences saved!');
        } catch (error) {
            console.error('Failed to update notifications', error);
            alert('Failed to update notification settings. Please try again.');
        } finally {
            setSavingNotifications(false);
        }
    };

    const renderProfileForm = () => (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">
                    Display Name
                </label>
                <input
                    value={profileForm.displayName}
                    onChange={(e) =>
                        setProfileForm((prev) => ({ ...prev, displayName: e.target.value }))
                    }
                    placeholder="How readers see you"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                />
            </div>
            <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">
                    Creator Bio
                </label>
                <textarea
                    value={profileForm.bio}
                    onChange={(e) =>
                        setProfileForm((prev) => ({ ...prev, bio: e.target.value }))
                    }
                    rows={4}
                    placeholder="Tell readers about your work, schedule, or mission."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 resize-none"
                />
            </div>
            <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">
                    Avatar URL
                </label>
                <input
                    value={profileForm.avatar}
                    onChange={(e) =>
                        setProfileForm((prev) => ({ ...prev, avatar: e.target.value }))
                    }
                    placeholder="https://"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                    Tip: Use a square image (min 512x512) hosted on a CDN for best results.
                </p>
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">
                    Social Links
                </label>
                <div className="space-y-3">
                    {Object.entries(socialLinkPlaceholders).map(([key, placeholder]) => (
                        <div key={key} className="grid grid-cols-3 gap-3 items-center">
                            <span className="text-sm font-medium text-gray-400 capitalize">
                                {key}
                            </span>
                            <input
                                className="col-span-2 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                                value={profileForm.socialLinks[key] || ''}
                                placeholder={placeholder}
                                onChange={(e) =>
                                    setProfileForm((prev) => ({
                                        ...prev,
                                        socialLinks: {
                                            ...prev.socialLinks,
                                            [key]: e.target.value
                                        }
                                    }))
                                }
                            />
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                    className="inline-flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                    {savingProfile ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    ) : (
                        <FaSave />
                    )}
                    <span>Save Profile</span>
                </button>
            </div>
        </div>
    );

    const renderPayoutForm = () => {
        if (!payout) return null;

        const handleMethodChange = (method: 'upi' | 'bank') => {
            setPayout((prev) =>
                prev
                    ? {
                          ...prev,
                          method,
                          upiId: method === 'upi' ? prev.upiId || '' : '',
                          bank:
                              method === 'bank'
                                  ? prev.bank || {
                                        accountHolder: '',
                                        accountNumber: '',
                                        ifsc: '',
                                        bankName: ''
                                    }
                                  : null
                      }
                    : prev
            );
        };

        return (
            <div className="space-y-6">
                <div className="bg-slate-900/40 border border-slate-700/40 rounded-xl p-4 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-400">Verification Status</p>
                        <p className="text-white font-semibold flex items-center space-x-2">
                            {payout.verificationStatus === 'verified' && (
                                <FaCheckCircle className="text-green-400" />
                            )}
                            <span className="capitalize">{payout.verificationStatus}</span>
                        </p>
                        {payout.updatedAt && (
                            <p className="text-xs text-gray-500 mt-1">
                                Last reviewed {new Date(payout.updatedAt).toLocaleDateString()}
                            </p>
                        )}
                    </div>
                    <p className="text-xs text-gray-500">
                        Updates automatically when support verifies your payout method.
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-400 mb-2">
                        Razorpay Beneficiary ID
                    </label>
                    <input
                        value={payout.razorpayAccountId || ''}
                        onChange={(e) =>
                            setPayout((prev) =>
                                prev ? { ...prev, razorpayAccountId: e.target.value } : prev
                            )
                        }
                        placeholder="acc_1234567890abcdef"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Paste the payout account ID generated in your Razorpay dashboard. We will
                        review and connect it before releasing creator payouts.
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-400 mb-2">
                        Preferred Method
                    </label>
                    <div className="flex space-x-3">
                        {(['upi', 'bank'] as const).map((method) => (
                            <button
                                key={method}
                                onClick={() => handleMethodChange(method)}
                                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                                    payout.method === method
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-slate-800 text-gray-400 hover:text-white'
                                }`}
                            >
                                {method === 'upi' ? 'UPI' : 'Bank Transfer'}
                            </button>
                        ))}
                    </div>
                </div>

                {payout.method === 'upi' && (
                    <div>
                        <label className="block text-sm font-semibold text-gray-400 mb-2">
                            UPI ID
                        </label>
                        <input
                            value={payout.upiId || ''}
                            onChange={(e) =>
                                setPayout((prev) =>
                                    prev ? { ...prev, upiId: e.target.value } : prev
                                )
                            }
                            placeholder="yourname@upi"
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                        />
                    </div>
                )}

                {payout.method === 'bank' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-400 mb-2">
                                Account Holder Name
                            </label>
                            <input
                                value={payout.bank?.accountHolder || ''}
                                onChange={(e) =>
                                    setPayout((prev) =>
                                        prev
                                            ? {
                                                  ...prev,
                                                  bank: {
                                                      ...(prev.bank || {
                                                          accountHolder: '',
                                                          accountNumber: '',
                                                          ifsc: '',
                                                          bankName: ''
                                                      }),
                                                      accountHolder: e.target.value
                                                  }
                                              }
                                            : prev
                                    )
                                }
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-400 mb-2">
                                Account Number
                            </label>
                            <input
                                value={payout.bank?.accountNumber || ''}
                                onChange={(e) =>
                                    setPayout((prev) =>
                                        prev
                                            ? {
                                                  ...prev,
                                                  bank: {
                                                      ...(prev.bank || {
                                                          accountHolder: '',
                                                          accountNumber: '',
                                                          ifsc: '',
                                                          bankName: ''
                                                      }),
                                                      accountNumber: e.target.value
                                                  }
                                              }
                                            : prev
                                    )
                                }
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-400 mb-2">
                                IFSC Code
                            </label>
                            <input
                                value={payout.bank?.ifsc || ''}
                                onChange={(e) =>
                                    setPayout((prev) =>
                                        prev
                                            ? {
                                                  ...prev,
                                                  bank: {
                                                      ...(prev.bank || {
                                                          accountHolder: '',
                                                          accountNumber: '',
                                                          ifsc: '',
                                                          bankName: ''
                                                      }),
                                                      ifsc: e.target.value.toUpperCase()
                                                  }
                                              }
                                            : prev
                                    )
                                }
                                placeholder="HDFC0001234"
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 uppercase"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-400 mb-2">
                                Bank Name
                            </label>
                            <input
                                value={payout.bank?.bankName || ''}
                                onChange={(e) =>
                                    setPayout((prev) =>
                                        prev
                                            ? {
                                                  ...prev,
                                                  bank: {
                                                      ...(prev.bank || {
                                                          accountHolder: '',
                                                          accountNumber: '',
                                                          ifsc: '',
                                                          bankName: ''
                                                      }),
                                                      bankName: e.target.value
                                                  }
                                              }
                                            : prev
                                    )
                                }
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                            />
                        </div>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-semibold text-gray-400 mb-2">
                        Tax ID (PAN / GST)
                    </label>
                    <input
                        value={payout.taxId || ''}
                        onChange={(e) =>
                            setPayout((prev) =>
                                prev ? { ...prev, taxId: e.target.value.toUpperCase() } : prev
                            )
                        }
                        placeholder="ABCDE1234F"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 uppercase"
                    />
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={handleSavePayout}
                        disabled={savingPayout}
                        className="inline-flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                    >
                        {savingPayout ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        ) : (
                            <FaSave />
                        )}
                        <span>Save Payout Details</span>
                    </button>
                </div>
            </div>
        );
    };

    const renderNotificationsForm = () => {
        if (!notificationSettings) return null;

        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                    {(Object.keys(notificationSettings) as Array<keyof NotificationSettings>).map(
                        (key) => (
                            <label
                                key={key}
                                className="flex items-start justify-between bg-slate-900/40 border border-slate-700/40 rounded-xl p-4"
                            >
                                <div>
                                    <p className="text-sm text-white font-semibold">
                                        {notificationLabels[key]}
                                    </p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={notificationSettings[key]}
                                    onChange={(e) =>
                                        setNotificationSettings((prev) =>
                                            prev ? { ...prev, [key]: e.target.checked } : prev
                                        )
                                    }
                                    className="mt-1 h-5 w-5 accent-purple-500"
                                />
                            </label>
                        )
                    )}
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={handleSaveNotifications}
                        disabled={savingNotifications}
                        className="inline-flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                    >
                        {savingNotifications ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        ) : (
                            <FaSave />
                        )}
                        <span>Save Preferences</span>
                    </button>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4" />
                        <p className="text-gray-400">Loading settings…</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Settings & Preferences</h1>
                    <p className="text-gray-400">
                        Update your public profile, payout information, and notifications
                    </p>
                </div>

                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-2 flex space-x-2">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`flex-1 inline-flex items-center justify-center space-x-2 px-4 py-2 rounded-xl font-semibold transition-all ${
                            activeTab === 'profile'
                                ? 'bg-purple-600 text-white'
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        <FaUserEdit />
                        <span>Profile</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('payout')}
                        className={`flex-1 inline-flex items-center justify-center space-x-2 px-4 py-2 rounded-xl font-semibold transition-all ${
                            activeTab === 'payout'
                                ? 'bg-purple-600 text-white'
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        <FaWallet />
                        <span>Payout</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('notifications')}
                        className={`flex-1 inline-flex items-center justify-center space-x-2 px-4 py-2 rounded-xl font-semibold transition-all ${
                            activeTab === 'notifications'
                                ? 'bg-purple-600 text-white'
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        <FaBell />
                        <span>Notifications</span>
                    </button>
                </div>

                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6"
                >
                    {activeTab === 'profile' && renderProfileForm()}
                    {activeTab === 'payout' && renderPayoutForm()}
                    {activeTab === 'notifications' && renderNotificationsForm()}
                </motion.div>
            </div>
        </DashboardLayout>
    );
}

