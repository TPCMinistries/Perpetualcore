import Link from "next/link";
import { ArrowRight, Check, ClipboardList, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export const metadata = {
  title: "Package Purchased — Perpetual Core",
  description: "Your Perpetual Core package payment was received.",
};

const NEXT_STEPS = [
  "Send your intake context so we can identify the first operating lane.",
  "We review the payment, company context, and best-fit package path.",
  "You receive the onboarding window, prep notes, and any access instructions.",
];

const PREP_CHECKLIST = [
  "The company or team this package is for",
  "The workflow, department, or product surface you want to start with",
  "The files, systems, or notes we should understand before kickoff",
  "The business result that would make the first 30 days worthwhile",
];

export default function PackageSuccessPage({
  searchParams,
}: {
  searchParams?: { session_id?: string; lead?: string; package?: string };
}) {
  const sessionId = searchParams?.session_id;
  const leadId = searchParams?.lead;
  const packageId = searchParams?.package;
  const intakeHref = sessionId
    ? `/package-intake?session_id=${encodeURIComponent(sessionId)}${packageId ? `&package=${encodeURIComponent(packageId)}` : ""}${leadId ? `&lead=${encodeURIComponent(leadId)}` : ""}`
    : `/package-intake${packageId ? `?package=${encodeURIComponent(packageId)}` : ""}`;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="container mx-auto px-6 sm:px-8 py-24 sm:py-32">
        <div className="grid gap-12 lg:grid-cols-[1fr_360px] lg:items-start">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3 mb-8">
            <span aria-hidden className="block h-1.5 w-1.5 bg-primary" />
            <p className="eyebrow !text-foreground/70">Payment received</p>
          </div>
          <h1 className="text-5xl sm:text-6xl font-semibold tracking-[-0.045em] leading-[0.98] text-foreground mb-8">
            You are in.
          </h1>
          <p className="text-lg text-muted-foreground leading-[1.65] mb-10">
            Your package payment was received through Stripe. The next step is intake context:
            what company, department, workflow, data, and outcome we should orient around.
          </p>
          <div className="mb-10 border border-border bg-surface-hover/40 p-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-5">
              Have this ready
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {PREP_CHECKLIST.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-foreground" />
                  <span className="text-sm leading-6 text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild className="text-sm font-medium h-10 px-5 shadow-none bg-foreground text-background hover:bg-foreground/90 rounded-[6px]">
              <Link href={intakeHref}>
                Send intake context <ArrowRight className="ml-2 h-3.5 w-3.5" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="text-sm font-medium h-10 px-5 shadow-none rounded-[6px]">
              <Link href="/dashboard/operating">
                Operating dashboard <LayoutDashboard className="ml-2 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
        <aside className="border border-border bg-card p-7">
          <p className="eyebrow mb-6">What happens now</p>
          <ol className="space-y-5">
            {NEXT_STEPS.map((step, index) => (
              <li key={step} className="flex gap-4">
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground pt-1">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-sm text-muted-foreground leading-[1.65]">{step}</span>
              </li>
            ))}
          </ol>
          {leadId ? (
            <div className="mt-8 border-t border-border pt-6">
              <p className="eyebrow mb-3">Linked opportunity</p>
              <p className="text-sm leading-6 text-muted-foreground">
                This payment is connected to a lead record, so the operating dashboard can carry
                the package, proposal, and assistant-plan context forward.
              </p>
              <Button asChild variant="outline" className="mt-4 h-10 rounded-[6px] px-5 text-sm font-medium shadow-none">
                <Link href={`/dashboard/leads?lead=${encodeURIComponent(leadId)}`}>
                  Open lead <ClipboardList className="ml-2 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          ) : null}
        </aside>
        </div>
      </section>
      <Footer />
    </div>
  );
}
