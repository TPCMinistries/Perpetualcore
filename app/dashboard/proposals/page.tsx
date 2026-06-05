"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clipboard,
  CreditCard,
  DollarSign,
  FileText,
  Loader2,
  Layers3,
  Mail,
  MessageSquare,
  PackageCheck,
  ShieldCheck,
  Sparkles,
  Target,
  WandSparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LeadSummary {
  id: string;
  name?: string | null;
  contact_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  contact_email?: string | null;
  company?: string | null;
  company_name?: string | null;
  status?: string | null;
  estimated_value?: number | null;
  title?: string | null;
  notes?: string | null;
  lead_score?: number | null;
  ai_insights?: unknown;
  next_follow_up_at?: string | null;
}

interface LeadAssistantPlan {
  generatedAt?: string;
  leadName?: string;
  score?: number;
  route?: string;
  nextAction?: string;
  followUp?: string;
  reasoning?: string[];
  questions?: string[];
}

interface SavedProposal {
  id: string;
  title: string;
  description?: string | null;
  to_value?: string | null;
  created_at: string;
}

interface PermanentAccount {
  id: string;
  name: string;
}

interface PermanentEngagement {
  id: string;
  offer_name?: string | null;
  system_name?: string | null;
}

const proposalLanes = [
  {
    name: "Guided Setup",
    price: "$2.5K-$5K",
    bestFor:
      "Warm leads who need a small first invoice and one configured product surface.",
    deliverables: [
      "One onboarding call",
      "One product or workflow configured",
      "Basic knowledge setup",
      "Team walkthrough",
    ],
    cta: "/contact-sales?plan=guided-setup",
    checkoutId: "guided-setup",
  },
  {
    name: "First Workflow Package",
    price: "$7.5K-$15K",
    bestFor:
      "Companies with one visible workflow costing time, revenue, or service quality.",
    deliverables: [
      "Workflow map",
      "AI-supported process design",
      "Context and prompt layer",
      "Launch checklist and handoff",
    ],
    cta: "/contact-sales?plan=first-workflow",
    checkoutId: "first-workflow",
  },
  {
    name: "90-Day Operating Lane",
    price: "$15K-$30K+",
    bestFor:
      "Strategic accounts that want Lorenzo/Perpetual Core as AI consultant and operator.",
    deliverables: [
      "Executive operating map",
      "Priority workflow installs",
      "Weekly operating rhythm",
      "Expansion roadmap",
    ],
    cta: "/contact-sales?plan=operating-lane-deposit",
    checkoutId: "operating-lane-deposit",
  },
];

const buyerTypes = [
  "Regional operator",
  "Small business",
  "Professional service firm",
  "Nonprofit / institution",
  "Product-only buyer",
];

const workflowOptions = [
  "Sales intake and follow-up",
  "Quote / proposal workflow",
  "Customer service and issue resolution",
  "Internal knowledge and training",
  "Leadership reporting",
  "Operations coordination",
];

const timelineOptions = ["2-3 weeks", "30 days", "60 days", "90 days"];

const scopeBlocks = [
  {
    title: "Current-state map",
    copy: "We document how the work currently moves across people, systems, inboxes, documents, and decisions so the AI layer is grounded in the real operation.",
  },
  {
    title: "AI operating layer",
    copy: "We configure the context, workflows, prompts, intake paths, and review loops that let the company use AI inside the work instead of beside it.",
  },
  {
    title: "Human review and adoption",
    copy: "We keep humans in the right approval points, train the team on the workflow, and establish a cadence for measuring what improves.",
  },
  {
    title: "Expansion plan",
    copy: "We identify what should come next after the first lane proves value: sales, service, operations, admin, leadership reporting, or knowledge management.",
  },
];

const proposalSections = [
  "Business outcome",
  "Current operating problem",
  "Recommended starting lane",
  "Scope and deliverables",
  "Timeline and working rhythm",
  "Investment and payment path",
  "Expansion path",
  "Decision and next step",
];

const copyBlocks = [
  {
    label: "Proposal opener",
    text: "The goal is not to add another AI tool. The goal is to install an AI operating layer into one workflow that already matters to the company, prove measurable value, and then expand from there.",
  },
  {
    label: "Investment framing",
    text: "Software access is only one part of the investment. The larger value is in mapping the workflow, configuring the operating context, training the team, and creating a repeatable process the business can actually use.",
  },
  {
    label: "Next-step close",
    text: "If this direction is right, the next step is to choose the starting lane, confirm the decision maker and working team, and issue the first invoice so we can begin the map and implementation work.",
  },
];

const proofChecklist = [
  "Is the problem tied to revenue, time, margin, service quality, or leadership visibility?",
  "Is there a clear owner who can approve the first paid step?",
  "Do we know which workflow, tools, documents, or inboxes are involved?",
  "Can the first lane prove value in 30-90 days?",
  "Is the expansion path obvious if the first lane works?",
];

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  } catch {
    toast.error("Could not copy text");
  }
}

