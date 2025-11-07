'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/hooks/useAuth';
import { createClient } from '../../lib/supabase/client';
import OrganizationManagement from '../components/OrganizationManagement';
import UserManagement from '../components/UserManagement';
import Link from 'next/link';
import { ArrowLeft, Shield, Mail } from 'lucide-react';
import { sendBetaCodeEmail } from '@/lib/email/send-beta-code';

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
      console.log('[Admin] Auth check:', { isAuthenticated, user: user?.email, authLoading });

      if (!isAuthenticated || !user) {
        console.log('[Admin] Not authenticated, redirecting to home');
        router.push('/');
        return;
      }

      try {
        console.log('[Admin] Checking user_profiles for user:', user.id);
        const { data, error } = await supabase
          .from('user_profiles')
          .select('is_super_admin, is_admin')
          .eq('id', user.id)
          .single();

        console.log('[Admin] user_profiles query result:', { data, error });

        if (error) {
          console.error('[Admin] Error checking admin status:', error);
          router.push('/');
          return;
        }

        if (!data?.is_super_admin) {
          console.log('[Admin] User is not super admin:', data);
          alert('Access denied. Super admin privileges required.');
          router.push('/');
          return;
        }

        console.log('[Admin] User is super admin, showing panel');
        setIsSuperAdmin(true);
      } catch (error) {
        console.error('[Admin] Error:', error);
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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-slate-600 dark:text-slate-400">Verifying admin access...</div>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Dashboard</span>
              </Link>
              <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-500">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    Super Admin Panel
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    System control & management
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-600 dark:text-slate-400">{user?.email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('organizations')}
              className={`px-4 py-3 text-sm font-medium transition-all duration-200 border-b-2 ${
                activeTab === 'organizations'
                  ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              🏢 Organizations
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-3 text-sm font-medium transition-all duration-200 border-b-2 ${
                activeTab === 'users'
                  ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              👥 Users
            </button>
            <button
              onClick={() => setActiveTab('invitations')}
              className={`px-4 py-3 text-sm font-medium transition-all duration-200 border-b-2 ${
                activeTab === 'invitations'
                  ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              🎟️ Beta Codes
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
  const [newInvite, setNewInvite] = useState({
    email: '',
    maxUses: 1,
    betaTier: 'standard' as 'standard' | 'premium' | 'unlimited'
  });

  useEffect(() => {
    loadInvitations();
  }, []);

  async function loadInvitations() {
    try {
      const { data, error } = await supabase
        .from('beta_invite_codes')
        .select('*')
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
      // Generate a random 8-character code (uppercase)
      const invitationCode = Math.random().toString(36).substring(2, 10).toUpperCase();

      const { error } = await supabase
        .from('beta_invite_codes')
        .insert({
          code: invitationCode,
          max_uses: newInvite.maxUses,
          uses_count: 0,
          beta_tier: newInvite.betaTier,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
          created_by: (await supabase.auth.getUser()).data.user?.id,
          notes: `Created for ${newInvite.email}`,
        });

      if (error) throw error;

      alert(`Beta code created! Code: ${invitationCode}\n\nSend this code to ${newInvite.email} to sign up.`);
      setShowCreateModal(false);
      setNewInvite({ email: '', maxUses: 1, betaTier: 'standard' });
      loadInvitations();
    } catch (error: any) {
      alert(`Error creating beta code: ${error.message}`);
    }
  }

  async function sendEmail(code: string, email: string, betaTier: string) {
    if (!email || email === '-') {
      alert('No email address found for this code. Please add an email in the notes field.');
      return;
    }

    if (!confirm(`Send beta code instructions to ${email}?`)) {
      return;
    }

    try {
      const result = await sendBetaCodeEmail({
        email,
        betaCode: code,
        betaTier,
      });

      if (result.error) {
        alert(`Error sending email: ${result.error}`);
      } else {
        alert(`✅ Email sent successfully to ${email}!`);
      }
    } catch (error: any) {
      alert(`Error sending email: ${error.message}`);
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-slate-600 dark:text-slate-400">Loading beta codes...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Beta Codes</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">Manage beta testing access codes</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white rounded-lg transition-all duration-200 shadow-sm"
        >
          + Create Code
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-800/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">For</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">Tier</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">Uses</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">Expires</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {invitations.map((inv) => {
              // Extract email from notes (format: "Created for email@example.com")
              const emailMatch = inv.notes?.match(/Created for (.+)/);
              const forEmail = emailMatch ? emailMatch[1] : inv.notes || '-';

              return (
                <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-mono text-cyan-600 dark:text-cyan-400 font-bold">{inv.code}</td>
                  <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-300">{forEmail}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs capitalize font-medium ${
                      inv.beta_tier === 'unlimited' ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400' :
                      inv.beta_tier === 'premium' ? 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400' :
                      'bg-slate-100 dark:bg-slate-500/20 text-slate-700 dark:text-slate-400'
                    }`}>
                      {inv.beta_tier}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-300">
                    {inv.uses_count} / {inv.max_uses}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                    {inv.expires_at ? new Date(inv.expires_at).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-500">
                    {new Date(inv.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => sendEmail(inv.code, forEmail, inv.beta_tier)}
                      disabled={!forEmail || forEmail === '-'}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg text-xs font-medium transition-colors"
                      title={forEmail && forEmail !== '-' ? `Send instructions to ${forEmail}` : 'No email address'}
                    >
                      <Mail className="w-3.5 h-3.5" />
                      Send Email
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">Create Beta Code</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email (for reference)</label>
                <input
                  type="email"
                  value={newInvite.email}
                  onChange={(e) => setNewInvite({ ...newInvite, email: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="user@example.com"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Who will use this code?</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Beta Tier</label>
                <select
                  value={newInvite.betaTier}
                  onChange={(e) => setNewInvite({ ...newInvite, betaTier: e.target.value as any })}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                >
                  <option value="standard">Standard</option>
                  <option value="premium">Premium</option>
                  <option value="unlimited">Unlimited</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Max Uses</label>
                <input
                  type="number"
                  min="1"
                  value={newInvite.maxUses}
                  onChange={(e) => setNewInvite({ ...newInvite, maxUses: parseInt(e.target.value) || 1 })}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">How many people can use this code?</p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createInvitation}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-lg font-medium hover:from-cyan-600 hover:to-purple-600 transition-all shadow-sm"
                >
                  Create Code
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
