'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
    FaGavel, FaExclamationTriangle, FaCheck, FaTimes, FaBan, 
    FaGlobe, FaFileAlt, FaClock, FaUser, FaEnvelope, FaVideo,
    FaSearch, FaFilter, FaFlag, FaEye, FaDownload, FaMapMarkerAlt
} from 'react-icons/fa';

interface CopyrightClaim {
    _id: string;
    type: 'dmca' | 'manual' | 'auto';
    status: 'pending' | 'processing' | 'resolved' | 'rejected' | 'counter_claimed';
    claimantName: string;
    claimantEmail: string;
    claimantType: 'studio' | 'individual' | 'organization';
    episodeId?: string;
    seriesId?: string;
    episode?: {
        _id: string;
        title: string;
        episodeNumber: number;
    };
    series?: {
        _id: string;
        title: string;
        coverImage: string;
    };
    reason: string;
    description: string;
    timestamp?: string;
    evidence: string[];
    legalDocument?: string;
    regionBlocked: string[];
    reviewedBy?: string;
    reviewedAt?: string;
    reviewNotes?: string;
    counterClaimId?: string;
    counterClaim?: {
        _id: string;
        status: string;
        submittedAt: string;
    };
    strikeIssued: boolean;
    strikeId?: string;
    creatorStrikes: number;
    createdAt: string;
    updatedAt: string;
}

