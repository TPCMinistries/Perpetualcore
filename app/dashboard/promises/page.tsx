"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Handshake,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Trash2,
  ArrowRight,
  AlertTriangle,
  User,
  Building,
  Video,
  Calendar as CalendarIcon,
  Loader2,
  Edit2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  DropdownMenuSeparator,
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

interface Meeting {
  meeting_title: string;
  meeting_date: string;
}

interface Promise {
  id: string;
  promise_text: string;
  promiser_contact_id?: string;
  promisee_contact_id?: string;
  due_date?: string;
  status: "pending" | "fulfilled" | "broken";
  context?: string;
  importance?: "low" | "medium" | "high" | "critical";
  reminder_sent?: boolean;
  meeting_id?: string;
  meetings?: Meeting;
  created_at: string;
  updated_at?: string;
}

const statusConfig = {
  pending: {
    label: "Pending",
    icon: Clock,
    bg: "bg-amber-50 dark:bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-500/30",
  },
  fulfilled: {
    label: "Fulfilled",
    icon: CheckCircle2,
    bg: "bg-green-50 dark:bg-green-500/10",
    text: "text-green-600 dark:text-green-400",
    border: "border-green-200 dark:border-green-500/30",
  },
  broken: {
    label: "Broken",
    icon: XCircle,
    bg: "bg-red-50 dark:bg-red-500/10",
    text: "text-red-600 dark:text-red-400",
    border: "border-red-200 dark:border-red-500/30",
  },
};

const importanceColors = {
  low: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400",
  medium: "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
  high: "bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400",
  critical: "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400",
};

