"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Mail,
  MessageSquare,
  Search,
  Star,
  Archive,
  Trash2,
  RefreshCw,
  Filter,
  SortAsc,
  Send,
  Clock,
  CheckCheck,
  Check,
  Maximize2,
  Minimize2,
  CheckSquare,
  Square,
  MoreVertical,
  Reply,
  X,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { EmailComposer } from "@/components/email/EmailComposer";

interface Message {
  id: string;
  type: "email" | "whatsapp";
  from_address?: string;
  from_name?: string;
  from_phone?: string;
  to_addresses?: string[];
  subject?: string;
  body_text: string;
  snippet?: string;
  is_read: boolean;
  is_starred: boolean;
  is_archived: boolean;
  sent_at?: string;
  received_at?: string;
  created_at: string;
  direction: "inbound" | "outbound";
  status?: string;
  ai_priority_score?: number;
  ai_category?: string;
  ai_sentiment?: string;
  labels?: string[];
  has_attachments?: boolean;
}

export function UnifiedInbox() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all"); // all, email, whatsapp
  const [filterStatus, setFilterStatus] = useState("all"); // all, unread, starred, archived
  const [sortBy, setSortBy] = useState("date"); // date, priority, sender
  const [showComposer, setShowComposer] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [viewDensity, setViewDensity] = useState<"compact" | "comfortable">("comfortable");
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const [hoveredMessage, setHoveredMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchMessages();
  }, [filterType, filterStatus, sortBy]);

  async function fetchMessages() {
    try {
      setLoading(true);

      // Fetch both emails and WhatsApp messages
      const [emailsRes, whatsappRes] = await Promise.all([
        fetch("/api/inbox/emails"),
        fetch("/api/inbox/whatsapp"),
      ]);

      const emailsData = await emailsRes.json();
      const whatsappData = await whatsappRes.json();

      const allMessages: Message[] = [
        ...(emailsData.emails || []).map((e: any) => ({
          ...e,
          type: "email" as const,
        })),
        ...(whatsappData.messages || []).map((m: any) => ({
          ...m,
          type: "whatsapp" as const,
        })),
      ];

      // Apply filters
      let filtered = allMessages;

      if (filterType !== "all") {
        filtered = filtered.filter((m) => m.type === filterType);
      }

      if (filterStatus === "unread") {
        filtered = filtered.filter((m) => !m.is_read);
      } else if (filterStatus === "starred") {
        filtered = filtered.filter((m) => m.is_starred);
      } else if (filterStatus === "archived") {
        filtered = filtered.filter((m) => m.is_archived);
      } else {
        // Default: exclude archived
        filtered = filtered.filter((m) => !m.is_archived);
      }

      // Apply search
      if (searchQuery) {
        filtered = filtered.filter(
          (m) =>
            m.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.body_text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.from_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.from_address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.from_phone?.includes(searchQuery)
        );
      }

      // Sort
      if (sortBy === "date") {
        filtered.sort(
          (a, b) =>
            new Date(b.sent_at || b.created_at).getTime() -
            new Date(a.sent_at || a.created_at).getTime()
        );
      } else if (sortBy === "priority") {
        filtered.sort(
          (a, b) =>
            (b.ai_priority_score || 0) - (a.ai_priority_score || 0)
        );
      }

      setMessages(filtered);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  }

  async function handleSync() {
    setSyncing(true);
    try {
      await Promise.all([
        fetch("/api/inbox/sync", { method: "POST" }),
      ]);
      toast.success("Inbox synced");
      fetchMessages();
    } catch (error) {
      toast.error("Failed to sync");
    } finally {
      setSyncing(false);
    }
  }

  async function toggleStar(message: Message) {
    const endpoint =
      message.type === "email"
        ? `/api/inbox/emails/${message.id}/star`
        : `/api/inbox/whatsapp/${message.id}/star`;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ starred: !message.is_starred }),
      });

      if (response.ok) {
        fetchMessages();
      }
    } catch (error) {
      toast.error("Failed to update");
    }
  }

  async function toggleRead(message: Message) {
    const endpoint =
      message.type === "email"
        ? `/api/inbox/emails/${message.id}/read`
        : `/api/inbox/whatsapp/${message.id}/read`;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: !message.is_read }),
      });

      if (response.ok) {
        fetchMessages();
      }
    } catch (error) {
      toast.error("Failed to update");
    }
  }

  async function archiveMessage(message: Message) {
    const endpoint =
      message.type === "email"
        ? `/api/inbox/emails/${message.id}/archive`
        : `/api/inbox/whatsapp/${message.id}/archive`;

    try {
      const response = await fetch(endpoint, { method: "POST" });

      if (response.ok) {
        toast.success("Message archived");
        fetchMessages();
        if (selectedMessage?.id === message.id) {
          setSelectedMessage(null);
        }
      }
    } catch (error) {
      toast.error("Failed to archive");
    }
  }

  function toggleSelectMessage(messageId: string) {
    const newSelected = new Set(selectedMessages);
    if (newSelected.has(messageId)) {
      newSelected.delete(messageId);
    } else {
      newSelected.add(messageId);
    }
    setSelectedMessages(newSelected);
  }

  function selectAllMessages() {
    setSelectedMessages(new Set(messages.map(m => `${m.type}-${m.id}`)));
  }

  function clearSelection() {
    setSelectedMessages(new Set());
  }

  async function bulkArchive() {
    const promises = Array.from(selectedMessages).map(msgId => {
      const message = messages.find(m => `${m.type}-${m.id}` === msgId);
      if (message) return archiveMessage(message);
    });
    await Promise.all(promises);
    clearSelection();
  }

  async function bulkMarkRead(read: boolean) {
    const promises = Array.from(selectedMessages).map(async msgId => {
      const message = messages.find(m => `${m.type}-${m.id}` === msgId);
      if (!message) return;
      const endpoint =
        message.type === "email"
          ? `/api/inbox/emails/${message.id}/read`
          : `/api/inbox/whatsapp/${message.id}/read`;
      await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read }),
      });
    });
    await Promise.all(promises);
    fetchMessages();
    clearSelection();
  }

  const unreadCount = messages.filter((m) => !m.is_read).length;
  const starredCount = messages.filter((m) => m.is_starred).length;

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4">
      {/* Sidebar / Message List */}
      <div className="w-96 flex flex-col gap-4">
        {/* Header */}
        <Card className="p-4 backdrop-blur-xl bg-background/95">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">Inbox</h2>
              <p className="text-sm text-muted-foreground">
                {selectedMessages.size > 0 ? (
                  <span className="text-slate-900 dark:text-slate-100 font-medium">
                    {selectedMessages.size} selected
                  </span>
                ) : (
                  <span>{unreadCount} unread, {starredCount} starred</span>
                )}
              </p>
            </div>
            <div className="flex gap-2">
              {/* View Density Toggle */}
              <div className="flex items-center gap-1 border border-border rounded-lg p-1">
                <Button
                  variant={viewDensity === "comfortable" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewDensity("comfortable")}
                  className={viewDensity === "comfortable" ? "bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900" : ""}
                  title="Comfortable view"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewDensity === "compact" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewDensity("compact")}
                  className={viewDensity === "compact" ? "bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900" : ""}
                  title="Compact view"
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleSync}
                disabled={syncing}
              >
                <RefreshCw
                  className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`}
                />
              </Button>
              <Button size="sm" onClick={() => setShowComposer(true)} className="bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900">
                <Send className="mr-2 h-4 w-4" />
                Compose
              </Button>
            </div>
          </div>

          {/* Bulk Actions Bar */}
          {selectedMessages.size > 0 && (
            <div className="mb-4 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {selectedMessages.size} message{selectedMessages.size > 1 ? 's' : ''} selected
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => bulkMarkRead(true)}
                    className="h-8"
                  >
                    <CheckCheck className="h-4 w-4 mr-1" />
                    Mark Read
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => bulkMarkRead(false)}
                    className="h-8"
                  >
                    <Mail className="h-4 w-4 mr-1" />
                    Mark Unread
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={bulkArchive}
                    className="h-8"
                  >
                    <Archive className="h-4 w-4 mr-1" />
                    Archive
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSelection}
                    className="h-8"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2 mb-4">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Messages</SelectItem>
                <SelectItem value="email">
                  <Mail className="inline mr-2 h-4 w-4" />
                  Email Only
                </SelectItem>
                <SelectItem value="whatsapp">
                  <MessageSquare className="inline mr-2 h-4 w-4" />
                  WhatsApp Only
                </SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="starred">Starred</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">{messages.length} messages</span>
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => {
                    if (selectedMessages.size === messages.length) {
                      clearSelection();
                    } else {
                      selectAllMessages();
                    }
                  }}
                >
                  {selectedMessages.size === messages.length ? "Deselect All" : "Select All"}
                </Button>
              )}
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-32 h-8 text-xs">
                <SortAsc className="mr-1 h-3 w-3" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="sender">Sender</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Message List */}
        <Card className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto w-24 h-24 mb-4 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                <Mail className="h-12 w-12 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No messages found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery
                  ? "Try adjusting your search or filters"
                  : filterStatus === "unread"
                  ? "You're all caught up!"
                  : "Your inbox is empty"}
              </p>
              {(searchQuery || filterStatus !== "all" || filterType !== "all") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setFilterStatus("all");
                    setFilterType("all");
                  }}
                  className="mt-2"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {messages.map((message) => {
                const messageId = `${message.type}-${message.id}`;
                const isSelected = selectedMessages.has(messageId);
                const isHovered = hoveredMessage === messageId;
                const isCompact = viewDensity === "compact";

                return (
                  <div
                    key={messageId}
                    onMouseEnter={() => setHoveredMessage(messageId)}
                    onMouseLeave={() => setHoveredMessage(null)}
                    className={`group relative ${isCompact ? "p-2" : "p-4"} cursor-pointer transition-all ${
                      !message.is_read ? "bg-muted/30 hover:bg-muted/40" : "hover:bg-accent/50"
                    } ${
                      selectedMessage?.id === message.id ? "bg-accent border-l-4 border-slate-900 dark:border-slate-100" : ""
                    } ${
                      isSelected ? "bg-slate-50 dark:bg-slate-800" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkbox for bulk selection */}
                      <div
                        className="flex-shrink-0 mt-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelectMessage(messageId);
                        }}
                      >
                        {isSelected || isHovered ? (
                          isSelected ? (
                            <CheckSquare className="h-4 w-4 text-slate-900 dark:text-slate-100" />
                          ) : (
                            <Square className="h-4 w-4 text-muted-foreground" />
                          )
                        ) : (
                          <div className="h-4 w-4 flex items-center justify-center">
                            {message.type === "email" ? (
                              <Mail className={`h-4 w-4 ${!message.is_read ? "text-blue-600" : "text-blue-500/70"}`} />
                            ) : (
                              <MessageSquare className={`h-4 w-4 ${!message.is_read ? "text-green-600" : "text-green-500/70"}`} />
                            )}
                          </div>
                        )}
                      </div>

                      <div
                        className="flex-1 min-w-0"
                        onClick={() => {
                          setSelectedMessage(message);
                          if (!message.is_read) {
                            toggleRead(message);
                          }
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            {/* From Name/Email */}
                            <div className="flex items-center gap-2">
                              <p
                                className={`${isCompact ? "text-xs" : "text-sm"} truncate ${
                                  !message.is_read ? "font-semibold" : "font-medium"
                                }`}
                              >
                                {message.from_name ||
                                  message.from_address ||
                                  message.from_phone ||
                                  "Unknown"}
                              </p>

                              {/* AI Badges inline with name */}
                              {!isCompact && message.ai_priority_score && message.ai_priority_score > 0.7 && (
                                <Badge variant="destructive" className="text-xs px-1 py-0 h-4">
                                  High Priority
                                </Badge>
                              )}
                              {!isCompact && message.ai_sentiment === "urgent" && (
                                <Badge variant="destructive" className="text-xs px-1 py-0 h-4">
                                  Urgent
                                </Badge>
                              )}
                            </div>

                            {/* Subject */}
                            {message.subject && (
                              <p
                                className={`${isCompact ? "text-xs" : "text-sm"} truncate ${
                                  !message.is_read
                                    ? "font-medium"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {message.subject}
                              </p>
                            )}

                            {/* Snippet/Preview */}
                            {!isCompact && (
                              <p className="text-xs text-muted-foreground truncate mt-1">
                                {message.snippet || message.body_text}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            {/* Time */}
                            <span className={`${isCompact ? "text-[10px]" : "text-xs"} text-muted-foreground whitespace-nowrap`}>
                              {formatDistanceToNow(
                                new Date(message.sent_at || message.created_at),
                                { addSuffix: true }
                              ).replace(' ago', '')}
                            </span>

                            {/* Star Icon */}
                            {message.is_starred && !isCompact && (
                              <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                            )}
                          </div>
                        </div>

                        {/* Labels & Category (only in comfortable mode) */}
                        {!isCompact && (message.ai_category || (message.direction === "outbound" && message.status === "sent")) && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {message.ai_category && (
                              <Badge variant="secondary" className="text-xs px-2 py-0 h-5">
                                {message.ai_category}
                              </Badge>
                            )}
                            {message.direction === "outbound" && message.status === "sent" && (
                              <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                                <CheckCheck className="h-3 w-3" />
                                <span>Sent</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Quick Action Buttons (on hover) */}
                      {isHovered && !isSelected && (
                        <div className="flex gap-1 items-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleStar(message);
                            }}
                          >
                            <Star
                              className={`h-3.5 w-3.5 ${
                                message.is_starred
                                  ? "fill-yellow-500 text-yellow-500"
                                  : ""
                              }`}
                            />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              archiveMessage(message);
                            }}
                          >
                            <Archive className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Message Detail */}
      <Card className="flex-1 flex flex-col">
        {selectedMessage ? (
          <>
            {/* Message Header */}
            <div className="p-6 border-b">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {selectedMessage.type === "email" ? (
                      <Mail className="h-5 w-5 text-blue-500" />
                    ) : (
                      <MessageSquare className="h-5 w-5 text-green-500" />
                    )}
                    <Badge variant="outline">
                      {selectedMessage.type === "email" ? "Email" : "WhatsApp"}
                    </Badge>
                  </div>
                  {selectedMessage.subject && (
                    <h2 className="text-2xl font-semibold mb-2">
                      {selectedMessage.subject}
                    </h2>
                  )}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>
                      <strong>From:</strong>{" "}
                      {selectedMessage.from_name ||
                        selectedMessage.from_address ||
                        selectedMessage.from_phone}
                    </span>
                    <span>
                      {formatDistanceToNow(
                        new Date(
                          selectedMessage.sent_at || selectedMessage.created_at
                        ),
                        { addSuffix: true }
                      )}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => toggleStar(selectedMessage)}
                  >
                    <Star
                      className={`h-4 w-4 ${
                        selectedMessage.is_starred
                          ? "fill-yellow-500 text-yellow-500"
                          : ""
                      }`}
                    />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => archiveMessage(selectedMessage)}
                  >
                    <Archive className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Message Body */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="prose dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap">{selectedMessage.body_text}</div>
              </div>
            </div>

            {/* Reply Actions */}
            <div className="p-4 border-t flex gap-2">
              <Button onClick={() => setShowComposer(true)}>
                <Send className="mr-2 h-4 w-4" />
                Reply
              </Button>
              <Button variant="outline">Forward</Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="mx-auto w-32 h-32 mb-6 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                <Mail className="h-16 w-16 text-muted-foreground/50" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No message selected</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Select a message from the list to view its contents
              </p>
              <Button
                onClick={() => setShowComposer(true)}
                className="bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900"
              >
                <Send className="mr-2 h-4 w-4" />
                Compose New Message
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Email Composer Dialog */}
      {showComposer && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <EmailComposer
              inReplyTo={
                selectedMessage?.type === "email"
                  ? selectedMessage.id
                  : undefined
              }
              onSent={() => {
                setShowComposer(false);
                fetchMessages();
              }}
              onClose={() => setShowComposer(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
