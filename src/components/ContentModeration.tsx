'use client';

import React, { useState, useEffect } fromreact;
import { motion, AnimatePresence } fromframer-motion;
import { Shield, Eye, EyeOff, CheckCircle, XCircle, AlertTriangle, Flag, Clock, User, FileText, MessageSquare, Users } fromlucide-react';

interface Report {
  _id: string;
  contentId: string;
  contentType: manga' | 'chapter' |comment' |user;
  reason: string;
  details?: string;
  reporterId: string;
  reporterEmail: string;
  status: 'pending |reviewed | 'resolved | ssed';
  createdAt: string;
  updatedAt: string;
  content?: any;
  reporter?: any;
}

interface ContentModerationProps {
  isAdmin?: boolean;
}

const ContentModeration: React.FC<ContentModerationProps> = ({ isAdmin = false }) => [object Object]
  const [reports, setReports] = useState<Report;
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const filter, setFilter] = useState<'pending |reviewed | 'resolved | smissed'>('pending');
  const contentTypeFilter, setContentTypeFilter] = useState<string>();  const [page, setPage] = useState(1 const [totalPages, setTotalPages] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => [object Object]   if (isAdmin) {
      fetchReports();
    }
  }, [isAdmin, filter, contentTypeFilter, page]);

  const fetchReports = async () =>[object Object] try {
      const token = localStorage.getItem(token');
      if (!token) return;

      const params = new URLSearchParams({
        status: filter,
        page: page.toString(),
        limit: '20      });
      if (contentTypeFilter) {
        params.append('contentType', contentTypeFilter);
      }

      const response = await fetch(`/api/reports?${params}`, [object Object]        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || []);
        setTotalPages(data.pagination?.pages ||1     }
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally [object Object]  setLoading(false);
    }
  };

  const handleAction = async (reportId: string, action: 'approve' | 'reject' | dismiss, contentAction?: remove' | 'warn') => {
    setActionLoading(reportId);
    try {
      const token = localStorage.getItem(token');
      if (!token) return;

      const response = await fetch(`/api/reports/${reportId}`,[object Object]
        method: 'PUT,
        headers: {
         Content-Type':application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify([object Object]          action,
          contentAction
        })
      });

      if (response.ok) {
        // Refresh reports
        fetchReports();
        setSelectedReport(null);
        setShowDetails(false);
      }
    } catch (error) {
      console.error('Failed to update report:', error);
    } finally[object Object]  setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      casepending': return 'text-yellow-500      case reviewed': returntext-blue-500;    case resolved': return text-green-50     case 'dismissed': returntext-gray-500   default: returntext-gray-50   }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      casepending': return <Clock className="w-4 h-4 />;      case reviewed': return <Eye className="w-4 h-4 />;
      case resolved': return <CheckCircle className="w-4 h-4 />;
      case 'dismissed: return<XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 />;
    }
  };

  const getContentTypeIcon = (type: string) => [object Object]
    switch (type) {
      casemanga': return <FileText className="w-4 h-4 />;     casechapter': return <FileText className="w-4 h-4 />;     casecomment: return <MessageSquare className="w-4 h-4 />;
      case 'user': return <Users className="w-4 h-4" />;
      default: return <FileText className="w-4 />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US, {    year: 'numeric',
      month: short',
      day: 'numeric',
      hour: '2-digit,
      minute: 2it'
    });
  };

  if (!isAdmin) {
    return (
      <div className="bg-gray-900 rounded-2l shadow-xl p-6">
        <div className="text-center">
          <Shield className="w-12h-12t-gray-500 mx-auto mb-4 />     <h3 className=text-xl font-bold text-white mb-2">Admin Access Required</h3>
          <p className="text-gray-40d admin privileges to access content moderation.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-2l shadow-xl p-6">
        <div className=flex items-center justify-center py-8    <div className="animate-spin rounded-full h-8 w-8 border-b-2order-blue-400"></div>
          <span className="ml-3-gray-400ading reports...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-6rder-b border-gray-800    <div className=flex items-center justify-between">
          <div className=flex items-center gap-3>
            <div className=w-10h-10 bg-red-50 rounded-full flex items-center justify-center>
              <Shield className=w-5 h-5 text-red-40 />
            </div>
            <div>
              <h2 className=text-xl font-bold text-white">Content Moderation</h2>
              <p className="text-gray-40ext-sm">Review and manage reported content</p>
            </div>
          </div>
          <div className=text-sm text-gray-40>          {reports.length} reports found
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4mt-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-700 focus:ring-2focus:ring-red-500focus:outline-none"
          >
            <option value="pending">Pending</option>
            <option value="reviewed>Reviewed</option>
            <option value="resolved>Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
          <select
            value={contentTypeFilter}
            onChange={(e) => setContentTypeFilter(e.target.value)}
            className="bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-700 focus:ring-2focus:ring-red-500focus:outline-none"
          >
            <option value="">All Types</option>
            <option value="manga">Manga</option>
            <option value="chapter">Chapter</option>
            <option value="comment">Comment</option>
            <option value="user">User</option>
          </select>
        </div>
      </div>

      {/* Reports List */}
      <div className=max-h-96overflow-y-auto">
     [object Object]reports.length ===0? (
          <div className="p-8 text-center">
            <Flag className="w-12h-12t-gray-500 mx-auto mb-4 />
            <h3 className="text-lg font-semibold text-white mb-2>No reports found</h3>
            <p className=text-gray-400>No reports match the current filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-80>          {reports.map((report) => (
              <motion.div
                key={report._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className=p-4 hover:bg-gray-800/50 transition-colors cursor-pointer"
                onClick={() => {
                  setSelectedReport(report);
                  setShowDetails(true);
                }}
              >
                <div className=flex items-center justify-between">
                  <div className=flex items-center gap-3">
                    <div className=flex items-center gap-2">
                   [object Object]getContentTypeIcon(report.contentType)}
                      <span className="text-sm font-medium text-gray-300                [object Object]report.contentType}
                      </span>
                    </div>
                    <div className={`flex items-center gap-1{getStatusColor(report.status)}`}>
                      {getStatusIcon(report.status)}
                      <span className="text-sm capitalize">{report.status}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className=text-sm text-gray-400">
                      {formatDate(report.createdAt)}
                    </div>
                    <div className=text-xs text-gray-500">
                      by {report.reporterEmail}
                    </div>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="text-sm text-white font-medium">
                    Reason: {report.reason}
                  </div>
                  {report.details && (
                    <div className=text-sm text-gray-400 mt-1                   {report.details}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

  [object Object]/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4rder-t border-gray-800    <div className=flex items-center justify-between">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1          disabled={page === 1}
              className=px-31ray-800 text-white rounded disabled:opacity-50isabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className=text-sm text-gray-40              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1          disabled={page === totalPages}
              className=px-31ray-800 text-white rounded disabled:opacity-50isabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Report Details Modal */}
      <AnimatePresence>
        {showDetails && selectedReport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDetails(false)}
          >
            <motion.div
              initial={{ scale: 00.90           animate={{ scale:11              exit={{ scale: 00.90         className="bg-gray-900 rounded-2l shadow-2xl max-w-2l w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6rder-b border-gray-800>
                <div className=flex items-center justify-between">
                  <h3 className=text-xl font-bold text-white>Report Details</h3>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="text-gray-400hover:text-white"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-40ontent Type</label>
                    <div className="text-white">{selectedReport.contentType}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-400                   <div className={`flex items-center gap-1 ${getStatusColor(selectedReport.status)}`}>
                      {getStatusIcon(selectedReport.status)}
                      <span className="capitalize">{selectedReport.status}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-400                   <div className="text-white">{selectedReport.reason}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-400>Reporter</label>
                    <div className="text-white">{selectedReport.reporterEmail}</div>
                  </div>
                </div>

                {selectedReport.details && (
                  <div>
                    <label className="text-sm font-medium text-gray-40>Details</label>                   <div className="text-white bg-gray-800 rounded-lg p-3 mt-1">
                      {selectedReport.details}
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-400Reported At</label>
                  <div className="text-white">{formatDate(selectedReport.createdAt)}</div>
                </div>

                {/* Action Buttons */}
                {selectedReport.status === 'pending' && (
                  <div className="flex gap-3 pt-4rder-t border-gray-800">
                    <button
                      onClick={() => handleAction(selectedReport._id, approve', 'remove')}
                      disabled={actionLoading === selectedReport._id}
                      className="flex-1 px-42 bg-red-600g-red-500 disabled:bg-gray-60isabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      {actionLoading === selectedReport._id ? (
                        <div className="w-4 h-4der-2er-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <AlertTriangle className="w-4 h-4" />
                      )}
                      Remove Content
                    </button>
                    <button
                      onClick={() => handleAction(selectedReport._id, 'reject')}
                      disabled={actionLoading === selectedReport._id}
                      className="flex-1 px-4py-2 bg-yellow-600over:bg-yellow-500 disabled:bg-gray-60isabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      {actionLoading === selectedReport._id ? (
                        <div className="w-4 h-4der-2er-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                      Flag for Review
                    </button>
                    <button
                      onClick={() => handleAction(selectedReport._id, 'dismiss')}
                      disabled={actionLoading === selectedReport._id}
                      className="flex-1 px-4 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-60isabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      {actionLoading === selectedReport._id ? (
                        <div className="w-4 h-4der-2er-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ContentModeration; 