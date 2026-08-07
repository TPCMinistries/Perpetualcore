"use client";

/**
 * CreateOrgForm — Client form for creating a new RFP org (tenant).
 *
 * Submits to POST /api/orgs. On success, redirects to the live Discovery feed.
 * Five-field setup:
 *   - name
 *   - type
 *   - mission
 *   - geography
 *   - funding types
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

type OrgType = "nonprofit" | "forprofit" | "dual";

const FUNDING_TYPES = [
  "Federal contracts",
  "Federal grants",
  "State/local RFPs",
  "Foundation grants",
  "Corporate philanthropy",
] as const;

export function CreateOrgForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState<OrgType>("nonprofit");
  const [mission, setMission] = useState("");
  const [geography, setGeography] = useState("");
  const [fundingTypes, setFundingTypes] = useState<string[]>([
    "Federal grants",
    "State/local RFPs",
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleFundingType = (value: string) => {
    setFundingTypes((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value],
    );
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const capacity_summary = [
      `Mission: ${mission.trim()}`,
      `Geography: ${geography.trim()}`,
      `Funding interests: ${fundingTypes.join(", ")}`,
    ].join("\n");

    const res = await fetch("/api/orgs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, type, naics: [], capacity_summary }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Something went wrong. Please try again.");
      setSubmitting(false);
      return;
    }

    router.push(`/org/${data.org.id}/discovery`);
  };

  const canSubmit =
    !submitting &&
    name.trim().length >= 2 &&
    mission.trim().length >= 20 &&
    geography.trim().length >= 2 &&
    fundingTypes.length > 0;

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

      {/* Mission */}
      <div className="space-y-2">
        <Label htmlFor="org-mission">Mission</Label>
        <textarea
          id="org-mission"
          value={mission}
          onChange={(e) => setMission(e.target.value)}
          required
          minLength={20}
          maxLength={600}
          rows={4}
          placeholder="Who you serve, what you do, and the outcomes you are built to deliver."
          disabled={submitting}
          className="flex min-h-[112px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <p className="text-xs text-muted-foreground">
          This becomes the first capacity signal for scoring and drafting.
        </p>
      </div>

      {/* Geography */}
      <div className="space-y-2">
        <Label htmlFor="org-geography">Geography</Label>
        <Input
          id="org-geography"
          value={geography}
          onChange={(e) => setGeography(e.target.value)}
          required
          minLength={2}
          maxLength={180}
          placeholder="e.g. New York City, New York State, national"
          disabled={submitting}
        />
      </div>

      {/* Funding types */}
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium leading-none">
          Funding types
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {FUNDING_TYPES.map((value) => {
            const active = fundingTypes.includes(value);
            return (
              <button
                key={value}
                type="button"
                onClick={() => toggleFundingType(value)}
                disabled={submitting}
                aria-pressed={active}
                className={`min-h-11 rounded-md border px-3 py-2 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                  active
                    ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                    : "border-input bg-background text-foreground hover:bg-muted"
                }`}
              >
                {value}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          Pick at least one. You can refine NAICS and scoring details later.
        </p>
      </fieldset>

      <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3 text-xs leading-5 text-zinc-600">
        After creation, the engine scores current opportunities automatically.
        Voice and vault setup improve the first draft but are not required to
        see your first matches.
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
        disabled={!canSubmit}
        className="w-full sm:w-auto"
      >
        {submitting ? "Creating…" : "Create organization"}
      </Button>
    </form>
  );
}
