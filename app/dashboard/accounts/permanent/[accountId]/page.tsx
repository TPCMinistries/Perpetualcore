"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  CalendarClock,
  Clipboard,
  ExternalLink,
  Loader2,
  PackageCheck,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

type PermanentAccountResponse = {
  account?: PermanentAccount;
  engagements?: PermanentEngagement[];
  error?: string;
};

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(record: JsonRecord, key: string) {
  const value = record[key];
  return typeof value === "string" && value.trim().length > 0 ? value : "";
}

function formatDateTime(value: string) {
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

export default function PermanentAccountPage() {
  const params = useParams<{ accountId: string }>();
  const accountId = params.accountId;
  const [account, setAccount] = useState<PermanentAccount | null>(null);
  const [engagements, setEngagements] = useState<PermanentEngagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load permanent account");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (accountId) loadAccount();
  }, [accountId]);

  const metadata = useMemo(() => (account && isRecord(account.metadata) ? account.metadata : {}), [account]);
  const primaryEngagement = getPrimaryEngagement(engagements);
  const sourceLeadId = readString(metadata, "source_lead_id");
  const contactName = readString(metadata, "contact_name");
  const contactEmail = readString(metadata, "contact_email");
  const contactPhone = readString(metadata, "contact_phone");
  const createdFrom = readString(metadata, "created_from");
  const handoffContext = isRecord(metadata.account_handoff_context) ? metadata.account_handoff_context : null;

  async function copyBrief() {
    if (!account) return;

    try {
      await navigator.clipboard.writeText(buildAccountBrief(account, engagements));
      toast.success("Account brief copied");
    } catch {
      toast.error("Could not copy account brief");
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
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            This is the durable Perpetual Core account record. Use it when the account exists even if no
            source lead room is available.
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
          <Button type="button" variant="outline" className="rounded-md" onClick={copyBrief}>
            <Clipboard className="mr-2 h-4 w-4" />
            Copy brief
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          ["Account ID", shortId(account.id)],
          ["Buyer type", account.buyer_type || "Not set"],
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
                  <div className="mt-4 rounded-md bg-slate-50 p-3">
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Next step</p>
                    <p className="mt-2 text-sm leading-5 text-slate-700">
                      {engagement.next_step || "Confirm the next account operating action."}
                    </p>
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
                  {primaryEngagement?.next_step || "Define the first accountable operating lane."}
                </p>
                <p className="mt-2 text-sm leading-6 text-violet-800">
                  Use the source lead room when available for tasks, handoff, and timeline. Use this durable
                  account room when the account record exists independently.
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
        </div>
      </div>

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
            <div className="grid gap-3 md:grid-cols-2">
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

      {account.notes ? (
        <Card className="rounded-lg shadow-none">
          <CardHeader>
            <CardTitle className="text-xl">Account notes</CardTitle>
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
