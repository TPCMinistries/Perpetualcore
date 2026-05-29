"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  CalendarClock,
  CheckCircle2,
  Clipboard,
  FileText,
  Loader2,
  Mail,
  PackageCheck,
  Save,
  Sparkles,
  Target,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

type AccountLead = {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  title?: string | null;
  status: string | null;
  stage?: string | null;
  estimated_value?: number | null;
  notes?: string | null;
  next_follow_up_at?: string | null;
  ai_insights?: unknown;
  created_at: string;
  updated_at: string;
};

type LeadActivity = {
  id: string;
  activity_type: string;
  title: string;
  description?: string | null;
  created_at: string;
};

type AccountPlan = {
  firstLane: string;
  sevenDayDeliverable: string;
  thirtyDayOutcome: string;
  accessNeeded: string;
  ownerOnClientSide: string;
  nextAction: string;
};

const defaultPlan: AccountPlan = {
  firstLane: "Confirm the first workflow and owner.",
  sevenDayDeliverable: "Ship one useful operating surface the client can react to.",
  thirtyDayOutcome: "Prove measurable time, revenue, visibility, or follow-up improvement.",
  accessNeeded: "Docs, examples, current tools, team owners, and customer language.",
  ownerOnClientSide: "Name the person who can unblock access and decisions.",
  nextAction: "Schedule kickoff and confirm the first operating lane.",
};

const milestoneTemplates = [
  {
    title: "Kickoff confirmed",
    detail: "Payment/admin path, owner, first lane, and meeting date are clear.",
  },
  {
    title: "Context collected",
    detail: "Docs, links, examples, data exports, inboxes, or screenshots are gathered.",
  },
  {
    title: "First workflow mapped",
    detail: "Current process, bottleneck, users, source systems, and success metric are defined.",
  },
  {
    title: "Assistant behavior drafted",
    detail: "What the AI should do, avoid, ask, escalate, and remember is written down.",
  },
  {
    title: "First lane shipped",
    detail: "The client has a working output, not only a discussion or mockup.",
  },
];

function formatDate(value?: string | null) {
  if (!value) return "Not scheduled";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(value));
}

