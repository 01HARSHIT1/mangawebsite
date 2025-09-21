'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { FaUsers, FaUserPlus, FaCrown, FaPen, FaEye, FaComment, FaCheck, FaTimes, FaBell } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

interface Collaborator {
    userId: string;
    username: string;
    role: 'owner' | 'editor' | 'viewer' | 'pending';
    permissions: {
        canEdit: boolean;
        canComment: boolean;
        canInvite: boolean;
        canPublish: boolean;
    };
    joinedAt: Date;
    lastActive?: Date;
    isOnline: boolean;
}

interface CollaborationInvite {
    _id: string;
    mangaId: string;
    mangaTitle: string;
    fromUser: string;
    toUser: string;
    role: 'editor' | 'viewer';
    message?: string;
    status: 'pending' | 'accepted' | 'declined';
    createdAt: Date;
    expiresAt: Date;
}

interface CreatorCollaborationProps {
    mangaId: string;
    mangaTitle: string;
    isOwner: boolean;
}

export default function CreatorCollaboration({ mangaId, mangaTitle, isOwner }: CreatorCollaborationProps) {
    const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
    const [invites, setInvites] = useState<CollaborationInvite[]>([]);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteUsername, setInviteUsername] = useState('');
    const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('viewer');
    const [inviteMessage, setInviteMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    
    const { user } = useAuth();
    const { socket, onlineUsers } = useWebSocket();

    useEffect(() => {
        loadCollaborators();
        loadInvites();
    }, [mangaId]);

    useEffect(() => {
        if (socket) {
            // Listen for collaboration events
            socket.on('collaboration_invite', (invite: CollaborationInvite) => {
                if (invite.toUser === user?.username) {
                    setInvites(prev => [invite, ...prev]);
                }
            });

            socket.on('collaboration_accepted', (data: { mangaId: string; collaborator: Collaborator }) => {
                if (data.mangaId === mangaId) {
                    setCollaborators(prev => [...prev, data.collaborator]);
                }
            });

            socket.on('collaborator_online', (data: { mangaId: string; userId: string }) => {
                if (data.mangaId === mangaId) {
                    setCollaborators(prev => prev.map(c => 
                        c.userId === data.userId ? { ...c, isOnline: true, lastActive: new Date() } : c
                    ));
                }
            });

            socket.on('collaborator_offline', (data: { mangaId: string; userId: string }) => {
                if (data.mangaId === mangaId) {
                    setCollaborators(prev => prev.map(c => 
                        c.userId === data.userId ? { ...c, isOnline: false } : c
                    ));
                }
            });

            return () => {
                socket.off('collaboration_invite');
                socket.off('collaboration_accepted');
                socket.off('collaborator_online');
                socket.off('collaborator_offline');
            };
        }
    }, [socket, mangaId, user?.username]);

    const loadCollaborators = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch(`/api/manga/${mangaId}/collaborators`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setCollaborators(data.collaborators || []);
            } else {
                // Mock data for demonstration
                setCollaborators([
                    {
                        userId: user?._id || 'owner',
                        username: user?.username || 'You',
                        role: 'owner',
                        permissions: {
                            canEdit: true,
                            canComment: true,
                            canInvite: true,
                            canPublish: true
                        },
                        joinedAt: new Date(),
                        isOnline: true
                    }
                ]);
            }
        } catch (error) {
            console.error('Failed to load collaborators:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadInvites = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch(`/api/collaboration/invites`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setInvites(data.invites || []);
            }
        } catch (error) {
            console.error('Failed to load invites:', error);
        }
    };

    const sendInvite = async () => {
        if (!inviteUsername.trim() || sending) return;

        setSending(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Not authenticated');

            const response = await fetch('/api/collaboration/invite', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    mangaId,
                    mangaTitle,
                    username: inviteUsername,
                    role: inviteRole,
                    message: inviteMessage
                })
            });

            if (response.ok) {
                setShowInviteModal(false);
                setInviteUsername('');
                setInviteMessage('');
                
                // Send real-time notification
                if (socket) {
                    socket.emit('send_collaboration_invite', {
                        mangaId,
                        mangaTitle,
                        username: inviteUsername,
                        role: inviteRole,
                        message: inviteMessage
                    });
                }
            } else {
                const errorData = await response.json();
                alert(errorData.error || 'Failed to send invite');
            }
        } catch (error) {
            console.error('Failed to send invite:', error);
            alert('Failed to send invite');
        } finally {
            setSending(false);
        }
    };

    const respondToInvite = async (inviteId: string, action: 'accept' | 'decline') => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch(`/api/collaboration/invites/${inviteId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ action })
            });

            if (response.ok) {
                setInvites(prev => prev.filter(inv => inv._id !== inviteId));
                
                if (action === 'accept') {
                    // Reload collaborators
                    loadCollaborators();
                }
            }
        } catch (error) {
            console.error('Failed to respond to invite:', error);
        }
    };

    const removeCollaborator = async (userId: string) => {
        if (!confirm('Are you sure you want to remove this collaborator?')) return;

        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch(`/api/manga/${mangaId}/collaborators/${userId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                setCollaborators(prev => prev.filter(c => c.userId !== userId));
            }
        } catch (error) {
            console.error('Failed to remove collaborator:', error);
        }
    };

    const updatePermissions = async (userId: string, permissions: any) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch(`/api/manga/${mangaId}/collaborators/${userId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ permissions })
            });

            if (response.ok) {
                setCollaborators(prev => prev.map(c => 
                    c.userId === userId ? { ...c, permissions } : c
                ));
            }
        } catch (error) {
            console.error('Failed to update permissions:', error);
        }
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'owner': return <FaCrown className="text-yellow-400" />;
            case 'editor': return <FaPen className="text-green-400" />;
            case 'viewer': return <FaEye className="text-blue-400" />;
            case 'pending': return <FaBell className="text-gray-400" />;
            default: return <FaUsers className="text-gray-400" />;
        }
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'owner': return 'text-yellow-400 bg-yellow-400/20';
            case 'editor': return 'text-green-400 bg-green-400/20';
            case 'viewer': return 'text-blue-400 bg-blue-400/20';
            case 'pending': return 'text-gray-400 bg-gray-400/20';
            default: return 'text-gray-400 bg-gray-400/20';
        }
    };

    if (loading) {
        return (
            <div className="bg-slate-800/50 rounded-2xl p-6 animate-pulse">
                <div className="h-6 bg-gray-600 rounded w-1/3 mb-4"></div>
                <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gray-600 rounded-full"></div>
                            <div className="flex-1 space-y-1">
                                <div className="h-4 bg-gray-600 rounded w-1/2"></div>
                                <div className="h-3 bg-gray-700 rounded w-1/3"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Collaboration Header */}
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-purple-500/20">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                        <FaUsers />
                        <span>Collaboration</span>
                    </h3>
                    
                    {isOwner && (
                        <button
                            onClick={() => setShowInviteModal(true)}
                            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 flex items-center space-x-2"
                        >
                            <FaUserPlus />
                            <span>Invite Collaborator</span>
                        </button>
                    )}
                </div>

                {/* Collaborators List */}
                <div className="space-y-3">
                    {collaborators.map((collaborator) => (
                        <div key={collaborator.userId} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                            <div className="flex items-center space-x-3">
                                <div className="relative">
                                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                                        {collaborator.username.charAt(0).toUpperCase()}
                                    </div>
                                    {collaborator.isOnline && (
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-slate-800"></div>
                                    )}
                                </div>
                                
                                <div>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-white font-medium">{collaborator.username}</span>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(collaborator.role)}`}>
                                            {getRoleIcon(collaborator.role)}
                                            <span className="ml-1 capitalize">{collaborator.role}</span>
                                        </span>
                                    </div>
                                    <p className="text-gray-400 text-sm">
                                        {collaborator.isOnline ? 'Online now' : 
                                         collaborator.lastActive ? `Last active ${new Date(collaborator.lastActive).toLocaleDateString()}` :
                                         'Never active'}
                                    </p>
                                </div>
                            </div>

                            {/* Permissions & Actions */}
                            <div className="flex items-center space-x-2">
                                {/* Permissions Display */}
                                <div className="flex space-x-1">
                                    {collaborator.permissions.canEdit && (
                                        <div className="w-6 h-6 bg-green-500/20 rounded text-green-400 flex items-center justify-center" title="Can Edit">
                                            <FaPen className="text-xs" />
                                        </div>
                                    )}
                                    {collaborator.permissions.canComment && (
                                        <div className="w-6 h-6 bg-blue-500/20 rounded text-blue-400 flex items-center justify-center" title="Can Comment">
                                            <FaComment className="text-xs" />
                                        </div>
                                    )}
                                    {collaborator.permissions.canInvite && (
                                        <div className="w-6 h-6 bg-purple-500/20 rounded text-purple-400 flex items-center justify-center" title="Can Invite">
                                            <FaUserPlus className="text-xs" />
                                        </div>
                                    )}
                                </div>

                                {/* Remove Button (Owner Only) */}
                                {isOwner && collaborator.role !== 'owner' && (
                                    <button
                                        onClick={() => removeCollaborator(collaborator.userId)}
                                        className="text-red-400 hover:text-red-300 transition-colors"
                                        title="Remove collaborator"
                                    >
                                        <FaTimes />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Pending Invites */}
            {invites.length > 0 && (
                <div className="bg-slate-800/50 rounded-2xl p-6 border border-yellow-500/20">
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                        <FaBell className="text-yellow-400" />
                        <span>Pending Invites ({invites.length})</span>
                    </h4>
                    
                    <div className="space-y-3">
                        {invites.map((invite) => (
                            <div key={invite._id} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                                <div>
                                    <p className="text-white font-medium">
                                        {invite.fromUser} invited you to collaborate on "{invite.mangaTitle}"
                                    </p>
                                    <p className="text-gray-400 text-sm">
                                        Role: <span className="capitalize">{invite.role}</span> • 
                                        Expires: {new Date(invite.expiresAt).toLocaleDateString()}
                                    </p>
                                    {invite.message && (
                                        <p className="text-gray-300 text-sm italic mt-1">"{invite.message}"</p>
                                    )}
                                </div>
                                
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => respondToInvite(invite._id, 'accept')}
                                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors flex items-center space-x-1"
                                    >
                                        <FaCheck />
                                        <span>Accept</span>
                                    </button>
                                    <button
                                        onClick={() => respondToInvite(invite._id, 'decline')}
                                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors flex items-center space-x-1"
                                    >
                                        <FaTimes />
                                        <span>Decline</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Invite Modal */}
            <AnimatePresence>
                {showInviteModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-slate-900 rounded-3xl p-8 max-w-md w-full border border-purple-500/20 shadow-2xl"
                        >
                            <h3 className="text-2xl font-bold text-white mb-6">Invite Collaborator</h3>
                            
                            <div className="space-y-4">
                                {/* Username */}
                                <div>
                                    <label className="block text-gray-300 text-sm font-medium mb-2">
                                        Username
                                    </label>
                                    <input
                                        type="text"
                                        value={inviteUsername}
                                        onChange={(e) => setInviteUsername(e.target.value)}
                                        placeholder="Enter username to invite"
                                        className="w-full bg-slate-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>

                                {/* Role */}
                                <div>
                                    <label className="block text-gray-300 text-sm font-medium mb-2">
                                        Role
                                    </label>
                                    <select
                                        value={inviteRole}
                                        onChange={(e) => setInviteRole(e.target.value as 'editor' | 'viewer')}
                                        className="w-full bg-slate-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    >
                                        <option value="viewer">Viewer - Can view and comment</option>
                                        <option value="editor">Editor - Can edit and publish</option>
                                    </select>
                                </div>

                                {/* Message */}
                                <div>
                                    <label className="block text-gray-300 text-sm font-medium mb-2">
                                        Message (Optional)
                                    </label>
                                    <textarea
                                        value={inviteMessage}
                                        onChange={(e) => setInviteMessage(e.target.value)}
                                        placeholder="Add a personal message..."
                                        className="w-full bg-slate-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                                        rows={3}
                                    />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex space-x-3 mt-6">
                                <button
                                    onClick={sendInvite}
                                    disabled={!inviteUsername.trim() || sending}
                                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                                >
                                    {sending ? 'Sending...' : 'Send Invite'}
                                </button>
                                <button
                                    onClick={() => setShowInviteModal(false)}
                                    className="px-6 py-3 text-gray-400 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
