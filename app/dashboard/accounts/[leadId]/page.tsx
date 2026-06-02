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
  ExternalLink,
  ListChecks,
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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
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

type AccountMilestone = {
  id: string;
  title: string;
  detail: string;
  completed: boolean;
  owner: string;
  dueDate: string;
  notes: string;
};

type AccountUpdate = {
  summary: string;
  decision: string;
  risk: string;
  nextAction: string;
};

type PermanentAccount = {
  id: string;
  name: string;
  account_type: string;
  status: string;
  updated_at: string;
};

type PermanentEngagement = {
  id: string;
  offer_name: string;
  system_name: string;
  stage: string;
  value_range?: string | null;
  next_step?: string | null;
  updated_at: string;
};

type AccountTask = {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  due_date?: string | null;
  created_at: string;
  updated_at?: string | null;
  source_reference?: string | null;
  tags?: string[] | null;
};

type TimelineItem = {
  id: string;
  type: "task" | "update" | "milestone" | "activity" | "engagement";
  title: string;
  detail: string;
  date: string;
  status?: string;
  priority?: string;
};

type PackageId = "software-access" | "guided-setup" | "first-workflow" | "operating-lane-deposit";

const packageLabels: Record<PackageId, string> = {
  "software-access": "Software Access",
  "guided-setup": "Guided Setup",
  "first-workflow": "First Workflow Package",
  "operating-lane-deposit": "90-Day Operating Lane Deposit",
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
    id: "assistant-behavior",
    title: "Assistant behavior drafted",
    detail: "What the AI should do, avoid, ask, escalate, and remember is written down.",
  },
  {
    id: "first-lane-shipped",
    title: "First lane shipped",
    detail: "The client has a working output, not only a discussion or mockup.",
  },
];

const defaultUpdate: AccountUpdate = {
  summary: "",
  decision: "",
  risk: "",
  nextAction: "",
};

function formatDate(value?: string | null) {
  if (!value) return "Not scheduled";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(value));
}

