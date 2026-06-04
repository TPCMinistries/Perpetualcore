"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  CalendarClock,
  CheckCircle2,
  Clipboard,
  FileText,
  Loader2,
  Mail,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type HandoffAccount = {
  id: string;
  name: string;
  company: string;
  status: string;
  lane: string;
  value: string;
  nextStep: string;
  buyerStage?: string;
  paymentPath?: string;
  paymentStatus?: string;
  commercialNextStep?: string;
  handoffContextReceived?: boolean;
  openTaskCount?: number;
  blockedTaskCount?: number;
  overdueTaskCount?: number;
  nextTaskDueDate?: string;
  createdAt: string;
  href: string;
};

type HandoffData = {
  summary: {
    activeClientCount: number;
    paidStartCount?: number;
    paymentReadyCount?: number;
    blockedClosePathCount?: number;
  };
  activeClients: HandoffAccount[];
};

type HandoffState = "all" | "needs_context" | "needs_tasks" | "ready" | "blocked";

const emptyData: HandoffData = {
  summary: {
    activeClientCount: 0,
    paidStartCount: 0,
    paymentReadyCount: 0,
    blockedClosePathCount: 0,
  },
  activeClients: [],
};

const handoffStates: Array<{ value: HandoffState; label: string }> = [
  { value: "all", label: "All states" },
  { value: "needs_context", label: "Needs context" },
  { value: "needs_tasks", label: "Needs tasks" },
  { value: "ready", label: "Ready" },
  { value: "blocked", label: "Blocked" },
];

function normalizeStatus(value?: string | null) {
  return (value || "not set").replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value?: string | null) {
  if (!value) return "No due date";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(value));
}

function formatDue(value?: string) {
  if (!value) return "No due date";

  const due = new Date(value);
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const startOfDue = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
  const delta = Math.round((startOfDue - startOfToday) / 86400000);

  if (delta < 0) return `${Math.abs(delta)}d overdue`;
  if (delta === 0) return "Due today";
  if (delta === 1) return "Due tomorrow";
  return `Due ${formatDate(value)}`;
}

function getHandoffState(account: HandoffAccount) {
  const paid = account.paymentStatus === "paid" || account.status.toLowerCase().includes("paid");
  const blocked = account.paymentStatus === "blocked" || Boolean(account.blockedTaskCount);
  const hasContext = Boolean(account.handoffContextReceived);
  const hasTasks = Boolean(account.openTaskCount && account.openTaskCount > 0);
  const hasOverdue = Boolean(account.overdueTaskCount && account.overdueTaskCount > 0);

  if (blocked || hasOverdue) {
    return {
      key: "blocked" as const,
      label: hasOverdue ? "Delivery risk" : "Blocked",
      detail: hasOverdue
        ? "There is overdue account work. Clear or reassign the next task before the relationship cools."
        : "Payment, approval, access, or delivery is blocked. Resolve this before adding scope.",
      score: 1,
      className: "border-red-200 bg-red-50 text-red-800",
    };
  }

  if (paid && !hasContext) {
    return {
      key: "needs_context" as const,
      label: "Needs client context",
      detail: "Money or intent is clear. Send the client handoff so the first operating lane has real context.",
      score: 2,
      className: "border-amber-200 bg-amber-50 text-amber-800",
    };
  }

  if (hasContext && !hasTasks) {
    return {
      key: "needs_tasks" as const,
      label: "Needs task plan",
      detail: "Client context is in. Sync handoff tasks so the first lane has owners and due dates.",
      score: 3,
      className: "border-blue-200 bg-blue-50 text-blue-800",
    };
  }

  if (hasContext && hasTasks) {
    return {
      key: "ready" as const,
      label: "Ready to operate",
      detail: "Context and tasks are connected. Open the account room and work the next visible task.",
      score: 5,
      className: "border-emerald-200 bg-emerald-50 text-emerald-800",
    };
  }

  return {
    key: "needs_context" as const,
    label: "Needs routing",
    detail: "Choose the buyer path, then send checkout, invoice, proposal, or handoff based on readiness.",
    score: 0,
    className: "border-slate-200 bg-slate-50 text-slate-700",
  };
}

