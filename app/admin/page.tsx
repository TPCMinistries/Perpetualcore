'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/hooks/useAuth';
import { createClient } from '../../lib/supabase/client';
import OrganizationManagement from '../components/OrganizationManagement';
import UserManagement from '../components/UserManagement';

const supabase = createClient();

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  is_super_admin: boolean;
  is_admin: boolean;
  created_at: string;
  last_sign_in_at: string | null;
}

export default function AdminPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'organizations' | 'invitations'>('organizations');

  // Check if user is super admin
  useEffect(() => {
    async function checkAdminStatus() {
      if (!isAuthenticated || !user) {
        router.push('/');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('is_super_admin, is_admin')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error checking admin status:', error);
          router.push('/');
          return;
        }

        if (!data?.is_super_admin) {
          alert('Access denied. Super admin privileges required.');
          router.push('/');
          return;
        }

        setIsSuperAdmin(true);
      } catch (error) {
        console.error('Error:', error);
        router.push('/');
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      checkAdminStatus();
    }
  }, [isAuthenticated, user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-slate-300">Verifying admin access...</div>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <div className="border-b border-slate-700/50 bg-slate-900/95 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                🛡️ Super Admin Panel
              </h1>
              <p className="text-slate-400 text-sm">Full system control & management</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-400">{user?.email}</span>
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-all duration-200"
              >
                ← Back to Site
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-slate-700/50 bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('organizations')}
              className={`px-4 py-3 font-medium transition-all duration-200 border-b-2 ${
                activeTab === 'organizations'
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              🏢 Organizations
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-3 font-medium transition-all duration-200 border-b-2 ${
                activeTab === 'users'
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              👥 Users
            </button>
            <button
              onClick={() => setActiveTab('invitations')}
              className={`px-4 py-3 font-medium transition-all duration-200 border-b-2 ${
                activeTab === 'invitations'
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              📧 Beta Invitations
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'organizations' && <OrganizationManagement />}
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'invitations' && <BetaInvitations />}
      </div>
    </div>
  );
}

// Beta Invitations Component
function BetaInvitations() {
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newInvite, setNewInvite] = useState({ email: '', orgId: '' });

  useEffect(() => {
    loadInvitations();
  }, []);

  async function loadInvitations() {
    try {
      const { data, error } = await supabase
        .from('beta_invitations')
        .select(`
          *,
          organization:organizations(name),
          invited_by_user:auth.users!invited_by(email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvitations(data || []);
    } catch (error) {
      console.error('Error loading invitations:', error);
    } finally {
      setLoading(false);
    }
  }

  async function createInvitation() {
    if (!newInvite.email) {
      alert('Please enter an email address');
      return;
    }

    try {
      const invitationCode = Math.random().toString(36).substring(2, 15);

      const { error } = await supabase
        .from('beta_invitations')
        .insert({
          email: newInvite.email,
          invitation_code: invitationCode,
          organization_id: newInvite.orgId || null,
          invited_by: (await supabase.auth.getUser()).data.user?.id,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        });

      if (error) throw error;

      alert(`Invitation created! Code: ${invitationCode}`);
      setShowCreateModal(false);
      setNewInvite({ email: '', orgId: '' });
      loadInvitations();
    } catch (error: any) {
      alert(`Error creating invitation: ${error.message}`);
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-slate-400">Loading invitations...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Beta Invitations</h2>
          <p className="text-sm text-slate-400">Manage beta testing access</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white rounded-xl transition-all duration-200"
        >
          + Create Invitation
        </button>
      </div>

      <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-700/30">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Organization</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Expires</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30">
            {invitations.map((inv) => (
              <tr key={inv.id} className="hover:bg-slate-700/20">
                <td className="px-6 py-4 text-sm text-white">{inv.email}</td>
                <td className="px-6 py-4 text-sm font-mono text-cyan-400">{inv.invitation_code}</td>
                <td className="px-6 py-4 text-sm text-slate-400">
                  {inv.organization?.name || 'General Access'}
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    inv.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                    inv.status === 'accepted' ? 'bg-green-500/20 text-green-400' :
                    'bg-slate-500/20 text-slate-400'
                  }`}>
                    {inv.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-400">
                  {inv.expires_at ? new Date(inv.expires_at).toLocaleDateString() : 'No expiration'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-white mb-4">Create Beta Invitation</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Email Address</label>
                <input
                  type="email"
                  value={newInvite.email}
                  onChange={(e) => setNewInvite({ ...newInvite, email: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  placeholder="user@example.com"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-600 text-slate-300 rounded-xl hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={createInvitation}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-xl"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
