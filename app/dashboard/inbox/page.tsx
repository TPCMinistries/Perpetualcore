"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Inbox,
  Mail,
  Search,
  Star,
  Archive,
  Send,
  Plus,
  RefreshCw,
  ChevronDown,
  Sparkles,
  Clock,
  CheckCircle2,
  Circle,
  MoreHorizontal,
  Reply,
  Trash2,
  Tag,
  Filter,
  X,
  AlertCircle,
  Paperclip,
  Download,
  FileText,
  Image,
  File,
  BookmarkPlus,
  Loader2,
  Folder,
  FolderPlus,
  AlertCircle as AlertCircleIcon,
  Newspaper,
  Users,
  Briefcase,
  ChevronRight,
  UserPlus,
  Building,
  ExternalLink,
  Ban,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { EmailComposer } from "@/components/email/EmailComposer";
import { InboxSettingsDialog } from "@/components/inbox/InboxSettingsDialog";
import { Settings } from "lucide-react";

interface GmailAccount {
  id: string;
  email: string;
  connectedAt: string;
}

interface Email {
  id: string;
  email_account_id: string;
  from_email: string;
  from_name?: string;
  to_emails: string[];
  subject: string;
  body_text?: string;
  body_html?: string;
  snippet?: string;
  is_read: boolean;
  is_starred: boolean;
  is_archived: boolean;
  sent_at: string;
  ai_priority_score?: number;
  ai_category?: string;
  ai_summary?: string;
  ai_sentiment?: string;
  ai_triaged_at?: string;
  requires_response?: boolean;
  has_attachments?: boolean;
  account_email?: string; // Added for display
}

interface Attachment {
  id: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  document_id?: string;
  saved_to_library_at?: string;
}

interface Folder {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  is_smart: boolean;
  email_count: number;
  unread_count: number;
}

interface Contact {
  id: string;
  full_name: string;
  email: string;
  company?: string;
  job_title?: string;
  avatar_url?: string;
  relationship_strength?: string;
  last_interaction_at?: string;
}

interface ContactInfo {
  email_id: string;
  from_email: string;
  from_name?: string;
  contact: Contact | null;
  suggested_contacts: Contact[];
}

