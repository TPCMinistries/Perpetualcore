'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase/client';

interface User {
  id: string;
  email: string;
  full_name: string | null;
  is_super_admin: boolean;
  is_admin: boolean;
  created_at: string;
  last_sign_in_at: string | null;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const { data, error } = await supabase.rpc('admin_get_all_users');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleAdminStatus(user: User, makeAdmin: boolean, makeSuperAdmin: boolean = false) {
    try {
      const { error } = await supabase.rpc('admin_set_admin_status', {
        target_user_email: user.email,
        make_admin: makeAdmin,
        make_super_admin: makeSuperAdmin,
      });

      if (error) throw error;

      alert(`Admin status updated for ${user.email}`);
      loadUsers();
      setSelectedUser(null);
    } catch (error: any) {
      alert(`Error updating admin status: ${error.message}`);
    }
  }

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="text-center py-12 text-slate-400">Loading users...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">User Management</h2>
          <p className="text-sm text-slate-400">Manage users and permissions</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-slate-400">
            {users.length} total users
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search users by email or name..."
          className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
          <div className="text-2xl font-bold text-white">{users.length}</div>
          <div className="text-sm text-slate-400">Total Users</div>
        </div>
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
          <div className="text-2xl font-bold text-purple-400">{users.filter(u => u.is_super_admin).length}</div>
          <div className="text-sm text-slate-400">Super Admins</div>
        </div>
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
          <div className="text-2xl font-bold text-cyan-400">{users.filter(u => u.is_admin).length}</div>
          <div className="text-sm text-slate-400">Admins</div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-700/30">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Last Sign In</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-slate-700/20">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full flex items-center justify-center text-sm font-bold">
                      {(user.full_name?.[0] || user.email[0]).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{user.full_name || 'Unknown'}</div>
                      <div className="text-xs text-slate-500">ID: {user.id.slice(0, 8)}...</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-300">{user.email}</td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex gap-2">
                    {user.is_super_admin && (
                      <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs font-medium">
                        🛡️ Super Admin
                      </span>
                    )}
                    {user.is_admin && !user.is_super_admin && (
                      <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded-full text-xs font-medium">
                        👤 Admin
                      </span>
                    )}
                    {!user.is_admin && (
                      <span className="px-2 py-1 bg-slate-500/20 text-slate-400 rounded-full text-xs font-medium">
                        User
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-400">
                  {user.last_sign_in_at
                    ? new Date(user.last_sign_in_at).toLocaleDateString()
                    : 'Never'}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => setSelectedUser(user)}
                    className="text-cyan-400 hover:text-cyan-300 text-sm font-medium"
                  >
                    Manage
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          No users found matching "{searchQuery}"
        </div>
      )}

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Manage User</h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* User Info */}
              <div className="bg-slate-700/30 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full flex items-center justify-center text-lg font-bold">
                    {(selectedUser.full_name?.[0] || selectedUser.email[0]).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white truncate">
                      {selectedUser.full_name || 'Unknown'}
                    </div>
                    <div className="text-sm text-slate-400 truncate">{selectedUser.email}</div>
                  </div>
                </div>
                <div className="text-xs text-slate-500">
                  <div>User ID: {selectedUser.id}</div>
                  <div>Joined: {new Date(selectedUser.created_at).toLocaleDateString()}</div>
                  <div>
                    Last Sign In:{' '}
                    {selectedUser.last_sign_in_at
                      ? new Date(selectedUser.last_sign_in_at).toLocaleDateString()
                      : 'Never'}
                  </div>
                </div>
              </div>

              {/* Current Role */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">Current Role</label>
                <div className="flex gap-2">
                  {selectedUser.is_super_admin && (
                    <span className="px-3 py-2 bg-purple-500/20 text-purple-400 rounded-lg text-sm font-medium">
                      🛡️ Super Admin
                    </span>
                  )}
                  {selectedUser.is_admin && !selectedUser.is_super_admin && (
                    <span className="px-3 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg text-sm font-medium">
                      👤 Admin
                    </span>
                  )}
                  {!selectedUser.is_admin && (
                    <span className="px-3 py-2 bg-slate-500/20 text-slate-400 rounded-lg text-sm font-medium">
                      Regular User
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="border-t border-slate-700/50 pt-4">
                <label className="block text-sm text-slate-400 mb-3">Change Permissions</label>
                <div className="space-y-2">
                  {!selectedUser.is_admin && (
                    <button
                      onClick={() => toggleAdminStatus(selectedUser, true, false)}
                      className="w-full px-4 py-3 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg transition-colors text-sm font-medium"
                    >
                      ⬆️ Make Admin
                    </button>
                  )}

                  {selectedUser.is_admin && !selectedUser.is_super_admin && (
                    <>
                      <button
                        onClick={() => toggleAdminStatus(selectedUser, true, true)}
                        className="w-full px-4 py-3 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-colors text-sm font-medium"
                      >
                        ⬆️ Promote to Super Admin
                      </button>
                      <button
                        onClick={() => toggleAdminStatus(selectedUser, false, false)}
                        className="w-full px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors text-sm font-medium"
                      >
                        ⬇️ Remove Admin Access
                      </button>
                    </>
                  )}

                  {selectedUser.is_super_admin && (
                    <button
                      onClick={() => toggleAdminStatus(selectedUser, true, false)}
                      className="w-full px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors text-sm font-medium"
                    >
                      ⬇️ Demote to Regular Admin
                    </button>
                  )}
                </div>
              </div>

              <button
                onClick={() => setSelectedUser(null)}
                className="w-full px-4 py-2 border border-slate-600 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
