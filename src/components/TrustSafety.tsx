'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, AlertTriangle, Flag, Eye, EyeOff, CheckCircle, XCircle, Users, BookOpen, Settings, HelpCircle } from 'lucide-react';

interface ContentWarning {
  id: string;
  type: 'violence' | 'sexual' | 'language' | 'drugs' | 'other';
  label: string;
  description: string;
  severity: 'mild' | 'moderate' | 'severe';
}

interface ReportReason {
  id: string;
  category: 'inappropriate' | 'copyright' | 'spam' | 'harassment' | 'other';
  label: string;
  description: string;
}

interface TrustSafetyProps {
  contentId?: string;
  contentType?: 'manga' | 'chapter' | 'comment' | 'user';
  onReport?: (report: any) => void;
  onContentWarning?: (warning: ContentWarning) => void;
  userAge?: number;
  showContentWarnings?: boolean;
}

const TrustSafety: React.FC<TrustSafetyProps> = ({
  contentId,
  contentType = 'manga',
  onReport,
  onContentWarning,
  userAge = 18,
  showContentWarnings = true
}) => {
  const [showReportModal, setShowReportModal] = useState(false);
  const [showContentWarningModal, setShowContentWarningModal] = useState(false);
  const [showAgeVerification, setShowAgeVerification] = useState(false);
  const [selectedWarning, setSelectedWarning] = useState<ContentWarning | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ageVerified, setAgeVerified] = useState(false);
  const [userAgeInput, setUserAgeInput] = useState('');

  const contentWarnings: ContentWarning[] =
    [
      {
        id: 'violence',
        type: 'violence',
        label: 'Violence',
        description: 'Contains graphic violence, fighting, or bloodshed,',
        severity: 'moderate'
      },
      {
        id: 'sexual',
        type: 'sexual',
        label: 'Sexual Content',
        description: 'Contains nudity, sexual themes, or adult content,',
        severity: 'severe'
      },
      {
        id: 'language',
        type: 'language',
        label: 'Strong Language',
        description: 'Contains profanity or offensive language,',
        severity: 'mild'
      },
      {
        id: 'drugs',
        type: 'drugs',
        label: 'Drug References',
        description: 'Contains references to drugs or substance use,',
        severity: 'moderate'
      }
    ];

  const reportReasons: ReportReason[] =
    [
      {
        id: 'inappropriate',
        category: 'inappropriate',
        label: 'Inappropriate Content',
        description: 'Content violates community guidelines'
      },
      {
        id: 'copyright',
        category: 'copyright',
        label: 'Copyright Violation',
        description: 'Unauthorized use of copyrighted material'
      },
      {
        id: 'spam',
        category: 'spam',
        label: 'Spam or Scam',
        description: 'Unwanted promotional or fraudulent content'
      },
      {
        id: 'harassment',
        category: 'harassment',
        label: 'Harassment or Bullying',
        description: 'Targeted abuse or harmful behavior'
      },
      {
        id: 'other',
        category: 'other',
        label: 'Other',
        description: 'Other concerns not listed above'
      }
    ];

  const handleReport = async () => {
    if (!reportReason) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const report = {
        contentId,
        contentType,
        reason: reportReason,
        details: reportDetails,
        timestamp: new Date().toISOString()
      };

      if (token) {
        const response = await fetch('/api/reports', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(report)
        });

        if (response.ok) {
          setShowReportModal(false);
          setReportReason('');
          setReportDetails('');
          // Show success message
        }
      }
    } catch (error) {
      console.error('Failed to submit report:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAgeVerification = () => {
    const age = parseInt(userAgeInput);
    if (age >= 18) {
      setAgeVerified(true);
      setShowAgeVerification(false);
      localStorage.setItem('ageVerified', 'true');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'severe': return 'text-red-500';
      case 'moderate': return 'text-yellow-50';
      case 'mild': return 'text-blue-500';
      default: return 'text-gray-50';
    }
  };

  const getSeverityBg = (severity: string) => {
    switch (severity) {
      case 'severe': return 'bg-red-500/10 border-red-50/20';
      case 'moderate': return 'bg-yellow-500/10 border-yellow-50/20';
      case 'mild': return 'bg-blue-5010border-blue-500/20';
      default: return 'bg-gray-5010border-gray-500/20';
    }
  };

  return (
    <>
      {/* Report Button */}
      <button
        onClick={() => setShowReportModal(true)}
        className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-red-400 transition-colors"
        title="Report this content"
      >
        <Flag className="w-4 h-4" />   <span className="text-sm">Report</span>
      </button>

      {/* Report Modal */}
      <AnimatePresence>
        {showReportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowReportModal(false)}
          >
            <motion.div
              initial={{ scale: 0.90 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.90 }}
              className="bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
                  <Flag className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Report Content</h3>
                  <p className="text-gray-400 text-sm">Help us keep the community safe</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Reason for Report
                  </label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-700 focus:ring-2 focus:ring-red-500 focus:outline-none"
                  >
                    <option value="">Select a reason</option>
                    {reportReasons.map((reason) => (
                      <option key={reason.id} value={reason.id}>
                        {reason.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Additional Details (Optional)
                  </label>
                  <textarea
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="Please provide more details about your concern..."
                    className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-700 focus:ring-2 focus:ring-red-500 focus:outline-none resize-none"
                    rows={3}
                    maxLength={500}
                  />
                  <div className="text-right text-xs text-gray-500 mt-1">
                    {reportDetails.length}/500
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowReportModal(false)}
                    className="flex-1 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReport}
                    disabled={!reportReason || isSubmitting}
                    className="flex-1 px-4 bg-red-600 hover:bg-red-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      Submit Report                   )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Content Warning Modal */}
      <AnimatePresence>
        {showContentWarningModal && selectedWarning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.90 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.90 }}
              className={`bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border ${getSeverityBg(selectedWarning.severity)}`}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getSeverityBg(selectedWarning.severity)}`}>
                  <AlertTriangle className={`w-5 h-5 ${getSeverityColor(selectedWarning.severity)}`} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Content Warning</h3>
                  <p className="text-gray-400 text-sm">This content may not be suitable for all audiences</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className={`p-4 rounded-lg ${getSeverityBg(selectedWarning.severity)}`}>
                  <h4 className={`font-semibold ${getSeverityColor(selectedWarning.severity)} mb-2`}>
                    {selectedWarning.label}
                  </h4>
                  <p className="text-gray-300 text-sm">
                    {selectedWarning.description}
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowContentWarningModal(false)}
                    className="flex-1 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    Go Back
                  </button>
                  <button
                    onClick={() => {
                      setShowContentWarningModal(false);
                      onContentWarning?.(selectedWarning);
                    }}
                    className="flex-1 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                  >
                    Continue Anyway
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Age Verification Modal */}
      <AnimatePresence>
        {showAgeVerification && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.90 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.90 }}
              className="bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                  <Shield className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Age Verification</h3>
                  <p className="text-gray-400 text-sm">Please confirm your age to continue</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Your Age
                  </label>
                  <input
                    type="number"
                    value={userAgeInput}
                    onChange={(e) => setUserAgeInput(e.target.value)}
                    placeholder="Enter your age"
                    className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    min="13"
                    max="120"
                  />
                </div>

                <div className="text-sm text-gray-400">
                  <p>You must be at least 18 years old to view this content.</p>
                  <p className="mt-1">Age is not stored and is only used for verification.</p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowAgeVerification(false)}
                    className="flex-1 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAgeVerification}
                    disabled={!userAgeInput || parseInt(userAgeInput) < 18}
                    className="flex-1 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    Verify Age
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// Content Warning Component
export const ContentWarningBanner: React.FC<{
  warnings: ContentWarning[];
  onContinue: () => void;
  onBack: () => void;
}> = ({ warnings, onContinue, onBack }) => (
  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
    <div className="flex items-start gap-3">
      <AlertTriangle className="w-5 h-5 text-yellow-50 mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <h4 className="font-semibold text-yellow-400">Content Warnings</h4>
        <div className="space-y-2 mb-4">
          {warnings.map((warning) => (
            <div key={warning.id} className="text-sm text-gray-300">
              • <span className="font-medium">{warning.label}:</span> {warning.description}
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
          >
            Go Back
          </button>
          <button
            onClick={onContinue}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg transition-colors text-sm"
          >
            Continue Anyway
          </button>
        </div>
      </div>
    </div>
  </div>
);

// Community Guidelines Component
export const CommunityGuidelines: React.FC = () => (
  <div className="bg-gray-900 rounded-2xl shadow-xl p-6">
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
        <Users className="w-5 h-5 text-green-400" />      </div>
      <div>
        <h3 className="text-xl font-bold text-white">Community Guidelines</h3>
        <p className="text-gray-400">Help us maintain a positive environment</p>
      </div>
    </div>

    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-gray-800 rounded-lg p-4">
          <h4 className="font-semibold text-green-400 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Do's
          </h4>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Be respectful and kind to others</li>
            <li>• Share constructive feedback</li>
            <li>• Report inappropriate content</li>
            <li>• Follow copyright laws</li>
            <li>• Use appropriate language</li>
          </ul>
        </div>

        <div className="bg-gray-800 rounded-lg p-4">
          <h4 className="font-semibold text-red-400 flex items-center gap-2">
            <XCircle className="w-4 h-4" />
            Donts
          </h4>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Harass or bully other users</li>
            <li>• Share explicit or illegal content</li>
            <li>• Spam or promote scams</li>
            <li>• Violate copyrights</li>
            <li>• Use hate speech</li>
          </ul>
        </div>
      </div>

      <div className="bg-blue-500 border border-blue-500/20 rounded-lg p-4">
        <h4 className="font-semibold text-blue-400 flex items-center gap-2">
          <HelpCircle className="w-4 h-4" />
          Need Help?
        </h4>
        <p className="text-sm text-gray-300">
          If you see content that violates our guidelines, please report it immediately.
          Our moderation team reviews all reports and takes appropriate action.
        </p>
        <button className="text-blue-400 hover:text-blue-300 text-sm font-medium">
          Learn more about our policies →
        </button>
      </div>
    </div>
  </div>
);

export default TrustSafety; 