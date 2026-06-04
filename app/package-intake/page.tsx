"use client";

import { Suspense, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  FileText,
  Loader2,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import { toast } from "sonner";
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
import { Textarea } from "@/components/ui/textarea";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

type SubmitState = "idle" | "submitting" | "success" | "error";

const packageLabels: Record<string, string> = {
  "software-access": "Software Access",
  "guided-setup": "Guided Setup",
  "first-workflow": "First Workflow Package",
  "operating-lane-deposit": "90-Day Operating Lane",
};

const employeeOptions = [
  { value: "1-10", label: "1-10 employees" },
  { value: "11-50", label: "11-50 employees" },
  { value: "51-200", label: "51-200 employees" },
  { value: "201-500", label: "201-500 employees" },
  { value: "501-1000", label: "501-1,000 employees" },
  { value: "1000+", label: "1,000+ employees" },
];

const prepCards = [
  {
    title: "First lane",
    body: "Name the workflow, department, or operating surface we should improve first.",
    icon: Target,
  },
  {
    title: "Context",
    body: "List the tools, docs, inboxes, CRMs, spreadsheets, or examples we should understand.",
    icon: FileText,
  },
  {
    title: "Success",
    body: "Define what would make this first package worth expanding.",
    icon: ShieldCheck,
  },
];

function PackageIntakeForm() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id") || "";
  const packageId = searchParams.get("package") || "guided-setup";
  const leadId = searchParams.get("lead") || "";
  const packageLabel = packageLabels[packageId] || "Perpetual Core package";
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    employees: "",
    workflowOwner: "",
    firstLane: "",
    toolsAndData: "",
    examples: "",
    successMetric: "",
    constraints: "",
  });

  const requiredComplete = useMemo(
    () =>
      Boolean(
        formData.name.trim() &&
          formData.email.trim() &&
          formData.company.trim() &&
          formData.employees &&
          formData.firstLane.trim() &&
          formData.toolsAndData.trim() &&
          formData.successMetric.trim(),
      ),
    [formData],
  );

  function handleChange(field: keyof typeof formData, value: string) {
    setFormData((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!requiredComplete) {
      toast.error("Complete the required kickoff fields before submitting.");
      return;
    }

    setSubmitState("submitting");

    const message = [
      "[Package intake]",
      `Package: ${packageLabel} (${packageId})`,
      sessionId ? `Stripe session: ${sessionId}` : "",
      leadId ? `Lead: ${leadId}` : "",
      "",
      `Workflow owner: ${formData.workflowOwner || "Not provided"}`,
      "",
      "First operating lane:",
      formData.firstLane,
      "",
      "Tools and data:",
      formData.toolsAndData,
      "",
      "Real examples:",
      formData.examples || "Not provided",
      "",
      "Success metric:",
      formData.successMetric,
      "",
      "Constraints, rules, or access notes:",
      formData.constraints || "Not provided",
    ]
      .filter(Boolean)
      .join("\n");

    try {
      const response = await fetch("/api/contact-sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          company: formData.company,
          phone: formData.phone,
          employees: formData.employees,
          plan: packageId,
          product: "package-intake",
          message,
        }),
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error || body.message || "Intake failed.");
      }

      setSubmitState("success");
      toast.success("Intake received. We can prepare the kickoff from this.");
    } catch (error) {
      setSubmitState("error");
      toast.error(error instanceof Error ? error.message : "Intake failed.");
    }
  }

  if (submitState === "success") {
    return (
      <section className="container mx-auto px-6 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h1 className="mt-8 text-5xl font-semibold tracking-[-0.045em] text-foreground sm:text-6xl">
            Intake received.
          </h1>
          <p className="mt-6 text-base leading-7 text-muted-foreground">
            We have the buyer, package, workflow, context, and success metric. The next step is
            to confirm the kickoff window and turn this into the first operating lane.
          </p>
          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            {leadId ? (
              <Button asChild className="h-10 rounded-[6px] bg-foreground px-5 text-sm text-background shadow-none hover:bg-foreground/90">
                <Link href={`/dashboard/accounts/${encodeURIComponent(leadId)}`}>
                  Open account <ClipboardList className="ml-2 h-3.5 w-3.5" />
                </Link>
              </Button>
            ) : null}
            <Button asChild variant="outline" className="h-10 rounded-[6px] px-5 text-sm shadow-none">
              <Link href="/dashboard/handoffs">Handoff queue</Link>
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="container mx-auto px-6 pb-12 pt-20 sm:px-8 sm:pb-16 sm:pt-28">
        <div className="grid gap-12 lg:grid-cols-[280px_1fr] lg:gap-20">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              Package intake
            </p>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              {sessionId ? `Stripe session ${sessionId}` : "Post-payment kickoff context"}
            </p>
          </div>
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
              <Sparkles className="mr-2 h-3.5 w-3.5 text-primary" />
              {packageLabel}
            </div>
            <h1 className="text-5xl font-semibold leading-[1.05] tracking-[-0.045em] text-foreground sm:text-6xl lg:text-7xl">
              Give us the context to start cleanly.
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-[1.65] text-muted-foreground">
              This is not a long discovery process. It captures the minimum operating context:
              first lane, owner, tools, examples, and success metric.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-border py-16 sm:py-20">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-16">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name" className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    Name *
                  </Label>
                  <Input id="name" required value={formData.name} onChange={(event) => handleChange("name", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    Work email *
                  </Label>
                  <Input id="email" type="email" required value={formData.email} onChange={(event) => handleChange("email", event.target.value)} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2 sm:col-span-1">
                  <Label htmlFor="company" className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    Company *
                  </Label>
                  <Input id="company" required value={formData.company} onChange={(event) => handleChange("company", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    Phone
                  </Label>
                  <Input id="phone" value={formData.phone} onChange={(event) => handleChange("phone", event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employees" className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    Company size *
                  </Label>
                  <Select value={formData.employees} onValueChange={(value) => handleChange("employees", value)}>
                    <SelectTrigger id="employees">
                      <SelectValue placeholder="Select range" />
                    </SelectTrigger>
                    <SelectContent>
                      {employeeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="workflow-owner" className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  Workflow owner
                </Label>
                <Input
                  id="workflow-owner"
                  value={formData.workflowOwner}
                  onChange={(event) => handleChange("workflowOwner", event.target.value)}
                  placeholder="Who can unblock decisions, access, and examples?"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="first-lane" className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  First operating lane *
                </Label>
                <Textarea
                  id="first-lane"
                  required
                  rows={3}
                  value={formData.firstLane}
                  onChange={(event) => handleChange("firstLane", event.target.value)}
                  placeholder="Example: customer follow-up, sales intake, proposal/RFP response, knowledge base, executive reporting, internal admin..."
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="tools-data" className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    Tools and data *
                  </Label>
                  <Textarea
                    id="tools-data"
                    required
                    rows={5}
                    value={formData.toolsAndData}
                    onChange={(event) => handleChange("toolsAndData", event.target.value)}
                    placeholder="CRM, inbox, Google Drive, forms, spreadsheets, Slack, website, PDFs, call notes..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="examples" className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    Real examples
                  </Label>
                  <Textarea
                    id="examples"
                    rows={5}
                    value={formData.examples}
                    onChange={(event) => handleChange("examples", event.target.value)}
                    placeholder="Paste 1-3 examples, links, situations, emails, tickets, proposals, or reports we should model from."
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="success-metric" className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    Success metric *
                  </Label>
                  <Textarea
                    id="success-metric"
                    required
                    rows={4}
                    value={formData.successMetric}
                    onChange={(event) => handleChange("successMetric", event.target.value)}
                    placeholder="What result would make the first 30 days feel clearly worth continuing?"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="constraints" className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    Rules, risks, or constraints
                  </Label>
                  <Textarea
                    id="constraints"
                    rows={4}
                    value={formData.constraints}
                    onChange={(event) => handleChange("constraints", event.target.value)}
                    placeholder="Compliance, privacy, approvals, access limits, tone, escalation rules, people to include..."
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 border border-border bg-surface-hover/40 p-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm leading-6 text-muted-foreground">
                  Required fields: name, email, company, size, first lane, tools/data, and success metric.
                </p>
                <Button
                  type="submit"
                  disabled={submitState === "submitting"}
                  className="h-11 rounded-[6px] bg-foreground px-6 text-sm text-background shadow-none hover:bg-foreground/90"
                >
                  {submitState === "submitting" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="mr-2 h-4 w-4" />
                  )}
                  Submit intake
                </Button>
              </div>

              {submitState === "error" ? (
                <p className="text-sm text-red-600">
                  Submit failed. Email lorenzo@perpetualcore.com with the same context.
                </p>
              ) : null}
            </form>

            <aside className="self-start border border-border bg-card p-7">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                What this unlocks
              </p>
              <div className="mt-7 space-y-4">
                {prepCards.map((card) => (
                  <div key={card.title} className="border border-border bg-background p-4">
                    <card.icon className="h-5 w-5 text-primary" />
                    <p className="mt-4 text-sm font-medium text-foreground">{card.title}</p>
                    <p className="mt-2 text-sm leading-5 text-muted-foreground">{card.body}</p>
                  </div>
                ))}
              </div>
              <div className="mt-7 border-t border-border pt-6">
                <p className="text-sm font-medium text-foreground">After submission</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  We can turn this into a kickoff agenda, account brief, first-lane task list,
                  and expansion recommendation.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}

const fallback = (
  <section className="container mx-auto px-6 py-24 text-center sm:px-8">
    <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
      Loading intake...
    </p>
  </section>
);

export default function PackageIntakePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Suspense fallback={fallback}>
        <PackageIntakeForm />
      </Suspense>
      <Footer />
    </div>
  );
}
