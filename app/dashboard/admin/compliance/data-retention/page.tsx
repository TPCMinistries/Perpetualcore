"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Database, Archive, Trash2, Save } from "lucide-react";
import Link from "next/link";

interface RetentionPolicy {
  id: string;
  resource_type: string;
  retention_days: number;
  auto_delete: boolean;
  archive_before_delete: boolean;
  last_cleanup_at: string | null;
}

const RESOURCE_TYPES = [
  { type: "audit_logs", label: "Audit Logs", icon: Database, description: "Security and activity logs" },
  { type: "conversations", label: "Conversations", icon: Database, description: "AI chat conversations" },
  { type: "documents", label: "Documents", icon: Database, description: "Uploaded documents and files" },
  { type: "voice_memos", label: "Voice Memos", icon: Database, description: "Voice recordings and transcripts" },
  { type: "analytics", label: "Analytics Data", icon: Database, description: "Usage and performance analytics" },
] as const;

export default function DataRetentionPage() {
  const [policies, setPolicies] = useState<RetentionPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  // Track form state per resource type
  const [formState, setFormState] = useState<Record<string, {
    retention_days: number;
    auto_delete: boolean;
    archive_before_delete: boolean;
  }>>({});

  useEffect(() => {
    fetch("/api/admin/compliance/data-retention")
      .then((res) => res.json())
      .then((data) => {
        setPolicies(data.policies);
        const state: typeof formState = {};
        for (const rt of RESOURCE_TYPES) {
          const existing = data.policies.find((p: RetentionPolicy) => p.resource_type === rt.type);
          state[rt.type] = {
            retention_days: existing?.retention_days ?? 365,
            auto_delete: existing?.auto_delete ?? false,
            archive_before_delete: existing?.archive_before_delete ?? true,
          };
        }
        setFormState(state);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function savePolicy(resourceType: string) {
    const current = formState[resourceType];
    if (!current) return;

    setSaving(resourceType);
    try {
      const res = await fetch("/api/admin/compliance/data-retention", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resource_type: resourceType,
          ...current,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setPolicies((prev) => {
          const idx = prev.findIndex((p) => p.resource_type === resourceType);
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = data.policy;
            return updated;
          }
          return [...prev, data.policy];
        });
      }
    } finally {
      setSaving(null);
    }
  }

  function updateField(resourceType: string, field: string, value: number | boolean) {
    setFormState((prev) => ({
      ...prev,
      [resourceType]: { ...prev[resourceType], [field]: value },
    }));
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Data Retention Policies</h1>
        <p className="text-muted-foreground mt-1">
          Configure how long data is retained and when it&apos;s automatically cleaned up
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

      <div className="space-y-4">
        {RESOURCE_TYPES.map(({ type, label, icon: Icon, description }) => {
          const state = formState[type];
          if (!state) return null;

          return (
            <Card key={type}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-medium">{label}</h3>
                      <p className="text-xs text-muted-foreground">{description}</p>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => savePolicy(type)}
                    disabled={saving === type}
                  >
                    <Save className="h-3.5 w-3.5 mr-1" />
                    {saving === type ? "Saving..." : "Save"}
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor={`${type}-days`}>Retention Period (days)</Label>
                    <Input
                      id={`${type}-days`}
                      type="number"
                      min={1}
                      max={3650}
                      value={state.retention_days}
                      onChange={(e) => updateField(type, "retention_days", parseInt(e.target.value) || 365)}
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-6">
                    <Switch
                      id={`${type}-auto`}
                      checked={state.auto_delete}
                      onCheckedChange={(v) => updateField(type, "auto_delete", v)}
                    />
                    <Label htmlFor={`${type}-auto`} className="flex items-center gap-1.5 text-sm">
                      <Trash2 className="h-3.5 w-3.5" />
                      Auto-delete expired
                    </Label>
                  </div>

                  <div className="flex items-center gap-3 pt-6">
                    <Switch
                      id={`${type}-archive`}
                      checked={state.archive_before_delete}
                      onCheckedChange={(v) => updateField(type, "archive_before_delete", v)}
                      disabled={!state.auto_delete}
                    />
                    <Label htmlFor={`${type}-archive`} className="flex items-center gap-1.5 text-sm">
                      <Archive className="h-3.5 w-3.5" />
                      Archive before delete
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
