"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Users, Shield, Key } from "lucide-react";
import Link from "next/link";
import OrgMembersTable from "@/components/admin/OrgMembersTable";
import SecurityPostureCard from "@/components/admin/SecurityPostureCard";

interface OrgDetail {
  organization: {
    id: string;
    name: string;
    slug: string;
    created_at: string;
  };
  members: Array<{
    id: string;
    email: string;
    full_name: string | null;
    role: string;
    created_at: string;
  }>;
  sso_providers: Array<{
    id: string;
    provider_name: string;
    provider_type: string;
    enabled: boolean;
  }>;
  attestations: Array<{
    id: string;
    attestation_type: string;
    title: string;
    status: string;
    expires_at: string | null;
  }>;
}

export default function OrgDetailPage() {
  const params = useParams();
  const orgId = params.id as string;
  const [data, setData] = useState<OrgDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/organizations/${orgId}`)
      .then((res) => res.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orgId]);

  if (loading) {
    return (
      <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-gray-500">
        Organization not found or you don&apos;t have access.
      </div>
    );
  }

  const { organization: org, members, sso_providers, attestations } = data;
  const hasSSOEnabled = sso_providers.some((p) => p.enabled);
  const hasActiveAttestations = attestations.some((a) => a.status === "completed");

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="p-3 bg-slate-100 rounded-lg">
            <Building2 className="h-6 w-6 text-slate-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{org.name}</h1>
            <p className="text-gray-500">/{org.slug}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 text-sm">
        <Link
          href="/dashboard/admin/organizations"
          className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          &larr; All Organizations
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Members */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-slate-500" />
              Members ({members.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <OrgMembersTable
              members={members.map((m) => ({ ...m, mfa_enabled: false }))}
            />
          </CardContent>
        </Card>

        {/* Security Sidebar */}
        <div className="space-y-4">
          <SecurityPostureCard
            ssoEnabled={hasSSOEnabled}
            mfaEnforced={false}
            ipWhitelistActive={false}
            auditLogsEnabled={true}
            dataRetentionConfigured={false}
          />

          {/* SSO Providers */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Key className="h-4 w-4 text-slate-500" />
                SSO Providers
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sso_providers.length === 0 ? (
                <p className="text-sm text-gray-500">No SSO configured</p>
              ) : (
                <div className="space-y-2">
                  {sso_providers.map((provider) => (
                    <div key={provider.id} className="flex items-center justify-between text-sm">
                      <span>{provider.provider_name}</span>
                      <Badge variant={provider.enabled ? "default" : "outline"} className="text-xs">
                        {provider.provider_type}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Compliance */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="h-4 w-4 text-slate-500" />
                Compliance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {attestations.length === 0 ? (
                <p className="text-sm text-gray-500">No attestations on file</p>
              ) : (
                <div className="space-y-2">
                  {attestations.map((att) => (
                    <div key={att.id} className="flex items-center justify-between text-sm">
                      <span>{att.title}</span>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          att.status === "completed" ? "text-green-600" : "text-yellow-600"
                        }`}
                      >
                        {att.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Info */}
          <Card>
            <CardContent className="p-4 text-sm text-gray-500 space-y-1">
              <p>Created: {new Date(org.created_at).toLocaleDateString()}</p>
              <p>Org ID: <code className="text-xs bg-gray-100 px-1 rounded">{org.id}</code></p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
