"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Users,
  Plus,
  Search,
  MoreHorizontal,
  Phone,
  Mail,
  Building,
  DollarSign,
  TrendingUp,
  UserCheck,
  UserX,
  Clock,
  ArrowRight,
  Clipboard,
  FileText,
  Trash2,
  Eye,
  Target,
  Sparkles,
  Send,
  PackageCheck,
  Map,
  ListChecks,
  Workflow,
  CreditCard,
  Bot,
  Brain,
  MessageSquare,
} from "lucide-react";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Types
interface Lead {
  id: string;
  user_id: string;
  name?: string | null;
  contact_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  contact_email?: string | null;
  phone?: string;
  company?: string | null;
  company_name?: string | null;
  title?: string;
  status: string | null;
  stage?: string;
  source?: string;
  source_detail?: string;
  estimated_value?: number;
  probability?: number;
  expected_close_date?: string;
  notes?: string;
  tags?: string[];
  lead_score?: number;
  ai_insights?: unknown;
  last_contacted_at?: string;
  next_follow_up_at?: string;
  created_at: string;
  updated_at: string;
  contact?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    company?: string;
    avatar_url?: string;
  };
  assigned_user?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

interface LeadActivity {
  id: string;
  lead_id: string;
  activity_type: string;
  title: string;
  description?: string;
  from_value?: string;
  to_value?: string;
  created_at: string;
}

interface PipelineStats {
  [key: string]: {
    count: number;
    value: number;
  };
}

// Status configuration
const STATUS_CONFIG: Record<string, { label: string; color: string; icon: LucideIcon }> = {
  new: { label: "New", color: "bg-blue-100 text-blue-700", icon: Sparkles },
  contacted: { label: "Contacted", color: "bg-purple-100 text-purple-700", icon: Phone },
  qualified: { label: "Qualified", color: "bg-cyan-100 text-cyan-700", icon: UserCheck },
  proposal: { label: "Proposal", color: "bg-orange-100 text-orange-700", icon: Target },
  negotiation: { label: "Negotiation", color: "bg-yellow-100 text-yellow-700", icon: TrendingUp },
  won: { label: "Won", color: "bg-green-100 text-green-700", icon: DollarSign },
  lost: { label: "Lost", color: "bg-red-100 text-red-700", icon: UserX },
};

const SOURCE_OPTIONS = [
  { value: "website", label: "Website" },
  { value: "referral", label: "Referral" },
  { value: "social", label: "Social Media" },
  { value: "email", label: "Email Campaign" },
  { value: "cold_outreach", label: "Cold Outreach" },
  { value: "event", label: "Event" },
  { value: "partner", label: "Partner" },
  { value: "other", label: "Other" },
];

const OFFER_ROUTES = [
  {
    label: "AI OS Map",
    href: "/lead-magnet",
    detail: "Send when the buyer needs to understand the full company operating system.",
    icon: Map,
  },
  {
    label: "Packages",
    href: "/packages",
    detail: "Send when the buyer wants a clear first purchase or starter lane.",
    icon: PackageCheck,
  },
  {
    label: "Sales intake",
    href: "/contact-sales?intent=operating-system-map",
    detail: "Send when the buyer is ready for scope, invoice, or an implementation call.",
    icon: Send,
  },
];

const SALES_FLOW = [
  {
    label: "Capture",
    detail: "Log the relationship, source, pain, and likely buyer type.",
    icon: Users,
  },
  {
    label: "Route",
    detail: "Choose AI OS Map, Packages, or Sales intake based on readiness.",
    icon: Workflow,
  },
  {
    label: "Propose",
    detail: "Create a lane-specific proposal and save it to the lead.",
    icon: FileText,
  },
  {
    label: "Close",
    detail: "Move to invoice, checkout, or operating onboarding.",
    icon: CreditCard,
  },
];

const ASSISTANT_MODES = [
  {
    label: "Scout",
    detail: "Find the signal in a lead, source, account, or conversation before you decide the offer.",
    icon: Search,
  },
  {
    label: "Qualifier",
    detail: "Score fit, urgency, buyer readiness, and whether this should be software, setup, or operating work.",
    icon: Brain,
  },
  {
    label: "Proposal partner",
    detail: "Turn the chosen lane into a buyer-specific proposal, close language, and follow-up sequence.",
    icon: FileText,
  },
  {
    label: "Operator",
    detail: "After payment, carry the context into onboarding, weekly rhythm, deliverables, and expansion.",
    icon: Bot,
  },
];

