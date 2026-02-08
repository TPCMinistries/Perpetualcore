"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Search as SearchIcon,
  Plus,
  MoreHorizontal,
  Trash2,
  ArrowRight,
  Loader2,
  Building,
  User,
  TrendingUp,
  DollarSign,
  Globe,
  Lightbulb,
  Clock,
  CheckCircle2,
  XCircle,
  Sparkles,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  DashboardPageWrapper,
  DashboardHeader,
} from "@/components/ui/dashboard-header";
import { StatCard, StatCardGrid } from "@/components/ui/stat-card";
import { FilterPills } from "@/components/ui/filter-pills";

interface Contact {
  id: string;
  name: string;
  email?: string;
  company?: string;
}

interface ResearchRequest {
  id: string;
  request_type: string;
  subject: string;
  context?: string;
  specific_questions?: string[];
  priority: string;
  status: string;
  executive_summary?: string;
  key_findings?: string[];
  confidence_score?: number;
  contact_id?: string;
  contacts?: Contact;
  created_at: string;
  updated_at?: string;
}

interface Stats {
  total: number;
  pending: number;
  researching: number;
  completed: number;
  urgent: number;
}

const requestTypeConfig: Record<
  string,
  { icon: any; label: string; color: string }
> = {
  investor: { icon: DollarSign, label: "Investor", color: "text-emerald-500" },
  partner: { icon: Building, label: "Partner", color: "text-blue-500" },
  competitor: { icon: TrendingUp, label: "Competitor", color: "text-orange-500" },
  grant: { icon: FileText, label: "Grant", color: "text-violet-500" },
  market: { icon: Globe, label: "Market", color: "text-cyan-500" },
  person: { icon: User, label: "Person", color: "text-pink-500" },
  company: { icon: Building, label: "Company", color: "text-indigo-500" },
  industry: { icon: TrendingUp, label: "Industry", color: "text-amber-500" },
  technology: { icon: Lightbulb, label: "Technology", color: "text-purple-500" },
  custom: { icon: SearchIcon, label: "Custom", color: "text-slate-500" },
};

const statusConfig: Record<
  string,
  { icon: any; label: string; bg: string; text: string }
> = {
  pending: {
    icon: Clock,
    label: "Pending",
    bg: "bg-slate-100 dark:bg-slate-800",
    text: "text-slate-600 dark:text-slate-400",
  },
  queued: {
    icon: Clock,
    label: "Queued",
    bg: "bg-amber-50 dark:bg-amber-900/20",
    text: "text-amber-600 dark:text-amber-400",
  },
  researching: {
    icon: Loader2,
    label: "Researching",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    text: "text-blue-600 dark:text-blue-400",
  },
  completed: {
    icon: CheckCircle2,
    label: "Completed",
    bg: "bg-green-50 dark:bg-green-900/20",
    text: "text-green-600 dark:text-green-400",
  },
  failed: {
    icon: XCircle,
    label: "Failed",
    bg: "bg-red-50 dark:bg-red-900/20",
    text: "text-red-600 dark:text-red-400",
  },
  cancelled: {
    icon: XCircle,
    label: "Cancelled",
    bg: "bg-slate-100 dark:bg-slate-800",
    text: "text-slate-500 dark:text-slate-500",
  },
};

const priorityColors: Record<string, string> = {
  low: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  medium: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  high: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
  urgent: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.3 },
  }),
};

function ResearchSkeleton() {
  return (
    <DashboardPageWrapper maxWidth="6xl">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Skeleton className="h-14 w-14 rounded-2xl" />
          <div>
            <Skeleton className="h-8 w-40 mb-2" />
            <Skeleton className="h-4 w-56" />
          </div>
        </div>
        <Skeleton className="h-11 w-36" />
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>

      {/* Filter skeleton */}
      <Skeleton className="h-10 w-full max-w-md mb-6" />

      {/* List skeleton */}
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    </DashboardPageWrapper>
  );
}

