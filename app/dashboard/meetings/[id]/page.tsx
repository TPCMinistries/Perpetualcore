"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Video,
  Users,
  Calendar as CalendarIcon,
  Clock,
  MessageSquare,
  Target,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  FileText,
  Loader2,
  Edit,
  Trash2,
  ListChecks,
  Handshake,
  ChevronDown,
  ChevronUp,
  User,
  Building,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface Attendee {
  id: string;
  name: string;
  email?: string;
  company?: string;
  role_in_meeting?: string;
  notes?: string;
}

interface Promise {
  id: string;
  promise_text: string;
  promiser_contact_id?: string;
  promisee_contact_id?: string;
  due_date?: string;
  status: string;
  importance?: string;
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date?: string;
}

interface Meeting {
  id: string;
  meeting_title: string;
  meeting_date: string;
  meeting_type: string;
  attendees: string[];
  attendees_details?: Attendee[];
  transcript?: string;
  executive_summary?: string;
  key_topics?: string[];
  decisions_made?: string[];
  next_steps?: string[];
  project_tags?: string[];
  sentiment?: string;
  follow_up_needed?: boolean;
  suggested_follow_up_date?: string;
  source?: string;
  promises?: Promise[];
  tasks?: Task[];
  created_at: string;
  updated_at?: string;
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

const sentimentConfig: Record<string, { bg: string; text: string; icon: any }> = {
  positive: { bg: "bg-green-50 dark:bg-green-500/10", text: "text-green-600 dark:text-green-400", icon: CheckCircle2 },
  neutral: { bg: "bg-slate-50 dark:bg-slate-500/10", text: "text-slate-600 dark:text-slate-400", icon: Target },
  negative: { bg: "bg-red-50 dark:bg-red-500/10", text: "text-red-600 dark:text-red-400", icon: AlertCircle },
  mixed: { bg: "bg-amber-50 dark:bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", icon: Target },
};

export default function MeetingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchMeeting();
  }, [id]);

  const fetchMeeting = async () => {
    try {
      const response = await fetch(`/api/meetings/${id}`);
      if (response.ok) {
        const data = await response.json();
        setMeeting(data.meeting);
      } else {
        router.push("/dashboard/meetings");
      }
    } catch (error) {
      console.error("Failed to fetch meeting:", error);
      router.push("/dashboard/meetings");
    } finally {
      setLoading(false);
    }
  };

  const deleteMeeting = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/meetings/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/dashboard/meetings");
      }
    } catch (error) {
      console.error("Failed to delete meeting:", error);
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!meeting) {
    return null;
  }

  const SentimentIcon = meeting.sentiment ? sentimentConfig[meeting.sentiment]?.icon : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard/meetings")}
            className="mb-4 -ml-2 text-slate-600 dark:text-slate-400"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Meetings
          </Button>

          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/25 flex-shrink-0">
                <Video className="h-7 w-7 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`h-2 w-2 rounded-full ${meetingTypeColors[meeting.meeting_type] || meetingTypeColors.other}`} />
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    {meeting.meeting_type}
                  </span>
                  {meeting.source && meeting.source !== "manual" && (
                    <>
                      <span className="text-slate-400 dark:text-slate-500">•</span>
                      <span className="text-sm text-slate-500 dark:text-slate-400 capitalize">
                        via {meeting.source}
                      </span>
                    </>
                  )}
                </div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                  {meeting.meeting_title}
                </h1>
                <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <CalendarIcon className="h-4 w-4" />
                    {formatDate(meeting.meeting_date)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    {formatTime(meeting.meeting_date)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-500/10"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>

        {/* Badges Row */}
        <div className="flex items-center gap-3 mb-8 flex-wrap">
          {meeting.attendees && meeting.attendees.length > 0 && (
            <Badge variant="secondary" className="py-1.5 px-3">
              <Users className="h-3.5 w-3.5 mr-1.5" />
              {meeting.attendees.length} attendee{meeting.attendees.length > 1 ? "s" : ""}
            </Badge>
          )}

          {meeting.sentiment && SentimentIcon && (
            <Badge className={`py-1.5 px-3 ${sentimentConfig[meeting.sentiment].bg} ${sentimentConfig[meeting.sentiment].text} border-0`}>
              <SentimentIcon className="h-3.5 w-3.5 mr-1.5" />
              {meeting.sentiment.charAt(0).toUpperCase() + meeting.sentiment.slice(1)} sentiment
            </Badge>
          )}

          {meeting.follow_up_needed && (
            <Badge className="py-1.5 px-3 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-0">
              <Clock className="h-3.5 w-3.5 mr-1.5" />
              Follow-up needed
            </Badge>
          )}

          {meeting.promises && meeting.promises.length > 0 && (
            <Badge className="py-1.5 px-3 bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border-0">
              <Handshake className="h-3.5 w-3.5 mr-1.5" />
              {meeting.promises.length} promise{meeting.promises.length > 1 ? "s" : ""}
            </Badge>
          )}

          {meeting.tasks && meeting.tasks.length > 0 && (
            <Badge className="py-1.5 px-3 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0">
              <ListChecks className="h-3.5 w-3.5 mr-1.5" />
              {meeting.tasks.length} task{meeting.tasks.length > 1 ? "s" : ""}
            </Badge>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Executive Summary */}
            {meeting.executive_summary && (
              <Card className="border-0 shadow-lg shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-800/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Sparkles className="h-5 w-5 text-amber-500" />
                    Executive Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {meeting.executive_summary}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Key Topics */}
            {meeting.key_topics && meeting.key_topics.length > 0 && (
              <Card className="border-0 shadow-lg shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-800/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MessageSquare className="h-5 w-5 text-blue-500" />
                    Key Topics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {meeting.key_topics.map((topic, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="h-2 w-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                        <span className="text-slate-700 dark:text-slate-300">{topic}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Decisions Made */}
            {meeting.decisions_made && meeting.decisions_made.length > 0 && (
              <Card className="border-0 shadow-lg shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-800/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Target className="h-5 w-5 text-emerald-500" />
                    Decisions Made
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {meeting.decisions_made.map((decision, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <span className="text-slate-700 dark:text-slate-300">{decision}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Next Steps */}
            {meeting.next_steps && meeting.next_steps.length > 0 && (
              <Card className="border-0 shadow-lg shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-800/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ListChecks className="h-5 w-5 text-violet-500" />
                    Next Steps
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {meeting.next_steps.map((step, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="h-5 w-5 rounded border-2 border-violet-300 dark:border-violet-600 flex-shrink-0" />
                        <span className="text-slate-700 dark:text-slate-300">{step}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Promises */}
            {meeting.promises && meeting.promises.length > 0 && (
              <Card className="border-0 shadow-lg shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-800/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Handshake className="h-5 w-5 text-rose-500" />
                    Promises Made
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {meeting.promises.map((promise) => (
                      <li
                        key={promise.id}
                        onClick={() => router.push(`/dashboard/promises`)}
                        className="p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      >
                        <div className="flex items-start justify-between">
                          <p className="text-slate-700 dark:text-slate-300 flex-1">
                            {promise.promise_text}
                          </p>
                          <Badge
                            variant="secondary"
                            className={`ml-3 ${
                              promise.status === "fulfilled"
                                ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400"
                                : promise.status === "broken"
                                ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
                                : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                            }`}
                          >
                            {promise.status}
                          </Badge>
                        </div>
                        {promise.due_date && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1.5">
                            <Clock className="h-3 w-3" />
                            Due: {new Date(promise.due_date).toLocaleDateString()}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Transcript */}
            {meeting.transcript && (
              <Card className="border-0 shadow-lg shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-800/50">
                <CardHeader
                  className="cursor-pointer"
                  onClick={() => setShowTranscript(!showTranscript)}
                >
                  <CardTitle className="flex items-center justify-between text-lg">
                    <span className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-slate-500" />
                      Transcript
                    </span>
                    {showTranscript ? (
                      <ChevronUp className="h-5 w-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-slate-400" />
                    )}
                  </CardTitle>
                </CardHeader>
                {showTranscript && (
                  <CardContent>
                    <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 max-h-[500px] overflow-y-auto">
                      <pre className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-sans">
                        {meeting.transcript}
                      </pre>
                    </div>
                  </CardContent>
                )}
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Attendees */}
            {((meeting.attendees_details && meeting.attendees_details.length > 0) ||
              (meeting.attendees && meeting.attendees.length > 0)) && (
              <Card className="border-0 shadow-lg shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-800/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="h-5 w-5 text-blue-500" />
                    Attendees
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {meeting.attendees_details && meeting.attendees_details.length > 0
                      ? meeting.attendees_details.map((attendee) => (
                          <li key={attendee.id} className="flex items-start gap-3">
                            <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                              <User className="h-4 w-4 text-slate-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-slate-900 dark:text-white text-sm">
                                {attendee.name}
                              </p>
                              {attendee.company && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                  <Building className="h-3 w-3" />
                                  {attendee.company}
                                </p>
                              )}
                              {attendee.role_in_meeting && (
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  {attendee.role_in_meeting}
                                </p>
                              )}
                            </div>
                          </li>
                        ))
                      : meeting.attendees.map((name, i) => (
                          <li key={i} className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                              <User className="h-4 w-4 text-slate-500" />
                            </div>
                            <span className="text-sm text-slate-700 dark:text-slate-300">{name}</span>
                          </li>
                        ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Tasks Created */}
            {meeting.tasks && meeting.tasks.length > 0 && (
              <Card className="border-0 shadow-lg shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-800/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ListChecks className="h-5 w-5 text-emerald-500" />
                    Tasks Created
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {meeting.tasks.map((task) => (
                      <li
                        key={task.id}
                        onClick={() => router.push(`/dashboard/tasks/${task.id}`)}
                        className="p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                      >
                        <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-1">
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {task.status}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {task.priority}
                          </Badge>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Project Tags */}
            {meeting.project_tags && meeting.project_tags.length > 0 && (
              <Card className="border-0 shadow-lg shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-800/50">
                <CardHeader>
                  <CardTitle className="text-lg">Project Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {meeting.project_tags.map((tag, i) => (
                      <Badge key={i} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Follow-up Date */}
            {meeting.suggested_follow_up_date && (
              <Card className="border-0 shadow-lg shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-800/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CalendarIcon className="h-5 w-5 text-amber-500" />
                    Suggested Follow-up
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-700 dark:text-slate-300">
                    {new Date(meeting.suggested_follow_up_date).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Meeting</DialogTitle>
          </DialogHeader>
          <p className="text-slate-600 dark:text-slate-400">
            Are you sure you want to delete this meeting? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={deleteMeeting}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