const LEAD_ACTIONS = [
  {
    label: "Build proposal",
    detail: "Attach a proposal draft to this lead and save it in their activity history.",
    href: (leadId: string) => `/dashboard/proposals?lead=${leadId}`,
    icon: FileText,
  },
  {
    label: "Use sales script",
    detail: "Open objection handling, cost framing, and follow-up language before you call or email.",
    href: () => "/dashboard/sales-script",
    icon: Clipboard,
  },
  {
    label: "Manual invoice path",
    detail: "Use when the buyer has agreed to start and needs a clean payment next step.",
    href: () => "/contact-sales?intent=manual-invoice",
    icon: DollarSign,
  },
];

const STARTER_LEADS = [
  {
    label: "Enterprise prospect",
    name: "Primary decision maker",
    company: "Empire Furniture",
    title: "AI operating system opportunity",
    value: "30000",
    notes:
      "Potential whole-company AI consulting and implementation lead. Start with the AI OS Map, then qualify for a 90-Day Operating Lane or first workflow package.",
  },
  {
    label: "Small business",
    name: "Small business owner",
    company: "",
    title: "Guided setup opportunity",
    value: "5000",
    notes:
      "Warm small-business lead. Qualify one painful workflow, send Packages, and recommend Guided Setup or First Workflow Package.",
  },
  {
    label: "Product-only buyer",
    name: "Product buyer",
    company: "",
    title: "Software access opportunity",
    value: "299",
    notes:
      "Buyer wants to try one product surface first. Start with Software Access, then expand if usage reveals a workflow or team need.",
  },
];

