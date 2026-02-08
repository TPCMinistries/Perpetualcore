"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Video,
  Users,
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Search,
  MoreHorizontal,
  Trash2,
  ArrowRight,
  MessageSquare,
  Target,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Loader2,
  TrendingUp,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DashboardPageWrapper,
  DashboardHeader,
} from "@/components/ui/dashboard-header";
import { StatCard, StatCardGrid } from "@/components/ui/stat-card";
import { FilterPills } from "@/components/ui/filter-pills";

interface Meeting {
  id: string;
  meeting_title: string;
  meeting_date: string;
  meeting_type: string;
  attendees: string[];
  executive_summary?: string;
  key_topics?: string[];
  sentiment?: string;
  source?: string;
  follow_up_needed?: boolean;
  created_at: string;
}

const meetingTypeColors: Record<string, string> = {
  investor: "bg-emerald-500",
  coaching: "bg-blue-500",
  team: "bg-purple-500",
  "1:1": "bg-amber-500",
  sales: "bg-rose-500",
  support: "bg-cyan-500",
  other: "bg-slate-500",
};

const sentimentColors: Record<string, { bg: string; text: string }> = {
  positive: {
    bg: "bg-green-50 dark:bg-green-500/10",
    text: "text-green-600 dark:text-green-400",
  },
  neutral: {
    bg: "bg-slate-50 dark:bg-slate-500/10",
    text: "text-slate-600 dark:text-slate-400",
  },
  negative: {
    bg: "bg-red-50 dark:bg-red-500/10",
    text: "text-red-600 dark:text-red-400",
  },
  mixed: {
    bg: "bg-amber-50 dark:bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.3 },
  }),
};

function MeetingsSkeleton() {
  return (
    <DashboardPageWrapper maxWidth="6xl">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Skeleton className="h-14 w-14 rounded-2xl" />
          <div>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <Skeleton className="h-11 w-36" />
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>

      {/* Filter skeleton */}
      <Skeleton className="h-10 w-96 mb-6" />

      {/* List skeleton */}
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    </DashboardPageWrapper>
  );
}

