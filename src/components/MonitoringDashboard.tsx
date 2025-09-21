'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Activity, Clock, TrendingUp, TrendingDown, Users, Server, Wifi, RefreshCw, Eye, EyeOff, BarChart3, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface ErrorStats {
  today: {
    total: number;
    categories: Record<string, number>;
    severities: Record<string, number>;
  };
  weekly: {
    total: number;
    critical: number;
    breakdown: any[];
  };
}

interface PerformanceStats {
  today: {
    totalSessions: number;
    grades: Record<string, number>;
    scores: number;
  };
  weekly: {
    totalSessions: number;
    averageScore: number;
    gradeCounts: Record<string, number>;
    breakdown: any[];
  };
}

interface SystemHealth {
  database: 'healthy' | 'warning' | 'error';
  api: 'healthy' | 'warning' | 'error';
  storage: 'healthy' | 'warning' | 'error';
  lastChecked: string;
}

const MonitoringDashboard: React.FC = () => {
  const [errorStats, setErrorStats] = useState<ErrorStats | null>(null);
  const [performanceStats, setPerformanceStats] = useState<PerformanceStats | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [recentErrors, setRecentErrors] = useState<any>([]);
  const [recentPerformance, setRecentPerformance] = useState<any>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(3000); // 30 seconds

  useEffect(() => {
    fetchMonitoringData();

    if (autoRefresh) {
      const interval = setInterval(fetchMonitoringData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const fetchMonitoringData = async () => {
    try {
      setIsLoading(true);

      // Fetch all monitoring data in parallel
      const [errorStatsRes, performanceStatsRes, recentErrorsRes, recentPerformanceRes, systemHealthRes] = await Promise.all([
        fetch('/api/errors'),
        fetch('/api/performance'),
        fetch('/api/errors?limit=10'),
        fetch('/api/performance?limit=10'),
        fetch('/api/admin/system-health')
      ]);

      if (errorStatsRes.ok) {
        const errorData = await errorStatsRes.json();
        setErrorStats(errorData.stats);
        setRecentErrors(errorData.errors || []);
      }

      if (performanceStatsRes.ok) {
        const performanceData = await performanceStatsRes.json();
        setPerformanceStats(performanceData.stats);
        setRecentPerformance(performanceData.logs || []);
      }

      if (systemHealthRes.ok) {
        const healthData = await systemHealthRes.json();
        setSystemHealth(healthData);
      }
    } catch (error) {
      console.error('Failed to fetch monitoring data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-500" />; case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-500 bg-green-50'; case 'warning':
        return 'text-yellow-500 bg-yellow-50';
      case 'error':
        return 'text-red-500 bg-red-50'; default:
        return 'text-gray-500 bg-gray-50';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getPerformanceGradeColor = (grade: string) => {
    switch (grade) {
      case 'A':
        return 'text-green-600 bg-green-10';
      case 'B':
        return 'text-blue-600 bg-blue-10';
      case 'C':
        return 'text-yellow-600 bg-yellow-10';
      case 'D':
        return 'text-orange-600 bg-orange-10';
      case 'F':
        return 'text-red-600 bg-red-10';
      default:
        return 'text-gray-600 bg-gray-10';
    }
  };

  if (isLoading && !errorStats) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-96 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">System Monitoring</h1>
            <p className="text-gray-600">Real-time system health and performance monitoring</p>
          </div>
          <div className="flex items-center gap-4 mt-0">
            <button
              onClick={fetchMonitoringData}
              disabled={isLoading}
              className="focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 transition-transform duration-150 hover:scale-105 focus:scale-105 flex items-center gap-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 transition-transform duration-150 hover:scale-105 focus:scale-105 flex items-center gap-2 px-4 rounded-lg transition-colors ${
                autoRefresh 
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-600 hover:bg-gray-700 text-white'              }"
            >
              {autoRefresh ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              Auto Refresh
            </button>
          </div>
        </div>

        {/* System Health Overview */}
        {systemHealth && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          >
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Database</h3>
                {getHealthIcon(systemHealth.database)}
              </div>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getHealthColor(systemHealth.database)}`}>
                {systemHealth.database.charAt(0).toUpperCase() + systemHealth.database.slice(1)}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">API</h3>
                {getHealthIcon(systemHealth.api)}
              </div>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getHealthColor(systemHealth.api)}`}>
                {systemHealth.api.charAt(0).toUpperCase() + systemHealth.api.slice(1)}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Storage</h3>
                {getHealthIcon(systemHealth.storage)}
              </div>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getHealthColor(systemHealth.storage)}`}>
                {systemHealth.storage.charAt(0).toUpperCase() + systemHealth.storage.slice(1)}
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">         {/* Error Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-red-100">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <span className="text-sm text-gray-500">Errors</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">            {errorStats?.today.total || 0}
            </h3>
            <p className="text-gray-600">Errors</p>
            {errorStats?.today.total > 0 && (
              <div className="mt-2 text-sm text-red-600">
                {errorStats.today.severities?.critical || 0} critical
              </div>
            )}
          </motion.div>

          {/* Performance Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-100">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-sm text-gray-500">Performance</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">     {performanceStats?.today.totalSessions || 0}
            </h3>
            <p className="text-gray-600">Sessions</p>
            {performanceStats?.today.totalSessions > 0 && (
              <div className="mt-2 text-sm text-blue-600">               Avg: {Math.round(performanceStats.today.scores.reduce((a, b) => a + b, 0) / performanceStats.today.scores.length) || 0}/100             </div>
            )}
          </motion.div>

          {/* Weekly Errors */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-orange-100">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <span className="text-sm text-gray-500">This Week</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">       {errorStats?.weekly.total || 0}
            </h3>
            <p className="text-gray-600">Total Errors</p>
            {errorStats?.weekly.critical > 0 && (
              <div className="mt-2 text-sm text-orange-600">
                {errorStats.weekly.critical} critical
              </div>
            )}
          </motion.div>

          {/* Weekly Performance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-100">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-sm text-gray-500">This Week</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">     {performanceStats?.weekly.averageScore || 0}
            </h3>
            <p className="text-gray-600">Average Score</p>
            {performanceStats?.weekly.totalSessions > 0 && (
              <div className="mt-2 text-sm text-green-600">
                {performanceStats.weekly.totalSessions} sessions
              </div>
            )}
          </motion.div>
        </div>

        {/* Detailed Views */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">        {/* Recent Errors */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-lg shadow"
          >
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Recent Errors</h3>
            </div>
            <div className="p-6">
              {recentErrors.length > 0 ? (
                <div className="space-y-4">
                  {recentErrors.map((error, index) => (
                    <div key={index} className="border-l-4 border-red-500 pl-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900">{error.message}</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${error.severity === 'critical' ? 'bg-red-100 text-red-800' :
                          error.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                            error.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                          }`}>
                          {error.severity}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">{error.url}</div>
                      <div className="text-xs text-gray-500">{formatTimestamp(error.timestamp)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                  <p>No errors in the last 24 hours</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Recent Performance */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-lg shadow"
          >
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Recent Performance</h3>
            </div>
            <div className="p-6">
              {recentPerformance.length > 0 ? (
                <div className="space-y-4">
                  {recentPerformance.map((perf, index) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900">{perf.url}</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getPerformanceGradeColor(perf.performanceGrade)}`}>
                          {perf.performanceGrade}
                        </span>
                      </div>
                      <div className="text-sm mb-1">
                        Score: {perf.performanceScore}/100
                      </div>
                      <div className="text-xs text-gray-500">{formatTimestamp(perf.timestamp)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <Activity className="w-12 h-12 mx-auto mb-4 text-blue-500" />
                  <p>No performance data available</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Performance Grade Distribution */}
        {performanceStats?.weekly.gradeCounts && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mt-8 bg-white rounded-lg shadow p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance Grade Distribution (This Week)</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(performanceStats.weekly.gradeCounts).map(([grade, count]) => (
                <div key={grade} className="text-center">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2 text-2xl font-bold ${getPerformanceGradeColor(grade)}`}>
                    {grade}
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    <div className="text-sm text-gray-600">{count}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MonitoringDashboard; 