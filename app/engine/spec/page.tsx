/**
 * /engine/spec — The Perpetual Engine, v1.0
 *
 * A formal, versioned standard document. Designed to be citable, adoptable,
 * and conformance-checkable. Modeled after Anthropic's Responsible Scaling
 * Policy and B Corp's assessment framework — not marketing copy.
 *
 * This is the canonical reference for anyone adopting the standard.
 */

import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export const metadata = {
  title: "The Perpetual Engine — Specification v1.0",
  description:
    "The Perpetual Engine, v1.0. A structural standard for AI-native ventures: eight registries, the AI-First Framework, a 10–15% mission-funding floor, and adoption criteria for conforming implementations.",
};

const REGISTRIES = [
  { name: "Entities", schema: "{ id, name, type, jurisdiction, parent_id, audit_ref }" },
  { name: "People", schema: "{ id, name, role[], org_id, consent_state, contact[], audit_ref }" },
  { name: "Projects", schema: "{ id, name, parent_id, budget, start, end, owner_id, audit_ref }" },
  { name: "Work items", schema: "{ id, project_id, type, status, assignee_id, due, audit_ref }" },
  { name: "Knowledge", schema: "{ id, source[], embedding_ref, kind, retention, audit_ref }" },
  { name: "Agents", schema: "{ id, scope, model, refusal_rules, owner_id, audit_log_id }" },
  { name: "Workflows", schema: "{ id, steps[], triggers[], version, owner_id, audit_log_id }" },
  { name: "Events", schema: "{ id, actor, action, object, ts, prev_hash, audit_ref }" },
];

const PHASES = [
  { step: "Learn", body: "Operator-grade reading of the host organization. Minimum 2 weeks. No intake forms — sit in the meetings." },
  { step: "Wire", body: "Install the 8 registries in the host's storage. Migrate existing data. Minimum 3 weeks." },
  { step: "Automate", body: "Build skills against real workflows. SKILL.md format, per-org JSON config. Versioned, auditable." },
  { step: "Scale", body: "Hand over operation. Documentation, training, and transfer of ownership to the host's team." },
];

const ADOPTION = [
  { criterion: "Registry-first substrate", body: "The 8 registries are installed and operated as the single source of truth across the venture's operations. No critical data lives outside them." },
  { criterion: "AI-First Framework discipline", body: "Every AI capability built into the venture follows the Learn → Wire → Automate → Scale arc. No phases skipped." },
  { criterion: "SKILL.md skills library", body: "Skills are versioned, auditable units in markdown frontmatter + JSON config. No proprietary opaque skill formats." },
  { criterion: "Structural mission floor", body: "10–15% of top-line revenue across every product, engagement, and subscription flows to a 501(c)(3) parent or equivalent legal entity. Audited annually. Line-itemed on every invoice." },
  { criterion: "Operator ownership of installs", body: "Engagement-style installs end with documentation, training, and transfer. The host organization owns the system after handover. No vendor lock-in." },
  { criterion: "Public disclosure of compliance", body: "Conforming implementations publicly state their conformance level (Engine-aligned / Engine-conforming) and link to their audited reports." },
];

const CONFORMING = [
  {
    name: "Perpetual Core",
    role: "Reference implementation",
    status: "Conforming — v1.0",
    href: "/",
  },
];

const FIELD_OPS = [
  {
    name: "Uplift Communities",
    role: "Field operations — Institute operating arm",
    note: "Workforce + community programs (NY). Reference operations site where the Engine substrate is operated under live regulatory constraint (HIPAA, FERPA, multi-agency reporting). The methodology is stress-tested here before client install.",
    href: "/institute",
  },
];

function SectionRail({ index, label }: { index: string; label: string }) {
  return (
    <div>
      <p className="eyebrow mb-3">§ {index}</p>
      <h2 className="text-xs uppercase tracking-[0.18em] font-mono text-foreground">{label}</h2>
    </div>
  );
}

