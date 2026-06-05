"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  AlertTriangle,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type AccountLane = {
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
  closePathUpdatedAt?: string;
  handoffContextReceived?: boolean;
  openTaskCount?: number;
  blockedTaskCount?: number;
  overdueTaskCount?: number;
  nextTaskDueDate?: string;
  sourceType?: string;
  leadId?: string;
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
    paidStartCount?: number;
    paymentReadyCount?: number;
    blockedClosePathCount?: number;
    proposalCount?: number;
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

function getPaymentBadgeVariant(status?: string) {
  if (status === "paid") return "default";
  if (status === "blocked") return "secondary";
  return "outline";
}

function matchesFilter(value: string | undefined, filter: string) {
  return filter === "all" || value === filter;
}

function getPackageIdForAccount(client: AccountLane) {
  const lane = client.lane.toLowerCase();
  if (lane.includes("90-day") || lane.includes("operating lane")) return "operating-lane-deposit";
  if (lane.includes("workflow")) return "first-workflow";
  if (lane.includes("setup")) return "guided-setup";
  return "software-access";
}

function getAccountBrief(client: AccountLane) {
  return [
    `Account: ${client.name}`,
    `Company/contact: ${client.company}`,
    `Source: ${client.sourceType || "Account workspace"}`,
    `Lane: ${client.lane}`,
    `Value: ${client.value}`,
    `Status: ${normalizeStatus(client.status)}`,
    `Buyer stage: ${client.buyerStage ? normalizeStatus(client.buyerStage) : "Not set"}`,
    `Payment path: ${client.paymentPath ? normalizeStatus(client.paymentPath) : "Not set"}`,
    `Payment status: ${client.paymentStatus ? normalizeStatus(client.paymentStatus) : "Not set"}`,
    `Next step: ${client.nextStep}`,
    "",
    "AI instruction: Use this account state to recommend the next commercial action, the next delivery action, and the smallest proof point that can expand the relationship.",
  ].join("\n");
}

function getAccountFollowUp(client: AccountLane) {
  if (client.paymentStatus === "paid") {
    return `Hi ${client.name},\n\nWe have the start path confirmed. The next step is to lock the kickoff window, confirm the first operating lane, and gather the minimum context needed to ship the first working surface.\n\nCurrent lane: ${client.lane}\nNext step: ${client.nextStep}`;
  }

  if (client.paymentStatus === "blocked") {
    return `Hi ${client.name},\n\nI want to help unblock the start path. The work is mapped as ${client.lane}; the next clean move is to confirm whether checkout, invoice, procurement, or signed approval is the best payment path.\n\nOnce that is clear, we can move into kickoff without dragging the process out.`;
  }

  return `Hi ${client.name},\n\nBased on where we are, I would start with ${client.lane}. The next step is to confirm the payment/start path and the first outcome we should install.\n\nRecommended next move: ${client.nextStep}`;
}

function getAccountReadiness(client: AccountLane) {
  const hasPaymentPath = Boolean(client.paymentPath);
  const paymentSent = ["sent", "in_review", "paid"].includes(client.paymentStatus || "");
  const paid = client.paymentStatus === "paid" || client.status.toLowerCase().includes("paid");
  const blocked = client.paymentStatus === "blocked";
  const hasContext = Boolean(client.handoffContextReceived);
  const hasOpenTasks = Boolean(client.openTaskCount && client.openTaskCount > 0);

  if (paid) {
    if (!hasContext) {
      return {
        label: "Needs handoff context",
        detail: "Payment is clear. Send or complete the client handoff so the first lane has real operating context.",
        score: 4,
        tone: "blue",
      };
    }

    if (!hasOpenTasks) {
      return {
        label: "Needs task plan",
        detail: "Context is in. Sync or generate kickoff tasks before delivery gets vague.",
        score: 4,
        tone: "amber",
      };
    }

    return {
      label: "Ready for delivery",
      detail: "Payment, context, and tasks are connected. Open the room and run the next account task.",
      score: 5,
      tone: "emerald",
    };
  }

  if (blocked) {
    return {
      label: "Blocked",
      detail: "Send procurement, invoice, or approval language to unblock the buying path.",
      score: 1,
      tone: "red",
    };
  }

  if (paymentSent) {
    return {
      label: "Waiting on buyer",
      detail: "Follow up on the sent package, invoice, or approval path.",
      score: 3,
      tone: "amber",
    };
  }

  if (hasPaymentPath) {
    return {
      label: "Send start path",
      detail: "The package path is chosen. Send the buyer link, invoice request, or procurement note.",
      score: 2,
      tone: "blue",
    };
  }

  return {
    label: "Needs routing",
    detail: "Choose the package lane and payment path before delivery starts.",
    score: 0,
    tone: "slate",
  };
}

