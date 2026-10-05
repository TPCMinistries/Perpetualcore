"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
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

interface FormData {
  name: string;
  email: string;
  company: string;
  website: string;
  employees: string;
  message: string;
}

const EMPTY: FormData = {
  name: "",
  email: "",
  company: "",
  website: "",
  employees: "",
  message: "",
};

export function FundingScanForm() {
  const [data, setData] = useState<FormData>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  function onChange(field: keyof FormData, value: string) {
    setData((d) => ({ ...d, [field]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!data.name || !data.email || !data.company || !data.employees) {
      toast.error("Please fill in the required fields.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/contact-sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          company: data.company,
          employees: data.employees,
          // `exploring` is an existing PLAN_VALUES entry, so the
          // sales_contacts CHECK constraint accepts it unchanged; the
          // product tag is what identifies Proposal Desk intake.
          plan: "exploring",
          product: "proposal-desk",
          message: [
            "[Proposal Desk — Funding Scan request]",
            data.website ? `Website: ${data.website}` : null,
            data.message || null,
          ]
            .filter(Boolean)
            .join("\n"),
        }),
      });
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(payload.error ?? "Something went wrong. Please try again.");
        return;
      }
      setDone(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Network error");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="border border-border bg-card p-8 sm:p-10" role="status">
        <CheckCircle2 className="h-8 w-8 text-primary mb-6" aria-hidden />
        <h3 className="text-2xl font-semibold tracking-[-0.025em] text-foreground mb-3">
          Your scan is in the queue.
        </h3>
        <p className="text-base text-muted-foreground leading-[1.7]">
          Thanks{data.name ? `, ${data.name.split(" ")[0]}` : ""}. You&apos;ll get your ten
          matched opportunities by email within two business days.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="border border-border bg-card p-6 sm:p-8 space-y-5" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="pd-name">
            Your name <span className="text-primary" aria-hidden>*</span>
          </Label>
          <Input
            id="pd-name"
            autoComplete="name"
            value={data.name}
            onChange={(e) => onChange("name", e.target.value)}
            required
            disabled={busy}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pd-email">
            Email <span className="text-primary" aria-hidden>*</span>
          </Label>
          <Input
            id="pd-email"
            type="email"
            autoComplete="email"
            value={data.email}
            onChange={(e) => onChange("email", e.target.value)}
            required
            disabled={busy}
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="pd-org">
            Organization <span className="text-primary" aria-hidden>*</span>
          </Label>
          <Input
            id="pd-org"
            autoComplete="organization"
            value={data.company}
            onChange={(e) => onChange("company", e.target.value)}
            required
            disabled={busy}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pd-site">Website</Label>
          <Input
            id="pd-site"
            type="url"
            inputMode="url"
            placeholder="https://"
            value={data.website}
            onChange={(e) => onChange("website", e.target.value)}
            disabled={busy}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="pd-size">
          Staff size <span className="text-primary" aria-hidden>*</span>
        </Label>
        <Select value={data.employees} onValueChange={(v) => onChange("employees", v)} disabled={busy}>
          <SelectTrigger id="pd-size" className="cursor-pointer">
            <SelectValue placeholder="Select staff size" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1-10">1–10</SelectItem>
            <SelectItem value="11-50">11–50</SelectItem>
            <SelectItem value="51-200">51–200</SelectItem>
            <SelectItem value="201-500">201+</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="pd-msg">What do you want funded?</Label>
        <Textarea
          id="pd-msg"
          rows={4}
          placeholder="Programs, populations served, and any deadline you're already looking at."
          value={data.message}
          onChange={(e) => onChange("message", e.target.value)}
          disabled={busy}
        />
      </div>
      <Button
        type="submit"
        size="lg"
        disabled={busy}
        className="w-full h-11 text-sm font-medium shadow-none bg-primary text-primary-foreground hover:bg-primary/90 rounded-[6px] cursor-pointer"
      >
        {busy ? "Sending…" : "Get my free Funding Scan"}
        {!busy && <ArrowRight className="ml-2 h-4 w-4" aria-hidden />}
      </Button>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Free, no obligation. We use your details only to prepare and send your scan.
      </p>
    </form>
  );
}
