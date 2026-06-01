import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  ClipboardList,
  LockKeyhole,
  PackageCheck,
  ShieldCheck,
  Target,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AccountPlan = {
  firstLane?: string;
  sevenDayDeliverable?: string;
  thirtyDayOutcome?: string;
  accessNeeded?: string;
  ownerOnClientSide?: string;
  nextAction?: string;
};

type AccountMilestone = {
  id?: string;
  title?: string;
  detail?: string;
  completed?: boolean;
  owner?: string;
  dueDate?: string;
  notes?: string;
};

type LeadRecord = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  title: string | null;
  status: string | null;
  stage: string | null;
  estimated_value: number | null;
  next_follow_up_at: string | null;
  ai_insights: unknown;
  updated_at: string;
};

type AccountTask = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
};

type InsightRecord = Record<string, unknown>;

const defaultPlan: Required<AccountPlan> = {
  firstLane: "Confirm the first workflow and owner.",
  sevenDayDeliverable: "Ship one useful operating surface the team can react to.",
  thirtyDayOutcome: "Prove measurable time, revenue, visibility, or follow-up improvement.",
  accessNeeded: "Docs, examples, current tools, team owners, and customer language.",
  ownerOnClientSide: "Name the person who can unblock access and decisions.",
  nextAction: "Schedule kickoff and confirm the first operating lane.",
};

const fallbackMilestones: AccountMilestone[] = [
  {
    id: "kickoff-confirmed",
    title: "Kickoff confirmed",
    detail: "Payment/admin path, owner, first lane, and meeting date are clear.",
  },
  {
    id: "context-collected",
    title: "Context collected",
    detail: "Docs, links, examples, data exports, inboxes, or screenshots are gathered.",
  },
  {
    id: "workflow-mapped",
    title: "First workflow mapped",
    detail: "Current process, bottleneck, users, source systems, and success metric are defined.",
  },
  {
    id: "first-lane-shipped",
    title: "First lane shipped",
    detail: "The client has a working output, not only a discussion or mockup.",
  },
];

function isRecord(value: unknown): value is InsightRecord {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function normalizeStatus(value?: string | null) {
  return (value || "planned").replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value?: string | null) {
  if (!value) return "To be confirmed";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(value));
}

function getAccountName(lead: LeadRecord) {
  return lead.company || lead.name || lead.email || "Your team";
}

function readPlan(lead: LeadRecord): Required<AccountPlan> {
  if (!isRecord(lead.ai_insights) || !isRecord(lead.ai_insights.accountPlan)) {
    return defaultPlan;
  }

  return {
    ...defaultPlan,
    ...(lead.ai_insights.accountPlan as AccountPlan),
  };
}

function readMilestones(lead: LeadRecord) {
  if (!isRecord(lead.ai_insights) || !Array.isArray(lead.ai_insights.accountMilestones)) {
    return fallbackMilestones;
  }

  return (lead.ai_insights.accountMilestones as AccountMilestone[]).filter((milestone) => milestone.title);
}

function getTokenIsValid(lead: LeadRecord, token?: string) {
  if (!token || !isRecord(lead.ai_insights)) return false;
  return token === lead.ai_insights.accountId || token === lead.ai_insights.engagementId;
}

function getOfferName(lead: LeadRecord) {
  if (!isRecord(lead.ai_insights)) return "AI operating lane";
  return typeof lead.ai_insights.accountOfferName === "string"
    ? lead.ai_insights.accountOfferName
    : "AI operating lane";
}

async function getHandoffData(leadId: string, token?: string) {
  const supabase = createAdminClient();
  const { data: lead, error } = await supabase
    .from("leads")
    .select("id,name,email,phone,company,title,status,stage,estimated_value,next_follow_up_at,ai_insights,updated_at")
    .eq("id", leadId)
    .single();

  if (error || !lead) {
    return { lead: null, tasks: [], valid: false };
  }

  const valid = getTokenIsValid(lead as LeadRecord, token);
  if (!valid) {
    return { lead: lead as LeadRecord, tasks: [], valid: false };
  }

  const { data: tasks } = await supabase
    .from("tasks")
    .select("id,title,description,status,priority,due_date")
    .eq("source_reference", leadId)
    .order("due_date", { ascending: true, nullsFirst: false })
    .limit(12);

  return {
    lead: lead as LeadRecord,
    tasks: (tasks || []) as AccountTask[],
    valid,
  };
}