function formatCurrency(value?: number | null) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function normalizeStatus(status?: string | null) {
  return (status || "new").replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getAccountName(lead: AccountLead) {
  return lead.company || lead.name || lead.email || "Client account";
}

function getContactName(lead: AccountLead) {
  return lead.name || lead.email || "Primary contact";
}

function getRecommendedLane(lead: AccountLead) {
  const text = `${lead.title || ""} ${lead.notes || ""}`.toLowerCase();
  const value = lead.estimated_value || 0;
  if (value >= 15000 || text.includes("operating") || text.includes("enterprise")) {
    return "90-Day Operating Lane";
  }
  if (value >= 7500 || text.includes("workflow")) return "First Workflow";
  if (value >= 1000 || text.includes("setup")) return "Guided Setup";
  return "Software Access";
}

function readAccountPlan(lead: AccountLead): AccountPlan {
  if (!lead.ai_insights || typeof lead.ai_insights !== "object" || Array.isArray(lead.ai_insights)) {
    return defaultPlan;
  }

  const insights = lead.ai_insights as { accountPlan?: Partial<AccountPlan> };
  return { ...defaultPlan, ...(insights.accountPlan || {}) };
}

function buildAccountBrief(lead: AccountLead, plan: AccountPlan) {
  return [
    `Account: ${getAccountName(lead)}`,
    `Contact: ${getContactName(lead)}`,
    `Status: ${normalizeStatus(lead.status)}`,
    `Starting lane: ${plan.firstLane}`,
    `Estimated value: ${formatCurrency(lead.estimated_value)}`,
    "",
    "7-day deliverable:",
    plan.sevenDayDeliverable,
    "",
    "30-day outcome:",
    plan.thirtyDayOutcome,
    "",
    "Access needed:",
    plan.accessNeeded,
    "",
    "Client-side owner:",
    plan.ownerOnClientSide,
    "",
    "Next action:",
    plan.nextAction,
    "",
    "Source notes:",
    lead.notes || "No source notes captured yet.",
  ].join("\n");
}

function buildClientKickoffEmail(lead: AccountLead, plan: AccountPlan) {
  const contact = getContactName(lead);
  const account = getAccountName(lead);

  return `${contact},\n\nThe next step is to open the first operating lane for ${account}.\n\nFor kickoff, I want to confirm five things:\n\n1. The first workflow or department we are improving\n2. Who owns that workflow internally\n3. The docs, tools, examples, and customer language I should use as context\n4. What a useful first 7 days should produce\n5. What would make this worth expanding after the first lane is live\n\nMy proposed first lane: ${plan.firstLane}\n\nFirst deliverable: ${plan.sevenDayDeliverable}\n\nOnce those are confirmed, I can turn this into a working operating surface instead of another loose AI conversation.`;
}

export default function AccountDetailPage() {
  const params = useParams<{ leadId: string }>();
  const leadId = params.leadId;
  const [lead, setLead] = useState<AccountLead | null>(null);
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [plan, setPlan] = useState<AccountPlan>(defaultPlan);

  async function fetchAccount() {
    setLoading(true);
    try {
      const response = await fetch(`/api/leads/${leadId}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Could not load account");
      const result = (await response.json()) as { lead: AccountLead; activities?: LeadActivity[] };
      setLead(result.lead);
      setActivities(result.activities || []);
      setPlan(readAccountPlan(result.lead));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load account");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (leadId) fetchAccount();
  }, [leadId]);

  const recommendedLane = useMemo(() => (lead ? getRecommendedLane(lead) : "First Workflow"), [lead]);

  async function copyText(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Could not copy text");
    }
  }

  async function saveAccountPlan(nextStatus?: string) {
    if (!lead) return;
    setSaving(true);
    try {
      const currentInsights =
        lead.ai_insights && typeof lead.ai_insights === "object" && !Array.isArray(lead.ai_insights)
          ? lead.ai_insights
          : {};
      const response = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: nextStatus || lead.status || "won",
          stage: "delivery_handoff",
          ai_insights: {
            ...currentInsights,
            accountPlan: plan,
            accountPlanUpdatedAt: new Date().toISOString(),
          },
        }),
      });

      if (!response.ok) throw new Error("Could not save account plan");
      const result = (await response.json()) as { lead: AccountLead };
      setLead(result.lead);
      await fetchAccount();
      toast.success("Account plan saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save account plan");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="rounded-lg border bg-white p-8 text-center">
        <h1 className="text-xl font-semibold text-slate-950">Account not found</h1>
        <Button asChild className="mt-5 rounded-md">
          <Link href="/dashboard/accounts">Back to accounts</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button asChild variant="outline" className="w-fit rounded-md">
          <Link href="/dashboard/accounts">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Accounts
          </Link>
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-md"
            onClick={() => copyText("Account brief", buildAccountBrief(lead, plan))}
          >
            <Clipboard className="mr-2 h-4 w-4" />
            Copy brief
          </Button>
          <Button type="button" className="rounded-md" disabled={saving} onClick={() => saveAccountPlan("won")}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save plan
          </Button>
        </div>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge className="rounded-md bg-violet-600">{normalizeStatus(lead.status)}</Badge>
              <Badge variant="outline" className="rounded-md">
                {normalizeStatus(lead.stage || "account")}
              </Badge>
              <Badge variant="outline" className="rounded-md">
                {recommendedLane}
              </Badge>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
              {getAccountName(lead)}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              {getContactName(lead)}
              {lead.title ? `, ${lead.title}` : ""}
              {lead.email ? ` - ${lead.email}` : ""}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {[
              ["Value", formatCurrency(lead.estimated_value)],
              ["Next touch", formatDate(lead.next_follow_up_at)],
              ["Opened", formatDate(lead.created_at)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border bg-slate-50 p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">{label}</p>
                <p className="mt-2 text-sm font-semibold text-slate-950">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <Card className="rounded-lg shadow-none">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="text-xl">Operating plan</CardTitle>
              <Target className="h-5 w-5 text-violet-600" />
            </div>
            <p className="text-sm leading-6 text-slate-600">
              Keep the account flexible: this records the next lane without locking the client into one
              product forever.
            </p>
          </CardHeader>
          <CardContent className="grid gap-4">
            {[
              ["firstLane", "First operating lane"],
              ["sevenDayDeliverable", "7-day deliverable"],
              ["thirtyDayOutcome", "30-day outcome"],
              ["accessNeeded", "Access/context needed"],
              ["ownerOnClientSide", "Client-side owner"],
              ["nextAction", "Next action"],
            ].map(([key, label]) => (
              <div key={key}>
                <label className="text-sm font-medium text-slate-800" htmlFor={key}>
                  {label}
                </label>
                <Textarea
                  id={key}
                  className="mt-2 min-h-20"
                  value={plan[key as keyof AccountPlan]}
                  onChange={(event) =>
                    setPlan((current) => ({
                      ...current,
                      [key]: event.target.value,
                    }))
                  }
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-lg shadow-none">
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <CardTitle className="text-xl">AI actions</CardTitle>
                <Bot className="h-5 w-5 text-violet-600" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                {
                  label: "Client kickoff email",
                  icon: Mail,
                  action: () => copyText("Kickoff email", buildClientKickoffEmail(lead, plan)),
                },
                {
                  label: "Internal account brief",
                  icon: FileText,
                  action: () => copyText("Internal brief", buildAccountBrief(lead, plan)),
                },
                {
                  label: "Assistant prompt",
                  icon: Sparkles,
                  action: () =>
                    copyText(
                      "Assistant prompt",
                      `${buildAccountBrief(lead, plan)}\n\nAct as my Perpetual Core account operator. Give me the next three actions, the highest risk, and the first workflow I should install.`,
                    ),
                },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={item.action}
                  className="flex w-full cursor-pointer items-center justify-between rounded-lg border bg-white p-4 text-left transition hover:border-violet-300 hover:bg-violet-50/40"
                >
                  <span className="flex items-center gap-3 text-sm font-semibold text-slate-950">
                    <item.icon className="h-4 w-4 text-violet-600" />
                    {item.label}
                  </span>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-lg shadow-none">
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <CardTitle className="text-xl">Source notes</CardTitle>
                <PackageCheck className="h-5 w-5 text-violet-600" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap rounded-lg border bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                {lead.notes || "No notes captured yet."}
              </p>
              <Button asChild variant="outline" className="mt-4 w-full rounded-md">
                <Link href={`/dashboard/leads?lead=${encodeURIComponent(lead.id)}`}>Open source lead</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="rounded-lg shadow-none">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-xl">Delivery milestones</CardTitle>
            <CheckCircle2 className="h-5 w-5 text-violet-600" />
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-5">
          {milestoneTemplates.map((milestone, index) => (
            <div key={milestone.title} className="rounded-lg border bg-white p-4">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-100 text-xs font-semibold text-violet-700">
                {index + 1}
              </span>
              <p className="mt-4 text-sm font-semibold text-slate-950">{milestone.title}</p>
              <p className="mt-2 text-sm leading-5 text-slate-600">{milestone.detail}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="rounded-lg shadow-none">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-xl">Activity trail</CardTitle>
            <CalendarClock className="h-5 w-5 text-violet-600" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {activities.length === 0 ? (
            <p className="rounded-lg border border-dashed p-4 text-sm text-slate-600">
              No account activity yet. Save the plan to create the first delivery memory.
            </p>
          ) : (
            activities.slice(0, 10).map((activity) => (
              <div key={activity.id} className="rounded-lg border bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-950">{activity.title}</p>
                  <Badge variant="outline" className="rounded-md">
                    {formatDate(activity.created_at)}
                  </Badge>
                </div>
                <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
                  {normalizeStatus(activity.activity_type)}
                </p>
                {activity.description ? (
                  <p className="mt-2 text-sm leading-5 text-slate-600">{activity.description}</p>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
