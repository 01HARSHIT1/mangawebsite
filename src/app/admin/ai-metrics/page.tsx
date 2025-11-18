'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { FaChartLine, FaSearch, FaFilter, FaBrain, FaSpinner, FaSync } from 'react-icons/fa';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface AIMetrics {
    recommendations: {
        precisionAtK: { k: number; value: number }[];
        recallAtK: { k: number; value: number }[];
        ndcg: { k: number; value: number }[];
        hitRate: { k: number; value: number }[];
        coverage: number;
        diversity: number;
        popularityBias: number;
        averagePrecision: number;
        meanReciprocalRank: number;
    };
    semanticSearch: {
        averagePrecision: number;
        meanReciprocalRank: number;
        normalizedDiscountedCumulativeGain: number;
        retrievalAccuracy: number;
        querySuccessRate: number;
        averageRelevanceScore: number;
        topKAccuracy: { k: number; accuracy: number }[];
    };
    personalizedFiltering: {
        filteringPrecision: number;
        filteringRecall: number;
        filteringF1Score: number;
        userSatisfactionRate: number;
        falsePositiveRate: number;
        falseNegativeRate: number;
    };
    featureAdoption: {
        smartRecommendations: { enabled: number; total: number; adoptionRate: number };
        semanticSearch: { enabled: number; total: number; adoptionRate: number };
        personalizedFiltering: { enabled: number; total: number; adoptionRate: number };
        voiceAssistant: { enabled: number; total: number; adoptionRate: number };
        eyeTracking: { enabled: number; total: number; adoptionRate: number };
        autoBrightness: { enabled: number; total: number; adoptionRate: number };
        overallAdoptionRate: number;
    };
    overallAccuracy: number;
    timestamp: Date;
}

