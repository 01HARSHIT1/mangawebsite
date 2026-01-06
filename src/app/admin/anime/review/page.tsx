'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
    FaCheck, FaTimes, FaEdit, FaEye, FaClock, FaVideo, 
    FaVolumeUp, FaClosedCaptioning, FaExclamationTriangle,
    FaCalendarAlt, FaPlay, FaPause, FaExpand
} from 'react-icons/fa';

interface Episode {
    _id: string;
    episodeNumber: number;
    seasonNumber: number;
    title: string;
    description?: string;
    videoUrl: string;
    thumbnail?: string;
    duration?: number;
    audioTracks: Array<{
        language: string;
        languageCode: string;
        isDefault?: boolean;
    }>;
    subtitles: Array<{
        language: string;
        languageCode: string;
        format: string;
        isDefault?: boolean;
    }>;
    validation?: {
        isValid: boolean;
        warnings: string[];
        errors: string[];
        detectedAudioCount: number;
        declaredAudioCount: number;
    };
    videoAnalysis?: {
        audioStreams: Array<{
            language?: string;
            codec: string;
            channels: number;
        }>;
        subtitleStreams: Array<{
            language?: string;
            codec: string;
        }>;
    };
    series: {
        _id: string;
        title: string;
        coverImage: string;
        ageRating?: string;
        status: string;
    } | null;
    moderationStatus: string;
    createdAt: string;
}

