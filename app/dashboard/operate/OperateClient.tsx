"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Rocket,
  ArrowRight,
  CheckCircle2,
  Loader2,
  ExternalLink,
  LayoutGrid,
  Users,
  Mail,
  Calendar,
  BarChart3,
  Zap,
} from "lucide-react";
import Link from "next/link";

interface OperateClientProps {
  hasAccess: boolean;
  isProvisioned: boolean;
  embedUrl: string | null;
  userId: string;
  currentPlan: string;
}

const OPERATE_FEATURES = [
  {
    icon: LayoutGrid,
    title: "CRM & Pipelines",
    description: "Track deals, manage contacts, and visualize your sales pipeline",
  },
  {
    icon: Mail,
    title: "Email & SMS Campaigns",
    description: "Automated sequences, broadcasts, and drip campaigns",
  },
  {
    icon: Calendar,
    title: "Calendar & Booking",
    description: "Scheduling links, appointment reminders, and team calendars",
  },
  {
    icon: Users,
    title: "Client Portals",
    description: "Branded portals for coaching clients and consulting engagements",
  },
  {
    icon: Zap,
    title: "Automation & Workflows",
    description: "Trigger-based automations that run your business on autopilot",
  },
  {
    icon: BarChart3,
    title: "Funnels & Landing Pages",
    description: "High-converting pages and multi-step funnels with analytics",
  },
];

export function OperateClient({
  hasAccess,
  isProvisioned,
  embedUrl,
  userId,
  currentPlan,
}: OperateClientProps) {
  const [isProvisionLoading, setIsProvisionLoading] = useState(false);
  const [provisionError, setProvisionError] = useState<string | null>(null);
  const [activeEmbedUrl, setActiveEmbedUrl] = useState(embedUrl);

  async function handleProvision() {
    setIsProvisionLoading(true);
    setProvisionError(null);

    try {
      const res = await fetch("/api/ghl/provision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setProvisionError(data.error || "Failed to set up your business account");
        return;
      }

      // Reload the page to get the embed URL from server
      window.location.reload();
    } catch (err) {
      setProvisionError("Something went wrong. Please try again.");
    } finally {
      setIsProvisionLoading(false);
    }
  }

  // State 1: No access — show upgrade CTA
  if (!hasAccess) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Operate</h1>
          <p className="text-muted-foreground mt-1">
            Your all-in-one business operations suite
          </p>
        </div>

        {/* Upgrade Card */}
        <div className="rounded-2xl border bg-gradient-to-br from-violet-500/5 via-background to-blue-500/5 p-8 text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center mb-6">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-xl font-semibold mb-2">
            Unlock Your Business OS
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            Upgrade to Pro or above to get a full business operations suite —
            CRM, pipelines, funnels, email/SMS campaigns, booking, client
            portals, and automations.
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            You&apos;re currently on the{" "}
            <span className="font-medium text-foreground capitalize">
              {currentPlan}
            </span>{" "}
            plan.
          </p>
          <Link href="/dashboard/settings">
            <Button
              size="lg"
              className="bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700"
            >
              Upgrade to Pro
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {OPERATE_FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border bg-card p-5 opacity-60"
            >
              <feature.icon className="h-5 w-5 text-violet-500 mb-3" />
              <h3 className="font-medium text-sm mb-1">{feature.title}</h3>
              <p className="text-xs text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // State 2: Has access but not provisioned — show setup
  if (!isProvisioned || !activeEmbedUrl) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Operate</h1>
          <p className="text-muted-foreground mt-1">
            Your all-in-one business operations suite
          </p>
        </div>

        <div className="rounded-2xl border bg-gradient-to-br from-green-500/5 via-background to-violet-500/5 p-8 text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-6">
            <Rocket className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-xl font-semibold mb-2">
            Set Up Your Business OS
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            Your plan includes the OPERATE suite. Let&apos;s set up your
            business account with CRM, pipelines, automations, and more.
          </p>

          {provisionError && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 text-red-600 text-sm max-w-md mx-auto">
              {provisionError}
            </div>
          )}

          <Button
            size="lg"
            onClick={handleProvision}
            disabled={isProvisionLoading}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          >
            {isProvisionLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Setting up your account...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Activate Business OS
              </>
            )}
          </Button>
        </div>

        {/* Feature Preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {OPERATE_FEATURES.map((feature) => (
            <div key={feature.title} className="rounded-xl border bg-card p-5">
              <feature.icon className="h-5 w-5 text-violet-500 mb-3" />
              <h3 className="font-medium text-sm mb-1">{feature.title}</h3>
              <p className="text-xs text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // State 3: Provisioned — show GHL embed
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Operate</h1>
          <p className="text-muted-foreground mt-1">
            Your business operations suite
          </p>
        </div>
        <a
          href={activeEmbedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Open in new tab
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      <div className="rounded-xl border overflow-hidden bg-background" style={{ height: "calc(100vh - 180px)" }}>
        <iframe
          src={activeEmbedUrl}
          className="w-full h-full border-0"
          allow="camera; microphone; clipboard-write; clipboard-read"
          title="Perpetual Core Operate — Business OS"
        />
      </div>
    </div>
  );
}