export default function ResearchPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<ResearchRequest[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [newRequest, setNewRequest] = useState({
    request_type: "company",
    subject: "",
    context: "",
    specific_questions: "",
    priority: "medium",
  });

  useEffect(() => {
    fetchRequests();
  }, [statusFilter, typeFilter]);

  const fetchRequests = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      if (typeFilter !== "all") {
        params.append("type", typeFilter);
      }
      params.append("limit", "100");

      const response = await fetch(`/api/research?${params}`);
      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests || []);
        setStats(data.stats || null);
      }
    } catch (error) {
      console.error("Failed to fetch research requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const createRequest = async () => {
    if (!newRequest.subject.trim()) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_type: newRequest.request_type,
          subject: newRequest.subject,
          context: newRequest.context || null,
          specific_questions: newRequest.specific_questions
            ? newRequest.specific_questions.split("\n").filter((q) => q.trim())
            : [],
          priority: newRequest.priority,
        }),
      });

      if (response.ok) {
        setNewRequest({
          request_type: "company",
          subject: "",
          context: "",
          specific_questions: "",
          priority: "medium",
        });
        setShowNewRequest(false);
        fetchRequests();
      }
    } catch (error) {
      console.error("Failed to create research request:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteRequest = async (requestId: string) => {
    try {
      const response = await fetch(`/api/research/${requestId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchRequests();
      }
    } catch (error) {
      console.error("Failed to delete research request:", error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const filteredRequests = requests.filter((r) =>
    searchQuery
      ? r.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.context?.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  const statusFilterOptions = [
    { id: "all", label: "All" },
    { id: "pending", label: "Pending" },
    { id: "queued", label: "Queued" },
    { id: "researching", label: "In Progress" },
    { id: "completed", label: "Completed" },
    { id: "failed", label: "Failed" },
  ];

  if (loading) {
    return <ResearchSkeleton />;
  }

  return (
    <DashboardPageWrapper maxWidth="6xl">
      <DashboardHeader
        title="Research Hub"
        subtitle="AI-powered research on demand"
        icon={SearchIcon}
        iconColor="violet"
        stats={[
          { label: "total", value: stats?.total || 0 },
          { label: "in progress", value: stats?.researching || 0 },
        ]}
        actions={
          <Dialog open={showNewRequest} onOpenChange={setShowNewRequest}>
            <DialogTrigger asChild>
              <Button className="h-11 px-5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-violet-500/25 border-0">
                <Plus className="h-4 w-4 mr-2" />
                New Research
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Request AI Research</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Research Type</Label>
                    <Select
                      value={newRequest.request_type}
                      onValueChange={(value) =>
                        setNewRequest({ ...newRequest, request_type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="investor">Investor</SelectItem>
                        <SelectItem value="partner">Partner</SelectItem>
                        <SelectItem value="competitor">Competitor</SelectItem>
                        <SelectItem value="grant">Grant</SelectItem>
                        <SelectItem value="market">Market</SelectItem>
                        <SelectItem value="person">Person</SelectItem>
                        <SelectItem value="company">Company</SelectItem>
                        <SelectItem value="industry">Industry</SelectItem>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select
                      value={newRequest.priority}
                      onValueChange={(value) =>
                        setNewRequest({ ...newRequest, priority: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input
                    placeholder="e.g., Sequoia Capital, OpenAI, Climate Tech Market"
                    value={newRequest.subject}
                    onChange={(e) =>
                      setNewRequest({ ...newRequest, subject: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Context (optional)</Label>
                  <Textarea
                    placeholder="Why do you need this research? What decision will it inform?"
                    value={newRequest.context}
                    onChange={(e) =>
                      setNewRequest({ ...newRequest, context: e.target.value })
                    }
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Specific Questions (one per line, optional)</Label>
                  <Textarea
                    placeholder="What is their typical check size?&#10;Who are their key partners?&#10;What's their thesis?"
                    value={newRequest.specific_questions}
                    onChange={(e) =>
                      setNewRequest({
                        ...newRequest,
                        specific_questions: e.target.value,
                      })
                    }
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowNewRequest(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={createRequest}
                  disabled={submitting || !newRequest.subject.trim()}
                  className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white border-0"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Start Research
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Stats Grid */}
      <StatCardGrid columns={5} className="mb-8">
        <StatCard
          label="Total"
          value={stats?.total || 0}
          icon={SearchIcon}
          iconColor="violet"
        />
        <StatCard
          label="Pending"
          value={stats?.pending || 0}
          icon={Clock}
          iconColor="amber"
        />
        <StatCard
          label="In Progress"
          value={stats?.researching || 0}
          icon={Loader2}
          iconColor="blue"
        />
        <StatCard
          label="Completed"
          value={stats?.completed || 0}
          icon={CheckCircle2}
          iconColor="green"
        />
        <StatCard
          label="Urgent"
          value={stats?.urgent || 0}
          icon={AlertTriangle}
          iconColor="red"
        />
      </StatCardGrid>

      {/* Filters Row */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search research..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
          />
        </div>
        <FilterPills
          filters={statusFilterOptions}
          activeFilter={statusFilter}
          onFilterChange={setStatusFilter}
        />
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[150px] bg-white dark:bg-slate-800/50">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="investor">Investor</SelectItem>
            <SelectItem value="partner">Partner</SelectItem>
            <SelectItem value="competitor">Competitor</SelectItem>
            <SelectItem value="grant">Grant</SelectItem>
            <SelectItem value="market">Market</SelectItem>
            <SelectItem value="person">Person</SelectItem>
            <SelectItem value="company">Company</SelectItem>
            <SelectItem value="industry">Industry</SelectItem>
            <SelectItem value="technology">Technology</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Research List */}
      {filteredRequests.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <div className="h-20 w-20 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-6">
            <SearchIcon className="h-10 w-10 text-slate-400 dark:text-slate-500" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
            No research requests yet
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            Start your first AI research request
          </p>
          <Button
            onClick={() => setShowNewRequest(true)}
            variant="outline"
            className="border-slate-200 dark:border-slate-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Research
          </Button>
        </motion.div>
      ) : (
        <div className="grid gap-4">
          {filteredRequests.map((request, index) => {
            const typeConf =
              requestTypeConfig[request.request_type] || requestTypeConfig.custom;
            const statusConf =
              statusConfig[request.status] || statusConfig.pending;
            const TypeIcon = typeConf.icon;
            const StatusIcon = statusConf.icon;

            return (
              <motion.div
                key={request.id}
                custom={index}
                initial="hidden"
                animate="visible"
                variants={cardVariants}
              >
                <Card
                  onClick={() => router.push(`/dashboard/research/${request.id}`)}
                  className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-lg hover:shadow-violet-500/5 hover:border-violet-200 dark:hover:border-violet-800/50 transition-all cursor-pointer group"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <TypeIcon className={cn("h-5 w-5", typeConf.color)} />
                          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                            {typeConf.label}
                          </span>
                          <Badge
                            className={cn(
                              "text-xs",
                              statusConf.bg,
                              statusConf.text,
                              "border-0"
                            )}
                          >
                            <StatusIcon
                              className={cn(
                                "h-3 w-3 mr-1",
                                request.status === "researching" && "animate-spin"
                              )}
                            />
                            {statusConf.label}
                          </Badge>
                          <Badge
                            className={cn(
                              "text-xs",
                              priorityColors[request.priority]
                            )}
                          >
                            {request.priority}
                          </Badge>
                        </div>

                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                          {request.subject}
                        </h3>

                        {request.context && (
                          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-1 mb-2">
                            {request.context}
                          </p>
                        )}

                        {request.status === "completed" &&
                          request.executive_summary && (
                            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-2 bg-green-50 dark:bg-green-900/20 p-2 rounded-lg border border-green-200 dark:border-green-800/50">
                              <Sparkles className="h-3 w-3 inline mr-1 text-green-500" />
                              {request.executive_summary}
                            </p>
                          )}

                        {/* Meta row */}
                        <div className="flex items-center gap-3 mt-3">
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {formatDate(request.created_at)}
                          </span>

                          {request.key_findings &&
                            request.key_findings.length > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {request.key_findings.length} finding
                                {request.key_findings.length > 1 ? "s" : ""}
                              </Badge>
                            )}

                          {request.confidence_score && (
                            <Badge variant="outline" className="text-xs">
                              {Math.round(request.confidence_score * 100)}%
                              confidence
                            </Badge>
                          )}

                          {request.contacts && (
                            <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                              <User className="h-3 w-3" />
                              {request.contacts.name}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            asChild
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <MoreHorizontal className="h-4 w-4 text-slate-400" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/dashboard/research/${request.id}`);
                              }}
                            >
                              <ArrowRight className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteRequest(request.id);
                              }}
                              className="text-red-600 dark:text-red-400"
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
              </motion.div>
            );
          })}
        </div>
      )}
    </DashboardPageWrapper>
  );
}