export default async function ClientHandoffPage({
  params,
  searchParams,
}: {
  params: { leadId: string };
  searchParams?: { token?: string };
}) {
  const { lead, tasks, valid } = await getHandoffData(params.leadId, searchParams?.token);

  if (!lead || !valid) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-950">
        <section className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg border bg-white text-slate-700">
            <LockKeyhole className="h-5 w-5" />
          </div>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight">Handoff link unavailable</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            This kickoff page requires an active account handoff token. Ask Perpetual Core for a fresh
            handoff link if you expected to see your onboarding plan here.
          </p>
          <Button asChild className="mt-6 rounded-md">
            <Link href="/contact-sales">Contact Perpetual Core</Link>
          </Button>
        </section>
      </main>
    );
  }

  const plan = readPlan(lead);
  const milestones = readMilestones(lead);
  const accountName = getAccountName(lead);
  const offerName = getOfferName(lead);
  const contextHref = `/contact-sales?intent=client-handoff&lead=${encodeURIComponent(lead.id)}`;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3 text-sm font-semibold">
            <span aria-hidden className="h-3 w-3 bg-violet-600" />
            Perpetual Core
          </Link>
          <Badge variant="outline" className="rounded-md">
            Client kickoff
          </Badge>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[1fr_360px] lg:py-14">
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Badge className="rounded-md bg-violet-600">{offerName}</Badge>
            <Badge variant="outline" className="rounded-md">
              {normalizeStatus(lead.stage || "delivery handoff")}
            </Badge>
          </div>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl">
            {accountName}: first operating lane.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
            This page keeps the first step clear: the lane we are opening, the context needed from
            your team, and the first deliverables we are working toward.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              ["First lane", plan.firstLane],
              ["Next step", plan.nextAction],
              ["Kickoff window", formatDate(lead.next_follow_up_at)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border bg-white p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">{label}</p>
                <p className="mt-2 text-sm font-semibold leading-5 text-slate-950">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <aside className="rounded-lg border bg-white p-5">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-violet-600" />
            <p className="text-sm font-semibold">What we need from you</p>
          </div>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-600">{plan.accessNeeded}</p>
          <div className="mt-5 rounded-lg border bg-slate-50 p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
              Client-side owner
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-950">{plan.ownerOnClientSide}</p>
          </div>
          <Button asChild className="mt-5 w-full rounded-md">
            <Link href={contextHref}>
              Send context <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </aside>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-6 pb-12 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-lg border bg-white p-6">
          <div className="flex items-center gap-3">
            <Target className="h-5 w-5 text-violet-600" />
            <h2 className="text-xl font-semibold">First deliverables</h2>
          </div>
          <div className="mt-5 grid gap-4">
            {[
              ["7-day deliverable", plan.sevenDayDeliverable],
              ["30-day outcome", plan.thirtyDayOutcome],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border bg-slate-50 p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">{label}</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <div className="flex items-center gap-3">
            <ClipboardList className="h-5 w-5 text-violet-600" />
            <h2 className="text-xl font-semibold">Working plan</h2>
          </div>
          <div className="mt-5 space-y-3">
            {tasks.length > 0
              ? tasks.map((task) => (
                  <div key={task.id} className="rounded-lg border bg-slate-50 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-950">{task.title}</p>
                      <Badge variant={task.status === "completed" ? "default" : "outline"} className="rounded-md">
                        {normalizeStatus(task.status)}
                      </Badge>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">Due: {formatDate(task.due_date)}</p>
                  </div>
                ))
              : milestones.map((milestone, index) => (
                  <div key={milestone.id || milestone.title || index} className="flex gap-4 rounded-lg border bg-slate-50 p-4">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-semibold text-violet-700">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{milestone.title}</p>
                      <p className="mt-1 text-sm leading-5 text-slate-600">{milestone.notes || milestone.detail}</p>
                    </div>
                  </div>
                ))}
          </div>
        </div>
      </section>

      <section className="border-t bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-6 py-8 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <PackageCheck className="h-5 w-5 text-violet-600" />
              <p className="text-sm font-semibold">Ready for kickoff</p>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Bring the workflow owner, current process examples, and the outcome that would make the
              first lane worth expanding.
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-md">
            <Link href={contextHref}>
              Confirm context <CalendarClock className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
