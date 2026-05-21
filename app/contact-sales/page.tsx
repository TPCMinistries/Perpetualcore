"use client";

/**
 * /contact-sales — primary B2B funnel destination.
 * Accepts ?plan= and ?product= query params from solutions, pricing, and
 * product pages. Posts to /api/contact-sales (rate-limited, writes to
 * sales_contacts table, sends Resend confirmations).
 * Visual register matches homepage v6.
 */

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { JsonLd } from "@/components/seo/JsonLd";
import { serviceSchema } from "@/lib/seo/structured-data";
import { toast } from "sonner";

type SubmitState = "idle" | "submitting" | "success" | "error";

const PLAN_OPTIONS = [
  { value: "business", label: "Business — $1,999/mo" },
  { value: "enterprise", label: "Enterprise — $9,999/mo" },
  { value: "engagement-75", label: "Engagement — $75K install" },
  { value: "engagement-150", label: "Engagement — $150K install" },
  { value: "engagement-250", label: "Engagement — $250K+ install" },
  { value: "retainer", label: "Post-engagement retainer ($5K–$15K/mo)" },
  { value: "exploring", label: "Just exploring" },
];

const COMPANY_SIZE_OPTIONS = [
  { value: "1-10", label: "1–10 employees" },
  { value: "11-50", label: "11–50 employees" },
  { value: "51-200", label: "51–200 employees" },
  { value: "201-500", label: "201–500 employees" },
  { value: "501-1000", label: "501–1,000 employees" },
  { value: "1000+", label: "1,000+ employees" },
];

