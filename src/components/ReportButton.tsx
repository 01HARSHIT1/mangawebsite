"use client";
import { useState } from 'react';
import { FaFlag } from 'react-icons/fa';

interface ReportButtonProps {
    targetId: string;
    targetType: 'manga' | 'chapter' | 'user' | 'comment';
    className?: string;
}

export default function ReportButton({ targetId, targetType, className = '' }: ReportButtonProps) {
    const [showModal, setShowModal] = useState(false);
    const [reason, setReason] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const reasons = [
        'Inappropriate content',
        'Copyright violation',
        'Spam',
        'Harassment',
        'Violence',
        'Other'
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reason) return;

        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
            alert('You must be logged in to report content');
            setLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/admin/reports', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    type: reason,
                    targetId,
                    targetType,
                    reason,
                    description
                })
            });

            if (res.ok) {
                setSuccess(true);
                setTimeout(() => {
                    setShowModal(false);
                    setSuccess(false);
                    setReason('');
                    setDescription('');
                }, 2000);
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to submit report');
            }
        } catch (error) {
            alert('Failed to submit report');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className={`flex items-center text-gray-400 hover:text-red-400 transition ${className}`}
                title="Report this content"
            >
                <FaFlag className="mr-1" />
                Report
            </button>

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold mb-4">Report Content</h3>

                        {success ? (
                            <div className="text-center py-4">
                                <div className="text-green-400 text-lg mb-2">✓</div>
                                <p>Report submitted successfully!</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Reason for report</label>
                                    <select
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        className="w-full bg-gray-700 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                        required
                                    >
                                        <option value="">Select a reason</option>
                                        {reasons.map((r) => (
                                            <option key={r} value={r}>{r}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Additional details (optional)</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full bg-gray-700 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                        rows={3}
                                        placeholder="Please provide any additional context..."
                                    />
                                </div>

                                <div className="flex space-x-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading || !reason}
                                        className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 disabled:bg-gray-600 text-white rounded transition"
                                    >
                                        {loading ? 'Submitting...' : 'Submit Report'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </>
    );
} 