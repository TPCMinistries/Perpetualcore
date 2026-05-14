/**
 * /engine — the Perpetual Engine manifesto (arm 05 of the company).
 *
 * Six sections: hero · 8 registries · AI-First Framework · skills library ·
 * commitment · CTA. Visual register matches homepage v5: display serif h1,
 * §-numbered rails, mono labels, hairline tables.
 */

import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export const metadata = {
  title: "The Perpetual Engine — A structural standard for AI ventures",
  description:
    "A published structural standard for AI-native ventures: eight registries, the AI-First Framework, a compounding skills library, and a 10–15% revenue commitment to mission. Perpetual Core is the reference implementation. The spec is open to adopt.",
};

const REGISTRIES = [
  { name: "Entities", body: "Every organization, fund, partner, vendor, and counterparty your operation touches. Resolved, deduplicated, queryable. The first thing your team stops re-typing into spreadsheets." },
  { name: "People", body: "Staff, beneficiaries, volunteers, board, students, members. Roles, relationships, consent state, audit trail. Every person in your org has one record, not seventeen." },
  { name: "Projects", body: "Programs, initiatives, grants, contracts, engagements — the work containers that hold budget, scope, accountability. Tied to entities funding them and people doing them." },
  { name: "Work items", body: "Tasks, deliverables, follow-ups. The things your team thought were in Asana, Notion, three Slack channels, and a voice note from last Tuesday. Now in one registry, with provenance." },
  { name: "Knowledge", body: "Documents, voice notes, calls, channels, embeddings. Synthesized into one queryable mind. The registry Vellum operates on directly." },
  { name: "Agents", body: 'The AI workers your team has built and authorized. Each with a defined scope, audit log, refusal rules. Not "AI" as a vibe — agents as a registered, accountable category of operator.' },
  { name: "Workflows", body: "Automated sequences across registries. Built in the AI-First Framework's Automate phase. Versioned, modifiable, owned by your team after handover." },
  { name: "Events", body: 'Every state change, every approval, every refusal. The audit log that lets you answer "who did what when" six months later, in front of a regulator if it comes to that.' },
];

const GIVING_ROWS = [
  { surface: "Engagements", pct: "10%", note: "$7,500–$25,000+ per client" },
  { surface: "Sage SaaS", pct: "15%", note: "Per Sage PRD v0.3" },
  { surface: "All other products + Platform", pct: "10%", note: "Default" },
];

function SectionRail({ index, label }: { index: string; label: string }) {
  return (
    <div>
      <p className="eyebrow mb-3">§ {index}</p>
      <h2 className="text-xs uppercase tracking-[0.18em] font-mono text-foreground">{label}</h2>
    </div>
  );
}

function RegistryDiagram() {
  const radius = 130;
  const cx = 200;
  const cy = 200;
  const points = REGISTRIES.map((r, i) => {
    const angle = (i / REGISTRIES.length) * Math.PI * 2 - Math.PI / 2;
    return {
      label: r.name,
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    };
  });

  return (
    <figure className="my-14">
      <svg
        viewBox="0 0 400 400"
        className="w-full max-w-lg mx-auto"
        role="img"
        aria-label="Eight registries connected to one central operating model."
      >
        {points.map((p) => (
          <line
            key={`l-${p.label}`}
            x1={cx}
            y1={cy}
            x2={p.x}
            y2={p.y}
            stroke="currentColor"
            className="text-foreground/20"
            strokeWidth="1"
          />
        ))}
        <rect x={cx - 24} y={cy - 24} width="48" height="48" className="fill-foreground" />
        <rect
          x={cx - 32}
          y={cy - 32}
          width="64"
          height="64"
          className="fill-none stroke-foreground/30"
          strokeWidth="1"
        />
        {points.map((p) => (
          <g key={`n-${p.label}`}>
            <rect
              x={p.x - 6}
              y={p.y - 6}
              width="12"
              height="12"
              className="fill-background stroke-foreground"
              strokeWidth="1.5"
            />
            <text
              x={p.x}
              y={p.y - 16}
              textAnchor="middle"
              className="fill-current text-[10px] font-mono uppercase tracking-[0.12em]"
              style={{ fontFamily: "var(--font-mono), monospace" }}
            >
              {p.label}
            </text>
          </g>
        ))}
      </svg>
      <figcaption className="text-center font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mt-2">
        Eight registries · one operating model
      </figcaption>
    </figure>
  );
}

