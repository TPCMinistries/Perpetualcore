"use client";

import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Bot, Activity, Save } from "lucide-react";
import { DashboardPageWrapper, DashboardHeader } from "@/components/ui/dashboard-header";
import { IdentityForm } from "@/components/agent/IdentityForm";
import type { AgentIdentity, AgentIdentityUpdate } from "@/lib/agent-workspace/types";

export default function AgentSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [identity, setIdentity] = useState<AgentIdentity | null>(null);

  useEffect(() => {
    loadIdentity();
  }, []);

  async function loadIdentity() {
    try {
      const res = await fetch("/api/agent/identity");
      if (!res.ok) throw new Error("Failed to fetch identity");
      const data = await res.json();
      setIdentity(data.identity || null);
    } catch (error) {
      console.error("Error loading agent identity:", error);
      toast.error("Failed to load agent identity");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(update: AgentIdentityUpdate) {
    setSaving(true);
    try {
      const res = await fetch("/api/agent/identity", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }

      const data = await res.json();
      setIdentity(data.identity);
      toast.success("Agent identity saved successfully");
    } catch (error: any) {
      console.error("Error saving agent identity:", error);
      toast.error(error.message || "Failed to save agent identity");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    try {
      const res = await fetch("/api/agent/identity", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setIdentity(null);
      toast.success("Agent identity removed");
    } catch (error) {
      console.error("Error deleting agent identity:", error);
      toast.error("Failed to delete agent identity");
    }
  }

  if (loading) {
    return (
      <DashboardPageWrapper maxWidth="6xl">
        <div className="space-y-6">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <div className="grid gap-6 lg:grid-cols-3">
            <Skeleton className="h-80 rounded-xl lg:col-span-2" />
            <Skeleton className="h-80 rounded-xl" />
          </div>
        </div>
      </DashboardPageWrapper>
    );
  }

  return (
    <DashboardPageWrapper maxWidth="6xl">
      <DashboardHeader
        title="Agent Persona"
        subtitle="Configure your AI assistant's personality, communication style, and boundaries"
        icon={Bot}
        iconColor="indigo"
        stats={[
          {
            label: "status",
            value: identity?.isActive ? "Active" : "Not configured",
          },
        ]}
        actions={[
          {
            label: "Activity Feed",
            icon: Activity,
            href: "/dashboard/agent/activity",
            variant: "outline",
          },
        ]}
      />

      <IdentityForm
        identity={identity}
        onSave={handleSave}
        onDelete={handleDelete}
        saving={saving}
      />
    </DashboardPageWrapper>
  );
}