export default function InboxPage() {
  // Account state
  const [accounts, setAccounts] = useState<GmailAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | "all">("all");
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  // Email state
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [loadingEmails, setLoadingEmails] = useState(true);

  // UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [showComposer, setShowComposer] = useState(false);
  const [composerMode, setComposerMode] = useState<"new" | "reply" | "ai-reply">("new");
  const [syncing, setSyncing] = useState(false);
  const [triaging, setTriaging] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread" | "starred">("all");

  // Attachment state
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [savingAttachment, setSavingAttachment] = useState<string | null>(null);

  // Folder state
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [showFolders, setShowFolders] = useState(true);

  // Contact state
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [loadingContact, setLoadingContact] = useState(false);
  const [linkingContact, setLinkingContact] = useState(false);

  // AI Insights expanded state
  const [aiInsightsExpanded, setAiInsightsExpanded] = useState(false);

  // Settings dialog state
  const [showSettings, setShowSettings] = useState(false);

  // Fetch connected accounts and folders
  useEffect(() => {
    fetchAccounts();
    fetchFolders();
    // Check for OAuth callback
    const params = new URLSearchParams(window.location.search);
    if (params.get("gmail") === "connected") {
      toast.success("Gmail account connected!");
      fetchAccounts();
      window.history.replaceState({}, "", "/dashboard/inbox");
    } else if (params.get("error")) {
      toast.error(`Connection failed: ${params.get("error")}`);
      window.history.replaceState({}, "", "/dashboard/inbox");
    }
  }, []);

  // Fetch emails when account selection changes
  useEffect(() => {
    fetchEmails();
  }, [selectedAccountId, filter]);

  async function fetchAccounts() {
    try {
      const response = await fetch("/api/integrations/status");
      if (response.ok) {
        const data = await response.json();
        const gmail = data.integrations?.find((i: any) => i.provider === "gmail");
        setAccounts(gmail?.accounts || []);
      }
    } catch (error) {
      console.error("Error fetching accounts:", error);
    } finally {
      setLoadingAccounts(false);
    }
  }

  async function fetchFolders() {
    try {
      const response = await fetch("/api/inbox/folders");
      if (response.ok) {
        const data = await response.json();
        if (data.needsSetup) {
          // Create default folders
          await fetch("/api/inbox/folders/setup", { method: "POST" });
          const retry = await fetch("/api/inbox/folders");
          if (retry.ok) {
            const retryData = await retry.json();
            setFolders(retryData.folders || []);
          }
        } else {
          setFolders(data.folders || []);
        }
      }
    } catch (error) {
      console.error("Error fetching folders:", error);
    }
  }

  async function selectFolder(folderId: string | null) {
    setSelectedFolderId(folderId);
    if (!folderId) {
      fetchEmails();
      return;
    }

    setLoadingEmails(true);
    try {
      const response = await fetch(`/api/inbox/folders/${folderId}/emails`);
      if (response.ok) {
        const data = await response.json();
        setEmails(data.emails || []);
      }
    } catch (error) {
      console.error("Error fetching folder emails:", error);
    } finally {
      setLoadingEmails(false);
    }
  }

  async function fetchEmails() {
    setLoadingEmails(true);
    try {
      const response = await fetch("/api/inbox/emails");
      if (response.ok) {
        const data = await response.json();
        let emailList = data.emails || [];

        // Map account emails for display
        emailList = emailList.map((e: Email) => ({
          ...e,
          account_email: accounts.find(a => a.id === e.email_account_id)?.email,
        }));

        // Filter by account if not "all"
        if (selectedAccountId !== "all") {
          emailList = emailList.filter((e: Email) => e.email_account_id === selectedAccountId);
        }

        // Apply filter
        if (filter === "unread") {
          emailList = emailList.filter((e: Email) => !e.is_read);
        } else if (filter === "starred") {
          emailList = emailList.filter((e: Email) => e.is_starred);
        }

        setEmails(emailList);
      }
    } catch (error) {
      console.error("Error fetching emails:", error);
    } finally {
      setLoadingEmails(false);
    }
  }

  async function connectGmail() {
    try {
      const response = await fetch("/api/email/gmail/connect");
      if (response.ok) {
        const data = await response.json();
        window.location.href = data.authUrl;
      } else {
        toast.error("Failed to start Gmail connection");
      }
    } catch (error) {
      toast.error("Failed to connect Gmail");
    }
  }

  async function syncAllAccounts() {
    setSyncing(true);
    try {
      const response = await fetch("/api/inbox/sync", { method: "POST" });
      const data = await response.json();

      if (data.success) {
        toast.success(`Synced ${data.synced.emails} emails from ${data.gmail?.accountCount || 1} account(s)`);
        fetchEmails();
      } else {
        toast.error(data.error || "Sync failed");
      }
    } catch (error) {
      toast.error("Failed to sync");
    } finally {
      setSyncing(false);
    }
  }

  async function disconnectAccount(accountId: string) {
    if (!confirm("Disconnect this Gmail account?")) return;

    try {
      await fetch("/api/email/gmail/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId }),
      });
      toast.success("Account disconnected");
      fetchAccounts();
      fetchEmails();
    } catch (error) {
      toast.error("Failed to disconnect");
    }
  }

  async function triageEmail(email: Email) {
    if (email.ai_triaged_at || email.ai_summary) return;

    setTriaging(true);
    try {
      const response = await fetch(`/api/inbox/emails/${email.id}/triage`, { method: "POST" });
      if (response.ok) {
        const data = await response.json();
        // Update the email in state
        setSelectedEmail(prev => prev?.id === email.id ? {
          ...prev,
          ai_priority_score: data.triage.priority_score,
          ai_category: data.triage.category,
          ai_summary: data.triage.summary,
          ai_sentiment: data.triage.sentiment,
          requires_response: data.triage.requires_response,
          ai_triaged_at: new Date().toISOString(),
        } : prev);

        setEmails(prev => prev.map(e => e.id === email.id ? {
          ...e,
          ai_priority_score: data.triage.priority_score,
          ai_category: data.triage.category,
          ai_summary: data.triage.summary,
          ai_sentiment: data.triage.sentiment,
          requires_response: data.triage.requires_response,
          ai_triaged_at: new Date().toISOString(),
        } : e));
      }
    } catch (error) {
      console.error("Triage error:", error);
    } finally {
      setTriaging(false);
    }
  }

  async function toggleStar(email: Email) {
    try {
      await fetch(`/api/inbox/emails/${email.id}/star`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ starred: !email.is_starred }),
      });
      setEmails(prev => prev.map(e => e.id === email.id ? { ...e, is_starred: !e.is_starred } : e));
      if (selectedEmail?.id === email.id) {
        setSelectedEmail({ ...email, is_starred: !email.is_starred });
      }
    } catch (error) {
      toast.error("Failed to update");
    }
  }

  async function markAsRead(email: Email) {
    if (email.is_read) return;
    try {
      await fetch(`/api/inbox/emails/${email.id}/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: true }),
      });
      setEmails(prev => prev.map(e => e.id === email.id ? { ...e, is_read: true } : e));
    } catch (error) {
      console.error("Failed to mark as read");
    }
  }

  async function archiveEmail(email: Email) {
    try {
      await fetch(`/api/inbox/emails/${email.id}/archive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: !email.is_archived }),
      });
      setEmails(prev => prev.map(e => e.id === email.id ? { ...e, is_archived: !e.is_archived } : e));
      if (selectedEmail?.id === email.id) {
        setSelectedEmail({ ...email, is_archived: !email.is_archived });
      }
      toast.success(email.is_archived ? "Email unarchived" : "Email archived");
    } catch (error) {
      toast.error("Failed to archive");
    }
  }

  async function deleteEmail(email: Email) {
    if (!confirm("Move this email to trash?")) return;
    try {
      await fetch(`/api/inbox/emails/${email.id}`, { method: "DELETE" });
      setEmails(prev => prev.filter(e => e.id !== email.id));
      if (selectedEmail?.id === email.id) {
        setSelectedEmail(null);
      }
      toast.success("Email deleted");
    } catch (error) {
      toast.error("Failed to delete");
    }
  }

  async function blockSender(email: Email) {
    const senderEmail = email.from_email;
    const senderDomain = senderEmail.split("@")[1];

    const blockType = confirm(
      `Block all emails from ${senderDomain}? (OK = block domain, Cancel = block this email only)`
    ) ? "domain" : "email";

    const valueToBlock = blockType === "domain" ? senderDomain : senderEmail;

    try {
      const response = await fetch("/api/inbox/blocked-senders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          block_type: blockType,
          value: valueToBlock,
          reason: `Blocked from inbox on ${new Date().toLocaleDateString()}`,
        }),
      });

      if (response.ok) {
        // Remove emails from this sender from the list
        if (blockType === "domain") {
          setEmails(prev => prev.filter(e => !e.from_email.endsWith(`@${senderDomain}`)));
        } else {
          setEmails(prev => prev.filter(e => e.from_email !== senderEmail));
        }
        if (selectedEmail?.from_email === senderEmail ||
            (blockType === "domain" && selectedEmail?.from_email.endsWith(`@${senderDomain}`))) {
          setSelectedEmail(null);
        }
        toast.success(`Blocked ${blockType === "domain" ? `all emails from ${senderDomain}` : senderEmail}`);
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to block sender");
      }
    } catch (error) {
      toast.error("Failed to block sender");
    }
  }

  async function fetchAttachments(emailId: string) {
    setLoadingAttachments(true);
    try {
      const response = await fetch(`/api/inbox/emails/${emailId}/attachments`);
      if (response.ok) {
        const data = await response.json();
        setAttachments(data.attachments || []);
      }
    } catch (error) {
      console.error("Error fetching attachments:", error);
    } finally {
      setLoadingAttachments(false);
    }
  }

  async function downloadAttachment(attachment: Attachment) {
    try {
      const response = await fetch(`/api/inbox/attachments/${attachment.id}`);
      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = attachment.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast.error("Failed to download attachment");
    }
  }

  async function saveToLibrary(attachment: Attachment) {
    setSavingAttachment(attachment.id);
    try {
      const response = await fetch(`/api/inbox/attachments/${attachment.id}/save-to-library`, {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        toast.success("Saved to library!");
        // Update attachment in state
        setAttachments(prev =>
          prev.map(a =>
            a.id === attachment.id
              ? { ...a, document_id: data.document_id, saved_to_library_at: new Date().toISOString() }
              : a
          )
        );
      } else {
        const data = await response.json();
        if (data.document_id) {
          toast.info("Already saved to library");
        } else {
          toast.error(data.error || "Failed to save");
        }
      }
    } catch (error) {
      toast.error("Failed to save to library");
    } finally {
      setSavingAttachment(null);
    }
  }

  async function fetchContactInfo(emailId: string) {
    setLoadingContact(true);
    try {
      const response = await fetch(`/api/inbox/emails/${emailId}/contact`);
      if (response.ok) {
        const data = await response.json();
        setContactInfo(data);
      }
    } catch (error) {
      console.error("Error fetching contact info:", error);
    } finally {
      setLoadingContact(false);
    }
  }

  async function linkEmailToContact(emailId: string, contactId: string) {
    setLinkingContact(true);
    try {
      const response = await fetch(`/api/inbox/emails/${emailId}/contact`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact_id: contactId }),
      });
      if (response.ok) {
        const data = await response.json();
        toast.success("Contact linked!");
        // Refresh contact info
        fetchContactInfo(emailId);
      } else {
        toast.error("Failed to link contact");
      }
    } catch (error) {
      toast.error("Failed to link contact");
    } finally {
      setLinkingContact(false);
    }
  }

  async function createContactFromEmail(email: Email) {
    setLinkingContact(true);
    try {
      // Parse name from email
      const fromName = email.from_name || email.from_email?.split("@")[0] || "";
      const nameParts = fromName.trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";
      const domain = email.from_email?.split("@")[1];
      const company = domain ? domain.split(".")[0] : "";

      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email: email.from_email,
          company: company ? company.charAt(0).toUpperCase() + company.slice(1) : undefined,
          contact_type: "contact",
          source: "email_inbox",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Contact "${data.contact.full_name}" created!`);

        // Link this email to the new contact
        await fetch(`/api/inbox/emails/${email.id}/contact`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contact_id: data.contact.id }),
        });

        // Refresh contact info
        fetchContactInfo(email.id);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to create contact");
      }
    } catch (error) {
      toast.error("Failed to create contact");
    } finally {
      setLinkingContact(false);
    }
  }

  function selectEmail(email: Email) {
    setSelectedEmail(email);
    setAttachments([]); // Clear previous attachments
    setContactInfo(null); // Clear previous contact info
    markAsRead(email);
    triageEmail(email);
    fetchContactInfo(email.id);
    if (email.has_attachments) {
      fetchAttachments(email.id);
    }
  }

  const unreadCount = emails.filter(e => !e.is_read).length;
  const starredCount = emails.filter(e => e.is_starred).length;

  const filteredEmails = emails.filter(e => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      e.subject?.toLowerCase().includes(query) ||
      e.from_name?.toLowerCase().includes(query) ||
      e.from_email?.toLowerCase().includes(query) ||
      e.snippet?.toLowerCase().includes(query)
    );
  });

  const selectedAccount = accounts.find(a => a.id === selectedAccountId);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          {/* Account Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 min-w-[200px] justify-between">
                <span className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Mail className="h-3 w-3 text-white" />
                </span>
                <span className="font-medium">
                  {selectedAccountId === "all"
                    ? `All Inboxes (${accounts.length})`
                    : selectedAccount?.email?.split("@")[0] || "Select Account"}
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[280px]">
              <DropdownMenuItem
                onClick={() => setSelectedAccountId("all")}
                className="gap-2"
              >
                <Inbox className="h-4 w-4" />
                <span>All Inboxes</span>
                {accounts.length > 0 && (
                  <Badge variant="secondary" className="ml-auto">{accounts.length}</Badge>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {accounts.map(account => (
                <DropdownMenuItem
                  key={account.id}
                  onClick={() => setSelectedAccountId(account.id)}
                  className="gap-2"
                >
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs bg-gradient-to-br from-red-500 to-orange-500 text-white">
                      {account.email[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="flex-1 truncate">{account.email}</span>
                  {selectedAccountId === account.id && (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={connectGmail} className="gap-2 text-blue-600">
                <Plus className="h-4 w-4" />
                <span>Add Gmail Account</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Search */}
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-50 dark:bg-slate-800 border-0"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Filters */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            <Button
              variant={filter === "all" ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter("all")}
              className="h-7"
            >
              All
            </Button>
            <Button
              variant={filter === "unread" ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter("unread")}
              className="h-7 gap-1"
            >
              <Circle className="h-3 w-3 fill-blue-500 text-blue-500" />
              {unreadCount}
            </Button>
            <Button
              variant={filter === "starred" ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter("starred")}
              className="h-7 gap-1"
            >
              <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
              {starredCount}
            </Button>
          </div>

          {/* Settings Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettings(true)}
                  className="h-9 w-9 p-0"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Inbox Settings & Filters</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Sync Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={syncAllAccounts}
            disabled={syncing || accounts.length === 0}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            Sync
          </Button>

          {/* Compose Button */}
          <Button
            onClick={() => {
              setComposerMode("new");
              setShowComposer(true);
            }}
            className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Send className="h-4 w-4" />
            Compose
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Folders Sidebar */}
        {showFolders && folders.length > 0 && (
          <div className="w-[200px] border-r bg-slate-50/80 dark:bg-slate-900/80 p-3 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Folders</span>
            </div>

            {/* All Inbox */}
            <button
              onClick={() => { setSelectedFolderId(null); fetchEmails(); }}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm mb-1 transition-colors ${
                !selectedFolderId
                  ? "bg-white dark:bg-slate-800 shadow-sm font-medium"
                  : "hover:bg-white/50 dark:hover:bg-slate-800/50"
              }`}
            >
              <Inbox className="h-4 w-4" />
              <span className="flex-1 text-left">All Mail</span>
            </button>

            {/* Folder List */}
            <div className="space-y-1">
              {folders.map((folder) => {
                const IconComponent =
                  folder.icon === "alert-circle" ? AlertCircleIcon :
                  folder.icon === "reply" ? Reply :
                  folder.icon === "newspaper" ? Newspaper :
                  folder.icon === "users" ? Users :
                  folder.icon === "briefcase" ? Briefcase :
                  Folder;

                return (
                  <button
                    key={folder.id}
                    onClick={() => selectFolder(folder.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedFolderId === folder.id
                        ? "bg-white dark:bg-slate-800 shadow-sm font-medium"
                        : "hover:bg-white/50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <IconComponent
                      className="h-4 w-4"
                      style={{ color: folder.color }}
                    />
                    <span className="flex-1 text-left truncate">{folder.name}</span>
                    {folder.is_smart && (
                      <Sparkles className="h-3 w-3 text-violet-500" />
                    )}
                    {folder.unread_count > 0 && (
                      <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 px-1.5 rounded">
                        {folder.unread_count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Email List */}
        <div className={`${showFolders && folders.length > 0 ? "w-[350px]" : "w-[400px]"} border-r overflow-y-auto bg-slate-50/50 dark:bg-slate-900/50`}>
          {loadingEmails ? (
            <div className="p-4 space-y-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse p-4 rounded-lg bg-white dark:bg-slate-800">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : filteredEmails.length === 0 ? (
            <div className="p-12 text-center">
              <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Inbox className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-1">No emails found</h3>
              <p className="text-sm text-muted-foreground">
                {accounts.length === 0
                  ? "Connect a Gmail account to get started"
                  : "Try adjusting your search or filters"}
              </p>
              {accounts.length === 0 && (
                <Button onClick={connectGmail} className="mt-4 gap-2">
                  <Plus className="h-4 w-4" />
                  Connect Gmail
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-200/50 dark:divide-slate-700/50">
              {filteredEmails.map((email) => (
                <motion.div
                  key={email.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => selectEmail(email)}
                  className={`p-4 cursor-pointer transition-all hover:bg-white dark:hover:bg-slate-800 ${
                    selectedEmail?.id === email.id
                      ? "bg-white dark:bg-slate-800 border-l-2 border-l-blue-500"
                      : ""
                  } ${!email.is_read ? "bg-blue-50/50 dark:bg-blue-950/20" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarFallback className={`text-sm ${
                        email.ai_priority_score && email.ai_priority_score > 0.7
                          ? "bg-gradient-to-br from-red-500 to-orange-500"
                          : "bg-gradient-to-br from-slate-500 to-slate-600"
                      } text-white`}>
                        {(email.from_name || email.from_email)?.[0]?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-sm truncate ${!email.is_read ? "font-semibold" : "font-medium"}`}>
                          {email.from_name || email.from_email?.split("@")[0] || "Unknown"}
                        </span>
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {formatDistanceToNow(new Date(email.sent_at), { addSuffix: false })}
                        </span>
                      </div>

                      <p className={`text-sm truncate ${!email.is_read ? "text-slate-900 dark:text-slate-100" : "text-muted-foreground"}`}>
                        {email.subject || "(No subject)"}
                      </p>

                      <p className="text-xs text-muted-foreground truncate mt-1">
                        {email.snippet || email.body_text?.slice(0, 100)}
                      </p>

                      {/* Tags Row */}
                      <div className="flex items-center gap-2 mt-2">
                        {email.is_starred && (
                          <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                        )}
                        {email.has_attachments && (
                          <Paperclip className="h-3 w-3 text-slate-400" />
                        )}
                        {email.ai_category && (
                          <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5">
                            {email.ai_category}
                          </Badge>
                        )}
                        {email.requires_response && (
                          <Badge variant="outline" className="text-xs px-1.5 py-0 h-5 border-orange-300 text-orange-600">
                            Reply needed
                          </Badge>
                        )}
                        {selectedAccountId === "all" && accounts.length > 1 && (
                          <span className="text-xs text-muted-foreground ml-auto">
                            {email.account_email?.split("@")[0]}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Email Detail */}
        <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 overflow-hidden">
          {selectedEmail ? (
            <>
              {/* Email Header */}
              <div className="p-6 border-b">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h1 className="text-xl font-semibold mb-3">{selectedEmail.subject || "(No subject)"}</h1>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-gradient-to-br from-slate-500 to-slate-600 text-white">
                          {(selectedEmail.from_name || selectedEmail.from_email)?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {selectedEmail.from_name || selectedEmail.from_email}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          to me • {formatDistanceToNow(new Date(selectedEmail.sent_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </div>

                  <TooltipProvider>
                    <div className="flex items-center gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleStar(selectedEmail)}
                          >
                            <Star className={`h-5 w-5 ${selectedEmail.is_starred ? "fill-yellow-500 text-yellow-500" : ""}`} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{selectedEmail.is_starred ? "Unstar" : "Star"}</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => archiveEmail(selectedEmail)}
                          >
                            <Archive className="h-5 w-5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{selectedEmail.is_archived ? "Unarchive" : "Archive"}</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteEmail(selectedEmail)}
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Delete</p>
                        </TooltipContent>
                      </Tooltip>

                      <DropdownMenu>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-5 w-5" />
                              </Button>
                            </DropdownMenuTrigger>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>More actions</p>
                          </TooltipContent>
                        </Tooltip>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => markAsRead(selectedEmail)}>
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Mark as {selectedEmail.is_read ? "unread" : "read"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setComposerMode("reply");
                            setShowComposer(true);
                          }}>
                            <Reply className="h-4 w-4 mr-2" />
                            Reply
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => {
                            if (selectedFolderId) {
                              // Add to current folder
                              toast.info("Email already in folder");
                            } else {
                              toast.info("Select a folder first");
                            }
                          }}>
                            <Folder className="h-4 w-4 mr-2" />
                            Add to folder
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => deleteEmail(selectedEmail)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => blockSender(selectedEmail)}
                            className="text-orange-600"
                          >
                            <Ban className="h-4 w-4 mr-2" />
                            Block Sender
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TooltipProvider>
                </div>
              </div>

              {/* Contact Card */}
              {(contactInfo || loadingContact) && (
                <div className="px-6 py-3 border-b bg-slate-50/50 dark:bg-slate-800/30">
                  {loadingContact ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading contact info...
                    </div>
                  ) : contactInfo?.contact ? (
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                          {contactInfo.contact.full_name?.[0]?.toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{contactInfo.contact.full_name}</span>
                          {contactInfo.contact.relationship_strength && (
                            <Badge variant="outline" className="text-xs capitalize">
                              {contactInfo.contact.relationship_strength}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          {contactInfo.contact.company && (
                            <span className="flex items-center gap-1">
                              <Building className="h-3 w-3" />
                              {contactInfo.contact.company}
                            </span>
                          )}
                          {contactInfo.contact.job_title && (
                            <span>{contactInfo.contact.job_title}</span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1"
                        onClick={() => window.open(`/dashboard/contacts?id=${contactInfo.contact?.id}`, "_blank")}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        View Contact
                      </Button>
                    </div>
                  ) : contactInfo?.suggested_contacts && contactInfo.suggested_contacts.length > 0 ? (
                    <div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <UserPlus className="h-4 w-4" />
                        Suggested contacts for <span className="font-medium">{contactInfo.from_email}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {contactInfo.suggested_contacts.map((c) => (
                          <Button
                            key={c.id}
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => selectedEmail && linkEmailToContact(selectedEmail.id, c.id)}
                            disabled={linkingContact}
                          >
                            {linkingContact ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <UserPlus className="h-3 w-3" />
                            )}
                            Link to {c.full_name}
                            {c.company && <span className="text-muted-foreground">({c.company})</span>}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>No contact linked for <span className="font-medium">{contactInfo?.from_email}</span></span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        disabled={linkingContact}
                        onClick={() => selectedEmail && createContactFromEmail(selectedEmail)}
                      >
                        {linkingContact ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <UserPlus className="h-3.5 w-3.5" />
                        )}
                        Add as Contact
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* AI Insights */}
              {(triaging || selectedEmail.ai_triaged_at || selectedEmail.ai_summary) && (
                <div
                  className="px-6 py-3 bg-gradient-to-r from-violet-50 to-blue-50 dark:from-violet-950/30 dark:to-blue-950/30 border-b cursor-pointer hover:from-violet-100 hover:to-blue-100 dark:hover:from-violet-950/50 dark:hover:to-blue-950/50 transition-colors"
                  onClick={() => !triaging && setAiInsightsExpanded(!aiInsightsExpanded)}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400">
                      {triaging ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                      <span className="text-xs font-medium">
                        {triaging ? "Analyzing..." : "AI Insights"}
                      </span>
                      {!triaging && (
                        <ChevronRight className={`h-4 w-4 transition-transform ${aiInsightsExpanded ? "rotate-90" : ""}`} />
                      )}
                    </div>
                    {!triaging && !aiInsightsExpanded && (
                      <div className="flex-1 flex items-center gap-6 text-sm">
                        {selectedEmail.ai_summary && (
                          <p className="flex-1 text-slate-600 dark:text-slate-300 truncate">{selectedEmail.ai_summary}</p>
                        )}
                        {selectedEmail.ai_priority_score !== undefined && selectedEmail.ai_priority_score !== null && (
                          <div className="text-center flex-shrink-0">
                            <span className="text-xs text-muted-foreground block">Priority</span>
                            <span className={`font-semibold ${
                              selectedEmail.ai_priority_score > 0.7 ? "text-red-600" :
                              selectedEmail.ai_priority_score > 0.4 ? "text-yellow-600" : "text-green-600"
                            }`}>
                              {Math.round(selectedEmail.ai_priority_score * 100)}%
                            </span>
                          </div>
                        )}
                        {selectedEmail.ai_sentiment && (
                          <div className="text-center flex-shrink-0">
                            <span className="text-xs text-muted-foreground block">Sentiment</span>
                            <span className="font-medium capitalize">{selectedEmail.ai_sentiment}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Expanded AI Insights */}
                  {!triaging && aiInsightsExpanded && (
                    <div className="mt-4 space-y-4">
                      {/* Summary */}
                      {selectedEmail.ai_summary && (
                        <div>
                          <h4 className="text-xs font-semibold text-violet-700 dark:text-violet-300 uppercase tracking-wide mb-1">Summary</h4>
                          <p className="text-sm text-slate-700 dark:text-slate-200">{selectedEmail.ai_summary}</p>
                        </div>
                      )}

                      {/* Metrics Grid */}
                      <div className="grid grid-cols-4 gap-4">
                        {selectedEmail.ai_priority_score !== undefined && selectedEmail.ai_priority_score !== null && (
                          <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-3 text-center">
                            <span className="text-xs text-muted-foreground block mb-1">Priority Score</span>
                            <span className={`text-2xl font-bold ${
                              selectedEmail.ai_priority_score > 0.7 ? "text-red-600" :
                              selectedEmail.ai_priority_score > 0.4 ? "text-yellow-600" : "text-green-600"
                            }`}>
                              {Math.round(selectedEmail.ai_priority_score * 100)}%
                            </span>
                            <p className="text-xs text-muted-foreground mt-1">
                              {selectedEmail.ai_priority_score > 0.7 ? "High priority" :
                               selectedEmail.ai_priority_score > 0.4 ? "Medium priority" : "Low priority"}
                            </p>
                          </div>
                        )}

                        {selectedEmail.ai_sentiment && (
                          <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-3 text-center">
                            <span className="text-xs text-muted-foreground block mb-1">Sentiment</span>
                            <span className={`text-2xl font-bold capitalize ${
                              selectedEmail.ai_sentiment === "positive" ? "text-green-600" :
                              selectedEmail.ai_sentiment === "negative" ? "text-red-600" : "text-slate-600"
                            }`}>
                              {selectedEmail.ai_sentiment}
                            </span>
                            <p className="text-xs text-muted-foreground mt-1">Detected tone</p>
                          </div>
                        )}

                        {selectedEmail.ai_category && (
                          <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-3 text-center">
                            <span className="text-xs text-muted-foreground block mb-1">Category</span>
                            <span className="text-lg font-semibold capitalize text-slate-700 dark:text-slate-200">
                              {selectedEmail.ai_category}
                            </span>
                            <p className="text-xs text-muted-foreground mt-1">Auto-classified</p>
                          </div>
                        )}

                        {selectedEmail.requires_response !== undefined && (
                          <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-3 text-center">
                            <span className="text-xs text-muted-foreground block mb-1">Response</span>
                            <span className={`text-lg font-semibold ${
                              selectedEmail.requires_response ? "text-orange-600" : "text-green-600"
                            }`}>
                              {selectedEmail.requires_response ? "Needed" : "Optional"}
                            </span>
                            <p className="text-xs text-muted-foreground mt-1">
                              {selectedEmail.requires_response ? "Reply recommended" : "No action required"}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Quick Actions */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            triageEmail(selectedEmail);
                          }}
                        >
                          <RefreshCw className="h-3 w-3" />
                          Re-analyze
                        </Button>
                        {selectedEmail.requires_response && (
                          <Button
                            size="sm"
                            className="gap-1 bg-violet-600 hover:bg-violet-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              setComposerMode("ai-reply");
                              setShowComposer(true);
                            }}
                          >
                            <Sparkles className="h-3 w-3" />
                            Generate Reply
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Attachments */}
              {(selectedEmail.has_attachments || attachments.length > 0) && (
                <div className="px-6 py-3 border-b bg-slate-50/50 dark:bg-slate-800/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      Attachments {loadingAttachments ? "" : `(${attachments.length})`}
                    </span>
                  </div>
                  {loadingAttachments ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading attachments...
                    </div>
                  ) : attachments.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {attachments.map((att) => (
                        <div
                          key={att.id}
                          className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 rounded-lg border shadow-sm"
                        >
                          {att.mime_type?.startsWith("image/") ? (
                            <Image className="h-4 w-4 text-blue-500" />
                          ) : att.mime_type?.includes("pdf") ? (
                            <FileText className="h-4 w-4 text-red-500" />
                          ) : (
                            <File className="h-4 w-4 text-slate-500" />
                          )}
                          <span className="text-sm max-w-[150px] truncate" title={att.filename}>
                            {att.filename}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {att.size_bytes ? `${Math.round(att.size_bytes / 1024)}KB` : ""}
                          </span>
                          <div className="flex items-center gap-1 ml-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => downloadAttachment(att)}
                              title="Download"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                            {att.document_id ? (
                              <Badge variant="secondary" className="text-xs">
                                In Library
                              </Badge>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => saveToLibrary(att)}
                                disabled={savingAttachment === att.id}
                                title="Save to Library"
                              >
                                {savingAttachment === att.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <BookmarkPlus className="h-3.5 w-3.5" />
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No attachments found</p>
                  )}
                </div>
              )}

              {/* Email Body */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="prose dark:prose-invert max-w-none">
                  {selectedEmail.body_html ? (
                    <div dangerouslySetInnerHTML={{ __html: selectedEmail.body_html }} />
                  ) : (
                    <div className="whitespace-pre-wrap">{selectedEmail.body_text || "No content"}</div>
                  )}
                </div>
              </div>

              {/* Reply Actions */}
              <div className="p-4 border-t flex gap-2 bg-slate-50 dark:bg-slate-800/50">
                <Button
                  variant="outline"
                  onClick={() => {
                    setComposerMode("reply");
                    setShowComposer(true);
                  }}
                  className="gap-2"
                >
                  <Reply className="h-4 w-4" />
                  Reply
                </Button>
                <Button
                  onClick={() => {
                    setComposerMode("ai-reply");
                    setShowComposer(true);
                  }}
                  className="gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                >
                  <Sparkles className="h-4 w-4" />
                  AI Reply
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="h-20 w-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center">
                  <Mail className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-1">Select an email</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Choose an email from the list to view its contents
                </p>
                <Button
                  onClick={() => {
                    setComposerMode("new");
                    setShowComposer(true);
                  }}
                  className="gap-2"
                >
                  <Send className="h-4 w-4" />
                  Compose New Email
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Composer Modal */}
      <AnimatePresence>
        {showComposer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowComposer(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-3xl max-h-[85vh] overflow-y-auto"
            >
              <EmailComposer
                inReplyTo={
                  (composerMode === "reply" || composerMode === "ai-reply") && selectedEmail
                    ? selectedEmail.id
                    : undefined
                }
                initialTo={
                  (composerMode === "reply" || composerMode === "ai-reply") && selectedEmail
                    ? selectedEmail.from_email || ""
                    : ""
                }
                initialSubject={
                  (composerMode === "reply" || composerMode === "ai-reply") && selectedEmail?.subject
                    ? `Re: ${selectedEmail.subject.replace(/^Re:\s*/i, "")}`
                    : ""
                }
                initialAiPrompt={
                  composerMode === "ai-reply" && selectedEmail
                    ? `Write a professional reply to this email. Be helpful and concise.`
                    : ""
                }
                replyContext={
                  composerMode === "ai-reply" && selectedEmail
                    ? `Original email from ${selectedEmail.from_name || selectedEmail.from_email}:\nSubject: ${selectedEmail.subject}\n\n${selectedEmail.body_text}`
                    : ""
                }
                onSent={() => {
                  setShowComposer(false);
                  setComposerMode("new");
                  fetchEmails();
                }}
                onClose={() => {
                  setShowComposer(false);
                  setComposerMode("new");
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Dialog */}
      <InboxSettingsDialog
        open={showSettings}
        onOpenChange={setShowSettings}
      />
    </div>
  );
}
