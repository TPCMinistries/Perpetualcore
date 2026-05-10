/**
 * /engine — the Perpetual Engine manifesto.
 *
 * Per COPY_ENGINE.md and UI_AUDIT.md §5.5 + §7: built new from primitives,
 * single column, max-w-3xl, prose-led, editorial weight. NOT card-grid.
 *
 * Six sections:
 *   1. Hero (text-only)
 *   2. The 8 registries — placeholder 8-node SVG diagram + 8 paragraphs
 *   3. The AI-First Framework (Learn → Wire → Automate → Scale)
 *   4. The skills library (technical seriousness, file-tree mock)
 *   5. The Engine commitment — 10% / $7,500–$25,000+ to IHA, the cap-table
 *      argument is the load-bearing differentiator
 *   6. Final CTA
 *
 * Sharpening levers from UI audit §5: font-semibold not font-black, ample
 * whitespace at section boundaries, mono-violet only (no gradients on
 * icons), max-w-3xl single column.
 */

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export const metadata = {
  title: "The Perpetual Engine — Perpetual Core",
  description:
    "The substrate behind every Perpetual Core install. Eight registries, the AI-First Framework, a compounding skills library, and 10–15% of every revenue dollar funding the Institute for Human Advancement.",
};

const REGISTRIES = [
  {
    name: "Entities",
    body: "Every organization, fund, partner, vendor, and counterparty your operation touches. Resolved, deduplicated, and queryable. The first thing your team stops re-typing into spreadsheets.",
  },
  {
    name: "People",
    body: "Staff, beneficiaries, volunteers, board members, students, members. Roles, relationships, consent state, and audit trail. Every person in your org has one record, not seventeen.",
  },
  {
    name: "Projects",
    body: "Programs, initiatives, grants, contracts, engagements — the work containers that hold budget, scope, and accountability. Tied to the entities funding them and the people doing them.",
  },
  {
    name: "Work items",
    body: "Tasks, deliverables, follow-ups. The thing your team thought was in Asana, Notion, three Slack channels, and a voice note from last Tuesday. Now in one registry, with provenance.",
  },
  {
    name: "Knowledge",
    body: "Documents, voice notes, calls, channels, embeddings. Synthesized into one queryable mind. This is the registry Vellum operates on directly — see /products/vellum.",
  },
  {
    name: "Agents",
    body: 'The AI workers your team has built and authorized. Each with a defined scope, audit log, and refusal rules. Not "AI" as a vibe — agents as a registered, accountable category of operator.',
  },
  {
    name: "Workflows",
    body: "Automated sequences across registries. Built in the AI-First Framework's Automate phase. Versioned, modifiable, owned by your team after handover.",
  },
  {
    name: "Events",
    body: 'Every state change, every approval, every refusal. The audit log that lets you answer "who did what when" six months later, in front of a regulator if it comes to that.',
  },
];

/**
 * Minimal 8-node registry diagram. Inline SVG, mono-violet primary tinted,
 * thin connecting lines. Placeholder for the proper canonical asset; per
 * Session-1 spec we ship the placeholder now and a designer hand can refine.
 */
function RegistryDiagram() {
  // 8 nodes arranged in a circle around a central hub.
  const radius = 130;
  const cx = 200;
  const cy = 200;
  const labels = REGISTRIES.map((r) => r.name);
  const points = labels.map((label, i) => {
    const angle = (i / labels.length) * Math.PI * 2 - Math.PI / 2;
    return {
      label,
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    };
  });

  return (
    <figure className="my-12">
      <svg
        viewBox="0 0 400 400"
        className="w-full max-w-md mx-auto"
        role="img"
        aria-label="Diagram showing the eight registries connected to a central operating model: Entities, People, Projects, Work items, Knowledge, Agents, Workflows, Events."
      >
        {/* Connecting lines from center to each node */}
        {points.map((p) => (
          <line
            key={`line-${p.label}`}
            x1={cx}
            y1={cy}
            x2={p.x}
            y2={p.y}
            stroke="currentColor"
            className="text-primary/30"
            strokeWidth="1"
          />
        ))}
        {/* Central hub */}
        <circle cx={cx} cy={cy} r="14" className="fill-primary" />
        <circle cx={cx} cy={cy} r="22" className="fill-none stroke-primary/40" strokeWidth="1" />
        {/* Outer nodes */}
        {points.map((p) => (
          <g key={`node-${p.label}`}>
            <circle
              cx={p.x}
              cy={p.y}
              r="8"
              className="fill-background stroke-primary"
              strokeWidth="1.5"
            />
            <text
              x={p.x}
              y={p.y - 16}
              textAnchor="middle"
              className="fill-current text-[11px] font-medium"
              style={{ fontFamily: "inherit" }}
            >
              {p.label}
            </text>
          </g>
        ))}
      </svg>
      <figcaption className="text-center text-sm text-muted-foreground mt-4">
        Eight registries. One operating model.
      </figcaption>
    </figure>
  );
}

