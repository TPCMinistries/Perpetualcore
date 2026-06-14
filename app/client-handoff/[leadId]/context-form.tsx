"use client";

import { FormEvent, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  Loader2,
  Mail,
  Send,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
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

type SubmitResponse = {
  error?: string;
  taskSync?: {
    created: number;
    skipped: number;
    error: string | null;
  };
};

const initialState: FormState = {
  workflowOwner: "",
  toolsAndData: "",
  realExamples: "",
  rulesAndEscalations: "",
  successMetric: "",
  notes: "",
};

const fieldGuide: Array<{
  field: keyof FormState;
  label: string;
  helper: string;
  placeholder: string;
  required?: boolean;
  rows: string;
}> = [
  {
    field: "workflowOwner",
    label: "Workflow owner",
    helper: "The person who can answer questions, approve examples, and unblock access.",
    placeholder: "Name, title, and best way to reach them",
    required: true,
    rows: "input",
  },
  {
    field: "successMetric",
    label: "Success metric",
    helper: "What result would make this first lane worth expanding?",
    placeholder: "Example: faster follow-up, fewer missed handoffs, cleaner reporting, more booked appointments...",
    required: true,
    rows: "large",
  },
  {
    field: "toolsAndData",
    label: "Tools, data, and access",
    helper: "The systems, files, inboxes, calendars, forms, dashboards, or exports involved today.",
    placeholder: "CRM, inboxes, forms, spreadsheets, calendars, docs, dashboards, or systems involved",
    required: true,
    rows: "large",
  },
  {
    field: "realExamples",
    label: "Real examples",
    helper: "The fastest way to make the operating lane useful is to give real examples.",
    placeholder: "Recent messages, handoffs, reports, tickets, screenshots, calls, proposals, or files",
    rows: "large",
  },
  {
    field: "rulesAndEscalations",
    label: "Rules and escalations",
    helper: "Boundaries for what AI can do, avoid, ask, remember, or escalate.",
    placeholder: "What should AI do, avoid, ask, remember, or escalate to a person?",
    rows: "large",
  },
  {
    field: "notes",
    label: "Additional context",
    helper: "Anything else the kickoff team should know before the first working surface is built.",
    placeholder: "Anything else the kickoff team should know",
    rows: "medium",
  },
];

function buildKickoffBrief(form: FormState) {
  const lines = [
    "Perpetual Core kickoff context",
    "",
    `Workflow owner: ${form.workflowOwner || "Not provided"}`,
    "",
    "Success metric:",
    form.successMetric || "Not provided",
    "",
    "Tools, data, and access:",
    form.toolsAndData || "Not provided",
    "",
    "Real examples:",
    form.realExamples || "Not provided",
    "",
    "Rules and escalations:",
    form.rulesAndEscalations || "Not provided",
    "",
    "Additional context:",
    form.notes || "Not provided",
    "",
    "Suggested kickoff tasks:",
    "1. Confirm workflow owner, decision owner, and kickoff window.",
    "2. Map current workflow, source systems, users, and handoff points.",
    "3. Turn real examples into the assistant behavior brief.",
    "4. Define the first success metric and review checkpoint.",
    "5. Ship the first operating lane for review before expanding.",
  ];

  return lines.join("\n");
}

export function HandoffContextForm({ leadId, token, defaultOwner }: HandoffContextFormProps) {
  const [form, setForm] = useState<FormState>({
    ...initialState,
    workflowOwner: defaultOwner === "Name the person who can unblock access and decisions." ? "" : defaultOwner,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [taskSyncMessage, setTaskSyncMessage] = useState("");
  const [fallbackBrief, setFallbackBrief] = useState("");
  const completedFields = fieldGuide.filter((field) => form[field.field].trim().length > 0);
  const requiredComplete = fieldGuide
    .filter((field) => field.required)
    .every((field) => form[field.field].trim().length > 0);
  const progress = Math.round((completedFields.length / fieldGuide.length) * 100);
  const kickoffBrief = buildKickoffBrief(form);

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!requiredComplete) {
      toast.error("Add the workflow owner, success metric, and tools/data before sending.");
      return;
    }

    setSubmitting(true);
    setFallbackBrief("");

    try {
      const response = await fetch(`/api/client-handoff/${encodeURIComponent(leadId)}/context`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, ...form }),
      });
      const data = (await response.json()) as SubmitResponse;

      if (!response.ok) {
        throw new Error(data.error || "Failed to send context");
      }

      setSubmitted(true);
      setTaskSyncMessage(
        data.taskSync?.error
          ? "Your context was saved. Kickoff tasks may need to be generated manually from the account room."
          : `${data.taskSync?.created || 0} kickoff task${data.taskSync?.created === 1 ? "" : "s"} created for the account room.`,
      );
      toast.success("Handoff context sent");
    } catch (error) {
      setFallbackBrief(buildKickoffBrief(form));
      toast.error(
        error instanceof Error
          ? `${error.message}. Use the copyable fallback below.`
          : "Could not save context. Use the copyable fallback below.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function copyFallbackBrief() {
    await navigator.clipboard.writeText(fallbackBrief || kickoffBrief);
    toast.success("Kickoff brief copied");
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
            {taskSyncMessage ? (
              <p className="mt-2 text-sm leading-6 text-emerald-900">{taskSyncMessage}</p>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <div className="rounded-lg border border-violet-100 bg-violet-50/60 p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-violet-700" />
              <p className="text-sm font-semibold text-slate-950">Kickoff readiness</p>
            </div>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Complete the required fields, then send. Optional examples and rules make the first lane stronger.
            </p>
          </div>
          <div className="min-w-32 text-left sm:text-right">
            <p className="text-2xl font-semibold text-slate-950">{progress}%</p>
            <p className="text-xs text-slate-500">
              {completedFields.length}/{fieldGuide.length} fields
            </p>
          </div>
        </div>
        <Progress value={progress} className="mt-4 h-2" />
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4">
        {fieldGuide.map((item) => {
          const value = form[item.field];
          const complete = value.trim().length > 0;
          return (
            <div
              key={item.field}
              className={`rounded-lg border p-4 ${
                item.required && !complete ? "border-amber-200 bg-amber-50/40" : "bg-white"
              }`}
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <Label htmlFor={item.field} className="text-sm font-semibold text-slate-950">
                    {item.label}
                    {item.required ? <span className="ml-1 text-amber-700">*</span> : null}
                  </Label>
                  <p className="mt-1 text-sm leading-5 text-slate-600">{item.helper}</p>
                </div>
                <span
                  className={`w-fit rounded-md border px-2 py-1 text-xs font-medium ${
                    complete
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-slate-200 bg-slate-50 text-slate-600"
                  }`}
                >
                  {complete ? "Ready" : item.required ? "Required" : "Optional"}
                </span>
              </div>
              {item.rows === "input" ? (
                <Input
                  id={item.field}
                  value={value}
                  onChange={(event) => updateField(item.field, event.target.value)}
                  placeholder={item.placeholder}
                  className="mt-3 bg-white"
                />
              ) : (
                <Textarea
                  id={item.field}
                  value={value}
                  onChange={(event) => updateField(item.field, event.target.value)}
                  placeholder={item.placeholder}
                  className={`mt-3 ${item.rows === "large" ? "min-h-28" : "min-h-20"} bg-white`}
                />
              )}
            </div>
          );
        })}

        <div className="sticky bottom-4 z-10 rounded-lg border bg-white p-4 shadow-lg shadow-slate-900/10">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-950">
                {requiredComplete ? "Ready to send kickoff context" : "Add required kickoff context"}
              </p>
              <p className="mt-1 text-sm leading-5 text-slate-600">
                Required: workflow owner, success metric, and tools/data. You can send more details later.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" variant="outline" className="rounded-md" onClick={copyFallbackBrief}>
                <Copy className="mr-2 h-4 w-4" />
                Copy brief
              </Button>
              <Button type="submit" disabled={submitting || !requiredComplete} className="rounded-md">
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Send kickoff context
              </Button>
            </div>
          </div>
        </div>
      </form>

      <div className="rounded-lg border bg-slate-50 p-4">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-violet-600" />
          <p className="text-sm font-semibold text-slate-950">Brief preview</p>
        </div>
        <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap rounded-md border bg-white p-3 text-xs leading-5 text-slate-700">
          {kickoffBrief}
        </pre>
      </div>

      {fallbackBrief ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-amber-950">Database save is temporarily unavailable</p>
              <p className="mt-1 text-sm leading-6 text-amber-900">
                Your kickoff brief was generated in this browser. Copy it or email it so the work can
                continue while the account database is offline.
              </p>
              <pre className="mt-4 max-h-72 overflow-auto whitespace-pre-wrap rounded-md border border-amber-200 bg-white p-3 text-xs leading-5 text-slate-800">
                {fallbackBrief}
              </pre>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Button type="button" variant="outline" className="rounded-md bg-white" onClick={copyFallbackBrief}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy kickoff brief
                </Button>
                <Button asChild variant="outline" className="rounded-md bg-white">
                  <a
                    href={`mailto:info@perpetualcore.com?subject=${encodeURIComponent(
                      "Perpetual Core kickoff context",
                    )}&body=${encodeURIComponent(fallbackBrief)}`}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Email brief
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
