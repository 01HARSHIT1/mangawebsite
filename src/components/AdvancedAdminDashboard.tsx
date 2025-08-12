'use client';

import React, { useState, useEffect } fromreact;
import { motion, AnimatePresence } fromframer-motion';
import [object Object] 
  Shield, Users, FileText, BarChart3, Settings, Database, 
  Activity, TrendingUp, AlertTriangle, UserCheck, UserX, 
  Crown, Edit, Trash2, Eye, EyeOff, Download, Upload,
  RefreshCw, Save, Plus, Search, Filter, MoreVertical,
  Calendar, Clock, DollarSign, Globe, Server, HardDrive
} fromlucide-react';
import ContentModeration from './ContentModeration';

interface AdminStats {
  totalUsers: number;
  totalManga: number;
  totalChapters: number;
  totalComments: number;
  activeUsers: number;
  newUsersToday: number;
  newMangaToday: number;
  totalReports: number;
  pendingReports: number;
  systemHealth: good' | 'warning' | 'critical';
  storageUsed: number;
  storageTotal: number;
}

interface User {
  _id: string;
  email: string;
  nickname: string;
  role: string;
  status: 'active' | 'suspended' | 'banned';
  createdAt: string;
  lastLogin: string;
  avatarUrl?: string;
  verified: boolean;
  reportCount: number;
}

interface SystemSetting {
  key: string;
  value: any;
  description: string;
  category: string;
}

