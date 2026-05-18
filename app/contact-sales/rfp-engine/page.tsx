"use client";

/**
 * /contact-sales/rfp-engine — RFP Engine–branded enterprise contact page.
 *
 * Same /api/contact-sales submit endpoint as the parent Perpetual Core
 * version (so leads land in the same enterprise_demo_requests table with
 * full schema compatibility), but rendered with the RFP marketing
 * aesthetic and capture-ops copy. Linked from the RFP marketing surface;
 * the parent /contact-sales stays as the generic Perpetual Core route.
 */

import { useState } from "react";
import Link from "next/link";
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
import { CheckCircle2, ScanSearch, Mic, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { productBrand } from "@/lib/brand/product-context";

const brand = productBrand("rfp");

const EXPECT_ICONS = [ScanSearch, Mic, ShieldCheck, Sparkles] as const;

interface FormData {
  name: string;
  email: string;
  company: string;
  phone: string;
  employees: string;
  plan: string;
  message: string;
}

const EMPTY: FormData = {
  name: "",
  email: "",
  company: "",
  phone: "",
  employees: "",
  plan: "",
  message: "",
};

export default function ContactSalesRfpPage() {
  const [data, setData] = useState<FormData>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  function onChange(field: keyof FormData, value: string) {
    setData((d) => ({ ...d, [field]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!data.name || !data.email || !data.company || !data.employees || !data.plan) {
      toast.error("Please fill in the required fields.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/contact-sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          // The API schema enums plan as Pro | Enterprise | Custom. UI
          // shows RFP-relevant labels; we map "Agency" → "Custom" so the
          // existing audit + email pipelines accept the payload unchanged.
          plan: data.plan === "Agency" ? "Custom" : data.plan,
          product: "rfp-engine",
        }),
      });
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(payload.error ?? "Something went wrong. Try again.");
        return;
      }
      setDone(true);
      toast.success("Thanks — we'll be in touch within one business day.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-100 antialiased selection:bg-emerald-300/30 selection:text-emerald-100">
      {/* Ambient field */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[700px] w-[1200px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(16,185,129,0.18),transparent)] blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,1) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      <header className="border-b border-white/5">
        <div className="container mx-auto flex items-center justify-between px-4 py-6">
          <Link href="/rfp" className="inline-flex items-center gap-3">
            <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500">
              {brand.wordmark}
            </span>
          </Link>
          <Link
            href="/rfp/pricing"
            className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500 hover:text-zinc-300"
          >
            ← Pricing
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16 lg:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6 flex items-center gap-3">
            <span className="h-px w-8 bg-zinc-700" />
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500">
              Talk to capture ops
            </span>
          </div>

          <h1 className="max-w-3xl text-[clamp(2rem,4.5vw,3.25rem)] font-semibold leading-[1.05] tracking-tight text-white">
            {brand.contactTitle}
          </h1>
          <p className="mt-5 max-w-2xl text-[15px] leading-[1.7] text-zinc-400">
            {brand.contactSubtitle}
          </p>

          {done ? (
            <div className="mt-16 max-w-xl rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-10 text-center">
              <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-300" />
              <h2 className="mt-6 text-2xl font-semibold tracking-tight text-white">
                We&apos;ll be in touch
              </h2>
              <p className="mt-3 text-zinc-300">
                Thanks{data.name ? `, ${data.name.split(" ")[0]}` : ""}. We received
                your note and one of our operators will reach out within one
                business day to schedule your capture onboarding.
              </p>
              <div className="mt-8 flex justify-center gap-3">
                <Link href="/rfp">
                  <Button variant="outline" className="border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-900">
                    Back to RFP Engine
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-12 grid gap-12 lg:grid-cols-12">
              <form
                onSubmit={onSubmit}
                className="space-y-5 lg:col-span-7 [&_input]:bg-zinc-900/60 [&_input]:border-zinc-800 [&_input]:text-zinc-100 [&_input]:placeholder:text-zinc-600 [&_label]:text-zinc-300 [&_textarea]:bg-zinc-900/60 [&_textarea]:border-zinc-800 [&_textarea]:text-zinc-100 [&_textarea]:placeholder:text-zinc-600"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="name">
                      Full name <span className="text-emerald-300">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={data.name}
                      onChange={(e) => onChange("name", e.target.value)}
                      placeholder="Jane Doe"
                      required
                      disabled={busy}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">
                      Work email <span className="text-emerald-300">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={data.email}
                      onChange={(e) => onChange("email", e.target.value)}
                      placeholder="jane@yourorg.com"
                      required
                      disabled={busy}
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="company">
                      Organization <span className="text-emerald-300">*</span>
                    </Label>
                    <Input
                      id="company"
                      value={data.company}
                      onChange={(e) => onChange("company", e.target.value)}
                      placeholder="Your nonprofit, agency, or firm"
                      required
                      disabled={busy}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone (optional)</Label>
                    <Input
                      id="phone"
                      value={data.phone}
                      onChange={(e) => onChange("phone", e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      disabled={busy}
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="employees">
                      Team size <span className="text-emerald-300">*</span>
                    </Label>
                    <Select
                      value={data.employees}
                      onValueChange={(v) => onChange("employees", v)}
                      disabled={busy}
                    >
                      <SelectTrigger className="bg-zinc-900/60 border-zinc-800 text-zinc-100">
                        <SelectValue placeholder="Select team size" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                        <SelectItem value="1-10">1–10</SelectItem>
                        <SelectItem value="11-50">11–50</SelectItem>
                        <SelectItem value="51-200">51–200</SelectItem>
                        <SelectItem value="201-500">201–500</SelectItem>
                        <SelectItem value="501-1000">501–1,000</SelectItem>
                        <SelectItem value="1001+">1,001+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="plan">
                      Interested in <span className="text-emerald-300">*</span>
                    </Label>
                    <Select
                      value={data.plan}
                      onValueChange={(v) => onChange("plan", v)}
                      disabled={busy}
                    >
                      <SelectTrigger className="bg-zinc-900/60 border-zinc-800 text-zinc-100">
                        <SelectValue placeholder="Select plan" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                        <SelectItem value="Pro">Pro — $799/mo</SelectItem>
                        <SelectItem value="Agency">Agency — $2,499/mo</SelectItem>
                        <SelectItem value="Enterprise">Enterprise (let&apos;s scope it)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="message">
                    What capture pipeline are you running?
                  </Label>
                  <Textarea
                    id="message"
                    value={data.message}
                    onChange={(e) => onChange("message", e.target.value)}
                    placeholder="Federal grants? NYC city contracts? Foundation portfolio? How many submissions a quarter? Tell us what you're working on."
                    rows={5}
                    disabled={busy}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={busy}
                  className="w-full justify-center bg-emerald-500/10 border border-emerald-500/30 text-emerald-100 hover:bg-emerald-500/15 disabled:opacity-50"
                >
                  {busy ? "Sending…" : "Talk to capture ops"}
                </Button>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  By submitting, you agree to our{" "}
                  <Link href="/terms" className="underline hover:text-zinc-300">
                    Terms
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="underline hover:text-zinc-300">
                    Privacy
                  </Link>
                  . Replies typically land within one business day.
                </p>
              </form>

              <aside className="lg:col-span-5">
                <div className="mb-6 flex items-center gap-3">
                  <span className="h-px w-8 bg-zinc-700" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500">
                    What to expect
                  </span>
                </div>
                <ul className="space-y-6">
                  {brand.expect.map((item, i) => {
                    const Icon = EXPECT_ICONS[i % EXPECT_ICONS.length];
                    return (
                      <li key={item.label} className="flex gap-4">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-emerald-500/30 bg-emerald-500/5">
                          <Icon className="h-4 w-4 text-emerald-300" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-zinc-100">
                            {item.label}
                          </p>
                          <p className="mt-1 text-sm leading-relaxed text-zinc-400">
                            {item.body}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </aside>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
