"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Save, Shield, Clock, Users } from "lucide-react";
import Link from "next/link";
import SessionTable, { type ActiveSession } from "@/components/admin/SessionTable";

interface SessionPolicy {
  max_session_duration_hours: number;
  idle_timeout_minutes: number;
  enforce_mfa: boolean;
  max_concurrent_sessions: number;
  require_re_auth_for_sensitive: boolean;
  allowed_auth_methods: string[];
}

export default function SessionManagementPage() {
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [policy, setPolicy] = useState<SessionPolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingPolicy, setSavingPolicy] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/sessions").then((r) => r.json()),
      fetch("/api/admin/mfa-enforcement").then((r) => r.json()),
    ])
      .then(([sessionData, policyData]) => {
        setSessions(sessionData.sessions ?? []);
        setPolicy(policyData.policy);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleForceLogout(sessionId: string) {
    const res = await fetch(`/api/admin/sessions?session_id=${sessionId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    }
  }

  async function saveSessionPolicy() {
    if (!policy) return;
    setSavingPolicy(true);
    try {
      const res = await fetch("/api/admin/mfa-enforcement", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(policy),
      });
      if (res.ok) {
        const data = await res.json();
        setPolicy(data.policy);
      }
    } finally {
      setSavingPolicy(false);
    }
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Session Management</h1>
        <p className="text-muted-foreground mt-1">
          Manage active sessions, enforce MFA, and configure session policies
        </p>
      </div>

      <div className="flex gap-2 text-sm">
        <Link
          href="/dashboard/admin/compliance"
          className="px-3 py-1.5 bg-muted text-foreground rounded-lg hover:bg-muted"
        >
          &larr; Compliance Overview
        </Link>
      </div>

      {/* Session Policy */}
      {policy && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-slate-500" />
              Session Policy
            </CardTitle>
            <Button size="sm" onClick={saveSessionPolicy} disabled={savingPolicy}>
              <Save className="h-3.5 w-3.5 mr-1" />
              {savingPolicy ? "Saving..." : "Save Policy"}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="max-duration" className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Max Session Duration (hours)
                </Label>
                <Input
                  id="max-duration"
                  type="number"
                  min={1}
                  max={720}
                  value={policy.max_session_duration_hours}
                  onChange={(e) =>
                    setPolicy({ ...policy, max_session_duration_hours: parseInt(e.target.value) || 24 })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="idle-timeout" className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Idle Timeout (minutes)
                </Label>
                <Input
                  id="idle-timeout"
                  type="number"
                  min={5}
                  max={480}
                  value={policy.idle_timeout_minutes}
                  onChange={(e) =>
                    setPolicy({ ...policy, idle_timeout_minutes: parseInt(e.target.value) || 60 })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-concurrent" className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  Max Concurrent Sessions
                </Label>
                <Input
                  id="max-concurrent"
                  type="number"
                  min={1}
                  max={50}
                  value={policy.max_concurrent_sessions}
                  onChange={(e) =>
                    setPolicy({ ...policy, max_concurrent_sessions: parseInt(e.target.value) || 5 })
                  }
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Switch
                  id="enforce-mfa"
                  checked={policy.enforce_mfa}
                  onCheckedChange={(v) => setPolicy({ ...policy, enforce_mfa: v })}
                />
                <Label htmlFor="enforce-mfa">Enforce MFA for all users</Label>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Switch
                  id="re-auth-sensitive"
                  checked={policy.require_re_auth_for_sensitive}
                  onCheckedChange={(v) => setPolicy({ ...policy, require_re_auth_for_sensitive: v })}
                />
                <Label htmlFor="re-auth-sensitive">Re-authenticate for sensitive actions</Label>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-slate-500" />
            Active Sessions ({sessions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SessionTable sessions={sessions} onForceLogout={handleForceLogout} />
        </CardContent>
      </Card>
    </div>
  );
}
