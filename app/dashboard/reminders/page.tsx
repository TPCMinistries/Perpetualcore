"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Bell,
  Plus,
  Search,
  Clock,
  CheckCircle2,
  AlarmClock,
  Calendar,
  MoreHorizontal,
  Trash2,
  Edit,
  AlertTriangle,
  MessageSquare,
  Zap,
  X,
  ChevronRight,
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
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Reminder {
  id: string;
  title: string;
  description?: string;
  remind_at: string;
  reminder_type: string;
  status: string;
  snoozed_until?: string;
  completed_at?: string;
  notification_channels: string[];
  source: string;
  priority: string;
  linked_task_id?: string;
  linked_event_id?: string;
  created_at: string;
}

interface Stats {
  pending: number;
  snoozed: number;
  completed: number;
  overdue: number;
  todayCount: number;
}

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  low: { label: "Low", color: "text-slate-600", bgColor: "bg-slate-100" },
  medium: { label: "Medium", color: "text-yellow-600", bgColor: "bg-yellow-100" },
  high: { label: "High", color: "text-orange-600", bgColor: "bg-orange-100" },
  urgent: { label: "Urgent", color: "text-red-600", bgColor: "bg-red-100" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Pending", color: "bg-blue-100 text-blue-700", icon: Clock },
  snoozed: { label: "Snoozed", color: "bg-yellow-100 text-yellow-700", icon: AlarmClock },
  completed: { label: "Done", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "bg-gray-100 text-gray-700", icon: X },
};

