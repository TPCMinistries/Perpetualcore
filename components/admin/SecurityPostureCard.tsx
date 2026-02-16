"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Shield } from "lucide-react";

interface SecurityPostureCardProps {
  ssoEnabled: boolean;
  mfaEnforced: boolean;
  ipWhitelistActive: boolean;
  auditLogsEnabled: boolean;
  dataRetentionConfigured: boolean;
}

export default function SecurityPostureCard({
  ssoEnabled,
  mfaEnforced,
  ipWhitelistActive,
  auditLogsEnabled,
  dataRetentionConfigured,
}: SecurityPostureCardProps) {
  const items = [
    { label: "SSO Configured", enabled: ssoEnabled },
    { label: "MFA Enforced", enabled: mfaEnforced },
    { label: "IP Whitelist Active", enabled: ipWhitelistActive },
    { label: "Audit Logging", enabled: auditLogsEnabled },
    { label: "Data Retention Policy", enabled: dataRetentionConfigured },
  ];

  const enabledCount = items.filter((i) => i.enabled).length;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Shield className="h-4 w-4 text-slate-500" />
          Security Posture
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-lg font-bold mb-3">
          {enabledCount}/{items.length} controls active
        </div>
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-sm">
              {item.enabled ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-gray-300" />
              )}
              <span className={item.enabled ? "text-gray-900" : "text-gray-400"}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
