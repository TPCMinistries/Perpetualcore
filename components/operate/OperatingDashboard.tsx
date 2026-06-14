"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  FileText,
  Loader2,
  Network,
  PackageCheck,
  Send,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type OperatingDashboardData = {
  summary: {
    paidPackageCount: number;
    packageRevenueFormatted: string;
    openLeadCount: number;
    activeClientCount: number;
    pipelineValueFormatted: string;
  };
  activeClients: Array<{
    id: string;
    name: string;
    company: string;
    status: string;
    lane: string;
    value: string;
    nextStep: string;
    createdAt: string;
    href: string;
  }>;
  recentPackages: Array<{
    id: string;
    packageName: string;
    customerName: string;
    customerEmail: string;
    amountFormatted: string;
    leadId: string;
    status: string;
    createdAt: string;
  }>;
  recentSalesContacts: Array<{
    id: string;
    name: string | null;
    email: string | null;
    company: string | null;
    status: string | null;
    interested_in: string | null;
    product: string | null;
    created_at: string | null;
  }>;
  nextActions: Array<{
    id: string;
    title: string;
    detail: string;
    priority: string;
    href: string;
  }>;
  systemMap: Array<{
    name: string;
    role: string;
    status: string;
  }>;
};

const fallbackData: OperatingDashboardData = {
  summary: {
    paidPackageCount: 0,
    packageRevenueFormatted: "$0",
    openLeadCount: 0,
    activeClientCount: 0,
    pipelineValueFormatted: "$0",
  },
  activeClients: [],
  recentPackages: [],
  recentSalesContacts: [],
  nextActions: [],
  systemMap: [
    { name: "Lorenzo D.C.", role: "Trust and demand", status: "Routes qualified attention" },
    { name: "Perpetual Core", role: "Commercial engine", status: "Packages, retainers, installs" },
    { name: "Sage / Dashboard", role: "Operating layer", status: "Client delivery and internal OS" },
    { name: "IHA / Engine", role: "Mission gravity", status: "Revenue commitment and legitimacy" },
  ],
};

const leadRoutes = [
  {
    label: "Warm strategic lead",
    title: "Send the Packages page",
    detail: "For prospects who understand they need AI implementation but need a clean first step.",
    href: "/packages",
    cta: "Open packages",
  },
  {
    label: "Enterprise or complex buyer",
    title: "Send the AI OS Map",
    detail: "For operators like Empire who need to see the whole-company operating system before buying.",
    href: "/lead-magnet",
    cta: "Open lead magnet",
  },
  {
    label: "Ready to talk",
    title: "Send the sales intake",
    detail: "For someone asking what it would take to install AI across their company.",
    href: "/contact-sales?intent=operating-system-map",
    cta: "Open intake",
  },
];

const operatingRhythm = [
  "Capture the lead in the CRM with company, source, urgency, and next step.",
  "Send the right public link: map for enterprise, packages for starter demand, intake for ready buyers.",
  "Move qualified prospects into one operating lane with a named outcome, kickoff window, and owner.",
  "Use the first paid package to prove value, then expand into the broader AI operating system.",
];

const workspaceLayers = [
  {
    name: "Context",
    detail: "The client, company, problem, files, notes, calls, and operating history stay attached to the account.",
  },
  {
    name: "Queue",
    detail: "Every lead, package, workflow, and client lane has a next action instead of disappearing into chat.",
  },
  {
    name: "Production",
    detail: "Sage, Atlas, Sentinel, RFP, and custom builds become delivery surfaces inside the same workspace.",
  },
  {
    name: "Expansion",
    detail: "The first paid result becomes the proof point for a larger AI operating system install.",
  },
];

const onboardingSteps = [
  {
    title: "Payment captured",
    detail: "Stripe package payment lands with package and lead metadata.",
  },
  {
    title: "Lead converted",
    detail: "The linked lead moves to won and keeps the proposal, assistant plan, and activity history.",
  },
  {
    title: "Client lane opened",
    detail: "Operating dashboard shows the account, package, value, and next onboarding action.",
  },
  {
    title: "Delivery rhythm starts",
    detail: "Intake, kickoff, workflow map, product setup, and weekly operating cadence begin.",
  },
];

