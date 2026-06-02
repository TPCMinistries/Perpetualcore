"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type HandoffContextFormProps = {
  leadId: string;
  token: string;
  defaultOwner: string;
};

type FormState = {
  workflowOwner: string;
  toolsAndData: string;
  realExamples: string;
  rulesAndEscalations: string;
  successMetric: string;
  notes: string;
};

const initialState: FormState = {
  workflowOwner: "",
  toolsAndData: "",
  realExamples: "",
  rulesAndEscalations: "",
  successMetric: "",
  notes: "",
};

export function HandoffContextForm({ leadId, token, defaultOwner }: HandoffContextFormProps) {
  const [form, setForm] = useState<FormState>({
    ...initialState,
    workflowOwner: defaultOwner === "Name the person who can unblock access and decisions." ? "" : defaultOwner,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch(`/api/client-handoff/${encodeURIComponent(leadId)}/context`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, ...form }),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Failed to send context");
      }

      setSubmitted(true);
      toast.success("Handoff context sent");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send context");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
          <div>
            <p className="text-sm font-semibold text-emerald-950">Context received</p>
            <p className="mt-1 text-sm leading-6 text-emerald-900">
              Perpetual Core can now turn this into the kickoff map, assistant behavior brief, and
              first operating lane tasks.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="workflowOwner">Workflow owner</Label>
        <Input
          id="workflowOwner"
          value={form.workflowOwner}
          onChange={(event) => updateField("workflowOwner", event.target.value)}
          placeholder="Name, title, and best way to reach them"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="successMetric">Success metric</Label>
        <Textarea
          id="successMetric"
          value={form.successMetric}
          onChange={(event) => updateField("successMetric", event.target.value)}
          placeholder="What would make this first lane worth expanding?"
          className="min-h-24"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="toolsAndData">Tools, data, and access</Label>
        <Textarea
          id="toolsAndData"
          value={form.toolsAndData}
          onChange={(event) => updateField("toolsAndData", event.target.value)}
          placeholder="CRM, inboxes, forms, spreadsheets, calendars, docs, dashboards, or systems involved"
          className="min-h-24"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="realExamples">Real examples</Label>
        <Textarea
          id="realExamples"
          value={form.realExamples}
          onChange={(event) => updateField("realExamples", event.target.value)}
          placeholder="Recent messages, handoffs, reports, tickets, screenshots, calls, proposals, or files"
          className="min-h-24"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="rulesAndEscalations">Rules and escalations</Label>
        <Textarea
          id="rulesAndEscalations"
          value={form.rulesAndEscalations}
          onChange={(event) => updateField("rulesAndEscalations", event.target.value)}
          placeholder="What should AI do, avoid, ask, remember, or escalate to a person?"
          className="min-h-24"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="notes">Additional context</Label>
        <Textarea
          id="notes"
          value={form.notes}
          onChange={(event) => updateField("notes", event.target.value)}
          placeholder="Anything else the kickoff team should know"
          className="min-h-20"
        />
      </div>

      <Button type="submit" disabled={submitting} className="rounded-md">
        {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
        Send kickoff context
      </Button>
    </form>
  );
}
