/**
 * /admin/vellum-waitlist — Vellum by Perpetual Core early-access waitlist.
 *
 * Server component. Admin-gated via checkAdminAccess() (is_admin or
 * is_super_admin flag in user_profiles table). Data fetched via
 * createAdminClient() (service-role, bypasses RLS per CORE-tier CLAUDE.md rule).
 *
 * Renders:
 *   - Summary stats: total, free, operator, team, institution, 501(c)(3) count
 *   - Table of all vellum_early_access rows (email, tier, org type, 501(c)(3),
 *     source, setup_intent truncated, created_at)
 *   - CSV export button (client-side data URI, no server endpoint needed)
 *   - Empty state with link to form
 *
 * Plan 12-05 / STUDIO-VW-01.
 */

import { redirect } from "next/navigation";
import { checkAdminAccess } from "@/lib/admin/checkAdmin";
import { createAdminClient } from "@/lib/supabase/server";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VellumWaitlistClient } from "./VellumWaitlistClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Vellum Waitlist — Admin",
};

type WaitlistRow = {
  id: string;
  email: string;
  tier_preference: string | null;
  organization_type: string | null;
  is_501c3: boolean | null;
  source: string | null;
  setup_intent_id: string | null;
  created_at: string;
};

function tierLabel(tier: string | null): string {
  switch (tier) {
    case "free":
      return "Free";
    case "operator":
      return "Operator $299";
    case "team":
      return "Team $1,500";
    case "institution":
      return "Institution";
    default:
      return tier ?? "—";
  }
}

function truncateIntentId(id: string | null): string {
  if (!id) return "—";
  return id.length > 12 ? `${id.slice(0, 8)}…${id.slice(-4)}` : id;
}

function stripeIntentUrl(id: string | null): string | null {
  if (!id) return null;
  // Links to Stripe test dashboard — safe to surface (test IDs only in dev)
  return `https://dashboard.stripe.com/test/setup_intents/${id}`;
}

export default async function VellumWaitlistPage() {
  // Auth guard — is_admin OR is_super_admin required
  const { isAdmin, user } = await checkAdminAccess();
  if (!isAdmin || !user) {
    redirect("/");
  }

  // Fetch all signups via service-role client (bypasses RLS — required for admin)
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("vellum_early_access")
    .select(
      "id, email, tier_preference, organization_type, is_501c3, source, setup_intent_id, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    console.error("[admin/vellum-waitlist] fetch error:", error.message);
  }

  const rows: WaitlistRow[] = (data ?? []) as WaitlistRow[];

  // Summary stats
  const total = rows.length;
  const free = rows.filter((r) => r.tier_preference === "free").length;
  const operator = rows.filter((r) => r.tier_preference === "operator").length;
  const team = rows.filter((r) => r.tier_preference === "team").length;
  const institution = rows.filter((r) => r.tier_preference === "institution").length;
  const c501 = rows.filter((r) => r.is_501c3 === true).length;

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <p className="text-sm text-muted-foreground mb-1">Admin / Vellum</p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Vellum Early Access Waitlist
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Signups for Vellum by Perpetual Core. Service-role only — RLS
            enforces on all other paths.
          </p>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-8">
          {[
            { label: "Total", value: total },
            { label: "Free", value: free },
            { label: "Operator", value: operator },
            { label: "Team", value: team },
            { label: "Institution", value: institution },
            { label: "501(c)(3)", value: c501 },
          ].map((stat) => (
            <Card key={stat.label} className="border-border/60">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-semibold">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.label}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CSV export + table — client wrapper handles the export button */}
        <VellumWaitlistClient rows={rows} />

        {/* Table — server-rendered */}
        {rows.length === 0 ? (
          <Card className="border-border/60">
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground mb-2">No signups yet.</p>
              <p className="text-sm text-muted-foreground">
                Form is at{" "}
                <a
                  href="/products/vellum#early-access"
                  className="text-primary hover:underline"
                >
                  /products/vellum#early-access
                </a>
                .
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border/60">
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Org type</TableHead>
                    <TableHead>501(c)(3)</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Setup intent</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => {
                    const intentUrl = stripeIntentUrl(row.setup_intent_id);
                    return (
                      <TableRow key={row.id}>
                        <TableCell className="font-mono text-sm">
                          {row.email}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              row.tier_preference === "operator" ||
                              row.tier_preference === "team"
                                ? "default"
                                : "secondary"
                            }
                            className="text-xs"
                          >
                            {tierLabel(row.tier_preference)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {row.organization_type ?? "—"}
                        </TableCell>
                        <TableCell>
                          {row.is_501c3 ? (
                            <Badge variant="secondary" className="text-xs">
                              Yes
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">
                              No
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {row.source ?? "—"}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {intentUrl ? (
                            <a
                              href={intentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              {truncateIntentId(row.setup_intent_id)}
                            </a>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {new Date(row.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