const WHAT_HAPPENS_NEXT = [
  {
    index: "01",
    title: "Reply within one business day",
    body: "A human on the team reads every submission. You get a real reply, not an autoresponder.",
  },
  {
    index: "02",
    title: "30-minute scoping call",
    body: "We listen. You describe the operation, the constraints, the metrics that matter. No deck.",
  },
  {
    index: "03",
    title: "Engagement proposal or referral",
    body: "If we're the right fit, you get a scoped proposal within a week. If we're not, we'll tell you who is.",
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

function ContactSalesForm() {
  const searchParams = useSearchParams();
  const planFromUrl = searchParams.get("plan") || "";
  const productFromUrl = searchParams.get("product") || "";

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    employees: "",
    plan: planFromUrl || "business",
    product: productFromUrl,
    message: "",
  });
  const [submitState, setSubmitState] = useState<SubmitState>("idle");

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitState("submitting");
    try {
      const response = await fetch("/api/contact-sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        throw new Error("Failed to submit");
      }
      setSubmitState("success");
      toast.success("Got it. We'll reply within one business day.");
    } catch (err) {
      console.error("Contact sales error:", err);
      setSubmitState("error");
      toast.error("Submit failed. Email lorenzo@perpetualcore.com directly.");
    }
  };

  if (submitState === "success") {
    return (
      <section className="container mx-auto px-6 sm:px-8 py-32">
        <div className="max-w-2xl mx-auto text-center">
          <SectionRail index="—" label="Received" />
          <h1 className="mt-6 font-display text-5xl sm:text-6xl leading-[1.05] tracking-[-0.02em] text-foreground">
            Got it.
          </h1>
          <p className="mt-6 text-base text-muted-foreground leading-[1.7]">
            A human on the team reads every submission. We'll reply to{" "}
            <span className="text-foreground font-medium">{formData.email}</span>{" "}
            within one business day with a 30-minute scoping window.
          </p>
          <div className="mt-10 flex flex-wrap gap-3 justify-center">
            <Button asChild variant="outline" className="text-sm font-medium h-10 px-5 shadow-none rounded-[6px]">
              <Link href="/">Back to home</Link>
            </Button>
            <Button asChild className="text-sm font-medium h-10 px-5 shadow-none bg-foreground text-background hover:bg-foreground/90 rounded-[6px]">
              <Link href="/products">Read the portfolio <ArrowRight className="ml-2 h-3.5 w-3.5" /></Link>
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      {/* Hero */}
      <section className="container mx-auto px-6 sm:px-8 pt-20 pb-12 sm:pt-28 sm:pb-16">
        <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
          <SectionRail index="00" label="Contact sales" />
          <div className="max-w-3xl">
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[1.05] tracking-[-0.025em] text-foreground">
              Tell us about your operation.
            </h1>
            <p className="mt-8 text-lg sm:text-xl text-muted-foreground leading-[1.65] max-w-2xl">
              Engagements start at $75,000 and run 6 to 10 weeks. Subscriptions
              start at $49/month. Either way, the conversation starts here.
              {productFromUrl && (
                <>
                  {" "}
                  You're asking about{" "}
                  <span className="text-foreground font-medium capitalize">
                    {productFromUrl.replace(/-/g, " ")}
                  </span>
                  .
                </>
              )}
            </p>
          </div>
        </div>
      </section>

      {/* Form + What happens next */}
      <section className="border-t border-border py-16 sm:py-20">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[1fr_320px] gap-12 lg:gap-16">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    Name *
                  </Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="Jane Operator"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    Work email *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="jane@yourcompany.com"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company" className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    Company *
                  </Label>
                  <Input
                    id="company"
                    required
                    value={formData.company}
                    onChange={(e) => handleChange("company", e.target.value)}
                    placeholder="Acme Holdings"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    Phone (optional)
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employees" className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    Company size *
                  </Label>
                  <Select
                    value={formData.employees}
                    onValueChange={(value) => handleChange("employees", value)}
                  >
                    <SelectTrigger id="employees">
                      <SelectValue placeholder="Select range" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMPANY_SIZE_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plan" className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    Interested in *
                  </Label>
                  <Select
                    value={formData.plan}
                    onValueChange={(value) => handleChange("plan", value)}
                  >
                    <SelectTrigger id="plan">
                      <SelectValue placeholder="Select band" />
                    </SelectTrigger>
                    <SelectContent>
                      {PLAN_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message" className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  Describe the operation (optional)
                </Label>
                <Textarea
                  id="message"
                  rows={5}
                  value={formData.message}
                  onChange={(e) => handleChange("message", e.target.value)}
                  placeholder="What workflows are eating your week? Which metric needs to move? What's been tried?"
                />
              </div>

              <Button
                type="submit"
                disabled={submitState === "submitting"}
                className="text-sm font-medium h-11 px-6 shadow-none bg-foreground text-background hover:bg-foreground/90 rounded-[6px]"
              >
                {submitState === "submitting" ? "Sending…" : "Send"}
                {submitState !== "submitting" && (
                  <ArrowRight className="ml-2 h-3.5 w-3.5" />
                )}
              </Button>

              <p className="text-xs text-muted-foreground leading-[1.7]">
                By submitting you agree to our{" "}
                <Link href="/privacy" className="underline hover:text-foreground">
                  Privacy Policy
                </Link>{" "}
                and{" "}
                <Link href="/terms" className="underline hover:text-foreground">
                  Terms
                </Link>
                . We don't sell data. We don't spam. We reply.
              </p>
            </form>

            {/* What happens next */}
            <aside className="border border-border bg-card p-7 self-start">
              <SectionRail index="—" label="What happens next" />
              <ul className="mt-7 space-y-6">
                {WHAT_HAPPENS_NEXT.map((step) => (
                  <li key={step.index} className="flex gap-4">
                    <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground pt-1">
                      {step.index}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-foreground">{step.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground leading-[1.65]">
                        {step.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-8 pt-6 border-t border-border">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-3">
                  Or email directly
                </p>
                <a
                  href="mailto:lorenzo@perpetualcore.com"
                  className="text-sm text-foreground hover:text-primary inline-flex items-center"
                >
                  lorenzo@perpetualcore.com
                  <ArrowRight className="ml-2 h-3 w-3" />
                </a>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Enterprise / engagement essentials */}
      <section className="border-t border-border py-20 sm:py-24">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <SectionRail index="—" label="Engagement essentials" />
            <div className="max-w-3xl grid sm:grid-cols-2 gap-x-10 gap-y-6">
              {[
                "Dedicated operating partner on point",
                "Outcome-eval scope written before code",
                "SSO/SAML and SOC 2 process",
                "HIPAA, IRB, and GDPR-equivalent handling",
                "Audit log on every model call",
                "10–15% of every dollar funds the Institute",
                "Stripe, ACH, or wire — net 30 standard",
                "Cancellable post-engagement retainers",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <Check className="h-4 w-4 text-foreground mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground leading-[1.6]">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

const PAGE_LOADING_FALLBACK = (
  <section className="container mx-auto px-6 sm:px-8 py-32 text-center">
    <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
      Loading…
    </p>
  </section>
);

export default function ContactSalesPage() {
  return (
    <div className="min-h-screen bg-background">
      <JsonLd
        data={serviceSchema({
          name: "AI Implementation Engagement",
          description:
            "Production AI installs for mission-driven organizations. 6–10 week engagements starting at $75,000.",
          category: "AI Implementation Services",
          priceFrom: "75000",
        })}
      />
      <Navbar />
      <Suspense fallback={PAGE_LOADING_FALLBACK}>
        <ContactSalesForm />
      </Suspense>
      <Footer />
    </div>
  );
}