export default function EngineSpecPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero — document header */}
      <section className="container mx-auto px-6 sm:px-8 pt-20 pb-20 sm:pt-28 sm:pb-20">
        <div className="max-w-5xl">
          <div className="flex items-center gap-3 mb-12">
            <span aria-hidden className="block h-1.5 w-1.5 bg-foreground" />
            <p className="eyebrow !text-foreground/70">Specification · v1.0</p>
          </div>

          <h1 className="display-hero text-[40px] sm:text-[56px] lg:text-[80px] text-foreground mb-12 max-w-5xl leading-[1.05]">
            The Perpetual Engine.
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground leading-[1.55] mb-12 max-w-3xl">
            A structural standard for AI-native ventures. This document defines the registries,
            the methodology, the giving substrate, and the adoption criteria. The standard is open.
            Anyone may adopt it. The reference implementation is{" "}
            <Link href="/" className="text-foreground underline underline-offset-4 hover:text-primary">
              Perpetual Core
            </Link>
            .
          </p>

          {/* Document metadata bar */}
          <div className="border-t border-b border-border py-5 mb-12">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground mb-1.5">Version</p>
                <p className="text-sm font-semibold tracking-tight text-foreground">v1.0</p>
              </div>
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground mb-1.5">Status</p>
                <p className="text-sm font-semibold tracking-tight text-foreground inline-flex items-center gap-2">
                  <span aria-hidden className="block h-1.5 w-1.5 rounded-full bg-status-live animate-pulse-dot" />
                  Published
                </p>
              </div>
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground mb-1.5">Conforming impls</p>
                <p className="text-sm font-semibold tracking-tight text-foreground">1</p>
              </div>
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground mb-1.5">License</p>
                <p className="text-sm font-semibold tracking-tight text-foreground">Open · CC BY 4.0</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start gap-4">
            <Button asChild className="text-sm font-medium px-7 h-11 shadow-none bg-foreground text-background hover:bg-foreground/90 rounded-[6px]">
              <a href="mailto:lorenzo@perpetualcore.com?subject=Adopting%20the%20Engine%20spec">
                Declare adoption <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Link href="/engine" className="inline-flex items-center text-sm font-medium text-foreground hover:text-primary transition-colors py-3 border-b border-foreground/20 hover:border-primary">
              Read the manifesto <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* § 1 — Purpose */}
      <section className="border-t border-border py-20 sm:py-24 bg-surface-hover/40">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <SectionRail index="1" label="Purpose" />
            <div className="max-w-2xl">
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-semibold leading-[1.15] tracking-[-0.02em] text-foreground mb-8">
                What the Engine specifies, and why it exists.
              </h3>
              <div className="space-y-5 text-base text-muted-foreground leading-[1.7]">
                <p>
                  The Perpetual Engine is a structural standard for AI-native ventures — a way to
                  build a company so that its operations, methodology, and mission funding are
                  bundled into one substrate.
                </p>
                <p>
                  AI ventures built on the Engine commit to operator-owned data, an open
                  methodology, and a structural giving floor that funds an aligned mission entity.
                  The standard exists so this structure can be adopted by anyone — not as
                  competitive moat for one company.
                </p>
                <p className="text-foreground font-medium">
                  Imitation is the goal. The reference implementation is the contribution.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* § 2 — The Eight Registries */}
      <section className="border-t border-border py-20 sm:py-24">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 mb-12">
            <SectionRail index="2" label="Registries" />
            <div className="max-w-2xl">
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-semibold leading-[1.15] tracking-[-0.02em] text-foreground mb-6">
                Eight registries are the substrate.
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7]">
                Every conforming implementation MUST install the eight registries below as the
                single source of truth across the venture&apos;s operations. Field-level extensions
                are permitted; the core schemas are reserved.
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <div />
            <div className="max-w-3xl border-t border-border">
              {REGISTRIES.map((reg, i) => (
                <div key={reg.name} className="grid grid-cols-[60px_180px_1fr] gap-6 py-5 border-b border-border items-baseline">
                  <span className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground pt-1">
                    2.{i + 1}
                  </span>
                  <h4 className="text-base font-semibold tracking-tight text-foreground">
                    {reg.name}
                  </h4>
                  <pre className="font-mono text-[11px] text-muted-foreground leading-[1.6] overflow-x-auto col-span-3 sm:col-auto">
                    {reg.schema}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* § 3 — AI-First Framework */}
      <section className="border-t border-border py-20 sm:py-24 bg-surface-hover/40">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 mb-12">
            <SectionRail index="3" label="Framework" />
            <div className="max-w-2xl">
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-semibold leading-[1.15] tracking-[-0.02em] text-foreground mb-6">
                The Learn → Wire → Automate → Scale arc.
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7]">
                Every AI capability the venture builds — internally or for clients — MUST follow
                this four-phase arc. Phases MAY overlap; none MAY be skipped.
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <div />
            <div className="max-w-3xl border-t border-border">
              {PHASES.map((p, i) => (
                <div key={p.step} className="grid grid-cols-[60px_140px_1fr] gap-6 py-5 border-b border-border items-baseline">
                  <span className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground pt-1">
                    3.{i + 1}
                  </span>
                  <h4 className="text-base font-semibold tracking-tight text-foreground">
                    {p.step}.
                  </h4>
                  <p className="text-sm text-muted-foreground leading-[1.65] col-span-3 sm:col-auto">
                    {p.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* § 4 — Giving Math */}
      <section className="border-t border-border py-20 sm:py-24">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <SectionRail index="4" label="Giving" />
            <div className="max-w-2xl">
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-semibold leading-[1.15] tracking-[-0.02em] text-foreground mb-6">
                The structural mission floor.
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7] mb-10">
                Every conforming implementation MUST commit a minimum 10% of top-line revenue to
                an aligned 501(c)(3) or equivalent legal entity. Subscriptions and SaaS products
                MAY carry a higher rate (default 15% for direct-to-consumer products).
              </p>

              {/* The formula */}
              <div className="border border-border bg-card p-6 mb-10">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-4">
                  Formula
                </p>
                <pre className="font-mono text-sm text-foreground leading-[1.8] overflow-x-auto">
{`mission_floor =
  Σ (engagement_revenue × 0.10) +
  Σ (saas_revenue × 0.15) +
  Σ (other_product_revenue × 0.10)

destination = aligned_501c3_or_equivalent
disclosure  = annual_audit + per_invoice_line_item`}
                </pre>
              </div>

              <div className="space-y-5 text-base text-muted-foreground leading-[1.7]">
                <p>
                  The destination MUST be an independent 501(c)(3) (or equivalent jurisdictional
                  charity) with audited financials. The implementation MUST publish its annual
                  audited contribution figure. Each invoice the implementation issues MUST
                  line-item the mission contribution.
                </p>
                <p className="text-foreground font-medium">
                  The floor is non-negotiable. Higher rates are encouraged.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* § 5 — Adoption criteria */}
      <section className="border-t border-border py-20 sm:py-24 bg-surface-hover/40">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 mb-12">
            <SectionRail index="5" label="Adoption" />
            <div className="max-w-2xl">
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-semibold leading-[1.15] tracking-[-0.02em] text-foreground mb-6">
                Six criteria for a conforming implementation.
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7]">
                A venture is &ldquo;Engine-conforming&rdquo; if it meets all six criteria below.
                A venture working toward conformance is &ldquo;Engine-aligned.&rdquo;
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <div />
            <div className="max-w-3xl border-t border-border">
              {ADOPTION.map((c, i) => (
                <div key={c.criterion} className="grid grid-cols-[60px_1fr] sm:grid-cols-[80px_1fr] gap-x-6 sm:gap-x-10 py-6 border-b border-border">
                  <span className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground pt-1">
                    5.{i + 1}
                  </span>
                  <div>
                    <h4 className="text-base sm:text-lg font-semibold tracking-tight text-foreground mb-2">
                      {c.criterion}
                    </h4>
                    <p className="text-sm sm:text-base text-muted-foreground leading-[1.7]">
                      {c.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* § 6 — Conforming implementations */}
      <section className="border-t border-border py-20 sm:py-24">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 mb-10">
            <SectionRail index="6" label="Implementations" />
            <div className="max-w-2xl">
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-semibold leading-[1.15] tracking-[-0.02em] text-foreground mb-6">
                Conforming implementations.
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7]">
                Ventures that have publicly declared conformance to v1.0. New implementations
                may be added via email to{" "}
                <a href="mailto:lorenzo@perpetualcore.com" className="text-primary hover:underline underline-offset-4">
                  lorenzo@perpetualcore.com
                </a>
                . Future versions of this spec will move registration to a public process.
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <div />
            <div className="max-w-3xl border-t border-border">
              {CONFORMING.map((c, i) => (
                <Link
                  key={c.name}
                  href={c.href}
                  className="group grid grid-cols-[40px_1fr] sm:grid-cols-[80px_200px_1fr_auto] gap-x-6 sm:gap-x-10 gap-y-2 py-6 border-b border-border hover:bg-surface-hover transition-colors items-baseline"
                >
                  <span className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground pt-1">
                    6.{i + 1}
                  </span>
                  <h4 className="text-lg sm:text-xl font-semibold tracking-[-0.015em] text-foreground col-span-1 sm:col-auto group-hover:text-primary transition-colors">
                    {c.name}
                  </h4>
                  <p className="text-sm text-muted-foreground col-span-2 sm:col-auto">
                    {c.role}
                  </p>
                  <span className="hidden sm:inline-flex items-center font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70 whitespace-nowrap">
                    {c.status}
                    <ArrowRight className="ml-3 h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* § 6.5 — Field operations */}
      <section className="border-t border-border py-20 sm:py-24 bg-surface-hover/40">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 mb-10">
            <SectionRail index="6.5" label="Field operations" />
            <div className="max-w-2xl">
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-semibold leading-[1.15] tracking-[-0.02em] text-foreground mb-6">
                Reference field operations.
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7]">
                Operating sites where the Engine is run under live regulatory constraint, in
                production. Distinct from conforming implementations (which are stand-alone
                ventures): field operations are the operational arms inside an implementation
                where the methodology is stress-tested.
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <div />
            <div className="max-w-3xl border-t border-border">
              {FIELD_OPS.map((f, i) => (
                <Link
                  key={f.name}
                  href={f.href}
                  className="group grid grid-cols-[40px_1fr] sm:grid-cols-[80px_220px_1fr] gap-x-6 sm:gap-x-10 gap-y-2 py-7 border-b border-border hover:bg-background transition-colors items-baseline"
                >
                  <span className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground pt-1">
                    6.{i + 5}
                  </span>
                  <h4 className="text-lg sm:text-xl font-semibold tracking-[-0.015em] text-foreground col-span-1 sm:col-auto group-hover:text-primary transition-colors">
                    {f.name}
                  </h4>
                  <div className="col-span-2 sm:col-auto">
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary mb-2">
                      {f.role}
                    </p>
                    <p className="text-sm text-muted-foreground leading-[1.65]">
                      {f.note}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* § 7 — Declare adoption CTA */}
      <section className="border-t border-border py-24 sm:py-32">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <p className="eyebrow mb-6">§ 7 · Adopt</p>
            <h3 className="display-hero text-[36px] sm:text-[52px] lg:text-[68px] text-foreground mb-10 leading-[1.05]">
              Build the next conforming{" "}
              <span className="italic">implementation.</span>
            </h3>
            <p className="text-base sm:text-lg text-muted-foreground leading-[1.65] mb-12 max-w-2xl mx-auto">
              If you&apos;re building an AI-native venture and intend to meet the six criteria,
              email us. We&apos;ll add you to the implementations list and compare notes on what
              works.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
              <Button size="lg" asChild className="text-sm font-medium px-7 h-11 shadow-none bg-foreground text-background hover:bg-foreground/90 rounded-[6px]">
                <a href="mailto:lorenzo@perpetualcore.com?subject=Adopting%20the%20Engine%20spec">
                  Declare adoption <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Link href="/" className="inline-flex items-center text-sm font-medium text-foreground hover:text-primary transition-colors py-3 border-b border-foreground/20 hover:border-primary">
                See the reference implementation <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
