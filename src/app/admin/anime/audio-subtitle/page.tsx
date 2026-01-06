'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
    FaVolumeUp, FaClosedCaptioning, FaExclamationTriangle, FaCheck, 
    FaTimes, FaEdit, FaEye, FaBan, FaCheckCircle, FaClock, FaLanguage,
    FaVideo, FaSearch, FaFilter
} from 'react-icons/fa';

interface AudioTrack {
    language: string;
    languageCode: string;
    url?: string;
    isDefault?: boolean;
    isDisabled?: boolean;
    disabledReason?: string;
    disabledBy?: string;
    disabledAt?: string;
    adminNotes?: string;
}

interface Subtitle {
    language: string;
    languageCode: string;
    url: string;
    format: 'vtt' | 'srt' | 'ass';
    isDefault?: boolean;
    isDisabled?: boolean;
    disabledReason?: string;
    disabledBy?: string;
    disabledAt?: string;
    hasTimingIssues?: boolean;
    timingIssues?: string;
    isMisleading?: boolean;
    misleadingReason?: string;
    adminNotes?: string;
}

interface Episode {
    _id: string;
    episodeNumber: number;
    seasonNumber: number;
    title: string;
    videoUrl: string;
    thumbnail?: string;
    duration?: number;
    audioTracks: AudioTrack[];
    subtitles: Subtitle[];
    validation: {
        isValid: boolean | null;
        warnings: string[];
        errors: string[];
        detectedAudioCount: number;
        declaredAudioCount: number;
        detectedSubtitleCount: number;
        declaredSubtitleCount: number;
    };
    videoAnalysis: {
        audioStreams: Array<{
            index: number;
            codec: string;
            language?: string;
            channels: number;
        }>;
        subtitleStreams: Array<{
            index: number;
            codec: string;
            language?: string;
        }>;
    } | null;
    series: {
        _id: string;
        title: string;
        coverImage: string;
    } | null;
}