export default function LeadsPage() {
  const { confirm } = useConfirm();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [pipeline, setPipeline] = useState<PipelineStats>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"list" | "pipeline">("list");

  // Dialogs
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leadActivities, setLeadActivities] = useState<LeadActivity[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    title: "",
    source: "",
    estimated_value: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  const applyStarterLead = (template: (typeof STARTER_LEADS)[number]) => {
    setFormData({
      name: template.name,
      email: "",
      phone: "",
      company: template.company,
      title: template.title,
      source: "referral",
      estimated_value: template.value,
      notes: template.notes,
    });
    setShowCreateDialog(true);
  };

  // Fetch leads
  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
      if (sourceFilter && sourceFilter !== "all") params.set("source", sourceFilter);

      const res = await fetch(`/api/leads?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch leads");

      const data = await res.json();
      setLeads(data.leads || []);
      setPipeline(data.pipeline || {});
    } catch (error) {
      console.error("Error fetching leads:", error);
      toast.error("Failed to load leads");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, sourceFilter]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Fetch lead details
  const fetchLeadDetails = async (leadId: string) => {
    try {
      const res = await fetch(`/api/leads/${leadId}`);
      if (!res.ok) throw new Error("Failed to fetch lead");

      const data = await res.json();
      setSelectedLead(data.lead);
      setLeadActivities(data.activities || []);
      setShowDetailSheet(true);
    } catch (error) {
      console.error("Error fetching lead details:", error);
      toast.error("Failed to load lead details");
    }
  };

  // Create lead
  const handleCreateLead = async () => {
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          estimated_value: formData.estimated_value ? parseFloat(formData.estimated_value) : undefined,
        }),
      });

      if (!res.ok) throw new Error("Failed to create lead");

      toast.success("Lead created successfully");
      setShowCreateDialog(false);
      setFormData({
        name: "",
        email: "",
        phone: "",
        company: "",
        title: "",
        source: "",
        estimated_value: "",
        notes: "",
      });
      fetchLeads();
    } catch (error) {
      console.error("Error creating lead:", error);
      toast.error("Failed to create lead");
    } finally {
      setSaving(false);
    }
  };

  // Update lead status
  const handleUpdateStatus = async (leadId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("Failed to update lead");

      toast.success(`Lead moved to ${STATUS_CONFIG[newStatus]?.label || newStatus}`);
      fetchLeads();

      // Update selected lead if viewing
      if (selectedLead?.id === leadId) {
        fetchLeadDetails(leadId);
      }
    } catch (error) {
      console.error("Error updating lead:", error);
      toast.error("Failed to update lead");
    }
  };

  // Delete lead
  const handleDeleteLead = async (leadId: string) => {
    if (!(await confirm("Are you sure you want to delete this lead?"))) return;

    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete lead");

      toast.success("Lead deleted");
      setShowDetailSheet(false);
      setSelectedLead(null);
      fetchLeads();
    } catch (error) {
      console.error("Error deleting lead:", error);
      toast.error("Failed to delete lead");
    }
  };

  // Calculate totals
  const totalLeads = leads.length;
  const totalValue = Object.values(pipeline).reduce((sum, s) => sum + (s.value || 0), 0);
  const activeLeads = leads.filter(l => !["won", "lost"].includes(l.status)).length;
  const proposalCount = pipeline.proposal?.count || 0;
  const closeRate = totalLeads > 0
    ? Math.round(((pipeline.won?.count || 0) / totalLeads) * 100)
    : 0;
  const priorityLeads = leads
    .filter((lead) => !["won", "lost"].includes(lead.status || "new"))
    .sort((a, b) => (b.estimated_value || 0) - (a.estimated_value || 0))
    .slice(0, 4);
  const proposalActivities = leadActivities.filter(
    (activity) => activity.activity_type === "proposal_draft"
  );

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return formatDate(dateString);
  };

  const getLeadName = (lead: Lead) => {
    const composedName = [lead.first_name, lead.last_name].filter(Boolean).join(" ").trim();
    return lead.name || lead.contact_name || composedName || lead.email || lead.contact_email || "Unnamed lead";
  };

  const getLeadInitials = (lead: Lead) => {
    return getLeadName(lead)
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const getLeadCompany = (lead: Lead) => lead.company || lead.company_name || "";
  const getLeadEmail = (lead: Lead) => lead.email || lead.contact_email || "";
  const getLeadLane = (lead: Lead) => {
    const value = lead.estimated_value || 0;
    const text = `${lead.title || ""} ${lead.notes || ""}`.toLowerCase();

    if (value >= 15000 || text.includes("enterprise") || text.includes("operating system")) {
      return {
        label: "90-Day Operating Lane",
        detail: "Best path when they want you as AI consultant/operator across a broader system.",
        href: `/dashboard/proposals?lead=${lead.id}`,
      };
    }

    if (value >= 7500 || text.includes("workflow")) {
      return {
        label: "First Workflow Package",
        detail: "Best path when one workflow has obvious time, revenue, or service pain.",
        href: `/dashboard/proposals?lead=${lead.id}`,
      };
    }

    if (value >= 1000 || text.includes("setup")) {
      return {
        label: "Guided Setup",
        detail: "Best path for a smaller first invoice and one configured product surface.",
        href: "/packages",
      };
    }

    return {
      label: "Software Access",
      detail: "Best path when they only want to try the software before implementation.",
      href: "/packages",
    };
  };

  const getLeadNextAction = (lead: Lead) => {
    switch (lead.status || "new") {
      case "new":
        return "Contact and qualify";
      case "contacted":
        return "Send the right route";
      case "qualified":
        return "Build proposal";
      case "proposal":
        return "Follow up and close";
      case "negotiation":
        return "Move to invoice";
      case "won":
        return "Start onboarding";
      case "lost":
        return "Archive or nurture";
      default:
        return "Choose next action";
    }
  };

  const getLeadBriefing = (lead: Lead) => {
    const lane = getLeadLane(lead);
    const company = getLeadCompany(lead);
    const leadName = getLeadName(lead);
    const accountLabel = company ? `${company} (${leadName})` : leadName;
    const value = lead.estimated_value ? ` Estimated value: ${formatCurrency(lead.estimated_value)}.` : "";
    const notes = lead.notes ? ` Context: ${lead.notes}` : "";

    return [
      `Lead: ${accountLabel}.`,
      `Recommended route: ${lane.label}.`,
      `Next action: ${getLeadNextAction(lead)}.`,
      `${lane.detail}${value}${notes}`,
    ].join(" ");
  };

  const getLeadAssistantPrompt = (lead: Lead, mode: "qualify" | "follow_up" | "proposal") => {
    const briefing = getLeadBriefing(lead);

    if (mode === "qualify") {
      return `${briefing}\n\nAct as my Perpetual Core sales operator. Tell me the best next move, the likely buyer objections, what I should ask next, and whether this should be software access, guided setup, first workflow, or a 90-day operating lane.`;
    }

    if (mode === "follow_up") {
      return `${briefing}\n\nDraft a concise follow-up message in my voice. Keep it practical, confident, and focused on the buyer's operating problem. Give me one short email and one text-message version.`;
    }

    return `${briefing}\n\nCreate a proposal outline for this lead. Include business problem, recommended starting lane, scope, timeline, investment framing, proof needed, and the next decision step.`;
  };

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Could not copy text");
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="rounded-xl border border-border bg-background p-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_0.72fr] lg:items-end">
          <div className="max-w-3xl">
            <div className="mb-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Perpetual Core sales command
              </p>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Route every lead into a clear offer, next action, and operating lane.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Use this page to track prospects, decide which public asset to send, and move
              serious buyers from interest into paid software, setup, workflow, or 90-day operating work.
            </p>
          </div>
          <div className="grid gap-3 rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-foreground">Today&apos;s operating target</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Get every active lead to one visible next action.
                </p>
              </div>
              <Button onClick={() => setShowCreateDialog(true)} className="rounded-md">
                <Plus className="mr-2 h-4 w-4" />
                Add Lead
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="rounded-md bg-background p-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Active</p>
                <p className="mt-1 text-xl font-semibold text-foreground">{activeLeads}</p>
              </div>
              <div className="rounded-md bg-background p-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Proposal</p>
                <p className="mt-1 text-xl font-semibold text-foreground">{proposalCount}</p>
              </div>
              <div className="rounded-md bg-background p-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Close</p>
                <p className="mt-1 text-xl font-semibold text-foreground">{closeRate}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-4">
        {SALES_FLOW.map((step, index) => {
          const Icon = step.icon;
          return (
            <div key={step.label} className="rounded-lg border bg-card p-4">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <p className="text-sm font-semibold text-foreground">{step.label}</p>
              <p className="mt-2 text-sm leading-5 text-muted-foreground">{step.detail}</p>
            </div>
          );
        })}
      </div>

      <Card className="rounded-lg border-primary/20 bg-gradient-to-br from-primary/[0.06] via-background to-background shadow-none">
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 flex items-center gap-2">
                <Bot className="h-4 w-4 text-primary" />
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Adaptive AI layer
                </p>
              </div>
              <CardTitle className="text-2xl">Your assistant should travel with the lead, not trap the lead.</CardTitle>
              <CardDescription className="mt-3 text-sm leading-6">
                The dashboard keeps the structure visible, while the assistant adapts the route, message,
                proposal, and onboarding path from the actual lead context and your overrides.
              </CardDescription>
            </div>
            <Button asChild variant="outline" className="rounded-md">
              <Link href="/dashboard/chat">
                Open AI chat <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {ASSISTANT_MODES.map((mode) => {
            const Icon = mode.icon;
            return (
              <div key={mode.label} className="rounded-lg border bg-background p-4">
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-sm font-semibold text-foreground">{mode.label}</p>
                <p className="mt-2 text-sm leading-5 text-muted-foreground">{mode.detail}</p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        {OFFER_ROUTES.map((route) => {
          const Icon = route.icon;
          return (
            <Link
              key={route.href}
              href={route.href}
              className="group rounded-lg border bg-card p-5 transition hover:border-primary/50 hover:bg-primary/[0.03]"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
              </div>
              <p className="text-sm font-semibold text-foreground">{route.label}</p>
              <p className="mt-2 text-sm leading-5 text-muted-foreground">{route.detail}</p>
            </Link>
          );
        })}
      </div>

      <Card className="rounded-lg shadow-none">
        <CardHeader>
          <CardTitle className="text-lg">Fast-start lead templates</CardTitle>
          <CardDescription>
            Use these to capture the type of opportunity you are actively pursuing, then refine the details.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {STARTER_LEADS.map((template) => (
            <button
              key={template.label}
              type="button"
              onClick={() => applyStarterLead(template)}
              className="rounded-lg border bg-card p-4 text-left transition hover:border-primary/50 hover:bg-primary/[0.03]"
            >
              <p className="text-sm font-semibold text-foreground">{template.label}</p>
              <p className="mt-2 text-sm leading-5 text-muted-foreground">{template.title}</p>
              <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
                Start lead <ArrowRight className="ml-1 inline h-3 w-3" />
              </p>
            </button>
          ))}
        </CardContent>
      </Card>

      <div className="rounded-xl border border-border bg-background">
        <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h2 className="text-2xl font-semibold">Pipeline</h2>
          <p className="text-muted-foreground">
            Track prospects from first attention through paid work.
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Lead
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLeads}</div>
            <p className="text-xs text-muted-foreground">
              {activeLeads} active in pipeline
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
            <p className="text-xs text-muted-foreground">
              Total estimated value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Won This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pipeline.won?.count || 0}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(pipeline.won?.value || 0)} closed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {closeRate}%
            </div>
            <p className="text-xs text-muted-foreground">
              Won / Total leads
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 border-t p-6 lg:grid-cols-[0.92fr_1.08fr]">
        <Card className="rounded-lg shadow-none">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg">Priority queue</CardTitle>
                <CardDescription>
                  Highest-value active leads that need movement first.
                </CardDescription>
              </div>
              <ListChecks className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {priorityLeads.length === 0 ? (
              <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
                Add or qualify active leads to build the daily queue.
              </div>
            ) : (
              priorityLeads.map((lead) => {
                const lane = getLeadLane(lead);
                const statusConfig = STATUS_CONFIG[lead.status || "new"] || STATUS_CONFIG.new;
                return (
                  <button
                    key={lead.id}
                    type="button"
                    onClick={() => fetchLeadDetails(lead.id)}
                    className="w-full rounded-lg border bg-card p-4 text-left transition hover:border-primary/50 hover:bg-primary/[0.03]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{getLeadCompany(lead) || getLeadName(lead)}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{getLeadNextAction(lead)}</p>
                      </div>
                      <Badge className={cn("text-xs", statusConfig.color)}>{statusConfig.label}</Badge>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="rounded-md">{lane.label}</Badge>
                      {lead.estimated_value ? (
                        <Badge variant="secondary" className="rounded-md">
                          {formatCurrency(lead.estimated_value)}
                        </Badge>
                      ) : null}
                    </div>
                  </button>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card className="rounded-lg shadow-none">
          <CardHeader>
            <CardTitle className="text-lg">Pipeline health</CardTitle>
            <CardDescription>
              Keep the funnel balanced: enough qualified leads, enough proposals, and enough closed starts.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {[
              { label: "Active pipeline", value: activeLeads, target: Math.max(totalLeads, 1), detail: "Leads still in motion" },
              { label: "Proposal coverage", value: proposalCount, target: Math.max(activeLeads, 1), detail: "Active leads with proposal-stage momentum" },
              { label: "Won conversion", value: pipeline.won?.count || 0, target: Math.max(totalLeads, 1), detail: "Closed starts from the current lead pool" },
            ].map((item) => {
              const pct = Math.min(100, Math.round((item.value / item.target) * 100));
              return (
                <div key={item.label} className="rounded-lg border bg-card p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.label}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
                    </div>
                    <p className="text-sm font-semibold text-foreground">{pct}%</p>
                  </div>
                  <Progress value={pct} className="mt-3 h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 px-6 pb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([value, config]) => (
              <SelectItem key={value} value={value}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            {SOURCE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center border rounded-lg">
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
            className="rounded-r-none"
          >
            List
          </Button>
          <Button
            variant={viewMode === "pipeline" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("pipeline")}
            className="rounded-l-none"
          >
            Pipeline
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 pb-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : viewMode === "list" ? (
          /* List View */
          <div className="space-y-2">
            {leads.length === 0 ? (
              <Card className="p-12 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No leads yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start building your pipeline by adding your first lead
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Lead
                </Button>
              </Card>
            ) : (
              leads.map((lead) => {
                const displayName = getLeadName(lead);
                const company = getLeadCompany(lead);
                const email = getLeadEmail(lead);
                const lane = getLeadLane(lead);
                const statusConfig = STATUS_CONFIG[lead.status || "new"] || STATUS_CONFIG.new;
                const StatusIcon = statusConfig.icon;

                return (
                  <Card
                    key={lead.id}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => fetchLeadDetails(lead.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={lead.contact?.avatar_url} />
                            <AvatarFallback>
                              {getLeadInitials(lead)}
                            </AvatarFallback>
                          </Avatar>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{displayName}</span>
                              <Badge className={cn("text-xs", statusConfig.color)}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {statusConfig.label}
                              </Badge>
                              {lead.lead_score && (
                                <Badge variant="outline" className="text-xs">
                                  Score: {lead.lead_score}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                              {company && (
                                <span className="flex items-center gap-1">
                                  <Building className="h-3 w-3" />
                                  {company}
                                </span>
                              )}
                              {lead.title && <span>{lead.title}</span>}
                              {email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {email}
                                </span>
                              )}
                            </div>
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <Badge variant="outline" className="rounded-md">
                                {lane.label}
                              </Badge>
                              <span className="text-xs font-medium text-muted-foreground">
                                {getLeadNextAction(lead)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          {lead.estimated_value && (
                            <div className="text-right">
                              <div className="font-medium">
                                {formatCurrency(lead.estimated_value)}
                              </div>
                              {lead.probability && (
                                <div className="text-xs text-muted-foreground">
                                  {lead.probability}% probability
                                </div>
                              )}
                            </div>
                          )}

                          <div className="text-right text-sm text-muted-foreground">
                            <div>{formatRelativeTime(lead.created_at)}</div>
                            {lead.next_follow_up_at && (
                              <div className="flex items-center gap-1 text-orange-600">
                                <Clock className="h-3 w-3" />
                                Follow up {formatDate(lead.next_follow_up_at)}
                              </div>
                            )}
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                fetchLeadDetails(lead.id);
                              }}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild onClick={(e) => e.stopPropagation()}>
                                <Link href={`/dashboard/proposals?lead=${lead.id}`}>
                                  <FileText className="h-4 w-4 mr-2" />
                                  Build Proposal
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild onClick={(e) => e.stopPropagation()}>
                                <Link href="/dashboard/sales-script">
                                  <Clipboard className="h-4 w-4 mr-2" />
                                  Open Script
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteLead(lead.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        ) : (
          /* Pipeline View */
          <div className="flex gap-4 h-full overflow-x-auto pb-4">
            {Object.entries(STATUS_CONFIG).map(([status, config]) => {
              const StatusIcon = config.icon;
              const statusLeads = leads.filter(l => l.status === status);
              const statusValue = statusLeads.reduce((sum, l) => sum + (l.estimated_value || 0), 0);

              return (
                <div key={status} className="flex-shrink-0 w-72">
                  <div className={cn("rounded-t-lg p-3", config.color)}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <StatusIcon className="h-4 w-4" />
                        <span className="font-medium">{config.label}</span>
                      </div>
                      <Badge variant="secondary" className="bg-card/50">
                        {statusLeads.length}
                      </Badge>
                    </div>
                    <div className="text-sm mt-1 opacity-80">
                      {formatCurrency(statusValue)}
                    </div>
                  </div>

                  <div className="bg-muted/30 rounded-b-lg p-2 space-y-2 min-h-[200px]">
                    {statusLeads.map((lead) => (
                      <Card
                        key={lead.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => fetchLeadDetails(lead.id)}
                      >
                        <CardContent className="p-3">
                          <div className="font-medium text-sm">{getLeadName(lead)}</div>
                          {getLeadCompany(lead) && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {getLeadCompany(lead)}
                            </div>
                          )}
                          {lead.estimated_value && (
                            <div className="text-sm font-medium mt-2">
                              {formatCurrency(lead.estimated_value)}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            {lead.source && (
                              <Badge variant="outline" className="text-xs">
                                {lead.source}
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      </div>

      {/* Create Lead Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Lead</DialogTitle>
            <DialogDescription>
              Create a new lead to track in your sales pipeline
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Smith"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Acme Inc"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="CEO"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="source">Source</Label>
                <Select
                  value={formData.source}
                  onValueChange={(value) => setFormData({ ...formData, source: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    {SOURCE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="estimated_value">Estimated Value</Label>
                <Input
                  id="estimated_value"
                  type="number"
                  value={formData.estimated_value}
                  onChange={(e) => setFormData({ ...formData, estimated_value: e.target.value })}
                  placeholder="10000"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes about this lead..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateLead} disabled={saving}>
              {saving ? "Creating..." : "Create Lead"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lead Detail Sheet */}
      <Sheet open={showDetailSheet} onOpenChange={setShowDetailSheet}>
        <SheetContent className="sm:max-w-[600px] overflow-y-auto">
          {selectedLead && (
            <>
              <SheetHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={selectedLead.contact?.avatar_url} />
                        <AvatarFallback>
                        {getLeadInitials(selectedLead)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <SheetTitle>{getLeadName(selectedLead)}</SheetTitle>
                      <SheetDescription>
                        {getLeadCompany(selectedLead) && `${getLeadCompany(selectedLead)} • `}
                        {selectedLead.title}
                      </SheetDescription>
                    </div>
                  </div>
                </div>
              </SheetHeader>

              <div className="mt-6">
                <Tabs defaultValue="details">
                  <TabsList className="w-full">
                    <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
                    <TabsTrigger value="proposals" className="flex-1">Proposals</TabsTrigger>
                    <TabsTrigger value="activity" className="flex-1">Activity</TabsTrigger>
                  </TabsList>

                  <TabsContent value="details" className="mt-4 space-y-6">
                    <div className="rounded-lg border bg-primary/[0.03] p-4">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <Label className="text-sm text-muted-foreground">Recommended route</Label>
                          <p className="mt-2 text-lg font-semibold text-foreground">
                            {getLeadLane(selectedLead).label}
                          </p>
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            {getLeadLane(selectedLead).detail}
                          </p>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <Badge variant="secondary" className="rounded-md">
                              {getLeadNextAction(selectedLead)}
                            </Badge>
                            {selectedLead.estimated_value ? (
                              <Badge variant="outline" className="rounded-md">
                                {formatCurrency(selectedLead.estimated_value)}
                              </Badge>
                            ) : null}
                          </div>
                        </div>
                        <div className="grid gap-2 sm:min-w-40">
                          <Button asChild className="rounded-md">
                            <Link href={`/dashboard/proposals?lead=${selectedLead.id}`}>
                              Build proposal
                            </Link>
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="rounded-md"
                            onClick={() => copyText(getLeadBriefing(selectedLead))}
                          >
                            <Clipboard className="mr-2 h-4 w-4" />
                            Copy briefing
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Status */}
                    <div>
                      <Label className="text-sm text-muted-foreground">Status</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {Object.entries(STATUS_CONFIG).map(([status, config]) => {
                          const StatusIcon = config.icon;
                          const isActive = selectedLead.status === status;
                          return (
                            <Button
                              key={status}
                              variant={isActive ? "default" : "outline"}
                              size="sm"
                              className={cn(isActive && config.color)}
                              onClick={() => handleUpdateStatus(selectedLead.id, status)}
                            >
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {config.label}
                            </Button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm text-muted-foreground">Recommended send links</Label>
                      <div className="mt-2 grid gap-2">
                        {OFFER_ROUTES.map((route) => {
                          const Icon = route.icon;
                          return (
                            <Link
                              key={route.href}
                              href={route.href}
                              className="flex items-start gap-3 rounded-lg border p-3 transition hover:border-primary/50 hover:bg-primary/[0.03]"
                            >
                              <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                              <span>
                                <span className="block text-sm font-medium text-foreground">{route.label}</span>
                                <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                                  {route.detail}
                                </span>
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm text-muted-foreground">Next sales actions</Label>
                      <div className="mt-2 grid gap-2">
                        {LEAD_ACTIONS.map((action) => {
                          const Icon = action.icon;
                          return (
                            <Link
                              key={action.label}
                              href={action.href(selectedLead.id)}
                              className="flex items-start gap-3 rounded-lg border bg-card p-3 transition hover:border-primary/50 hover:bg-primary/[0.03]"
                            >
                              <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                              <span>
                                <span className="block text-sm font-medium text-foreground">{action.label}</span>
                                <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                                  {action.detail}
                                </span>
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm text-muted-foreground">Assistant prompts</Label>
                      <div className="mt-2 grid gap-2">
                        {[
                          { label: "Qualify this lead", mode: "qualify" as const, icon: Brain },
                          { label: "Draft follow-up", mode: "follow_up" as const, icon: MessageSquare },
                          { label: "Outline proposal", mode: "proposal" as const, icon: FileText },
                        ].map((prompt) => {
                          const Icon = prompt.icon;
                          return (
                            <button
                              key={prompt.label}
                              type="button"
                              onClick={() => copyText(getLeadAssistantPrompt(selectedLead, prompt.mode))}
                              className="flex items-start gap-3 rounded-lg border bg-card p-3 text-left transition hover:border-primary/50 hover:bg-primary/[0.03]"
                            >
                              <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                              <span>
                                <span className="block text-sm font-medium text-foreground">{prompt.label}</span>
                                <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                                  Copy a context-aware prompt for your AI assistant.
                                </span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-3">
                      <Label className="text-sm text-muted-foreground">Contact Information</Label>
                      {getLeadEmail(selectedLead) && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <a href={`mailto:${getLeadEmail(selectedLead)}`} className="hover:underline">
                            {getLeadEmail(selectedLead)}
                          </a>
                        </div>
                      )}
                      {selectedLead.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <a href={`tel:${selectedLead.phone}`} className="hover:underline">
                            {selectedLead.phone}
                          </a>
                        </div>
                      )}
                      {getLeadCompany(selectedLead) && (
                        <div className="flex items-center gap-2 text-sm">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          {getLeadCompany(selectedLead)}
                        </div>
                      )}
                    </div>

                    {/* Value */}
                    {selectedLead.estimated_value && (
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Deal Value</Label>
                        <div className="flex items-center gap-4">
                          <div className="text-2xl font-bold">
                            {formatCurrency(selectedLead.estimated_value)}
                          </div>
                          {selectedLead.probability && (
                            <Badge variant="outline">
                              {selectedLead.probability}% probability
                            </Badge>
                          )}
                        </div>
                        {selectedLead.expected_close_date && (
                          <div className="text-sm text-muted-foreground">
                            Expected close: {formatDate(selectedLead.expected_close_date)}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Source */}
                    {selectedLead.source && (
                      <div>
                        <Label className="text-sm text-muted-foreground">Source</Label>
                        <div className="mt-1">
                          <Badge variant="outline">
                            {SOURCE_OPTIONS.find(s => s.value === selectedLead.source)?.label || selectedLead.source}
                          </Badge>
                          {selectedLead.source_detail && (
                            <span className="text-sm text-muted-foreground ml-2">
                              {selectedLead.source_detail}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {selectedLead.notes && (
                      <div>
                        <Label className="text-sm text-muted-foreground">Notes</Label>
                        <p className="mt-1 text-sm whitespace-pre-wrap">{selectedLead.notes}</p>
                      </div>
                    )}

                    {/* AI Insights */}
                    {selectedLead.ai_insights && (
                      <div>
                        <Label className="text-sm text-muted-foreground flex items-center gap-1">
                          <Sparkles className="h-3 w-3" />
                          AI Insights
                        </Label>
                        <Card className="mt-2 bg-gradient-to-br from-purple-50 to-blue-50">
                          <CardContent className="p-3 text-sm">
                            {typeof selectedLead.ai_insights === "string"
                              ? selectedLead.ai_insights
                              : JSON.stringify(selectedLead.ai_insights, null, 2)}
                          </CardContent>
                        </Card>
                      </div>
                    )}

                    {/* Timestamps */}
                    <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t">
                      <div>Created: {formatDate(selectedLead.created_at)}</div>
                      <div>Updated: {formatDate(selectedLead.updated_at)}</div>
                      {selectedLead.last_contacted_at && (
                        <div>Last contacted: {formatDate(selectedLead.last_contacted_at)}</div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-4">
                      <Button
                        variant="destructive"
                        className="flex-1"
                        onClick={() => handleDeleteLead(selectedLead.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Lead
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="proposals" className="mt-4">
                    {proposalActivities.length === 0 ? (
                      <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">
                        <FileText className="mx-auto mb-3 h-8 w-8 opacity-50" />
                        <p className="text-sm">No proposal drafts saved for this lead yet.</p>
                        <Button asChild className="mt-4 rounded-md">
                          <Link href={`/dashboard/proposals?lead=${selectedLead.id}`}>
                            Create proposal <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {proposalActivities.map((proposal) => (
                          <div key={proposal.id} className="rounded-lg border bg-card p-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-sm font-semibold">{proposal.title}</p>
                                  {proposal.to_value && (
                                    <Badge variant="outline" className="text-xs">
                                      {proposal.to_value}
                                    </Badge>
                                  )}
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {formatRelativeTime(proposal.created_at)}
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => copyText(proposal.description || "")}
                              >
                                <Clipboard className="mr-2 h-4 w-4" />
                                Copy
                              </Button>
                            </div>
                            {proposal.description && (
                              <pre className="mt-4 max-h-72 overflow-auto whitespace-pre-wrap rounded-md bg-muted p-4 text-sm leading-6 text-muted-foreground">
                                {proposal.description}
                              </pre>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="activity" className="mt-4">
                    {leadActivities.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No activity recorded yet</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {leadActivities.map((activity) => (
                          <div key={activity.id} className="flex gap-3">
                            <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-primary" />
                            <div className="flex-1">
                              <div className="font-medium text-sm">{activity.title}</div>
                              {activity.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {activity.description}
                                </p>
                              )}
                              {activity.from_value && activity.to_value && (
                                <div className="flex items-center gap-2 mt-1 text-xs">
                                  <Badge variant="outline">{activity.from_value}</Badge>
                                  <ArrowRight className="h-3 w-3" />
                                  <Badge variant="outline">{activity.to_value}</Badge>
                                </div>
                              )}
                              <div className="text-xs text-muted-foreground mt-1">
                                {formatRelativeTime(activity.created_at)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
