/**
 * Proposal view — read-only v1.
 *
 * Renders the five drafted sections from rfp_proposal_sections plus the
 * audit metadata from rfp_agent_sessions (model, tokens, cost). Honest
 * scaffolding: no inline editing yet, no version diffing, no reviewer
 * pass. Phase 6 (editing) and Phase 7 (reviewer + voice fingerprint) will
 * layer on top of this view.
 *
 * Auth: createClient → RLS-scoped. If the caller is not a member of the
 * org the proposal belongs to, every join returns null and we render the
 * "not found" state, matching the /api/rfp/opps/[id] privacy pattern.
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SECTION_SPECS, SECTION_TYPES, type SectionType } from "@/lib/rfp/draft/sections";

interface ProposalRow {
  id: string;
  title: string;
  status: string;
  due_date: string | null;
  opp_id: string | null;
  created_at: string;
}

interface SectionRow {
  section_type: string;
  content: string | null;
  version: number;
  last_drafted_by_agent_at: string | null;
}

interface AgentSessionRow {
  agent: string;
  model: string | null;
  tokens_in: number | null;
  tokens_out: number | null;
  cost_usd: number | string | null;
  created_at: string;
}

function fmtCost(c: number | string | null): string {
  if (c === null || c === undefined) return "—";
  const n = typeof c === "string" ? parseFloat(c) : c;
  if (Number.isNaN(n)) return "—";
  if (n < 0.01) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(2)}`;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function ProposalPage({
  params,
}: {
  params: Promise<{ orgId: string; proposalId: string }>;
}) {
  const { orgId, proposalId } = await params;
  const supabase = await createClient();
  // rfp_* tables not in generated database.types.ts — see lib/rfp/orgs.ts
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sbAny = supabase as any;

  const proposalQuery = await sbAny
    .from("rfp_proposals")
    .select("id, title, status, due_date, opp_id, created_at")
    .eq("id", proposalId)
    .eq("org_id", orgId)
    .maybeSingle();
  const proposal = proposalQuery.data as ProposalRow | null;
  if (!proposal) notFound();

  const sectionsQuery = await sbAny
    .from("rfp_proposal_sections")
    .select("section_type, content, version, last_drafted_by_agent_at")
    .eq("proposal_id", proposalId)
    .order("section_type");
  const sections = sectionsQuery.data as SectionRow[] | null;

  const sessionQuery = await sbAny
    .from("rfp_agent_sessions")
    .select("agent, model, tokens_in, tokens_out, cost_usd, created_at")
    .eq("proposal_id", proposalId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const session = sessionQuery.data as AgentSessionRow | null;

  const sectionByType = new Map<string, SectionRow>(
    (sections ?? []).map((s) => [s.section_type, s]),
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-3xl px-6 py-12">
        {/* Breadcrumb */}
        <Link
          href={`/org/${orgId}/discovery`}
          className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500 hover:text-zinc-300"
        >
          ← Discovery
        </Link>

        {/* Eyebrow */}
        <div className="mt-6 font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500">
          Proposal · {proposal.status} · drafted {fmtDate(proposal.created_at)}
          {proposal.due_date ? ` · due ${fmtDate(proposal.due_date)}` : ""}
        </div>

        <h1
          className="mt-3 text-3xl leading-tight italic text-zinc-100"
          style={{ fontFamily: "Georgia, serif" }}
        >
          {proposal.title}
        </h1>

        {/* Honesty banner — preview drafter, no voice/vault yet */}
        <div className="mt-6 rounded-md border border-amber-500/30 bg-amber-500/5 p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-amber-300">
            First-pass draft · preview
          </p>
          <p className="mt-2 text-sm text-zinc-300">
            This is a plain first pass — no voice fingerprint, no vault
            grounding, no reviewer agent yet. Treat every [VERIFY: …] marker
            as a placeholder you need to confirm or replace. Voice training
            and the reviewer agent ship in the next phase.
          </p>
        </div>

        {/* Audit row */}
        {session ? (
          <div className="mt-6 grid grid-cols-2 gap-4 rounded-md border border-zinc-900 bg-zinc-950 p-4 font-mono text-[11px] text-zinc-400 sm:grid-cols-4">
            <div>
              <div className="text-[9px] uppercase tracking-[0.22em] text-zinc-600">
                Agent
              </div>
              <div className="mt-1 text-zinc-200">{session.agent}</div>
            </div>
            <div>
              <div className="text-[9px] uppercase tracking-[0.22em] text-zinc-600">
                Model
              </div>
              <div className="mt-1 text-zinc-200">{session.model ?? "—"}</div>
            </div>
            <div>
              <div className="text-[9px] uppercase tracking-[0.22em] text-zinc-600">
                Tokens
              </div>
              <div className="mt-1 text-zinc-200">
                {session.tokens_in ?? "—"} in · {session.tokens_out ?? "—"} out
              </div>
            </div>
            <div>
              <div className="text-[9px] uppercase tracking-[0.22em] text-zinc-600">
                Cost
              </div>
              <div className="mt-1 text-zinc-200">{fmtCost(session.cost_usd)}</div>
            </div>
          </div>
        ) : null}

        {/* Sections in canonical order */}
        <div className="mt-10 space-y-10">
          {SECTION_TYPES.map((type: SectionType) => {
            const sec = sectionByType.get(type);
            const spec = SECTION_SPECS[type];
            return (
              <section key={type}>
                <h2 className="font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500">
                  {spec.label}
                </h2>
                {sec?.content ? (
                  <div className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-zinc-200">
                    {sec.content}
                  </div>
                ) : (
                  <p className="mt-3 italic text-zinc-500">
                    No content generated for this section.
                  </p>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