function getPrimaryAction(account: HandoffAccount) {
  const state = getHandoffState(account);

  if (state.key === "blocked") return "Clear blocker";
  if (state.key === "needs_context") return "Send handoff";
  if (state.key === "needs_tasks") return "Sync tasks";
  if (state.key === "ready") return "Run next task";
  return "Route account";
}

function buildHandoffBrief(accounts: HandoffAccount[]) {
  const rows = accounts.slice(0, 8).map((account, index) => {
    const state = getHandoffState(account);
    return [
      `${index + 1}. ${account.name}`,
      `Company/contact: ${account.company}`,
      `Lane: ${account.lane}`,
      `State: ${state.label}`,
      `Action: ${getPrimaryAction(account)}`,
      `Task pulse: ${account.openTaskCount || 0} open, ${account.blockedTaskCount || 0} blocked, ${account.overdueTaskCount || 0} overdue`,
      `Next due: ${formatDue(account.nextTaskDueDate)}`,
    ].join("\n");
  });

  return [
    "Perpetual Core handoff queue brief",
    "",
    `Accounts reviewed: ${accounts.length}`,
    "",
    rows.length > 0 ? rows.join("\n\n") : "No active handoff accounts in this view.",
    "",
    "Assistant instruction: protect paid-client momentum first, then close context gaps, then turn submitted context into task-backed delivery.",
  ].join("\n");
}

function buildClientHandoffAsk(account: HandoffAccount) {
  return [
    `Subject: ${account.name} kickoff context`,
    "",
    `Hi ${account.name},`,
    "",
    `To start ${account.lane} cleanly, I want to collect the minimum context before we build the first operating surface.`,
    "",
    "The main things I need are:",
    "1. The workflow owner",
    "2. The tools, docs, inboxes, files, or data involved",
    "3. A few real examples of the work",
    "4. What the AI should do, avoid, ask, remember, and escalate",
    "5. The success metric for the first lane",
    "",
    `Current next step: ${account.nextStep}`,
  ].join("\n");
}