export default function MeetingsPage() {
  const router = useRouter();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showNewMeeting, setShowNewMeeting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [total, setTotal] = useState(0);

  const [newMeeting, setNewMeeting] = useState({
    title: "",
    date: new Date().toISOString().split("T")[0],
    type: "other",
    attendees: "",
    transcript: "",
  });

  useEffect(() => {
    fetchMeetings();
  }, [typeFilter]);

  const fetchMeetings = async () => {
    try {
      const params = new URLSearchParams();
      if (typeFilter !== "all") {
        params.append("type", typeFilter);
      }
      params.append("limit", "50");

      const response = await fetch(`/api/meetings?${params}`);
      if (response.ok) {
        const data = await response.json();
        setMeetings(data.meetings || []);
        setTotal(data.total || 0);
      }
    } catch (error) {
      console.error("Failed to fetch meetings:", error);
    } finally {
      setLoading(false);
    }
  };

  const submitMeeting = async () => {
    if (!newMeeting.title.trim() || !newMeeting.transcript.trim()) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/meetings/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newMeeting.title,
          date: newMeeting.date,
          type: newMeeting.type,
          attendees: newMeeting.attendees
            .split(",")
            .map((a) => a.trim())
            .filter(Boolean),
          transcript: newMeeting.transcript,
          source: "manual",
        }),
      });

      if (response.ok) {
        setNewMeeting({
          title: "",
          date: new Date().toISOString().split("T")[0],
          type: "other",
          attendees: "",
          transcript: "",
        });
        setShowNewMeeting(false);
        fetchMeetings();
      }
    } catch (error) {
      console.error("Failed to submit meeting:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteMeeting = async (meetingId: string) => {
    try {
      const response = await fetch(`/api/meetings/${meetingId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchMeetings();
      }
    } catch (error) {
      console.error("Failed to delete meeting:", error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const filteredMeetings = meetings.filter((m) =>
    searchQuery
      ? m.meeting_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.attendees?.some((a) =>
          a.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : true
  );

  // Calculate stats
  const positiveMeetings = meetings.filter(
    (m) => m.sentiment === "positive"
  ).length;
  const followUpNeeded = meetings.filter((m) => m.follow_up_needed).length;
  const totalAttendees = meetings.reduce(
    (acc, m) => acc + (m.attendees?.length || 0),
    0
  );

  const filterOptions = [
    { id: "all", label: "All Types" },
    { id: "investor", label: "Investor" },
    { id: "coaching", label: "Coaching" },
    { id: "team", label: "Team" },
    { id: "1:1", label: "1:1" },
    { id: "sales", label: "Sales" },
    { id: "support", label: "Support" },
    { id: "other", label: "Other" },
  ];

  if (loading) {
    return <MeetingsSkeleton />;
  }

  return (
    <DashboardPageWrapper maxWidth="6xl">
      <DashboardHeader
        title="Meetings"
        subtitle="AI-powered meeting summaries and insights"
        icon={Video}
        iconColor="violet"
        stats={[
          { label: "total", value: total },
          { label: "need follow-up", value: followUpNeeded },
        ]}
        actions={
          <Dialog open={showNewMeeting} onOpenChange={setShowNewMeeting}>
            <DialogTrigger asChild>
              <Button className="h-11 px-5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-violet-500/25 border-0">
                <Plus className="h-4 w-4 mr-2" />
                Add Meeting
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Submit Meeting for AI Processing</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Meeting Title</Label>
                    <Input
                      placeholder="e.g., Weekly Team Standup"
                      value={newMeeting.title}
                      onChange={(e) =>
                        setNewMeeting({ ...newMeeting, title: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={newMeeting.date}
                      onChange={(e) =>
                        setNewMeeting({ ...newMeeting, date: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Meeting Type</Label>
                    <Select
                      value={newMeeting.type}
                      onValueChange={(value) =>
                        setNewMeeting({ ...newMeeting, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="investor">Investor</SelectItem>
                        <SelectItem value="coaching">Coaching</SelectItem>
                        <SelectItem value="team">Team</SelectItem>
                        <SelectItem value="1:1">1:1</SelectItem>
                        <SelectItem value="sales">Sales</SelectItem>
                        <SelectItem value="support">Support</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Attendees (comma-separated)</Label>
                    <Input
                      placeholder="e.g., John Doe, Jane Smith"
                      value={newMeeting.attendees}
                      onChange={(e) =>
                        setNewMeeting({
                          ...newMeeting,
                          attendees: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Transcript</Label>
                  <Textarea
                    placeholder="Paste the meeting transcript here..."
                    value={newMeeting.transcript}
                    onChange={(e) =>
                      setNewMeeting({
                        ...newMeeting,
                        transcript: e.target.value,
                      })
                    }
                    rows={10}
                    className="resize-none"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowNewMeeting(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={submitMeeting}
                    disabled={
                      submitting ||
                      !newMeeting.title.trim() ||
                      !newMeeting.transcript.trim()
                    }
                    className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white border-0"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Submit for Processing
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Stats Grid */}
      <StatCardGrid columns={4} className="mb-8">
        <StatCard
          label="Total Meetings"
          value={total}
          icon={Video}
          iconColor="violet"
        />
        <StatCard
          label="Positive Sentiment"
          value={positiveMeetings}
          icon={TrendingUp}
          iconColor="green"
        />
        <StatCard
          label="Follow-up Needed"
          value={followUpNeeded}
          icon={Clock}
          iconColor="amber"
        />
        <StatCard
          label="Total Attendees"
          value={totalAttendees}
          icon={UserCheck}
          iconColor="blue"
        />
      </StatCardGrid>

      {/* Filters Row */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search meetings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
          />
        </div>
        <FilterPills
          filters={filterOptions}
          activeFilter={typeFilter}
          onFilterChange={setTypeFilter}
        />
      </div>

      {/* Meetings List */}
      {filteredMeetings.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <div className="h-20 w-20 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-6">
            <Video className="h-10 w-10 text-slate-400 dark:text-slate-500" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
            No meetings yet
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            Add your first meeting transcript for AI analysis
          </p>
          <Button
            onClick={() => setShowNewMeeting(true)}
            variant="outline"
            className="border-slate-200 dark:border-slate-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Meeting
          </Button>
        </motion.div>
      ) : (
        <div className="grid gap-4">
          {filteredMeetings.map((meeting, index) => (
            <motion.div
              key={meeting.id}
              custom={index}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
            >
              <Card
                onClick={() => router.push(`/dashboard/meetings/${meeting.id}`)}
                className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-lg hover:shadow-violet-500/5 hover:border-violet-200 dark:hover:border-violet-800/50 transition-all cursor-pointer group"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        {/* Type indicator */}
                        <div
                          className={`h-2 w-2 rounded-full ${
                            meetingTypeColors[meeting.meeting_type] ||
                            meetingTypeColors.other
                          }`}
                        />
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                          {meeting.meeting_type}
                        </span>
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          •
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {formatDate(meeting.meeting_date)}
                        </span>
                        {meeting.source && meeting.source !== "manual" && (
                          <>
                            <span className="text-xs text-slate-400 dark:text-slate-500">
                              •
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                              via {meeting.source}
                            </span>
                          </>
                        )}
                      </div>

                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                        {meeting.meeting_title}
                      </h3>

                      {meeting.executive_summary && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-3">
                          {meeting.executive_summary}
                        </p>
                      )}

                      {/* Meta row */}
                      <div className="flex items-center gap-3 flex-wrap">
                        {/* Attendees */}
                        {meeting.attendees && meeting.attendees.length > 0 && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/50 px-2.5 py-1 rounded-full">
                            <Users className="h-3 w-3" />
                            {meeting.attendees.length} attendee
                            {meeting.attendees.length > 1 ? "s" : ""}
                          </span>
                        )}

                        {/* Key topics count */}
                        {meeting.key_topics &&
                          meeting.key_topics.length > 0 && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 px-2.5 py-1 rounded-full">
                              <MessageSquare className="h-3 w-3" />
                              {meeting.key_topics.length} topic
                              {meeting.key_topics.length > 1 ? "s" : ""}
                            </span>
                          )}

                        {/* Sentiment */}
                        {meeting.sentiment && (
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                              sentimentColors[meeting.sentiment]?.bg ||
                              sentimentColors.neutral.bg
                            } ${
                              sentimentColors[meeting.sentiment]?.text ||
                              sentimentColors.neutral.text
                            }`}
                          >
                            {meeting.sentiment === "positive" && (
                              <CheckCircle2 className="h-3 w-3" />
                            )}
                            {meeting.sentiment === "negative" && (
                              <AlertCircle className="h-3 w-3" />
                            )}
                            {meeting.sentiment === "mixed" && (
                              <Target className="h-3 w-3" />
                            )}
                            {meeting.sentiment.charAt(0).toUpperCase() +
                              meeting.sentiment.slice(1)}
                          </span>
                        )}

                        {/* Follow-up needed */}
                        {meeting.follow_up_needed && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2.5 py-1 rounded-full">
                            <Clock className="h-3 w-3" />
                            Follow-up needed
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
                              router.push(`/dashboard/meetings/${meeting.id}`);
                            }}
                          >
                            <ArrowRight className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteMeeting(meeting.id);
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
          ))}
        </div>
      )}
    </DashboardPageWrapper>
  );
}
