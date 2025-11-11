'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from './DashboardLayout';
import {
    FaCoins,
    FaMoneyBillWave,
    FaPlus,
    FaToggleOn,
    FaToggleOff,
    FaTrash,
    FaArrowsRotate,
    FaChartPie,
    FaChartSimple
} from 'react-icons/fa6';
import { FaChartLine } from 'react-icons/fa';

interface MonetizationOverview {
    stats: {
        activePlans: number;
        inactivePlans: number;
        paidChapters: number;
        freeChapters: number;
        averageChapterPrice: number;
        donationRevenue30d: number;
        estimatedMonthlyRevenue: number;
    };
    revenueBreakdown: {
        donations: number;
        subscriptions: number;
        coins: number;
    };
}

interface MonetizationPlan {
    _id: string;
    name: string;
    description: string;
    price: number;
    interval: 'one-time' | 'monthly' | 'quarterly' | 'yearly';
    type: 'subscription' | 'one-time' | 'coins';
    perks: string[];
    isActive: boolean;
    subscriberCount: number;
    razorpayPlanId?: string | null;
    createdAt?: string;
    updatedAt?: string;
}

const PLAN_INTERVAL_LABEL: Record<MonetizationPlan['interval'], string> = {
    'one-time': 'One-time',
    'monthly': 'Monthly',
    'quarterly': 'Quarterly',
    'yearly': 'Yearly'
};

const PLAN_TYPE_LABEL: Record<MonetizationPlan['type'], string> = {
    subscription: 'Subscription',
    'one-time': 'One-time Support',
    coins: 'Coin Pack'
};

const initialPlanForm = {
    name: '',
    description: '',
    price: '',
    interval: 'monthly' as MonetizationPlan['interval'],
    type: 'subscription' as MonetizationPlan['type'],
    perks: ''
};