export default function HandoffsPage() {
  const [data, setData] = useState<HandoffData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [stateFilter, setStateFilter] = useState<HandoffState>("all");

  async function fetchHandoffs() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/operating-dashboard", { cache: "no-store" });
      if (!response.ok) throw new Error("Could not load handoff queue");
      const result = (await response.json()) as HandoffData;
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load handoff queue");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchHandoffs();
  }, []);

  async function copyText(label: string, body: string) {
    try {
      await navigator.clipboard.writeText(body);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Could not copy text");
    }
  }

  const filteredAccounts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return data.activeClients
      .filter((account) => {
        const state = getHandoffState(account);
        const haystack = [
          account.name,
          account.company,
          account.status,
          account.lane,
          account.nextStep,
          account.paymentStatus,
          state.label,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const queryMatches = !normalizedQuery || haystack.includes(normalizedQuery);
        const stateMatches = stateFilter === "all" || state.key === stateFilter;
        return queryMatches && stateMatches;
      })
      .sort((a, b) => {
        const stateA = getHandoffState(a);
        const stateB = getHandoffState(b);
        if (stateA.score !== stateB.score) return stateA.score - stateB.score;
        return new Date(a.nextTaskDueDate || a.createdAt).getTime() - new Date(b.nextTaskDueDate || b.createdAt).getTime();
      });
  }, [data.activeClients, query, stateFilter]);

  const counts = useMemo(() => {
    return data.activeClients.reduce(
      (summary, account) => {
        const state = getHandoffState(account).key;
        return {
          ...summary,
          [state]: summary[state] + 1,
        };
      },
      {
        needs_context: 0,
        needs_tasks: 0,
        ready: 0,
        blocked: 0,
      },
    );
  }, [data.activeClients]);

  const readyPercent =
    data.activeClients.length > 0
      ? Math.round(((counts.ready + counts.needs_tasks) / data.activeClients.length) * 100)
      : 0;

  const topAccount = filteredAccounts[0];

  return (
    <div className="space-y-6 pb-10">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-violet-600" />
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-slate-500">
                Perpetual Core Handoff Command
              </p>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
              Move paid interest into real operating work.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Use this queue to see which accounts need client context, which need tasks, and which
              are ready for the next delivery action.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="rounded-md"
              onClick={() => copyText("Handoff queue brief", buildHandoffBrief(filteredAccounts))}
            >
              <Clipboard className="mr-2 h-4 w-4" />
              Copy queue brief
            </Button>
            <Button asChild className="rounded-md">
              <Link href="/dashboard/accounts">
                Accounts <ArrowRight className="ml-2 h-4 w-4" />
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

      <div className="grid gap-4 md:grid-cols-4">
        {[
          ["Needs context", counts.needs_context, "Send or complete the client handoff."],
          ["Needs tasks", counts.needs_tasks, "Turn submitted context into kickoff work."],
          ["Ready", counts.ready, "Open the room and run the next task."],
          ["Blocked", counts.blocked, "Resolve payment, access, or overdue work."],
        ].map(([label, value, detail]) => (
          <Card key={label} className="rounded-lg shadow-none">
            <CardContent className="p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">{label}</p>
              <p className="mt-3 text-2xl font-semibold text-slate-950">{value}</p>
              <p className="mt-2 text-xs leading-5 text-slate-600">{detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden rounded-lg border-violet-200 shadow-none">
        <CardContent className="p-0">
          <div className="grid gap-0 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="bg-slate-950 p-5 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-violet-200">
                    Operator focus
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                    {topAccount ? getPrimaryAction(topAccount) : "No account action"}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    {topAccount
                      ? `${topAccount.name}: ${getHandoffState(topAccount).detail}`
                      : "Add or close a lead to create a handoff queue."}
                  </p>
                </div>
                <Bot className="h-5 w-5 shrink-0 text-violet-300" />
              </div>
              <div className="mt-5 rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-white">Operating readiness</p>
                  <p className="text-xl font-semibold text-white">{readyPercent}%</p>
                </div>
                <Progress value={readyPercent} className="mt-3 h-2" />
                <p className="mt-3 text-xs leading-5 text-slate-400">
                  Counts accounts with submitted context or task-backed delivery as moving toward readiness.
                </p>
              </div>
            </div>
            <div className="grid gap-3 p-5 md:grid-cols-3">
              {[
                {
                  title: "1. Collect context",
                  detail: "Workflow owner, tools, examples, rules, and success metric.",
                  icon: FileText,
                },
                {
                  title: "2. Create task plan",
                  detail: "Kickoff, context mapping, first deliverable, and expansion review.",
                  icon: Target,
                },
                {
                  title: "3. Operate weekly",
                  detail: "Use the account room to keep AI, owner, work, and proof connected.",
                  icon: ShieldCheck,
                },
              ].map((item) => (
                <div key={item.title} className="rounded-lg border bg-slate-50 p-4">
                  <item.icon className="h-5 w-5 text-violet-600" />
                  <p className="mt-4 text-sm font-semibold text-slate-950">{item.title}</p>
                  <p className="mt-2 text-sm leading-5 text-slate-600">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-lg shadow-none">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="text-xl">Handoff queue</CardTitle>
            <p className="mt-1 text-sm text-slate-600">
              Sorted by accounts that need intervention first.
            </p>
          </div>
          <Button type="button" variant="outline" className="w-fit rounded-md" onClick={fetchHandoffs} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 rounded-lg border bg-slate-50 p-3 md:grid-cols-[1fr_220px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search account, company, lane, or next step..."
                className="h-10 rounded-md bg-white pl-9"
              />
            </div>
            <Select value={stateFilter} onValueChange={(value) => setStateFilter(value as HandoffState)}>
              <SelectTrigger className="h-10 rounded-md bg-white">
                <SelectValue placeholder="State" />
              </SelectTrigger>
              <SelectContent>
                {handoffStates.map((state) => (
                  <SelectItem key={state.value} value={state.value}>
                    {state.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-slate-600">
              Loading handoff queue...
            </div>
          ) : filteredAccounts.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-slate-600">
              No accounts match this handoff view.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAccounts.map((account) => {
                const state = getHandoffState(account);

                return (
                  <div
                    key={account.id}
                    className="grid gap-4 rounded-lg border bg-white p-4 transition hover:border-violet-300 hover:bg-violet-50/30 lg:grid-cols-[minmax(0,1fr)_190px_190px]"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-950">{account.name}</p>
                        <span className={`rounded-md border px-2 py-1 text-xs font-medium ${state.className}`}>
                          {state.label}
                        </span>
                        <Badge variant="outline" className="rounded-md">
                          {account.lane}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">{account.company}</p>
                      <p className="mt-3 text-sm leading-5 text-slate-600">{state.detail}</p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                        <span className="rounded-md bg-slate-100 px-2 py-1">
                          Payment: {normalizeStatus(account.paymentStatus)}
                        </span>
                        <span className="rounded-md bg-slate-100 px-2 py-1">
                          Context: {account.handoffContextReceived ? "received" : "missing"}
                        </span>
                        <span className="rounded-md bg-slate-100 px-2 py-1">
                          Open tasks: {account.openTaskCount || 0}
                        </span>
                        {account.overdueTaskCount ? (
                          <span className="rounded-md bg-red-50 px-2 py-1 text-red-700">
                            {account.overdueTaskCount} overdue
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
                        Next action
                      </p>
                      <p className="mt-2 text-sm font-semibold leading-5 text-slate-950">
                        {getPrimaryAction(account)}
                      </p>
                      <p className="mt-2 text-xs leading-5 text-slate-600">{account.nextStep}</p>
                    </div>

                    <div className="grid content-start gap-2">
                      <div className="rounded-md border bg-slate-50 p-3">
                        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
                          Next due
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-950">
                          {formatDue(account.nextTaskDueDate)}
                        </p>
                      </div>
                      <Button asChild size="sm" className="h-8 rounded-md">
                        <Link href={account.href}>
                          Open room <ArrowRight className="ml-2 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-md"
                        onClick={() => copyText("Client handoff ask", buildClientHandoffAsk(account))}
                      >
                        <Mail className="mr-2 h-3.5 w-3.5" />
                        Copy ask
                      </Button>
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
            <div>
              <CardTitle className="text-xl">Assistant operating rule</CardTitle>
              <p className="mt-1 text-sm text-slate-600">
                Keep the AI flexible across the account, but force it to respect sequence.
              </p>
            </div>
            <Sparkles className="h-5 w-5 text-violet-600" />
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          {[
            ["Do not start vague delivery", "No paid account should expand without context, first lane, and task owner."],
            ["Never lock to one script", "Use account state to choose checkout, invoice, procurement, handoff, or delivery next."],
            ["Preserve account memory", "Lead notes, payment state, handoff fields, tasks, and follow-ups stay attached."],
            ["Expand from proof", "Use the first lane result to justify the next workflow or 90-day operating lane."],
          ].map(([title, detail]) => (
            <div key={title} className="rounded-lg border bg-white p-4">
              <CheckCircle2 className="h-5 w-5 text-violet-600" />
              <p className="mt-4 text-sm font-semibold text-slate-950">{title}</p>
              <p className="mt-2 text-sm leading-5 text-slate-600">{detail}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
