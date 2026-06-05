"use client";

import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Building2,
  CalendarDays,
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
  name: "Regional operator or serious small business",
  segment:
    "Furniture, FF&E, retail operations, professional services, local service businesses",
  hypothesis:
    "The opportunity is not one AI tool. It is an AI operating layer across sales intake, quotes, customer follow-up, internal knowledge, service coordination, vendor handoffs, admin work, and leadership reporting.",
  firstMove:
    "Start with a company map and one high-value workflow. Prove value in one operating lane, then expand across departments.",
};

const marketPositioning = [
  {
    tier: "Small business",
    buyerLanguage: "I need help using AI in the work we already do.",
    bestStart: "Guided Setup or First Workflow",
    promise:
      "Install one useful AI-supported workflow without making them feel like they bought a transformation project.",
  },
  {
    tier: "Established regional company",
    buyerLanguage:
      "We have teams, handoffs, quotes, service issues, and reporting gaps.",
    bestStart: "First Workflow or 90-Day Operating Lane",
    promise:
      "Show how Perpetual Core becomes the operating layer across departments, then start with one measurable lane.",
  },
  {
    tier: "Enterprise-style account",
    buyerLanguage: "We need a serious AI consultant/operator, not a tool demo.",
    bestStart: "90-Day Operating Lane",
    promise:
      "Run a managed cadence: map, install, train, report, and expand across the company operating system.",
  },
];

const buyingCommittee = [
  {
    role: "Owner / President",
    cares:
      "Revenue, margin, speed, leadership visibility, competitive advantage.",
  },
  {
    role: "Operations leader",
    cares:
      "Handoffs, service quality, process consistency, fewer manual follow-ups.",
  },
  {
    role: "Sales manager",
    cares:
      "Faster quotes, better follow-up, cleaner pipeline, fewer missed opportunities.",
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
    detail:
      "Send the map so they understand this is a whole-company operating layer, not a chatbot pitch.",
    href: "/lead-magnet",
  },
  {
    step: "02",
    title: "Sales intake",
    detail:
      "Capture the operating context, stakeholders, workflow pain, systems, and buying process.",
    href: "/contact-sales?intent=operating-system-map",
  },
  {
    step: "03",
    title: "First workflow package",
    detail:
      "Use one visible workflow to prove value without asking for a full-company commitment first.",
    href: "/packages",
  },
  {
    step: "04",
    title: "90-day operating lane",
    detail:
      "If they want you involved as AI consultant/operator, move into a managed operating lane.",
    href: "/contact-sales?plan=operating-lane-deposit",
  },
];

const qualificationScorecard = [
  {
    signal: "Operational pain",
    strong:
      "They can name a workflow costing time, revenue, visibility, or service quality.",
    weak: "They only want to hear about AI in general.",
  },
  {
    signal: "Executive sponsor",
    strong:
      "An owner, president, or department head will join the second conversation.",
    weak: "The conversation stays with a curious individual who cannot authorize change.",
  },
  {
    signal: "Systems access",
    strong:
      "They can identify the tools, inboxes, spreadsheets, CRMs, docs, or calendars involved.",
    weak: "They cannot explain where the work currently happens.",
  },
  {
    signal: "Budget shape",
    strong:
      "They understand there is software plus implementation, even if the first invoice is scoped.",
    weak: "They expect a subscription to solve the business problem by itself.",
  },
];

const firstCallAgenda = [
  "Clarify the business outcome they would pay to improve.",
  "Map the current workflow from request to completion.",
  "Identify who owns sales, operations, admin, and leadership reporting.",
  "Name the data and systems the AI operating layer would need.",
  "Choose the smallest paid lane that proves real value.",
];

const packagePicker = [
  {
    trigger: "They ask, 'Can I just try the software?'",
    recommendation: "Software Access",
    href: "/packages",
    reason:
      "Use this when the buyer is product-curious but not ready for implementation.",
  },
  {
    trigger: "They trust you but need a small first invoice.",
    recommendation: "Guided Setup",
    href: "/contact-sales?plan=guided-setup",
    reason:
      "Use this to configure one product surface and establish the working relationship.",
  },
  {
    trigger: "They have a painful workflow right now.",
    recommendation: "First Workflow Package",
    href: "/contact-sales?plan=first-workflow",
    reason:
      "Use this when value depends on installing AI into sales, ops, admin, or reporting.",
  },
  {
    trigger: "They want you as AI consultant/operator.",
    recommendation: "90-Day Operating Lane",
    href: "/contact-sales?plan=operating-lane-deposit",
    reason:
      "Use this for Empire-style accounts where the goal is a company operating layer.",
  },
];

const outreachCopy = [
  {
    label: "Warm intro text",
    text: "I have been thinking about how AI could help a company like yours beyond a chatbot. The opportunity is an operating layer across sales, quotes, customer follow-up, internal knowledge, operations, and leadership visibility. I would start by mapping the company and picking one high-value workflow to prove value before expanding.",
  },
  {
    label: "After first conversation",
    text: "Based on what you shared, I would not start with a huge AI transformation project. I would start with one operating lane: map the workflow, connect the right company context, install the first AI-supported process, and measure whether it saves time, improves follow-up, or increases visibility.",
  },
  {
    label: "Cost framing",
    text: "There are two layers: software access and implementation. Software can start small, but the real value is installing it into a workflow that matters. For a company-wide opportunity, I would start with a scoped first workflow or a 90-day operating lane instead of pretending a subscription alone will transform the business.",
  },
];