export default function AnimeReviewPage() {
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();
    const [episodes, setEpisodes] = useState<Episode[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('pending_review');
    const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
    const [previewMode, setPreviewMode] = useState<'thumbnail' | 'preview' | 'full'>('thumbnail');
    const [isPlaying, setIsPlaying] = useState(false);
    const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | 'request_changes' | null>(null);
    const [reviewReason, setReviewReason] = useState('');
    const [scheduledPublishTime, setScheduledPublishTime] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (!isAuthenticated || user?.role !== 'admin') {
            router.push('/admin/login');
            return;
        }
        fetchReviewQueue();
    }, [isAuthenticated, user, statusFilter, router]);

    const fetchReviewQueue = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const response = await fetch(`/api/admin/anime/review?status=${statusFilter}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setEpisodes(data.episodes || []);
            }
        } catch (error) {
            console.error('Error fetching review queue:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleReview = async () => {
        if (!selectedEpisode || !reviewAction) return;

        try {
            setSubmitting(true);
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const response = await fetch('/api/admin/anime/review', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    episodeId: selectedEpisode._id,
                    action: reviewAction,
                    reason: reviewReason,
                    scheduledPublishTime: scheduledPublishTime || null,
                })
            });

            if (response.ok) {
                await fetchReviewQueue();
                setSelectedEpisode(null);
                setReviewAction(null);
                setReviewReason('');
                setScheduledPublishTime('');
                alert('Review submitted successfully');
            } else {
                const error = await response.json();
                alert(`Error: ${error.error}`);
            }
        } catch (error) {
            console.error('Error submitting review:', error);
            alert('Failed to submit review');
        } finally {
            setSubmitting(false);
        }
    };

    const formatDuration = (seconds?: number) => {
        if (!seconds) return 'N/A';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (!isAuthenticated || user?.role !== 'admin') {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold mb-2">Episode Review Queue</h1>
                    <p className="text-gray-400">Review and moderate anime episodes before publication</p>
                </div>

                {/* Status Filter */}
                <div className="flex gap-4 mb-6">
                    {['pending_review', 'approved', 'rejected', 'pending_changes'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                                statusFilter === status
                                    ? 'bg-orange-600 text-white'
                                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                            }`}
                        >
                            {status.replace('_', ' ').toUpperCase()}
                        </button>
                    ))}
                </div>

                {/* Episodes List */}
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                    </div>
                ) : episodes.length === 0 ? (
                    <div className="text-center py-20 bg-gray-900 rounded-lg">
                        <FaVideo className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400 text-lg">No episodes in {statusFilter.replace('_', ' ')} queue</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Episodes List */}
                        <div className="space-y-4">
                            {episodes.map((episode) => (
                                <div
                                    key={episode._id}
                                    onClick={() => setSelectedEpisode(episode)}
                                    className={`p-4 bg-gray-900 rounded-lg cursor-pointer transition-all ${
                                        selectedEpisode?._id === episode._id
                                            ? 'ring-2 ring-orange-500 bg-gray-800'
                                            : 'hover:bg-gray-800'
                                    }`}
                                >
                                    <div className="flex gap-4">
                                        <img
                                            src={episode.thumbnail || episode.series?.coverImage || '/placeholder.jpg'}
                                            alt={episode.title}
                                            className="w-24 h-32 object-cover rounded"
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <h3 className="font-bold text-lg">{episode.title}</h3>
                                                    <p className="text-sm text-gray-400">
                                                        {episode.series?.title} • Episode {episode.episodeNumber}
                                                    </p>
                                                </div>
                                                <span className={`px-2 py-1 rounded text-xs ${
                                                    episode.moderationStatus === 'approved' ? 'bg-green-600' :
                                                    episode.moderationStatus === 'rejected' ? 'bg-red-600' :
                                                    'bg-yellow-600'
                                                }`}>
                                                    {episode.moderationStatus}
                                                </span>
                                            </div>
                                            
                                            {/* Quick Info */}
                                            <div className="flex flex-wrap gap-4 text-sm text-gray-400 mt-2">
                                                <span><FaVideo className="inline mr-1" />{formatDuration(episode.duration)}</span>
                                                {episode.audioTracks.length > 0 && (
                                                    <span><FaVolumeUp className="inline mr-1" />{episode.audioTracks.length} audio</span>
                                                )}
                                                {episode.subtitles.length > 0 && (
                                                    <span><FaClosedCaptioning className="inline mr-1" />{episode.subtitles.length} subtitles</span>
                                                )}
                                                {episode.validation?.warnings?.length > 0 && (
                                                    <span className="text-yellow-400">
                                                        <FaExclamationTriangle className="inline mr-1" />
                                                        {episode.validation.warnings.length} warnings
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Review Panel */}
                        {selectedEpisode && (
                            <div className="bg-gray-900 rounded-lg p-6 sticky top-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h2 className="text-2xl font-bold">{selectedEpisode.title}</h2>
                                        <p className="text-gray-400">{selectedEpisode.series?.title}</p>
                                    </div>
                                    <button
                                        onClick={() => setSelectedEpisode(null)}
                                        className="text-gray-400 hover:text-white"
                                    >
                                        <FaTimes className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Preview Mode Selector */}
                                <div className="flex gap-2 mb-4">
                                    <button
                                        onClick={() => setPreviewMode('thumbnail')}
                                        className={`px-3 py-1 rounded text-sm ${
                                            previewMode === 'thumbnail' ? 'bg-orange-600' : 'bg-gray-800'
                                        }`}
                                    >
                                        Thumbnail
                                    </button>
                                    <button
                                        onClick={() => setPreviewMode('preview')}
                                        className={`px-3 py-1 rounded text-sm ${
                                            previewMode === 'preview' ? 'bg-orange-600' : 'bg-gray-800'
                                        }`}
                                    >
                                        30s Preview
                                    </button>
                                    <button
                                        onClick={() => setPreviewMode('full')}
                                        className={`px-3 py-1 rounded text-sm ${
                                            previewMode === 'full' ? 'bg-orange-600' : 'bg-gray-800'
                                        }`}
                                    >
                                        Full Playback
                                    </button>
                                </div>

                                {/* Video Preview */}
                                <div className="mb-6 bg-black rounded-lg overflow-hidden">
                                    {previewMode === 'thumbnail' ? (
                                        <div className="relative aspect-video">
                                            <img
                                                src={selectedEpisode.thumbnail || selectedEpisode.series?.coverImage || '/placeholder.jpg'}
                                                alt={selectedEpisode.title}
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                                <button
                                                    onClick={() => setPreviewMode('preview')}
                                                    className="p-4 bg-orange-600 rounded-full hover:bg-orange-700 transition-colors"
                                                >
                                                    <FaPlay className="w-6 h-6 text-white" />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="relative aspect-video">
                                            <video
                                                ref={videoRef}
                                                src={selectedEpisode.videoUrl}
                                                controls
                                                className="w-full h-full"
                                                onPlay={() => setIsPlaying(true)}
                                                onPause={() => setIsPlaying(false)}
                                            />
                                            {previewMode === 'preview' && (
                                                <div className="absolute top-2 right-2 bg-yellow-600 px-2 py-1 rounded text-xs">
                                                    Preview Mode (30s limit)
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Episode Details */}
                                <div className="space-y-4 mb-6">
                                    {/* Audio Tracks */}
                                    {selectedEpisode.audioTracks.length > 0 && (
                                        <div>
                                            <h3 className="font-semibold mb-2 flex items-center">
                                                <FaVolumeUp className="mr-2" />
                                                Audio Tracks ({selectedEpisode.audioTracks.length})
                                            </h3>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedEpisode.audioTracks.map((track, idx) => (
                                                    <span
                                                        key={idx}
                                                        className={`px-2 py-1 rounded text-sm ${
                                                            track.isDefault ? 'bg-orange-600' : 'bg-gray-800'
                                                        }`}
                                                    >
                                                        {track.language} {track.isDefault && '(Default)'}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Subtitles */}
                                    {selectedEpisode.subtitles.length > 0 && (
                                        <div>
                                            <h3 className="font-semibold mb-2 flex items-center">
                                                <FaClosedCaptioning className="mr-2" />
                                                Subtitles ({selectedEpisode.subtitles.length})
                                            </h3>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedEpisode.subtitles.map((sub, idx) => (
                                                    <span
                                                        key={idx}
                                                        className={`px-2 py-1 rounded text-sm ${
                                                            sub.isDefault ? 'bg-orange-600' : 'bg-gray-800'
                                                        }`}
                                                    >
                                                        {sub.language} ({sub.format.toUpperCase()}) {sub.isDefault && '(Default)'}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Validation Warnings/Errors */}
                                    {selectedEpisode.validation && (
                                        <div>
                                            <h3 className="font-semibold mb-2">Validation Status</h3>
                                            {selectedEpisode.validation.errors.length > 0 && (
                                                <div className="mb-2 p-2 bg-red-900/50 rounded text-sm">
                                                    <p className="font-semibold text-red-400 mb-1">Errors:</p>
                                                    <ul className="list-disc list-inside text-red-300">
                                                        {selectedEpisode.validation.errors.map((err, idx) => (
                                                            <li key={idx}>{err}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                            {selectedEpisode.validation.warnings.length > 0 && (
                                                <div className="p-2 bg-yellow-900/50 rounded text-sm">
                                                    <p className="font-semibold text-yellow-400 mb-1">Warnings:</p>
                                                    <ul className="list-disc list-inside text-yellow-300">
                                                        {selectedEpisode.validation.warnings.map((warn, idx) => (
                                                            <li key={idx}>{warn}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Age Rating */}
                                    {selectedEpisode.series?.ageRating && (
                                        <div>
                                            <h3 className="font-semibold mb-2">Age Rating</h3>
                                            <span className="px-2 py-1 bg-gray-800 rounded">
                                                {selectedEpisode.series.ageRating}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Review Actions */}
                                <div className="space-y-4 border-t border-gray-700 pt-4">
                                    <div>
                                        <label className="block text-sm font-semibold mb-2">Action</label>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setReviewAction('approve')}
                                                className={`flex-1 px-4 py-2 rounded font-semibold transition-colors ${
                                                    reviewAction === 'approve'
                                                        ? 'bg-green-600 text-white'
                                                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                                }`}
                                            >
                                                <FaCheck className="inline mr-2" />
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => setReviewAction('reject')}
                                                className={`flex-1 px-4 py-2 rounded font-semibold transition-colors ${
                                                    reviewAction === 'reject'
                                                        ? 'bg-red-600 text-white'
                                                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                                }`}
                                            >
                                                <FaTimes className="inline mr-2" />
                                                Reject
                                            </button>
                                            <button
                                                onClick={() => setReviewAction('request_changes')}
                                                className={`flex-1 px-4 py-2 rounded font-semibold transition-colors ${
                                                    reviewAction === 'request_changes'
                                                        ? 'bg-yellow-600 text-white'
                                                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                                }`}
                                            >
                                                <FaEdit className="inline mr-2" />
                                                Request Changes
                                            </button>
                                        </div>
                                    </div>

                                    {reviewAction === 'approve' && (
                                        <div>
                                            <label className="block text-sm font-semibold mb-2">
                                                <FaCalendarAlt className="inline mr-2" />
                                                Schedule Publish (Optional)
                                            </label>
                                            <input
                                                type="datetime-local"
                                                value={scheduledPublishTime}
                                                onChange={(e) => setScheduledPublishTime(e.target.value)}
                                                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                                            />
                                            <p className="text-xs text-gray-400 mt-1">
                                                Leave empty to publish immediately
                                            </p>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-semibold mb-2">Reason/Comments</label>
                                        <textarea
                                            value={reviewReason}
                                            onChange={(e) => setReviewReason(e.target.value)}
                                            rows={3}
                                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                                            placeholder="Add review comments or reason for decision..."
                                        />
                                    </div>

                                    <button
                                        onClick={handleReview}
                                        disabled={!reviewAction || submitting}
                                        className="w-full px-4 py-3 bg-orange-600 hover:bg-orange-700 rounded font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {submitting ? 'Submitting...' : 'Submit Review'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

