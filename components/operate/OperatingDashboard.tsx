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
  Loader2,
  Network,
  PackageCheck,
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
  }>;
  recentPackages: Array<{
    id: string;
    packageName: string;
    customerName: string;
    customerEmail: string;
    amountFormatted: string;
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
                <div key={client.id} className="grid gap-4 rounded-lg border bg-card p-4 md:grid-cols-[1fr_160px_220px] md:items-center">
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
                </div>
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
