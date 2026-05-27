"use client";

/**
 * CreateOrgForm — Client form for creating a new RFP org (tenant).
 *
 * Submits to POST /api/orgs. On success, redirects to the live Discovery feed.
 * Validation:
 *   - name: 2–120 chars, required
 *   - type: one of nonprofit | forprofit | dual, required
 *   - naics: at least one 2–6-digit code required before submit
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NaicsAssistantModal } from "@/components/rfp/NaicsAssistantModal";

type OrgType = "nonprofit" | "forprofit" | "dual";

export function CreateOrgForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState<OrgType>("nonprofit");
  const [naicsInput, setNaicsInput] = useState("");
  const [naics, setNaics] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Add a NAICS code from the text input if valid and not already present. */
  const addNaics = () => {
    const code = naicsInput.trim();
    if (/^\d{2,6}$/.test(code) && !naics.includes(code)) {
      setNaics([...naics, code]);
      setNaicsInput("");
    }
  };

  /** Add a NAICS code from the AI assistant. Validates + dedupes here too. */
  const addNaicsFromAssistant = (code: string) => {
    if (/^\d{2,6}$/.test(code) && !naics.includes(code)) {
      setNaics((prev) => [...prev, code]);
    }
  };

  /** Handle Enter key in the NAICS input. */
  const onNaicsKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addNaics();
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/orgs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, type, naics }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Something went wrong. Please try again.");
      setSubmitting(false);
      return;
    }

    router.push(`/org/${data.org.id}/discovery`);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Organization name */}
      <div className="space-y-2">
        <Label htmlFor="org-name">Organization name</Label>
        <Input
          id="org-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={2}
          maxLength={120}
          placeholder="e.g. Uplift Communities"
          disabled={submitting}
        />
      </div>

      {/* Organization type */}
      <div className="space-y-2">
        <Label htmlFor="org-type">Type</Label>
        <Select
          value={type}
          onValueChange={(v) => setType(v as OrgType)}
          disabled={submitting}
        >
          <SelectTrigger id="org-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="nonprofit">Nonprofit (501c3)</SelectItem>
            <SelectItem value="forprofit">For-profit</SelectItem>
            <SelectItem value="dual">Dual (operates both)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* NAICS codes */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="org-naics">NAICS codes</Label>
          <NaicsAssistantModal
            onAdd={addNaicsFromAssistant}
            existingCodes={naics}
          />
        </div>
        <div className="flex gap-2">
          <Input
            id="org-naics"
            value={naicsInput}
            onChange={(e) => setNaicsInput(e.target.value)}
            onKeyDown={onNaicsKeyDown}
            placeholder="e.g. 541512"
            disabled={submitting}
          />
          <Button
            type="button"
            variant="outline"
            onClick={addNaics}
            disabled={submitting}
          >
            Add
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Enter 2–6 digit NAICS codes that describe your work. At least one is
          required.
        </p>
        {naics.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {naics.map((code) => (
              <span
                key={code}
                className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm"
              >
                {code}
                <button
                  type="button"
                  aria-label={`Remove NAICS code ${code}`}
                  className="ml-1 text-muted-foreground hover:text-foreground"
                  onClick={() => setNaics(naics.filter((c) => c !== code))}
                  disabled={submitting}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Error display */}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {/* Submit */}
      <Button
        type="submit"
        disabled={submitting || !name || naics.length === 0}
        className="w-full sm:w-auto"
      >
        {submitting ? "Creating…" : "Create organization"}
      </Button>
    </form>
  );
}
