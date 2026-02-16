"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Key, CheckCircle, XCircle, Building2 } from "lucide-react";
import Link from "next/link";

interface SSOProvider {
  id: string;
  organization_id: string;
  organization_name: string;
  provider_type: string;
  provider_name: string;
  enabled: boolean;
  enforce_sso: boolean;
  auto_provision_users: boolean;
  allowed_domains: string[] | null;
  created_at: string;
}

export default function SSOOverviewPage() {
  const [providers, setProviders] = useState<SSOProvider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/sso")
      .then((res) => res.json())
      .then((data) => setProviders(data.providers ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  const enabledCount = providers.filter((p) => p.enabled).length;
  const orgCount = new Set(providers.map((p) => p.organization_id)).size;

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">SSO Providers</h1>
        <p className="text-gray-600 mt-1">
          Overview of Single Sign-On configurations across all organizations
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-500">Total Providers</p>
            <p className="text-2xl font-bold mt-1">{providers.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-500">Active</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{enabledCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-500">Organizations with SSO</p>
            <p className="text-2xl font-bold mt-1">{orgCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Provider List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Key className="h-5 w-5 text-slate-500" />
            All SSO Providers
          </CardTitle>
        </CardHeader>
        <CardContent>
          {providers.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              <Key className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p>No SSO providers configured</p>
            </div>
          ) : (
            <div className="space-y-3">
              {providers.map((provider) => (
                <div
                  key={provider.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    provider.enabled ? "bg-white" : "bg-gray-50 opacity-60"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg">
                      <Key className="h-4 w-4 text-slate-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{provider.provider_name}</span>
                        <Badge variant="outline" className="text-xs uppercase">
                          {provider.provider_type}
                        </Badge>
                        {provider.enforce_sso && (
                          <Badge className="text-xs bg-purple-100 text-purple-700">Enforced</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        <Building2 className="h-3 w-3" />
                        <Link
                          href={`/dashboard/admin/organizations/${provider.organization_id}`}
                          className="hover:underline"
                        >
                          {provider.organization_name}
                        </Link>
                        {provider.allowed_domains && provider.allowed_domains.length > 0 && (
                          <span>
                            | Domains: {provider.allowed_domains.join(", ")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {provider.auto_provision_users && (
                      <Badge variant="outline" className="text-xs">Auto-provision</Badge>
                    )}
                    {provider.enabled ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-gray-300" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
