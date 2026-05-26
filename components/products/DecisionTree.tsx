"use client";

/**
 * /products decision tree — 2-question wizard that recommends one of the
 * 6 products based on what the visitor is trying to do.
 *
 * Reduces choice paralysis on the portfolio page. State is local (no
 * persistence) and reset is one click.
 */

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, RotateCcw } from "lucide-react";

type Recommendation = {
  product: string;
  productCode: string;
  href: string;
  external?: boolean;
  rationale: string;
  alsoConsider?: { name: string; href: string }[];
};

type Branch =
  | { kind: "question"; prompt: string; options: { label: string; next: Branch }[] }
  | { kind: "result"; rec: Recommendation };

const TREE: Branch = {
  kind: "question",
  prompt: "What are you trying to do?",
  options: [
    {
      label: "Operate AI inside my organization",
      next: {
        kind: "question",
        prompt: "What's the scope?",
        options: [
          {
            label: "Just me — operator running multiple entities",
            next: {
              kind: "result",
              rec: {
                product: "Sage",
                productCode: "03",
                href: "https://sage.perpetualcore.com",
                external: true,
                rationale:
                  "Personal AI OS with ambient context and your voice. Coach + chief of staff + strategist — not a chatbot you re-explain yourself to every morning. Lives in Telegram, voice, and web.",
              },
            },
          },
          {
            label: "Small team or nonprofit — shared knowledge layer",
            next: {
              kind: "result",
              rec: {
                product: "Vellum",
                productCode: "04",
                href: "/products/vellum",
                rationale:
                  "Institutional knowledge layer for organizations. Turns calls, docs, voice notes, and Slack into one queryable archive. 30% mission-driven discount for verified 501(c)(3)s on Operator and Team plans.",
                alsoConsider: [{ name: "Atlas Discovery", href: "/products/atlas-discovery" }],
              },
            },
          },
          {
            label: "Fund-backed portfolio company — install in 6-10 weeks",
            next: {
              kind: "result",
              rec: {
                product: "Atlas",
                productCode: "01",
                href: "https://atlas.perpetualcore.com",
                external: true,
                rationale:
                  "AI-native COO for fund-backed portcos. PE Operating Partners install Atlas across a portco before the next quarterly board meeting. In pilot — by introduction only.",
                alsoConsider: [{ name: "Atlas Discovery (start here)", href: "/products/atlas-discovery" }],
              },
            },
          },
          {
            label: "Enterprise — want a written scope before committing",
            next: {
              kind: "result",
              rec: {
                product: "Atlas Discovery",
                productCode: "01a",
                href: "/products/atlas-discovery",
                rationale:
                  "Paid discovery from $25K, real document your CFO can co-sign, outcome-eval scope. Credits can apply if you proceed to a larger Atlas install. The honest way to start.",
                alsoConsider: [{ name: "Read the buyer's guide", href: "/guide/ai-implementation-buyers-guide" }],
              },
            },
          },
        ],
      },
    },
    {
      label: "Win RFPs, grants, or contracts",
      next: {
        kind: "question",
        prompt: "Where are you in the bid process?",
        options: [
          {
            label: "Need to find the right RFPs + draft them",
            next: {
              kind: "result",
              rec: {
                product: "RFP Engine",
                productCode: "05",
                href: "https://rfp.perpetualcore.com",
                external: true,
                rationale:
                  "Discovery every 6 hours across federal, state, and foundation sources. Drafts in your voice, not generic AI prose. For grant writers, capture managers, and EDs.",
              },
            },
          },
          {
            label: "Need a bid/no-bid filter before writing",
            next: {
              kind: "result",
              rec: {
                product: "RFP Sentry",
                productCode: "06",
                href: "/products/rfp-sentry",
                rationale:
                  "Sister product to RFP Engine. Scores fit before you write; surfaces compliance flags before submission. For capture teams who'd rather lose a deal at bid/no-bid than after writing.",
                alsoConsider: [{ name: "RFP Engine", href: "https://rfp.perpetualcore.com" }],
              },
            },
          },
        ],
      },
    },
    {
      label: "Vet a person, entity, or counterparty",
      next: {
        kind: "result",
        rec: {
          product: "Sentinel",
          productCode: "02",
          href: "https://sentinel.perpetualcore.com",
          external: true,
          rationale:
            "Due diligence and intel for subjects the legacy CRAs (Kroll, etc.) won't touch. Production-grade, used by attorneys, investigators, journalists, and operators running pre-deal or pre-hire diligence.",
        },
      },
    },
    {
      label: "I'm not sure yet — show me how to evaluate",
      next: {
        kind: "result",
        rec: {
          product: "Buyer's Guide",
          productCode: "—",
          href: "/guide/ai-implementation-buyers-guide",
          rationale:
            "Vendor-agnostic ~4,500-word guide that walks through cost buckets ($5K vs $75K vs $500K), outcome-eval methodology, vendor rubrics, and the signals that mean you should defer rather than buy. Use it to evaluate any vendor — us included.",
          alsoConsider: [
            { name: "Compare against ChatGPT/Claude/Copilot", href: "/compare" },
            { name: "Start free on the SaaS tier", href: "/signup?plan=free" },
          ],
        },
      },
    },
  ],
};

