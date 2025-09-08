"use client";
import { useState, useEffect } from 'react';
import { FaTachometerAlt, FaClock, FaDatabase, FaMemory, FaNetworkWired, FaChartLine } from 'react-icons/fa';
import { motion } from 'framer-motion';

interface PerformanceDashboardProps {
    isVisible?: boolean;
    onClose?: () => void;
}

export default function PerformanceDashboard({ isVisible = false, onClose }: PerformanceDashboardProps) {
    const [metrics, setMetrics] = useState<any>(null);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        if (!isVisible) return;

        const updateMetrics = () => {
            // Mock metrics for now since performance monitor doesn't exist
            const mockMetrics = {
                summary: {
                    pageLoadTime: 1200,
                    apiResponseTime: 150,
                    memoryUsage: 45.2,
                    cpuUsage: 12.8
                },
                slowestApiCalls: [
                    { endpoint: '/api/manga', time: 250 },
                    { endpoint: '/api/chapters', time: 180 }
                ],
                recentMetrics: [
                    { timestamp: Date.now(), value: 1200 },
                    { timestamp: Date.now() - 1000, value: 1100 }
                ]
            };

            setMetrics(mockMetrics);
        };

        // Update metrics immediately
        updateMetrics();

        // Update metrics every 5 seconds
        const interval = setInterval(updateMetrics, 5000);

        return () => clearInterval(interval);
    }, [isVisible]);

    if (!isVisible || !metrics) return null;

    const formatTime = (ms: number) => {
        if (ms < 1000) return `${ms.toFixed(0)}ms`;
        return `${(ms / 1000).toFixed(2)}s`;
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
    };

    const getPerformanceColor = (value: number, threshold: number) => {
        if (value <= threshold * 0.7) return 'text-green-400';
        if (value <= threshold) return 'text-yellow-400';
        return 'text-red-400';
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-4 right-4 bg-gray-900 rounded-lg shadow-xl border border-gray-700 z-50 ${isExpanded ? 'w-96 h-96' : 'w-64 h-64'}`}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <div className="flex items-center gap-2">
                    <FaTachometerAlt className="text-blue-400" />
                    <h3 className="text-white font-semibold">Performance</h3>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-gray-400 hover:text-white"
                        title={isExpanded ? 'Collapse' : 'Expand'}
                    >
                        {isExpanded ? '−' : '+'}
                    </button>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white"
                            title="Close"
                        >
                            ×
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4 overflow-y-auto h-full">
                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-800 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                            <FaClock className="text-blue-400" />
                            <span className="text-sm text-gray-400">Page Load</span>
                        </div>
                        <div className={`text-lg font-bold ${getPerformanceColor(metrics.summary.pageLoadTime, 3000)}`}>
                            {formatTime(metrics.summary.pageLoadTime)}
                        </div>
                    </div>

                    <div className="bg-gray-800 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                            <FaDatabase className="text-green-400" />
                            <span className="text-sm text-gray-400">API Response</span>
                        </div>
                        <div className={`text-lg font-bold ${getPerformanceColor(metrics.summary.apiResponseTime, 500)}`}>
                            {formatTime(metrics.summary.apiResponseTime)}
                        </div>
                    </div>
                </div>

                {/* Performance Chart */}
                <div className="bg-gray-800 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-3">
                        <FaChartLine className="text-purple-400" />
                        <span className="text-sm text-gray-400">Recent Performance</span>
                    </div>
                    <div className="space-y-2">
                        {metrics.recentMetrics.slice(-5).map((metric: any, index: number) => (
                            <div key={index} className="flex justify-between text-sm">
                                <span className="text-gray-300">
                                    {new Date(metric.timestamp).toLocaleTimeString()}
                                </span>
                                <span className={getPerformanceColor(metric.value, 3000)}>
                                    {formatTime(metric.value)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
} 