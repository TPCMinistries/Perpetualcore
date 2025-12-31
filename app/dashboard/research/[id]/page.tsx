"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Search as SearchIcon,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Trash2,
  ExternalLink,
  Sparkles,
  User,
  Building,
  TrendingUp,
  DollarSign,
  Globe,
  Lightbulb,
  FileText,
  Link as LinkIcon,
  AlertCircle,
  RefreshCw,
  Copy,
  Check,
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
import { cn } from "@/lib/utils";

interface Source {
  url: string;
  title: string;
  relevance?: string;
  snippet?: string;
}

interface Contact {
  id: string;
  name: string;
  email?: string;
  company?: string;
  role?: string;
  linkedin_url?: string;
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
  recommendations?: string[];
  research_output?: Record<string, any>;
  sources?: Source[];
  confidence_score?: number;
  error_message?: string;
  contact_id?: string;
  contacts?: Contact;
  processing_started_at?: string;
  processing_completed_at?: string;
  created_at: string;
  updated_at?: string;
}

const requestTypeConfig: Record<string, { icon: any; label: string; color: string; bg: string }> = {
  investor: { icon: DollarSign, label: "Investor Research", color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
  partner: { icon: Building, label: "Partner Research", color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/30" },
  competitor: { icon: TrendingUp, label: "Competitor Analysis", color: "text-orange-600", bg: "bg-orange-100 dark:bg-orange-900/30" },
  grant: { icon: FileText, label: "Grant Research", color: "text-violet-600", bg: "bg-violet-100 dark:bg-violet-900/30" },
  market: { icon: Globe, label: "Market Research", color: "text-cyan-600", bg: "bg-cyan-100 dark:bg-cyan-900/30" },
  person: { icon: User, label: "Person Research", color: "text-pink-600", bg: "bg-pink-100 dark:bg-pink-900/30" },
  company: { icon: Building, label: "Company Research", color: "text-indigo-600", bg: "bg-indigo-100 dark:bg-indigo-900/30" },
  industry: { icon: TrendingUp, label: "Industry Analysis", color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-900/30" },
  technology: { icon: Lightbulb, label: "Technology Research", color: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-900/30" },
  custom: { icon: SearchIcon, label: "Custom Research", color: "text-slate-600", bg: "bg-slate-100 dark:bg-slate-800" },
};

const statusConfig: Record<string, { icon: any; label: string; bg: string; text: string }> = {
  pending: { icon: Clock, label: "Pending", bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-400" },
  queued: { icon: Clock, label: "Queued", bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-600 dark:text-amber-400" },
  researching: { icon: Loader2, label: "Researching", bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-600 dark:text-blue-400" },
  completed: { icon: CheckCircle2, label: "Completed", bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-600 dark:text-green-400" },
  failed: { icon: XCircle, label: "Failed", bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-600 dark:text-red-400" },
  cancelled: { icon: XCircle, label: "Cancelled", bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-500" },
};

export default function ResearchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [request, setRequest] = useState<ResearchRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchRequest();
  }, [id]);

  // Poll for updates if researching
  useEffect(() => {
    if (request?.status === "researching" || request?.status === "queued") {
      const interval = setInterval(fetchRequest, 5000);
      return () => clearInterval(interval);
    }
  }, [request?.status]);

  const fetchRequest = async () => {
    try {
      const response = await fetch(`/api/research/${id}`);
      if (response.ok) {
        const data = await response.json();
        setRequest(data.request);
      } else {
        router.push("/dashboard/research");
      }
    } catch (error) {
      console.error("Failed to fetch research request:", error);
      router.push("/dashboard/research");
    } finally {
      setLoading(false);
    }
  };

  const deleteRequest = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/research/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/dashboard/research");
      }
    } catch (error) {
      console.error("Failed to delete research request:", error);
    } finally {
      setDeleting(false);
    }
  };

  const copyToClipboard = async (text: string, itemId: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(itemId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  if (!request) {
    return null;
  }

  const typeConf = requestTypeConfig[request.request_type] || requestTypeConfig.custom;
  const statusConf = statusConfig[request.status] || statusConfig.pending;
  const TypeIcon = typeConf.icon;
  const StatusIcon = statusConf.icon;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard/research")}
            className="mb-4 -ml-2 text-slate-600 dark:text-slate-400"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Research Hub
          </Button>

          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg", typeConf.bg)}>
                <TypeIcon className={cn("h-7 w-7", typeConf.color)} />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    {typeConf.label}
                  </span>
                  <Badge className={cn("text-xs", statusConf.bg, statusConf.text, "border-0")}>
                    <StatusIcon className={cn("h-3 w-3 mr-1", request.status === "researching" && "animate-spin")} />
                    {statusConf.label}
                  </Badge>
                </div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                  {request.subject}
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Requested {formatDate(request.created_at)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {(request.status === "researching" || request.status === "queued") && (
                <Button variant="outline" size="sm" onClick={fetchRequest}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              )}
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

        {/* Processing Status */}
        {(request.status === "researching" || request.status === "queued") && (
          <Card className="mb-6 border-blue-200 dark:border-blue-800/50 bg-blue-50/50 dark:bg-blue-950/20">
            <CardContent className="py-6">
              <div className="flex items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <div>
                  <h3 className="font-semibold text-blue-700 dark:text-blue-300">
                    {request.status === "queued" ? "Queued for Processing" : "Research in Progress"}
                  </h3>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    AI is researching "{request.subject}". This page will update automatically.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {request.status === "failed" && (
          <Card className="mb-6 border-red-200 dark:border-red-800/50 bg-red-50/50 dark:bg-red-950/20">
            <CardContent className="py-6">
              <div className="flex items-center gap-4">
                <AlertCircle className="h-8 w-8 text-red-500" />
                <div>
                  <h3 className="font-semibold text-red-700 dark:text-red-300">Research Failed</h3>
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {request.error_message || "An error occurred during research processing."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Executive Summary */}
            {request.executive_summary && (
              <Card className="border-0 shadow-lg shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-800/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Sparkles className="h-5 w-5 text-amber-500" />
                    Executive Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {request.executive_summary}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Key Findings */}
            {request.key_findings && request.key_findings.length > 0 && (
              <Card className="border-0 shadow-lg shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-800/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    Key Findings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {request.key_findings.map((finding, i) => (
                      <li key={i} className="flex items-start gap-3 group">
                        <div className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-semibold text-green-600 dark:text-green-400">{i + 1}</span>
                        </div>
                        <span className="text-slate-700 dark:text-slate-300 flex-1">{finding}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(finding, `finding-${i}`)}
                          className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                        >
                          {copiedId === `finding-${i}` ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3 text-slate-400" />
                          )}
                        </Button>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Recommendations */}
            {request.recommendations && request.recommendations.length > 0 && (
              <Card className="border-0 shadow-lg shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-800/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Lightbulb className="h-5 w-5 text-amber-500" />
                    Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {request.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="h-5 w-5 rounded border-2 border-amber-300 dark:border-amber-600 flex-shrink-0 mt-0.5" />
                        <span className="text-slate-700 dark:text-slate-300">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Sources */}
            {request.sources && request.sources.length > 0 && (
              <Card className="border-0 shadow-lg shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-800/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <LinkIcon className="h-5 w-5 text-blue-500" />
                    Sources ({request.sources.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {request.sources.map((source, i) => (
                      <li key={i} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2"
                        >
                          {source.title || source.url}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                        {source.snippet && (
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                            {source.snippet}
                          </p>
                        )}
                        {source.relevance && (
                          <Badge variant="secondary" className="mt-2 text-xs">
                            {source.relevance}
                          </Badge>
                        )}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Original Request */}
            {request.context && (
              <Card className="border-0 shadow-lg shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-800/50">
                <CardHeader>
                  <CardTitle className="text-lg">Original Request</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-700 dark:text-slate-300 mb-4">{request.context}</p>
                  {request.specific_questions && request.specific_questions.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Specific Questions:</p>
                      <ul className="space-y-1">
                        {request.specific_questions.map((q, i) => (
                          <li key={i} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                            <span className="text-slate-400">•</span>
                            {q}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Confidence Score */}
            {request.confidence_score && (
              <Card className="border-0 shadow-lg shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-800/50">
                <CardContent className="py-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-cyan-600 dark:text-cyan-400 mb-1">
                      {Math.round(request.confidence_score * 100)}%
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Confidence Score</p>
                    <div className="mt-3 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                        style={{ width: `${request.confidence_score * 100}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Linked Contact */}
            {request.contacts && (
              <Card className="border-0 shadow-lg shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-800/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <User className="h-4 w-4 text-pink-500" />
                    Linked Contact
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                      <User className="h-5 w-5 text-slate-500" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{request.contacts.name}</p>
                      {request.contacts.company && (
                        <p className="text-sm text-slate-500 dark:text-slate-400">{request.contacts.company}</p>
                      )}
                    </div>
                  </div>
                  {request.contacts.linkedin_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-3"
                      onClick={() => window.open(request.contacts!.linkedin_url, "_blank")}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View LinkedIn
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Processing Timeline */}
            <Card className="border-0 shadow-lg shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-800/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="h-4 w-4 text-slate-500" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Requested</span>
                    <span className="text-slate-700 dark:text-slate-300">
                      {new Date(request.created_at).toLocaleString()}
                    </span>
                  </div>
                  {request.processing_started_at && (
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Started</span>
                      <span className="text-slate-700 dark:text-slate-300">
                        {new Date(request.processing_started_at).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {request.processing_completed_at && (
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Completed</span>
                      <span className="text-slate-700 dark:text-slate-300">
                        {new Date(request.processing_completed_at).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Priority */}
            <Card className="border-0 shadow-lg shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-800/50">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500 dark:text-slate-400">Priority</span>
                  <Badge className={cn(
                    "capitalize",
                    request.priority === "urgent" && "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
                    request.priority === "high" && "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
                    request.priority === "medium" && "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
                    request.priority === "low" && "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                  )}>
                    {request.priority}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Research Request</DialogTitle>
          </DialogHeader>
          <p className="text-slate-600 dark:text-slate-400">
            Are you sure you want to delete this research request? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={deleteRequest}
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