export default function AudioSubtitleValidationPage() {
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();
    const [episodes, setEpisodes] = useState<Episode[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterIssues, setFilterIssues] = useState<'all' | 'warnings' | 'errors' | 'disabled'>('all');
    const [previewSubtitle, setPreviewSubtitle] = useState<{ episodeId: string; subtitleIndex: number } | null>(null);
    const [subtitleContent, setSubtitleContent] = useState<string>('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!isAuthenticated || user?.role !== 'admin') {
            router.push('/admin/login');
            return;
        }
        fetchEpisodes();
    }, [isAuthenticated, user, router]);

    const fetchEpisodes = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const response = await fetch('/api/admin/anime/audio-subtitle', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setEpisodes(data.episodes || []);
            }
        } catch (error) {
            console.error('Error fetching episodes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTrackAction = async (
        episodeId: string,
        trackType: 'audio' | 'subtitle',
        trackIndex: number,
        action: string,
        updates?: any
    ) => {
        try {
            setSubmitting(true);
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const response = await fetch('/api/admin/anime/audio-subtitle', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    episodeId,
                    action,
                    trackType,
                    trackIndex,
                    updates,
                })
            });

            if (response.ok) {
                await fetchEpisodes();
                if (selectedEpisode?._id === episodeId) {
                    const updated = await response.json();
                    // Refresh selected episode
                    const updatedEpisode = episodes.find(e => e._id === episodeId);
                    if (updatedEpisode) {
                        setSelectedEpisode({ ...updatedEpisode, ...updated });
                    }
                }
                alert('Track updated successfully');
            } else {
                const error = await response.json();
                alert(`Error: ${error.error}`);
            }
        } catch (error) {
            console.error('Error updating track:', error);
            alert('Failed to update track');
        } finally {
            setSubmitting(false);
        }
    };

    const previewSubtitleFile = async (episodeId: string, subtitleIndex: number) => {
        const episode = episodes.find(e => e._id === episodeId);
        if (!episode || !episode.subtitles[subtitleIndex]) return;

        const subtitle = episode.subtitles[subtitleIndex];
        if (!subtitle.url) {
            alert('Subtitle URL not available');
            return;
        }

        try {
            const response = await fetch(subtitle.url);
            const content = await response.text();
            setSubtitleContent(content);
            setPreviewSubtitle({ episodeId, subtitleIndex });
        } catch (error) {
            console.error('Error loading subtitle:', error);
            alert('Failed to load subtitle file');
        }
    };

    const filteredEpisodes = episodes.filter(episode => {
        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const matchesTitle = episode.title.toLowerCase().includes(query);
            const matchesSeries = episode.series?.title.toLowerCase().includes(query);
            if (!matchesTitle && !matchesSeries) return false;
        }

        // Issue filter
        if (filterIssues === 'warnings') {
            if (episode.validation.warnings.length === 0) return false;
        } else if (filterIssues === 'errors') {
            if (episode.validation.errors.length === 0) return false;
        } else if (filterIssues === 'disabled') {
            const hasDisabled = episode.audioTracks.some(t => t.isDisabled) || 
                              episode.subtitles.some(s => s.isDisabled);
            if (!hasDisabled) return false;
        }

        return true;
    });

    if (!isAuthenticated || user?.role !== 'admin') {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold mb-2">Audio & Subtitle Validation Panel</h1>
                    <p className="text-gray-400">Manage audio tracks and subtitles, validate language matches, and flag issues</p>
                </div>

                {/* Filters */}
                <div className="flex gap-4 mb-6">
                    <div className="flex-1 relative">
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search episodes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                        />
                    </div>
                    <select
                        value={filterIssues}
                        onChange={(e) => setFilterIssues(e.target.value as any)}
                        className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                    >
                        <option value="all">All Episodes</option>
                        <option value="warnings">With Warnings</option>
                        <option value="errors">With Errors</option>
                        <option value="disabled">With Disabled Tracks</option>
                    </select>
                </div>

                {/* Episodes List */}
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                    </div>
                ) : filteredEpisodes.length === 0 ? (
                    <div className="text-center py-20 bg-gray-900 rounded-lg">
                        <FaVideo className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400 text-lg">No episodes found</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Episodes List */}
                        <div className="space-y-4">
                            {filteredEpisodes.map((episode) => (
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
                                            </div>
                                            
                                            {/* Quick Info */}
                                            <div className="flex flex-wrap gap-4 text-sm text-gray-400 mt-2">
                                                <span className="flex items-center">
                                                    <FaVolumeUp className="mr-1" />
                                                    {episode.audioTracks.length} audio
                                                    {episode.audioTracks.filter(t => t.isDisabled).length > 0 && (
                                                        <span className="ml-1 text-red-400">
                                                            ({episode.audioTracks.filter(t => t.isDisabled).length} disabled)
                                                        </span>
                                                    )}
                                                </span>
                                                <span className="flex items-center">
                                                    <FaClosedCaptioning className="mr-1" />
                                                    {episode.subtitles.length} subtitles
                                                    {episode.subtitles.filter(s => s.isDisabled).length > 0 && (
                                                        <span className="ml-1 text-red-400">
                                                            ({episode.subtitles.filter(s => s.isDisabled).length} disabled)
                                                        </span>
                                                    )}
                                                </span>
                                                {episode.validation.warnings.length > 0 && (
                                                    <span className="text-yellow-400 flex items-center">
                                                        <FaExclamationTriangle className="mr-1" />
                                                        {episode.validation.warnings.length} warnings
                                                    </span>
                                                )}
                                                {episode.validation.errors.length > 0 && (
                                                    <span className="text-red-400 flex items-center">
                                                        <FaTimes className="mr-1" />
                                                        {episode.validation.errors.length} errors
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Validation Panel */}
                        {selectedEpisode && (
                            <div className="bg-gray-900 rounded-lg p-6 sticky top-6 max-h-[calc(100vh-100px)] overflow-y-auto">
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

                                {/* Validation Summary */}
                                <div className="mb-6 p-4 bg-gray-800 rounded-lg">
                                    <h3 className="font-semibold mb-2">Validation Summary</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Detected Audio:</span>
                                            <span>{selectedEpisode.validation.detectedAudioCount}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Declared Audio:</span>
                                            <span>{selectedEpisode.validation.declaredAudioCount}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Detected Subtitles:</span>
                                            <span>{selectedEpisode.validation.detectedSubtitleCount}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Declared Subtitles:</span>
                                            <span>{selectedEpisode.validation.declaredSubtitleCount}</span>
                                        </div>
                                        {selectedEpisode.validation.warnings.length > 0 && (
                                            <div className="mt-2 p-2 bg-yellow-900/50 rounded">
                                                <p className="font-semibold text-yellow-400 mb-1">Warnings:</p>
                                                <ul className="list-disc list-inside text-yellow-300 text-xs">
                                                    {selectedEpisode.validation.warnings.map((warn, idx) => (
                                                        <li key={idx}>{warn}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {selectedEpisode.validation.errors.length > 0 && (
                                            <div className="mt-2 p-2 bg-red-900/50 rounded">
                                                <p className="font-semibold text-red-400 mb-1">Errors:</p>
                                                <ul className="list-disc list-inside text-red-300 text-xs">
                                                    {selectedEpisode.validation.errors.map((err, idx) => (
                                                        <li key={idx}>{err}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Audio Tracks */}
                                <div className="mb-6">
                                    <h3 className="font-semibold mb-3 flex items-center">
                                        <FaVolumeUp className="mr-2" />
                                        Audio Tracks ({selectedEpisode.audioTracks.length})
                                    </h3>
                                    {selectedEpisode.audioTracks.length === 0 ? (
                                        <p className="text-gray-400 text-sm">No audio tracks</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {selectedEpisode.audioTracks.map((track, idx) => (
                                                <div
                                                    key={idx}
                                                    className={`p-3 rounded-lg ${
                                                        track.isDisabled ? 'bg-red-900/30 border border-red-700' :
                                                        track.isDefault ? 'bg-orange-900/30 border border-orange-700' :
                                                        'bg-gray-800 border border-gray-700'
                                                    }`}
                                                >
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <FaLanguage className="text-gray-400" />
                                                                <span className="font-semibold">{track.language}</span>
                                                                <span className="text-xs text-gray-400">({track.languageCode})</span>
                                                                {track.isDefault && (
                                                                    <span className="px-2 py-0.5 bg-orange-600 rounded text-xs">Default</span>
                                                                )}
                                                                {track.isDisabled && (
                                                                    <span className="px-2 py-0.5 bg-red-600 rounded text-xs">Disabled</span>
                                                                )}
                                                            </div>
                                                            {track.disabledReason && (
                                                                <p className="text-xs text-red-400 mt-1">Reason: {track.disabledReason}</p>
                                                            )}
                                                            {track.adminNotes && (
                                                                <p className="text-xs text-gray-400 mt-1">Notes: {track.adminNotes}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2 mt-2">
                                                        {!track.isDefault && (
                                                            <button
                                                                onClick={() => handleTrackAction(selectedEpisode._id, 'audio', idx, 'set_default')}
                                                                disabled={submitting}
                                                                className="px-2 py-1 bg-orange-600 hover:bg-orange-700 rounded text-xs disabled:opacity-50"
                                                            >
                                                                Set Default
                                                            </button>
                                                        )}
                                                        {track.isDisabled ? (
                                                            <button
                                                                onClick={() => handleTrackAction(selectedEpisode._id, 'audio', idx, 'enable')}
                                                                disabled={submitting}
                                                                className="px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs disabled:opacity-50"
                                                            >
                                                                Enable
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleTrackAction(selectedEpisode._id, 'audio', idx, 'disable', { reason: 'Broken track' })}
                                                                disabled={submitting}
                                                                className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs disabled:opacity-50"
                                                            >
                                                                Disable
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Subtitles */}
                                <div className="mb-6">
                                    <h3 className="font-semibold mb-3 flex items-center">
                                        <FaClosedCaptioning className="mr-2" />
                                        Subtitles ({selectedEpisode.subtitles.length})
                                    </h3>
                                    {selectedEpisode.subtitles.length === 0 ? (
                                        <p className="text-gray-400 text-sm">No subtitles</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {selectedEpisode.subtitles.map((sub, idx) => (
                                                <div
                                                    key={idx}
                                                    className={`p-3 rounded-lg ${
                                                        sub.isDisabled ? 'bg-red-900/30 border border-red-700' :
                                                        sub.hasTimingIssues || sub.isMisleading ? 'bg-yellow-900/30 border border-yellow-700' :
                                                        sub.isDefault ? 'bg-orange-900/30 border border-orange-700' :
                                                        'bg-gray-800 border border-gray-700'
                                                    }`}
                                                >
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <FaLanguage className="text-gray-400" />
                                                                <span className="font-semibold">{sub.language}</span>
                                                                <span className="text-xs text-gray-400">({sub.languageCode})</span>
                                                                <span className="text-xs text-gray-400">.{sub.format.toUpperCase()}</span>
                                                                {sub.isDefault && (
                                                                    <span className="px-2 py-0.5 bg-orange-600 rounded text-xs">Default</span>
                                                                )}
                                                                {sub.isDisabled && (
                                                                    <span className="px-2 py-0.5 bg-red-600 rounded text-xs">Disabled</span>
                                                                )}
                                                                {sub.hasTimingIssues && (
                                                                    <span className="px-2 py-0.5 bg-yellow-600 rounded text-xs">Timing Issues</span>
                                                                )}
                                                                {sub.isMisleading && (
                                                                    <span className="px-2 py-0.5 bg-yellow-600 rounded text-xs">Misleading</span>
                                                                )}
                                                            </div>
                                                            {sub.disabledReason && (
                                                                <p className="text-xs text-red-400 mt-1">Disabled: {sub.disabledReason}</p>
                                                            )}
                                                            {sub.timingIssues && (
                                                                <p className="text-xs text-yellow-400 mt-1">Timing: {sub.timingIssues}</p>
                                                            )}
                                                            {sub.misleadingReason && (
                                                                <p className="text-xs text-yellow-400 mt-1">Misleading: {sub.misleadingReason}</p>
                                                            )}
                                                            {sub.adminNotes && (
                                                                <p className="text-xs text-gray-400 mt-1">Notes: {sub.adminNotes}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2 mt-2 flex-wrap">
                                                        <button
                                                            onClick={() => previewSubtitleFile(selectedEpisode._id, idx)}
                                                            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
                                                        >
                                                            <FaEye className="inline mr-1" />
                                                            Preview
                                                        </button>
                                                        {!sub.isDefault && (
                                                            <button
                                                                onClick={() => handleTrackAction(selectedEpisode._id, 'subtitle', idx, 'set_default')}
                                                                disabled={submitting}
                                                                className="px-2 py-1 bg-orange-600 hover:bg-orange-700 rounded text-xs disabled:opacity-50"
                                                            >
                                                                Set Default
                                                            </button>
                                                        )}
                                                        {!sub.hasTimingIssues && (
                                                            <button
                                                                onClick={() => handleTrackAction(selectedEpisode._id, 'subtitle', idx, 'flag_timing', { issues: 'Timing sync issues detected' })}
                                                                disabled={submitting}
                                                                className="px-2 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-xs disabled:opacity-50"
                                                            >
                                                                Flag Timing
                                                            </button>
                                                        )}
                                                        {!sub.isMisleading && (
                                                            <button
                                                                onClick={() => handleTrackAction(selectedEpisode._id, 'subtitle', idx, 'flag_misleading', { reason: 'Misleading translation' })}
                                                                disabled={submitting}
                                                                className="px-2 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-xs disabled:opacity-50"
                                                            >
                                                                Flag Misleading
                                                            </button>
                                                        )}
                                                        {sub.isDisabled ? (
                                                            <button
                                                                onClick={() => handleTrackAction(selectedEpisode._id, 'subtitle', idx, 'enable')}
                                                                disabled={submitting}
                                                                className="px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs disabled:opacity-50"
                                                            >
                                                                Enable
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleTrackAction(selectedEpisode._id, 'subtitle', idx, 'disable', { reason: 'Broken or incorrect subtitles' })}
                                                                disabled={submitting}
                                                                className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs disabled:opacity-50"
                                                            >
                                                                Disable
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Detected Streams (FFmpeg) */}
                                {selectedEpisode.videoAnalysis && (
                                    <div className="mb-6 p-4 bg-gray-800 rounded-lg">
                                        <h3 className="font-semibold mb-3">Detected Streams (FFmpeg)</h3>
                                        <div className="space-y-2 text-sm">
                                            <div>
                                                <p className="text-gray-400 mb-1">Audio Streams:</p>
                                                {selectedEpisode.videoAnalysis.audioStreams.length > 0 ? (
                                                    <ul className="list-disc list-inside text-gray-300">
                                                        {selectedEpisode.videoAnalysis.audioStreams.map((stream, idx) => (
                                                            <li key={idx}>
                                                                {stream.language || 'Unknown'} ({stream.codec}, {stream.channels} channels)
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p className="text-gray-500">No audio streams detected</p>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-gray-400 mb-1">Subtitle Streams:</p>
                                                {selectedEpisode.videoAnalysis.subtitleStreams.length > 0 ? (
                                                    <ul className="list-disc list-inside text-gray-300">
                                                        {selectedEpisode.videoAnalysis.subtitleStreams.map((stream, idx) => (
                                                            <li key={idx}>
                                                                {stream.language || 'Unknown'} ({stream.codec})
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p className="text-gray-500">No subtitle streams detected</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Subtitle Preview Modal */}
                {previewSubtitle && subtitleContent && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                        <div className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
                            <div className="flex items-center justify-between p-4 border-b border-gray-700">
                                <h3 className="text-xl font-bold">Subtitle Preview</h3>
                                <button
                                    onClick={() => {
                                        setPreviewSubtitle(null);
                                        setSubtitleContent('');
                                    }}
                                    className="text-gray-400 hover:text-white"
                                >
                                    <FaTimes className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-4 overflow-y-auto flex-1">
                                <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
                                    {subtitleContent}
                                </pre>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

