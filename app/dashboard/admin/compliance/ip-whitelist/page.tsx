"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Globe, Shield, Pencil } from "lucide-react";
import Link from "next/link";
import IPWhitelistForm from "@/components/admin/IPWhitelistForm";

interface IPRule {
  id: string;
  ip_range: string;
  label: string;
  description: string | null;
  enabled: boolean;
  created_at: string;
}

export default function IPWhitelistPage() {
  const [rules, setRules] = useState<IPRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<IPRule | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function loadRules() {
    try {
      const res = await fetch("/api/admin/compliance/ip-whitelist");
      const data = await res.json();
      setRules(data.rules ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRules();
  }, []);

  async function handleCreate(data: { ip_range: string; label: string; description: string }) {
    const res = await fetch("/api/admin/compliance/ip-whitelist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create rule");
    setShowForm(false);
    loadRules();
  }

  async function handleUpdate(data: { ip_range: string; label: string; description: string }) {
    if (!editingRule) return;
    const res = await fetch(`/api/admin/compliance/ip-whitelist/${editingRule.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update rule");
    setEditingRule(null);
    loadRules();
  }

  async function handleToggle(rule: IPRule) {
    await fetch(`/api/admin/compliance/ip-whitelist/${rule.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !rule.enabled }),
    });
    loadRules();
  }

  async function handleDelete(ruleId: string) {
    setDeleting(ruleId);
    try {
      await fetch(`/api/admin/compliance/ip-whitelist/${ruleId}`, { method: "DELETE" });
      loadRules();
    } finally {
      setDeleting(null);
    }
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">IP Whitelist</h1>
          <p className="text-gray-600 mt-1">
            Restrict access to trusted IP addresses and ranges
          </p>
        </div>
        <Button onClick={() => { setShowForm(true); setEditingRule(null); }}>
          <Plus className="h-4 w-4 mr-1.5" />
          Add Rule
        </Button>
      </div>

      <div className="flex gap-2 text-sm">
        <Link
          href="/dashboard/admin/compliance"
          className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          &larr; Compliance Overview
        </Link>
      </div>

      {/* Info Banner */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4 flex items-start gap-3">
          <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">How IP Whitelisting Works</p>
            <p className="mt-1 text-blue-700">
              When enabled, only requests from whitelisted IP ranges will be allowed.
              If no rules are defined, all IPs are permitted. Use CIDR notation for ranges.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Form */}
      {(showForm || editingRule) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {editingRule ? "Edit Rule" : "Add IP Whitelist Rule"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <IPWhitelistForm
              onSubmit={editingRule ? handleUpdate : handleCreate}
              onCancel={() => { setShowForm(false); setEditingRule(null); }}
              initialData={editingRule ? {
                ip_range: editingRule.ip_range,
                label: editingRule.label,
                description: editingRule.description ?? "",
              } : undefined}
            />
          </CardContent>
        </Card>
      )}

      {/* Rules List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Globe className="h-5 w-5 text-slate-500" />
            Whitelist Rules ({rules.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              No IP whitelist rules configured. All IPs are currently allowed.
            </div>
          ) : (
            <div className="space-y-3">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    rule.enabled ? "bg-white" : "bg-gray-50 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={() => handleToggle(rule)}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono bg-gray-100 px-2 py-0.5 rounded">
                          {rule.ip_range}
                        </code>
                        <span className="font-medium text-sm">{rule.label}</span>
                        {!rule.enabled && (
                          <Badge variant="outline" className="text-xs">Disabled</Badge>
                        )}
                      </div>
                      {rule.description && (
                        <p className="text-xs text-gray-500 mt-0.5">{rule.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setEditingRule(rule); setShowForm(false); }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(rule.id)}
                      disabled={deleting === rule.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
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