const SNOOZE_OPTIONS = [
  { value: 15, label: "15 minutes" },
  { value: 30, label: "30 minutes" },
  { value: 60, label: "1 hour" },
  { value: 180, label: "3 hours" },
  { value: 1440, label: "Tomorrow" },
];

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  // Dialog state
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newReminder, setNewReminder] = useState({
    title: "",
    description: "",
    remind_at: "",
    priority: "medium",
  });

  const fetchReminders = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (statusFilter === "active") {
        // Don't set status to get pending + snoozed
      } else if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }

      if (priorityFilter && priorityFilter !== "all") {
        params.set("priority", priorityFilter);
      }

      const res = await fetch(`/api/reminders?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch reminders");

      const data = await res.json();
      setReminders(data.reminders || []);
      setStats(data.stats || null);
    } catch (error) {
      console.error("Error fetching reminders:", error);
      toast.error("Failed to load reminders");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter]);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  const handleAddReminder = async () => {
    if (!newReminder.title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    if (!newReminder.remind_at) {
      toast.error("Please select a reminder time");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newReminder.title,
          description: newReminder.description || undefined,
          remind_at: new Date(newReminder.remind_at).toISOString(),
          priority: newReminder.priority,
        }),
      });

      if (!res.ok) throw new Error("Failed to add reminder");

      toast.success("Reminder created!");
      setShowAddDialog(false);
      setNewReminder({
        title: "",
        description: "",
        remind_at: "",
        priority: "medium",
      });
      fetchReminders();
    } catch (error) {
      console.error("Error adding reminder:", error);
      toast.error("Failed to add reminder");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSnooze = async (id: string, minutes: number) => {
    try {
      const res = await fetch("/api/reminders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          action: "snooze",
          snooze_minutes: minutes,
        }),
      });

      if (!res.ok) throw new Error("Failed to snooze reminder");

      toast.success(`Snoozed for ${minutes >= 60 ? `${minutes / 60} hour(s)` : `${minutes} minutes`}`);
      fetchReminders();
    } catch (error) {
      console.error("Error snoozing reminder:", error);
      toast.error("Failed to snooze reminder");
    }
  };

  const handleComplete = async (id: string) => {
    try {
      const res = await fetch("/api/reminders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          action: "complete",
        }),
      });

      if (!res.ok) throw new Error("Failed to complete reminder");

      toast.success("Reminder marked complete!");
      fetchReminders();
    } catch (error) {
      console.error("Error completing reminder:", error);
      toast.error("Failed to complete reminder");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this reminder?")) return;

    try {
      const res = await fetch(`/api/reminders?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete reminder");

      toast.success("Reminder deleted");
      fetchReminders();
    } catch (error) {
      console.error("Error deleting reminder:", error);
      toast.error("Failed to delete reminder");
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    const time = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });

    if (isToday) return `Today at ${time}`;
    if (isTomorrow) return `Tomorrow at ${time}`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const isOverdue = (reminder: Reminder) => {
    return reminder.status === "pending" && new Date(reminder.remind_at) < new Date();
  };

  const filteredReminders = reminders.filter((reminder) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      reminder.title.toLowerCase().includes(query) ||
      reminder.description?.toLowerCase().includes(query)
    );
  });

  // Group reminders
  const overdueReminders = filteredReminders.filter(isOverdue);
  const upcomingReminders = filteredReminders.filter(
    (r) => !isOverdue(r) && r.status !== "completed"
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <Bell className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Reminders</h1>
            <p className="text-muted-foreground">
              Never miss important tasks and events
            </p>
          </div>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Reminder
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-6">
        <Card className={cn(
          "cursor-pointer transition-all hover:shadow-md",
          stats?.overdue && stats.overdue > 0 && "ring-2 ring-red-500"
        )}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-red-100">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <span className="text-2xl font-bold text-red-600">
                {stats?.overdue || 0}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Overdue</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-blue-100">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
              <span className="text-2xl font-bold">{stats?.pending || 0}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Pending</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-yellow-100">
                <AlarmClock className="h-4 w-4 text-yellow-600" />
              </div>
              <span className="text-2xl font-bold">{stats?.snoozed || 0}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Snoozed</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-purple-100">
                <Calendar className="h-4 w-4 text-purple-600" />
              </div>
              <span className="text-2xl font-bold">{stats?.todayCount || 0}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Today</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-green-100">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
              <span className="text-2xl font-bold">{stats?.completed || 0}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 px-6 pb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reminders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="snoozed">Snoozed</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Reminders List */}
      <div className="flex-1 overflow-auto px-6 pb-6 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : filteredReminders.length === 0 ? (
          <Card className="p-12 text-center">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No reminders</h3>
            <p className="text-muted-foreground mb-4">
              Create reminders via Telegram or add them here
            </p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Reminder
            </Button>
          </Card>
        ) : (
          <>
            {/* Overdue Section */}
            {overdueReminders.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-red-600 mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Overdue ({overdueReminders.length})
                </h3>
                <div className="space-y-2">
                  {overdueReminders.map((reminder) => (
                    <ReminderCard
                      key={reminder.id}
                      reminder={reminder}
                      isOverdue
                      onSnooze={handleSnooze}
                      onComplete={handleComplete}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Section */}
            {upcomingReminders.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Upcoming ({upcomingReminders.length})
                </h3>
                <div className="space-y-2">
                  {upcomingReminders.map((reminder) => (
                    <ReminderCard
                      key={reminder.id}
                      reminder={reminder}
                      onSnooze={handleSnooze}
                      onComplete={handleComplete}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Reminder Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Reminder</DialogTitle>
            <DialogDescription>
              Set a reminder for yourself
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                placeholder="What do you want to be reminded about?"
                value={newReminder.title}
                onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Additional details..."
                value={newReminder.description}
                onChange={(e) => setNewReminder({ ...newReminder, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Remind at *</Label>
              <Input
                type="datetime-local"
                value={newReminder.remind_at}
                onChange={(e) => setNewReminder({ ...newReminder, remind_at: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={newReminder.priority}
                onValueChange={(value) => setNewReminder({ ...newReminder, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddReminder} disabled={submitting}>
              {submitting ? "Creating..." : "Create Reminder"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Reminder Card Component
function ReminderCard({
  reminder,
  isOverdue = false,
  onSnooze,
  onComplete,
  onDelete,
}: {
  reminder: Reminder;
  isOverdue?: boolean;
  onSnooze: (id: string, minutes: number) => void;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const priorityConfig = PRIORITY_CONFIG[reminder.priority] || PRIORITY_CONFIG.medium;
  const statusConfig = STATUS_CONFIG[reminder.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    const time = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });

    if (isToday) return `Today at ${time}`;
    if (isTomorrow) return `Tomorrow at ${time}`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <Card className={cn(
      "hover:shadow-md transition-all",
      isOverdue && "border-red-200 bg-red-50/50"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className={cn(
            "h-10 w-10 rounded-lg flex items-center justify-center",
            isOverdue ? "bg-red-100" : priorityConfig.bgColor
          )}>
            {isOverdue ? (
              <AlertTriangle className="h-5 w-5 text-red-600" />
            ) : (
              <Bell className={cn("h-5 w-5", priorityConfig.color)} />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium">{reminder.title}</span>
              {reminder.source === "telegram" && (
                <Badge variant="outline" className="text-xs">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Telegram
                </Badge>
              )}
            </div>

            {reminder.description && (
              <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                {reminder.description}
              </p>
            )}

            <div className="flex items-center gap-3 text-sm">
              <span className={cn(
                "flex items-center gap-1",
                isOverdue ? "text-red-600 font-medium" : "text-muted-foreground"
              )}>
                <Clock className="h-3 w-3" />
                {formatDateTime(reminder.remind_at)}
              </span>
              <Badge className={cn("text-xs", statusConfig.color)}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig.label}
              </Badge>
              <Badge variant="outline" className={cn("text-xs", priorityConfig.color)}>
                {priorityConfig.label}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {reminder.status !== "completed" && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onComplete(reminder.id)}
                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                >
                  <CheckCircle2 className="h-4 w-4" />
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <AlarmClock className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                      Snooze for...
                    </div>
                    {SNOOZE_OPTIONS.map((option) => (
                      <DropdownMenuItem
                        key={option.value}
                        onClick={() => onSnooze(reminder.id, option.value)}
                      >
                        {option.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => onDelete(reminder.id)}
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
}