export function DecisionTree() {
  const [path, setPath] = useState<number[]>([]);

  let current: Branch = TREE;
  for (const idx of path) {
    if (current.kind === "question" && current.options[idx]) {
      current = current.options[idx].next;
    }
  }

  const reset = () => setPath([]);

  return (
    <div className="border border-border bg-card p-6 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          Which product · {path.length === 0 ? "step 1" : current.kind === "result" ? "result" : `step ${path.length + 1}`}
        </p>
        {path.length > 0 && (
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw className="h-3 w-3" /> Restart
          </button>
        )}
      </div>

      {current.kind === "question" ? (
        <>
          <h4 className="text-xl sm:text-2xl font-semibold tracking-[-0.015em] text-foreground mb-6">
            {current.prompt}
          </h4>
          <div className="space-y-2">
            {current.options.map((opt, idx) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => setPath([...path, idx])}
                className="w-full text-left border border-border rounded-[6px] p-4 hover:border-foreground/40 hover:bg-surface-hover transition-colors group"
              >
                <span className="flex items-center justify-between gap-4">
                  <span className="text-sm sm:text-base text-foreground">{opt.label}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
                </span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="mb-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              Recommended · {current.rec.productCode}
            </span>
          </div>
          <h4 className="text-2xl sm:text-3xl font-semibold tracking-[-0.02em] text-foreground mb-4">
            {current.rec.product}
          </h4>
          <p className="text-sm sm:text-base text-muted-foreground leading-[1.7] mb-6">
            {current.rec.rationale}
          </p>
          <div className="flex flex-wrap gap-3 mb-4">
            {current.rec.external ? (
              <a
                href={current.rec.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm font-medium h-10 px-5 bg-foreground text-background hover:bg-foreground/90 rounded-[6px]"
              >
                Visit {current.rec.product} <ArrowRight className="ml-2 h-3.5 w-3.5" />
              </a>
            ) : (
              <Link
                href={current.rec.href}
                className="inline-flex items-center text-sm font-medium h-10 px-5 bg-foreground text-background hover:bg-foreground/90 rounded-[6px]"
              >
                Go to {current.rec.product} <ArrowRight className="ml-2 h-3.5 w-3.5" />
              </Link>
            )}
          </div>
          {current.rec.alsoConsider && current.rec.alsoConsider.length > 0 && (
            <div className="border-t border-border pt-4 mt-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-3">
                Also consider
              </p>
              <ul className="space-y-1.5">
                {current.rec.alsoConsider.map((alt) => (
                  <li key={alt.name}>
                    <Link
                      href={alt.href}
                      className="inline-flex items-center text-sm text-foreground hover:text-primary transition-colors"
                    >
                      {alt.name}
                      <ArrowRight className="ml-1.5 h-3 w-3" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
