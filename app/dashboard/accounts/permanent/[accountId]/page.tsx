"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  Clipboard,
  ExternalLink,
  ListChecks,
  Loader2,
  PackageCheck,
  Save,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type JsonRecord = Record<string, unknown>;

type PermanentAccount = {
  id: string;
  name: string;
  normalized_name?: string | null;
  account_type: string;
  buyer_type?: string | null;
  data_posture: string;
  risk_level: string;
  status: string;
  notes?: string | null;
  metadata?: unknown;
  created_at: string;
  updated_at: string;
};

type PermanentEngagement = {
  id: string;
  account_id: string;
  name: string;
  offer_name: string;
  system_name: string;
  stage: string;
  value_range?: string | null;
  data_posture: string;
  risk_level: string;
  next_step?: string | null;
  metadata?: unknown;
  created_at: string;
  updated_at: string;
};

type AccountTask = {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  due_date?: string | null;
  source?: string | null;
  source_reference?: string | null;
  tags?: string[] | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type AccountUpdate = {
  id: string;
  summary: string;
  decision?: string;
  risk?: string;
  nextAction?: string;
  createdAt: string;
};

type PermanentAccountResponse = {
  account?: PermanentAccount;
  engagements?: PermanentEngagement[];
  error?: string;
};

type AccountTasksResponse = {
  tasks?: AccountTask[];
  created?: number;
  skipped?: number;
  error?: string;
};

type AccountUpdateResponse = {
  account?: PermanentAccount;
  update?: AccountUpdate;
  error?: string;
};

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(record: JsonRecord, key: string) {
  const value = record[key];
  return typeof value === "string" && value.trim().length > 0 ? value : "";
}

function formatDateTime(value?: string | null) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function normalizeStatus(value?: string | null) {
  if (!value) return "Not set";
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function shortId(value?: string | null) {
  if (!value) return "not-set";
  return value.slice(0, 8);
}

function getPrimaryEngagement(engagements: PermanentEngagement[]) {
  return engagements[0] || null;
}

function getAccountUpdates(metadata: JsonRecord): AccountUpdate[] {
  const rawUpdates = metadata.account_updates;
  if (!Array.isArray(rawUpdates)) return [];

  return rawUpdates.filter(isRecord).map((update, index) => ({
    id: readString(update, "id") || `update-${index}`,
    summary: readString(update, "summary") || "Account update",
    decision: readString(update, "decision"),
    risk: readString(update, "risk"),
    nextAction: readString(update, "nextAction"),
    createdAt: readString(update, "createdAt") || new Date().toISOString(),
  }));
}

function buildAccountBrief(account: PermanentAccount, engagements: PermanentEngagement[]) {
  const metadata = isRecord(account.metadata) ? account.metadata : {};
  const primary = getPrimaryEngagement(engagements);
  const sourceLeadId = readString(metadata, "source_lead_id");
  const contactName = readString(metadata, "contact_name");
  const contactEmail = readString(metadata, "contact_email");

  return [
    `Permanent account: ${account.name}`,
    `Account ID: ${account.id}`,
    `Status: ${normalizeStatus(account.status)}`,
    `Buyer type: ${account.buyer_type || "Not set"}`,
    `Contact: ${contactName || "Not set"}${contactEmail ? ` <${contactEmail}>` : ""}`,
    `Source lead: ${sourceLeadId || "None"}`,
    "",
    primary
      ? [
          `Primary engagement: ${primary.offer_name}`,
          `System: ${primary.system_name}`,
          `Stage: ${normalizeStatus(primary.stage)}`,
          `Value: ${primary.value_range || "Not set"}`,
          `Next step: ${primary.next_step || "Not set"}`,
        ].join("\n")
      : "No engagement is attached yet.",
    "",
    "Assistant instruction: treat this as the permanent client account record. Recommend the next commercial action, delivery action, and the smallest proof point that should be captured.",
  ].join("\n");
}

function buildOperatorPrompt({
  account,
  engagements,
  tasks,
  updates,
}: {
  account: PermanentAccount;
  engagements: PermanentEngagement[];
  tasks: AccountTask[];
  updates: AccountUpdate[];
}) {
  const openTasks = tasks.filter((task) => task.status !== "completed").slice(0, 8);
  const recentUpdates = updates.slice(0, 5);

  return [
    "You are operating inside Perpetual Core for a permanent client account.",
    "Do not assume a single rigid funnel. Adapt the next recommendation to the account stage, offer, source data, and latest account updates.",
    "",
    buildAccountBrief(account, engagements),
    "",
    "Open tasks:",
    openTasks.length
      ? openTasks
          .map((task) => `- [${normalizeStatus(task.priority)}] ${task.title}${task.due_date ? ` due ${formatDateTime(task.due_date)}` : ""}`)
          .join("\n")
      : "- No open account tasks yet.",
    "",
    "Recent account updates:",
    recentUpdates.length
      ? recentUpdates
          .map((update) =>
            [
              `- ${formatDateTime(update.createdAt)}: ${update.summary}`,
              update.decision ? `  Decision: ${update.decision}` : "",
              update.risk ? `  Risk: ${update.risk}` : "",
              update.nextAction ? `  Next action: ${update.nextAction}` : "",
            ]
              .filter(Boolean)
              .join("\n"),
          )
          .join("\n")
      : "- No account updates yet.",
    "",
    "Return the next three actions: one sales/commercial action, one delivery/build action, and one proof point to capture. If more context is needed, ask for only the highest-leverage missing item.",
  ].join("\n");
}

export default function PermanentAccountPage() {
  const params = useParams<{ accountId: string }>();
  const accountId = params.accountId;
  const [account, setAccount] = useState<PermanentAccount | null>(null);
  const [engagements, setEngagements] = useState<PermanentEngagement[]>([]);
  const [tasks, setTasks] = useState<AccountTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [taskLoading, setTaskLoading] = useState(false);
  const [generatingTasks, setGeneratingTasks] = useState(false);
  const [savingUpdate, setSavingUpdate] = useState(false);
  const [error, setError] = useState("");
  const [updateForm, setUpdateForm] = useState({
    summary: "",
    decision: "",
    risk: "",
    nextAction: "",
  });

  async function loadTasks() {
    if (!accountId) return;
    setTaskLoading(true);

    try {
      const response = await fetch(`/api/accounts/permanent/${encodeURIComponent(accountId)}/tasks`, {
        cache: "no-store",
      });
      const result = (await response.json()) as AccountTasksResponse;
      if (!response.ok) throw new Error(result.error || "Could not load account tasks");
      setTasks(result.tasks || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load account tasks");
    } finally {
      setTaskLoading(false);
    }
  }

  async function loadAccount() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/accounts/permanent/${encodeURIComponent(accountId)}`, {
        cache: "no-store",
      });
      const result = (await response.json()) as PermanentAccountResponse;
      if (!response.ok || !result.account) {
        throw new Error(result.error || "Could not load permanent account");
      }
      setAccount(result.account);
      setEngagements(result.engagements || []);
      await loadTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load permanent account");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (accountId) loadAccount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId]);

  const metadata = useMemo(() => (account && isRecord(account.metadata) ? account.metadata : {}), [account]);
  const accountUpdates = useMemo(() => getAccountUpdates(metadata), [metadata]);
  const primaryEngagement = getPrimaryEngagement(engagements);
  const sourceLeadId = readString(metadata, "source_lead_id");
  const contactName = readString(metadata, "contact_name");
  const contactEmail = readString(metadata, "contact_email");
  const contactPhone = readString(metadata, "contact_phone");
  const createdFrom = readString(metadata, "created_from");
  const handoffContext = isRecord(metadata.account_handoff_context) ? metadata.account_handoff_context : null;
  const openTaskCount = tasks.filter((task) => task.status !== "completed").length;
  const completedTaskCount = tasks.filter((task) => task.status === "completed").length;

  async function copyBrief() {
    if (!account) return;

    try {
      await navigator.clipboard.writeText(buildAccountBrief(account, engagements));
      toast.success("Account brief copied");
    } catch {
      toast.error("Could not copy account brief");
    }
  }

  async function copyOperatorPrompt() {
    if (!account) return;

    try {
      await navigator.clipboard.writeText(buildOperatorPrompt({ account, engagements, tasks, updates: accountUpdates }));
      toast.success("Operator prompt copied");
    } catch {
      toast.error("Could not copy operator prompt");
    }
  }

  async function generateTaskPlan() {
    setGeneratingTasks(true);

    try {
      const response = await fetch(`/api/accounts/permanent/${encodeURIComponent(accountId)}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const result = (await response.json()) as AccountTasksResponse;
      if (!response.ok) throw new Error(result.error || "Could not create task plan");
      setTasks(result.tasks || []);
      toast.success(result.created ? `Created ${result.created} account tasks` : "Task plan is already current");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create task plan");
    } finally {
      setGeneratingTasks(false);
    }
  }

  async function toggleTask(task: AccountTask, checked: boolean) {
    const nextStatus = checked ? "completed" : "todo";
    const priorTasks = tasks;
    setTasks((current) => current.map((item) => (item.id === task.id ? { ...item, status: nextStatus } : item)));

    try {
      const response = await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task.id, status: nextStatus }),
      });
      if (!response.ok) throw new Error("Could not update task");
    } catch (err) {
      setTasks(priorTasks);
      toast.error(err instanceof Error ? err.message : "Could not update task");
    }
  }

  async function saveAccountUpdate() {
    if (!updateForm.summary.trim()) {
      toast.error("Add a summary before saving the account update");
      return;
    }

    setSavingUpdate(true);

    try {
      const response = await fetch(`/api/accounts/permanent/${encodeURIComponent(accountId)}/updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateForm),
      });
      const result = (await response.json()) as AccountUpdateResponse;
      if (!response.ok || !result.account) throw new Error(result.error || "Could not save account update");
      setAccount(result.account);
      setUpdateForm({ summary: "", decision: "", risk: "", nextAction: "" });
      toast.success("Account update saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save account update");
    } finally {
      setSavingUpdate(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading permanent account...
        </div>
      </div>
    );
  }

  if (error || !account) {
    return (
      <div className="mx-auto max-w-2xl py-16">
        <Card className="rounded-lg shadow-none">
          <CardContent className="p-6">
            <h1 className="text-xl font-semibold text-slate-950">Permanent account not found</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {error || "This account could not be loaded for the current user."}
            </p>
            <Button asChild className="mt-5 rounded-md">
              <Link href="/dashboard/accounts">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to accounts
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Button asChild variant="ghost" className="mb-3 h-8 rounded-md px-0 text-slate-600 hover:bg-transparent">
            <Link href="/dashboard/accounts">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Accounts
            </Link>
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="rounded-md">
              Permanent account
            </Badge>
            <Badge className="rounded-md">{normalizeStatus(account.status)}</Badge>
            {createdFrom ? (
              <Badge variant="outline" className="rounded-md">
                {normalizeStatus(createdFrom)}
              </Badge>
            ) : null}
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{account.name}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            This is the durable account room for commercial history, delivery tasks, updates, and AI
            operator context after a prospect becomes a real account.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {sourceLeadId ? (
            <Button asChild className="rounded-md">
              <Link href={`/dashboard/accounts/${encodeURIComponent(sourceLeadId)}`}>
                Open lead room <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          ) : null}
          <Button type="button" variant="outline" className="rounded-md" onClick={copyOperatorPrompt}>
            <Sparkles className="mr-2 h-4 w-4" />
            Copy operator prompt
          </Button>
          <Button type="button" variant="outline" className="rounded-md" onClick={copyBrief}>
            <Clipboard className="mr-2 h-4 w-4" />
            Copy brief
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          ["Open tasks", String(openTaskCount)],
          ["Completed", String(completedTaskCount)],
          ["Risk", normalizeStatus(account.risk_level)],
          ["Updated", formatDateTime(account.updated_at)],
        ].map(([label, value]) => (
          <Card key={label} className="rounded-lg shadow-none">
            <CardContent className="p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">{label}</p>
              <p className="mt-3 text-sm font-semibold text-slate-950">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="rounded-lg shadow-none">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="text-xl">Account task plan</CardTitle>
              <ListChecks className="h-5 w-5 text-violet-600" />
            </div>
            <p className="text-sm leading-6 text-slate-600">
              Generate a reusable kickoff plan for this permanent account, then mark the work as it moves.
            </p>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-violet-50 p-4">
              <div>
                <p className="text-sm font-semibold text-violet-950">
                  {openTaskCount > 0 ? `${openTaskCount} open operating tasks` : "No account task plan yet"}
                </p>
                <p className="mt-1 text-sm leading-5 text-violet-800">
                  These tasks stay with the account even when there is no original lead room.
                </p>
              </div>
              <Button type="button" className="rounded-md" onClick={generateTaskPlan} disabled={generatingTasks}>
                {generatingTasks ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Create task plan
              </Button>
            </div>

            {taskLoading ? (
              <div className="flex items-center gap-2 rounded-lg border border-dashed p-5 text-sm text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading account tasks...
              </div>
            ) : tasks.length === 0 ? (
              <div className="rounded-lg border border-dashed p-5 text-sm leading-6 text-slate-600">
                Use <span className="font-semibold text-slate-950">Create task plan</span> to create the first
                account-level operating tasks from the engagement and handoff context.
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div key={task.id} className="flex gap-3 rounded-lg border bg-white p-4">
                    <Checkbox
                      className="mt-1"
                      checked={task.status === "completed"}
                      onCheckedChange={(checked) => toggleTask(task, checked === true)}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-slate-950">{task.title}</p>
                        <Badge variant="outline" className="rounded-md">
                          {normalizeStatus(task.priority)}
                        </Badge>
                        <Badge variant={task.status === "completed" ? "secondary" : "outline"} className="rounded-md">
                          {normalizeStatus(task.status)}
                        </Badge>
                      </div>
                      {task.description ? (
                        <p className="mt-2 text-sm leading-6 text-slate-600">{task.description}</p>
                      ) : null}
                      <p className="mt-3 text-xs text-slate-500">
                        Due {formatDateTime(task.due_date)} · Source {task.source || "account"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-lg shadow-none">
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <CardTitle className="text-xl">Next operating action</CardTitle>
                <Sparkles className="h-5 w-5 text-violet-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border bg-violet-50 p-4">
                <p className="text-sm font-semibold text-violet-950">
                  {primaryEngagement?.next_step ||
                    readString(metadata, "last_account_next_action") ||
                    "Define the first accountable operating lane."}
                </p>
                <p className="mt-2 text-sm leading-6 text-violet-800">
                  Use the operator prompt when you want AI to reason across the account, tasks, updates, and
                  engagement instead of treating this like a one-off lead.
                </p>
              </div>
              <div className="mt-4 grid gap-2">
                <Button asChild className="rounded-md">
                  <Link href="/dashboard/accounts">
                    Account command center <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="rounded-md">
                  <Link href="/packages">
                    Send package <PackageCheck className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg shadow-none">
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <CardTitle className="text-xl">Contact and source</CardTitle>
                <ShieldCheck className="h-5 w-5 text-violet-600" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                ["Contact", contactName || "Not set"],
                ["Email", contactEmail || "Not set"],
                ["Phone", contactPhone || "Not set"],
                ["Source lead", sourceLeadId || "None"],
                ["Created from", createdFrom ? normalizeStatus(createdFrom) : "Not set"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border bg-white p-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">{label}</p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">{value}</p>
                </div>
              ))}
              {sourceLeadId ? (
                <Button asChild variant="outline" className="w-full rounded-md">
                  <Link href={`/dashboard/accounts/${encodeURIComponent(sourceLeadId)}`}>
                    Open source lead room <ExternalLink className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="rounded-lg shadow-none">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-xl">Account update log</CardTitle>
            <Save className="h-5 w-5 text-violet-600" />
          </div>
          <p className="text-sm leading-6 text-slate-600">
            Capture decisions, risks, and next actions so the assistant has durable account memory.
          </p>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-3 rounded-lg border bg-white p-4">
            <div>
              <p className="text-sm font-medium text-slate-950">Update summary</p>
              <Textarea
                className="mt-2 min-h-24"
                value={updateForm.summary}
                onChange={(event) => setUpdateForm((current) => ({ ...current, summary: event.target.value }))}
                placeholder="What changed with this account?"
              />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-950">Decision</p>
              <Input
                className="mt-2"
                value={updateForm.decision}
                onChange={(event) => setUpdateForm((current) => ({ ...current, decision: event.target.value }))}
                placeholder="What did we decide?"
              />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-950">Risk</p>
              <Input
                className="mt-2"
                value={updateForm.risk}
                onChange={(event) => setUpdateForm((current) => ({ ...current, risk: event.target.value }))}
                placeholder="What could slow this down?"
              />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-950">Next action</p>
              <Input
                className="mt-2"
                value={updateForm.nextAction}
                onChange={(event) => setUpdateForm((current) => ({ ...current, nextAction: event.target.value }))}
                placeholder="What should happen next?"
              />
            </div>
            <Button type="button" className="w-full rounded-md" onClick={saveAccountUpdate} disabled={savingUpdate}>
              {savingUpdate ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save account update
            </Button>
          </div>

          <div className="space-y-3">
            {accountUpdates.length === 0 ? (
              <div className="rounded-lg border border-dashed p-5 text-sm leading-6 text-slate-600">
                No updates yet. Add the first note after a call, payment, decision, or delivery milestone.
              </div>
            ) : (
              accountUpdates.map((update) => (
                <div key={update.id} className="rounded-lg border bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-950">{update.summary}</p>
                    <Badge variant="outline" className="rounded-md">
                      {formatDateTime(update.createdAt)}
                    </Badge>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm leading-6 text-slate-600">
                    {update.decision ? <p><span className="font-medium text-slate-950">Decision:</span> {update.decision}</p> : null}
                    {update.risk ? <p><span className="font-medium text-slate-950">Risk:</span> {update.risk}</p> : null}
                    {update.nextAction ? <p><span className="font-medium text-slate-950">Next:</span> {update.nextAction}</p> : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-lg shadow-none">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="text-xl">Engagements</CardTitle>
              <BriefcaseBusiness className="h-5 w-5 text-violet-600" />
            </div>
            <p className="text-sm leading-6 text-slate-600">
              The active commercial and delivery lanes attached to this permanent account.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {engagements.length === 0 ? (
              <div className="rounded-lg border border-dashed p-5 text-sm text-slate-600">
                No engagement is attached yet. Link this account to a lead or create the first operating lane.
              </div>
            ) : (
              engagements.map((engagement) => (
                <div key={engagement.id} className="rounded-lg border bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{engagement.offer_name}</p>
                      <p className="mt-1 text-sm text-slate-600">{engagement.system_name}</p>
                    </div>
                    <Badge variant="outline" className="rounded-md">
                      {normalizeStatus(engagement.stage)}
                    </Badge>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Value</p>
                      <p className="mt-1 text-sm font-medium text-slate-950">
                        {engagement.value_range || "Not set"}
                      </p>
                    </div>
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Updated</p>
                      <p className="mt-1 text-sm font-medium text-slate-950">
                        {formatDateTime(engagement.updated_at)}
                      </p>
                    </div>
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
                        Engagement ID
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-950">{shortId(engagement.id)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="rounded-lg shadow-none">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="text-xl">Handoff context</CardTitle>
              <CalendarClock className="h-5 w-5 text-violet-600" />
            </div>
            <p className="text-sm leading-6 text-slate-600">
              Context captured from package intake or client handoff, stored on the permanent account.
            </p>
          </CardHeader>
          <CardContent>
            {handoffContext ? (
              <div className="space-y-3">
                {[
                  ["Workflow owner", readString(handoffContext, "workflowOwner")],
                  ["Success metric", readString(handoffContext, "successMetric")],
                  ["Tools and data", readString(handoffContext, "toolsAndData")],
                  ["Examples", readString(handoffContext, "realExamples")],
                  ["Rules and constraints", readString(handoffContext, "rulesAndEscalations")],
                  ["Notes", readString(handoffContext, "notes")],
                ]
                  .filter(([, value]) => Boolean(value))
                  .map(([label, value]) => (
                    <div key={label} className="rounded-lg border bg-white p-4">
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">{label}</p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{value}</p>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-5 text-sm text-slate-600">
                No handoff context is stored on this account yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {account.notes ? (
        <Card className="rounded-lg shadow-none">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="text-xl">Account notes</CardTitle>
              <CheckCircle2 className="h-5 w-5 text-violet-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap rounded-lg border bg-white p-4 text-sm leading-6 text-slate-700">
              {account.notes}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
