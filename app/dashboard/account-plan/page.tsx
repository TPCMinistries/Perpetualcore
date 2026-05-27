"use client";

import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clipboard,
  FileText,
  Map,
  MessageSquare,
  PackageCheck,
  Route,
  Target,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const accountProfile = {
  name: "Empire-style regional operator",
  segment: "Furniture, FF&E, retail operations, regional service business",
  hypothesis:
    "The opportunity is not one AI tool. It is an AI operating layer across sales intake, quotes, customer follow-up, internal knowledge, service coordination, inventory visibility, vendor handoffs, and leadership reporting.",
  firstMove:
    "Start with a company map and one high-value workflow. Prove value in one operating lane, then expand across departments.",
};

const buyingCommittee = [
  {
    role: "Owner / President",
    cares: "Revenue, margin, speed, leadership visibility, competitive advantage.",
  },
  {
    role: "Operations leader",
    cares: "Handoffs, service quality, process consistency, fewer manual follow-ups.",
  },
  {
    role: "Sales manager",
    cares: "Faster quotes, better follow-up, cleaner pipeline, fewer missed opportunities.",
  },
  {
    role: "Finance / admin",
    cares: "Invoices, approvals, reporting, clean records, lower rework.",
  },
];

const discoveryMap = [
  {
    area: "Sales and quoting",
    questions: [
      "Where do leads, quote requests, and customer follow-ups come in?",
      "How long does it take to turn a real customer request into a quote or next step?",
      "Which parts of the quoting process depend on one experienced person?",
    ],
  },
  {
    area: "Operations and service",
    questions: [
      "Where does work get delayed between sales, operations, delivery, installation, and service?",
      "Which customer issues repeat because context is scattered?",
      "What do managers have to chase manually every week?",
    ],
  },
  {
    area: "Knowledge and training",
    questions: [
      "Where do policies, product knowledge, vendor details, and process notes live?",
      "What does a new employee need to learn that is not written down cleanly?",
      "What knowledge would be painful to lose if a senior person left?",
    ],
  },
  {
    area: "Leadership visibility",
    questions: [
      "What do leaders wish they could see every morning without asking five people?",
      "Which metrics are late, manual, or unreliable?",
      "Where would weekly AI summaries save leadership time?",
    ],
  },
];

const offerPath = [
  {
    step: "01",
    title: "AI OS Map",
    detail: "Send the map so they understand this is a whole-company operating layer, not a chatbot pitch.",
    href: "/lead-magnet",
  },
  {
    step: "02",
    title: "Sales intake",
    detail: "Capture the operating context, stakeholders, workflow pain, systems, and buying process.",
    href: "/contact-sales?intent=operating-system-map",
  },
  {
    step: "03",
    title: "First workflow package",
    detail: "Use one visible workflow to prove value without asking for a full-company commitment first.",
    href: "/packages",
  },
  {
    step: "04",
    title: "90-day operating lane",
    detail: "If they want you involved as AI consultant/operator, move into a managed operating lane.",
    href: "/contact-sales?plan=operating-lane-deposit",
  },
];

const outreachCopy = [
  {
    label: "Warm intro text",
    text:
      "I have been thinking about how AI could help a company like yours beyond a chatbot. The opportunity is an operating layer across sales, quotes, customer follow-up, internal knowledge, operations, and leadership visibility. I would start by mapping the company and picking one high-value workflow to prove value before expanding.",
  },
  {
    label: "After first conversation",
    text:
      "Based on what you shared, I would not start with a huge AI transformation project. I would start with one operating lane: map the workflow, connect the right company context, install the first AI-supported process, and measure whether it saves time, improves follow-up, or increases visibility.",
  },
  {
    label: "Cost framing",
    text:
      "There are two layers: software access and implementation. Software can start small, but the real value is installing it into a workflow that matters. For a company-wide opportunity, I would start with a scoped first workflow or a 90-day operating lane instead of pretending a subscription alone will transform the business.",
  },
];

const nextActions = [
  "Add the contact in Leads with company, source, and expected value.",
  "Send the AI OS Map first if they need the big picture.",
  "Ask discovery questions by department, not generic AI questions.",
  "Propose one paid first workflow with an expansion path.",
  "Move serious buyers into Sales intake or Manual invoice.",
];

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  } catch {
    toast.error("Could not copy text");
  }
}

export default function AccountPlanPage() {
  return (
    <div className="space-y-6 pb-10">
      <div className="rounded-xl border border-border bg-background p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Strategic account plan
              </p>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Build the pursuit around the buyer's operation.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Use this page for Empire-style accounts and any serious company where the opportunity is
              a full operating system, not a one-off AI workflow.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="outline" className="rounded-md">
              <Link href="/dashboard/sales-script">Scripts</Link>
            </Button>
            <Button asChild className="rounded-md">
              <Link href="/dashboard/leads">
                Open leads <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-lg shadow-none">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <Badge variant="outline" className="mb-3 rounded-md">
                  {accountProfile.segment}
                </Badge>
                <CardTitle className="text-xl">{accountProfile.name}</CardTitle>
              </div>
              <Building2 className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Hypothesis
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{accountProfile.hypothesis}</p>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                First move
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{accountProfile.firstMove}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-lg shadow-none">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="text-xl">Buying committee</CardTitle>
              <Target className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {buyingCommittee.map((buyer) => (
              <div key={buyer.role} className="rounded-lg border bg-card p-4">
                <p className="text-sm font-semibold text-foreground">{buyer.role}</p>
                <p className="mt-2 text-sm leading-5 text-muted-foreground">{buyer.cares}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-lg shadow-none">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-xl">Discovery map</CardTitle>
            <Map className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-4">
          {discoveryMap.map((section) => (
            <div key={section.area} className="rounded-lg border bg-card p-4">
              <p className="text-sm font-semibold text-foreground">{section.area}</p>
              <ul className="mt-4 space-y-3">
                {section.questions.map((question) => (
                  <li key={question} className="flex gap-2 text-sm leading-5 text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                    {question}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="rounded-lg shadow-none">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="text-xl">Offer path</CardTitle>
              <Route className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {offerPath.map((item) => (
              <Link
                key={item.step}
                href={item.href}
                className="group grid gap-3 rounded-lg border bg-card p-4 transition hover:border-primary/50 hover:bg-primary/[0.03] sm:grid-cols-[44px_1fr_120px]"
              >
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  {item.step}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-foreground">{item.title}</span>
                  <span className="mt-1 block text-sm leading-5 text-muted-foreground">{item.detail}</span>
                </span>
                <span className="inline-flex items-center text-sm font-medium text-foreground sm:justify-end">
                  Open <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-lg shadow-none">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="text-xl">Copy bank</CardTitle>
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {outreachCopy.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => copyText(item.text)}
                className="w-full rounded-lg border bg-card p-4 text-left transition hover:border-primary/50 hover:bg-primary/[0.03]"
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

      <Card className="rounded-lg shadow-none">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-xl">Next actions</CardTitle>
            <FileText className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-5">
          {nextActions.map((action, index) => (
            <div key={action} className="rounded-lg border bg-card p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
                {String(index + 1).padStart(2, "0")}
              </p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{action}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-background p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">Ready to work this account?</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Capture the lead, send the map, and move the conversation toward one paid operating lane.
          </p>
        </div>
        <Button asChild className="rounded-md">
          <Link href="/dashboard/leads">
            Add or update lead <PackageCheck className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
