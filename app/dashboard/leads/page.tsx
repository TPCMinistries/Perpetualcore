"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Phone,
  Mail,
  Building,
  DollarSign,
  Calendar,
  TrendingUp,
  UserCheck,
  UserX,
  Clock,
  ArrowRight,
  Edit,
  Trash2,
  Eye,
  Target,
  Sparkles,
  ChevronRight,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  status: string;
  stage?: string;
  source?: string;
  source_detail?: string;
  estimated_value?: number;
  probability?: number;
  expected_close_date?: string;
  notes?: string;
  tags?: string[];
  lead_score?: number;
  ai_insights?: any;
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
const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
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

export default function LeadsPage() {
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
    if (!confirm("Are you sure you want to delete this lead?")) return;

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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h1 className="text-2xl font-semibold">Leads</h1>
          <p className="text-muted-foreground">
            Manage your sales pipeline and track potential customers
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
              {totalLeads > 0
                ? Math.round(((pipeline.won?.count || 0) / totalLeads) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Won / Total leads
            </p>
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
                const statusConfig = STATUS_CONFIG[lead.status] || STATUS_CONFIG.new;
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
                              {lead.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                            </AvatarFallback>
                          </Avatar>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{lead.name}</span>
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
                              {lead.company && (
                                <span className="flex items-center gap-1">
                                  <Building className="h-3 w-3" />
                                  {lead.company}
                                </span>
                              )}
                              {lead.title && <span>{lead.title}</span>}
                              {lead.email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {lead.email}
                                </span>
                              )}
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
                      <Badge variant="secondary" className="bg-white/50">
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
                          <div className="font-medium text-sm">{lead.name}</div>
                          {lead.company && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {lead.company}
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
                        {selectedLead.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <SheetTitle>{selectedLead.name}</SheetTitle>
                      <SheetDescription>
                        {selectedLead.company && `${selectedLead.company} • `}
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
                    <TabsTrigger value="activity" className="flex-1">Activity</TabsTrigger>
                  </TabsList>

                  <TabsContent value="details" className="mt-4 space-y-6">
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

                    {/* Contact Info */}
                    <div className="space-y-3">
                      <Label className="text-sm text-muted-foreground">Contact Information</Label>
                      {selectedLead.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <a href={`mailto:${selectedLead.email}`} className="hover:underline">
                            {selectedLead.email}
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
                      {selectedLead.company && (
                        <div className="flex items-center gap-2 text-sm">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          {selectedLead.company}
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
