"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clipboard,
  DollarSign,
  FileText,
  Layers3,
  MessageSquare,
  PackageCheck,
  ShieldCheck,
  Sparkles,
  Target,
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
}

interface SavedProposal {
  id: string;
  title: string;
  description?: string | null;
  to_value?: string | null;
  created_at: string;
}

const proposalLanes = [
  {
    name: "Guided Setup",
    price: "$2.5K-$5K",
    bestFor: "Warm leads who need a small first invoice and one configured product surface.",
    deliverables: [
      "One onboarding call",
      "One product or workflow configured",
      "Basic knowledge setup",
      "Team walkthrough",
    ],
    cta: "/contact-sales?plan=guided-setup",
  },
  {
    name: "First Workflow Package",
    price: "$7.5K-$15K",
    bestFor: "Companies with one visible workflow costing time, revenue, or service quality.",
    deliverables: [
      "Workflow map",
      "AI-supported process design",
      "Context and prompt layer",
      "Launch checklist and handoff",
    ],
    cta: "/contact-sales?plan=first-workflow",
  },
  {
    name: "90-Day Operating Lane",
    price: "$15K-$30K+",
    bestFor: "Strategic accounts that want Lorenzo/Perpetual Core as AI consultant and operator.",
    deliverables: [
      "Executive operating map",
      "Priority workflow installs",
      "Weekly operating rhythm",
      "Expansion roadmap",
    ],
    cta: "/contact-sales?plan=operating-lane-deposit",
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
    copy:
      "We document how the work currently moves across people, systems, inboxes, documents, and decisions so the AI layer is grounded in the real operation.",
  },
  {
    title: "AI operating layer",
    copy:
      "We configure the context, workflows, prompts, intake paths, and review loops that let the company use AI inside the work instead of beside it.",
  },
  {
    title: "Human review and adoption",
    copy:
      "We keep humans in the right approval points, train the team on the workflow, and establish a cadence for measuring what improves.",
  },
  {
    title: "Expansion plan",
    copy:
      "We identify what should come next after the first lane proves value: sales, service, operations, admin, leadership reporting, or knowledge management.",
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
    text:
      "The goal is not to add another AI tool. The goal is to install an AI operating layer into one workflow that already matters to the company, prove measurable value, and then expand from there.",
  },
  {
    label: "Investment framing",
    text:
      "Software access is only one part of the investment. The larger value is in mapping the workflow, configuring the operating context, training the team, and creating a repeatable process the business can actually use.",
  },
  {
    label: "Next-step close",
    text:
      "If this direction is right, the next step is to choose the starting lane, confirm the decision maker and working team, and issue the first invoice so we can begin the map and implementation work.",
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
  const composedName = [lead.first_name, lead.last_name].filter(Boolean).join(" ").trim();
  return lead.name || lead.contact_name || composedName || lead.email || lead.contact_email || "Unnamed lead";
}

function getLeadCompany(lead: LeadSummary) {
  return lead.company || lead.company_name || "";
}

export default function ProposalsPage() {
  const [leads, setLeads] = useState<LeadSummary[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [proposalHistory, setProposalHistory] = useState<SavedProposal[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [savingProposal, setSavingProposal] = useState(false);
  const [buyerName, setBuyerName] = useState("Empire-style regional operator");
  const [buyerType, setBuyerType] = useState(buyerTypes[0]);
  const [workflow, setWorkflow] = useState(workflowOptions[0]);
  const [businessOutcome, setBusinessOutcome] = useState(
    "faster response, cleaner handoffs, better follow-up, and clearer leadership visibility"
  );
  const [selectedLaneName, setSelectedLaneName] = useState(proposalLanes[2].name);
  const [timeline, setTimeline] = useState(timelineOptions[3]);
  const [nextStep, setNextStep] = useState(
    "confirm the starting lane, identify the working team, and issue the first invoice"
  );

  const selectedLane = proposalLanes.find((lane) => lane.name === selectedLaneName) ?? proposalLanes[2];
  const selectedLead = leads.find((lead) => lead.id === selectedLeadId);
  const generatedProposal = useMemo(() => {
    return [
      `Proposal direction for ${buyerName}`,
      "",
      `Buyer type: ${buyerType}`,
      `Recommended lane: ${selectedLane.name} (${selectedLane.price})`,
      `Starting workflow: ${workflow}`,
      `Target outcome: ${businessOutcome}`,
      `Timeline: ${timeline}`,
      "",
      "Positioning",
      "The goal is not to add another AI tool. The goal is to install an AI operating layer into a workflow that already matters to the company, prove measurable value, and then expand from there.",
      "",
      "Recommended scope",
      ...scopeBlocks.map((block) => `- ${block.title}: ${block.copy}`),
      "",
      "Deliverables",
      ...selectedLane.deliverables.map((deliverable) => `- ${deliverable}`),
      "",
      "Next step",
      `If this direction is right, the next step is to ${nextStep}.`,
    ].join("\n");
  }, [businessOutcome, buyerName, buyerType, nextStep, selectedLane, timeline, workflow]);

  useEffect(() => {
    async function fetchLeads() {
      try {
        setLoadingLeads(true);
        const response = await fetch("/api/leads?limit=100");
        if (!response.ok) throw new Error("Failed to fetch leads");
        const data = (await response.json()) as { leads?: LeadSummary[] };
        const fetchedLeads = data.leads || [];
        setLeads(fetchedLeads);
        const leadParam = new URLSearchParams(window.location.search).get("lead");
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
    setBuyerName(getLeadCompany(selectedLead) || getLeadDisplayName(selectedLead));
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
        setProposalHistory((current) => [data.proposal as SavedProposal, ...current]);
      }
      toast.success("Proposal saved to lead");
    } catch (error) {
      console.error("Proposal save error:", error);
      toast.error("Could not save proposal");
    } finally {
      setSavingProposal(false);
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
              Use this page after discovery to choose the offer, frame the scope, and send language
              that moves a buyer from interest into invoice, checkout, or sales intake.
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

      <Card className="rounded-lg shadow-none">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl">Proposal composer</CardTitle>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Fill in the buyer context and generate a clean proposal draft you can copy into email,
                a document, or a manual invoice note.
              </p>
            </div>
            <FileText className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
            <div className="grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-foreground">Attach to lead</span>
                <select
                  value={selectedLeadId}
                  onChange={(event) => setSelectedLeadId(event.target.value)}
                  disabled={loadingLeads}
                  className="min-h-11 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">{loadingLeads ? "Loading leads..." : "Choose a lead"}</option>
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
                <span className="text-sm font-medium text-foreground">Buyer / account</span>
                <input
                  value={buyerName}
                  onChange={(event) => setBuyerName(event.target.value)}
                  className="min-h-11 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-foreground">Buyer type</span>
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
                  <span className="text-sm font-medium text-foreground">Starting workflow</span>
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
                  <span className="text-sm font-medium text-foreground">Recommended lane</span>
                  <select
                    value={selectedLaneName}
                    onChange={(event) => setSelectedLaneName(event.target.value)}
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
                  <span className="text-sm font-medium text-foreground">Timeline</span>
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
                <span className="text-sm font-medium text-foreground">Business outcome</span>
                <textarea
                  value={businessOutcome}
                  onChange={(event) => setBusinessOutcome(event.target.value)}
                  rows={3}
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm leading-6 outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-foreground">Next step</span>
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
                  <p className="mt-1 text-sm text-slate-300">{selectedLane.name} proposal language</p>
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
                Select a lead in the composer to see proposal drafts saved against that opportunity.
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
                <div key={proposal.id} className="rounded-lg border bg-card p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{proposal.title}</p>
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
              <p className="text-sm leading-6 text-muted-foreground">{lane.bestFor}</p>
              <ul className="mt-5 flex-1 space-y-3">
                {lane.deliverables.map((deliverable) => (
                  <li key={deliverable} className="flex gap-2 text-sm leading-5 text-muted-foreground">
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
                  <p className="text-sm font-semibold text-foreground">{block.title}</p>
                  <Clipboard className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{block.copy}</p>
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
              <div key={section} className="flex items-center gap-3 rounded-lg border bg-card p-3">
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
              <div key={item} className="flex gap-3 rounded-lg border bg-card p-4">
                <Target className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                <p className="text-sm leading-6 text-muted-foreground">{item}</p>
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
                  <p className="text-sm font-semibold text-foreground">{item.label}</p>
                  <Clipboard className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p>
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
          <p className="mt-4 text-sm font-semibold text-foreground">Attach to a lead</p>
          <p className="mt-2 text-sm leading-5 text-muted-foreground">
            Keep the proposal tied to the actual buyer, stage, expected value, and follow-up.
          </p>
          <span className="mt-4 inline-flex items-center text-sm font-medium text-foreground">
            Open leads <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-0.5" />
          </span>
        </Link>
        <Link
          href="/dashboard/sales-script"
          className="group cursor-pointer rounded-lg border bg-card p-5 transition hover:border-primary/50 hover:bg-primary/[0.03]"
        >
          <MessageSquare className="h-5 w-5 text-primary" />
          <p className="mt-4 text-sm font-semibold text-foreground">Use the script</p>
          <p className="mt-2 text-sm leading-5 text-muted-foreground">
            Pull objection handling, cost framing, and follow-up language before sending.
          </p>
          <span className="mt-4 inline-flex items-center text-sm font-medium text-foreground">
            Open scripts <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-0.5" />
          </span>
        </Link>
        <Link
          href="/contact-sales?intent=manual-invoice"
          className="group cursor-pointer rounded-lg border bg-card p-5 transition hover:border-primary/50 hover:bg-primary/[0.03]"
        >
          <PackageCheck className="h-5 w-5 text-primary" />
          <p className="mt-4 text-sm font-semibold text-foreground">Move to payment</p>
          <p className="mt-2 text-sm leading-5 text-muted-foreground">
            Use sales intake or manual invoice when the buyer is ready to start.
          </p>
          <span className="mt-4 inline-flex items-center text-sm font-medium text-foreground">
            Open intake <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-0.5" />
          </span>
        </Link>
      </div>
    </div>
  );
}