function getReadinessClasses(tone: string) {
  if (tone === "emerald") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (tone === "red") return "border-red-200 bg-red-50 text-red-800";
  if (tone === "amber") return "border-amber-200 bg-amber-50 text-amber-800";
  if (tone === "blue") return "border-blue-200 bg-blue-50 text-blue-800";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function getAccountRisk(client: AccountLane) {
  const paid = client.paymentStatus === "paid" || client.status.toLowerCase().includes("paid");
  const blocked = client.paymentStatus === "blocked";
  const hasContext = Boolean(client.handoffContextReceived);
  const hasOpenTasks = Boolean(client.openTaskCount && client.openTaskCount > 0);
  const hasOverdueTasks = Boolean(client.overdueTaskCount && client.overdueTaskCount > 0);
  const hasPaymentPath = Boolean(client.paymentPath);

  if (blocked) {
    return {
      label: "Commercial block",
      detail: "Payment or approval is blocked. Resolve the money path before expanding scope.",
      severity: 5,
      tone: "red",
    };
  }

  if (paid && hasOverdueTasks) {
    return {
      label: "Delivery slipping",
      detail: "This paid account has overdue work. Clear or reassign the next task before the relationship cools.",
      severity: 5,
      tone: "red",
    };
  }

  if (paid && !hasContext) {
    return {
      label: "Context gap",
      detail: "Money is clear, but the operating context is missing. Send the handoff before delivery starts.",
      severity: 4,
      tone: "amber",
    };
  }

  if (paid && !hasOpenTasks) {
    return {
      label: "No task plan",
      detail: "Context should turn into visible tasks. Sync the kickoff plan so the work has a next owner.",
      severity: 4,
      tone: "amber",
    };
  }

  if (client.paymentStatus === "sent" || client.paymentStatus === "in_review") {
    return {
      label: "Buyer waiting",
      detail: "The start path is out. Follow up with one clear decision request.",
      severity: 3,
      tone: "blue",
    };
  }

  if (!hasPaymentPath) {
    return {
      label: "Unrouted",
      detail: "Choose whether this should become software access, setup, a first workflow, or a 90-day lane.",
      severity: 2,
      tone: "slate",
    };
  }

  return {
    label: "Healthy",
    detail: "The account has a clear enough path for the next move.",
    severity: 1,
    tone: "emerald",
  };
}

function getPrimaryAccountAction(client: AccountLane) {
  const risk = getAccountRisk(client);

  if (risk.label === "Commercial block") return "Send invoice/procurement unblock note";
  if (risk.label === "Delivery slipping") return "Open room and clear overdue work";
  if (risk.label === "Context gap") return "Send client handoff";
  if (risk.label === "No task plan") return "Sync kickoff tasks";
  if (risk.label === "Buyer waiting") return "Follow up on the start path";
  if (risk.label === "Unrouted") return "Pick package lane and payment path";
  return client.nextStep;
}

function getAccountCommandLine(client: AccountLane) {
  const risk = getAccountRisk(client);
  const readiness = getAccountReadiness(client);
  const dueLabel = formatTaskDueLabel(client.nextTaskDueDate);

  return [
    `${client.name} (${client.company})`,
    `Lane: ${client.lane}`,
    `Risk: ${risk.label}`,
    `Readiness: ${readiness.label}`,
    `Source: ${client.sourceType || "Account workspace"}`,
    `Action: ${getPrimaryAccountAction(client)}`,
    `Task pulse: ${client.openTaskCount || 0} open, ${client.blockedTaskCount || 0} blocked, ${client.overdueTaskCount || 0} overdue, ${dueLabel}`,
  ].join("\n");
}

function formatTaskDueLabel(value?: string) {
  if (!value) return "No due date";

  const due = new Date(value);
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const startOfDue = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
  const dayDifference = Math.round((startOfDue - startOfToday) / 86400000);

  if (dayDifference < 0) return `${Math.abs(dayDifference)}d overdue`;
  if (dayDifference === 0) return "Due today";
  if (dayDifference === 1) return "Due tomorrow";
  return `Due ${formatDate(value)}`;
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
  const [accountQuery, setAccountQuery] = useState("");
  const [laneFilter, setLaneFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

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
      const response = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: lead.id }),
      });

      if (!response.ok) {
        throw new Error("Failed to open account handoff");
      }

      const result = (await response.json()) as { lead: SourceLead };
      setSourceLead(result.lead);
      await fetchSourceLead(lead.id);
      await fetchAccounts();
      toast.success("Permanent account and delivery handoff opened");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not open delivery handoff");
    } finally {
      setSavingHandoff(false);
    }
  }

  const filteredAccounts = useMemo(() => {
    const query = accountQuery.trim().toLowerCase();

    return data.activeClients.filter((client) => {
      const haystack = [
        client.name,
        client.company,
        client.status,
        client.lane,
        client.nextStep,
        client.buyerStage,
        client.paymentPath,
        client.paymentStatus,
        client.sourceType,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const queryMatches = !query || haystack.includes(query);
      const laneMatches = laneFilter === "all" || client.lane === laneFilter;
      const paymentMatches = matchesFilter(client.paymentStatus, paymentFilter);
      return queryMatches && laneMatches && paymentMatches;
    });
  }, [accountQuery, data.activeClients, laneFilter, paymentFilter]);

  const availableLanes = useMemo(
    () => Array.from(new Set(data.activeClients.map((client) => client.lane))).filter(Boolean),
    [data.activeClients],
  );

  const paidAccounts = useMemo(
    () =>
      filteredAccounts.filter(
        (client) => client.paymentStatus === "paid" || client.status.toLowerCase().includes("paid"),
      ),
    [filteredAccounts],
  );

  const pursuitAccounts = useMemo(
    () =>
      filteredAccounts.filter(
        (client) => client.paymentStatus !== "paid" && !client.status.toLowerCase().includes("paid"),
      ),
    [filteredAccounts],
  );
  const commandQueue = useMemo(
    () =>
      [...filteredAccounts]
        .sort((a, b) => getAccountReadiness(b).score - getAccountReadiness(a).score)
        .slice(0, 6),
    [filteredAccounts],
  );
  const readinessCounts = useMemo(() => {
    const counts = {
      delivery: 0,
      waiting: 0,
      send: 0,
      blocked: 0,
      context: 0,
      tasks: 0,
    };

    data.activeClients.forEach((client) => {
      const readiness = getAccountReadiness(client);
      if (readiness.label === "Ready for delivery") counts.delivery += 1;
      if (readiness.label === "Waiting on buyer") counts.waiting += 1;
      if (readiness.label === "Send start path") counts.send += 1;
      if (readiness.label === "Blocked") counts.blocked += 1;
      if (readiness.label === "Needs handoff context") counts.context += 1;
      if (readiness.label === "Needs task plan") counts.tasks += 1;
    });

    return counts;
  }, [data.activeClients]);

  const highestRiskAccounts = useMemo(
    () =>
      [...filteredAccounts]
        .map((client) => ({
          client,
          risk: getAccountRisk(client),
        }))
        .filter(({ risk }) => risk.label !== "Healthy")
        .sort((a, b) => b.risk.severity - a.risk.severity)
        .slice(0, 5),
    [filteredAccounts],
  );

  const accountCommandPlan = useMemo(() => {
    const urgentAccounts = [...filteredAccounts]
      .map((client) => ({
        client,
        risk: getAccountRisk(client),
        readiness: getAccountReadiness(client),
        action: getPrimaryAccountAction(client),
      }))
      .sort((a, b) => {
        if (b.risk.severity !== a.risk.severity) return b.risk.severity - a.risk.severity;
        return a.readiness.score - b.readiness.score;
      });

    const commercialAccounts = urgentAccounts.filter(({ risk }) =>
      ["Commercial block", "Buyer waiting", "Unrouted"].includes(risk.label),
    );
    const deliveryAccounts = urgentAccounts.filter(({ risk }) =>
      ["Delivery slipping", "Context gap", "No task plan"].includes(risk.label),
    );
    const healthyAccounts = urgentAccounts.filter(({ risk }) => risk.label === "Healthy");
    const focusAccounts = [
      ...commercialAccounts.slice(0, 2),
      ...deliveryAccounts.slice(0, 2),
      ...healthyAccounts.slice(0, 1),
    ].slice(0, 5);

    const brief = [
      "Perpetual Core account command brief",
      "",
      `Accounts in view: ${filteredAccounts.length}`,
      `Ready for delivery: ${readinessCounts.delivery}`,
      `Need client context: ${readinessCounts.context}`,
      `Need task plan: ${readinessCounts.tasks}`,
      `Waiting on buyer: ${readinessCounts.waiting}`,
      `Blocked: ${readinessCounts.blocked}`,
      "",
      "Today:",
      focusAccounts.length
        ? focusAccounts.map(({ client }, index) => `${index + 1}. ${getAccountCommandLine(client)}`).join("\n\n")
        : "No account command items in the current filter.",
      "",
      "Assistant instruction: prioritize revenue clarity first, then paid-client delivery reliability, then expansion proof.",
    ].join("\n");

    return {
      focusAccounts,
      commercialCount: commercialAccounts.length,
      deliveryCount: deliveryAccounts.length,
      healthyCount: healthyAccounts.length,
      brief,
    };
  }, [filteredAccounts, readinessCounts]);

  const dueAccountTasks = useMemo(
    () =>
      [...filteredAccounts]
        .filter((client) => client.nextTaskDueDate || client.overdueTaskCount || client.openTaskCount)
        .sort((a, b) => {
          if (a.overdueTaskCount && !b.overdueTaskCount) return -1;
          if (!a.overdueTaskCount && b.overdueTaskCount) return 1;
          return (
            new Date(a.nextTaskDueDate || "9999-12-31").getTime() -
            new Date(b.nextTaskDueDate || "9999-12-31").getTime()
          );
        })
        .slice(0, 5),
    [filteredAccounts],
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
                              <Link href={`/dashboard/accounts/${encodeURIComponent(sourceLead.id)}`}>
                                Open account room
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
          ["Paid starts", data.summary.paidStartCount ?? data.summary.paidPackageCount],
          ["Payment ready", data.summary.paymentReadyCount ?? 0],
          ["Blocked paths", data.summary.blockedClosePathCount ?? 0],
        ].map(([label, value]) => (
          <Card key={label} className="rounded-lg shadow-none">
            <CardContent className="p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">{label}</p>
              <p className="mt-3 text-2xl font-semibold text-slate-950">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden rounded-lg border-violet-200 bg-white shadow-none">
        <CardContent className="p-0">
          <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="bg-gradient-to-br from-violet-50 via-white to-slate-50 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-violet-700">
                    Today&apos;s account command
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                    Start with the accounts that move money or protect delivery.
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    The assistant can use this brief to decide whether to chase payment, collect context,
                    generate tasks, or open the account room for active delivery work.
                  </p>
                </div>
                <Sparkles className="h-5 w-5 shrink-0 text-violet-600" />
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {[
                  ["Commercial", accountCommandPlan.commercialCount, "Money path, buyer follow-up, routing."],
                  ["Delivery", accountCommandPlan.deliveryCount, "Context, tasks, overdue work."],
                  ["Healthy", accountCommandPlan.healthyCount, "Expansion and relationship proof."],
                ].map(([label, value, detail]) => (
                  <div key={label} className="rounded-lg border border-violet-100 bg-white p-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">{label}</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
                    <p className="mt-2 text-xs leading-5 text-slate-600">{detail}</p>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                className="mt-5 rounded-md"
                onClick={() => copyAccountText("Account command brief", accountCommandPlan.brief)}
              >
                <Clipboard className="mr-2 h-4 w-4" />
                Copy command brief
              </Button>
            </div>

            <div className="border-t border-violet-100 p-5 lg:border-l lg:border-t-0">
              {accountCommandPlan.focusAccounts.length === 0 ? (
                <div className="rounded-lg border border-dashed p-5 text-sm text-slate-600">
                  No priority account actions in the current filter.
                </div>
              ) : (
                <div className="space-y-3">
                  {accountCommandPlan.focusAccounts.map(({ client, risk, readiness, action }, index) => (
                    <div key={client.id} className="rounded-lg border bg-white p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
                              {String(index + 1).padStart(2, "0")}
                            </span>
                            <p className="font-semibold text-slate-950">{client.name}</p>
                          </div>
                          <p className="mt-1 text-sm text-slate-600">{client.company}</p>
                        </div>
                        <span className={`rounded-md border px-2 py-1 text-xs font-medium ${getReadinessClasses(risk.tone)}`}>
                          {risk.label}
                        </span>
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_150px_auto] md:items-center">
                        <div>
                          <p className="text-sm font-semibold text-slate-950">{action}</p>
                          <p className="mt-1 text-xs leading-5 text-slate-600">{readiness.detail}</p>
                        </div>
                        <div>
                          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Next due</p>
                          <p className="mt-1 text-sm font-medium text-slate-950">
                            {formatTaskDueLabel(client.nextTaskDueDate)}
                          </p>
                        </div>
                        <Button asChild size="sm" className="h-8 rounded-md">
                          <Link href={client.href}>
                            Work it <ArrowRight className="ml-2 h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-lg shadow-none">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl">Account command queue</CardTitle>
                <p className="mt-1 text-sm text-slate-600">
                  Sorted by readiness so the best next account action is visible without opening every room.
                </p>
              </div>
              <Bot className="h-5 w-5 text-violet-600" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {commandQueue.length === 0 ? (
              <div className="rounded-lg border border-dashed p-5 text-sm text-slate-600">
                No accounts in the current queue.
              </div>
            ) : (
              commandQueue.map((client) => {
                const readiness = getAccountReadiness(client);
                return (
                  <div
                    key={client.id}
                    className="grid gap-4 rounded-lg border bg-white p-4 lg:grid-cols-[minmax(0,1fr)_180px_150px]"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-950">{client.name}</p>
                        {client.sourceType ? (
                          <Badge variant="outline" className="rounded-md">
                            {client.sourceType}
                          </Badge>
                        ) : null}
                        <span className={`rounded-md border px-2 py-1 text-xs font-medium ${getReadinessClasses(readiness.tone)}`}>
                          {readiness.label}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">{client.company}</p>
                      <p className="mt-3 text-sm leading-5 text-slate-600">{readiness.detail}</p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                        <span className="rounded-md bg-slate-100 px-2 py-1">
                          Context: {client.handoffContextReceived ? "received" : "missing"}
                        </span>
                        <span className="rounded-md bg-slate-100 px-2 py-1">
                          Tasks: {client.openTaskCount || 0} open
                        </span>
                        {client.overdueTaskCount ? (
                          <span className="rounded-md bg-red-50 px-2 py-1 text-red-700">
                            {client.overdueTaskCount} overdue
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Next move</p>
                      <p className="mt-2 text-sm font-medium leading-5 text-slate-950">{client.nextStep}</p>
                    </div>
                    <div className="grid content-start gap-2">
                      <Button asChild size="sm" className="h-8 rounded-md">
                        <Link href={client.href}>
                          Open room <ArrowRight className="ml-2 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-md"
                        onClick={() => copyAccountText("Follow-up", getAccountFollowUp(client))}
                      >
                        <Mail className="mr-2 h-3.5 w-3.5" />
                        Follow-up
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-lg shadow-none">
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <CardTitle className="text-xl">Readiness breakdown</CardTitle>
                <Target className="h-5 w-5 text-violet-600" />
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {[
                ["Ready for delivery", readinessCounts.delivery, "Open account room and start kickoff."],
                ["Need context", readinessCounts.context, "Send client handoff or collect operating context."],
                ["Need task plan", readinessCounts.tasks, "Sync or generate kickoff tasks."],
                ["Waiting on buyer", readinessCounts.waiting, "Follow up on sent package or approval."],
                ["Need start path", readinessCounts.send, "Send checkout, invoice, or procurement note."],
                ["Blocked", readinessCounts.blocked, "Unblock payment or approval path."],
              ].map(([label, value, detail]) => (
                <div key={label} className="rounded-lg border bg-white p-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">{label}</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
                  <p className="mt-2 text-xs leading-5 text-slate-600">{detail}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-lg shadow-none">
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <CardTitle className="text-xl">Recent package starts</CardTitle>
                <CircleDollarSign className="h-5 w-5 text-violet-600" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.recentPackages.length === 0 ? (
                <div className="rounded-lg border border-dashed p-4 text-sm text-slate-600">
                  No package starts recorded yet.
                </div>
              ) : (
                data.recentPackages.slice(0, 4).map((payment) => (
                  <div key={payment.id} className="rounded-lg border bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-950">{payment.packageName}</p>
                        <p className="mt-1 text-xs text-slate-600">
                          {payment.customerName || payment.customerEmail || "Unknown buyer"}
                        </p>
                      </div>
                      <Badge className="rounded-md" variant={payment.status === "paid" ? "default" : "outline"}>
                        {normalizeStatus(payment.status)}
                      </Badge>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                      <span className="font-semibold text-slate-950">{payment.amountFormatted}</span>
                      <span className="text-xs text-slate-500">{formatDate(payment.createdAt)}</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card className="rounded-lg shadow-none">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl">Risk and gap control</CardTitle>
                <p className="mt-1 text-sm text-slate-600">
                  Shows the accounts most likely to lose momentum because payment, context, or delivery work is unclear.
                </p>
              </div>
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {highestRiskAccounts.length === 0 ? (
              <div className="rounded-lg border border-dashed p-5 text-sm text-slate-600">
                No account risks in the current filter. Keep the next task and follow-up cadence visible.
              </div>
            ) : (
              highestRiskAccounts.map(({ client, risk }) => (
                <div key={client.id} className="rounded-lg border bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-950">{client.name}</p>
                        {client.sourceType ? (
                          <Badge variant="outline" className="rounded-md">
                            {client.sourceType}
                          </Badge>
                        ) : null}
                        <span
                          className={`rounded-md border px-2 py-1 text-xs font-medium ${getReadinessClasses(
                            risk.tone,
                          )}`}
                        >
                          {risk.label}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">{client.company}</p>
                    </div>
                    <Badge variant="outline" className="rounded-md">
                      {client.lane}
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm leading-5 text-slate-600">{risk.detail}</p>
                  <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
                    <p className="text-sm font-medium text-slate-950">{getPrimaryAccountAction(client)}</p>
                    <Button asChild size="sm" className="h-8 rounded-md">
                      <Link href={client.href}>
                        Work it <ArrowRight className="ml-2 h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="rounded-lg shadow-none">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl">Task pulse</CardTitle>
                <p className="mt-1 text-sm text-slate-600">
                  A fast view of which paid or active accounts have work in motion, overdue, or missing.
                </p>
              </div>
              <CalendarClock className="h-5 w-5 text-violet-600" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {dueAccountTasks.length === 0 ? (
              <div className="rounded-lg border border-dashed p-5 text-sm text-slate-600">
                No account tasks are attached yet. Paid accounts should get a kickoff plan as soon as context is in.
              </div>
            ) : (
              dueAccountTasks.map((client) => (
                <div
                  key={client.id}
                  className="grid gap-4 rounded-lg border bg-white p-4 sm:grid-cols-[minmax(0,1fr)_130px_110px]"
                >
                  <div>
                    <p className="font-semibold text-slate-950">{client.name}</p>
                    <p className="mt-1 text-sm text-slate-600">{client.company}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                      <span className="rounded-md bg-slate-100 px-2 py-1">
                        {client.openTaskCount || 0} open
                      </span>
                      <span className="rounded-md bg-slate-100 px-2 py-1">
                        {client.blockedTaskCount || 0} blocked
                      </span>
                      {client.overdueTaskCount ? (
                        <span className="rounded-md bg-red-50 px-2 py-1 text-red-700">
                          {client.overdueTaskCount} overdue
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Next due</p>
                    <p className="mt-2 text-sm font-semibold text-slate-950">
                      {formatTaskDueLabel(client.nextTaskDueDate)}
                    </p>
                  </div>
                  <Button asChild size="sm" variant="outline" className="h-8 rounded-md self-start">
                    <Link href={client.href}>Open</Link>
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          ["Package revenue", data.summary.packageRevenueFormatted],
          ["Open demand", data.summary.pipelineValueFormatted],
          ["Open leads", data.summary.openLeadCount],
          ["In proposal", data.summary.proposalCount ?? 0],
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
            <div className="grid gap-3 rounded-lg border bg-slate-50 p-3 md:grid-cols-[1fr_180px_180px]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={accountQuery}
                  onChange={(event) => setAccountQuery(event.target.value)}
                  placeholder="Search accounts, companies, next steps..."
                  className="h-10 rounded-md bg-white pl-9"
                />
              </div>
              <Select value={laneFilter} onValueChange={setLaneFilter}>
                <SelectTrigger className="h-10 rounded-md bg-white">
                  <SelectValue placeholder="Lane" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All lanes</SelectItem>
                  {availableLanes.map((lane) => (
                    <SelectItem key={lane} value={lane}>
                      {lane}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="h-10 rounded-md bg-white">
                  <SelectValue placeholder="Payment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All payment states</SelectItem>
                  <SelectItem value="not_sent">Not sent</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="in_review">In review</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="rounded-lg border border-dashed p-6 text-sm text-slate-600">
                Loading account lanes...
              </div>
            ) : data.activeClients.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-sm text-slate-600">
                No active account lanes yet. Add a lead, send a package, or close a paid workflow.
              </div>
            ) : filteredAccounts.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-sm text-slate-600">
                No accounts match those filters.
              </div>
            ) : (
              [...paidAccounts, ...pursuitAccounts].map((client) => (
                <div
                  key={client.id}
                  className="grid gap-4 rounded-lg border bg-white p-4 transition hover:border-violet-300 hover:bg-violet-50/40 md:grid-cols-[1fr_150px_180px]"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-950">{client.name}</p>
                      {client.sourceType ? (
                        <Badge variant="outline" className="rounded-md">
                          {client.sourceType}
                        </Badge>
                      ) : null}
                      <Badge variant="outline" className="rounded-md">
                        {normalizeStatus(client.status)}
                      </Badge>
                      {client.paymentStatus ? (
                        <Badge variant={getPaymentBadgeVariant(client.paymentStatus)} className="rounded-md">
                          {normalizeStatus(client.paymentStatus)}
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{client.company}</p>
                    <p className="mt-3 text-sm leading-5 text-slate-600">{client.nextStep}</p>
                    {client.buyerStage || client.paymentPath ? (
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                        {client.buyerStage ? (
                          <span className="rounded-md bg-slate-100 px-2 py-1">
                            Buyer: {normalizeStatus(client.buyerStage)}
                          </span>
                        ) : null}
                        {client.paymentPath ? (
                          <span className="rounded-md bg-slate-100 px-2 py-1">
                            Path: {normalizeStatus(client.paymentPath)}
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-md"
                        onClick={() => copyAccountText("Account brief", getAccountBrief(client))}
                      >
                        <Clipboard className="mr-2 h-3.5 w-3.5" />
                        Brief
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-md"
                        onClick={() => copyAccountText("Follow-up", getAccountFollowUp(client))}
                      >
                        <Mail className="mr-2 h-3.5 w-3.5" />
                        Follow-up
                      </Button>
                    </div>
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
                    <div className="mt-4 grid gap-2">
                      <Button asChild size="sm" className="h-8 rounded-md">
                        <Link href={client.href}>
                          Open <ArrowRight className="ml-2 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      <Button asChild size="sm" variant="outline" className="h-8 rounded-md">
                        <Link
                          href={`/packages?${client.leadId ? `lead=${encodeURIComponent(client.leadId)}&` : ""}package=${encodeURIComponent(
                            getPackageIdForAccount(client),
                          )}`}
                        >
                          Package
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
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