export default function EnginePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <article className="container mx-auto px-4">
        {/* Section 1 — Hero */}
        <section className="max-w-3xl mx-auto pt-24 pb-24 sm:pt-32">
          <p className="text-sm italic text-muted-foreground tracking-wide mb-6">
            The Perpetual Engine.
          </p>
          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight leading-[1.1] mb-8">
            The substrate behind every Perpetual Core install.
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed mb-6">
            Eight registries. The AI-First Framework. A compounding skills library. And the commitment that 10 to 15% of every revenue dollar funds workforce development through the Institute for Human Advancement.
          </p>
          <p className="text-lg text-muted-foreground leading-relaxed mb-10">
            The Engine is what we install. Methodology, substrate, and impact, bundled. It&apos;s the reason a $75,000 engagement compounds — and the reason no joint venture can copy what we do.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild>
              <Link href="/studio/engagements">
                See engagements <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/studio/methodology">Read the methodology</Link>
            </Button>
          </div>
        </section>

        {/* Section 2 — The eight registries */}
        <section className="max-w-3xl mx-auto py-32 border-t border-border/40">
          <p className="text-sm italic text-muted-foreground tracking-wide mb-4">
            The substrate.
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight mb-6">
            Eight registries. One operating model.
          </h2>

          <RegistryDiagram />

          <div className="space-y-7 text-base leading-relaxed mt-12">
            {REGISTRIES.map((reg) => (
              <p key={reg.name}>
                <span className="font-semibold">{reg.name}.</span>{" "}
                <span className="text-muted-foreground">{reg.body}</span>
              </p>
            ))}
          </div>

          <div className="mt-12">
            <Button variant="outline" asChild>
              <Link href="/studio/methodology">
                Read the methodology <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        {/* Section 3 — AI-First Framework */}
        <section className="max-w-3xl mx-auto py-32 border-t border-border/40">
          <p className="text-sm italic text-muted-foreground tracking-wide mb-4">
            The methodology.
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight mb-6">
            Learn → Wire → Automate → Scale.
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed mb-8">
            Four phases. None skipped.
          </p>

          <div className="space-y-6 text-base leading-relaxed">
            <p>
              <span className="font-semibold">Learn.</span>{" "}
              <span className="text-muted-foreground">
                Two weeks of operator-grade reading. Calls, docs, voice notes, channels. We don&apos;t ask you to fill out an intake form. We sit in the meetings.
              </span>
            </p>
            <p>
              <span className="font-semibold">Wire.</span>{" "}
              <span className="text-muted-foreground">
                Three to four weeks. The eight registries get installed in your stack — your Supabase, your storage, your auth. Your operators are querying live data by week 5.
              </span>
            </p>
            <p>
              <span className="font-semibold">Automate.</span>{" "}
              <span className="text-muted-foreground">
                Six to ten weeks. Skills get built against your real workflows. Anthropic SKILL.md format, per-portco JSON. Versioned, auditable, owned by you.
              </span>
            </p>
            <p>
              <span className="font-semibold">Scale.</span>{" "}
              <span className="text-muted-foreground">
                Two to four weeks. Your team operates and extends the system. We document. We train. We hand over.
              </span>
            </p>
          </div>

          <p className="text-lg text-muted-foreground leading-relaxed mt-10">
            This is the same arc on every engagement, scaled to the band. The four phases don&apos;t shift — what shifts is how many departments and how many skills.
          </p>

          <div className="mt-10">
            <Button variant="outline" asChild>
              <Link href="/studio/process">
                See the engagement arc <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        {/* Section 4 — Skills library */}
        <section className="max-w-3xl mx-auto py-32 border-t border-border/40">
          <p className="text-sm italic text-muted-foreground tracking-wide mb-4">
            The compounding asset.
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight mb-8">
            Skills, in the Anthropic SKILL.md format.
          </h2>

          <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
            <p>
              Every skill we build is a versioned, auditable unit of automated work. Written in the Anthropic SKILL.md format — markdown frontmatter, prose body, optional code blocks — with a per-portco JSON config that scopes it to your operating context.
            </p>
            <p>
              Your operators can read every skill. Audit it. Modify it. Add to it. There are no black boxes in your skills library, because the moment a black box appears, your team stops trusting the system, and the system stops being yours.
            </p>
          </div>

          {/* File-tree mock — signals technical seriousness */}
          <pre className="my-10 p-6 rounded-lg bg-muted/50 border border-border/60 text-sm font-mono text-muted-foreground overflow-x-auto">
{`skills/
├── intake-triage.skill.md
├── grant-status-rollup.skill.md
├── case-handoff.skill.md
├── donor-thanks-draft.skill.md
├── compliance-flag-check.skill.md
└── config.portco.json`}
          </pre>

          <div className="space-y-5 text-lg text-muted-foreground leading-relaxed">
            <p>
              By the time you finish an Operations engagement, you have 15 to 30 production skills. By the time you finish an Institutional engagement, you have a library that outlives the engagement.
            </p>
            <p>
              This is the compounding part. Every engagement we run adds skills back to the library. Your operators inherit work we did at other organizations under the same constraint regime — pre-vetted, pre-tested, ready to adapt.
            </p>
          </div>

          <div className="mt-10">
            <Button variant="outline" asChild>
              <Link href="/studio/engagements">
                See engagements <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        {/* Section 5 — The Engine commitment (load-bearing differentiator) */}
        <section className="max-w-3xl mx-auto py-32 border-t border-border/40">
          <p className="text-sm italic text-muted-foreground tracking-wide mb-4">
            The mission.
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight mb-10">
            10% of every engagement — $7,500 to $25,000+ per client — funds the Institute for Human Advancement.
          </h2>

          <div className="space-y-6 text-lg text-muted-foreground leading-relaxed mb-10">
            <p>
              The Institute for Human Advancement is our 501(c)(3) parent. It runs workforce development for low-income New Yorkers, healthcare-pathway training in community-college workforce programs, and field health work in East Africa. The studio exists to fund the mission — not the other way around.
            </p>
            <p className="text-foreground">Here&apos;s what flows where:</p>
          </div>

          <div className="my-10 border border-border/60 rounded-lg overflow-hidden">
            <table className="w-full text-base">
              <thead className="bg-muted/40 border-b border-border/60">
                <tr>
                  <th className="text-left p-4 font-semibold">Surface</th>
                  <th className="text-left p-4 font-semibold">% to the Institute for Human Advancement</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/40">
                  <td className="p-4 font-medium">Engagements</td>
                  <td className="p-4 text-muted-foreground">10% ($7,500–$25,000+ per client)</td>
                </tr>
                <tr className="border-b border-border/40">
                  <td className="p-4 font-medium">Sage SaaS</td>
                  <td className="p-4 text-muted-foreground">15% (per Sage PRD v0.3)</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">All other products and Platform</td>
                  <td className="p-4 text-muted-foreground">10% default</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
            <p>
              The mixed rate is intentional. Sage carries 15% because Sage is positioned as an owned-perpetual-asset for individual operators, and the higher rate is part of its differentiation. Engagements stay at 10% to keep the math defensible at scale. Either way, the floor is non-negotiable.
            </p>

            <p className="text-2xl font-semibold text-foreground my-10 leading-tight">
              This is structurally non-replicable.
            </p>

            <p>
              No VC-backed competitor can give away 10 to 15% of top-line revenue. Their cap table won&apos;t allow it. No JV can either; their LPs won&apos;t either. The Anthropic-Blackstone venture, the OpenAI-TPG venture, EPAM&apos;s 250 Black Belts, every Big-4 AI practice — none of them can do this. It is the one moat we have that does not depend on technology.
            </p>

            <p>
              It is also why a foundation program officer, a faith-institution executive director, or a UN-agency operations director can put us through procurement without explaining to their board why they hired a vendor whose entire margin compounds inside the same investor class they&apos;re trying to escape.
            </p>

            <p>
              The Institute for Human Advancement is audited annually. The contribution is line-itemed on every invoice. We don&apos;t bury this in a footer.
            </p>
          </div>

          <div className="mt-12 flex flex-col sm:flex-row gap-3">
            <Button asChild>
              <a href="https://theiha.org" target="_blank" rel="noopener noreferrer">
                About the Institute for Human Advancement <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/about">About the founder</Link>
            </Button>
          </div>
        </section>

        {/* Section 6 — Final CTA */}
        <section className="max-w-3xl mx-auto py-32 border-t border-border/40">
          <p className="text-sm italic text-muted-foreground tracking-wide mb-4">
            When you&apos;re ready.
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight mb-6">
            The Engine is what we install.
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed mb-10">
            A 90 to 180 day engagement. A system your team owns. A funding flow that compounds inside the mission, not the cap table.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button size="lg" asChild className="text-base px-7">
              <Link href="/studio/engagements">
                See engagements <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base px-7">
              <Link href="/studio/methodology">Read the methodology</Link>
            </Button>
          </div>
        </section>
      </article>

      <Footer />
    </div>
  );
}
