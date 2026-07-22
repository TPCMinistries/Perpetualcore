"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Loader2,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";
import { DevelopmentNav } from "@/components/development-intelligence/DevelopmentNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  ApiErrorPayload,
  DevelopmentSubjectSummary,
  SubjectType,
} from "./types";

const subjectTypeLabels: Record<SubjectType, string> = {
  adult_employee: "Employee",
  adult_candidate: "Candidate",
  adult_participant: "Participant",
  leader: "Leader",
};

function normalizeConsentState(value: unknown): DevelopmentSubjectSummary["consentState"] {
  const status = String(value ?? "none");
  if (status === "active" || status === "granted" || status === "verified") return "active";
  if (status === "withdrawn") return "withdrawn";
  if (status === "expired") return "expired";
  return "not_verified";
}

function normalizeSubject(value: Record<string, unknown>): DevelopmentSubjectSummary {
  return {
    id: String(value.id || ""),
    displayLabel: String(value.displayLabel ?? value.display_label ?? "Unnamed profile"),
    subjectType: String(value.subjectType ?? value.subject_type ?? "adult_participant") as SubjectType,
    status: (value.status === "archived" ? "archived" : "active"),
    consentState: normalizeConsentState(value.consentStatus ?? value.consentState ?? value.consent_state),
    linkedSessionCount: Number(value.sessionCount ?? value.linkedSessionCount ?? value.linked_session_count ?? 0),
    observationCount: Number(value.observationCount ?? value.observation_count ?? 0),
    openCommitmentCount: Number(value.openCommitmentCount ?? value.open_commitment_count ?? 0),
    lastObservedAt: (value.lastObservedAt ?? value.last_observed_at ?? null) as string | null,
    createdAt: String(value.createdAt ?? value.created_at ?? new Date().toISOString()),
  };
}

