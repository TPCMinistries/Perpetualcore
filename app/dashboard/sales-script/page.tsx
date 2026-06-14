"use client";

import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clipboard,
  DollarSign,
  MessageSquare,
  PackageCheck,
  Send,
  Store,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const links = [
  {
    label: "AI OS Map",
    href: "/lead-magnet",
    use: "Use when they need the big picture before they buy.",
  },
  {
    label: "Packages",
    href: "/packages",
    use: "Use when they ask how to start or what the first paid step is.",
  },
  {
    label: "Sales intake",
    href: "/contact-sales?intent=operating-system-map",
    use: "Use when they are ready for scope, invoice, or an implementation call.",
  },
  {
    label: "Manual invoice",
    href: "/contact-sales?intent=manual-invoice",
    use: "Use when procurement, ACH, or a custom first payment is needed.",
  },
];

const scripts = [
  {
    title: "Empire-style enterprise lead",
    icon: Building2,
    tag: "Whole-company AI OS",
    when: "Use for a multi-location operator, furniture company, service business, or regional leader with departments, handoffs, sales, inventory, service, and leadership visibility problems.",
    opener:
      "I am not trying to sell you a chatbot. I want to help you install an AI operating layer across the parts of the business where information gets lost, work slows down, or leaders cannot see what is happening fast enough.",
    diagnose: [
      "Where does work slow down between sales, operations, customer service, finance, and leadership?",
      "Which reports, follow-ups, quotes, or customer communications are still manual?",
      "Where do your best people carry knowledge that is not captured anywhere?",
      "If AI saved 5-10 hours a week per key role, where would that matter most?",
    ],
    offer:
      "The right first step is not a full transformation promise. I would start by mapping the company, selecting one high-value workflow, and installing the first operating lane. If it proves value, we expand across the company.",
    send: "AI OS Map first, then Sales intake.",
    copy:
      "I looked at where your company could benefit from AI beyond a chatbot. The opportunity is an operating layer across sales, operations, customer communication, internal knowledge, and leadership visibility. I would start by mapping the company, picking one high-value workflow, and installing the first operating lane so we can prove value before expanding.",
  },
  {
    title: "Small business lead",
    icon: Store,
    tag: "Guided setup",
    when: "Use for owners who trust you but are not ready for a large install yet.",
    opener:
      "You probably do not need a giant AI project first. You need one useful workflow working correctly, with your company context in it, so your team can see what is possible.",
    diagnose: [
      "What are you repeating every week that should be easier?",
      "Where are customers waiting too long for answers, quotes, or follow-up?",
      "Which documents, notes, or spreadsheets do people keep searching for?",
      "If we fixed one workflow in two weeks, what would you pick?",
    ],
    offer:
      "I would start with Guided Setup or the First Workflow Package. That keeps the first invoice reasonable while still building toward the larger operating system.",
    send: "Packages page.",
    copy:
      "I think the best first step is not a giant AI build. It is one practical workflow with your business context built in. We can start with Guided Setup or a First Workflow Package, prove value, and then decide whether it should expand.",
  },
  {
    title: "When they ask cost",
    icon: DollarSign,
    tag: "Price conversation",
    when: "Use when someone asks for pricing before they understand scope.",
    opener:
      "There are two costs: the software layer and the implementation layer. The software can start small, but the real value comes from installing it into a workflow that matters.",
    diagnose: [
      "Are you asking to try the software, solve one workflow, or have us operate alongside the team?",
      "Do you need a simple first invoice or a scoped implementation proposal?",
      "Is this owner-led, department-led, or procurement-led?",
      "What budget range would make a first proof-of-value realistic?",
    ],
    offer:
      "Software access can start in the hundreds per month. Guided setup starts in the low thousands. A first workflow package is a five-figure implementation. A 90-day operating lane is for companies that want us involved as the AI operating partner.",
    send: "Packages page or Manual invoice intake.",
    copy:
      "There are two costs: software and implementation. Software can start small, but the real value is installing it into a workflow that matters. If you want a clean first step, I would start with Guided Setup or a First Workflow Package and then expand only if it proves value.",
  },
  {
    title: "Product-only buyer",
    icon: PackageCheck,
    tag: "Software access",
    when: "Use when the buyer wants to try Sage, Atlas, Sentinel, RFP, or another focused product before services.",
    opener:
      "That works. We can start with one product surface first, but I still want to make sure it has enough context to be useful instead of becoming another unused login.",
    diagnose: [
      "Which product surface do you actually want to use first?",
      "Who will use it weekly?",
      "What context should it know before it is useful?",
      "What would make you upgrade into setup or a workflow package?",
    ],
    offer:
      "Start with Software Access. If the product is useful but needs workflow integration, move into Guided Setup or a First Workflow Package.",
    send: "Packages page.",
    copy:
      "We can start with one product surface first. I would still want to connect enough company context for it to be useful. If it starts saving time or exposing a workflow opportunity, then we can move into setup or a first workflow package.",
  },
];

