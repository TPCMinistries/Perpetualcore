"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Clipboard,
  ClipboardCheck,
  FileText,
  Loader2,
  Mail,
  MessagesSquare,
  PackageCheck,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AccountLane = {
  id: string;
  name: string;
  company: string;
  status: string;
  lane: string;
  value: string;
  nextStep: string;
  createdAt: string;
  href: string;
};

type PackagePayment = {
  id: string;
  packageName: string;
  packageId: string;
  leadId: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  amountFormatted: string;
  status: string;
  createdAt: string;
};

type OperatingData = {
  summary: {
    paidPackageCount: number;
    packageRevenueFormatted: string;
    openLeadCount: number;
    activeClientCount: number;
    pipelineValueFormatted: string;
  };
  activeClients: AccountLane[];
  recentPackages: PackagePayment[];
  nextActions: Array<{
    id: string;
    title: string;
    detail: string;
    priority: string;
    href: string;
  }>;
};

type SourceLead = {
  id: string;
  name?: string | null;
  contact_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  contact_email?: string | null;
  phone?: string | null;
  company?: string | null;
  company_name?: string | null;
  title?: string | null;
  status: string | null;
  estimated_value?: number | null;
  notes?: string | null;
  next_follow_up_at?: string | null;
  updated_at: string;
};

type SourceLeadActivity = {
  id: string;
  activity_type: string;
  title: string;
  description?: string | null;
  from_value?: string | null;
  to_value?: string | null;
  created_at: string;
};

const emptyData: OperatingData = {
  summary: {
    paidPackageCount: 0,
    packageRevenueFormatted: "$0",
    openLeadCount: 0,
    activeClientCount: 0,
    pipelineValueFormatted: "$0",
  },
  activeClients: [],
  recentPackages: [],
  nextActions: [],
};

const aiJobs = [
  {
    title: "Account brief",
    detail: "Summarize buyer context, offer fit, package, stakeholders, and open questions.",
    icon: FileText,
  },
  {
    title: "Next-best action",
    detail: "Recommend whether to send the map, price a package, draft proposal, or schedule kickoff.",
    icon: Sparkles,
  },
  {
    title: "Delivery memory",
    detail: "Keep notes, files, calls, decisions, and implementation history attached to the account.",
    icon: ShieldCheck,
  },
  {
    title: "Follow-up drafts",
    detail: "Generate outreach that adapts to the account lane without locking you into one script.",
    icon: MessagesSquare,
  },
];

const onboardingSteps = [
  "Confirm payment or buying intent",
  "Attach lead, company, and package context",
  "Schedule kickoff or discovery working session",
  "Open the first delivery lane",
  "Review next AI-assisted action weekly",
];

const kickoffChecklist = [
  {
    title: "Confirm the paid path",
    detail: "Checkout, invoice, or signed approval. Do not start delivery with the money path vague.",
  },
  {
    title: "Name the first operating lane",
    detail: "Sales, service, operations, admin, reporting, or knowledge. Pick one lane before expanding.",
  },
  {
    title: "Collect the minimum context",
    detail: "Docs, examples, links, current tools, owner names, customer language, and the first workflow outcome.",
  },
  {
    title: "Set the first 7-day deliverable",
    detail: "A working assistant, mapped process, proposal engine, intake flow, account view, or reporting surface.",
  },
  {
    title: "Define the expansion signal",
    detail: "What would prove this should become a broader 90-day operating lane.",
  },
];