function getLeadDisplayName(lead: LeadSummary) {
  const composedName = [lead.first_name, lead.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  return (
    lead.name ||
    lead.contact_name ||
    composedName ||
    lead.email ||
    lead.contact_email ||
    "Unnamed lead"
  );
}

function getLeadCompany(lead: LeadSummary) {
  return lead.company || lead.company_name || "";
}

function getLeadAssistantPlan(lead?: LeadSummary): LeadAssistantPlan | null {
  if (
    !lead?.ai_insights ||
    typeof lead.ai_insights !== "object" ||
    Array.isArray(lead.ai_insights)
  ) {
    return null;
  }

  const insight = lead.ai_insights as LeadAssistantPlan;
  if (!insight.route && !insight.nextAction && !insight.reasoning?.length) {
    return null;
  }

  return insight;
}

function getLaneNameFromRoute(route?: string) {
  if (!route) return "";
  const normalized = route.toLowerCase();

  if (normalized.includes("operating")) return "90-Day Operating Lane";
  if (normalized.includes("workflow")) return "First Workflow Package";
  if (normalized.includes("guided") || normalized.includes("setup"))
    return "Guided Setup";
  return "";
}

function getPackageIdForLane(laneName: string) {
  if (laneName === "Guided Setup") return "guided-setup";
  if (laneName === "First Workflow Package") return "first-workflow";
  if (laneName === "90-Day Operating Lane") return "operating-lane-deposit";
  return "guided-setup";
}

function getLeadStatusLabel(status?: string | null) {
  if (!status) return "New";
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildBuyerProposalEmail({
  buyerName,
  selectedLane,
  workflow,
  businessOutcome,
  timeline,
  nextStep,
  paymentPackageId,
  selectedLeadId,
  origin,
}: {
  buyerName: string;
  selectedLane: (typeof proposalLanes)[number];
  workflow: string;
  businessOutcome: string;
  timeline: string;
  nextStep: string;
  paymentPackageId: string;
  selectedLeadId: string;
  origin: string;
}) {
  const packageUrl = `${origin}/packages?package=${encodeURIComponent(paymentPackageId)}&lead=${encodeURIComponent(
    selectedLeadId || "manual",
  )}`;

  return [
    `Subject: ${selectedLane.name} starting point for ${buyerName}`,
    "",
    `I would start ${buyerName} with ${selectedLane.name}.`,
    "",
    `The first workflow should be ${workflow.toLowerCase()}. The target outcome is ${businessOutcome}.`,
    "",
    `The working timeline is ${timeline}. The investment range is ${selectedLane.price}, depending on access, current systems, and how much implementation support is needed.`,
    "",
    "This is not positioned as another AI tool. It is a first operating lane: the workflow, context, people, review points, and AI-supported process working together.",
    "",
    `Next step: ${nextStep}.`,
    "",
    `Start path: ${packageUrl}`,
  ].join("\n");
}

function buildInternalApprovalNote({
  buyerName,
  buyerType,
  selectedLane,
  workflow,
  businessOutcome,
  timeline,
  selectedAssistantPlan,
}: {
  buyerName: string;
  buyerType: string;
  selectedLane: (typeof proposalLanes)[number];
  workflow: string;
  businessOutcome: string;
  timeline: string;
  selectedAssistantPlan: LeadAssistantPlan | null;
}) {
  return [
    `Internal approval note: ${buyerName}`,
    "",
    `Buyer type: ${buyerType}`,
    `Recommended start: ${selectedLane.name} (${selectedLane.price})`,
    `Workflow: ${workflow}`,
    `Outcome: ${businessOutcome}`,
    `Timeline: ${timeline}`,
    "",
    "Why this path:",
    selectedLane.bestFor,
    "",
    "Deliverables:",
    ...selectedLane.deliverables.map((deliverable) => `- ${deliverable}`),
    selectedAssistantPlan?.reasoning?.length ? "" : "",
    selectedAssistantPlan?.reasoning?.length ? "Assistant reasoning:" : "",
    ...(selectedAssistantPlan?.reasoning || []).map((item) => `- ${item}`),
    "",
    "Approval recommendation:",
    "Approve a defined first lane before attempting a full companywide AI transformation. The sale can expand after the first working surface proves value.",
  ]
    .filter((line, index, lines) => !(line === "" && lines[index - 1] === ""))
    .join("\n");
}

function buildImplementationScope({
  buyerName,
  selectedLane,
  workflow,
  businessOutcome,
  timeline,
}: {
  buyerName: string;
  selectedLane: (typeof proposalLanes)[number];
  workflow: string;
  businessOutcome: string;
  timeline: string;
}) {
  return [
    `Implementation scope: ${buyerName}`,
    "",
    `Starting lane: ${selectedLane.name}`,
    `Workflow: ${workflow}`,
    `Outcome: ${businessOutcome}`,
    `Timeline: ${timeline}`,
    "",
    "Phase 1 - Map",
    "Document the current workflow, people, tools, intake points, data sources, approval rules, and bottlenecks.",
    "",
    "Phase 2 - Install",
    "Configure the AI-supported operating layer: context, prompts, task flow, review points, and the working surface the team will use.",
    "",
    "Phase 3 - Adopt",
    "Train the owner/users, collect feedback, adjust the workflow, and define what should expand next.",
    "",
    "Out of scope until expansion:",
    "Full-enterprise transformation, every department, unsupported integrations, or open-ended custom software beyond the selected first lane.",
  ].join("\n");
}

function buildClientHandoffPath(
  leadId: string,
  account: PermanentAccount | null,
  engagement: PermanentEngagement | null,
) {
  const token = engagement?.id || account?.id;
  if (!leadId || !token) return "";
  return `/client-handoff/${encodeURIComponent(leadId)}?token=${encodeURIComponent(token)}`;
}

function buildKickoffContextAsk({
  buyerName,
  selectedLane,
  workflow,
  businessOutcome,
  timeline,
  handoffUrl,
}: {
  buyerName: string;
  selectedLane: (typeof proposalLanes)[number];
  workflow: string;
  businessOutcome: string;
  timeline: string;
  handoffUrl: string;
}) {
  return [
    `Subject: Kickoff context for ${buyerName}`,
    "",
    `To start ${selectedLane.name} cleanly, I want to collect the minimum operating context before we build the first surface.`,
    "",
    `First workflow: ${workflow}`,
    `Target outcome: ${businessOutcome}`,
    `Working timeline: ${timeline}`,
    "",
    "What I need:",
    "1. The workflow owner and decision owner",
    "2. The tools, docs, inboxes, files, or data involved",
    "3. A few real examples of the work",
    "4. What the AI should do, avoid, ask, remember, and escalate",
    "5. The success metric for the first lane",
    "",
    handoffUrl
      ? `Secure handoff page: ${handoffUrl}`
      : "I will send the secure handoff page after the account room is synced.",
  ].join("\n");
}

export default function ProposalsPage() {
  const [leads, setLeads] = useState<LeadSummary[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [proposalHistory, setProposalHistory] = useState<SavedProposal[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [savingProposal, setSavingProposal] = useState(false);
  const [syncingAccount, setSyncingAccount] = useState(false);
  const [permanentAccount, setPermanentAccount] =
    useState<PermanentAccount | null>(null);
  const [permanentEngagement, setPermanentEngagement] =
    useState<PermanentEngagement | null>(null);
  const [buyerName, setBuyerName] = useState("Empire-style regional operator");
  const [buyerType, setBuyerType] = useState(buyerTypes[0]);
  const [workflow, setWorkflow] = useState(workflowOptions[0]);
  const [businessOutcome, setBusinessOutcome] = useState(
    "faster response, cleaner handoffs, better follow-up, and clearer leadership visibility",
  );
  const [selectedLaneName, setSelectedLaneName] = useState(
    proposalLanes[2].name,
  );
  const [timeline, setTimeline] = useState(timelineOptions[3]);
  const [nextStep, setNextStep] = useState(
    "confirm the starting lane, identify the working team, and issue the first invoice",
  );

  const selectedLane =
    proposalLanes.find((lane) => lane.name === selectedLaneName) ??
    proposalLanes[2];
  const selectedLead = leads.find((lead) => lead.id === selectedLeadId);
  const selectedAssistantPlan = getLeadAssistantPlan(selectedLead);
  const paymentPackageId = getPackageIdForLane(selectedLane.name);
  const leadDecisionPacket = useMemo(() => {
    if (!selectedLead) return "";

    const company = getLeadCompany(selectedLead);
    const lines = [
      `Lead: ${company ? `${company} - ${getLeadDisplayName(selectedLead)}` : getLeadDisplayName(selectedLead)}`,
      `Status: ${getLeadStatusLabel(selectedLead.status)}`,
      selectedLead.estimated_value
        ? `Estimated value: $${selectedLead.estimated_value.toLocaleString()}`
        : "",
      selectedLead.lead_score ? `AI score: ${selectedLead.lead_score}` : "",
      selectedAssistantPlan?.route
        ? `Assistant route: ${selectedAssistantPlan.route}`
        : "",
      selectedAssistantPlan?.nextAction
        ? `Next action: ${selectedAssistantPlan.nextAction}`
        : "",
      selectedAssistantPlan?.followUp
        ? `Follow-up: ${selectedAssistantPlan.followUp}`
        : "",
      selectedLead.next_follow_up_at
        ? `Scheduled follow-up: ${new Date(selectedLead.next_follow_up_at).toLocaleDateString()}`
        : "",
      selectedLead.notes ? `Lead notes: ${selectedLead.notes}` : "",
      selectedAssistantPlan?.reasoning?.length
        ? `Reasoning:\n${selectedAssistantPlan.reasoning.map((item) => `- ${item}`).join("\n")}`
        : "",
      selectedAssistantPlan?.questions?.length
        ? `Questions:\n${selectedAssistantPlan.questions.map((item) => `- ${item}`).join("\n")}`
        : "",
    ].filter(Boolean);

    return lines.join("\n");
  }, [selectedAssistantPlan, selectedLead]);
  const generatedProposal = useMemo(() => {
    return [
      `Proposal direction for ${buyerName}`,
      "",
      `Buyer type: ${buyerType}`,
      `Recommended lane: ${selectedLane.name} (${selectedLane.price})`,
      `Starting workflow: ${workflow}`,
      `Target outcome: ${businessOutcome}`,
      `Timeline: ${timeline}`,
      selectedAssistantPlan?.score
        ? `AI readiness score: ${selectedAssistantPlan.score}`
        : "",
      "",
      "Positioning",
      "The goal is not to add another AI tool. The goal is to install an AI operating layer into a workflow that already matters to the company, prove measurable value, and then expand from there.",
      selectedAssistantPlan?.reasoning?.length ? "" : "",
      selectedAssistantPlan?.reasoning?.length ? "Assistant reasoning" : "",
      ...(selectedAssistantPlan?.reasoning || []).map((item) => `- ${item}`),
      selectedAssistantPlan?.questions?.length ? "" : "",
      selectedAssistantPlan?.questions?.length
        ? "Questions to confirm before close"
        : "",
      ...(selectedAssistantPlan?.questions || []).map((item) => `- ${item}`),
      "",
      "Recommended scope",
      ...scopeBlocks.map((block) => `- ${block.title}: ${block.copy}`),
      "",
      "Deliverables",
      ...selectedLane.deliverables.map((deliverable) => `- ${deliverable}`),
      "",
      "Next step",
      `If this direction is right, the next step is to ${nextStep}.`,
    ]
      .filter((line, index, lines) => !(line === "" && lines[index - 1] === ""))
      .join("\n");
  }, [
    businessOutcome,
    buyerName,
    buyerType,
    nextStep,
    selectedAssistantPlan,
    selectedLane,
    timeline,
    workflow,
  ]);
  const buyerProposalEmail = useMemo(
    () =>
      buildBuyerProposalEmail({
        buyerName,
        selectedLane,
        workflow,
        businessOutcome,
        timeline,
        nextStep,
        paymentPackageId,
        selectedLeadId,
        origin: typeof window !== "undefined" ? window.location.origin : "",
      }),
    [
      businessOutcome,
      buyerName,
      nextStep,
      paymentPackageId,
      selectedLane,
      selectedLeadId,
      timeline,
      workflow,
    ],
  );
  const internalApprovalNote = useMemo(
    () =>
      buildInternalApprovalNote({
        buyerName,
        buyerType,
        selectedLane,
        workflow,
        businessOutcome,
        timeline,
        selectedAssistantPlan,
      }),
    [
      businessOutcome,
      buyerName,
      buyerType,
      selectedAssistantPlan,
      selectedLane,
      timeline,
      workflow,
    ],
  );
  const implementationScope = useMemo(
    () =>
      buildImplementationScope({
        buyerName,
        selectedLane,
        workflow,
        businessOutcome,
        timeline,
      }),
    [businessOutcome, buyerName, selectedLane, timeline, workflow],
  );
  const packageHref = `/packages?package=${paymentPackageId}&lead=${selectedLeadId || "manual"}`;
  const accountHref = selectedLeadId
    ? `/dashboard/accounts/${selectedLeadId}`
    : "/dashboard/accounts";
  const manualInvoiceHref = `/contact-sales?intent=manual-invoice&plan=${paymentPackageId}&lead=${selectedLeadId || "manual"}`;
  const clientHandoffHref = buildClientHandoffPath(
    selectedLeadId,
    permanentAccount,
    permanentEngagement,
  );
  const absoluteClientHandoffHref =
    typeof window !== "undefined" && clientHandoffHref
      ? `${window.location.origin}${clientHandoffHref}`
      : "";
  const kickoffContextAsk = useMemo(
    () =>
      buildKickoffContextAsk({
        buyerName,
        selectedLane,
        workflow,
        businessOutcome,
        timeline,
        handoffUrl: absoluteClientHandoffHref,
      }),
    [
      absoluteClientHandoffHref,
      businessOutcome,
      buyerName,
      selectedLane,
      timeline,
      workflow,
    ],
  );
  const closeSequence = useMemo(
    () => [
      {
        label: "Save the proposal",
        detail: selectedLeadId
          ? "Attach the current scope to the lead so future follow-up and account handoff have memory."
          : "Choose a lead before saving if this is tied to a real buyer.",
        action: "Save proposal to lead",
      },
      {
        label: "Send the buyer email",
        detail:
          "Lead with outcome, starting lane, implementation path, and the package link.",
        action: "Copy buyer email",
      },
      {
        label: "Collect payment or issue invoice",
        detail: `${selectedLane.name} should move through package checkout or manual invoice depending on buyer preference.`,
        action: "Open payment path",
      },
      {
        label: "Open the account room",
        detail:
          "Once the buyer commits, move into delivery context, tasks, and operating handoff.",
        action: "Open account room",
      },
    ],
    [selectedLane.name, selectedLeadId],
  );
  const closeStackText = useMemo(
    () =>
      [
        `Close stack for ${buyerName}`,
        "",
        `Recommended lane: ${selectedLane.name} (${selectedLane.price})`,
        `Workflow: ${workflow}`,
        `Outcome: ${businessOutcome}`,
        `Timeline: ${timeline}`,
        `Next step: ${nextStep}`,
        "",
        "Sequence:",
        ...closeSequence.map(
          (step, index) => `${index + 1}. ${step.label} - ${step.detail}`,
        ),
        "",
        `Payment path: ${typeof window !== "undefined" ? window.location.origin : ""}${packageHref}`,
        `Manual invoice path: ${typeof window !== "undefined" ? window.location.origin : ""}${manualInvoiceHref}`,
        selectedLeadId
          ? `Account room: ${typeof window !== "undefined" ? window.location.origin : ""}${accountHref}`
          : "",
      ]
        .filter(Boolean)
        .join("\n"),
    [
      accountHref,
      businessOutcome,
      buyerName,
      closeSequence,
      manualInvoiceHref,
      nextStep,
      packageHref,
      selectedLane.name,
      selectedLane.price,
      selectedLeadId,
      timeline,
      workflow,
    ],
  );

  useEffect(() => {
    async function fetchLeads() {
      try {
        setLoadingLeads(true);
        const response = await fetch("/api/leads?limit=100");
        if (!response.ok) throw new Error("Failed to fetch leads");
        const data = (await response.json()) as { leads?: LeadSummary[] };
        const fetchedLeads = data.leads || [];
        setLeads(fetchedLeads);
        const leadParam = new URLSearchParams(window.location.search).get(
          "lead",
        );
        if (leadParam && fetchedLeads.some((lead) => lead.id === leadParam)) {
          setSelectedLeadId(leadParam);
        }
      } catch (error) {
        console.error("Proposal lead fetch error:", error);
        toast.error("Could not load leads");
      } finally {
        setLoadingLeads(false);
      }
    }

    fetchLeads();
  }, []);

  useEffect(() => {
    if (!selectedLead) return;
    setBuyerName(
      getLeadCompany(selectedLead) || getLeadDisplayName(selectedLead),
    );
    const assistantPlan = getLeadAssistantPlan(selectedLead);
    const laneName = getLaneNameFromRoute(assistantPlan?.route);
    if (laneName) {
      setSelectedLaneName(laneName);
    } else if ((selectedLead.estimated_value || 0) >= 15000) {
      setSelectedLaneName("90-Day Operating Lane");
    } else if ((selectedLead.estimated_value || 0) >= 7500) {
      setSelectedLaneName("First Workflow Package");
    }

    if (selectedLead.notes) {
      const lowerNotes = selectedLead.notes.toLowerCase();
      const matchedWorkflow = workflowOptions.find((option) =>
        lowerNotes.includes(option.toLowerCase().split(" ")[0]),
      );
      if (matchedWorkflow) {
        setWorkflow(matchedWorkflow);
      }
    }
  }, [selectedLead]);

  useEffect(() => {
    async function fetchProposalHistory() {
      if (!selectedLeadId) {
        setProposalHistory([]);
        return;
      }

      try {
        setLoadingHistory(true);
        const response = await fetch(`/api/leads/${selectedLeadId}/proposals`);
        if (!response.ok) throw new Error("Failed to fetch proposal history");
        const data = (await response.json()) as { proposals?: SavedProposal[] };
        setProposalHistory(data.proposals || []);
      } catch (error) {
        console.error("Proposal history fetch error:", error);
        toast.error("Could not load proposal history");
      } finally {
        setLoadingHistory(false);
      }
    }

    fetchProposalHistory();
  }, [selectedLeadId]);

  useEffect(() => {
    async function fetchPermanentAccount() {
      setPermanentAccount(null);
      setPermanentEngagement(null);

      if (!selectedLeadId) return;

      try {
        const response = await fetch(
          `/api/accounts?leadId=${encodeURIComponent(selectedLeadId)}`,
          { cache: "no-store" },
        );
        if (!response.ok) return;
        const data = (await response.json()) as {
          account?: PermanentAccount | null;
          engagement?: PermanentEngagement | null;
        };
        setPermanentAccount(data.account || null);
        setPermanentEngagement(data.engagement || null);
      } catch (error) {
        console.error("Permanent account fetch error:", error);
      }
    }

    fetchPermanentAccount();
  }, [selectedLeadId]);

  const saveProposalToLead = async () => {
    if (!selectedLeadId) {
      toast.error("Choose a lead before saving");
      return;
    }

    try {
      setSavingProposal(true);
      const response = await fetch(`/api/leads/${selectedLeadId}/proposals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${selectedLane.name} proposal for ${buyerName}`,
          lane: selectedLane.name,
          proposalText: generatedProposal,
        }),
      });

      if (!response.ok) throw new Error("Failed to save proposal");
      const data = (await response.json()) as { proposal?: SavedProposal };
      if (data.proposal) {
        setProposalHistory((current) => [
          data.proposal as SavedProposal,
          ...current,
        ]);
      }
      toast.success("Proposal saved to lead");
    } catch (error) {
      console.error("Proposal save error:", error);
      toast.error("Could not save proposal");
    } finally {
      setSavingProposal(false);
    }
  };

  const applyAssistantPlan = () => {
    if (!selectedLead || !selectedAssistantPlan) {
      toast.error("Choose a lead with a saved assistant plan");
      return;
    }

    const laneName = getLaneNameFromRoute(selectedAssistantPlan.route);
    if (laneName) setSelectedLaneName(laneName);
    if (selectedAssistantPlan.nextAction) {
      setNextStep(selectedAssistantPlan.nextAction.toLowerCase());
    }
    if (selectedLead.notes) {
      setBusinessOutcome(selectedLead.notes);
    }
    toast.success("Assistant plan applied to proposal");
  };

  const syncAccountFromProposal = async () => {
    if (!selectedLeadId) {
      toast.error("Choose a lead before syncing an account");
      return;
    }

    try {
      setSyncingAccount(true);
      const response = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: selectedLeadId }),
      });

      if (!response.ok) throw new Error("Could not sync account");
      const data = (await response.json()) as {
        account?: PermanentAccount | null;
        engagement?: PermanentEngagement | null;
      };
      setPermanentAccount(data.account || null);
      setPermanentEngagement(data.engagement || null);
      toast.success("Account room synced");
    } catch (error) {
      console.error("Proposal account sync error:", error);
      toast.error(
        error instanceof Error ? error.message : "Could not sync account",
      );
    } finally {
      setSyncingAccount(false);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="rounded-xl border border-border bg-background p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Proposal desk
              </p>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Turn a serious conversation into a clear paid starting lane.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Use this page after discovery to choose the offer, frame the
              scope, and send language that moves a buyer from interest into
              invoice, checkout, or sales intake.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="outline" className="rounded-md">
              <Link href="/dashboard/account-plan">Account plan</Link>
            </Button>
            <Button asChild className="rounded-md">
              <Link href="/packages">
                Open packages <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <Card className="rounded-lg border-primary/20 bg-gradient-to-br from-primary/[0.06] via-background to-background shadow-none">
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <WandSparkles className="h-4 w-4 text-primary" />
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Lead intelligence
                </p>
              </div>
              <CardTitle className="text-xl">
                Use the saved assistant plan to write the proposal.
              </CardTitle>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                When a lead has been scored in the sales command page, this desk
                pulls the route, next action, reasoning, and questions into the
                proposal so the handoff stays coherent.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                className="rounded-md"
                disabled={!leadDecisionPacket}
                onClick={() => copyText(leadDecisionPacket)}
              >
                <Clipboard className="mr-2 h-4 w-4" />
                Copy packet
              </Button>
              <Button
                type="button"
                className="rounded-md"
                disabled={!selectedAssistantPlan}
                onClick={applyAssistantPlan}
              >
                Apply plan <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!selectedLead ? (
            <div className="rounded-lg border bg-background p-4 text-sm text-muted-foreground">
              Choose a lead in the composer below to load its assistant plan.
            </div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-[0.7fr_1.3fr]">
              <div className="rounded-lg border bg-background p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Selected lead
                </p>
                <p className="mt-2 text-lg font-semibold text-foreground">
                  {getLeadCompany(selectedLead) ||
                    getLeadDisplayName(selectedLead)}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="outline" className="rounded-md">
                    {getLeadStatusLabel(selectedLead.status)}
                  </Badge>
                  {selectedLead.lead_score ? (
                    <Badge variant="secondary" className="rounded-md">
                      AI score {selectedLead.lead_score}
                    </Badge>
                  ) : null}
                  {selectedLead.estimated_value ? (
                    <Badge variant="outline" className="rounded-md">
                      ${selectedLead.estimated_value.toLocaleString()}
                    </Badge>
                  ) : null}
                </div>
              </div>
              <div className="rounded-lg border bg-background p-4">
                {selectedAssistantPlan ? (
                  <>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                          Route
                        </p>
                        <p className="mt-2 text-sm font-semibold text-foreground">
                          {selectedAssistantPlan.route || selectedLane.name}
                        </p>
                      </div>
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                          Next action
                        </p>
                        <p className="mt-2 text-sm font-semibold text-foreground">
                          {selectedAssistantPlan.nextAction ||
                            "Confirm starting lane"}
                        </p>
                      </div>
                    </div>
                    {selectedAssistantPlan.reasoning?.length ? (
                      <div className="mt-4 grid gap-2 text-sm leading-5 text-muted-foreground">
                        {selectedAssistantPlan.reasoning.map((item) => (
                          <p key={item}>{item}</p>
                        ))}
                      </div>
                    ) : null}
                  </>
                ) : (
                  <div className="text-sm leading-6 text-muted-foreground">
                    No saved assistant plan yet. Open the lead, save an AI plan,
                    then return here to generate a sharper proposal.
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-lg shadow-none">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl">Proposal composer</CardTitle>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Fill in the buyer context and generate a clean proposal draft
                you can copy into email, a document, or a manual invoice note.
              </p>
            </div>
            <FileText className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
            <div className="grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-foreground">
                  Attach to lead
                </span>
                <select
                  value={selectedLeadId}
                  onChange={(event) => setSelectedLeadId(event.target.value)}
                  disabled={loadingLeads}
                  className="min-h-11 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">
                    {loadingLeads ? "Loading leads..." : "Choose a lead"}
                  </option>
                  {leads.map((lead) => (
                    <option key={lead.id} value={lead.id}>
                      {getLeadCompany(lead)
                        ? `${getLeadCompany(lead)} - ${getLeadDisplayName(lead)}`
                        : getLeadDisplayName(lead)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-foreground">
                  Buyer / account
                </span>
                <input
                  value={buyerName}
                  onChange={(event) => setBuyerName(event.target.value)}
                  className="min-h-11 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-foreground">
                    Buyer type
                  </span>
                  <select
                    value={buyerType}
                    onChange={(event) => setBuyerType(event.target.value)}
                    className="min-h-11 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {buyerTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-medium text-foreground">
                    Starting workflow
                  </span>
                  <select
                    value={workflow}
                    onChange={(event) => setWorkflow(event.target.value)}
                    className="min-h-11 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {workflowOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-foreground">
                    Recommended lane
                  </span>
                  <select
                    value={selectedLaneName}
                    onChange={(event) =>
                      setSelectedLaneName(event.target.value)
                    }
                    className="min-h-11 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {proposalLanes.map((lane) => (
                      <option key={lane.name} value={lane.name}>
                        {lane.name} - {lane.price}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-medium text-foreground">
                    Timeline
                  </span>
                  <select
                    value={timeline}
                    onChange={(event) => setTimeline(event.target.value)}
                    className="min-h-11 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {timelineOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-foreground">
                  Business outcome
                </span>
                <textarea
                  value={businessOutcome}
                  onChange={(event) => setBusinessOutcome(event.target.value)}
                  rows={3}
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm leading-6 outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-foreground">
                  Next step
                </span>
                <input
                  value={nextStep}
                  onChange={(event) => setNextStep(event.target.value)}
                  className="min-h-11 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
                />
              </label>
            </div>

            <div className="flex min-h-full flex-col rounded-lg border bg-slate-950 p-4 text-white">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-violet-200">
                    Generated draft
                  </p>
                  <p className="mt-1 text-sm text-slate-300">
                    {selectedLane.name} proposal language
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  className="rounded-md"
                  onClick={() => copyText(generatedProposal)}
                >
                  <Clipboard className="mr-2 h-4 w-4" />
                  Copy
                </Button>
                <Button
                  type="button"
                  className="rounded-md"
                  onClick={saveProposalToLead}
                  disabled={!selectedLeadId || savingProposal}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  {savingProposal ? "Saving..." : "Save"}
                </Button>
              </div>
              <pre className="min-h-[360px] flex-1 whitespace-pre-wrap rounded-md bg-white/[0.06] p-4 text-sm leading-6 text-slate-100">
                {generatedProposal}
              </pre>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="rounded-md"
                  onClick={() =>
                    copyText(
                      [
                        `Subject: ${selectedLane.name} starting point for ${buyerName}`,
                        "",
                        `I mapped this as a ${selectedLane.name.toLowerCase()} because the first win should be ${workflow.toLowerCase()}.`,
                        `The practical next step is to ${nextStep}.`,
                        "",
                        "If this is the right direction, I can send the invoice/payment path and we can begin with the operating map.",
                      ].join("\n"),
                    )
                  }
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Copy email
                </Button>
                <Button asChild className="rounded-md">
                  <Link
                    href={`/packages?package=${paymentPackageId}&lead=${selectedLeadId || "manual"}`}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Payment path
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-lg border-primary/20 shadow-none">
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <CardTitle className="text-xl">
                  Close-ready proposal pack
                </CardTitle>
                <PackageCheck className="h-5 w-5 text-primary" />
              </div>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                Use this after the proposal language is directionally right. It
                gives you the buyer email, internal approval note,
                implementation scope, and the next operational links.
              </p>
            </div>
            <Badge
              className="w-fit rounded-md"
              variant={selectedLeadId ? "default" : "outline"}
            >
              {selectedLeadId ? "Lead attached" : "Manual proposal"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <div className="grid gap-3 md:grid-cols-3">
            {[
              {
                label: "Buyer email",
                detail:
                  "Send the proposal direction with package path and next step.",
                icon: MessageSquare,
                body: buyerProposalEmail,
              },
              {
                label: "Approval note",
                detail:
                  "Use when the buyer needs leadership, finance, or procurement language.",
                icon: ShieldCheck,
                body: internalApprovalNote,
              },
              {
                label: "Scope note",
                detail:
                  "Clarify what is included in the first lane and what waits for expansion.",
                icon: Layers3,
                body: implementationScope,
              },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => copyText(item.body)}
                className="rounded-lg border bg-card p-4 text-left transition hover:border-primary/50 hover:bg-primary/[0.03]"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-md bg-primary/10 p-2 text-primary">
                    <item.icon className="h-4 w-4" />
                  </span>
                  <Clipboard className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="mt-4 text-sm font-semibold text-foreground">
                  {item.label}
                </p>
                <p className="mt-2 text-sm leading-5 text-muted-foreground">
                  {item.detail}
                </p>
              </button>
            ))}
          </div>

          <div className="rounded-lg border bg-muted/40 p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Operational next step
            </p>
            <p className="mt-2 text-sm font-semibold text-foreground">
              {selectedLane.name}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Save the proposal, send the package path, then open the account
              room so the first lane, handoff context, tasks, and delivery
              memory stay connected.
            </p>
            <div className="mt-4 grid gap-2">
              <Button
                type="button"
                className="rounded-md"
                disabled={!selectedLeadId || savingProposal}
                onClick={saveProposalToLead}
              >
                <FileText className="mr-2 h-4 w-4" />
                {savingProposal ? "Saving..." : "Save proposal to lead"}
              </Button>
              <Button asChild variant="outline" className="rounded-md">
                <Link href={packageHref}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Open payment path
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-md">
                <Link href={accountHref}>
                  <Target className="mr-2 h-4 w-4" />
                  Open account room
                </Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-md"
                disabled={!selectedLeadId || syncingAccount}
                onClick={syncAccountFromProposal}
              >
                {syncingAccount ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="mr-2 h-4 w-4" />
                )}
                {permanentAccount ? "Resync account" : "Sync account"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-lg border-violet-200 bg-violet-50/40 shadow-none">
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <CardTitle className="text-xl">Proposal to handoff</CardTitle>
                <ShieldCheck className="h-5 w-5 text-violet-600" />
              </div>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Once the buyer approves, turn the proposal into durable account
                memory, then send the secure handoff ask so delivery starts with
                owner, tools, examples, rules, and a success metric.
              </p>
            </div>
            <Badge
              variant={permanentAccount ? "default" : "outline"}
              className="w-fit rounded-md"
            >
              {permanentAccount ? "Account synced" : "Needs sync"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="grid gap-3 md:grid-cols-3">
            {[
              {
                title: "1. Preserve the proposal",
                detail:
                  "Save the proposal against the lead so the buyer language, lane, and scope remain attached.",
                done: proposalHistory.length > 0,
              },
              {
                title: "2. Sync account room",
                detail:
                  "Create or refresh the durable account and engagement record used for delivery memory.",
                done: Boolean(permanentAccount),
              },
              {
                title: "3. Send handoff ask",
                detail:
                  "Collect the client-side context that makes the first operating lane practical.",
                done: Boolean(clientHandoffHref),
              },
            ].map((step) => (
              <div key={step.title} className="rounded-lg border bg-white p-4">
                <CheckCircle2
                  className={`h-5 w-5 ${step.done ? "text-violet-600" : "text-slate-300"}`}
                />
                <p className="mt-4 text-sm font-semibold text-slate-950">
                  {step.title}
                </p>
                <p className="mt-2 text-sm leading-5 text-slate-600">
                  {step.detail}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-lg border bg-white p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
              Handoff controls
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-950">
              {permanentEngagement?.offer_name || selectedLane.name}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              The handoff page is token-gated. Sync the account first, then copy
              or open the client handoff path.
            </p>
            <div className="mt-4 grid gap-2">
              <Button
                type="button"
                className="rounded-md"
                disabled={!selectedLeadId || syncingAccount}
                onClick={syncAccountFromProposal}
              >
                {syncingAccount ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="mr-2 h-4 w-4" />
                )}
                {permanentAccount ? "Resync account" : "Sync account"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-md"
                onClick={() => copyText(kickoffContextAsk)}
              >
                <Mail className="mr-2 h-4 w-4" />
                Copy handoff ask
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-md"
                disabled={!absoluteClientHandoffHref}
                onClick={() => copyText(absoluteClientHandoffHref)}
              >
                <Clipboard className="mr-2 h-4 w-4" />
                Copy handoff link
              </Button>
              {clientHandoffHref ? (
                <Button asChild variant="outline" className="rounded-md">
                  <Link href={clientHandoffHref}>
                    Open handoff page <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-md"
                  disabled
                >
                  Open handoff page <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-lg shadow-none">
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardTitle className="text-xl">Send stack</CardTitle>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                Use this as the proposal-to-payment operating order. It keeps
                the proposal, buyer message, package path, invoice option, and
                account room connected.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="rounded-md"
              onClick={() => copyText(closeStackText)}
            >
              <Clipboard className="mr-2 h-4 w-4" />
              Copy stack
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="grid gap-3 md:grid-cols-2">
            {closeSequence.map((step, index) => (
              <div key={step.label} className="rounded-lg border bg-card p-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <Badge variant="outline" className="rounded-md">
                    {step.action}
                  </Badge>
                </div>
                <p className="mt-4 text-sm font-semibold text-foreground">
                  {step.label}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {step.detail}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Close controls
            </p>
            <p className="mt-2 text-sm font-semibold text-foreground">
              {selectedLane.name}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Use package checkout for simple starts, manual invoice for
              relationship-led or enterprise starts, then move delivery into the
              account room.
            </p>
            <div className="mt-4 grid gap-2">
              <Button
                type="button"
                className="rounded-md"
                disabled={!selectedLeadId || savingProposal}
                onClick={saveProposalToLead}
              >
                <FileText className="mr-2 h-4 w-4" />
                {savingProposal ? "Saving..." : "Save proposal"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-md"
                onClick={() => copyText(buyerProposalEmail)}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Copy buyer email
              </Button>
              <Button asChild variant="outline" className="rounded-md">
                <Link href={packageHref}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Package checkout
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-md">
                <Link href={manualInvoiceHref}>
                  <DollarSign className="mr-2 h-4 w-4" />
                  Manual invoice
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-md">
                <Link href={accountHref}>
                  <Target className="mr-2 h-4 w-4" />
                  Account room
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-lg shadow-none">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl">Saved proposal history</CardTitle>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Select a lead in the composer to see proposal drafts saved
                against that opportunity.
              </p>
            </div>
            <FileText className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          {!selectedLeadId ? (
            <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
              Choose a lead to view saved proposals.
            </div>
          ) : loadingHistory ? (
            <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
              Loading proposal history...
            </div>
          ) : proposalHistory.length === 0 ? (
            <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
              No saved proposals for this lead yet.
            </div>
          ) : (
            <div className="grid gap-3">
              {proposalHistory.map((proposal) => (
                <div
                  key={proposal.id}
                  className="rounded-lg border bg-card p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">
                          {proposal.title}
                        </p>
                        {proposal.to_value && (
                          <Badge variant="outline" className="rounded-md">
                            {proposal.to_value}
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(proposal.created_at).toLocaleString()}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-md"
                      onClick={() => copyText(proposal.description || "")}
                    >
                      <Clipboard className="mr-2 h-4 w-4" />
                      Copy
                    </Button>
                  </div>
                  {proposal.description && (
                    <pre className="mt-4 max-h-64 overflow-auto whitespace-pre-wrap rounded-md bg-muted p-4 text-sm leading-6 text-muted-foreground">
                      {proposal.description}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        {proposalLanes.map((lane) => (
          <Card key={lane.name} className="flex rounded-lg shadow-none">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Badge variant="outline" className="mb-3 rounded-md">
                    {lane.price}
                  </Badge>
                  <CardTitle className="text-xl">{lane.name}</CardTitle>
                </div>
                <DollarSign className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              <p className="text-sm leading-6 text-muted-foreground">
                {lane.bestFor}
              </p>
              <ul className="mt-5 flex-1 space-y-3">
                {lane.deliverables.map((deliverable) => (
                  <li
                    key={deliverable}
                    className="flex gap-2 text-sm leading-5 text-muted-foreground"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                    {deliverable}
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-6 rounded-md">
                <Link href={lane.cta}>
                  Use this lane <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <Card className="rounded-lg shadow-none">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="text-xl">Scope blocks</CardTitle>
              <Layers3 className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {scopeBlocks.map((block) => (
              <button
                key={block.title}
                type="button"
                onClick={() => copyText(`${block.title}: ${block.copy}`)}
                className="cursor-pointer rounded-lg border bg-card p-4 text-left transition hover:border-primary/50 hover:bg-primary/[0.03]"
              >
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-semibold text-foreground">
                    {block.title}
                  </p>
                  <Clipboard className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {block.copy}
                </p>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-lg shadow-none">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="text-xl">Proposal sections</CardTitle>
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {proposalSections.map((section, index) => (
              <div
                key={section}
                className="flex items-center gap-3 rounded-lg border bg-card p-3"
              >
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="text-sm text-muted-foreground">{section}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="rounded-lg shadow-none">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="text-xl">Proof checklist</CardTitle>
              <ShieldCheck className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {proofChecklist.map((item) => (
              <div
                key={item}
                className="flex gap-3 rounded-lg border bg-card p-4"
              >
                <Target className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                <p className="text-sm leading-6 text-muted-foreground">
                  {item}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-lg shadow-none">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="text-xl">Close language</CardTitle>
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {copyBlocks.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => copyText(item.text)}
                className="cursor-pointer rounded-lg border bg-card p-4 text-left transition hover:border-primary/50 hover:bg-primary/[0.03]"
              >
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-semibold text-foreground">
                    {item.label}
                  </p>
                  <Clipboard className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {item.text}
                </p>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Link
          href="/dashboard/leads"
          className="group cursor-pointer rounded-lg border bg-card p-5 transition hover:border-primary/50 hover:bg-primary/[0.03]"
        >
          <Sparkles className="h-5 w-5 text-primary" />
          <p className="mt-4 text-sm font-semibold text-foreground">
            Attach to a lead
          </p>
          <p className="mt-2 text-sm leading-5 text-muted-foreground">
            Keep the proposal tied to the actual buyer, stage, expected value,
            and follow-up.
          </p>
          <span className="mt-4 inline-flex items-center text-sm font-medium text-foreground">
            Open leads{" "}
            <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-0.5" />
          </span>
        </Link>
        <Link
          href="/dashboard/sales-script"
          className="group cursor-pointer rounded-lg border bg-card p-5 transition hover:border-primary/50 hover:bg-primary/[0.03]"
        >
          <MessageSquare className="h-5 w-5 text-primary" />
          <p className="mt-4 text-sm font-semibold text-foreground">
            Use the script
          </p>
          <p className="mt-2 text-sm leading-5 text-muted-foreground">
            Pull objection handling, cost framing, and follow-up language before
            sending.
          </p>
          <span className="mt-4 inline-flex items-center text-sm font-medium text-foreground">
            Open scripts{" "}
            <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-0.5" />
          </span>
        </Link>
        <Link
          href="/contact-sales?intent=manual-invoice"
          className="group cursor-pointer rounded-lg border bg-card p-5 transition hover:border-primary/50 hover:bg-primary/[0.03]"
        >
          <PackageCheck className="h-5 w-5 text-primary" />
          <p className="mt-4 text-sm font-semibold text-foreground">
            Move to payment
          </p>
          <p className="mt-2 text-sm leading-5 text-muted-foreground">
            Use sales intake or manual invoice when the buyer is ready to start.
          </p>
          <span className="mt-4 inline-flex items-center text-sm font-medium text-foreground">
            Open intake{" "}
            <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-0.5" />
          </span>
        </Link>
      </div>
    </div>
  );
}