const objectionResponses = [
  {
    objection: "We already use ChatGPT.",
    response:
      "That is good. ChatGPT is a tool. Perpetual Core is about the operating layer: company context, workflows, handoffs, accountability, and repeatable use across the business.",
  },
  {
    objection: "We are not ready for a big AI project.",
    response:
      "That is exactly why I would not start with a big project. I would start with one operating lane that proves value and gives you the option to expand.",
  },
  {
    objection: "Can you just set up the software?",
    response:
      "Yes, but setup should still be tied to a business workflow. Otherwise it becomes another login. The goal is one useful system your team actually uses.",
  },
  {
    objection: "Why you?",
    response:
      "Because I am building the company, the tools, and the operating method together. I am not only advising on AI; I am installing a practical operating system around it.",
  },
];

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  } catch {
    toast.error("Could not copy text");
  }
}

export default function SalesScriptPage() {
  return (
    <div className="space-y-6 pb-10">
      <div className="rounded-xl border border-border bg-background p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Sales scripts
              </p>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              What to say, what to ask, and where to send the lead.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Use this during calls, text threads, DMs, and warm referrals. The goal is
              to move a prospect from curiosity into one clear next step.
            </p>
          </div>
          <Button asChild className="w-full rounded-md sm:w-auto">
            <Link href="/dashboard/leads">
              Open leads <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        {links.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group rounded-lg border bg-card p-5 transition hover:border-primary/50 hover:bg-primary/[0.03]"
          >
            <div className="mb-4 flex items-center justify-between">
              <Send className="h-5 w-5 text-primary" />
              <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
            </div>
            <p className="text-sm font-semibold text-foreground">{item.label}</p>
            <p className="mt-2 text-sm leading-5 text-muted-foreground">{item.use}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6">
        {scripts.map((script) => {
          const Icon = script.icon;
          return (
            <Card key={script.title} className="rounded-lg shadow-none">
              <CardHeader>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <Badge variant="outline" className="rounded-md">
                        {script.tag}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl">{script.title}</CardTitle>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                      {script.when}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-md"
                    onClick={() => copyText(script.copy)}
                  >
                    <Clipboard className="mr-2 h-4 w-4" />
                    Copy follow-up
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr_0.8fr]">
                <div className="rounded-lg border bg-card p-4">
                  <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    Say this
                  </p>
                  <p className="text-sm leading-6 text-muted-foreground">{script.opener}</p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                  <p className="mb-3 text-sm font-semibold text-foreground">Ask this</p>
                  <ul className="space-y-3">
                    {script.diagnose.map((question) => (
                      <li key={question} className="flex gap-3 text-sm leading-5 text-muted-foreground">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                        {question}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-lg border bg-card p-4">
                  <p className="mb-3 text-sm font-semibold text-foreground">Move to this</p>
                  <p className="text-sm leading-6 text-muted-foreground">{script.offer}</p>
                  <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
                    Send: {script.send}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="rounded-lg shadow-none">
        <CardHeader>
          <CardTitle className="text-lg">Objection responses</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {objectionResponses.map((item) => (
            <button
              key={item.objection}
              type="button"
              onClick={() => copyText(item.response)}
              className="rounded-lg border bg-card p-4 text-left transition hover:border-primary/50 hover:bg-primary/[0.03]"
            >
              <p className="text-sm font-semibold text-foreground">{item.objection}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.response}</p>
              <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
                Copy response
              </p>
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