function formatDate(value: string | null | undefined) {
  if (!value) return "No date";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function OperatingDashboard() {
  const [data, setData] = useState<OperatingDashboardData>(fallbackData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        setLoading(true);
        const response = await fetch("/api/operating-dashboard");
        if (!response.ok) throw new Error("Unable to load operating dashboard.");
        const payload = (await response.json()) as OperatingDashboardData;
        if (active) {
          setData(payload);
          setError(null);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Unable to load operating dashboard.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboard();
    return () => {
      active = false;
    };
  }, []);

  const metrics = useMemo(
    () => [
      {
        label: "Package revenue",
        value: data.summary.packageRevenueFormatted,
        detail: `${data.summary.paidPackageCount} paid package${data.summary.paidPackageCount === 1 ? "" : "s"}`,
        icon: CircleDollarSign,
      },
      {
        label: "Open leads",
        value: String(data.summary.openLeadCount),
        detail: "Sales contacts + CRM leads",
        icon: Users,
      },
      {
        label: "Client lanes",
        value: String(data.summary.activeClientCount),
        detail: "Paid or in active scoping",
        icon: BriefcaseBusiness,
      },
      {
        label: "Pipeline value",
        value: data.summary.pipelineValueFormatted,
        detail: "From CRM estimates",
        icon: Network,
      },
    ],
    [data.summary]
  );

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading operating dashboard
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-5 rounded-xl border border-border bg-background p-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
              Perpetual Core operating dashboard
            </p>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            One place for demand, money, clients, and next actions.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            This is the internal command surface for the ecosystem: Lorenzo creates trust,
            Perpetual Core closes business, and the dashboard turns paid interest into operating lanes.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild className="rounded-md">
            <Link href="/dashboard/leads">
              Manage leads <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-md">
            <Link href="/packages">View packages</Link>
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="rounded-lg shadow-none">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg">Lead routing</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Pick the link based on what the prospect is ready to understand or buy.
                </p>
              </div>
              <Send className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            {leadRoutes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className="group rounded-lg border bg-card p-4 transition hover:border-primary/50 hover:bg-primary/[0.03]"
              >
                <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-primary">
                  {route.label}
                </p>
                <p className="mt-3 text-sm font-semibold text-foreground">{route.title}</p>
                <p className="mt-2 min-h-[60px] text-sm leading-5 text-muted-foreground">{route.detail}</p>
                <span className="mt-4 inline-flex items-center text-sm font-medium text-foreground">
                  {route.cta}
                  <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-lg shadow-none">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg">Operating rhythm</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  The weekly motion for turning attention into retained work.
                </p>
              </div>
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {operatingRhythm.map((step, index) => (
              <div key={step} className="flex gap-3 rounded-lg border bg-card p-3">
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">
                  {index + 1}
                </span>
                <p className="text-sm leading-6 text-muted-foreground">{step}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-lg shadow-none">
        <CardHeader>
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <CardTitle className="text-lg">Operating workspace model</CardTitle>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                This is the practical version of the atelier idea: persistent context,
                queued work, productized delivery, and expansion paths in one place.
              </p>
            </div>
            <Button asChild variant="outline" className="rounded-md">
              <Link href="/dashboard/leads">
                Work the queue <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          {workspaceLayers.map((layer, index) => (
            <div key={layer.name} className="rounded-lg border bg-card p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Layer {String(index + 1).padStart(2, "0")}
              </p>
              <p className="mt-3 text-sm font-semibold text-foreground">{layer.name}</p>
              <p className="mt-2 text-sm leading-5 text-muted-foreground">{layer.detail}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="rounded-lg border-primary/20 bg-gradient-to-br from-primary/[0.06] via-background to-background shadow-none">
        <CardHeader>
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <CardTitle className="text-lg">Paid-client handoff</CardTitle>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                When a buyer pays from a lead-aware package link, the system keeps the trail:
                lead, package, proposal context, Stripe session, and onboarding action.
              </p>
            </div>
            <Button asChild variant="outline" className="rounded-md">
              <Link href="/dashboard/proposals">
                Proposal desk <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          {onboardingSteps.map((step, index) => (
            <div key={step.title} className="rounded-lg border bg-background p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
                {String(index + 1).padStart(2, "0")}
              </p>
              <p className="mt-3 text-sm font-semibold text-foreground">{step.title}</p>
              <p className="mt-2 text-sm leading-5 text-muted-foreground">{step.detail}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.label} className="rounded-lg shadow-none">
              <CardContent className="p-5">
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <Badge variant="outline" className="rounded-md text-[10px] uppercase tracking-[0.16em]">
                    Live
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{metric.label}</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{metric.value}</p>
                <p className="mt-2 text-xs text-muted-foreground">{metric.detail}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <Card className="rounded-lg shadow-none">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg">Client operating lanes</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Paid packages and active sales contacts that need movement.
                </p>
              </div>
              <PackageCheck className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.activeClients.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                No active client lanes yet. Paid packages and open sales contacts will appear here.
              </div>
            ) : (
              data.activeClients.map((client) => (
                <Link
                  key={client.id}
                  href={client.href}
                  className="grid gap-4 rounded-lg border bg-card p-4 transition hover:border-primary/50 hover:bg-primary/[0.03] md:grid-cols-[1fr_160px_220px] md:items-center"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-foreground">{client.name}</p>
                      <Badge variant="secondary" className="rounded-md">{client.status}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{client.company}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{client.nextStep}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Lane</p>
                    <p className="mt-1 text-sm font-medium text-foreground">{client.lane}</p>
                  </div>
                  <div className="flex items-center justify-between gap-3 md:justify-end">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">{client.value}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(client.createdAt)}</p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="rounded-lg shadow-none">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg">Next actions</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  The shortest list of what needs attention.
                </p>
              </div>
              <ClipboardList className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.nextActions.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                No urgent actions yet.
              </div>
            ) : (
              data.nextActions.map((action) => (
                <Link
                  key={action.id}
                  href={action.href}
                  className="block rounded-lg border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-primary/[0.03]"
                >
                  <div className="flex items-start gap-3">
                    <CheckCircle2
                      className={cn(
                        "mt-0.5 h-4 w-4 flex-shrink-0",
                        action.priority === "high" ? "text-primary" : "text-muted-foreground"
                      )}
                    />
                    <div>
                      <p className="text-sm font-medium text-foreground">{action.title}</p>
                      <p className="mt-1 text-sm leading-5 text-muted-foreground">{action.detail}</p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="rounded-lg shadow-none">
          <CardHeader>
            <CardTitle className="text-lg">Recent package payments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentPackages.length === 0 ? (
              <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                No package payments yet.
              </p>
            ) : (
              data.recentPackages.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between gap-4 border-b pb-3 last:border-b-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{payment.packageName}</p>
                    <p className="text-xs text-muted-foreground">
                      {payment.customerName} · {payment.customerEmail || "No email"}
                    </p>
                    {payment.leadId ? (
                      <p className="mt-1 text-xs text-primary">Linked lead</p>
                    ) : null}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">{payment.amountFormatted}</p>
                    <p className="text-xs text-muted-foreground">{payment.status}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="rounded-lg shadow-none">
          <CardHeader>
            <CardTitle className="text-lg">Ecosystem map</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {data.systemMap.map((item) => (
              <div key={item.name} className="rounded-lg border bg-card p-4">
                <p className="text-sm font-semibold text-foreground">{item.name}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">{item.role}</p>
                <p className="mt-3 text-sm leading-5 text-muted-foreground">{item.status}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
