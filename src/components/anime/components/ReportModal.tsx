'use client';

import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    targetType: string;
    targetId: string;
    targetName?: string;
    onSuccess?: () => void;
}

const REPORT_REASONS = {
    copyright_infringement: 'Copyright Infringement',
    nsfw_sexual_content: 'NSFW / Sexual Content',
    violence_gore: 'Violence / Gore',
    hate_speech: 'Hate Speech',
    harassment_bullying: 'Harassment / Bullying',
    spam_scam: 'Spam / Scam',
    misinformation: 'Misinformation',
    audio_subtitle_mismatch: 'Audio/Subtitles Mismatch',
    spoilers: 'Spoilers',
    other: 'Other',
} as const;

export default function ReportModal({
    isOpen,
    onClose,
    targetType,
    targetId,
    targetName,
    onSuccess,
}: ReportModalProps) {
    const [selectedReason, setSelectedReason] = useState<string>('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!selectedReason) {
            setError('Please select a reason');
            return;
        }

        if (selectedReason === 'other' && !description.trim()) {
            setError('Please provide a description for "Other" reason');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            if (!token) {
                setError('Please sign in to submit a report');
                setIsSubmitting(false);
                return;
            }

            const response = await fetch('/api/anime/reports', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    targetType,
                    targetId,
                    reason: selectedReason,
                    description: description.trim() || null,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Failed to submit report');
                setIsSubmitting(false);
                return;
            }

            // Success
            if (onSuccess) {
                onSuccess();
            }
            onClose();
            
            // Show success message
            alert('Thank you for helping keep the community safe. Your report has been submitted.');
            
            // Reset form
            setSelectedReason('');
            setDescription('');
        } catch (error) {
            console.error('Error submitting report:', error);
            setError('Failed to submit report. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-gray-900 rounded-lg p-6 max-w-md w-full"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-orange-500" />
                            <h3 className="text-xl font-bold">Report Content</h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {targetName && (
                        <p className="text-gray-400 text-sm mb-4">
                            Reporting: <span className="text-white font-semibold">{targetName}</span>
                        </p>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold mb-2">
                                Reason for Report <span className="text-red-500">*</span>
                            </label>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {Object.entries(REPORT_REASONS).map(([key, label]) => (
                                    <label
                                        key={key}
                                        className="flex items-center gap-2 p-2 rounded hover:bg-gray-800 cursor-pointer"
                                    >
                                        <input
                                            type="radio"
                                            name="reason"
                                            value={key}
                                            checked={selectedReason === key}
                                            onChange={(e) => setSelectedReason(e.target.value)}
                                            className="w-4 h-4 text-orange-600"
                                        />
                                        <span className="text-sm">{label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold mb-2">
                                Additional Details
                                {selectedReason === 'other' && (
                                    <span className="text-red-500"> *</span>
                                )}
                                <span className="text-gray-400 text-xs ml-2">
                                    ({description.length}/300)
                                </span>
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => {
                                    if (e.target.value.length <= 300) {
                                        setDescription(e.target.value);
                                    }
                                }}
                                placeholder={
                                    selectedReason === 'other'
                                        ? 'Please provide details about the issue...'
                                        : 'Optional: Provide additional context...'
                                }
                                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white resize-none"
                                rows={4}
                            />
                        </div>

                        {error && (
                            <div className="bg-red-900/30 border border-red-700 rounded px-3 py-2 text-sm text-red-400">
                                {error}
                            </div>
                        )}

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting || !selectedReason}
                                className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit Report'}
                            </button>
                            <button
                                onClick={onClose}
                                disabled={isSubmitting}
                                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded transition-colors"
                            >
                                Cancel
                            </button>
                        </div>

                        <p className="text-xs text-gray-500 text-center">
                            Your report will be reviewed by our moderation team. False reports may result in account restrictions.
                        </p>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