export default function EnginePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="container mx-auto px-6 sm:px-8 pt-20 pb-20 sm:pt-28 sm:pb-28">
        <div className="max-w-5xl">
          <div className="flex items-center gap-3 mb-12">
            <span aria-hidden className="block h-1.5 w-1.5 bg-foreground" />
            <p className="eyebrow !text-foreground/70">§ 05 · The Engine</p>
          </div>

          <h1 className="display-hero text-[40px] sm:text-[56px] lg:text-[76px] text-foreground mb-12 max-w-5xl leading-[1.05]">
            A structural standard for{" "}
            <span className="italic text-foreground/85">AI-native ventures.</span>
          </h1>

          <div className="space-y-5 text-lg sm:text-xl text-muted-foreground leading-[1.55] mb-12 max-w-3xl">
            <p>
              Eight registries. The AI-First Framework. A compounding skills library. The
              commitment that 10–15% of every revenue dollar funds the{" "}
              <a
                href="https://theiha.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline underline-offset-4"
              >
                Institute for Human Advancement
              </a>
              . Bundled as one specification any AI venture can adopt.
            </p>
            <p>
              The Engine is what Perpetual Core installs — and what we&apos;re publishing as a
              standard. The reference implementation runs this company. The spec is open to
              anyone building the next one.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start gap-4">
            <Button
              size="lg"
              asChild
              className="text-sm font-medium px-7 h-11 shadow-none bg-foreground text-background hover:bg-foreground/90 rounded-[6px]"
            >
              <Link href="/studio/engagements">
                See engagements <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Link
              href="/studio/methodology"
              className="inline-flex items-center text-sm font-medium text-foreground hover:text-primary transition-colors py-3 border-b border-foreground/20 hover:border-primary"
            >
              Read the methodology <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Registries */}
      <section className="border-t border-border py-24 sm:py-32 bg-surface-hover/40">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 mb-8">
            <SectionRail index="01" label="The substrate" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-6">
                Eight registries. One operating model.
              </h3>
            </div>
          </div>

          <div className="max-w-4xl mx-auto">
            <RegistryDiagram />
          </div>

          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 mt-12">
            <div />
            <div className="max-w-2xl border-t border-border">
              {REGISTRIES.map((reg, i) => (
                <div
                  key={reg.name}
                  className="grid grid-cols-[60px_140px_1fr] gap-6 py-6 border-b border-border items-baseline"
                >
                  <span className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground pt-1">
                    0{i + 1}
                  </span>
                  <h4 className="text-base font-semibold tracking-tight text-foreground">
                    {reg.name}.
                  </h4>
                  <p className="text-sm text-muted-foreground leading-[1.6] col-span-3 sm:col-auto">
                    {reg.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* AI-First Framework */}
      <section className="border-t border-border py-24 sm:py-32">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 mb-12">
            <SectionRail index="02" label="The Framework" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-6">
                Learn → Wire → Automate → Scale.
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7]">
                Four phases. None skipped. The same arc on every engagement, scaled to the band.
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <div />
            <div className="max-w-2xl space-y-7 text-base leading-[1.7]">
              <p>
                <span className="font-semibold text-foreground">Learn.</span>{" "}
                <span className="text-muted-foreground">
                  Two weeks of operator-grade reading. Calls, docs, voice notes, channels.
                  We don&apos;t ask for an intake form. We sit in the meetings.
                </span>
              </p>
              <p>
                <span className="font-semibold text-foreground">Wire.</span>{" "}
                <span className="text-muted-foreground">
                  Three to four weeks. The eight registries get installed in your stack —
                  Supabase, storage, auth. Operators are querying live data by week 5.
                </span>
              </p>
              <p>
                <span className="font-semibold text-foreground">Automate.</span>{" "}
                <span className="text-muted-foreground">
                  Six to ten weeks. Skills built against your real workflows.
                  Anthropic SKILL.md format, per-portco JSON. Versioned, auditable, owned by you.
                </span>
              </p>
              <p>
                <span className="font-semibold text-foreground">Scale.</span>{" "}
                <span className="text-muted-foreground">
                  Two to four weeks. Your team operates and extends the system.
                  We document, train, hand over.
                </span>
              </p>

              <div className="pt-6">
                <Link
                  href="/studio/process"
                  className="inline-flex items-center text-sm font-medium text-foreground hover:text-primary transition-colors"
                >
                  See the engagement arc <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Skills library */}
      <section className="border-t border-border py-24 sm:py-32 bg-surface-hover/40">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 mb-10">
            <SectionRail index="03" label="The compounding asset" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-8">
                Skills, in the Anthropic SKILL.md format.
              </h3>
              <div className="space-y-5 text-base text-muted-foreground leading-[1.7]">
                <p>
                  Every skill we build is a versioned, auditable unit of automated work.
                  Markdown frontmatter, prose body, optional code blocks — with a per-portco JSON
                  config that scopes it to your operating context.
                </p>
                <p>
                  Your operators can read every skill. Audit it. Modify it. Add to it. No black
                  boxes in your skills library — the moment a black box appears, your team
                  stops trusting the system, and the system stops being yours.
                </p>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <div />
            <div className="max-w-2xl">
              <pre className="my-2 p-6 bg-card border border-border text-sm font-mono text-muted-foreground overflow-x-auto rounded-[6px]">
{`skills/
├── intake-triage.skill.md
├── grant-status-rollup.skill.md
├── case-handoff.skill.md
├── donor-thanks-draft.skill.md
├── compliance-flag-check.skill.md
└── config.portco.json`}
              </pre>

              <div className="mt-10 space-y-5 text-base text-muted-foreground leading-[1.7]">
                <p>
                  By the end of an Operations engagement: 15–30 production skills. By the end of
                  an Institutional engagement: a library that outlives the engagement.
                </p>
                <p>
                  This is the compounding part. Every engagement we run adds skills back to the
                  library. Your operators inherit work we did at other organizations under the
                  same constraint regime — pre-vetted, pre-tested, ready to adapt.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Engine commitment — dark block with grain */}
      <section
        className="relative py-24 sm:py-32 text-white overflow-hidden"
        style={{ backgroundColor: "hsl(var(--surface-dark))" }}
      >
        <div className="grain" />
        <div className="relative container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <div>
              <p className="eyebrow !text-white/40 mb-3">§ 04</p>
              <h2 className="text-xs uppercase tracking-[0.18em] font-mono text-white">
                The Commitment
              </h2>
            </div>
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-white mb-12">
                10–15% of every revenue dollar funds the{" "}
                <a
                  href="https://theiha.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4 decoration-white/40 hover:decoration-white"
                >
                  Institute for Human Advancement
                </a>
                .
              </h3>

              <div className="space-y-5 text-base text-white/65 leading-[1.7] mb-10">
                <p>
                  The Institute for Human Advancement is our 501(c)(3) parent. It runs workforce
                  development for low-income New Yorkers, healthcare-pathway training in
                  community-college workforce programs, AI-native founder training across emerging
                  markets, and field health work in East Africa. The company exists to fund the
                  mission.
                </p>
                <p className="text-white font-medium">Here&apos;s what flows where.</p>
              </div>

              {/* Giving table */}
              <div className="border border-white/15 mb-10">
                <div className="grid grid-cols-[1fr_120px] sm:grid-cols-[1fr_120px_180px] py-4 px-5 border-b border-white/15 font-mono text-[10px] uppercase tracking-[0.18em] text-white/50">
                  <span>Surface</span>
                  <span>% to IHA</span>
                  <span className="hidden sm:block">Note</span>
                </div>
                {GIVING_ROWS.map((row) => (
                  <div
                    key={row.surface}
                    className="grid grid-cols-[1fr_120px] sm:grid-cols-[1fr_120px_180px] py-5 px-5 border-b border-white/10 last:border-b-0 items-baseline"
                  >
                    <span className="text-white text-base font-medium">{row.surface}</span>
                    <span className="text-white text-base font-semibold">{row.pct}</span>
                    <span className="hidden sm:block font-mono text-[11px] text-white/55">
                      {row.note}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-5 text-base text-white/65 leading-[1.7] mb-10">
                <p>
                  The mixed rate is intentional. Sage carries 15% because it&apos;s positioned as
                  an owned-perpetual-asset for individual operators. Engagements stay at 10% to
                  keep the math defensible at scale. The floor is non-negotiable.
                </p>
                <p className="text-white font-medium text-xl pt-4">
                  A high structural bar — not a moat.
                </p>
                <p>
                  VC-backed AI companies struggle to clear it; their cap tables resist double-digit
                  revenue commitments to a 501(c)(3). JVs face the same constraint from their LPs.
                  The Anthropic-Blackstone venture, the OpenAI-TPG venture, EPAM&apos;s Black Belts,
                  the Big-4 AI practices — the structure is hard for them. It isn&apos;t hard for
                  AI-native ventures built this way from day one.
                </p>
                <p>
                  This is the part we want to make easier. The spec is published. The methodology
                  is open. The math is named. If you&apos;re structuring a new AI venture and want
                  to bake this in from the cap-table stage, the Engine is yours to adopt.
                </p>
                <p>
                  Our books are audited annually. Every invoice line-items the contribution.
                  Imitation is the goal — we&apos;re building the reference, not the only one.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-start gap-5">
                <Button
                  asChild
                  className="text-sm font-medium h-10 px-5 shadow-none bg-white text-foreground hover:bg-white/90 rounded-[6px]"
                >
                  <a href="https://theiha.org" target="_blank" rel="noopener noreferrer">
                    Visit the Institute <ArrowUpRight className="ml-2 h-3.5 w-3.5" />
                  </a>
                </Button>
                <Link
                  href="/about"
                  className="inline-flex items-center text-sm font-medium text-white/60 hover:text-white transition-colors py-2"
                >
                  About the founder <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Open invitation to adopt */}
      <section className="border-t border-border py-24 sm:py-32">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 mb-12">
            <SectionRail index="05" label="Open invitation" />
            <div className="max-w-2xl">
              <h3 className="display-hero text-3xl sm:text-4xl lg:text-[52px] text-foreground mb-8 leading-[1.05]">
                The Engine is meant to be{" "}
                <span className="italic">adopted.</span>
              </h3>
              <p className="text-base sm:text-lg text-muted-foreground leading-[1.7]">
                If you&apos;re founding an AI venture and want to structure it the same way —
                registry-first substrate, AI-First methodology, operator-owned skills, and a
                structural giving floor — start with the spec on this page. We&apos;ll point you
                at the reference implementation. Email the founder when you&apos;re ready to
                compare notes.
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <div />
            <div className="max-w-2xl flex flex-col sm:flex-row items-start gap-5">
              <Button
                size="lg"
                asChild
                className="text-sm font-medium h-11 px-7 shadow-none bg-foreground text-background hover:bg-foreground/90 rounded-[6px]"
              >
                <a href="mailto:lorenzo@perpetualcore.com?subject=Adopting%20the%20Engine">
                  Email the founder <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Link
                href="/studio/methodology"
                className="inline-flex items-center text-sm font-medium text-foreground hover:text-primary transition-colors py-3 border-b border-foreground/20 hover:border-primary"
              >
                Read the methodology <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Install (for orgs who want the reference implementation installed) */}
      <section className="border-t border-border py-24 sm:py-32 bg-surface-hover/40">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <SectionRail index="—" label="Install" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-6">
                Or have us install the reference implementation in your stack.
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7] mb-10">
                A 90–180 day engagement installs the Engine inside your organization. A system your
                team owns. A funding flow that compounds inside the mission, not the cap table.
              </p>
              <div className="flex flex-col sm:flex-row items-start gap-5">
                <Button
                  size="lg"
                  asChild
                  className="text-sm font-medium h-11 px-7 shadow-none bg-foreground text-background hover:bg-foreground/90 rounded-[6px]"
                >
                  <Link href="/studio/engagements">
                    See engagements <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Link
                  href="/studio/methodology"
                  className="inline-flex items-center text-sm font-medium text-foreground hover:text-primary transition-colors py-3"
                >
                  Read the methodology <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