export default function AIMetricsPage() {
    const { isAuthenticated, user } = useAuth();
    const router = useRouter();
    const [metrics, setMetrics] = useState<AIMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mode, setMode] = useState<'real' | 'simulated'>('simulated'); // Default to simulated
    const [modeNote, setModeNote] = useState<string>('');

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }

        if (user?.role !== 'admin') {
            router.push('/admin/dashboard');
            return;
        }

        loadMetrics();
    }, [isAuthenticated, user, router, mode]);

    const loadMetrics = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const response = await fetch(`/api/ai/metrics?mode=${mode}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });

            if (response.ok) {
                const data = await response.json();
                setMetrics(data.metrics);
                setModeNote(data.note || '');
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to load metrics');
            }
        } catch (err) {
            setError('Failed to load metrics');
            console.error('Error loading metrics:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadMetrics();
        setRefreshing(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pt-24 pb-12">
                <div className="container mx-auto px-4 max-w-7xl">
                    <div className="flex items-center justify-center h-64">
                        <FaSpinner className="animate-spin text-4xl text-white" />
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pt-24 pb-12">
                <div className="container mx-auto px-4 max-w-7xl">
                    <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 text-red-300">
                        {error}
                    </div>
                </div>
            </div>
        );
    }

    if (!metrics) {
        return null;
    }

    // Prepare chart data
    const precisionData = metrics.recommendations.precisionAtK.map(m => ({
        k: `P@${m.k}`,
        value: parseFloat((m.value * 100).toFixed(2))
    }));

    const recallData = metrics.recommendations.recallAtK.map(m => ({
        k: `R@${m.k}`,
        value: parseFloat((m.value * 100).toFixed(2))
    }));

    const combinedPrecisionRecall = [
        ...metrics.recommendations.precisionAtK.map(m => ({
            k: `P@${m.k}`,
            precision: parseFloat((m.value * 100).toFixed(2)),
            recall: 0
        })),
        ...metrics.recommendations.recallAtK.map(m => ({
            k: `R@${m.k}`,
            precision: 0,
            recall: parseFloat((m.value * 100).toFixed(2))
        }))
    ];

    const ndcgData = metrics.recommendations.ndcg.map(m => ({
        k: `NDCG@${m.k}`,
        value: parseFloat((m.value * 100).toFixed(2))
    }));

    const hitRateData = metrics.recommendations.hitRate.map(m => ({
        k: `HR@${m.k}`,
        value: parseFloat((m.value * 100).toFixed(2))
    }));

    const combinedNDCGHitRate = metrics.recommendations.ndcg.map((ndcg, index) => ({
        k: `@${ndcg.k}`,
        ndcg: parseFloat((ndcg.value * 100).toFixed(2)),
        hitRate: parseFloat((metrics.recommendations.hitRate[index].value * 100).toFixed(2))
    }));

    const searchTopKData = metrics.semanticSearch.topKAccuracy.map(m => ({
        k: `Top-${m.k}`,
        accuracy: (m.accuracy * 100).toFixed(2)
    }));

    const filteringRadarData = [
        { metric: 'Precision', value: metrics.personalizedFiltering.filteringPrecision * 100 },
        { metric: 'Recall', value: metrics.personalizedFiltering.filteringRecall * 100 },
        { metric: 'F1-Score', value: metrics.personalizedFiltering.filteringF1Score * 100 },
        { metric: 'Satisfaction', value: metrics.personalizedFiltering.userSatisfactionRate * 100 }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pt-24 pb-12">
            <div className="container mx-auto px-4 max-w-7xl">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                            <FaBrain className="text-purple-400" />
                            AI Features Metrics Dashboard
                        </h1>
                        <p className="text-gray-400">Deep Learning Performance Metrics & Accuracy Analysis</p>
                        {metrics.timestamp && (
                            <p className="text-sm text-gray-500 mt-2">
                                Last updated: {new Date(metrics.timestamp).toLocaleString()}
                            </p>
                        )}
                        {modeNote && (
                            <div className={`mt-2 p-2 rounded-lg text-sm ${
                                mode === 'simulated' 
                                    ? 'bg-yellow-500/20 border border-yellow-500/50 text-yellow-300'
                                    : 'bg-blue-500/20 border border-blue-500/50 text-blue-300'
                            }`}>
                                {modeNote}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Mode Toggle */}
                        <div className="flex items-center gap-2 bg-slate-700/50 rounded-lg p-1">
                            <button
                                onClick={() => setMode('simulated')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                    mode === 'simulated'
                                        ? 'bg-yellow-600 text-white'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                Simulated
                            </button>
                            <button
                                onClick={() => setMode('real')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                    mode === 'real'
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                Real Data
                            </button>
                        </div>
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                            <FaSync className={refreshing ? 'animate-spin' : ''} />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Overall Accuracy */}
                <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6 mb-6">
                    <h2 className="text-2xl font-bold text-white mb-4">Overall System Accuracy</h2>
                    <div className="flex items-center gap-4">
                        <div className="text-6xl font-bold text-purple-400">
                            {(metrics.overallAccuracy * 100).toFixed(2)}%
                        </div>
                        <div className="flex-1">
                            <div className="w-full bg-slate-700 rounded-full h-4">
                                <div
                                    className="bg-gradient-to-r from-purple-500 to-indigo-500 h-4 rounded-full transition-all"
                                    style={{ width: `${metrics.overallAccuracy * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recommendation Metrics */}
                <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6 mb-6">
                    <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                        <FaChartLine className="text-blue-400" />
                        Recommendation System Metrics
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <MetricCard
                            title="Average Precision"
                            value={(metrics.recommendations.averagePrecision * 100).toFixed(2)}
                            unit="%"
                            color="blue"
                        />
                        <MetricCard
                            title="Mean Reciprocal Rank"
                            value={metrics.recommendations.meanReciprocalRank.toFixed(4)}
                            color="green"
                        />
                        <MetricCard
                            title="Coverage"
                            value={metrics.recommendations.coverage.toFixed(2)}
                            unit="%"
                            color="purple"
                        />
                        <MetricCard
                            title="Diversity"
                            value={(metrics.recommendations.diversity * 100).toFixed(2)}
                            unit="%"
                            color="orange"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-3">Precision@K & Recall@K</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={metrics.recommendations.precisionAtK.map((p, i) => ({
                                    k: `K=${p.k}`,
                                    Precision: parseFloat((p.value * 100).toFixed(2)),
                                    Recall: parseFloat((metrics.recommendations.recallAtK[i].value * 100).toFixed(2))
                                }))}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis dataKey="k" stroke="#9CA3AF" />
                                    <YAxis stroke="#9CA3AF" />
                                    <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} />
                                    <Legend />
                                    <Bar dataKey="Precision" fill="#3B82F6" />
                                    <Bar dataKey="Recall" fill="#10B981" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-3">NDCG@K & Hit Rate@K</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={metrics.recommendations.ndcg.map((n, i) => ({
                                    k: `K=${n.k}`,
                                    NDCG: parseFloat((n.value * 100).toFixed(2)),
                                    'Hit Rate': parseFloat((metrics.recommendations.hitRate[i].value * 100).toFixed(2))
                                }))}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis dataKey="k" stroke="#9CA3AF" />
                                    <YAxis stroke="#9CA3AF" />
                                    <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} />
                                    <Legend />
                                    <Line type="monotone" dataKey="NDCG" stroke="#8B5CF6" strokeWidth={2} />
                                    <Line type="monotone" dataKey="Hit Rate" stroke="#F59E0B" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-slate-700/50 rounded-lg p-4">
                            <div className="text-sm text-gray-400 mb-1">Popularity Bias</div>
                            <div className="text-2xl font-bold text-white">
                                {metrics.recommendations.popularityBias.toFixed(3)}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                                {metrics.recommendations.popularityBias > 1 ? 'High bias' : 'Low bias'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Semantic Search Metrics */}
                <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6 mb-6">
                    <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                        <FaSearch className="text-green-400" />
                        Semantic Search Metrics
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <MetricCard
                            title="Average Precision"
                            value={(metrics.semanticSearch.averagePrecision * 100).toFixed(2)}
                            unit="%"
                            color="green"
                        />
                        <MetricCard
                            title="MRR"
                            value={metrics.semanticSearch.meanReciprocalRank.toFixed(4)}
                            color="blue"
                        />
                        <MetricCard
                            title="Retrieval Accuracy"
                            value={(metrics.semanticSearch.retrievalAccuracy * 100).toFixed(2)}
                            unit="%"
                            color="purple"
                        />
                        <MetricCard
                            title="Query Success Rate"
                            value={(metrics.semanticSearch.querySuccessRate * 100).toFixed(2)}
                            unit="%"
                            color="orange"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-3">Top-K Accuracy</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={metrics.semanticSearch.topKAccuracy.map(m => ({
                                    k: `Top-${m.k}`,
                                    accuracy: parseFloat((m.accuracy * 100).toFixed(2))
                                }))}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis dataKey="k" stroke="#9CA3AF" />
                                    <YAxis stroke="#9CA3AF" />
                                    <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} />
                                    <Bar dataKey="accuracy" fill="#10B981" name="Accuracy %" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="bg-slate-700/50 rounded-lg p-4">
                            <h3 className="text-lg font-semibold text-white mb-3">Additional Metrics</h3>
                            <div className="space-y-3">
                                <div>
                                    <div className="text-sm text-gray-400 mb-1">NDCG</div>
                                    <div className="text-xl font-bold text-white">
                                        {metrics.semanticSearch.normalizedDiscountedCumulativeGain.toFixed(4)}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-400 mb-1">Average Relevance Score</div>
                                    <div className="text-xl font-bold text-white">
                                        {(metrics.semanticSearch.averageRelevanceScore * 100).toFixed(2)}%
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Feature Adoption Metrics */}
                <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6 mb-6">
                    <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                        <FaBrain className="text-yellow-400" />
                        AI Features Adoption & Usage
                    </h2>
                    
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-400">Overall Adoption Rate</span>
                            <span className="text-2xl font-bold text-yellow-400">
                                {metrics.featureAdoption.overallAdoptionRate.toFixed(2)}%
                            </span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-3">
                            <div
                                className="bg-gradient-to-r from-yellow-500 to-orange-500 h-3 rounded-full transition-all"
                                style={{ width: `${metrics.featureAdoption.overallAdoptionRate}%` }}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <AdoptionCard
                            title="Smart Recommendations"
                            enabled={metrics.featureAdoption.smartRecommendations.enabled}
                            total={metrics.featureAdoption.smartRecommendations.total}
                            adoptionRate={metrics.featureAdoption.smartRecommendations.adoptionRate}
                            color="blue"
                        />
                        <AdoptionCard
                            title="Semantic Search"
                            enabled={metrics.featureAdoption.semanticSearch.enabled}
                            total={metrics.featureAdoption.semanticSearch.total}
                            adoptionRate={metrics.featureAdoption.semanticSearch.adoptionRate}
                            color="green"
                        />
                        <AdoptionCard
                            title="Personalized Filtering"
                            enabled={metrics.featureAdoption.personalizedFiltering.enabled}
                            total={metrics.featureAdoption.personalizedFiltering.total}
                            adoptionRate={metrics.featureAdoption.personalizedFiltering.adoptionRate}
                            color="purple"
                        />
                        <AdoptionCard
                            title="Voice Assistant"
                            enabled={metrics.featureAdoption.voiceAssistant.enabled}
                            total={metrics.featureAdoption.voiceAssistant.total}
                            adoptionRate={metrics.featureAdoption.voiceAssistant.adoptionRate}
                            color="red"
                        />
                        <AdoptionCard
                            title="Eye Tracking"
                            enabled={metrics.featureAdoption.eyeTracking.enabled}
                            total={metrics.featureAdoption.eyeTracking.total}
                            adoptionRate={metrics.featureAdoption.eyeTracking.adoptionRate}
                            color="orange"
                        />
                        <AdoptionCard
                            title="Auto Brightness"
                            enabled={metrics.featureAdoption.autoBrightness.enabled}
                            total={metrics.featureAdoption.autoBrightness.total}
                            adoptionRate={metrics.featureAdoption.autoBrightness.adoptionRate}
                            color="yellow"
                        />
                    </div>
                </div>

                {/* Personalized Filtering Metrics */}
                <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
                    <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                        <FaFilter className="text-red-400" />
                        Personalized Filtering Metrics
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                        <MetricCard
                            title="Precision"
                            value={(metrics.personalizedFiltering.filteringPrecision * 100).toFixed(2)}
                            unit="%"
                            color="red"
                        />
                        <MetricCard
                            title="Recall"
                            value={(metrics.personalizedFiltering.filteringRecall * 100).toFixed(2)}
                            unit="%"
                            color="orange"
                        />
                        <MetricCard
                            title="F1-Score"
                            value={(metrics.personalizedFiltering.filteringF1Score * 100).toFixed(2)}
                            unit="%"
                            color="purple"
                        />
                        <MetricCard
                            title="User Satisfaction"
                            value={(metrics.personalizedFiltering.userSatisfactionRate * 100).toFixed(2)}
                            unit="%"
                            color="green"
                        />
                        <MetricCard
                            title="False Positive Rate"
                            value={(metrics.personalizedFiltering.falsePositiveRate * 100).toFixed(2)}
                            unit="%"
                            color="yellow"
                        />
                        <MetricCard
                            title="False Negative Rate"
                            value={(metrics.personalizedFiltering.falseNegativeRate * 100).toFixed(2)}
                            unit="%"
                            color="pink"
                        />
                    </div>

                    <div className="mt-6">
                        <h3 className="text-lg font-semibold text-white mb-3">Performance Radar Chart</h3>
                        <ResponsiveContainer width="100%" height={400}>
                            <RadarChart data={filteringRadarData}>
                                <PolarGrid stroke="#374151" />
                                <PolarAngleAxis dataKey="metric" stroke="#9CA3AF" />
                                <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#9CA3AF" />
                                <Radar
                                    name="Filtering Performance"
                                    dataKey="value"
                                    stroke="#EF4444"
                                    fill="#EF4444"
                                    fillOpacity={0.6}
                                />
                                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MetricCard({ title, value, unit = '', color = 'blue' }: { title: string; value: string; unit?: string; color?: string }) {
    const colorClasses = {
        blue: 'bg-blue-500/20 border-blue-500 text-blue-400',
        green: 'bg-green-500/20 border-green-500 text-green-400',
        purple: 'bg-purple-500/20 border-purple-500 text-purple-400',
        orange: 'bg-orange-500/20 border-orange-500 text-orange-400',
        red: 'bg-red-500/20 border-red-500 text-red-400',
        yellow: 'bg-yellow-500/20 border-yellow-500 text-yellow-400',
        pink: 'bg-pink-500/20 border-pink-500 text-pink-400'
    };

    return (
        <div className={`bg-slate-700/50 rounded-lg p-4 border ${colorClasses[color as keyof typeof colorClasses] || colorClasses.blue}`}>
            <div className="text-sm text-gray-400 mb-1">{title}</div>
            <div className="text-3xl font-bold">
                {value}{unit}
            </div>
        </div>
    );
}