const nextActions = [
  "Add the contact in Leads with company, source, and expected value.",
  "Send the AI OS Map first if they need the big picture.",
  "Ask discovery questions by department, not generic AI questions.",
  "Propose one paid first workflow with an expansion path.",
  "Move serious buyers into Sales intake or Manual invoice.",
];

const accountPlanPrompt = [
  "You are helping Lorenzo sell and install Perpetual Core.",
  "",
  "Given a target company, return:",
  "1. The likely buying committee.",
  "2. The first workflow worth mapping.",
  "3. The best starter offer: Software Access, Guided Setup, First Workflow, or 90-Day Operating Lane.",
  "4. The discovery questions by department.",
  "5. The follow-up message in Lorenzo's voice.",
  "6. The expansion path from first paid work to a broader AI operating system.",
  "",
  "Positioning rule: do not sell a chatbot. Sell an AI operating layer that starts with one practical workflow and can expand across sales, operations, admin, knowledge, and leadership reporting.",
].join("\n");

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
              Use this page for Empire-style accounts and any serious company
              where the opportunity is a full operating system, not a one-off AI
              workflow.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="outline" className="rounded-md">
              <Link href="/dashboard/sales-script">Scripts</Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-md"
              onClick={() => copyText(accountPlanPrompt)}
            >
              <Bot className="mr-2 h-4 w-4" />
              Copy AI brief
            </Button>
            <Button asChild className="rounded-md">
              <Link href="/dashboard/leads">
                Open leads <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <Card className="rounded-lg border-violet-200 bg-white shadow-none">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-xl">How to scale the offer</CardTitle>
            <Bot className="h-5 w-5 text-violet-600" />
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            Use the same operating-system thesis, but change the first invoice
            and language based on company maturity.
          </p>
        </CardHeader>
        <CardContent className="grid gap-3 lg:grid-cols-3">
          {marketPositioning.map((item) => (
            <div key={item.tier} className="rounded-lg border bg-card p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
                {item.tier}
              </p>
              <p className="mt-3 text-sm font-semibold text-foreground">
                {item.buyerLanguage}
              </p>
              <div className="mt-4 rounded-md bg-primary/[0.06] p-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
                  Start with
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {item.bestStart}
                </p>
              </div>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                {item.promise}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

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
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {accountProfile.hypothesis}
              </p>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                First move
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {accountProfile.firstMove}
              </p>
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
                <p className="text-sm font-semibold text-foreground">
                  {buyer.role}
                </p>
                <p className="mt-2 text-sm leading-5 text-muted-foreground">
                  {buyer.cares}
                </p>
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
              <p className="text-sm font-semibold text-foreground">
                {section.area}
              </p>
              <ul className="mt-4 space-y-3">
                {section.questions.map((question) => (
                  <li
                    key={question}
                    className="flex gap-2 text-sm leading-5 text-muted-foreground"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                    {question}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="rounded-lg shadow-none">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="text-xl">First-call agenda</CardTitle>
              <CalendarDays className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {firstCallAgenda.map((item, index) => (
              <div
                key={item}
                className="flex gap-3 rounded-lg border bg-card p-4"
              >
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
                  {String(index + 1).padStart(2, "0")}
                </span>
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
              <CardTitle className="text-xl">Qualification scorecard</CardTitle>
              <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {qualificationScorecard.map((item) => (
              <div key={item.signal} className="rounded-lg border bg-card p-4">
                <p className="text-sm font-semibold text-foreground">
                  {item.signal}
                </p>
                <div className="mt-4 space-y-3">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
                      Strong
                    </p>
                    <p className="mt-1 text-sm leading-5 text-muted-foreground">
                      {item.strong}
                    </p>
                  </div>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      Weak
                    </p>
                    <p className="mt-1 text-sm leading-5 text-muted-foreground">
                      {item.weak}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-lg shadow-none">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-xl">Package picker</CardTitle>
            <PackageCheck className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 lg:grid-cols-4">
          {packagePicker.map((item) => (
            <Link
              key={item.recommendation}
              href={item.href}
              className="group flex min-h-full flex-col rounded-lg border bg-card p-4 transition hover:border-primary/50 hover:bg-primary/[0.03]"
            >
              <p className="text-sm leading-5 text-muted-foreground">
                {item.trigger}
              </p>
              <p className="mt-4 text-sm font-semibold text-foreground">
                {item.recommendation}
              </p>
              <p className="mt-2 flex-1 text-sm leading-5 text-muted-foreground">
                {item.reason}
              </p>
              <span className="mt-4 inline-flex items-center text-sm font-medium text-foreground">
                Open path{" "}
                <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-0.5" />
              </span>
            </Link>
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
                  <span className="block text-sm font-semibold text-foreground">
                    {item.title}
                  </span>
                  <span className="mt-1 block text-sm leading-5 text-muted-foreground">
                    {item.detail}
                  </span>
                </span>
                <span className="inline-flex items-center text-sm font-medium text-foreground sm:justify-end">
                  Open{" "}
                  <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-0.5" />
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
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {action}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-background p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">
            Ready to work this account?
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Capture the lead, send the map, and move the conversation toward one
            paid operating lane.
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
