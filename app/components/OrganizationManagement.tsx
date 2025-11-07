'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase/client';

interface Organization {
  id: string;
  name: string;
  slug: string;
  subscription_tier: string;
  is_beta_tester: boolean;
  member_count: number;
  created_at: string;
}

interface Member {
  id: string;
  user_id: string;
  role: string;
  status: string;
  user_email: string;
}

export default function OrganizationManagement() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [orgMembers, setOrgMembers] = useState<Member[]>([]);
  const [newOrg, setNewOrg] = useState({
    name: '',
    slug: '',
    ownerEmail: '',
  });

  useEffect(() => {
    loadOrganizations();
  }, []);

  async function loadOrganizations() {
    try {
      // Use the admin function to get all organizations
      const { data, error } = await supabase.rpc('admin_get_all_organizations');

      if (error) throw error;
      setOrganizations(data || []);
    } catch (error) {
      console.error('Error loading organizations:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadOrgMembers(orgId: string) {
    try {
      const { data, error } = await supabase
        .from('organization_members')
        .select(`
          *,
          user:auth.users!user_id(email)
        `)
        .eq('organization_id', orgId);

      if (error) throw error;

      const members = data?.map((m: any) => ({
        id: m.id,
        user_id: m.user_id,
        role: m.role,
        status: m.status,
        user_email: m.user?.email || 'Unknown',
      })) || [];

      setOrgMembers(members);
    } catch (error) {
      console.error('Error loading members:', error);
    }
  }

  async function createOrganization() {
    if (!newOrg.name || !newOrg.slug || !newOrg.ownerEmail) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const { data, error } = await supabase.rpc('admin_create_organization', {
        org_name: newOrg.name,
        org_slug: newOrg.slug,
        owner_email: newOrg.ownerEmail,
      });

      if (error) throw error;

      alert('Organization created successfully!');
      setShowCreateModal(false);
      setNewOrg({ name: '', slug: '', ownerEmail: '' });
      loadOrganizations();
    } catch (error: any) {
      alert(`Error creating organization: ${error.message}`);
    }
  }

  function handleOrgClick(org: Organization) {
    setSelectedOrg(org);
    loadOrgMembers(org.id);
  }

  if (loading) {
    return <div className="text-center py-12 text-slate-400">Loading organizations...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Organizations</h2>
          <p className="text-sm text-slate-400">Manage teams and workspaces</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white rounded-xl transition-all duration-200"
        >
          + Create Organization
        </button>
      </div>

      {/* Organizations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {organizations.map((org) => (
          <div
            key={org.id}
            onClick={() => handleOrgClick(org)}
            className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6 hover:bg-slate-700/50 cursor-pointer transition-all duration-200"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-white truncate">{org.name}</h3>
                <p className="text-sm text-slate-400 truncate">/{org.slug}</p>
              </div>
              {org.is_beta_tester && (
                <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full whitespace-nowrap ml-2">
                  Beta
                </span>
              )}
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-slate-400">
                <span>👥</span>
                <span>{org.member_count} members</span>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs ${
                org.subscription_tier === 'enterprise' ? 'bg-purple-500/20 text-purple-400' :
                org.subscription_tier === 'team' ? 'bg-cyan-500/20 text-cyan-400' :
                'bg-slate-500/20 text-slate-400'
              }`}>
                {org.subscription_tier}
              </span>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-700/50 text-xs text-slate-500">
              Created {new Date(org.created_at).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>

      {organizations.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏢</div>
          <p className="text-slate-400 mb-4">No organizations yet</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-xl"
          >
            Create First Organization
          </button>
        </div>
      )}

      {/* Create Organization Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-white mb-4">Create Organization</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Organization Name</label>
                <input
                  type="text"
                  value={newOrg.name}
                  onChange={(e) => setNewOrg({ ...newOrg, name: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  placeholder="Acme Corporation"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Slug (URL identifier)</label>
                <input
                  type="text"
                  value={newOrg.slug}
                  onChange={(e) => setNewOrg({ ...newOrg, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white font-mono"
                  placeholder="acme-corp"
                />
                <p className="text-xs text-slate-500 mt-1">Only lowercase letters, numbers, and hyphens</p>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Owner Email</label>
                <input
                  type="email"
                  value={newOrg.ownerEmail}
                  onChange={(e) => setNewOrg({ ...newOrg, ownerEmail: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  placeholder="owner@acme.com"
                />
                <p className="text-xs text-slate-500 mt-1">User must already be registered</p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewOrg({ name: '', slug: '', ownerEmail: '' });
                  }}
                  className="flex-1 px-4 py-2 border border-slate-600 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createOrganization}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-xl font-medium transition-colors"
                >
                  Create Organization
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Organization Details Modal */}
      {selectedOrg && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-white">{selectedOrg.name}</h3>
                <p className="text-sm text-slate-400">/{selectedOrg.slug}</p>
              </div>
              <button
                onClick={() => setSelectedOrg(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Org Details */}
              <div className="bg-slate-700/30 rounded-lg p-4">
                <h4 className="font-semibold text-white mb-3">Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-400">Subscription:</span>
                    <span className="text-white ml-2 capitalize">{selectedOrg.subscription_tier}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Members:</span>
                    <span className="text-white ml-2">{selectedOrg.member_count}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Beta Tester:</span>
                    <span className="text-white ml-2">{selectedOrg.is_beta_tester ? 'Yes' : 'No'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Created:</span>
                    <span className="text-white ml-2">{new Date(selectedOrg.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Members */}
              <div>
                <h4 className="font-semibold text-white mb-3">Members</h4>
                <div className="space-y-2">
                  {orgMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full flex items-center justify-center text-sm font-bold">
                          {member.user_email[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">{member.user_email}</div>
                          <div className="text-xs text-slate-400 capitalize">{member.role}</div>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        member.status === 'active' ? 'bg-green-500/20 text-green-400' :
                        'bg-slate-500/20 text-slate-400'
                      }`}>
                        {member.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
