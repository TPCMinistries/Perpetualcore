"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { briefMailto, CATEGORIES, EMPTY_BRIEF, formatBrief, LIMITS, validateBrief, type BriefErrors, type RepairBrief as Brief } from "@/lib/repairs/brief";

const FIELDS = [
  { key: "systems", label: "Systems and versions", placeholder: "Next.js 16 + Stripe, or n8n + Google Sheets", multiline: false },
  { key: "expected", label: "What should happen?", placeholder: "Describe one successful outcome.", multiline: true },
  { key: "actual", label: "What happens instead?", placeholder: "Describe the failure and a sanitized error message, if available.", multiline: true },
  { key: "reproduction", label: "How can the issue be reproduced?", placeholder: "Use fictional examples. Remove private URLs, tokens and customer information.", multiline: true },
  { key: "name", label: "Name or business (optional)", placeholder: "How should we address you?", multiline: false },
] as const;

export function RepairBrief() {
  const [brief, setBrief] = useState<Brief>({ ...EMPTY_BRIEF });
  const [errors, setErrors] = useState<BriefErrors>({});
  const [status, setStatus] = useState("");
  const form = useRef<HTMLFormElement>(null);

  function update(key: keyof Brief, value: string) {
    setBrief((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: undefined }));
    setStatus("");
  }

  function valid() {
    const next = validateBrief(brief);
    setErrors(next);
    const first = Object.keys(next)[0];
    if (first) {
      setStatus("Check the highlighted fields before preparing your draft.");
      form.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return false;
    }
    return true;
  }

  async function copy() {
    if (!valid()) return;
    try {
      await navigator.clipboard.writeText(formatBrief(brief));
      setStatus("Brief copied. Paste it into an email to info@perpetualcore.com. Nothing has been sent.");
    } catch {
      setStatus("Copy was unavailable. Download the text brief or open an email draft instead.");
    }
  }

  function download() {
    if (!valid()) return;
    const url = URL.createObjectURL(new Blob([formatBrief(brief)], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "perpetual-core-repair-brief.txt";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus("Text download requested. Attach the brief to your email; nothing has been sent.");
  }

  return (
    <form ref={form} noValidate onSubmit={(event) => {
      event.preventDefault();
      if (!valid()) return;
      window.location.href = briefMailto(brief);
      setStatus("Email app requested. Review and send the draft there. If it did not open, copy or download your brief.");
    }} className="space-y-6" aria-labelledby="brief-title" aria-describedby="brief-privacy">
      <p id="brief-privacy" className="rounded-md border border-border bg-surface-hover/40 p-4 text-sm leading-relaxed text-muted-foreground">
        Keep this brief safe to share: no passwords, API keys, customer records or private documents.
        Entries stay in this page until you choose an action. Refreshing clears them.
      </p>
      <div className="space-y-2">
        <label htmlFor="repair-category" className="block text-sm font-medium">What needs repair?</label>
        <select id="repair-category" name="category" required value={brief.category} onChange={(event) => update("category", event.target.value)}
          aria-invalid={!!errors.category} aria-describedby={errors.category ? "category-error" : undefined}
          className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <option value="">Choose a category</option>
          {CATEGORIES.map((category) => <option key={category}>{category}</option>)}
        </select>
        {errors.category && <p id="category-error" className="text-sm text-destructive">{errors.category}</p>}
      </div>
      {FIELDS.map(({ key, label, placeholder, multiline }) => {
        const Component = multiline ? Textarea : Input;
        return <div key={key} className="space-y-2">
          <label htmlFor={`repair-${key}`} className="block text-sm font-medium">{label}</label>
          <Component id={`repair-${key}`} name={key} value={brief[key]} placeholder={placeholder}
            required={key !== "name"} maxLength={LIMITS[key]} autoComplete="off"
            className={multiline ? "min-h-24" : "h-11"}
            onChange={(event) => update(key, event.target.value)} aria-invalid={!!errors[key]}
            aria-describedby={`${key}-limit${errors[key] ? ` ${key}-error` : ""}`} />
          <p id={`${key}-limit`} className="text-xs text-muted-foreground">{LIMITS[key]} characters maximum</p>
          {errors[key] && <p id={`${key}-error`} className="text-sm text-destructive">{errors[key]}</p>}
        </div>;
      })}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" className="h-11">Open email draft</Button>
        <Button type="button" variant="outline" className="h-11" onClick={copy}>Copy brief</Button>
        <Button type="button" variant="ghost" className="h-11" onClick={download}>Download text</Button>
      </div>
      <p className="text-sm text-muted-foreground">Send the draft in your email app; nothing is submitted here. Recipient: info@perpetualcore.com. This is a scope request, not a purchase.</p>
      <p role="status" aria-live="polite" aria-atomic="true" className="min-h-6 text-sm font-medium">{status}</p>
    </form>
  );
}