const lanePlaybook = [
  {
    lane: "Software Access",
    when: "They want to get inside the product first.",
    action: "Give access, then watch for activation and workflow fit.",
  },
  {
    lane: "Guided Setup",
    when: "They need help turning the system on.",
    action: "Configure profile, data sources, and the first useful surface.",
  },
  {
    lane: "First Workflow",
    when: "There is a clear revenue, time, or visibility problem.",
    action: "Map the workflow, install the AI-supported process, and measure the result.",
  },
  {
    lane: "90-Day Operating Lane",
    when: "They want you as AI consultant/operator.",
    action: "Run a managed cadence across sales, ops, admin, and leadership visibility.",
  },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function normalizeStatus(status: string) {
  return status.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatCurrency(value?: number | null) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function getLeadName(lead: SourceLead) {
  const composedName = [lead.first_name, lead.last_name].filter(Boolean).join(" ").trim();
  return lead.name || lead.contact_name || composedName || lead.email || lead.contact_email || "Unnamed lead";
}

function getLeadCompany(lead: SourceLead) {
  return lead.company || lead.company_name || "";
}

function getRecommendedPackageId(lead: SourceLead) {
  const value = lead.estimated_value || 0;
  const text = `${lead.title || ""} ${lead.notes || ""}`.toLowerCase();

  if (value >= 15000 || text.includes("enterprise") || text.includes("operating system")) {
    return "operating-lane-deposit";
  }

  if (value >= 7500 || text.includes("workflow")) {
    return "first-workflow";
  }

  if (value >= 1000 || text.includes("setup")) {
    return "guided-setup";
  }

  return "software-access";
}

function getAccountLane(lead: SourceLead) {
  const packageId = getRecommendedPackageId(lead);
  const lane = lanePlaybook.find((item) => {
    if (packageId === "software-access") return item.lane === "Software Access";
    if (packageId === "guided-setup") return item.lane === "Guided Setup";
    if (packageId === "first-workflow") return item.lane === "First Workflow";
    return item.lane === "90-Day Operating Lane";
  });

  return {
    packageId,
    label: lane?.lane || "First Workflow",
    detail: lane?.action || "Confirm the first operating lane and next delivery action.",
  };
}

function getSourceLeadSummary(lead: SourceLead) {
  const company = getLeadCompany(lead);
  const contact = getLeadName(lead);
  const value = lead.estimated_value ? formatCurrency(lead.estimated_value) : "scope pending";
  const status = normalizeStatus(lead.status || "new");
  const nextTouch = lead.next_follow_up_at ? formatDate(lead.next_follow_up_at) : "not scheduled";

  return `${company || contact} | ${contact} | ${status} | ${value} | next touch: ${nextTouch}`;
}

function getDeliveryHandoffNote(lead: SourceLead) {
  const lane = getAccountLane(lead);
  const company = getLeadCompany(lead) || "Account";
  const contact = getLeadName(lead);

  return [
    "Delivery handoff opened",
    `Account: ${company}`,
    `Contact: ${contact}`,
    `Starting lane: ${lane.label}`,
    `Recommended package: ${lane.packageId}`,
    "Kickoff focus:",
    ...kickoffChecklist.map((step, index) => `${index + 1}. ${step.title} - ${step.detail}`),
  ].join("\n");
}

function getAccountCopyActions(lead: SourceLead) {
  const lane = getAccountLane(lead);
  const company = getLeadCompany(lead) || "your team";
  const contact = getLeadName(lead);
  const summary = getSourceLeadSummary(lead);
  const notes = lead.notes?.trim() || "No detailed notes captured yet.";

  return [
    {
      label: "Kickoff note",
      icon: Mail,
      body: `Hi ${contact},\n\nI mapped this as a ${lane.label} path for ${company}. The next move is to confirm the first operating lane, the immediate business outcome, and what access or context we need to start cleanly.\n\nSuggested next step: schedule a working session so we can turn this from interest into an installed operating system.\n\n${summary}`,
    },
    {
      label: "Internal brief",
      icon: Clipboard,
      body: `Account brief\n${summary}\n\nRecommended lane: ${lane.label}\nWhy this lane: ${lane.detail}\n\nKnown context:\n${notes}\n\nNext action: confirm buyer priority, decision path, and the first workflow that should be installed.`,
    },
    {
      label: "Discovery agenda",
      icon: FileText,
      body: `Discovery agenda for ${company}\n\n1. Confirm the business outcome this AI operating system should improve first.\n2. Identify the workflows, tools, people, and data currently involved.\n3. Decide whether the first step is software access, guided setup, first workflow, or a 90-day operating lane.\n4. Define the first measurable deliverable.\n5. Confirm payment path, kickoff date, and owner on each side.`,
    },
    {
      label: "Kickoff checklist",
      icon: ClipboardCheck,
      body: `Kickoff checklist for ${company}\n\nStarting lane: ${lane.label}\n\n${kickoffChecklist
        .map((step, index) => `${index + 1}. ${step.title}\n${step.detail}`)
        .join("\n\n")}`,
    },
  ];
}

export default function AccountsPage() {
  const [data, setData] = useState<OperatingData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sourceLeadId, setSourceLeadId] = useState("");
  const [sourceLead, setSourceLead] = useState<SourceLead | null>(null);
  const [sourceLeadActivities, setSourceLeadActivities] = useState<SourceLeadActivity[]>([]);
  const [sourceLeadLoading, setSourceLeadLoading] = useState(false);
  const [savingHandoff, setSavingHandoff] = useState(false);

  async function fetchAccounts() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/operating-dashboard", { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to load account workspace");
      const result = (await response.json()) as OperatingData;
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load account workspace");
    } finally {
      setLoading(false);
    }
  }

  async function fetchSourceLead(leadId: string) {
    setSourceLeadLoading(true);

    try {
      const response = await fetch(`/api/leads/${leadId}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to load source lead");
      const result = (await response.json()) as { lead: SourceLead; activities?: SourceLeadActivity[] };
      setSourceLead(result.lead);
      setSourceLeadActivities(result.activities || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load source lead");
    } finally {
      setSourceLeadLoading(false);
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const leadId = params.get("lead") || "";
    setSourceLeadId(leadId);
    fetchAccounts();
    if (leadId) {
      fetchSourceLead(leadId);
    }
  }, []);

  async function copyAccountText(label: string, body: string) {
    try {
      await navigator.clipboard.writeText(body);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Could not copy text");
    }
  }

  async function handleStartDeliveryHandoff(lead: SourceLead) {
    setSavingHandoff(true);

    try {
      const handoffNote = getDeliveryHandoffNote(lead);
      const existingNotes = lead.notes?.trim();
      const nextNotes = existingNotes ? `${existingNotes}\n\n---\n${handoffNote}` : handoffNote;
      const response = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "won",
          stage: "delivery_handoff",
          notes: nextNotes,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to open delivery handoff");
      }

      const result = (await response.json()) as { lead: SourceLead };
      setSourceLead(result.lead);
      await fetchSourceLead(lead.id);
      await fetchAccounts();
      toast.success("Delivery handoff opened");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not open delivery handoff");
    } finally {
      setSavingHandoff(false);
    }
  }

  const paidAccounts = useMemo(
    () => data.activeClients.filter((client) => client.status.toLowerCase().includes("paid")),
    [data.activeClients],
  );

  const pursuitAccounts = useMemo(
    () => data.activeClients.filter((client) => !client.status.toLowerCase().includes("paid")),
    [data.activeClients],
  );

  return (
    <div className="space-y-6 pb-10">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-violet-600" />
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-slate-500">
                Perpetual Core Account OS
              </p>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
              Turn leads and paid packages into client operating lanes.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              This is the post-sale command surface: keep the buyer context, payment, package,
              handoff, assistant work, and next delivery action together so the relationship can grow.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="outline" className="rounded-md">
              <Link href="/dashboard/account-plan">Account playbook</Link>
            </Button>
            <Button asChild className="rounded-md">
              <Link href="/dashboard/leads">
                Add lead <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {sourceLeadId ? (
        <Card className="overflow-hidden rounded-lg border-violet-200 shadow-none">
          <CardContent className="p-0">
            <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="bg-violet-50 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-violet-700">
                      Source lead context
                    </p>
                    {sourceLeadLoading ? (
                      <p className="mt-3 text-sm text-violet-900">Loading lead context...</p>
                    ) : sourceLead ? (
                      <>
                        <h2 className="mt-3 text-xl font-semibold text-violet-950">
                          {getLeadCompany(sourceLead) || getLeadName(sourceLead)}
                        </h2>
                        <p className="mt-1 text-sm text-violet-800">
                          {getLeadName(sourceLead)}
                          {sourceLead.title ? ` - ${sourceLead.title}` : ""}
                        </p>
                      </>
                    ) : (
                      <p className="mt-3 text-sm text-violet-900">
                        Opened from a lead record. Use this workspace to confirm the handoff.
                      </p>
                    )}
                  </div>
                  <Button asChild variant="outline" className="shrink-0 rounded-md border-violet-200 bg-white">
                    <Link href={`/dashboard/leads?lead=${encodeURIComponent(sourceLeadId)}`}>
                      Return to lead
                    </Link>
                  </Button>
                </div>

                {sourceLead ? (
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-md border border-violet-200 bg-white p-3">
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Status</p>
                      <p className="mt-2 text-sm font-semibold text-slate-950">
                        {normalizeStatus(sourceLead.status || "new")}
                      </p>
                    </div>
                    <div className="rounded-md border border-violet-200 bg-white p-3">
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Value</p>
                      <p className="mt-2 text-sm font-semibold text-slate-950">
                        {sourceLead.estimated_value ? formatCurrency(sourceLead.estimated_value) : "Scope pending"}
                      </p>
                    </div>
                    <div className="rounded-md border border-violet-200 bg-white p-3">
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
                        Next touch
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-950">
                        {sourceLead.next_follow_up_at ? formatDate(sourceLead.next_follow_up_at) : "Not scheduled"}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="border-t border-violet-100 bg-white p-5 lg:border-l lg:border-t-0">
                {sourceLead ? (
                  <>
                    {(() => {
                      const lane = getAccountLane(sourceLead);
                      const packageHref = `/packages?lead=${encodeURIComponent(sourceLead.id)}&package=${encodeURIComponent(lane.packageId)}`;
                      return (
                        <div>
                          <div className="flex items-start gap-3">
                            <div className="rounded-md bg-violet-100 p-2 text-violet-700">
                              <Target className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-950">{lane.label}</p>
                              <p className="mt-1 text-sm leading-5 text-slate-600">{lane.detail}</p>
                            </div>
                          </div>
                          <div className="mt-5 grid gap-2 sm:grid-cols-2">
                            <Button
                              type="button"
                              className="rounded-md"
                              disabled={savingHandoff}
                              onClick={() => handleStartDeliveryHandoff(sourceLead)}
                            >
                              {savingHandoff ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <PackageCheck className="mr-2 h-4 w-4" />
                              )}
                              Start delivery
                            </Button>
                            <Button asChild className="rounded-md">
                              <Link href={packageHref}>
                                Send package <ArrowRight className="ml-2 h-4 w-4" />
                              </Link>
                            </Button>
                            <Button asChild variant="outline" className="rounded-md sm:col-span-2">
                              <Link href={`/dashboard/proposals?lead=${encodeURIComponent(sourceLead.id)}`}>
                                Draft proposal
                              </Link>
                            </Button>
                          </div>
                        </div>
                      );
                    })()}
                  </>
                ) : (
                  <p className="text-sm leading-6 text-slate-600">
                    Once the lead loads, this panel will show the recommended account lane and next action.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {sourceLead ? (
        <Card className="rounded-lg shadow-none">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="text-xl">Delivery kickoff room</CardTitle>
              <PackageCheck className="h-5 w-5 text-violet-600" />
            </div>
            <p className="text-sm leading-6 text-slate-600">
              This is the bridge from sold interest to installed work. The assistant can use this
              context to draft agendas, follow-ups, internal briefs, and the first delivery task.
            </p>
          </CardHeader>
          <CardContent className="grid gap-3 lg:grid-cols-5">
            {kickoffChecklist.map((step, index) => (
              <div key={step.title} className="rounded-lg border bg-white p-4">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-100 text-xs font-semibold text-violet-700">
                  {index + 1}
                </span>
                <p className="mt-4 text-sm font-semibold text-slate-950">{step.title}</p>
                <p className="mt-2 text-sm leading-5 text-slate-600">{step.detail}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {sourceLead ? (
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="rounded-lg shadow-none">
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <CardTitle className="text-xl">Handoff copy kit</CardTitle>
                <MessagesSquare className="h-5 w-5 text-violet-600" />
              </div>
              <p className="text-sm leading-6 text-slate-600">
                Copy clean language into email, proposal notes, or the internal delivery lane without
                losing the source lead context.
              </p>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {getAccountCopyActions(sourceLead).map((action) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => copyAccountText(action.label, action.body)}
                  className="rounded-lg border bg-white p-4 text-left transition hover:border-violet-300 hover:bg-violet-50/40"
                >
                  <action.icon className="h-5 w-5 text-violet-600" />
                  <p className="mt-4 text-sm font-semibold text-slate-950">{action.label}</p>
                  <p className="mt-2 text-sm leading-5 text-slate-600">
                    Copy the current lead context into a usable next step.
                  </p>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-lg shadow-none">
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <CardTitle className="text-xl">Lead history</CardTitle>
                <CalendarClock className="h-5 w-5 text-violet-600" />
              </div>
              <p className="text-sm leading-6 text-slate-600">
                Recent lead activity stays visible when you move from sales into account work.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {sourceLeadActivities.length === 0 ? (
                <div className="rounded-lg border border-dashed p-4 text-sm text-slate-600">
                  No activity has been logged yet. Save a working session or send a package from the lead.
                </div>
              ) : (
                sourceLeadActivities.slice(0, 6).map((activity) => (
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
      ) : null}

      <div className="grid gap-4 md:grid-cols-4">
        {[
          ["Active accounts", data.summary.activeClientCount],
          ["Paid packages", data.summary.paidPackageCount],
          ["Package revenue", data.summary.packageRevenueFormatted],
          ["Open demand", data.summary.pipelineValueFormatted],
        ].map(([label, value]) => (
          <Card key={label} className="rounded-lg shadow-none">
            <CardContent className="p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">{label}</p>
              <p className="mt-3 text-2xl font-semibold text-slate-950">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-lg shadow-none">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl">Client lanes</CardTitle>
              <p className="mt-1 text-sm text-slate-600">
                Paid accounts first, then serious prospects that need a defined next move.
              </p>
            </div>
            <Button variant="outline" size="sm" className="rounded-md" onClick={fetchAccounts} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Refresh
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="rounded-lg border border-dashed p-6 text-sm text-slate-600">
                Loading account lanes...
              </div>
            ) : data.activeClients.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-sm text-slate-600">
                No active account lanes yet. Add a lead, send a package, or close a paid workflow.
              </div>
            ) : (
              [...paidAccounts, ...pursuitAccounts].map((client) => (
                <Link
                  key={client.id}
                  href={client.href}
                  className="group grid gap-4 rounded-lg border bg-white p-4 transition hover:border-violet-300 hover:bg-violet-50/40 md:grid-cols-[1fr_150px_180px]"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-950">{client.name}</p>
                      <Badge variant="outline" className="rounded-md">
                        {normalizeStatus(client.status)}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{client.company}</p>
                    <p className="mt-3 text-sm leading-5 text-slate-600">{client.nextStep}</p>
                  </div>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
                      Lane
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-950">{client.lane}</p>
                  </div>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
                      Value / opened
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-950">{client.value}</p>
                    <p className="mt-1 text-xs text-slate-500">{formatDate(client.createdAt)}</p>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-lg shadow-none">
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <CardTitle className="text-xl">Paid-client handoff</CardTitle>
                <PackageCheck className="h-5 w-5 text-violet-600" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {onboardingSteps.map((step, index) => (
                <div key={step} className="flex gap-3 rounded-lg border bg-white p-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-semibold text-violet-700">
                    {index + 1}
                  </span>
                  <p className="text-sm leading-6 text-slate-700">{step}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-lg shadow-none">
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <CardTitle className="text-xl">Next actions</CardTitle>
                <CalendarClock className="h-5 w-5 text-violet-600" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.nextActions.length === 0 ? (
                <p className="rounded-lg border border-dashed p-4 text-sm text-slate-600">
                  No urgent actions yet.
                </p>
              ) : (
                data.nextActions.slice(0, 5).map((action) => (
                  <Link
                    key={action.id}
                    href={action.href}
                    className="block rounded-lg border bg-white p-4 transition hover:border-violet-300 hover:bg-violet-50/40"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-950">{action.title}</p>
                      <Badge className="rounded-md" variant={action.priority === "high" ? "default" : "outline"}>
                        {action.priority}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm leading-5 text-slate-600">{action.detail}</p>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="rounded-lg shadow-none">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-xl">Adaptive AI layer</CardTitle>
            <Bot className="h-5 w-5 text-violet-600" />
          </div>
          <p className="text-sm leading-6 text-slate-600">
            The assistant should work across the account rather than trap you in one workflow. It reads
            the lane, context, payment state, notes, and files, then suggests the next useful action.
          </p>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          {aiJobs.map((job) => (
            <div key={job.title} className="rounded-lg border bg-white p-4">
              <job.icon className="h-5 w-5 text-violet-600" />
              <p className="mt-4 text-sm font-semibold text-slate-950">{job.title}</p>
              <p className="mt-2 text-sm leading-5 text-slate-600">{job.detail}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="rounded-lg shadow-none">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-xl">Lane playbook</CardTitle>
            <BriefcaseBusiness className="h-5 w-5 text-violet-600" />
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          {lanePlaybook.map((item) => (
            <div key={item.lane} className="rounded-lg border bg-white p-4">
              <p className="text-sm font-semibold text-slate-950">{item.lane}</p>
              <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
                When
              </p>
              <p className="mt-1 text-sm leading-5 text-slate-600">{item.when}</p>
              <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
                Do
              </p>
              <p className="mt-1 text-sm leading-5 text-slate-600">{item.action}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Link
          href="/dashboard/proposals"
          className="group rounded-lg border bg-white p-5 transition hover:border-violet-300 hover:bg-violet-50/40"
        >
          <ClipboardCheck className="h-5 w-5 text-violet-600" />
          <p className="mt-4 text-sm font-semibold text-slate-950">Draft proposal</p>
          <p className="mt-2 text-sm leading-5 text-slate-600">
            Turn an account lane into a scoped first workflow or operating-lane proposal.
          </p>
        </Link>
        <Link
          href="/packages"
          className="group rounded-lg border bg-white p-5 transition hover:border-violet-300 hover:bg-violet-50/40"
        >
          <CircleDollarSign className="h-5 w-5 text-violet-600" />
          <p className="mt-4 text-sm font-semibold text-slate-950">Send package</p>
          <p className="mt-2 text-sm leading-5 text-slate-600">
            Move the buyer into software, setup, a first workflow, or a 90-day lane.
          </p>
        </Link>
        <Link
          href="/dashboard/operating"
          className="group rounded-lg border bg-white p-5 transition hover:border-violet-300 hover:bg-violet-50/40"
        >
          <CheckCircle2 className="h-5 w-5 text-violet-600" />
          <p className="mt-4 text-sm font-semibold text-slate-950">Operating dashboard</p>
          <p className="mt-2 text-sm leading-5 text-slate-600">
            See package revenue, demand, active clients, and the full commercial system.
          </p>
        </Link>
      </div>
    </div>
  );
}