export default function CopyrightPanelPage() {
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();
    const [claims, setClaims] = useState<CopyrightClaim[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedClaim, setSelectedClaim] = useState<CopyrightClaim | null>(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [actionModal, setActionModal] = useState<{ claimId: string; action: string } | null>(null);
    const [actionData, setActionData] = useState<any>({});
    const [submitting, setSubmitting] = useState(false);
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        if (!isAuthenticated || user?.role !== 'admin') {
            router.push('/admin/login');
            return;
        }
        fetchClaims();
    }, [isAuthenticated, user, statusFilter, typeFilter, router]);

    const fetchClaims = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const params = new URLSearchParams();
            if (statusFilter !== 'all') params.append('status', statusFilter);
            if (typeFilter !== 'all') params.append('type', typeFilter);
            
            const response = await fetch(`/api/admin/anime/copyright?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setClaims(data.claims || []);
                setStats(data.stats || null);
            }
        } catch (error) {
            console.error('Error fetching claims:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClaimAction = async (action: string, updates?: any) => {
        if (!actionModal) return;

        try {
            setSubmitting(true);
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const response = await fetch('/api/admin/anime/copyright', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    claimId: actionModal.claimId,
                    action,
                    updates: updates || actionData,
                })
            });

            if (response.ok) {
                await fetchClaims();
                setActionModal(null);
                setActionData({});
                alert('Action completed successfully');
            } else {
                const error = await response.json();
                alert(`Error: ${error.error}`);
            }
        } catch (error) {
            console.error('Error processing action:', error);
            alert('Failed to process action');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredClaims = claims.filter(claim => {
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const matchesTitle = claim.episode?.title.toLowerCase().includes(query) ||
                                claim.series?.title.toLowerCase().includes(query);
            const matchesClaimant = claim.claimantName.toLowerCase().includes(query);
            if (!matchesTitle && !matchesClaimant) return false;
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
                    <h1 className="text-3xl font-bold mb-2">Copyright & Legal Panel</h1>
                    <p className="text-gray-400">Manage DMCA takedowns, copyright claims, and legal issues</p>
                </div>

                {/* Statistics */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                        <div className="bg-gray-900 rounded-lg p-4">
                            <p className="text-gray-400 text-sm">Total</p>
                            <p className="text-2xl font-bold">{stats.total}</p>
                        </div>
                        <div className="bg-yellow-900/30 rounded-lg p-4">
                            <p className="text-yellow-400 text-sm">Pending</p>
                            <p className="text-2xl font-bold">{stats.pending}</p>
                        </div>
                        <div className="bg-blue-900/30 rounded-lg p-4">
                            <p className="text-blue-400 text-sm">Processing</p>
                            <p className="text-2xl font-bold">{stats.processing}</p>
                        </div>
                        <div className="bg-green-900/30 rounded-lg p-4">
                            <p className="text-green-400 text-sm">Resolved</p>
                            <p className="text-2xl font-bold">{stats.resolved}</p>
                        </div>
                        <div className="bg-purple-900/30 rounded-lg p-4">
                            <p className="text-purple-400 text-sm">Counter-Claimed</p>
                            <p className="text-2xl font-bold">{stats.counterClaimed}</p>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="flex gap-4 mb-6">
                    <div className="flex-1 relative">
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search claims..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="resolved">Resolved</option>
                        <option value="rejected">Rejected</option>
                        <option value="counter_claimed">Counter-Claimed</option>
                    </select>
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                    >
                        <option value="all">All Types</option>
                        <option value="dmca">DMCA</option>
                        <option value="manual">Manual</option>
                        <option value="auto">Auto</option>
                    </select>
                </div>

                {/* Claims List */}
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                    </div>
                ) : filteredClaims.length === 0 ? (
                    <div className="text-center py-20 bg-gray-900 rounded-lg">
                        <FaGavel className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400 text-lg">No copyright claims found</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Claims List */}
                        <div className="space-y-4">
                            {filteredClaims.map((claim) => (
                                <div
                                    key={claim._id}
                                    onClick={() => setSelectedClaim(claim)}
                                    className={`p-4 bg-gray-900 rounded-lg cursor-pointer transition-all ${
                                        selectedClaim?._id === claim._id
                                            ? 'ring-2 ring-orange-500 bg-gray-800'
                                            : 'hover:bg-gray-800'
                                    }`}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`px-2 py-1 rounded text-xs ${
                                                    claim.type === 'dmca' ? 'bg-red-600' :
                                                    claim.type === 'manual' ? 'bg-blue-600' :
                                                    'bg-yellow-600'
                                                }`}>
                                                    {claim.type.toUpperCase()}
                                                </span>
                                                <span className={`px-2 py-1 rounded text-xs ${
                                                    claim.status === 'pending' ? 'bg-yellow-600' :
                                                    claim.status === 'processing' ? 'bg-blue-600' :
                                                    claim.status === 'resolved' ? 'bg-green-600' :
                                                    claim.status === 'rejected' ? 'bg-red-600' :
                                                    'bg-purple-600'
                                                }`}>
                                                    {claim.status.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <h3 className="font-bold">
                                                {claim.episode?.title || claim.series?.title || 'Unknown Content'}
                                            </h3>
                                            <p className="text-sm text-gray-400">
                                                Claimant: {claim.claimantName} ({claim.claimantType})
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2 text-xs text-gray-400 mt-2">
                                        {claim.strikeIssued && (
                                            <span className="text-red-400 flex items-center">
                                                <FaFlag className="mr-1" />
                                                Strike Issued
                                            </span>
                                        )}
                                        {claim.creatorStrikes > 0 && (
                                            <span className="text-orange-400">
                                                {claim.creatorStrikes} Active Strikes
                                            </span>
                                        )}
                                        {claim.regionBlocked.length > 0 && (
                                            <span className="text-blue-400 flex items-center">
                                                <FaGlobe className="mr-1" />
                                                {claim.regionBlocked.length} Regions Blocked
                                            </span>
                                        )}
                                        {claim.counterClaim && (
                                            <span className="text-purple-400 flex items-center">
                                                <FaGavel className="mr-1" />
                                                Counter-Claimed
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Claim Details Panel */}
                        {selectedClaim && (
                            <div className="bg-gray-900 rounded-lg p-6 sticky top-6 max-h-[calc(100vh-100px)] overflow-y-auto">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h2 className="text-2xl font-bold">Claim Details</h2>
                                        <p className="text-gray-400 text-sm">
                                            {selectedClaim.type.toUpperCase()} • {selectedClaim.status}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setSelectedClaim(null)}
                                        className="text-gray-400 hover:text-white"
                                    >
                                        <FaTimes className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Content Info */}
                                <div className="mb-4 p-4 bg-gray-800 rounded-lg">
                                    <h3 className="font-semibold mb-2">Content</h3>
                                    {selectedClaim.episode && (
                                        <div>
                                            <p className="text-sm text-gray-400">Episode</p>
                                            <p className="font-semibold">{selectedClaim.episode.title}</p>
                                            <p className="text-xs text-gray-500">Episode {selectedClaim.episode.episodeNumber}</p>
                                        </div>
                                    )}
                                    {selectedClaim.series && (
                                        <div>
                                            <p className="text-sm text-gray-400">Series</p>
                                            <p className="font-semibold">{selectedClaim.series.title}</p>
                                        </div>
                                    )}
                                    {selectedClaim.timestamp && (
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-400">Timestamp</p>
                                            <p className="text-sm">{selectedClaim.timestamp}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Claimant Info */}
                                <div className="mb-4 p-4 bg-gray-800 rounded-lg">
                                    <h3 className="font-semibold mb-2">Claimant</h3>
                                    <div className="space-y-1 text-sm">
                                        <p><span className="text-gray-400">Name:</span> {selectedClaim.claimantName}</p>
                                        <p><span className="text-gray-400">Email:</span> {selectedClaim.claimantEmail}</p>
                                        <p><span className="text-gray-400">Type:</span> {selectedClaim.claimantType}</p>
                                    </div>
                                </div>

                                {/* Claim Details */}
                                <div className="mb-4 p-4 bg-gray-800 rounded-lg">
                                    <h3 className="font-semibold mb-2">Claim Details</h3>
                                    <div className="space-y-2 text-sm">
                                        <div>
                                            <p className="text-gray-400">Reason</p>
                                            <p className="font-semibold">{selectedClaim.reason}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400">Description</p>
                                            <p className="text-gray-300">{selectedClaim.description}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Evidence */}
                                {selectedClaim.evidence.length > 0 && (
                                    <div className="mb-4 p-4 bg-gray-800 rounded-lg">
                                        <h3 className="font-semibold mb-2">Evidence</h3>
                                        <div className="space-y-2">
                                            {selectedClaim.evidence.map((url, idx) => (
                                                <a
                                                    key={idx}
                                                    href={url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
                                                >
                                                    <FaFileAlt />
                                                    <span className="truncate">Evidence {idx + 1}</span>
                                                    <FaDownload />
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Legal Document */}
                                {selectedClaim.legalDocument && (
                                    <div className="mb-4 p-4 bg-gray-800 rounded-lg">
                                        <h3 className="font-semibold mb-2">Legal Document</h3>
                                        <a
                                            href={selectedClaim.legalDocument}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
                                        >
                                            <FaFileAlt />
                                            <span>View DMCA Document</span>
                                            <FaDownload />
                                        </a>
                                    </div>
                                )}

                                {/* Region Blocks */}
                                {selectedClaim.regionBlocked.length > 0 && (
                                    <div className="mb-4 p-4 bg-gray-800 rounded-lg">
                                        <h3 className="font-semibold mb-2">Blocked Regions</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedClaim.regionBlocked.map((region) => (
                                                <span key={region} className="px-2 py-1 bg-red-900/50 rounded text-xs">
                                                    {region}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Counter-Claim */}
                                {selectedClaim.counterClaim && (
                                    <div className="mb-4 p-4 bg-purple-900/30 rounded-lg border border-purple-700">
                                        <h3 className="font-semibold mb-2 text-purple-400">Counter-Claim</h3>
                                        <p className="text-sm text-gray-300">
                                            Status: {selectedClaim.counterClaim.status}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            Submitted: {new Date(selectedClaim.counterClaim.submittedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                )}

                                {/* Review Notes */}
                                {selectedClaim.reviewNotes && (
                                    <div className="mb-4 p-4 bg-gray-800 rounded-lg">
                                        <h3 className="font-semibold mb-2">Review Notes</h3>
                                        <p className="text-sm text-gray-300">{selectedClaim.reviewNotes}</p>
                                        {selectedClaim.reviewedAt && (
                                            <p className="text-xs text-gray-400 mt-1">
                                                Reviewed: {new Date(selectedClaim.reviewedAt).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="space-y-2 border-t border-gray-700 pt-4">
                                    <h3 className="font-semibold mb-2">Actions</h3>
                                    
                                    {selectedClaim.status === 'pending' && (
                                        <>
                                            <button
                                                onClick={() => setActionModal({ claimId: selectedClaim._id, action: 'process_dmca' })}
                                                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-semibold"
                                            >
                                                Process DMCA
                                            </button>
                                            <button
                                                onClick={() => setActionModal({ claimId: selectedClaim._id, action: 'approve' })}
                                                className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 rounded font-semibold"
                                            >
                                                Approve Claim
                                            </button>
                                            <button
                                                onClick={() => setActionModal({ claimId: selectedClaim._id, action: 'reject' })}
                                                className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded font-semibold"
                                            >
                                                Reject Claim
                                            </button>
                                        </>
                                    )}

                                    {selectedClaim.status === 'processing' && (
                                        <>
                                            <button
                                                onClick={() => setActionModal({ claimId: selectedClaim._id, action: 'approve' })}
                                                className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 rounded font-semibold"
                                            >
                                                Approve & Take Action
                                            </button>
                                            <button
                                                onClick={() => setActionModal({ claimId: selectedClaim._id, action: 'reject' })}
                                                className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded font-semibold"
                                            >
                                                Reject Claim
                                            </button>
                                        </>
                                    )}

                                    <button
                                        onClick={() => setActionModal({ claimId: selectedClaim._id, action: 'issue_strike' })}
                                        className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded font-semibold"
                                    >
                                        Issue Strike
                                    </button>
                                    <button
                                        onClick={() => setActionModal({ claimId: selectedClaim._id, action: 'block_region' })}
                                        className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded font-semibold"
                                    >
                                        Block Region
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Action Modal */}
                {actionModal && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                        <div className="bg-gray-900 rounded-lg max-w-2xl w-full p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold">
                                    {actionModal.action === 'approve' && 'Approve Claim'}
                                    {actionModal.action === 'reject' && 'Reject Claim'}
                                    {actionModal.action === 'process_dmca' && 'Process DMCA'}
                                    {actionModal.action === 'issue_strike' && 'Issue Strike'}
                                    {actionModal.action === 'block_region' && 'Block Region'}
                                </h3>
                                <button
                                    onClick={() => {
                                        setActionModal(null);
                                        setActionData({});
                                    }}
                                    className="text-gray-400 hover:text-white"
                                >
                                    <FaTimes className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {actionModal.action === 'approve' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-semibold mb-2">Review Notes</label>
                                            <textarea
                                                value={actionData.notes || ''}
                                                onChange={(e) => setActionData({ ...actionData, notes: e.target.value })}
                                                rows={3}
                                                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                                                placeholder="Add review notes..."
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="issueStrike"
                                                checked={actionData.issueStrike || false}
                                                onChange={(e) => setActionData({ ...actionData, issueStrike: e.target.checked })}
                                                className="w-4 h-4"
                                            />
                                            <label htmlFor="issueStrike" className="text-sm">Issue strike to creator</label>
                                        </div>
                                        {actionData.issueStrike && (
                                            <div>
                                                <label className="block text-sm font-semibold mb-2">Strike Reason</label>
                                                <input
                                                    type="text"
                                                    value={actionData.strikeReason || ''}
                                                    onChange={(e) => setActionData({ ...actionData, strikeReason: e.target.value })}
                                                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                                                    placeholder="Strike reason..."
                                                />
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="takeDown"
                                                checked={actionData.takeDown || false}
                                                onChange={(e) => setActionData({ ...actionData, takeDown: e.target.checked })}
                                                className="w-4 h-4"
                                            />
                                            <label htmlFor="takeDown" className="text-sm">Take down content</label>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold mb-2">Block Regions (ISO codes, comma-separated)</label>
                                            <input
                                                type="text"
                                                value={actionData.blockRegions || ''}
                                                onChange={(e) => setActionData({ 
                                                    ...actionData, 
                                                    blockRegions: e.target.value.split(',').map(r => r.trim()).filter(Boolean)
                                                })}
                                                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                                                placeholder="US, GB, CA"
                                            />
                                        </div>
                                    </>
                                )}

                                {actionModal.action === 'reject' && (
                                    <div>
                                        <label className="block text-sm font-semibold mb-2">Rejection Reason</label>
                                        <textarea
                                            value={actionData.notes || ''}
                                            onChange={(e) => setActionData({ ...actionData, notes: e.target.value })}
                                            rows={3}
                                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                                            placeholder="Reason for rejection..."
                                        />
                                    </div>
                                )}

                                {actionModal.action === 'issue_strike' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-semibold mb-2">Strike Severity</label>
                                            <select
                                                value={actionData.severity || 'warning'}
                                                onChange={(e) => setActionData({ ...actionData, severity: e.target.value })}
                                                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                                            >
                                                <option value="warning">Warning</option>
                                                <option value="strike_1">Strike 1</option>
                                                <option value="strike_2">Strike 2</option>
                                                <option value="strike_3">Strike 3 (Ban)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold mb-2">Strike Reason</label>
                                            <textarea
                                                value={actionData.reason || ''}
                                                onChange={(e) => setActionData({ ...actionData, reason: e.target.value })}
                                                rows={3}
                                                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                                                placeholder="Reason for strike..."
                                            />
                                        </div>
                                    </>
                                )}

                                {actionModal.action === 'block_region' && (
                                    <div>
                                        <label className="block text-sm font-semibold mb-2">Regions to Block (ISO codes, comma-separated)</label>
                                        <input
                                            type="text"
                                            value={actionData.regions?.join(', ') || ''}
                                            onChange={(e) => setActionData({ 
                                                ...actionData, 
                                                regions: e.target.value.split(',').map(r => r.trim()).filter(Boolean)
                                            })}
                                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                                            placeholder="US, GB, CA"
                                        />
                                        <p className="text-xs text-gray-400 mt-1">Enter ISO 3166-1 alpha-2 country codes</p>
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleClaimAction(actionModal.action)}
                                        disabled={submitting}
                                        className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded font-semibold disabled:opacity-50"
                                    >
                                        {submitting ? 'Processing...' : 'Submit'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setActionModal(null);
                                            setActionData({});
                                        }}
                                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded font-semibold"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

