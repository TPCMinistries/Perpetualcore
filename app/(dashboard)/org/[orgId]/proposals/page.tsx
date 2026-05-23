/**
 * /org/[orgId]/proposals — Proposals list index.
 *
 * Lists every proposal in the org, sorted by updated_at desc. Click-
 * through to the detail page. Adds a filterable status pill row at
 * the top: all / draft / submitted / won / lost / withdrawn.
 *
 * Closes the dead-end where typing /org/[id]/proposals 404'd — users
 * had to navigate back through /discovery to find a proposal again.
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Status = "draft" | "submitted" | "won" | "lost" | "withdrawn";
const STATUS_FILTERS: Array<Status | "all"> = [
  "all",
  "draft",
  "submitted",
  "won",
  "lost",
  "withdrawn",
];

const STATUS_CHIP: Record<Status, string> = {
  draft: "border-zinc-700 bg-zinc-900 text-zinc-300",
  submitted: "border-amber-500/40 bg-amber-500/10 text-amber-200",
  won: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
  lost: "border-rose-500/40 bg-rose-500/10 text-rose-200",
  withdrawn: "border-zinc-700 bg-zinc-900 text-zinc-500",
};

interface PageProps {
  params: Promise<{ orgId: string }>;
  searchParams: Promise<{ status?: string }>;
}

interface ProposalRow {
  id: string;
  title: string;
  status: string;
  due_date: string | null;
  updated_at: string;
  created_at: string;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fmtRelative(iso: string | null): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  const seconds = Math.floor((Date.now() - t) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function coerceStatus(s: string | undefined): Status | "all" {
  if (!s) return "all";
  if (
    s === "draft" ||
    s === "submitted" ||
    s === "won" ||
    s === "lost" ||
    s === "withdrawn"
  ) {
    return s;
  }
  return "all";
}

export default async function ProposalsListPage({
  params,
  searchParams,
}: PageProps) {
  const { orgId } = await params;
  const sp = await searchParams;
  const activeFilter = coerceStatus(sp.status);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  // Membership check — RLS would 404 anyway but we want a typed role
  // for UI affordances later.
  const { data: membership } = await supabase
    .from("rfp_user_orgs")
    .select("role")
    .eq("org_id", orgId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!(membership as { role: string } | null)) notFound();

  let query = supabase
    .from("rfp_proposals")
    .select("id, title, status, due_date, updated_at, created_at")
    .eq("org_id", orgId)
    .order("updated_at", { ascending: false })
    .limit(100);

  if (activeFilter !== "all") {
    query = query.eq("status", activeFilter);
  }

  const { data: proposals } = await query.returns<ProposalRow[]>();
  const rows = proposals ?? [];

  // Count per-status totals for the filter chips (small extra query;
  // a single GROUP BY would be more efficient but PostgREST doesn't
  // expose group-by cleanly in the JS client).
  const { data: allForCounts } = await supabase
    .from("rfp_proposals")
    .select("status")
    .eq("org_id", orgId)
    .returns<{ status: string }[]>();
  const counts: Record<string, number> = { all: allForCounts?.length ?? 0 };
  for (const r of allForCounts ?? []) {
    counts[r.status] = (counts[r.status] ?? 0) + 1;
  }

  return (
    <div className="relative">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <Link
          href={`/org/${orgId}/discovery`}
          className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500 hover:text-zinc-300"
        >
          ← Discovery
        </Link>

        <div className="mt-6 font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500">
          Proposals
        </div>
        <h1
          className="mt-3 text-3xl italic text-white"
          style={{ fontFamily: "Georgia, serif" }}
        >
          {counts.all === 0
            ? "No proposals yet."
            : counts.all === 1
              ? "1 proposal"
              : `${counts.all} proposals`}
        </h1>

        {/* Status filter chips */}
        <div className="mt-6 flex flex-wrap gap-2">
          {STATUS_FILTERS.map((s) => {
            const isActive = s === activeFilter;
            const count = counts[s] ?? 0;
            const href =
              s === "all"
                ? `/org/${orgId}/proposals`
                : `/org/${orgId}/proposals?status=${s}`;
            return (
              <Link
                key={s}
                href={href}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] transition ${
                  isActive
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                    : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                {s}
                <span className="font-mono text-[9px] text-zinc-500">
                  {count}
                </span>
              </Link>
            );
          })}
        </div>

        {/* List */}
        {rows.length === 0 ? (
          <div className="mt-10 rounded-lg border border-zinc-900 bg-white/[0.02] p-8 text-center">
            <p className="font-serif text-lg italic text-zinc-300">
              {activeFilter === "all"
                ? "No proposals yet."
                : `No proposals with status "${activeFilter}".`}
            </p>
            <p className="mt-2 text-[13px] text-zinc-500">
              {activeFilter === "all" ? (
                <>
                  Open{" "}
                  <Link
                    href={`/org/${orgId}/discovery`}
                    className="text-emerald-300 underline"
                  >
                    Discovery
                  </Link>{" "}
                  to pick an opportunity, then click "Generate first-pass draft."
                </>
              ) : (
                <>
                  Try{" "}
                  <Link
                    href={`/org/${orgId}/proposals`}
                    className="text-emerald-300 underline"
                  >
                    all
                  </Link>{" "}
                  to see other statuses.
                </>
              )}
            </p>
          </div>
        ) : (
          <ul className="mt-8 divide-y divide-zinc-900 overflow-hidden rounded-lg border border-zinc-900 bg-white/[0.02]">
            {rows.map((p) => {
              const status = (
                p.status === "draft" ||
                p.status === "submitted" ||
                p.status === "won" ||
                p.status === "lost" ||
                p.status === "withdrawn"
                  ? p.status
                  : "draft"
              ) as Status;
              return (
                <li key={p.id}>
                  <Link
                    href={`/org/${orgId}/proposals/${p.id}`}
                    className="flex items-center gap-4 px-5 py-4 transition hover:bg-white/[0.02]"
                  >
                    <span
                      className={`shrink-0 inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] ${STATUS_CHIP[status]}`}
                    >
                      {status}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[14px] text-zinc-100">
                        {p.title}
                      </div>
                      <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                        {p.due_date ? `due ${fmtDate(p.due_date)} · ` : ""}
                        updated {fmtRelative(p.updated_at)}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
