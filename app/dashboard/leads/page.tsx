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
  CalendarCheck,
  WandSparkles,
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
  notes?: string | null;
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

type AssistantPromptMode = "qualify" | "follow_up" | "proposal";
type OutboundCopyMode = "warm_follow_up" | "proposal_frame" | "cost_frame" | "invoice_handoff" | "kickoff_note";

interface AssistantRecommendation {
  generatedAt: string;
  leadName: string;
  score: number;
  route: string;
  nextAction: string;
  followUp: string;
  reasoning: string[];
  questions: string[];
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

const FOLLOW_UP_PRESETS = [
  { label: "Today", days: 0, detail: "Use when the lead is active or warm right now." },
  { label: "Tomorrow", days: 1, detail: "Use after a first touch, intro, or soft reply." },
  { label: "3 days", days: 3, detail: "Use after sending packages, map, or a proposal." },
  { label: "1 week", days: 7, detail: "Use for nurture, lower urgency, or waiting on internal review." },
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

const OUTBOUND_COPY_ACTIONS: Array<{
  label: string;
  detail: string;
  mode: OutboundCopyMode;
  icon: LucideIcon;
}> = [
  {
    label: "Warm follow-up",
    detail: "Send after a conversation when the next step is still soft.",
    mode: "warm_follow_up",
    icon: MessageSquare,
  },
  {
    label: "Proposal frame",
    detail: "Use when the buyer needs the recommended lane explained clearly.",
    mode: "proposal_frame",
    icon: FileText,
  },
  {
    label: "Cost frame",
    detail: "Use when pricing comes up before scope is fully settled.",
    mode: "cost_frame",
    icon: DollarSign,
  },
  {
    label: "Invoice handoff",
    detail: "Use when they are ready to start and need payment/admin next steps.",
    mode: "invoice_handoff",
    icon: CreditCard,
  },
  {
    label: "Kickoff note",
    detail: "Use after payment or verbal yes to start delivery cleanly.",
    mode: "kickoff_note",
    icon: CalendarCheck,
  },
];

const CLOSE_PACKAGES = [
  {
    id: "software-access",
    label: "Software Access",
    fit: "Product-only buyer",
    detail: "Use when they want to get inside the system before paying for implementation.",
  },
  {
    id: "guided-setup",
    label: "Guided Setup",
    fit: "Small first invoice",
    detail: "Use when they trust you but need a contained starting point.",
  },
  {
    id: "first-workflow",
    label: "First Workflow Package",
    fit: "Clear operating pain",
    detail: "Use when one workflow is costing time, revenue, or visibility right now.",
  },
  {
    id: "operating-lane-deposit",
    label: "90-Day Operating Lane",
    fit: "AI consultant/operator",
    detail: "Use when they want the broader Perpetual Core operating relationship.",
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
  const [savingFollowUp, setSavingFollowUp] = useState<string | null>(null);
  const [savingAssistantPlan, setSavingAssistantPlan] = useState(false);
  const [savingWorkingSession, setSavingWorkingSession] = useState(false);
  const [savingLeadProfile, setSavingLeadProfile] = useState(false);
  const [initialLeadHandled, setInitialLeadHandled] = useState(false);
  const [workingSession, setWorkingSession] = useState({
    operatingPain: "",
    buyer: "",
    objection: "",
    proofNeeded: "",
    nextMove: "",
  });
  const [leadProfile, setLeadProfile] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    title: "",
    source: "",
    estimated_value: "",
    notes: "",
  });

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

  useEffect(() => {
    if (initialLeadHandled || loading || leads.length === 0) return;
    const leadParam = new URLSearchParams(window.location.search).get("lead");
    if (!leadParam) {
      setInitialLeadHandled(true);
      return;
    }

    const matchingLead = leads.find((lead) => lead.id === leadParam);
    if (matchingLead) {
      fetchLeadDetails(matchingLead.id);
    }
    setInitialLeadHandled(true);
  }, [initialLeadHandled, leads, loading]);

  useEffect(() => {
    if (!selectedLead) return;

    setLeadProfile({
      name: getLeadName(selectedLead) === "Unnamed lead" ? "" : getLeadName(selectedLead),
      email: getLeadEmail(selectedLead),
      phone: selectedLead.phone || "",
      company: getLeadCompany(selectedLead),
      title: selectedLead.title || "",
      source: selectedLead.source || "",
      estimated_value: selectedLead.estimated_value ? String(selectedLead.estimated_value) : "",
      notes: selectedLead.notes || "",
    });
  }, [selectedLead]);

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
  const activeLeads = leads.filter(l => !["won", "lost"].includes(l.status || "new")).length;
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
  const dueFollowUps = leads.filter((lead) => {
    if (!lead.next_follow_up_at || ["won", "lost"].includes(lead.status || "new")) return false;
    return new Date(lead.next_follow_up_at).getTime() <= Date.now();
  });

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
  const getRecommendedPackageId = (lead: Lead) => {
    const value = lead.estimated_value || 0;
    const text = `${lead.title || ""} ${lead.notes || ""}`.toLowerCase();

    if (value >= 15000 || text.includes("enterprise") || text.includes("operating system")) {
      return "operating-lane-deposit";
    }

    if (value >= 7500 || text.includes("workflow")) {
      return "first-workflow";
    }

    if (value >= 1000 || text.includes("setup")) {
      return "guided-setup";
    }

    return "software-access";
  };

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

  const getLeadPrimaryHref = (lead: Lead) => {
    const status = lead.status || "new";

    if (status === "qualified" || status === "proposal") {
      return `/dashboard/proposals?lead=${encodeURIComponent(lead.id)}`;
    }

    if (status === "negotiation") {
      return `/packages?lead=${encodeURIComponent(lead.id)}&package=${encodeURIComponent(getRecommendedPackageId(lead))}`;
    }

    if (status === "won") {
      return `/dashboard/accounts?lead=${encodeURIComponent(lead.id)}`;
    }

    return `/dashboard/leads?lead=${encodeURIComponent(lead.id)}`;
  };

  const getLeadPrimaryLabel = (lead: Lead) => {
    const status = lead.status || "new";

    if (status === "qualified" || status === "proposal") return "Build proposal";
    if (status === "negotiation") return "Send package";
    if (status === "won") return "Open account";
    return "Open lead";
  };

  const shouldOpenLeadInline = (lead: Lead) => {
    const status = lead.status || "new";
    return status === "new" || status === "contacted" || status === "lost";
  };

  const getQuickStatusAction = (lead: Lead) => {
    const status = lead.status || "new";

    if (status === "new") {
      return { label: "Mark contacted", status: "contacted" };
    }

    if (status === "contacted") {
      return { label: "Mark qualified", status: "qualified" };
    }

    if (status === "qualified") {
      return { label: "Move to proposal", status: "proposal" };
    }

    if (status === "proposal") {
      return { label: "Move to negotiation", status: "negotiation" };
    }

    return null;
  };

  const getCloseReadiness = (lead: Lead) => {
    const status = lead.status || "new";
    const hasContact = Boolean(getLeadEmail(lead) || lead.phone);
    const hasCompany = Boolean(getLeadCompany(lead));
    const hasValue = Boolean(lead.estimated_value);
    const hasNotes = Boolean(lead.notes && lead.notes.length > 40);
    const isLateStage = ["qualified", "proposal", "negotiation", "won"].includes(status);
    const score = [hasContact, hasCompany, hasValue, hasNotes, isLateStage].filter(Boolean).length;

    if (status === "won") {
      return {
        label: "Ready for account onboarding",
        detail: "This lead is won. Move the relationship into Accounts and confirm the delivery lane.",
        score,
      };
    }

    if (score >= 4) {
      return {
        label: "Ready to send a paid path",
        detail: "Enough context exists to send the right package, proposal, or invoice path.",
        score,
      };
    }

    if (score >= 2) {
      return {
        label: "Needs one more qualification step",
        detail: "Clarify buyer authority, workflow pain, value, or implementation scope before asking for payment.",
        score,
      };
    }

    return {
      label: "Qualify before closing",
      detail: "Capture the buyer, company, problem, and first operating lane before sending a package.",
      score,
    };
  };

  const getAssistantScore = (lead: Lead) => {
    const value = lead.estimated_value || 0;
    const hasContact = Boolean(getLeadEmail(lead) || lead.phone);
    const hasCompany = Boolean(getLeadCompany(lead));
    const hasNotes = Boolean(lead.notes && lead.notes.length > 30);
    const statusWeight: Record<string, number> = {
      new: 8,
      contacted: 16,
      qualified: 24,
      proposal: 30,
      negotiation: 34,
      won: 100,
      lost: 0,
    };

    const valueScore = value >= 30000 ? 28 : value >= 15000 ? 22 : value >= 7500 ? 16 : value >= 1000 ? 10 : 4;
    const contextScore = (hasContact ? 10 : 0) + (hasCompany ? 10 : 0) + (hasNotes ? 10 : 0);
    return Math.min(100, valueScore + contextScore + (statusWeight[lead.status || "new"] || 8));
  };

  const getAssistantRecommendation = (lead: Lead): AssistantRecommendation => {
    const lane = getLeadLane(lead);
    const score = lead.lead_score || getAssistantScore(lead);
    const status = lead.status || "new";
    const company = getLeadCompany(lead);
    const route = lane.label;
    const needsBuyer = !getLeadEmail(lead) && !lead.phone;
    const needsScope = !lead.notes || lead.notes.length < 40;
    const highIntent = ["qualified", "proposal", "negotiation"].includes(status);

    return {
      generatedAt: new Date().toISOString(),
      leadName: getLeadName(lead),
      score,
      route,
      nextAction: getLeadNextAction(lead),
      followUp: highIntent ? "Schedule a 24-72 hour follow-up tied to a decision step." : "Set the next touch before this lead leaves the queue.",
      reasoning: [
        company ? `Company context exists: ${company}.` : "Company context is missing; qualify the account before quoting.",
        lead.estimated_value ? `Estimated value is ${formatCurrency(lead.estimated_value)}.` : "No estimated value yet; ask what the workflow or operating gap is costing.",
        `Recommended route is ${route} because ${lane.detail.toLowerCase()}`,
      ],
      questions: [
        needsBuyer ? "Who owns the decision and what is the best direct contact?" : "Who else needs to approve the first engagement?",
        needsScope ? "Which workflow, revenue leak, or operating bottleneck should we solve first?" : "What evidence would make this urgent enough to start now?",
        "Do they need software access, implementation help, or an operating partner relationship?",
      ],
    };
  };

  const getCurrentAssistantInsight = (lead: Lead): AssistantRecommendation | null => {
    if (!lead.ai_insights || typeof lead.ai_insights !== "object" || Array.isArray(lead.ai_insights)) {
      return null;
    }

    const insight = lead.ai_insights as Partial<AssistantRecommendation>;
    if (!insight.route || !insight.nextAction) {
      return null;
    }

    return {
      generatedAt: insight.generatedAt || lead.updated_at,
      leadName: insight.leadName || getLeadName(lead),
      score: typeof insight.score === "number" ? insight.score : getAssistantScore(lead),
      route: insight.route,
      nextAction: insight.nextAction,
      followUp: insight.followUp || "Set a next touch before this lead leaves the queue.",
      reasoning: Array.isArray(insight.reasoning) ? insight.reasoning : [],
      questions: Array.isArray(insight.questions) ? insight.questions : [],
    };
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

  const getLeadAssistantPrompt = (lead: Lead, mode: AssistantPromptMode) => {
    const briefing = getLeadBriefing(lead);

    if (mode === "qualify") {
      return `${briefing}\n\nAct as my Perpetual Core sales operator. Tell me the best next move, the likely buyer objections, what I should ask next, and whether this should be software access, guided setup, first workflow, or a 90-day operating lane.`;
    }

    if (mode === "follow_up") {
      return `${briefing}\n\nDraft a concise follow-up message in my voice. Keep it practical, confident, and focused on the buyer's operating problem. Give me one short email and one text-message version.`;
    }

    return `${briefing}\n\nCreate a proposal outline for this lead. Include business problem, recommended starting lane, scope, timeline, investment framing, proof needed, and the next decision step.`;
  };

  const getOutboundCopy = (lead: Lead, mode: OutboundCopyMode) => {
    const leadName = getLeadName(lead);
    const company = getLeadCompany(lead);
    const lane = getLeadLane(lead);
    const packageId = getRecommendedPackageId(lead);
    const packageLink = `https://www.perpetualcore.com/packages?lead=${lead.id}&package=${packageId}`;
    const account = company ? company : leadName;
    const pain = lead.notes
      ? `Based on what you shared, the operating issue I am anchoring on is: ${lead.notes}`
      : "Based on what you shared, I would start by clarifying the highest-value workflow before we install anything.";

    if (mode === "warm_follow_up") {
      return `Subject: Next step for ${account}\n\n${leadName},\n\nGood speaking with you. ${pain}\n\nI would not start this as a generic AI conversation. I would start with the operating lane that can create the clearest business value, then expand once the first lane is working.\n\nThe path I would recommend right now is ${lane.label}. The next step is to confirm the workflow, owner, systems involved, and what proof would make this worth moving on.\n\nHere is the starter path if you want to review it: ${packageLink}`;
    }

    if (mode === "proposal_frame") {
      return `Proposal frame for ${account}\n\nRecommended lane: ${lane.label}\n\nWhy this lane:\n${lane.detail}\n\nBusiness problem:\n${pain}\n\nScope to confirm:\n1. Workflow or department we are starting with\n2. Systems, inboxes, docs, or data sources involved\n3. Who owns decisions and who uses the system\n4. What a successful first 30 days should prove\n\nNext decision:\nApprove the starting lane, then we move into payment/admin and kickoff.`;
    }

    if (mode === "cost_frame") {
      return `${leadName},\n\nThere are two parts to this: software access and implementation.\n\nThe software gives the account a place to operate. The implementation is where the value is created: mapping the workflow, connecting context, shaping the assistant behavior, training the team, and making sure the process actually runs.\n\nFor ${account}, I would not over-scope the first move. I would start with ${lane.label}, prove value in one lane, and then decide whether it should expand into a broader operating relationship.\n\nReview the starting path here: ${packageLink}`;
    }

    if (mode === "invoice_handoff") {
      return `${leadName},\n\nTo start, I would set this up as ${lane.label}.\n\nOnce payment/admin is complete, I will confirm the kickoff window, collect the access/context needed, and open the first operating lane. The first goal is not a demo. The first goal is to get a useful workflow live and visible.\n\nPayment/start link: ${packageLink}\n\nAfter that, I will send the kickoff checklist and first working session agenda.`;
    }

    return `${leadName},\n\nWe are ready to start the ${lane.label} lane for ${account}.\n\nKickoff focus:\n1. Confirm the first workflow and owner\n2. Gather the core docs, links, systems, and examples\n3. Define what the assistant should do and what it should avoid\n4. Set the first delivery checkpoint\n5. Decide what needs to be measured or reported\n\nI will use the first session to turn the context into a working operating lane, not just a loose AI brainstorm.`;
  };

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Could not copy text");
    }
  };