export default function PromisesPage() {
  const router = useRouter();
  const [promises, setPromises] = useState<Promise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showNewPromise, setShowNewPromise] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [total, setTotal] = useState(0);

  const [newPromise, setNewPromise] = useState({
    promise_text: "",
    due_date: "",
    importance: "medium",
    context: "",
  });

  useEffect(() => {
    fetchPromises();
  }, [statusFilter]);

  const fetchPromises = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      params.append("limit", "100");

      const response = await fetch(`/api/promises?${params}`);
      if (response.ok) {
        const data = await response.json();
        setPromises(data.promises || []);
        setTotal(data.total || 0);
      }
    } catch (error) {
      console.error("Failed to fetch promises:", error);
    } finally {
      setLoading(false);
    }
  };

  const createPromise = async () => {
    if (!newPromise.promise_text.trim()) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/promises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promise_text: newPromise.promise_text,
          due_date: newPromise.due_date || null,
          importance: newPromise.importance,
          context: newPromise.context || null,
        }),
      });

      if (response.ok) {
        setNewPromise({
          promise_text: "",
          due_date: "",
          importance: "medium",
          context: "",
        });
        setShowNewPromise(false);
        fetchPromises();
      }
    } catch (error) {
      console.error("Failed to create promise:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const updatePromiseStatus = async (promiseId: string, status: string) => {
    try {
      const response = await fetch(`/api/promises/${promiseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        fetchPromises();
      }
    } catch (error) {
      console.error("Failed to update promise:", error);
    }
  };

  const deletePromise = async (promiseId: string) => {
    try {
      const response = await fetch(`/api/promises/${promiseId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchPromises();
      }
    } catch (error) {
      console.error("Failed to delete promise:", error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const getDueStatus = (dueDate?: string) => {
    if (!dueDate) return null;
    const date = new Date(dueDate);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days < 0) return { text: "Overdue", urgent: true, days: Math.abs(days) };
    if (days === 0) return { text: "Due today", urgent: true, days: 0 };
    if (days === 1) return { text: "Due tomorrow", urgent: false, days: 1 };
    if (days <= 7) return { text: `Due in ${days} days`, urgent: false, days };
    return { text: formatDate(dueDate), urgent: false, days };
  };

  const filteredPromises = promises.filter((p) =>
    searchQuery
      ? p.promise_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.context?.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  const pendingCount = promises.filter((p) => p.status === "pending").length;
  const fulfilledCount = promises.filter((p) => p.status === "fulfilled").length;
  const brokenCount = promises.filter((p) => p.status === "broken").length;
  const overdueCount = promises.filter((p) => {
    if (p.status !== "pending" || !p.due_date) return false;
    return new Date(p.due_date) < new Date();
  }).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg shadow-rose-500/25">
                <Handshake className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Promises</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                  Track commitments made in meetings
                </p>
              </div>
            </div>

            <Dialog open={showNewPromise} onOpenChange={setShowNewPromise}>
              <DialogTrigger asChild>
                <Button className="h-11 px-5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white shadow-lg shadow-rose-500/25 border-0">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Promise
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Promise</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Promise</Label>
                    <Textarea
                      placeholder="What was promised?"
                      value={newPromise.promise_text}
                      onChange={(e) => setNewPromise({ ...newPromise, promise_text: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Due Date (optional)</Label>
                      <Input
                        type="date"
                        value={newPromise.due_date}
                        onChange={(e) => setNewPromise({ ...newPromise, due_date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Importance</Label>
                      <Select
                        value={newPromise.importance}
                        onValueChange={(value) => setNewPromise({ ...newPromise, importance: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Context (optional)</Label>
                    <Input
                      placeholder="Additional context about this promise"
                      value={newPromise.context}
                      onChange={(e) => setNewPromise({ ...newPromise, context: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowNewPromise(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={createPromise}
                    disabled={submitting || !newPromise.promise_text.trim()}
                    className="bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white border-0"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Promise"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card className="border-0 shadow-sm bg-amber-50 dark:bg-amber-500/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">Pending</p>
                    <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{pendingCount}</p>
                  </div>
                  <Clock className="h-8 w-8 text-amber-500/50" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm bg-green-50 dark:bg-green-500/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 dark:text-green-400 font-medium">Fulfilled</p>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">{fulfilledCount}</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-green-500/50" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm bg-red-50 dark:bg-red-500/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-red-600 dark:text-red-400 font-medium">Broken</p>
                    <p className="text-2xl font-bold text-red-700 dark:text-red-300">{brokenCount}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-500/50" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm bg-orange-50 dark:bg-orange-500/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">Overdue</p>
                    <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{overdueCount}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-orange-500/50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search promises..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white dark:bg-slate-800/50"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] bg-white dark:bg-slate-800/50">
                <Filter className="h-4 w-4 mr-2 text-slate-400" />
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="fulfilled">Fulfilled</SelectItem>
                <SelectItem value="broken">Broken</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Promises List */}
        {filteredPromises.length === 0 ? (
          <div className="text-center py-16">
            <div className="h-20 w-20 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-6">
              <Handshake className="h-10 w-10 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              No promises yet
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              Promises from meetings will appear here, or create one manually
            </p>
            <Button
              onClick={() => setShowNewPromise(true)}
              variant="outline"
              className="border-slate-200 dark:border-slate-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Promise
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPromises.map((promise) => {
              const config = statusConfig[promise.status];
              const StatusIcon = config.icon;
              const dueStatus = getDueStatus(promise.due_date);

              return (
                <Card
                  key={promise.id}
                  className={`border-0 shadow-lg shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-800/50 hover:shadow-xl transition-all group ${
                    promise.status === "fulfilled" ? "opacity-70" : ""
                  }`}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      {/* Status indicator */}
                      <button
                        onClick={() => {
                          if (promise.status === "pending") {
                            updatePromiseStatus(promise.id, "fulfilled");
                          } else if (promise.status === "fulfilled") {
                            updatePromiseStatus(promise.id, "pending");
                          }
                        }}
                        className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center transition-colors ${config.bg} ${config.text} hover:opacity-80`}
                      >
                        <StatusIcon className="h-4 w-4" />
                      </button>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-base ${promise.status === "fulfilled" ? "line-through text-slate-400 dark:text-slate-500" : "text-slate-800 dark:text-slate-200"}`}>
                          {promise.promise_text}
                        </p>

                        {promise.context && (
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            {promise.context}
                          </p>
                        )}

                        {/* Meta row */}
                        <div className="flex items-center gap-3 mt-3 flex-wrap">
                          {/* From meeting */}
                          {promise.meetings && (
                            <button
                              onClick={() => router.push(`/dashboard/meetings/${promise.meeting_id}`)}
                              className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"
                            >
                              <Video className="h-3 w-3" />
                              {promise.meetings.meeting_title}
                            </button>
                          )}

                          {/* Due date */}
                          {dueStatus && promise.status === "pending" && (
                            <span
                              className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                                dueStatus.urgent
                                  ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10"
                                  : "text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/50"
                              }`}
                            >
                              <CalendarIcon className="h-3 w-3" />
                              {dueStatus.text}
                            </span>
                          )}

                          {/* Importance */}
                          {promise.importance && promise.importance !== "medium" && (
                            <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full ${importanceColors[promise.importance]}`}>
                              {promise.importance.charAt(0).toUpperCase() + promise.importance.slice(1)}
                            </span>
                          )}

                          {/* Status badge (for non-pending) */}
                          {promise.status !== "pending" && (
                            <Badge className={`${config.bg} ${config.text} border-0`}>
                              {config.label}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4 text-slate-400" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => updatePromiseStatus(promise.id, "fulfilled")}>
                              <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                              Mark Fulfilled
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updatePromiseStatus(promise.id, "broken")}>
                              <XCircle className="h-4 w-4 mr-2 text-red-500" />
                              Mark Broken
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updatePromiseStatus(promise.id, "pending")}>
                              <Clock className="h-4 w-4 mr-2 text-amber-500" />
                              Mark Pending
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => deletePromise(promise.id)}
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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