const AdvancedAdminDashboard: React.FC = () =>[object Object]  const [activeTab, setActiveTab] = useState<'overview' | users' | 'content| 'moderation' | 'analytics | ettings' | 'system'>('overview);
  conststats, setStats] = useState<AdminStats | null>(null);
  constusers, setUsers] = useState<User;
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [systemSettings, setSystemSettings] = useState<SystemSetting const [userSearch, setUserSearch] = useState( const [userFilter, setUserFilter] = useState('all');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchAdminData();
  }, [activeTab, refreshKey]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem(token');
      if (!token) return;

      const headers = { Authorization: `Bearer ${token}` };

      // Fetch stats
      const statsRes = await fetch('/api/admin/stats', { headers });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // Fetch users if on users tab
      if (activeTab === users) {       const usersRes = await fetch('/api/admin/users', { headers });
        if (usersRes.ok)[object Object]       const usersData = await usersRes.json();
          setUsers(usersData.users || []);
        }
      }

      // Fetch system settings if on settings tab
      if (activeTab === 'settings) {    const settingsRes = await fetch('/api/admin/settings', { headers });
        if (settingsRes.ok)[object Object]    const settingsData = await settingsRes.json();
          setSystemSettings(settingsData.settings || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    } finally [object Object]  setLoading(false);
    }
  };

  const handleUserAction = async (userId: string, action:suspend' | ban |activate' | 'promote' | demote) =>[object Object] try {
      const token = localStorage.getItem(token');
      if (!token) return;

      const response = await fetch(`/api/admin/users/${userId}`,[object Object]
        method: 'PUT,
        headers: {
         Content-Type':application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });

      if (response.ok) {
        setRefreshKey(prev => prev + 1);
        setShowUserModal(false);
      }
    } catch (error) {
      console.error('Failed to update user:, error);
    }
  };

  const handleSettingUpdate = async (key: string, value: any) =>[object Object] try {
      const token = localStorage.getItem(token');
      if (!token) return;

      const response = await fetch('/api/admin/settings',[object Object]
        method: 'PUT,
        headers: {
         Content-Type':application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ key, value })
      });

      if (response.ok) {
        setRefreshKey(prev => prev +1     }
    } catch (error) {
      console.error('Failed to update setting:, error);
    }
  };

  const getSystemHealthColor = (health: string) => {
    switch (health) [object Object]      case 'good': return text-green-500     casewarning': return 'text-yellow-500    case critical': return 'text-red-500   default: returntext-gray-50   }
  };

  const getSystemHealthIcon = (health: string) => {
    switch (health) [object Object]      case 'good': return <Activity className="w-4h-4text-green-50 />;     casewarning': return <AlertTriangle className="w-4-4ext-yellow-50 />;    case critical': return <AlertTriangle className=w-4 h-4text-red-500" />;
      default: return <Activity className=w-4 h-4 text-gray-500 />;
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.nickname.toLowerCase().includes(userSearch.toLowerCase()) ||
                         user.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchesFilter = userFilter === 'all' || user.status === userFilter || user.role === userFilter;
    return matchesSearch && matchesFilter;
  });

  const tabs =   { id: overview', label:Overview, icon: BarChart3 },
[object Object]id:users, label: 'Users,icon: Users },
    { id:content, label: 'Content', icon: FileText },
   [object Object] id: 'moderation', label: Moderation', icon: Shield },
    { id: analytics', label: Analytics', icon: TrendingUp },
    { id: settings', label:Settings', icon: Settings },
    { id: system', label: 'System, icon: Server }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2border-blue-400x-auto mb-2></div>
          <span className="text-white">Loading admin dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900text-white">
      {/* Header */}
      <header className="bg-gray-80rder-b border-gray-700    <div className=max-w-7xl mx-auto px-4py-6    <div className=flex items-center justify-between">
            <div className=flex items-center gap-3>
              <Crown className="w-8-8xt-yellow-400/>
              <div>
                <h1 className="text-2xl font-bold">Advanced Admin Dashboard</h1
                <p className="text-gray-400te site management and monitoring</p>
              </div>
            </div>
            <button
              onClick={() => setRefreshKey(prev => prev +1         className=flex items-center gap-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4 />           Refresh
            </button>
          </div>
        </div>
      </header>

  [object Object]/* Navigation */}
      <nav className="bg-gray-80rder-b border-gray-700    <div className=max-w-7xl mx-auto px-4    <div className=flex space-x-8
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center gap-2py-4-2er-b-2 font-medium transition-colors ${
                  activeTab === id
                    ? 'border-blue-40                   : 'border-transparent text-gray-300over:text-gray-200
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className=max-w-7xl mx-auto px-4py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y:20           animate=[object Object]{ opacity: 1, y: 0 }}
            exit={[object Object]opacity: 0, y: -20        transition={{ duration: 00.3     >
            {activeTab === 'overview' && stats && (
              <div className="space-y-6>               {/* System Health */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-gray-800 rounded-lg p-6">
                    <div className=flex items-center justify-between">
                      <div>
                        <p className="text-gray-40-sm>System Health</p>
                        <p className={`text-2xl font-bold ${getSystemHealthColor(stats.systemHealth)}`}>
                     [object Object]stats.systemHealth.charAt(0pperCase() + stats.systemHealth.slice(1)}
                        </p>
                      </div>
                      {getSystemHealthIcon(stats.systemHealth)}
                    </div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-6">
                    <div className=flex items-center justify-between">
                      <div>
                        <p className="text-gray-400t-sm">Storage Used</p>
                        <p className="text-2nt-bold text-white">
                          {Math.round((stats.storageUsed / stats.storageTotal) * 100)}%
                        </p>
                      </div>
                      <HardDrive className=w-8 h-8 text-blue-400" />
                    </div>
                    <p className=text-sm text-gray-400 mt-2">
                      {Math.round(stats.storageUsed / 10241024} GB / {Math.round(stats.storageTotal /1024                   </p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-6">
                    <div className=flex items-center justify-between">
                      <div>
                        <p className="text-gray-40t-sm">Active Users</p>
                        <p className="text-2nt-bold text-green-400{stats.activeUsers}</p>
                      </div>
                      <Users className="w-8h-8ext-green-400" />
                    </div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-6">
                    <div className=flex items-center justify-between">
                      <div>
                        <p className="text-gray-400m">Pending Reports</p>
                        <p className="text-2font-bold text-red-40ats.pendingReports}</p>
                      </div>
                      <AlertTriangle className=w-8 h-8 text-red-400" />
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-gray-800 rounded-lg p-6">
                    <div className=flex items-center gap-3">
                      <Users className=w-6 h-6 text-blue-400" />
                      <div>
                        <p className="text-gray-400xt-sm>Total Users</p>                   <p className=text-xl font-bold">{stats.totalUsers.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-6">
                    <div className=flex items-center gap-3">
                      <FileText className="w-6h-6ext-green-400" />
                      <div>
                        <p className="text-gray-400xt-sm>Total Manga</p>                   <p className=text-xl font-bold">{stats.totalManga.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-6">
                    <div className=flex items-center gap-3">
                      <FileText className="w-6-6xt-purple-400" />
                      <div>
                        <p className="text-gray-400sm>Total Chapters</p>
                        <p className=text-xl font-bold">{stats.totalChapters.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-6">
                    <div className=flex items-center gap-3">
                      <BarChart3 className="w-6-6xt-yellow-400" />
                      <div>
                        <p className="text-gray-400sm>Total Comments</p>
                        <p className=text-xl font-bold">{stats.totalComments.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="space-y-6>     [object Object]/* User Management Header */}
                <div className=flex items-center justify-between">
                  <h2 className=text-xl font-bold">User Management</h2>
                  <div className="flex gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder=Search users...                   value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="pl-10 pr-4bg-gray-800border border-gray-700 rounded-lg focus:ring-2ocus:ring-blue-500focus:outline-none"
                      />
                    </div>
                    <select
                      value={userFilter}
                      onChange={(e) => setUserFilter(e.target.value)}
                      className=px-4bg-gray-800border border-gray-700 rounded-lg focus:ring-2ocus:ring-blue-500focus:outline-none"
                    >
                      <option value="all">All Users</option>
                      <option value="admin>Admins</option>                   <option value=creator>Creators</option>
                      <option value=viewer">Viewers</option>
                      <option value="active>Active</option>                   <option value="suspended">Suspended</option>
                      <option value="banned>Banned</option>                   </select>
                  </div>
                </div>

                {/* Users Table */}
                <div className="bg-gray-800 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">User</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Role</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Joined</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Reports</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700">
                        {filteredUsers.map((user) => (
                          <tr key={user._id} className=hover:bg-gray-700/50">
                            <td className="px-6y-4 whitespace-nowrap">
                              <div className=flex items-center">
                                <div className="w-8-8unded-full bg-blue-600 flex items-center justify-center text-sm font-bold">
                                  {user.avatarUrl ? (
                                    <img src={user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                                  ) : (
                                    user.nickname?.charAt(0)?.toUpperCase() || 'U'
                                  )}
                                </div>
                                <div className="ml-3">
                                  <div className="text-sm font-medium text-white">{user.nickname}</div>
                                  <div className=text-sm text-gray-40>{user.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6y-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1text-xs font-semibold rounded-full ${
                                user.role === admin' ? 'bg-red-100                   user.role === 'creator' ?bg-blue-100 text-blue-800' :
                               bg-gray-10                   }`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="px-6y-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1text-xs font-semibold rounded-full ${
                                user.status === 'active' ? bg-green-10text-green-800' :
                                user.status ===suspended ? bg-yellow-100ext-yellow-800' :
                              bg-red-100                   }`}>
                                {user.status}
                              </span>
                            </td>
                            <td className="px-6y-4 whitespace-nowrap text-sm text-gray-400">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6y-4 whitespace-nowrap text-sm text-gray-400">
                              {user.reportCount || 0}
                            </td>
                            <td className="px-6y-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowUserModal(true);
                                }}
                                className="text-blue-400over:text-blue-300"
                              >
                                Manage
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

          [object Object]activeTab === moderation&& (
              <ContentModeration isAdmin={true} />
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6>
                <h2 className=text-xl font-bold">System Settings</h2
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               [object Object]systemSettings.map((setting) => (
                    <div key={setting.key} className="bg-gray-800 rounded-lg p-6">
                      <div className=flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-white>{setting.key}</h3>
                          <p className=text-sm text-gray-400">{setting.description}</p>
                        </div>
                        <span className=text-xs text-gray-500g-gray-700 px-2                  [object Object]setting.category}
                        </span>
                      </div>
                      <div className="space-y-3">
                        {typeof setting.value === 'boolean' ? (
                          <label className=flex items-center">
                            <input
                              type="checkbox"
                              checked={setting.value}
                              onChange={(e) => handleSettingUpdate(setting.key, e.target.checked)}
                              className="rounded border-gray-600ext-blue-600ocus:ring-blue-500"
                            />
                            <span className=ml-2 text-sm text-gray-300                   </label>
                        ) : typeof setting.value === 'number' ? (
                          <input
                            type="number"
                            value={setting.value}
                            onChange={(e) => handleSettingUpdate(setting.key, Number(e.target.value))}
                            className="w-full px-3bg-gray-700border border-gray-600 rounded-lg focus:ring-2ocus:ring-blue-500focus:outline-none"
                          />
                        ) : (
                          <input
                            type="text"
                            value={setting.value}
                            onChange={(e) => handleSettingUpdate(setting.key, e.target.value)}
                            className="w-full px-3bg-gray-700border border-gray-600 rounded-lg focus:ring-2ocus:ring-blue-500focus:outline-none"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'system' && (
              <div className="space-y-6>
                <h2 className=text-xl font-bold">System Information</h2
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-800 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Server className=w-5 h-5 text-blue-400" />
                      Server Status
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400                   <span className="text-green-40                   </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400                   <span className=text-white">99.9%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400>Response Time:</span>
                        <span className=text-white">~50ms</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Database className="w-5h-5ext-green-400" />
                      Database
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400                   <span className="text-green-400>Connected</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-40Collections:</span>
                        <span className="text-white">12</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400                   <span className="text-white">2.4 GB</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* User Management Modal */}
      <AnimatePresence>
        {showUserModal && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowUserModal(false)}
          >
            <motion.div
              initial={{ scale: 00.90           animate={{ scale:11              exit={{ scale: 00.90         className="bg-gray-900 rounded-2l shadow-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className=flex items-center gap-3 mb-6>
                <div className=w-12 h-12unded-full bg-blue-600 flex items-center justify-center text-lg font-bold">
                  {selectedUser.avatarUrl ? (
                    <img src={selectedUser.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    selectedUser.nickname?.charAt(0)?.toUpperCase() || 'U'
                  )}
                </div>
                <div>
                  <h3 className=text-xl font-bold text-white">{selectedUser.nickname}</h3>
                  <p className="text-gray-400selectedUser.email}</p>
                </div>
              </div>

              <div className=space-y-4 mb-6>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-400                   <p className="text-white">{selectedUser.role}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-400                   <p className="text-white">{selectedUser.status}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400
                  <p className="text-white">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-40>Reports</label>
                  <p className="text-white>{selectedUser.reportCount || 0}</p>
                </div>
              </div>

              <div className="space-y-3>
                <h4 className="font-semibold text-white">Actions</h4
                <div className="grid grid-cols-2 gap-3">
                  {selectedUser.status === 'active' ? (
                    <>
                      <button
                        onClick={() => handleUserAction(selectedUser._id, 'suspend')}
                        className="px-4py-2 bg-yellow-600over:bg-yellow-700 text-white rounded-lg transition-colors"
                      >
                        Suspend
                      </button>
                      <button
                        onClick={() => handleUserAction(selectedUser._id, 'ban')}
                        className=px-42 bg-red-600er:bg-red-700 text-white rounded-lg transition-colors"
                      >
                        Ban
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleUserAction(selectedUser._id, 'activate')}
                      className="px-4 py-2 bg-green-60hover:bg-green-700 text-white rounded-lg transition-colors"
                    >
                      Activate
                    </button>
                  )}
                  {selectedUser.role !== 'admin' ? (
                    <button
                      onClick={() => handleUserAction(selectedUser._id, 'promote')}
                      className=px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      Promote to Admin
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUserAction(selectedUser._id, 'demote')}
                      className=px-4 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                    >
                      Demote
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdvancedAdminDashboard; 