  const updateLead = async (leadId: string, updates: Partial<Lead>) => {
    const res = await fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });

    if (!res.ok) {
      throw new Error("Failed to update lead");
    }

    const data = (await res.json()) as { lead: Lead };
    setLeads((current) => current.map((lead) => (lead.id === leadId ? { ...lead, ...data.lead } : lead)));
    if (selectedLead?.id === leadId) {
      setSelectedLead(data.lead);
      fetchLeadDetails(leadId);
    }
    return data.lead;
  };

  const handleSetFollowUp = async (lead: Lead, days: number) => {
    try {
      setSavingFollowUp(`${lead.id}-${days}`);
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + days);
      dueDate.setHours(10, 0, 0, 0);
      await updateLead(lead.id, { next_follow_up_at: dueDate.toISOString() });
      toast.success(`Follow-up set for ${formatDate(dueDate.toISOString())}`);
      fetchLeads();
    } catch (error) {
      console.error("Error setting follow-up:", error);
      toast.error("Could not set follow-up");
    } finally {
      setSavingFollowUp(null);
    }
  };

  const handleSaveAssistantPlan = async (lead: Lead) => {
    try {
      setSavingAssistantPlan(true);
      const recommendation = getAssistantRecommendation(lead);
      await updateLead(lead.id, {
        ai_insights: recommendation,
        lead_score: recommendation.score,
      });
      toast.success("Assistant plan saved to lead");
      fetchLeads();
    } catch (error) {
      console.error("Error saving assistant plan:", error);
      toast.error("Could not save assistant plan");
    } finally {
      setSavingAssistantPlan(false);
    }
  };

  const handleSaveLeadProfile = async (lead: Lead) => {
    if (!leadProfile.name.trim()) {
      toast.error("Lead name is required");
      return;
    }

    const estimatedValue = leadProfile.estimated_value.trim()
      ? Number(leadProfile.estimated_value)
      : undefined;

    if (estimatedValue !== undefined && Number.isNaN(estimatedValue)) {
      toast.error("Estimated value must be a number");
      return;
    }

    try {
      setSavingLeadProfile(true);
      await updateLead(lead.id, {
        name: leadProfile.name.trim(),
        email: leadProfile.email.trim() || undefined,
        phone: leadProfile.phone.trim() || undefined,
        company: leadProfile.company.trim() || undefined,
        title: leadProfile.title.trim() || undefined,
        source: leadProfile.source || undefined,
        estimated_value: estimatedValue,
        notes: leadProfile.notes.trim() || null,
      });
      toast.success("Lead profile updated");
      fetchLeads();
    } catch (error) {
      console.error("Error saving lead profile:", error);
      toast.error("Could not update lead profile");
    } finally {
      setSavingLeadProfile(false);
    }
  };

  const handleSaveWorkingSession = async (lead: Lead, shouldQualify = false) => {
    const entries = [
      ["Operating pain", workingSession.operatingPain],
      ["Buyer / authority", workingSession.buyer],
      ["Objection / risk", workingSession.objection],
      ["Proof needed", workingSession.proofNeeded],
      ["Next move", workingSession.nextMove],
    ].filter(([, value]) => value.trim());

    if (entries.length === 0) {
      toast.error("Add at least one working-session note");
      return;
    }

    try {
      setSavingWorkingSession(true);
      const sessionNote = [
        `Working session - ${new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}`,
        ...entries.map(([label, value]) => `${label}: ${value.trim()}`),
      ].join("\n");
      const nextNotes = [lead.notes, sessionNote].filter(Boolean).join("\n\n");
      const updates: Partial<Lead> = { notes: nextNotes };

      if (shouldQualify && !["qualified", "proposal", "negotiation", "won"].includes(lead.status || "new")) {
        updates.status = "qualified";
      }

      await updateLead(lead.id, updates);
      setWorkingSession({
        operatingPain: "",
        buyer: "",
        objection: "",
        proofNeeded: "",
        nextMove: "",
      });
      toast.success(shouldQualify ? "Working session saved and lead qualified" : "Working session saved");
      fetchLeads();
    } catch (error) {
      console.error("Error saving working session:", error);
      toast.error("Could not save working session");
    } finally {
      setSavingWorkingSession(false);
    }
  };

  const actionConsole = [
    {
      label: "Follow up now",
      detail: "Leads with a next touch due or overdue.",
      icon: CalendarCheck,
      leads: dueFollowUps.slice(0, 4),
      empty: "No due follow-ups right now.",
    },
    {
      label: "Send paid path",
      detail: "Leads with enough context for package, proposal, or invoice movement.",
      icon: CreditCard,
      leads: leads
        .filter((lead) => {
          if (["won", "lost"].includes(lead.status || "new")) return false;
          return getCloseReadiness(lead).score >= 4;
        })
        .slice(0, 4),
      empty: "No lead is fully ready for a paid path yet.",
    },
    {
      label: "Qualify next",
      detail: "Leads that need buyer, pain, value, or company context before quoting.",
      icon: Search,
      leads: leads
        .filter((lead) => {
          if (["won", "lost"].includes(lead.status || "new")) return false;
          return getCloseReadiness(lead).score < 4;
        })
        .sort((a, b) => (b.estimated_value || 0) - (a.estimated_value || 0))
        .slice(0, 4),
      empty: "No qualification backlog.",
    },
  ];

  const readinessChecks = [
    {
      label: "Every active lead has a next touch",
      detail: "No prospect should sit in the pipeline without a date or action.",
      icon: CalendarCheck,
      blockerLabel: "Missing follow-up",
      leads: leads
        .filter((lead) => !["won", "lost"].includes(lead.status || "new") && !lead.next_follow_up_at)
        .slice(0, 3),
      cta: "Set follow-up",
    },
    {
      label: "Every serious lead has value and scope",
      detail: "You need enough signal to price software, setup, workflow, or operating work.",
      icon: Target,
      blockerLabel: "Needs scope",
      leads: leads
        .filter((lead) => {
          if (["won", "lost"].includes(lead.status || "new")) return false;
          const hasValue = Boolean(lead.estimated_value);
          const hasScope = Boolean(lead.notes && lead.notes.length > 40);
          return !hasValue || !hasScope;
        })
        .sort((a, b) => (b.estimated_value || 0) - (a.estimated_value || 0))
        .slice(0, 3),
      cta: "Add context",
    },
    {
      label: "Late-stage leads have a close path",
      detail: "Qualified, proposal, and negotiation leads should point to proposal, package, or account handoff.",
      icon: CreditCard,
      blockerLabel: "Needs close path",
      leads: leads
        .filter((lead) => ["qualified", "proposal", "negotiation"].includes(lead.status || "new"))
        .filter((lead) => getCloseReadiness(lead).score < 4)
        .slice(0, 3),
      cta: "Review close path",
    },
    {
      label: "Won leads move into Accounts",
      detail: "Closed buyers should leave the sales list and show up as delivery/account work.",
      icon: PackageCheck,
      blockerLabel: "Needs handoff",
      leads: leads.filter((lead) => (lead.status || "new") === "won").slice(0, 3),
      cta: "Open account",
    },
  ];

  const readinessBlockerCount = readinessChecks.reduce((sum, check) => sum + check.leads.length, 0);
  const readinessScore = Math.max(0, Math.round(((readinessChecks.length * 3 - readinessBlockerCount) / (readinessChecks.length * 3)) * 100));

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
            <CardTitle className="text-sm font-medium">Due Follow-ups</CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dueFollowUps.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {closeRate}% won / total leads
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
                      <Badge variant="outline" className="rounded-md">
                        AI score {lead.lead_score || getAssistantScore(lead)}
                      </Badge>
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
              { label: "Follow-up discipline", value: leads.filter((lead) => lead.next_follow_up_at).length, target: Math.max(activeLeads, 1), detail: "Active leads with a next touch scheduled" },
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

      <div className="border-t p-6">
        <Card className="rounded-lg shadow-none">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="text-lg">Action console</CardTitle>
                <CardDescription>
                  Work the pipeline by next move instead of opening every lead to figure out what to do.
                </CardDescription>
              </div>
              <Button asChild variant="outline" className="rounded-md">
                <Link href="/dashboard/accounts">
                  Accounts handoff <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-3">
            {actionConsole.map((lane) => {
              const Icon = lane.icon;
              return (
                <div key={lane.label} className="rounded-lg border bg-card p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                          <Icon className="h-4 w-4" />
                        </div>
                        <p className="text-sm font-semibold text-foreground">{lane.label}</p>
                      </div>
                      <p className="mt-2 text-sm leading-5 text-muted-foreground">{lane.detail}</p>
                    </div>
                    <Badge variant="outline" className="rounded-md">
                      {lane.leads.length}
                    </Badge>
                  </div>

                  <div className="mt-4 space-y-2">
                    {lane.leads.length === 0 ? (
                      <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                        {lane.empty}
                      </div>
                    ) : (
                      lane.leads.map((lead) => {
                        const statusConfig = STATUS_CONFIG[lead.status || "new"] || STATUS_CONFIG.new;
                        const leadCompany = getLeadCompany(lead);
                        const quickStatusAction = getQuickStatusAction(lead);
                        return (
                          <div key={lead.id} className="rounded-md border bg-background p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-foreground">
                                  {leadCompany || getLeadName(lead)}
                                </p>
                                <p className="mt-1 truncate text-xs text-muted-foreground">
                                  {leadCompany ? getLeadName(lead) : getLeadNextAction(lead)}
                                </p>
                              </div>
                              <Badge className={cn("shrink-0 text-xs", statusConfig.color)}>
                                {statusConfig.label}
                              </Badge>
                            </div>
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <Badge variant="outline" className="rounded-md">
                                {getLeadLane(lead).label}
                              </Badge>
                              {lead.estimated_value ? (
                                <Badge variant="secondary" className="rounded-md">
                                  {formatCurrency(lead.estimated_value)}
                                </Badge>
                              ) : null}
                              {lead.next_follow_up_at ? (
                                <Badge variant="outline" className="rounded-md">
                                  Touch {formatDate(lead.next_follow_up_at)}
                                </Badge>
                              ) : null}
                            </div>
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-8 rounded-md"
                                onClick={() => fetchLeadDetails(lead.id)}
                              >
                                Review
                              </Button>
                              {shouldOpenLeadInline(lead) ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  className="h-8 rounded-md"
                                  onClick={() => fetchLeadDetails(lead.id)}
                                >
                                  {getLeadPrimaryLabel(lead)}
                                </Button>
                              ) : (
                                <Button asChild size="sm" className="h-8 rounded-md">
                                  <Link href={getLeadPrimaryHref(lead)}>
                                    {getLeadPrimaryLabel(lead)}
                                  </Link>
                                </Button>
                              )}
                              {quickStatusAction ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 rounded-md"
                                  onClick={() => handleUpdateStatus(lead.id, quickStatusAction.status)}
                                >
                                  {quickStatusAction.label}
                                </Button>
                              ) : null}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div className="border-t p-6">
        <Card className="rounded-lg border-primary/20 shadow-none">
          <CardHeader>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-2xl">
                <div className="mb-3 flex items-center gap-2">
                  <ListChecks className="h-4 w-4 text-primary" />
                  <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Ship readiness
                  </p>
                </div>
                <CardTitle className="text-lg">Sales system readiness</CardTitle>
                <CardDescription className="mt-2">
                  These are the operating checks that make the dashboard usable every day, not just impressive on screen.
                </CardDescription>
              </div>
              <div className="w-full rounded-lg border bg-muted/30 p-4 lg:w-64">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-foreground">Ready score</p>
                  <p className="text-2xl font-semibold text-foreground">{readinessScore}%</p>
                </div>
                <Progress value={readinessScore} className="mt-3 h-2" />
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  {readinessBlockerCount === 0
                    ? "No sales-system blockers in the visible pipeline."
                    : `${readinessBlockerCount} visible blocker${readinessBlockerCount === 1 ? "" : "s"} to clear.`}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-4">
            {readinessChecks.map((check) => {
              const Icon = check.icon;
              const isClear = check.leads.length === 0;
              return (
                <div key={check.label} className="rounded-lg border bg-card p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <Badge variant={isClear ? "secondary" : "outline"} className="rounded-md">
                      {isClear ? "Clear" : `${check.leads.length} open`}
                    </Badge>
                  </div>
                  <p className="mt-4 text-sm font-semibold text-foreground">{check.label}</p>
                  <p className="mt-2 text-sm leading-5 text-muted-foreground">{check.detail}</p>

                  <div className="mt-4 space-y-2">
                    {isClear ? (
                      <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                        This check is clean.
                      </div>
                    ) : (
                      check.leads.map((lead) => (
                        <button
                          key={`${check.label}-${lead.id}`}
                          type="button"
                          onClick={() => fetchLeadDetails(lead.id)}
                          className="w-full rounded-md border bg-background p-3 text-left transition hover:border-primary/50 hover:bg-primary/[0.03]"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-foreground">
                                {getLeadCompany(lead) || getLeadName(lead)}
                              </p>
                              <p className="mt-1 truncate text-xs text-muted-foreground">
                                {check.cta}
                              </p>
                            </div>
                            <Badge variant="outline" className="shrink-0 rounded-md">
                              {check.blockerLabel}
                            </Badge>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
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

                    <div className="rounded-lg border bg-card p-4">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <Label className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Building className="h-4 w-4 text-primary" />
                            Lead profile
                          </Label>
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            Keep the buyer record accurate before you route, price, propose, or hand off the account.
                          </p>
                        </div>
                        <Button
                          type="button"
                          className="rounded-md"
                          disabled={savingLeadProfile}
                          onClick={() => handleSaveLeadProfile(selectedLead)}
                        >
                          {savingLeadProfile ? "Saving..." : "Save profile"}
                        </Button>
                      </div>

                      <div className="mt-4 grid gap-3">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <Label htmlFor="leadProfileName" className="text-xs text-muted-foreground">
                              Contact name
                            </Label>
                            <Input
                              id="leadProfileName"
                              value={leadProfile.name}
                              onChange={(event) =>
                                setLeadProfile((current) => ({ ...current, name: event.target.value }))
                              }
                              className="mt-1"
                              placeholder="Primary buyer"
                            />
                          </div>
                          <div>
                            <Label htmlFor="leadProfileCompany" className="text-xs text-muted-foreground">
                              Company
                            </Label>
                            <Input
                              id="leadProfileCompany"
                              value={leadProfile.company}
                              onChange={(event) =>
                                setLeadProfile((current) => ({ ...current, company: event.target.value }))
                              }
                              className="mt-1"
                              placeholder="Company or account"
                            />
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <Label htmlFor="leadProfileEmail" className="text-xs text-muted-foreground">
                              Email
                            </Label>
                            <Input
                              id="leadProfileEmail"
                              type="email"
                              value={leadProfile.email}
                              onChange={(event) =>
                                setLeadProfile((current) => ({ ...current, email: event.target.value }))
                              }
                              className="mt-1"
                              placeholder="buyer@company.com"
                            />
                          </div>
                          <div>
                            <Label htmlFor="leadProfilePhone" className="text-xs text-muted-foreground">
                              Phone
                            </Label>
                            <Input
                              id="leadProfilePhone"
                              value={leadProfile.phone}
                              onChange={(event) =>
                                setLeadProfile((current) => ({ ...current, phone: event.target.value }))
                              }
                              className="mt-1"
                              placeholder="+1 (555) 000-0000"
                            />
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                          <div>
                            <Label htmlFor="leadProfileTitle" className="text-xs text-muted-foreground">
                              Opportunity title
                            </Label>
                            <Input
                              id="leadProfileTitle"
                              value={leadProfile.title}
                              onChange={(event) =>
                                setLeadProfile((current) => ({ ...current, title: event.target.value }))
                              }
                              className="mt-1"
                              placeholder="AI operating system opportunity"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Source</Label>
                            <Select
                              value={leadProfile.source}
                              onValueChange={(value) =>
                                setLeadProfile((current) => ({ ...current, source: value }))
                              }
                            >
                              <SelectTrigger className="mt-1">
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
                          <div>
                            <Label htmlFor="leadProfileValue" className="text-xs text-muted-foreground">
                              Estimated value
                            </Label>
                            <Input
                              id="leadProfileValue"
                              type="number"
                              min="0"
                              value={leadProfile.estimated_value}
                              onChange={(event) =>
                                setLeadProfile((current) => ({ ...current, estimated_value: event.target.value }))
                              }
                              className="mt-1"
                              placeholder="30000"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="leadProfileNotes" className="text-xs text-muted-foreground">
                            Sales notes
                          </Label>
                          <Textarea
                            id="leadProfileNotes"
                            value={leadProfile.notes}
                            onChange={(event) =>
                              setLeadProfile((current) => ({ ...current, notes: event.target.value }))
                            }
                            className="mt-1 min-h-24"
                            placeholder="Relationship context, active pain, buyer language, budget signal, objections, and what would make this worth moving on."
                          />
                          <p className="mt-2 text-xs leading-5 text-muted-foreground">
                            These notes feed the recommended route, outbound kit, assistant prompts, and proposal framing.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border bg-card p-4">
                      {(() => {
                        const readiness = getCloseReadiness(selectedLead);
                        const recommendedPackage = getRecommendedPackageId(selectedLead);
                        const selectedPackage = CLOSE_PACKAGES.find((pkg) => pkg.id === recommendedPackage) || CLOSE_PACKAGES[0];
                        const packageHref = `/packages?lead=${encodeURIComponent(selectedLead.id)}&package=${encodeURIComponent(selectedPackage.id)}`;
                        return (
                          <div className="space-y-4">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <Label className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <CreditCard className="h-4 w-4 text-primary" />
                                  Close path
                                </Label>
                                <p className="mt-2 text-base font-semibold text-foreground">{readiness.label}</p>
                                <p className="mt-1 text-sm leading-6 text-muted-foreground">{readiness.detail}</p>
                              </div>
                              <Badge variant="outline" className="w-fit rounded-md">
                                {readiness.score}/5 context
                              </Badge>
                            </div>

                            <div className="rounded-md border bg-background p-3">
                              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                                Recommended package
                              </p>
                              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                  <p className="text-sm font-semibold text-foreground">{selectedPackage.label}</p>
                                  <p className="mt-1 text-sm leading-5 text-muted-foreground">
                                    {selectedPackage.detail}
                                  </p>
                                </div>
                                <Button asChild className="shrink-0 rounded-md">
                                  <Link href={packageHref}>
                                    Send package <ArrowRight className="ml-2 h-4 w-4" />
                                  </Link>
                                </Button>
                              </div>
                            </div>

                            <div className="grid gap-2 sm:grid-cols-2">
                              <Button asChild variant="outline" className="rounded-md">
                                <Link href={`/contact-sales?intent=manual-invoice&lead=${encodeURIComponent(selectedLead.id)}`}>
                                  Manual invoice path
                                </Link>
                              </Button>
                              <Button asChild variant="outline" className="rounded-md">
                                <Link href={`/dashboard/accounts?lead=${encodeURIComponent(selectedLead.id)}`}>
                                  Open in Accounts
                                </Link>
                              </Button>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    <div className="rounded-lg border bg-card p-4">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <Label className="flex items-center gap-2 text-sm text-muted-foreground">
                            <ListChecks className="h-4 w-4 text-primary" />
                            Working session
                          </Label>
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            Capture what you learned on the call so the assistant, proposal, close path,
                            and account handoff have real operating context.
                          </p>
                        </div>
                        <Badge variant="outline" className="w-fit rounded-md">
                          Discovery memory
                        </Badge>
                      </div>

                      <div className="mt-4 grid gap-3">
                        <div>
                          <Label htmlFor="operatingPain" className="text-xs text-muted-foreground">
                            Operating pain
                          </Label>
                          <Textarea
                            id="operatingPain"
                            value={workingSession.operatingPain}
                            onChange={(event) =>
                              setWorkingSession((current) => ({
                                ...current,
                                operatingPain: event.target.value,
                              }))
                            }
                            placeholder="What workflow, revenue leak, follow-up gap, or visibility problem did they name?"
                            className="mt-1 min-h-20"
                          />
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <Label htmlFor="buyer" className="text-xs text-muted-foreground">
                              Buyer / authority
                            </Label>
                            <Textarea
                              id="buyer"
                              value={workingSession.buyer}
                              onChange={(event) =>
                                setWorkingSession((current) => ({
                                  ...current,
                                  buyer: event.target.value,
                                }))
                              }
                              placeholder="Who decides, who influences, and who has to use it?"
                              className="mt-1 min-h-20"
                            />
                          </div>
                          <div>
                            <Label htmlFor="objection" className="text-xs text-muted-foreground">
                              Objection / risk
                            </Label>
                            <Textarea
                              id="objection"
                              value={workingSession.objection}
                              onChange={(event) =>
                                setWorkingSession((current) => ({
                                  ...current,
                                  objection: event.target.value,
                                }))
                              }
                              placeholder="Budget, timing, trust, access, complexity, or internal resistance?"
                              className="mt-1 min-h-20"
                            />
                          </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <Label htmlFor="proofNeeded" className="text-xs text-muted-foreground">
                              Proof needed
                            </Label>
                            <Textarea
                              id="proofNeeded"
                              value={workingSession.proofNeeded}
                              onChange={(event) =>
                                setWorkingSession((current) => ({
                                  ...current,
                                  proofNeeded: event.target.value,
                                }))
                              }
                              placeholder="What would make the buyer comfortable saying yes?"
                              className="mt-1 min-h-20"
                            />
                          </div>
                          <div>
                            <Label htmlFor="nextMove" className="text-xs text-muted-foreground">
                              Next move
                            </Label>
                            <Textarea
                              id="nextMove"
                              value={workingSession.nextMove}
                              onChange={(event) =>
                                setWorkingSession((current) => ({
                                  ...current,
                                  nextMove: event.target.value,
                                }))
                              }
                              placeholder="Send map, package, proposal, invoice, schedule call, or ask for access?"
                              className="mt-1 min-h-20"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-md"
                          disabled={savingWorkingSession}
                          onClick={() => handleSaveWorkingSession(selectedLead)}
                        >
                          {savingWorkingSession ? "Saving..." : "Save session"}
                        </Button>
                        <Button
                          type="button"
                          className="rounded-md"
                          disabled={savingWorkingSession}
                          onClick={() => handleSaveWorkingSession(selectedLead, true)}
                        >
                          {savingWorkingSession ? "Saving..." : "Save and qualify"}
                        </Button>
                      </div>
                    </div>

                    <div className="rounded-lg border bg-card p-4">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <Label className="flex items-center gap-2 text-sm text-muted-foreground">
                            <WandSparkles className="h-4 w-4 text-primary" />
                            Assistant plan
                          </Label>
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            Save the current recommendation to this lead so the assistant can carry the route,
                            score, questions, and follow-up context into proposals and client work.
                          </p>
                        </div>
                        <Button
                          type="button"
                          className="rounded-md"
                          disabled={savingAssistantPlan}
                          onClick={() => handleSaveAssistantPlan(selectedLead)}
                        >
                          <Brain className="mr-2 h-4 w-4" />
                          {savingAssistantPlan ? "Saving..." : "Save AI plan"}
                        </Button>
                      </div>

                      {(() => {
                        const insight = getCurrentAssistantInsight(selectedLead);
                        const recommendation = insight || getAssistantRecommendation(selectedLead);
                        return (
                          <div className="mt-4 grid gap-3">
                            <div className="grid gap-3 sm:grid-cols-3">
                              <div className="rounded-md border bg-background p-3">
                                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                                  Score
                                </p>
                                <p className="mt-2 text-xl font-semibold">{recommendation.score}</p>
                              </div>
                              <div className="rounded-md border bg-background p-3 sm:col-span-2">
                                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                                  Route
                                </p>
                                <p className="mt-2 text-sm font-semibold">{recommendation.route}</p>
                              </div>
                            </div>
                            <div className="rounded-md border bg-background p-3">
                              <p className="text-sm font-semibold text-foreground">{recommendation.nextAction}</p>
                              <p className="mt-1 text-sm leading-6 text-muted-foreground">{recommendation.followUp}</p>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div className="rounded-md border bg-background p-3">
                                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                                  Reasoning
                                </p>
                                <ul className="mt-2 space-y-2 text-sm leading-5 text-muted-foreground">
                                  {recommendation.reasoning.map((item) => (
                                    <li key={item}>{item}</li>
                                  ))}
                                </ul>
                              </div>
                              <div className="rounded-md border bg-background p-3">
                                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                                  Ask next
                                </p>
                                <ul className="mt-2 space-y-2 text-sm leading-5 text-muted-foreground">
                                  {recommendation.questions.map((item) => (
                                    <li key={item}>{item}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    <div>
                      <Label className="text-sm text-muted-foreground">Schedule next touch</Label>
                      <div className="mt-2 grid gap-2 sm:grid-cols-4">
                        {FOLLOW_UP_PRESETS.map((preset) => (
                          <button
                            key={preset.label}
                            type="button"
                            disabled={savingFollowUp === `${selectedLead.id}-${preset.days}`}
                            onClick={() => handleSetFollowUp(selectedLead, preset.days)}
                            className="rounded-lg border bg-card p-3 text-left transition hover:border-primary/50 hover:bg-primary/[0.03] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <span className="block text-sm font-semibold text-foreground">
                              {savingFollowUp === `${selectedLead.id}-${preset.days}` ? "Saving..." : preset.label}
                            </span>
                            <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                              {preset.detail}
                            </span>
                          </button>
                        ))}
                      </div>
                      {selectedLead.next_follow_up_at ? (
                        <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                          <CalendarCheck className="h-4 w-4 text-primary" />
                          Next follow-up: {formatDate(selectedLead.next_follow_up_at)}
                        </p>
                      ) : null}
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
                      <Label className="text-sm text-muted-foreground">Outbound kit</Label>
                      <div className="mt-2 grid gap-2">
                        {OUTBOUND_COPY_ACTIONS.map((action) => {
                          const Icon = action.icon;
                          return (
                            <button
                              key={action.label}
                              type="button"
                              onClick={() => copyText(getOutboundCopy(selectedLead, action.mode))}
                              className="flex items-start gap-3 rounded-lg border bg-card p-3 text-left transition hover:border-primary/50 hover:bg-primary/[0.03]"
                            >
                              <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                              <span>
                                <span className="block text-sm font-medium text-foreground">{action.label}</span>
                                <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                                  {action.detail}
                                </span>
                              </span>
                            </button>
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