function AdoptionCard({ title, enabled, total, adoptionRate, color = 'blue' }: { 
    title: string; 
    enabled: number; 
    total: number; 
    adoptionRate: number; 
    color?: string 
}) {
    const colorClasses = {
        blue: { border: 'border-blue-500', bg: 'bg-blue-500' },
        green: { border: 'border-green-500', bg: 'bg-green-500' },
        purple: { border: 'border-purple-500', bg: 'bg-purple-500' },
        orange: { border: 'border-orange-500', bg: 'bg-orange-500' },
        red: { border: 'border-red-500', bg: 'bg-red-500' },
        yellow: { border: 'border-yellow-500', bg: 'bg-yellow-500' }
    };

    const colors = colorClasses[color as keyof typeof colorClasses] || colorClasses.blue;

    return (
        <div className={`bg-slate-700/50 rounded-lg p-4 border ${colors.border}`}>
            <div className="text-sm text-gray-400 mb-2">{title}</div>
            <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold text-white">{adoptionRate.toFixed(1)}%</span>
                <span className="text-sm text-gray-400">{enabled} / {total}</span>
            </div>
            <div className="w-full bg-slate-600 rounded-full h-2">
                <div
                    className={`${colors.bg} h-2 rounded-full transition-all`}
                    style={{ width: `${adoptionRate}%` }}
                />
            </div>
        </div>
    );
}