function formatCurrency(amount: number) {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function MonetizationPage() {
    const [loading, setLoading] = useState(true);
    const [plansLoading, setPlansLoading] = useState(true);
    const [savingPlan, setSavingPlan] = useState(false);
    const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);
    const [overview, setOverview] = useState<MonetizationOverview | null>(null);
    const [plans, setPlans] = useState<MonetizationPlan[]>([]);
    const [planForm, setPlanForm] = useState(initialPlanForm);
    const [authToken, setAuthToken] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const stored =
            localStorage.getItem('authToken') || localStorage.getItem('token');
        setAuthToken(stored);
    }, []);

    useEffect(() => {
        if (!authToken) return;
        fetchOverview(authToken);
        fetchPlans(authToken);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authToken]);

    const fetchOverview = async (token: string) => {
        try {
            setLoading(true);
            const response = await fetch('/api/creator/monetization/overview', {
                headers: {
                    Authorization: token ? `Bearer ${token}` : ''
                }
            });
            if (response.ok) {
                const data = await response.json();
                setOverview(data);
            }
        } catch (error) {
            console.error('Failed to fetch monetization overview', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPlans = async (token: string) => {
        try {
            setPlansLoading(true);
            const response = await fetch('/api/creator/monetization/plans', {
                headers: {
                    Authorization: token ? `Bearer ${token}` : ''
                }
            });
            if (response.ok) {
                const data = await response.json();
                setPlans(data.plans || []);
            }
        } catch (error) {
            console.error('Failed to fetch monetization plans', error);
        } finally {
            setPlansLoading(false);
        }
    };

    const handleCreatePlan = async () => {
        if (!planForm.name || !planForm.price) {
            alert('Please enter plan name and price');
            return;
        }

        if (!authToken) {
            alert('Authentication required. Please log in again.');
            return;
        }

        try {
            setSavingPlan(true);
            const response = await fetch('/api/creator/monetization/plans', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${authToken}`
                },
                body: JSON.stringify({
                    name: planForm.name,
                    description: planForm.description,
                    price: parseFloat(planForm.price),
                    interval: planForm.interval,
                    type: planForm.type,
                    perks: planForm.perks
                        ? planForm.perks.split(',').map((perk) => perk.trim()).filter(Boolean)
                        : []
                })
            });

            if (!response.ok) {
                const error = await response.json();
                alert(error.error || 'Failed to create plan');
                return;
            }
            setPlanForm(initialPlanForm);
            fetchPlans(authToken);
            fetchOverview(authToken);
        } catch (error) {
            console.error('Failed to create plan', error);
            alert('Failed to create plan. Please try again.');
        } finally {
            setSavingPlan(false);
        }
    };

    const handleTogglePlan = async (plan: MonetizationPlan) => {
        if (!authToken) {
            alert('Authentication required. Please log in again.');
            return;
        }

        try {
            const response = await fetch(`/api/creator/monetization/plans/${plan._id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${authToken}`
                },
                body: JSON.stringify({ isActive: !plan.isActive })
            });

            if (!response.ok) {
                const error = await response.json();
                alert(error.error || 'Failed to update plan');
                return;
            }

            fetchPlans(authToken);
            fetchOverview(authToken);
        } catch (error) {
            console.error('Failed to toggle plan', error);
            alert('Failed to update plan. Please try again.');
        }
    };

    const handleDeletePlan = async (planId: string) => {
        if (!confirm('Are you sure you want to delete this plan?')) {
            return;
        }

        if (!authToken) {
            alert('Authentication required. Please log in again.');
            return;
        }

        try {
            setDeletingPlanId(planId);
            const response = await fetch(`/api/creator/monetization/plans/${planId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${authToken}`
                }
            });

            if (!response.ok) {
                const error = await response.json();
                alert(error.error || 'Failed to delete plan');
                return;
            }

            setPlans((prev) => prev.filter((plan) => plan._id !== planId));
            fetchOverview(authToken);
        } catch (error) {
            console.error('Failed to delete plan', error);
            alert('Failed to delete plan. Please try again.');
        } finally {
            setDeletingPlanId(null);
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Monetization</h1>
                        <p className="text-gray-400">
                            Manage pricing, subscription tiers, and revenue streams
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            if (!authToken) {
                                alert('Authentication required. Please log in again.');
                                return;
                            }
                            fetchOverview(authToken);
                            fetchPlans(authToken);
                        }}
                        className="mt-4 md:mt-0 inline-flex items-center space-x-2 bg-slate-800/70 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                    >
                        <FaArrowsRotate className={loading ? 'animate-spin' : ''} />
                        <span>Refresh</span>
                    </button>
                </div>

                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-green-500/20 rounded-xl">
                                <FaMoneyBillWave className="text-green-400 text-xl" />
                            </div>
                            <span className="text-sm text-gray-400">Last 30 days</span>
                        </div>
                        <h3 className="text-sm font-semibold text-gray-400 mb-1">Estimated Revenue</h3>
                        <p className="text-3xl font-bold text-white">
                            {formatCurrency(overview?.stats.estimatedMonthlyRevenue || 0)}
                        </p>
                    </div>

                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-purple-500/20 rounded-xl">
                                <FaChartPie className="text-purple-400 text-xl" />
                            </div>
                            <span className="text-lg font-bold text-white">
                                {overview?.stats.paidChapters || 0}
                            </span>
                        </div>
                        <h3 className="text-sm font-semibold text-gray-400 mb-1">Paid Chapters</h3>
                        <p className="text-xs text-gray-500">
                            Avg price {formatCurrency(overview?.stats.averageChapterPrice || 0)}
                        </p>
                    </div>

                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-blue-500/20 rounded-xl">
                                <FaChartLine className="text-blue-400 text-xl" />
                            </div>
                            <span className="text-lg font-bold text-white">
                                {overview?.stats.activePlans || 0}
                            </span>
                        </div>
                        <h3 className="text-sm font-semibold text-gray-400 mb-1">Active Plans</h3>
                        <p className="text-xs text-gray-500">
                            {overview?.stats.inactivePlans || 0} inactive
                        </p>
                    </div>

                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-amber-500/20 rounded-xl">
                                <FaCoins className="text-amber-400 text-xl" />
                            </div>
                            <span className="text-lg font-bold text-white">
                                {overview?.stats.donationRevenue30d
                                    ? formatCurrency(overview.stats.donationRevenue30d)
                                    : formatCurrency(0)}
                            </span>
                        </div>
                        <h3 className="text-sm font-semibold text-gray-400 mb-1">
                            Donations (30d)
                        </h3>
                        <p className="text-xs text-gray-500">Coffee & tip jar</p>
                    </div>
                </div>

                {/* Revenue Breakdown */}
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                    <h2 className="text-xl font-bold text-white mb-4">Revenue Breakdown</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            {
                                label: 'Donations',
                                value: overview?.revenueBreakdown.donations || 0,
                                color: 'text-green-400'
                            },
                            {
                                label: 'Subscriptions',
                                value: overview?.revenueBreakdown.subscriptions || 0,
                                color: 'text-blue-400'
                            },
                            {
                                label: 'Coins / Paywalls',
                                value: overview?.revenueBreakdown.coins || 0,
                                color: 'text-amber-400'
                            }
                        ].map((item) => (
                            <div
                                key={item.label}
                                className="bg-slate-900/40 rounded-xl p-4 border border-slate-700/40"
                            >
                                <h3 className="text-sm text-gray-400">{item.label}</h3>
                                <p className={`text-2xl font-bold ${item.color}`}>
                                    {formatCurrency(item.value)}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Plan creation */}
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                        <FaPlus />
                        <span>Create New Plan</span>
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-400 mb-2">
                                Plan Name
                            </label>
                            <input
                                type="text"
                                value={planForm.name}
                                onChange={(e) =>
                                    setPlanForm((prev) => ({ ...prev, name: e.target.value }))
                                }
                                placeholder="e.g. Super Supporter"
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-400 mb-2">
                                Price (INR)
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={planForm.price}
                                onChange={(e) =>
                                    setPlanForm((prev) => ({ ...prev, price: e.target.value }))
                                }
                                placeholder="e.g. 99"
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-400 mb-2">
                                Billing Interval
                            </label>
                            <select
                                value={planForm.interval}
                                onChange={(e) =>
                                    setPlanForm((prev) => ({
                                        ...prev,
                                        interval: e.target.value as MonetizationPlan['interval']
                                    }))
                                }
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                            >
                                <option value="monthly">Monthly</option>
                                <option value="quarterly">Quarterly</option>
                                <option value="yearly">Yearly</option>
                                <option value="one-time">One-time</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-400 mb-2">
                                Plan Type
                            </label>
                            <select
                                value={planForm.type}
                                onChange={(e) =>
                                    setPlanForm((prev) => ({
                                        ...prev,
                                        type: e.target.value as MonetizationPlan['type']
                                    }))
                                }
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                            >
                                <option value="subscription">Subscription</option>
                                <option value="one-time">One-time Support</option>
                                <option value="coins">Coin Pack</option>
                            </select>
                        </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-400 mb-2">
                                Description
                            </label>
                            <textarea
                                value={planForm.description}
                                onChange={(e) =>
                                    setPlanForm((prev) => ({
                                        ...prev,
                                        description: e.target.value
                                    }))
                                }
                                rows={3}
                                placeholder="Tell your supporters what they get"
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 resize-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-400 mb-2">
                                Perks (comma separated)
                            </label>
                            <textarea
                                value={planForm.perks}
                                onChange={(e) =>
                                    setPlanForm((prev) => ({
                                        ...prev,
                                        perks: e.target.value
                                    }))
                                }
                                rows={3}
                                placeholder="Early access, HD downloads, private Discord…"
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 resize-none"
                            />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={handleCreatePlan}
                            disabled={savingPlan}
                            className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all disabled:from-gray-700 disabled:to-gray-600 disabled:cursor-not-allowed"
                        >
                            {savingPlan ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                    <span>Saving…</span>
                                </>
                            ) : (
                                <>
                                    <FaPlus />
                                    <span>Create Plan</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Plans List */}
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                        <div>
                            <h2 className="text-xl font-bold text-white">Active Plans</h2>
                            <p className="text-gray-400 text-sm">
                                View, pause, or remove monetization options
                            </p>
                        </div>
                        {plansLoading && (
                            <div className="flex items-center space-x-2 text-gray-400">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500" />
                                <span>Loading plans…</span>
                            </div>
                        )}
                    </div>

                    {plans.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <FaChartSimple className="text-5xl text-purple-400 mx-auto mb-4" />
                            <p>No monetization plans yet. Create one to get started!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {plans.map((plan) => (
                                <motion.div
                                    key={plan._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-slate-900/40 border border-slate-700/50 rounded-xl p-5 flex flex-col space-y-4"
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                                                <span>{plan.name}</span>
                                                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-purple-500/20 text-purple-200">
                                                    {PLAN_TYPE_LABEL[plan.type]}
                                                </span>
                                            </h3>
                                            <p className="text-sm text-gray-400 mt-1">
                                                {plan.description || 'No description provided.'}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xl font-bold text-white">
                                                {formatCurrency(plan.price)}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {PLAN_INTERVAL_LABEL[plan.interval]}
                                            </p>
                                        </div>
                                    </div>

                                    {plan.perks && plan.perks.length > 0 && (
                                        <div>
                                            <h4 className="text-xs font-semibold text-gray-400 mb-2">
                                                Perks
                                            </h4>
                                            <ul className="grid grid-cols-1 gap-2 text-sm text-gray-300">
                                                {plan.perks.map((perk) => (
                                                    <li
                                                        key={perk}
                                                        className="px-3 py-2 bg-slate-800/60 rounded-lg border border-slate-700/40"
                                                    >
                                                        {perk}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between text-sm text-gray-400">
                                        <span>
                                            {plan.subscriberCount || 0} subscriber
                                            {plan.subscriberCount === 1 ? '' : 's'}
                                        </span>
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => handleTogglePlan(plan)}
                                                className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors"
                                            >
                                                {plan.isActive ? (
                                                    <FaToggleOn className="text-green-400" />
                                                ) : (
                                                    <FaToggleOff className="text-gray-400" />
                                                )}
                                                <span>{plan.isActive ? 'Active' : 'Paused'}</span>
                                            </button>
                                            <button
                                                onClick={() => handleDeletePlan(plan._id)}
                                                disabled={deletingPlanId === plan._id}
                                                className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-red-600/70 hover:bg-red-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {deletingPlanId === plan._id ? (
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                                ) : (
                                                    <FaTrash />
                                                )}
                                                <span>Delete</span>
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}

