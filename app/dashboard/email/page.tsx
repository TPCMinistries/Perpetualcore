"use client";

import { useState, useEffect } from "react";
import {
  Mail,
  Inbox,
  Star,
  Send,
  RefreshCw,
  Sparkles,
  Clock,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Plus,
  TrendingUp,
  Zap,
  Brain,
  Search,
  Filter,
  BarChart3,
  Archive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Email {
  id: string;
  subject: string;
  from_email: string;
  from_name?: string;
  snippet: string;
  sent_at: string;
  is_read: boolean;
  is_starred: boolean;
  ai_category: string;
  ai_priority_score: number;
  ai_summary?: string;
  requires_response: boolean;
  body_text?: string;
}

interface Draft {
  id: string;
  subject: string;
  to_emails: string[];
  body_text: string;
  ai_generated: boolean;
  status: string;
  created_at: string;
}

interface EmailStats {
  total: number;
  unread: number;
  urgent: number;
  needsReply: number;
  aiGenerated: number;
}

export default function EmailPage() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [connected, setConnected] = useState(false);
  const [filter, setFilter] = useState<"all" | "urgent" | "unread">("all");
  const [showCompose, setShowCompose] = useState(false);
  const [composePrompt, setComposePrompt] = useState("");
  const [composeRecipient, setComposeRecipient] = useState("");
  const [stats, setStats] = useState<EmailStats>({
    total: 0,
    unread: 0,
    urgent: 0,
    needsReply: 0,
    aiGenerated: 0,
  });

  useEffect(() => {
    checkConnection();
    fetchEmails();
    fetchDrafts();

    // Check for OAuth callback params
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "connected") {
      setConnected(true);
      syncEmails();
    }
  }, [filter]);

  const calculateStats = (emailList: Email[]) => {
    const unread = emailList.filter((e) => !e.is_read).length;
    const urgent = emailList.filter((e) => e.ai_category === "urgent").length;
    const needsReply = emailList.filter((e) => e.requires_response).length;

    setStats({
      total: emailList.length,
      unread,
      urgent,
      needsReply,
      aiGenerated: drafts.filter((d) => d.ai_generated).length,
    });
  };

  const checkConnection = async () => {
    try {
      const response = await fetch("/api/email/messages?limit=1");
      if (response.ok) {
        const data = await response.json();
        setConnected(data.emails?.length >= 0);
      }
    } catch (error) {
      console.error("Connection check failed:", error);
    }
  };

  const fetchEmails = async () => {
    try {
      const params = new URLSearchParams();
      if (filter === "urgent") {
        params.append("category", "urgent");
      } else if (filter === "unread") {
        params.append("isRead", "false");
      }

      const response = await fetch(`/api/email/messages?${params}`);
      if (response.ok) {
        const data = await response.json();
        const emailList = data.emails || [];
        setEmails(emailList);
        calculateStats(emailList);
      }
    } catch (error) {
      console.error("Failed to fetch emails:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDrafts = async () => {
    try {
      const response = await fetch("/api/email/drafts?status=draft");
      if (response.ok) {
        const data = await response.json();
        setDrafts(data.drafts || []);
      }
    } catch (error) {
      console.error("Failed to fetch drafts:", error);
    }
  };

  const connectGmail = async () => {
    try {
      const response = await fetch("/api/email/gmail/connect");
      const data = await response.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error("Failed to connect Gmail:", error);
    }
  };

  const syncEmails = async () => {
    setSyncing(true);
    try {
      const response = await fetch("/api/email/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxResults: 50 }),
      });

      if (response.ok) {
        await fetchEmails();
      }
    } catch (error) {
      console.error("Failed to sync emails:", error);
    } finally {
      setSyncing(false);
    }
  };

  const generateDraft = async () => {
    if (!composePrompt.trim()) return;

    try {
      const response = await fetch("/api/email/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: composePrompt,
          recipient: composeRecipient || undefined,
        }),
      });

      if (response.ok) {
        setComposePrompt("");
        setComposeRecipient("");
        setShowCompose(false);
        await fetchDrafts();
      }
    } catch (error) {
      console.error("Failed to generate draft:", error);
    }
  };

  const sendDraft = async (draftId: string) => {
    try {
      const response = await fetch("/api/email/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", draftId }),
      });

      if (response.ok) {
        await fetchDrafts();
      }
    } catch (error) {
      console.error("Failed to send draft:", error);
    }
  };

  const markAsRead = async (emailId: string) => {
    try {
      await fetch("/api/email/messages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: emailId, is_read: true }),
      });

      setEmails((prev) =>
        prev.map((e) => (e.id === emailId ? { ...e, is_read: true } : e))
      );
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "urgent":
        return "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400";
      case "important":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400";
      case "newsletter":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400";
      case "promotional":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/50 dark:text-gray-400";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (!connected) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardContent className="py-12 text-center">
            <div className="h-24 w-24 mx-auto mb-6 rounded-full bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
              <Mail className="h-12 w-12 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-3xl font-semibold mb-3 text-slate-900 dark:text-slate-100">
              Connect Your Email
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Connect your Gmail account to start using AI-powered email intelligence with smart categorization, priority detection, and automated responses
            </p>
            <Button onClick={connectGmail} className="flex items-center gap-2 mx-auto bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 text-lg px-8 py-6">
              <Mail className="h-5 w-5" />
              Connect Gmail
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            <div className="text-muted-foreground">Loading emails...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-8 bg-white dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-3">
              <Brain className="h-8 w-8 text-slate-600 dark:text-slate-400" />
              AI-Powered Email
            </h1>
            <p className="text-muted-foreground mt-2">
              Smart inbox with AI categorization and automated responses
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowCompose(!showCompose)}
              className="flex items-center gap-2 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900"
            >
              <Sparkles className="h-4 w-4" />
              Compose with AI
            </Button>
            <Button
              onClick={syncEmails}
              disabled={syncing}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
              Sync
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Emails</p>
              <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mt-1">{stats.total}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
              <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Unread</p>
              <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mt-1">{stats.unread}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-green-50 dark:bg-green-950/30 flex items-center justify-center">
              <Inbox className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Urgent</p>
              <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mt-1">{stats.urgent}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Needs Reply</p>
              <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mt-1">{stats.needsReply}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">AI Drafts</p>
              <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mt-1">{drafts.length}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Compose with AI */}
      {showCompose && (
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <Sparkles className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              Generate Email with AI
            </h3>
            <div className="space-y-4">
              <Input
                placeholder="Recipient email (optional)"
                value={composeRecipient}
                onChange={(e) => setComposeRecipient(e.target.value)}
                className="border-slate-200 dark:border-slate-800"
              />
              <Textarea
                placeholder="What should this email say? E.g., 'Follow up about the project deadline' or 'Thank them for the meeting'"
                value={composePrompt}
                onChange={(e) => setComposePrompt(e.target.value)}
                rows={3}
                className="border-slate-200 dark:border-slate-800"
              />
              <div className="flex gap-2">
                <Button onClick={generateDraft} className="bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Draft
                </Button>
                <Button variant="ghost" onClick={() => setShowCompose(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Drafts */}
      {drafts.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <Sparkles className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            AI Drafts Awaiting Review
          </h2>
          <div className="space-y-2">
            {drafts.map((draft) => (
              <Card key={draft.id} className="hover:shadow-md transition-shadow border-l-4 border-l-slate-900 dark:border-l-slate-100 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {draft.ai_generated && (
                          <Badge className="bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                            <Sparkles className="h-3 w-3 mr-1" />
                            AI Generated
                          </Badge>
                        )}
                      </div>
                      <p className="font-medium text-sm text-muted-foreground">To: {draft.to_emails.join(", ")}</p>
                      <p className="font-semibold mt-1 text-slate-900 dark:text-slate-100">{draft.subject}</p>
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {draft.body_text}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        onClick={() => sendDraft(draft.id)}
                        className="flex items-center gap-1 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900"
                      >
                        <Send className="h-3 w-3" />
                        Send
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
          size="sm"
          className={filter === "all" ? "bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900" : "border-slate-200 dark:border-slate-800"}
        >
          <Inbox className="h-4 w-4 mr-2" />
          All
        </Button>
        <Button
          variant={filter === "urgent" ? "default" : "outline"}
          onClick={() => setFilter("urgent")}
          size="sm"
          className={filter === "urgent" ? "bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900" : "border-slate-200 dark:border-slate-800"}
        >
          <AlertCircle className="h-4 w-4 mr-2" />
          Urgent
        </Button>
        <Button
          variant={filter === "unread" ? "default" : "outline"}
          onClick={() => setFilter("unread")}
          size="sm"
          className={filter === "unread" ? "bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900" : "border-slate-200 dark:border-slate-800"}
        >
          <Mail className="h-4 w-4 mr-2" />
          Unread
        </Button>
      </div>

      {/* Email list */}
      {emails.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="h-16 w-16 mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
            <p className="text-muted-foreground">
              {filter === "unread"
                ? "No unread emails"
                : filter === "urgent"
                ? "No urgent emails"
                : "No emails yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Email list */}
          <div className="space-y-2">
            {emails.map((email) => (
              <Card
                key={email.id}
                className={`hover:shadow-md transition-all cursor-pointer border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 ${
                  !email.is_read ? "border-l-4 border-l-slate-900 dark:border-l-slate-100" : ""
                } ${selectedEmail?.id === email.id ? "border-slate-900 dark:border-slate-100 shadow-lg" : ""}`}
                onClick={() => {
                  setSelectedEmail(email);
                  if (!email.is_read) {
                    markAsRead(email.id);
                  }
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">
                        {email.from_name || email.from_email}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">{email.subject}</p>
                    </div>
                    <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                      {formatDate(email.sent_at)}
                    </span>
                  </div>

                  {email.ai_summary && (
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {email.ai_summary}
                    </p>
                  )}

                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={getCategoryColor(email.ai_category)}>
                      {email.ai_category}
                    </Badge>

                    {email.requires_response && (
                      <Badge variant="outline" className="bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400">
                        <Clock className="h-3 w-3 mr-1" />
                        Needs reply
                      </Badge>
                    )}

                    {email.ai_priority_score >= 0.8 && (
                      <Badge variant="outline" className="bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        High priority
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Email detail */}
          <div className="sticky top-4">
            {selectedEmail ? (
              <Card className="shadow-xl">
                <CardContent className="p-6">
                  <div className="mb-4">
                    <h2 className="text-xl font-bold mb-2">{selectedEmail.subject}</h2>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div>
                        <p className="font-medium">
                          {selectedEmail.from_name || selectedEmail.from_email}
                        </p>
                        <p className="text-xs">{selectedEmail.from_email}</p>
                      </div>
                      <p>{new Date(selectedEmail.sent_at).toLocaleString()}</p>
                    </div>
                  </div>

                  {selectedEmail.ai_summary && (
                    <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        <span className="font-semibold text-purple-900 dark:text-purple-100">AI Summary</span>
                      </div>
                      <p className="text-sm text-purple-900 dark:text-purple-100">{selectedEmail.ai_summary}</p>
                    </div>
                  )}

                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <p className="whitespace-pre-wrap">{selectedEmail.body_text}</p>
                  </div>

                  {selectedEmail.requires_response && (
                    <div className="mt-6 pt-6 border-t">
                      <Button
                        onClick={() => {
                          setComposePrompt(
                            `Reply to this email about: ${selectedEmail.subject}`
                          );
                          setComposeRecipient(selectedEmail.from_email);
                          setShowCompose(true);
                        }}
                        className="w-full flex items-center gap-2 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 shadow-lg"
                      >
                        <Sparkles className="h-4 w-4" />
                        Generate Reply with AI
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <CardContent className="py-12 text-center">
                  <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
                    <Mail className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="text-muted-foreground">Select an email to view</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