export function ProfileDirectory() {
  const [subjects, setSubjects] = useState<DevelopmentSubjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [displayLabel, setDisplayLabel] = useState("");
  const [subjectType, setSubjectType] = useState<SubjectType>("adult_participant");
  const [consentBasis, setConsentBasis] = useState("participant_attestation");
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [creating, setCreating] = useState(false);

  const loadSubjects = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await fetch("/api/development-intelligence/subjects", {
        cache: "no-store",
      });
      const payload = (await response.json()) as
        | { subjects?: Array<Record<string, unknown>> }
        | Array<Record<string, unknown>>
        | ApiErrorPayload;
      if (!response.ok) {
        const message = !Array.isArray(payload) && "error" in payload ? payload.error : undefined;
        throw new Error(message || "Unable to load profiles");
      }
      const rows = Array.isArray(payload) ? payload : "subjects" in payload ? payload.subjects || [] : [];
      setSubjects(rows.map(normalizeSubject));
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Unable to load profiles");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSubjects();
  }, [loadSubjects]);

  const filteredSubjects = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return subjects;
    return subjects.filter((subject) =>
      `${subject.displayLabel} ${subjectTypeLabels[subject.subjectType]}`.toLowerCase().includes(term)
    );
  }, [search, subjects]);

  const activeConsent = subjects.filter((subject) => subject.consentState === "active").length;
  const linkedConversations = subjects.reduce((total, subject) => total + subject.linkedSessionCount, 0);

  async function createSubject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!consentConfirmed) {
      toast.error("Confirm longitudinal consent before creating this profile.");
      return;
    }
    setCreating(true);
    try {
      const response = await fetch("/api/development-intelligence/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayLabel: displayLabel.trim(),
          subjectType,
          consentBasis,
          consentConfirmed,
        }),
      });
      const payload = (await response.json()) as ApiErrorPayload;
      if (!response.ok) throw new Error(payload.error || "Unable to create profile");
      toast.success("Development profile created.");
      setDialogOpen(false);
      setDisplayLabel("");
      setSubjectType("adult_participant");
      setConsentBasis("participant_attestation");
      setConsentConfirmed(false);
      await loadSubjects();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create profile");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-8 pb-12">
      <DevelopmentNav />
      <Link
        href="/dashboard/development"
        className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Development Intelligence
      </Link>

      <section className="overflow-hidden rounded-[28px] border border-indigo-200 bg-[#f5f3ff] px-6 py-8 sm:px-9 sm:py-10">
        <div className="grid gap-7 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <Badge className="border border-indigo-200 bg-white text-indigo-800 hover:bg-white">
              <UsersRound className="mr-1.5 h-3.5 w-3.5" />
              Consent-based profiles
            </Badge>
            <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-[-0.03em] text-[#1e1b4b] sm:text-4xl">
              See a person&apos;s development across authorized conversations.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-700">
              Link evidence only after explicit longitudinal consent. Profiles compare a person with their own prior evidence—not coworkers, candidates, or population norms.
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="min-h-12 bg-indigo-600 hover:bg-indigo-700">
                <Plus className="mr-2 h-4 w-4" />
                Create consented profile
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
              <form onSubmit={createSubject}>
                <DialogHeader>
                  <DialogTitle>Create a development profile</DialogTitle>
                  <DialogDescription className="leading-6">
                    Use a recognizable internal label, but avoid unnecessary sensitive information. This profile will remain inactive for longitudinal use unless consent is recorded.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-5 py-6">
                  <div className="space-y-2">
                    <Label htmlFor="profile-label">Display label</Label>
                    <Input
                      id="profile-label"
                      value={displayLabel}
                      onChange={(event) => setDisplayLabel(event.target.value)}
                      placeholder="Jordan R."
                      minLength={1}
                      maxLength={80}
                      required
                    />
                    <p className="text-xs leading-5 text-slate-500">Use the minimum identity needed for your coaching workflow.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-type">Development context</Label>
                    <Select value={subjectType} onValueChange={(value) => setSubjectType(value as SubjectType)}>
                      <SelectTrigger id="profile-type"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(subjectTypeLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="consent-basis">How was consent confirmed?</Label>
                    <Select value={consentBasis} onValueChange={setConsentBasis}>
                      <SelectTrigger id="consent-basis"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="participant_attestation">Participant directly confirmed</SelectItem>
                        <SelectItem value="written_authorization">Written authorization is on file</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="longitudinal-consent"
                        checked={consentConfirmed}
                        onCheckedChange={(checked) => setConsentConfirmed(checked === true)}
                        className="mt-0.5"
                      />
                      <div>
                        <Label htmlFor="longitudinal-consent" className="cursor-pointer leading-5 text-indigo-950">
                          I confirm this person explicitly authorized longitudinal development tracking.
                        </Label>
                        <p className="mt-1 text-xs leading-5 text-indigo-800">
                          They may withdraw consent later. Withdrawal stops future linking and preserves an auditable record of what changed.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={creating}>Cancel</Button>
                  <Button type="submit" disabled={creating || !displayLabel.trim() || !consentConfirmed} className="bg-indigo-600 hover:bg-indigo-700">
                    {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                    Create profile
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </section>

      <section aria-label="Profile activity" className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Development profiles", value: subjects.length, icon: UserRound, tone: "indigo" },
          { label: "Consent active", value: activeConsent, icon: ShieldCheck, tone: "emerald" },
          { label: "Linked conversations", value: linkedConversations, icon: Sparkles, tone: "amber" },
        ].map((item) => (
          <Card key={item.label} className="border-slate-200 shadow-none">
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`rounded-xl p-3 ${item.tone === "emerald" ? "bg-emerald-50 text-emerald-700" : item.tone === "amber" ? "bg-amber-50 text-amber-700" : "bg-indigo-50 text-indigo-700"}`}>
                <item.icon className="h-5 w-5" />
              </div>
              <div><p className="text-2xl font-semibold text-slate-950">{item.value}</p><p className="text-sm text-slate-600">{item.label}</p></div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section>
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-indigo-700">People</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">Authorized longitudinal profiles</h2>
            <p className="mt-2 text-sm text-slate-600">Open a profile to inspect linked evidence, trends, consent history, and commitments.</p>
          </div>
          {subjects.length > 0 && (
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search profiles" aria-label="Search profiles" className="pl-9" />
            </div>
          )}
        </div>

        {loading ? (
          <Card className="border-slate-200 shadow-none"><CardContent className="flex min-h-48 items-center justify-center gap-3 text-sm text-slate-600"><Loader2 className="h-5 w-5 animate-spin text-indigo-600" />Loading profiles…</CardContent></Card>
        ) : loadError ? (
          <Card className="border-rose-200 bg-rose-50 shadow-none"><CardContent className="p-6"><h3 className="font-semibold text-rose-950">Profiles could not be loaded</h3><p className="mt-2 text-sm text-rose-800">{loadError}</p><Button variant="outline" className="mt-4 border-rose-300 bg-white" onClick={() => void loadSubjects()}>Try again</Button></CardContent></Card>
        ) : subjects.length === 0 ? (
          <Card className="border-dashed border-indigo-200 bg-indigo-50/40 shadow-none">
            <CardContent className="flex flex-col items-center px-6 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-indigo-700"><UserRound className="h-6 w-6" /></div>
              <h3 className="mt-4 text-lg font-semibold text-slate-950">Create the first consented profile.</h3>
              <p className="mt-2 max-w-lg text-sm leading-6 text-slate-600">A profile becomes useful after an authorized person is linked to one or more reviewed conversations.</p>
              <Button className="mt-5 min-h-11 bg-indigo-600 hover:bg-indigo-700" onClick={() => setDialogOpen(true)}><Plus className="mr-2 h-4 w-4" />Create profile</Button>
            </CardContent>
          </Card>
        ) : filteredSubjects.length === 0 ? (
          <Card className="border-dashed border-slate-200 shadow-none"><CardContent className="px-6 py-12 text-center"><Search className="mx-auto h-6 w-6 text-slate-400" /><h3 className="mt-3 font-semibold text-slate-950">No profiles match “{search}”</h3><Button variant="link" onClick={() => setSearch("")}>Clear search</Button></CardContent></Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {filteredSubjects.map((subject) => (
              <Link key={subject.id} href={`/dashboard/development/profiles/${subject.id}`} className="group rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2">
                <Card className="h-full border-slate-200 shadow-none transition-colors group-hover:border-indigo-300 group-hover:bg-indigo-50/30">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700"><UserRound className="h-5 w-5" /></div>
                        <div className="min-w-0"><h3 className="truncate font-semibold text-slate-950">{subject.displayLabel}</h3><p className="mt-1 text-sm text-slate-500">{subjectTypeLabels[subject.subjectType]}</p></div>
                      </div>
                      <Badge variant="outline" className={subject.consentState === "active" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}>
                        {subject.consentState === "active" ? <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> : <Clock3 className="mr-1 h-3.5 w-3.5" />}
                        {subject.consentState === "active" ? "Consent active" : subject.consentState.replaceAll("_", " ")}
                      </Badge>
                    </div>
                    <div className="mt-5 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-center">
                      <div><p className="font-semibold text-slate-950">{subject.linkedSessionCount}</p><p className="text-xs text-slate-500">Conversations</p></div>
                      <div><p className="font-semibold text-slate-950">{subject.observationCount}</p><p className="text-xs text-slate-500">Signals</p></div>
                      <div><p className="font-semibold text-slate-950">{subject.openCommitmentCount}</p><p className="text-xs text-slate-500">Open actions</p></div>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-xs text-slate-500"><span>{subject.lastObservedAt ? `Last evidence ${new Date(subject.lastObservedAt).toLocaleDateString()}` : "No evidence linked yet"}</span><span className="inline-flex items-center font-medium text-indigo-700">Open profile <ArrowRight className="ml-1 h-3.5 w-3.5" /></span></div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
        Profiles support developmental coaching only. They do not infer personality, integrity, diagnosis, emotion, accent, protected traits, or employment suitability, and they never make workforce decisions.
      </div>
    </div>
  );
}
