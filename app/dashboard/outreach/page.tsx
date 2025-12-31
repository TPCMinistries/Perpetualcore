"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Mail,
  Users,
  Play,
  Pause,
  Plus,
  Search,
  MoreHorizontal,
  Trash2,
  Edit2,
  ArrowRight,
  CheckCircle2,
  MessageSquare,
  TrendingUp,
  Loader2,
  Send,
  Clock,
  Target,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Sequence {
  id: string;
  name: string;
  description?: string;
  status: "draft" | "active" | "paused" | "completed" | "archived";
  sequence_type: string;
  steps: any[];
  total_enrolled: number;
  total_completed: number;
  total_replied: number;
  total_converted: number;
  created_at: string;
  updated_at: string;
  started_at?: string;
}

const statusColors: Record<string, { bg: string; text: string }> = {
  draft: { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-600 dark:text-gray-400" },
  active: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-600 dark:text-green-400" },
  paused: { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-600 dark:text-yellow-400" },
  completed: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-600 dark:text-blue-400" },
  archived: { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-500" },
};

const typeLabels: Record<string, string> = {
  outreach: "Cold Outreach",
  nurture: "Lead Nurture",
  onboarding: "Onboarding",
  follow_up: "Follow-up",
  custom: "Custom",
};

export default function OutreachPage() {
  const router = useRouter();
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showNewSequence, setShowNewSequence] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [newSequence, setNewSequence] = useState({
    name: "",
    description: "",
    sequence_type: "outreach",
  });

  useEffect(() => {
    fetchSequences();
  }, [statusFilter]);

  const fetchSequences = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);

      const response = await fetch(`/api/outreach?${params}`);
      if (response.ok) {
        const data = await response.json();
        setSequences(data.sequences || []);
      }
    } catch (error) {
      console.error("Error fetching sequences:", error);
      toast.error("Failed to load sequences");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSequence = async () => {
    if (!newSequence.name.trim()) {
      toast.error("Sequence name is required");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSequence),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success("Sequence created!");
        setShowNewSequence(false);
        setNewSequence({ name: "", description: "", sequence_type: "outreach" });
        router.push(`/dashboard/outreach/${data.sequence.id}`);
      } else {
        const err = await response.json();
        toast.error(err.error || "Failed to create sequence");
      }
    } catch (error) {
      toast.error("Error creating sequence");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/outreach/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast.success(`Sequence ${newStatus === "active" ? "started" : newStatus}`);
        fetchSequences();
      }
    } catch (error) {
      toast.error("Failed to update sequence");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to archive this sequence?")) return;

    try {
      const response = await fetch(`/api/outreach/${id}`, { method: "DELETE" });
      if (response.ok) {
        toast.success("Sequence archived");
        fetchSequences();
      }
    } catch (error) {
      toast.error("Failed to archive sequence");
    }
  };

  // Filter sequences
  const filteredSequences = sequences.filter((seq) =>
    seq.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate stats
  const activeSequences = sequences.filter((s) => s.status === "active").length;
  const totalEnrolled = sequences.reduce((sum, s) => sum + (s.total_enrolled || 0), 0);
  const totalReplied = sequences.reduce((sum, s) => sum + (s.total_replied || 0), 0);
  const replyRate = totalEnrolled > 0 ? Math.round((totalReplied / totalEnrolled) * 100) : 0;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Outreach Sequences</h1>
          <p className="text-muted-foreground">
            Automate your outreach with multi-step email sequences
          </p>
        </div>
        <Button onClick={() => setShowNewSequence(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Sequence
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Zap className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeSequences}</p>
                <p className="text-sm text-muted-foreground">Active Sequences</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalEnrolled}</p>
                <p className="text-sm text-muted-foreground">Total Enrolled</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalReplied}</p>
                <p className="text-sm text-muted-foreground">Total Replies</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{replyRate}%</p>
                <p className="text-sm text-muted-foreground">Reply Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search sequences..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sequences List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredSequences.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">No sequences yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first outreach sequence to start automating your outreach
            </p>
            <Button onClick={() => setShowNewSequence(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Sequence
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredSequences.map((sequence) => (
            <Card
              key={sequence.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/dashboard/outreach/${sequence.id}`)}
            >
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <Send className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{sequence.name}</h3>
                        <Badge
                          className={cn(
                            "text-xs",
                            statusColors[sequence.status]?.bg,
                            statusColors[sequence.status]?.text
                          )}
                        >
                          {sequence.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span>{typeLabels[sequence.sequence_type] || sequence.sequence_type}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {sequence.steps?.length || 0} steps
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {/* Stats */}
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <p className="font-semibold">{sequence.total_enrolled || 0}</p>
                        <p className="text-xs text-muted-foreground">Enrolled</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold">{sequence.total_replied || 0}</p>
                        <p className="text-xs text-muted-foreground">Replied</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold">{sequence.total_converted || 0}</p>
                        <p className="text-xs text-muted-foreground">Converted</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {sequence.status === "draft" && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusChange(sequence.id, "active")}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Start
                        </Button>
                      )}
                      {sequence.status === "active" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(sequence.id, "paused")}
                        >
                          <Pause className="h-4 w-4 mr-1" />
                          Pause
                        </Button>
                      )}
                      {sequence.status === "paused" && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusChange(sequence.id, "active")}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Resume
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => router.push(`/dashboard/outreach/${sequence.id}`)}
                          >
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit Sequence
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDelete(sequence.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Archive
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* New Sequence Dialog */}
      <Dialog open={showNewSequence} onOpenChange={setShowNewSequence}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Sequence</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Sequence Name *</label>
              <Input
                placeholder="e.g., Cold Outreach - SaaS Founders"
                value={newSequence.name}
                onChange={(e) => setNewSequence({ ...newSequence, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Description</label>
              <Textarea
                placeholder="What is this sequence for?"
                value={newSequence.description}
                onChange={(e) => setNewSequence({ ...newSequence, description: e.target.value })}
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Sequence Type</label>
              <Select
                value={newSequence.sequence_type}
                onValueChange={(v) => setNewSequence({ ...newSequence, sequence_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="outreach">Cold Outreach</SelectItem>
                  <SelectItem value="nurture">Lead Nurture</SelectItem>
                  <SelectItem value="onboarding">Onboarding</SelectItem>
                  <SelectItem value="follow_up">Follow-up</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewSequence(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSequence} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Sequence
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