function formatDateTime(value?: string | null) {
  if (!value) return "Not scheduled";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
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

function shortId(value?: string | null) {
  return value ? value.slice(0, 8) : "pending";
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

function getRecommendedPackageId(lead: AccountLead): PackageId {
  const lane = getRecommendedLane(lead);
  if (lane === "90-Day Operating Lane") return "operating-lane-deposit";
  if (lane === "First Workflow") return "first-workflow";
  if (lane === "Guided Setup") return "guided-setup";
  return "software-access";
}

function buildPackagePath(lead: AccountLead) {
  const packageId = getRecommendedPackageId(lead);
  return `/packages?package=${encodeURIComponent(packageId)}&lead=${encodeURIComponent(lead.id)}`;
}

function readAccountPlan(lead: AccountLead): AccountPlan {
  if (!lead.ai_insights || typeof lead.ai_insights !== "object" || Array.isArray(lead.ai_insights)) {
    return defaultPlan;
  }

  const insights = lead.ai_insights as { accountPlan?: Partial<AccountPlan> };
  return { ...defaultPlan, ...(insights.accountPlan || {}) };
}

function createDefaultMilestones(): AccountMilestone[] {
  return milestoneTemplates.map((milestone) => ({
    ...milestone,
    completed: false,
    owner: "",
    dueDate: "",
    notes: "",
  }));
}

function readAccountMilestones(lead: AccountLead): AccountMilestone[] {
  if (!lead.ai_insights || typeof lead.ai_insights !== "object" || Array.isArray(lead.ai_insights)) {
    return createDefaultMilestones();
  }

  const insights = lead.ai_insights as { accountMilestones?: Partial<AccountMilestone>[] };
  const saved = insights.accountMilestones || [];

  return milestoneTemplates.map((template) => {
    const match = saved.find((item) => item.id === template.id);
    return {
      ...template,
      completed: Boolean(match?.completed),
      owner: match?.owner || "",
      dueDate: match?.dueDate || "",
      notes: match?.notes || "",
    };
  });
}

function readAccountUpdates(lead: AccountLead): Array<AccountUpdate & { createdAt: string }> {
  if (!lead.ai_insights || typeof lead.ai_insights !== "object" || Array.isArray(lead.ai_insights)) {
    return [];
  }

  const insights = lead.ai_insights as { accountUpdates?: Array<AccountUpdate & { createdAt: string }> };
  return insights.accountUpdates || [];
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate.toISOString();
}

function buildTaskTemplates(lead: AccountLead, plan: AccountPlan, engagement: PermanentEngagement | null) {
  const account = getAccountName(lead);
  const today = new Date();
  const engagementContext = engagement
    ? `Engagement: ${engagement.offer_name} (${engagement.id})`
    : `Recommended lane: ${getRecommendedLane(lead)}`;

  return [
    {
      title: `Confirm kickoff for ${account}`,
      description: `Confirm decision owner, meeting time, paid path, and first lane.\n\n${engagementContext}\n\nNext action: ${plan.nextAction}`,
      priority: "high",
      dueDate: addDays(today, 1),
    },
    {
      title: `Collect operating context from ${account}`,
      description: `Request docs, tool access, examples, customer language, current process screenshots, and owner names.\n\nAccess needed: ${plan.accessNeeded}`,
      priority: "high",
      dueDate: addDays(today, 3),
    },
    {
      title: `Map first operating lane for ${account}`,
      description: `Define current workflow, bottleneck, users, source systems, escalation rules, and success metric.\n\nFirst lane: ${plan.firstLane}`,
      priority: "medium",
      dueDate: addDays(today, 5),
    },
    {
      title: `Ship first 7-day deliverable for ${account}`,
      description: `Build or configure the first working surface the client can use or react to.\n\nDeliverable: ${plan.sevenDayDeliverable}`,
      priority: "high",
      dueDate: addDays(today, 7),
    },
    {
      title: `Review expansion signal for ${account}`,
      description: `Review whether the first lane should expand into broader operating work.\n\n30-day outcome: ${plan.thirtyDayOutcome}`,
      priority: "medium",
      dueDate: addDays(today, 14),
    },
  ];
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

function buildBuyerStartEmail(lead: AccountLead, plan: AccountPlan, origin: string) {
  const account = getAccountName(lead);
  const contact = getContactName(lead);
  const packagePath = `${origin}${buildPackagePath(lead)}`;
  const packageName = packageLabels[getRecommendedPackageId(lead)];

  return `${contact},\n\nBased on where ${account} is right now, I would start with ${packageName}.\n\nThe first operating lane I would open is:\n${plan.firstLane}\n\nThe first useful deliverable should be:\n${plan.sevenDayDeliverable}\n\nYou can start here:\n${packagePath}\n\nAfter that, I will use the kickoff/handoff page to keep the first lane, owner, context, and delivery milestones clear.`;
}

function buildClientHandoffPath(lead: AccountLead, account: PermanentAccount | null, engagement: PermanentEngagement | null) {
  const token = engagement?.id || account?.id;
  if (!token) return "";
  return `/client-handoff/${encodeURIComponent(lead.id)}?token=${encodeURIComponent(token)}`;
}

export default function AccountDetailPage() {
  const params = useParams<{ leadId: string }>();
  const leadId = params.leadId;
  const [lead, setLead] = useState<AccountLead | null>(null);
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingUpdate, setSavingUpdate] = useState(false);
  const [syncingAccount, setSyncingAccount] = useState(false);
  const [permanentAccount, setPermanentAccount] = useState<PermanentAccount | null>(null);
  const [permanentEngagement, setPermanentEngagement] = useState<PermanentEngagement | null>(null);
  const [accountTasks, setAccountTasks] = useState<AccountTask[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [generatingTasks, setGeneratingTasks] = useState(false);
  const [savingTaskId, setSavingTaskId] = useState("");
  const [plan, setPlan] = useState<AccountPlan>(defaultPlan);
  const [milestones, setMilestones] = useState<AccountMilestone[]>(createDefaultMilestones());
  const [accountUpdate, setAccountUpdate] = useState<AccountUpdate>(defaultUpdate);

  async function fetchPermanentAccount(nextLeadId: string) {
    try {
      const response = await fetch(`/api/accounts?leadId=${encodeURIComponent(nextLeadId)}`, { cache: "no-store" });
      if (!response.ok) return;
      const result = (await response.json()) as {
        account?: PermanentAccount | null;
        engagement?: PermanentEngagement | null;
      };
      setPermanentAccount(result.account || null);
      setPermanentEngagement(result.engagement || null);
    } catch {
      setPermanentAccount(null);
      setPermanentEngagement(null);
    }
  }

  async function fetchAccountTasks(nextLeadId: string) {
    setTasksLoading(true);
    try {
      const response = await fetch(`/api/tasks?source_reference=${encodeURIComponent(nextLeadId)}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Could not load account tasks");
      const result = (await response.json()) as { tasks?: AccountTask[] };
      const tasks = result.tasks || [];
      setAccountTasks(tasks.filter((task) => task.tags?.includes("perpetual-core-account") || task.source_reference === nextLeadId));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load account tasks");
    } finally {
      setTasksLoading(false);
    }
  }

  async function fetchAccount() {
    setLoading(true);
    try {
      const response = await fetch(`/api/leads/${leadId}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Could not load account");
      const result = (await response.json()) as { lead: AccountLead; activities?: LeadActivity[] };
      setLead(result.lead);
      setActivities(result.activities || []);
      setPlan(readAccountPlan(result.lead));
      setMilestones(readAccountMilestones(result.lead));
      await fetchPermanentAccount(result.lead.id);
      await fetchAccountTasks(result.lead.id);
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
  const recommendedPackageId = useMemo<PackageId>(() => (lead ? getRecommendedPackageId(lead) : "first-workflow"), [lead]);
  const hasProposal = useMemo(
    () => activities.some((activity) => activity.activity_type === "proposal_draft"),
    [activities],
  );
  const timelineItems = useMemo<TimelineItem[]>(() => {
    if (!lead) return [];

    const updateItems = readAccountUpdates(lead).map((update, index) => ({
      id: `update-${index}-${update.createdAt}`,
      type: "update" as const,
      title: update.summary || update.decision || "Account update",
      detail: [update.decision ? `Decision: ${update.decision}` : "", update.risk ? `Risk: ${update.risk}` : "", update.nextAction ? `Next: ${update.nextAction}` : ""]
        .filter(Boolean)
        .join(" | "),
      date: update.createdAt,
      status: "Saved update",
    }));

    const taskItems = accountTasks.map((task) => ({
      id: `task-${task.id}`,
      type: "task" as const,
      title: task.title,
      detail: task.description || "Account task",
      date: task.due_date || task.updated_at || task.created_at,
      status: task.status,
      priority: task.priority,
    }));

    const milestoneItems = milestones
      .filter((milestone) => milestone.completed || milestone.dueDate || milestone.notes)
      .map((milestone) => ({
        id: `milestone-${milestone.id}`,
        type: "milestone" as const,
        title: milestone.title,
        detail: milestone.notes || milestone.detail,
        date: milestone.dueDate || lead.updated_at,
        status: milestone.completed ? "Complete" : "Planned",
      }));

    const activityItems = activities.slice(0, 12).map((activity) => ({
      id: `activity-${activity.id}`,
      type: "activity" as const,
      title: activity.title,
      detail: activity.description || normalizeStatus(activity.activity_type),
      date: activity.created_at,
      status: normalizeStatus(activity.activity_type),
    }));

    const engagementItems = permanentEngagement
      ? [
          {
            id: `engagement-${permanentEngagement.id}`,
            type: "engagement" as const,
            title: `${permanentEngagement.offer_name} engagement opened`,
            detail: permanentEngagement.next_step || permanentEngagement.system_name,
            date: permanentEngagement.updated_at,
            status: normalizeStatus(permanentEngagement.stage),
          },
        ]
      : [];

    return [...engagementItems, ...updateItems, ...taskItems, ...milestoneItems, ...activityItems]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 18);
  }, [accountTasks, activities, lead, milestones, permanentEngagement]);

  const taskSummary = useMemo(() => {
    const complete = accountTasks.filter((task) => task.status === "completed").length;
    const blocked = accountTasks.filter((task) => task.status === "blocked").length;
    const open = accountTasks.length - complete;
    const nextTask = accountTasks
      .filter((task) => task.status !== "completed")
      .sort((a, b) => new Date(a.due_date || a.created_at).getTime() - new Date(b.due_date || b.created_at).getTime())[0];

    return { complete, blocked, open, nextTask };
  }, [accountTasks]);

  async function copyText(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Could not copy text");
    }
  }

  async function copyClientHandoffLink() {
    if (!lead) return;
    const path = buildClientHandoffPath(lead, permanentAccount, permanentEngagement);
    if (!path) {
      toast.error("Sync the account before copying a client handoff link");
      return;
    }

    await copyText("Client handoff link", `${window.location.origin}${path}`);
  }

  async function copyBuyerStartLink() {
    if (!lead) return;
    await copyText("Buyer start link", `${window.location.origin}${buildPackagePath(lead)}`);
  }

  async function copyBuyerStartEmail() {
    if (!lead) return;
    await copyText("Buyer start email", buildBuyerStartEmail(lead, plan, window.location.origin));
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
            accountMilestones: milestones,
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

  async function syncPermanentAccount() {
    if (!lead) return;
    setSyncingAccount(true);
    try {
      await saveAccountPlan("won");
      const response = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: lead.id }),
      });

      if (!response.ok) throw new Error("Could not sync permanent account");
      const result = (await response.json()) as {
        account: PermanentAccount;
        engagement: PermanentEngagement;
        lead: AccountLead;
      };
      setLead(result.lead);
      setPermanentAccount(result.account);
      setPermanentEngagement(result.engagement);
      await fetchAccount();
      toast.success("Permanent account and engagement synced");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not sync account");
    } finally {
      setSyncingAccount(false);
    }
  }

  async function generateAccountTasks() {
    if (!lead) return;
    setGeneratingTasks(true);
    try {
      if (!permanentAccount || !permanentEngagement) {
        await syncPermanentAccount();
      }

      const templates = buildTaskTemplates(lead, plan, permanentEngagement);
      const existingTitles = new Set(accountTasks.map((task) => task.title.toLowerCase()));
      const tasksToCreate = templates.filter((template) => !existingTitles.has(template.title.toLowerCase()));

      if (tasksToCreate.length === 0) {
        toast.message("Account tasks are already generated");
        return;
      }

      const createdTasks: AccountTask[] = [];
      for (const task of tasksToCreate) {
        const response = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: task.title,
            description: task.description,
            priority: task.priority,
            status: "todo",
            dueDate: task.dueDate,
            source_reference: lead.id,
            tags: ["perpetual-core-account", "client-delivery", recommendedLane.toLowerCase().replace(/\s+/g, "-")],
          }),
        });

        if (!response.ok) throw new Error("Could not create account task");
        const result = (await response.json()) as { task: AccountTask };
        createdTasks.push(result.task);
      }

      await fetchAccountTasks(lead.id);
      toast.success(`${createdTasks.length} account task${createdTasks.length === 1 ? "" : "s"} created`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not generate tasks");
    } finally {
      setGeneratingTasks(false);
    }
  }

  async function updateTaskStatus(task: AccountTask, completed: boolean) {
    setSavingTaskId(task.id);
    try {
      const nextStatus = completed ? "completed" : "todo";
      const response = await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: task.id,
          status: nextStatus,
          completed_at: completed ? new Date().toISOString() : null,
        }),
      });

      if (!response.ok) throw new Error("Could not update task");
      await fetchAccountTasks(leadId);
      toast.success(completed ? "Task completed" : "Task reopened");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update task");
    } finally {
      setSavingTaskId("");
    }
  }

  async function saveAccountUpdate() {
    if (!lead) return;
    const hasUpdate = Object.values(accountUpdate).some((value) => value.trim().length > 0);
    if (!hasUpdate) {
      toast.error("Add an update before saving");
      return;
    }

    setSavingUpdate(true);
    try {
      const currentInsights =
        lead.ai_insights && typeof lead.ai_insights === "object" && !Array.isArray(lead.ai_insights)
          ? (lead.ai_insights as { accountUpdates?: Array<AccountUpdate & { createdAt: string }> })
          : {};
      const accountUpdates = [
        {
          ...accountUpdate,
          createdAt: new Date().toISOString(),
        },
        ...(currentInsights.accountUpdates || []),
      ].slice(0, 20);
      const updateBlock = [
        "Account update",
        accountUpdate.summary ? `Summary: ${accountUpdate.summary}` : "",
        accountUpdate.decision ? `Decision: ${accountUpdate.decision}` : "",
        accountUpdate.risk ? `Risk: ${accountUpdate.risk}` : "",
        accountUpdate.nextAction ? `Next action: ${accountUpdate.nextAction}` : "",
      ].filter(Boolean).join("\n");
      const nextNotes = lead.notes?.trim() ? `${lead.notes.trim()}\n\n---\n${updateBlock}` : updateBlock;
      const response = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: lead.status || "won",
          stage: "delivery_handoff",
          notes: nextNotes,
          ai_insights: {
            ...currentInsights,
            accountPlan: plan,
            accountMilestones: milestones,
            accountUpdates,
            accountPlanUpdatedAt: new Date().toISOString(),
          },
        }),
      });

      if (!response.ok) throw new Error("Could not save account update");
      setAccountUpdate(defaultUpdate);
      await fetchAccount();
      toast.success("Account update saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save account update");
    } finally {
      setSavingUpdate(false);
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

  const packageName = packageLabels[recommendedPackageId];
  const packagePath = buildPackagePath(lead);
  const handoffReady = Boolean(buildClientHandoffPath(lead, permanentAccount, permanentEngagement));
  const closePathItems = [
    {
      title: "Proposal",
      detail: hasProposal ? "Proposal draft saved against this lead." : "Draft or save a proposal before sending the buyer into a paid path.",
      complete: hasProposal,
      href: `/dashboard/proposals?lead=${encodeURIComponent(lead.id)}`,
      action: "Draft proposal",
    },
    {
      title: "Payment path",
      detail: `Recommended buyer start: ${packageName}.`,
      complete: lead.status === "won" || Boolean(permanentAccount),
      href: packagePath,
      action: "Open package",
    },
    {
      title: "Permanent account",
      detail: permanentAccount
        ? `Synced to pc_accounts/${shortId(permanentAccount.id)}.`
        : "Create the durable account and engagement record before delivery expands.",
      complete: Boolean(permanentAccount),
      button: "Sync account",
      onClick: syncPermanentAccount,
      disabled: syncingAccount,
    },
    {
      title: "Task plan",
      detail: accountTasks.length > 0 ? `${accountTasks.length} account tasks linked.` : "Generate kickoff, context, mapping, delivery, and expansion tasks.",
      complete: accountTasks.length > 0,
      button: "Generate tasks",
      onClick: generateAccountTasks,
      disabled: generatingTasks,
    },
    {
      title: "Client handoff",
      detail: handoffReady
        ? "Client kickoff link is ready to copy."
        : "Sync the account before sharing a token-gated handoff page.",
      complete: handoffReady,
      button: "Copy handoff",
      onClick: copyClientHandoffLink,
      disabled: false,
    },
  ];

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
          <Button
            type="button"
            className="rounded-md"
            variant="outline"
            disabled={syncingAccount}
            onClick={syncPermanentAccount}
          >
            {syncingAccount ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <PackageCheck className="mr-2 h-4 w-4" />
            )}
            Sync account DB
          </Button>
          <Button type="button" className="rounded-md" variant="outline" onClick={copyClientHandoffLink}>
            <Clipboard className="mr-2 h-4 w-4" />
            Copy client link
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

      <section className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-violet-200 bg-violet-50 p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-violet-700">
            Permanent account
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-950">
            {permanentAccount ? permanentAccount.name : "Not synced yet"}
          </p>
          <p className="mt-1 text-xs text-slate-600">
            {permanentAccount ? `pc_accounts/${shortId(permanentAccount.id)}` : "Use Sync account DB before delivery expands."}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
            Engagement
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-950">
            {permanentEngagement ? permanentEngagement.offer_name : recommendedLane}
          </p>
          <p className="mt-1 text-xs text-slate-600">
            {permanentEngagement
              ? `pc_engagements/${shortId(permanentEngagement.id)} - ${normalizeStatus(permanentEngagement.stage)}`
              : "Lead-backed recommendation until synced."}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
            Next system action
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-950">
            {permanentEngagement?.next_step || plan.nextAction}
          </p>
        </div>
      </section>

      <Card className="rounded-lg shadow-none">
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <CardTitle className="text-xl">Close/start path</CardTitle>
                <ArrowRight className="h-5 w-5 text-violet-600" />
              </div>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Move this account from buyer interest into paid work, permanent account memory, tasked
                delivery, and a client-facing handoff without rebuilding the context each time.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" variant="outline" className="rounded-md" onClick={copyBuyerStartLink}>
                <Clipboard className="mr-2 h-4 w-4" />
                Copy start link
              </Button>
              <Button type="button" className="rounded-md" onClick={copyBuyerStartEmail}>
                <Mail className="mr-2 h-4 w-4" />
                Copy buyer email
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 lg:grid-cols-5">
            {closePathItems.map((item, index) => (
              <div
                key={item.title}
                className={`flex min-h-[190px] flex-col rounded-lg border p-4 ${
                  item.complete ? "border-violet-200 bg-violet-50/70" : "bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <Badge className="rounded-md" variant={item.complete ? "default" : "outline"}>
                    {item.complete ? "Ready" : "Next"}
                  </Badge>
                </div>
                <h2 className="mt-4 text-sm font-semibold text-slate-950">{item.title}</h2>
                <p className="mt-2 flex-1 text-sm leading-5 text-slate-600">{item.detail}</p>
                {item.href ? (
                  <Button asChild variant="outline" className="mt-4 rounded-md">
                    <Link href={item.href}>
                      {item.action}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-4 rounded-md"
                    onClick={item.onClick}
                    disabled={item.disabled}
                  >
                    {item.disabled ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {item.button}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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
                  label: "Client handoff link",
                  icon: ExternalLink,
                  action: copyClientHandoffLink,
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
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <CardTitle className="text-xl">Account tasks</CardTitle>
                <ListChecks className="h-5 w-5 text-violet-600" />
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Turn the operating plan into real tasks in the main Perpetual Core task system. These
                are linked back to this account by source reference.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                className="rounded-md"
                disabled={tasksLoading}
                onClick={() => fetchAccountTasks(lead.id)}
              >
                {tasksLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CalendarClock className="mr-2 h-4 w-4" />}
                Refresh
              </Button>
              <Button type="button" className="rounded-md" disabled={generatingTasks} onClick={generateAccountTasks}>
                {generatingTasks ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Generate task plan
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            {[
              ["Open", taskSummary.open],
              ["Complete", taskSummary.complete],
              ["Blocked", taskSummary.blocked],
              ["Next", taskSummary.nextTask ? formatDate(taskSummary.nextTask.due_date || taskSummary.nextTask.created_at) : "None"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border bg-slate-50 p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">{label}</p>
                <p className="mt-2 text-sm font-semibold text-slate-950">{value}</p>
              </div>
            ))}
          </div>

          {accountTasks.length === 0 ? (
            <div className="rounded-lg border border-dashed p-5 text-sm leading-6 text-slate-600">
              No account tasks yet. Generate a task plan after the account plan is directionally right.
              The first task set will cover kickoff, context collection, lane mapping, first deliverable,
              and expansion review.
            </div>
          ) : (
            <div className="grid gap-3">
              {accountTasks.map((task) => {
                const isComplete = task.status === "completed";
                return (
                  <div
                    key={task.id}
                    className="grid gap-4 rounded-lg border bg-white p-4 lg:grid-cols-[minmax(0,1fr)_140px_160px]"
                  >
                    <div className="flex gap-3">
                      <Checkbox
                        id={`account-task-${task.id}`}
                        checked={isComplete}
                        disabled={savingTaskId === task.id}
                        onCheckedChange={(checked) => updateTaskStatus(task, checked === true)}
                        className="mt-1"
                      />
                      <div>
                        <label
                          htmlFor={`account-task-${task.id}`}
                          className="cursor-pointer text-sm font-semibold text-slate-950"
                        >
                          {task.title}
                        </label>
                        {task.description ? (
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-5 text-slate-600">
                            {task.description}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
                        Status
                      </p>
                      <Badge className="mt-2 rounded-md" variant={isComplete ? "default" : "outline"}>
                        {normalizeStatus(task.status)}
                      </Badge>
                    </div>
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
                        Priority / due
                      </p>
                      <p className="mt-2 text-sm font-medium text-slate-950">{normalizeStatus(task.priority)}</p>
                      <p className="mt-1 text-xs text-slate-500">{formatDate(task.due_date)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-lg shadow-none">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-xl">Account update</CardTitle>
            <CalendarClock className="h-5 w-5 text-violet-600" />
          </div>
          <p className="text-sm leading-6 text-slate-600">
            Save calls, decisions, risks, and next steps as delivery memory. This keeps the assistant
            grounded in what actually happened with the client.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {[
            ["summary", "What happened?"],
            ["decision", "Decision or commitment"],
            ["risk", "Risk or blocker"],
            ["nextAction", "Next action"],
          ].map(([key, label]) => (
            <div key={key}>
              <label className="text-sm font-medium text-slate-800" htmlFor={`update-${key}`}>
                {label}
              </label>
              <Textarea
                id={`update-${key}`}
                className="mt-2 min-h-24"
                value={accountUpdate[key as keyof AccountUpdate]}
                onChange={(event) =>
                  setAccountUpdate((current) => ({
                    ...current,
                    [key]: event.target.value,
                  }))
                }
              />
            </div>
          ))}
          <div className="md:col-span-2">
            <Button type="button" className="rounded-md" disabled={savingUpdate} onClick={saveAccountUpdate}>
              {savingUpdate ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save account update
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-lg shadow-none">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-xl">Delivery milestones</CardTitle>
            <CheckCircle2 className="h-5 w-5 text-violet-600" />
          </div>
          <p className="text-sm leading-6 text-slate-600">
            These are now editable operating checkpoints. Save the plan when owner, dates, or notes
            change.
          </p>
        </CardHeader>
        <CardContent className="grid gap-3">
          {milestones.map((milestone, index) => (
            <div
              key={milestone.id}
              className="grid gap-4 rounded-lg border bg-white p-4 lg:grid-cols-[minmax(0,1fr)_180px_180px_minmax(0,1fr)]"
            >
              <div className="flex gap-3">
                <Checkbox
                  id={`milestone-${milestone.id}`}
                  checked={milestone.completed}
                  onCheckedChange={(checked) =>
                    setMilestones((current) =>
                      current.map((item) =>
                        item.id === milestone.id ? { ...item, completed: checked === true } : item,
                      ),
                    )
                  }
                  className="mt-1"
                />
                <div>
                  <label
                    htmlFor={`milestone-${milestone.id}`}
                    className="cursor-pointer text-sm font-semibold text-slate-950"
                  >
                    {index + 1}. {milestone.title}
                  </label>
                  <p className="mt-2 text-sm leading-5 text-slate-600">{milestone.detail}</p>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                  Owner
                </label>
                <Input
                  className="mt-2"
                  value={milestone.owner}
                  placeholder="Lorenzo / client"
                  onChange={(event) =>
                    setMilestones((current) =>
                      current.map((item) =>
                        item.id === milestone.id ? { ...item, owner: event.target.value } : item,
                      ),
                    )
                  }
                />
              </div>
              <div>
                <label className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                  Due date
                </label>
                <Input
                  className="mt-2"
                  type="date"
                  value={milestone.dueDate}
                  onChange={(event) =>
                    setMilestones((current) =>
                      current.map((item) =>
                        item.id === milestone.id ? { ...item, dueDate: event.target.value } : item,
                      ),
                    )
                  }
                />
              </div>
              <div>
                <label className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                  Notes
                </label>
                <Textarea
                  className="mt-2 min-h-20"
                  value={milestone.notes}
                  placeholder="What needs to happen?"
                  onChange={(event) =>
                    setMilestones((current) =>
                      current.map((item) =>
                        item.id === milestone.id ? { ...item, notes: event.target.value } : item,
                      ),
                    )
                  }
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="rounded-lg shadow-none">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-xl">Engagement timeline</CardTitle>
            <CalendarClock className="h-5 w-5 text-violet-600" />
          </div>
          <p className="text-sm leading-6 text-slate-600">
            A combined delivery trail from account tasks, saved updates, milestones, account sync, and
            source lead activity.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {timelineItems.length === 0 ? (
            <p className="rounded-lg border border-dashed p-4 text-sm text-slate-600">
              No timeline yet. Save a plan, generate tasks, or add an account update to create the first
              delivery memory.
            </p>
          ) : (
            timelineItems.map((item) => (
              <div key={item.id} className="rounded-lg border bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="rounded-md">
                      {normalizeStatus(item.type)}
                    </Badge>
                    {item.priority ? (
                      <Badge className="rounded-md" variant={item.priority === "high" ? "default" : "secondary"}>
                        {normalizeStatus(item.priority)}
                      </Badge>
                    ) : null}
                    <p className="text-sm font-semibold text-slate-950">{item.title}</p>
                  </div>
                  <span className="text-xs text-slate-500">{formatDateTime(item.date)}</span>
                </div>
                {item.status ? (
                  <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
                    {normalizeStatus(item.status)}
                  </p>
                ) : null}
                {item.detail ? (
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-5 text-slate-600">{item.detail}</p>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
