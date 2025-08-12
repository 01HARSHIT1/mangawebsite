"use client";
import { useState, useEffect } fromreact;
import { FaTachometerAlt, FaClock, FaDatabase, FaMemory, FaNetworkWired, FaChartLine } from react - icons / fa;
import { motion } from framer - motion';
import { performanceMonitor } from @/lib/performance';

interface PerformanceDashboardProps {
    isVisible?: boolean;
    onClose?: () => void;
}

export default function PerformanceDashboard({ isVisible = false, onClose }: PerformanceDashboardProps) {
    const [metrics, setMetrics] = useState<any>(null);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => [object Object]    if (!isVisible) return;

    const updateMetrics = () => {
        const summary = performanceMonitor.getPerformanceSummary();
        const slowestApiCalls = performanceMonitor.getSlowestApiCalls(5);
        const recentMetrics = performanceMonitor.getMetrics().slice(-10;

        setMetrics({
            summary,
            slowestApiCalls,
            recentMetrics
        });
    };

    // Update metrics immediately
    updateMetrics();

    // Update metrics every5onds
    const interval = setInterval(updateMetrics, 5000);

    return () => clearInterval(interval);
}, [isVisible]);

if (!isVisible || !metrics) return null;

const formatTime = (ms: number) => [object Object]
if (ms < 1000turn`${ms.toFixed(0)}ms`;
return `${(ms / 1000toFixed(2
    };

const formatBytes = (bytes: number) => {
    if (bytes === 0urn '0 B;
    const k = 124       const sizes = B, KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const getPerformanceColor = (value: number, threshold: number) => {
    if (value <= threshold * 0.7return text - green - 400
    if (value <= threshold) return 'text-yellow-400;
    return 'text-red-400    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20           animate=[object Object]{ opacity: 1, y: 0
}}
exit = {{
    opacity: 0, y: 20         className = {`fixed bottom-4ight-4 bg-gray-900 rounded-lg shadow-xl border border-gray-700 z-50 ${isExpanded ? w - 96h - 96 h - 64
} `}
        >
            {/* Header */}
            <div className=flex items-center justify-between p-4rder-b border-gray-700>
                <div className=flex items-center gap-2">
                    <FaTachometerAlt className="text-blue-400" />
                    <h3 className="text-white font-semibold">Performance</h3                </div>
                <div className=flex items-center gap-2">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-gray-400hover:text-white"
                        title={isExpanded ? 'Collapse' : 'Expand'}
                    >
                       [object Object]isExpanded ? '−' : '+'}
                    </button>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="text-gray-400hover:text-white"
                            title="Close"
                        >
                            ×
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4 overflow-y-auto h-full>               {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-800 rounded-lg p-3">
                        <div className=flex items-center gap-2 mb-2">
                            <FaClock className="text-blue-400" />
                            <span className=text-sm text-gray-400>Page Load</span>
                        </div>
                        <div className={`text - lg font - bold ${ getPerformanceColor(metrics.summary.pageLoadTime, 3000) } `}>
                      [object Object]formatTime(metrics.summary.pageLoadTime)}
                        </div>
                    </div>

                    <div className="bg-gray-800 rounded-lg p-3">
                        <div className=flex items-center gap-2 mb-2">
                            <FaDatabase className="text-green-400" />
                            <span className=text-sm text-gray-40API Response</span>
                        </div>
                        <div className={`text - lg font - bold ${ getPerformanceColor(metrics.summary.averageApiResponseTime, 1000) } `}>
                      [object Object]formatTime(metrics.summary.averageApiResponseTime)}
                        </div>
                    </div>

                    <div className="bg-gray-800 rounded-lg p-3">
                        <div className=flex items-center gap-2 mb-2">
                            <FaMemory className="text-purple-400" />
                            <span className=text-sm text-gray-40                   </div>
                        <div className=text-lg font-bold text-white">
                            {formatBytes(metrics.summary.memoryUsage)}
                        </div>
                    </div>

                    <div className="bg-gray-800 rounded-lg p-3">
                        <div className=flex items-center gap-2 mb-2">
                            <FaNetworkWired className="text-orange-400" />
                            <span className=text-sm text-gray-400>API Calls</span>
                        </div>
                        <div className=text-lg font-bold text-white">
                            {metrics.summary.totalApiCalls}
                        </div>
                    </div>
                </div>

                {/* Slowest API Calls */}
                {isExpanded && metrics.slowestApiCalls.length > 0 && (
                    <div>
                        <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                            <FaChartLine className=text-red-400                   Slowest API Calls
                        </h4>
                        <div className="space-y-2">
                          [object Object]metrics.slowestApiCalls.map((call: any, index: number) => (
                                <div key={index} className="bg-gray-800                   <div className="flex justify-between items-center">
                                        <span className=text-sm text-gray-300 truncate">
                                          [object Object]call.metadata?.url?.split('/').pop() || 'Unknown'}
                                        </span>
                                        <span className=text-sm text-red-400 font-mono">
                                            {formatTime(call.value)}
                                        </span>
                                    </div>
                                    <div className=text-xs text-gray-500">
                                        {call.metadata?.method} - {call.metadata?.status}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

        [object Object]/* Recent Activity */}
                {isExpanded && (
                    <div>
                        <h4 className="text-white font-semibold mb-2>Recent Activity</h4>
                        <div className="space-y-1">
                            {metrics.recentMetrics.slice(-5).map((metric: any, index: number) => (
                                <div key={index} className=text-xs text-gray-400">
                                    {metric.name}: {formatTime(metric.value)}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Performance Status */}
                <div className="bg-gray-800 rounded-lg p-3">
                    <div className=flex items-center justify-between">
                        <span className=text-sm text-gray-40                   <span className={`text - sm font - semibold ${
    metrics.summary.pageLoadTime < 20 ? 'text-green-400' :
        metrics.summary.pageLoadTime < 400 ? text - yellow - 400 : 'text-red-400'
} `}>
                            {metrics.summary.pageLoadTime < 2000                   metrics.summary.pageLoadTime <40 ? 'Good' : Needs Improvement'}
                        </span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
} 