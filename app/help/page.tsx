/**
 * /help — public help index. Removes the 404 the audit flagged for /help
 * and the dead /docs/* links that /dashboard/help points at.
 * Visual register matches homepage v6.
 */

import Link from "next/link";
import { ArrowRight, Mail, MessageSquare, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { JsonLd } from "@/components/seo/JsonLd";
import { faqSchema } from "@/lib/seo/structured-data";

export const metadata = {
  title: "Help — Perpetual Core",
  description:
    "Get answers fast. Common questions, quick links, and how to reach a human at Perpetual Core.",
};

const HELP_FAQ = [
  {
    question: "How fast does sales respond?",
    answer:
      "Sales replies within one business day. Engagement clients have a dedicated channel with contractual response windows; we keep those private.",
  },
  {
    question: "Where do I sign in to the product?",
    answer:
      "Sign in at /login. Forgot your password? Use the magic-link option — it works for all account types and avoids the reset friction.",
  },
  {
    question: "How do I cancel a subscription?",
    answer:
      "Open Settings > Billing inside the product, click Manage Subscription, and use the Stripe customer portal. Cancellation takes effect at the end of the current billing cycle. No retention pop-ups.",
  },
  {
    question: "Is there a free trial?",
    answer:
      "Free tier is permanent (1 user, basic chat, 100 sources). No card required. Pro tier ($99/mo) starts billing immediately; cancel anytime.",
  },
  {
    question: "Do you offer mission-driven discounts?",
    answer:
      "Verified 501(c)(3) organizations get a 30% discount on Vellum subscriptions. 10–15% of every revenue dollar across Perpetual Core funds the Institute for Human Advancement directly.",
  },
  {
    question: "How do I report a security issue?",
    answer:
      "Email security@perpetualcore.com with details. We acknowledge inbound reports within 24 hours and coordinate disclosure responsibly.",
  },
];

const QUICK_LINKS = [
  {
    icon: FileText,
    label: "Pricing & plans",
    href: "/pricing",
    body: "Every band — products, retainers, engagements.",
  },
  {
    icon: MessageSquare,
    label: "Talk to sales",
    href: "/contact-sales",
    body: "Primary B2B funnel. One business day to reply.",
  },
  {
    icon: Mail,
    label: "Email support",
    href: "mailto:support@perpetualcore.com",
    body: "Product-tier support. Real humans, no autoresponders.",
  },
];

function SectionRail({ index, label }: { index: string; label: string }) {
  return (
    <div className="flex items-baseline gap-3 text-muted-foreground">
      <span className="font-mono text-[10px] uppercase tracking-[0.22em]">{index}</span>
      <span className="font-mono text-[10px] uppercase tracking-[0.22em]">{label}</span>
    </div>
  );
}

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={faqSchema(HELP_FAQ)} />
      <Navbar />

      {/* Hero */}
      <section className="container mx-auto px-6 sm:px-8 pt-20 pb-12 sm:pt-28 sm:pb-16">
        <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
          <SectionRail index="00" label="Help" />
          <div className="max-w-3xl">
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[1.05] tracking-[-0.025em] text-foreground">
              Get answers fast.
            </h1>
            <p className="mt-8 text-lg sm:text-xl text-muted-foreground leading-[1.65] max-w-2xl">
              Common questions below. If your situation isn't here, email{" "}
              <a href="mailto:support@perpetualcore.com" className="text-foreground underline hover:no-underline">
                support@perpetualcore.com
              </a>{" "}
              or talk to sales. Real humans, every channel.
            </p>
          </div>
        </div>
      </section>

      {/* Quick links */}
      <section className="border-t border-border py-16 sm:py-20">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <SectionRail index="01" label="Quick links" />
            <div className="grid sm:grid-cols-3 gap-px bg-border border border-border">
              {QUICK_LINKS.map((link) => {
                const Icon = link.icon;
                const isExternal = link.href.startsWith("mailto:");
                const inner = (
                  <>
                    <Icon className="h-5 w-5 text-foreground mb-4" />
                    <p className="text-base font-semibold tracking-[-0.01em] text-foreground mb-2">
                      {link.label}
                    </p>
                    <p className="text-sm text-muted-foreground leading-[1.6]">
                      {link.body}
                    </p>
                  </>
                );
                return isExternal ? (
                  <a
                    key={link.href}
                    href={link.href}
                    className="group bg-card p-6 sm:p-7 hover:bg-surface-hover transition-colors"
                  >
                    {inner}
                  </a>
                ) : (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="group bg-card p-6 sm:p-7 hover:bg-surface-hover transition-colors"
                  >
                    {inner}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-border py-20 sm:py-24">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <SectionRail index="02" label="Common questions" />
            <div className="max-w-3xl">
              <dl className="divide-y divide-border border-y border-border">
                {HELP_FAQ.map((item) => (
                  <details key={item.question} className="group py-6">
                    <summary className="flex cursor-pointer items-start justify-between gap-6 list-none">
                      <dt className="text-base sm:text-lg font-medium text-foreground leading-snug">
                        {item.question}
                      </dt>
                      <span
                        className="font-mono text-xs text-muted-foreground mt-1 transition-transform group-open:rotate-45"
                        aria-hidden
                      >
                        +
                      </span>
                    </summary>
                    <dd className="mt-4 text-sm sm:text-base text-muted-foreground leading-[1.7]">
                      {item.answer}
                    </dd>
                  </details>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* Still stuck */}
      <section className="border-t border-border py-20 sm:py-24">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <SectionRail index="—" label="Still stuck" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-6">
                Talk to a human.
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7] mb-10">
                Pricing, technical, security, billing, partnerships — pick the
                fastest channel and we'll route from there.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild className="text-sm font-medium h-10 px-5 shadow-none bg-foreground text-background hover:bg-foreground/90 rounded-[6px]">
                  <Link href="/contact-sales">
                    Talk to sales <ArrowRight className="ml-2 h-3.5 w-3.5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="text-sm font-medium h-10 px-5 shadow-none rounded-[6px]">
                  <Link href="mailto:support@perpetualcore.com">
                    Email support
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
