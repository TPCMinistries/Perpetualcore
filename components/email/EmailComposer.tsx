"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Send,
  Clock,
  Sparkles,
  X,
  FileText,
  Calendar,
  Save,
  Paperclip,
  Trash2,
  File,
  Image,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface EmailComposerProps {
  inReplyTo?: string;
  initialTo?: string;
  initialSubject?: string;
  initialAiPrompt?: string; // If provided, auto-triggers AI generation
  replyContext?: string; // Original email body for AI context
  contactIds?: string[]; // Contact IDs to link email to after sending
  contactContext?: { // Display context about contacts being emailed
    names: string[];
    count: number;
  };
  onSent?: (emailData?: { id: string; subject: string }) => void;
  onClose?: () => void;
  compact?: boolean; // Use compact mode for embedding in dialogs
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body_text: string;
  body_html?: string;
  variables: string[];
  category: string;
}

interface AttachmentFile {
  file: File;
  id: string;
  uploading?: boolean;
}

export function EmailComposer({
  inReplyTo,
  initialTo = "",
  initialSubject = "",
  initialAiPrompt = "",
  replyContext = "",
  contactIds = [],
  contactContext,
  onSent,
  onClose,
  compact = false,
}: EmailComposerProps) {
  const [to, setTo] = useState(initialTo);
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [scheduleTime, setScheduleTime] = useState("");
  const [showSchedule, setShowSchedule] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchTemplates();
    // Auto-save draft every 30 seconds
    const interval = setInterval(() => {
      if (to || subject || body) {
        saveDraft();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [to, subject, body]);

  // Auto-trigger AI generation if initialAiPrompt is provided (for AI Reply)
  useEffect(() => {
    if (initialAiPrompt && !body) {
      setAiPrompt(initialAiPrompt);
      // Slight delay to allow component to fully render
      const timer = setTimeout(() => {
        handleAiGenerateWithContext(initialAiPrompt);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [initialAiPrompt]);

  async function fetchTemplates() {
    try {
      const response = await fetch("/api/email/templates");
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
    }
  }

  async function saveDraft() {
    try {
      await fetch("/api/email/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to_emails: to.split(",").map(e => e.trim()).filter(e => e),
          cc_emails: cc ? cc.split(",").map(e => e.trim()).filter(e => e) : [],
          bcc_emails: bcc ? bcc.split(",").map(e => e.trim()).filter(e => e) : [],
          subject,
          body_text: body,
          in_reply_to: inReplyTo,
        }),
      });
    } catch (error) {
      console.error("Error saving draft:", error);
    }
  }

  async function handleSend(scheduled = false) {
    if (!to.trim()) {
      toast.error("Please add at least one recipient");
      return;
    }

    if (!subject.trim()) {
      toast.error("Please add a subject");
      return;
    }

    if (!body.trim()) {
      toast.error("Please write your message");
      return;
    }

    setSending(true);
    try {
      // Use FormData to support file uploads
      const formData = new FormData();
      formData.append("to_emails", JSON.stringify(to.split(",").map(e => e.trim()).filter(e => e)));
      formData.append("cc_emails", JSON.stringify(cc ? cc.split(",").map(e => e.trim()).filter(e => e) : []));
      formData.append("bcc_emails", JSON.stringify(bcc ? bcc.split(",").map(e => e.trim()).filter(e => e) : []));
      formData.append("subject", subject);
      formData.append("body_text", body);
      if (scheduled && scheduleTime) {
        formData.append("scheduled_at", scheduleTime);
      }
      if (inReplyTo) {
        formData.append("in_reply_to", inReplyTo);
      }

      // Add attachments
      attachments.forEach((att) => {
        formData.append("attachments", att.file);
      });

      const response = await fetch("/api/email/send", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        const emailId = data.email?.id;

        // Link email to contacts if contactIds provided
        if (emailId && contactIds.length > 0) {
          try {
            // Link to each contact and log interaction
            await Promise.all(
              contactIds.map(async (contactId) => {
                // Link email to contact
                await fetch(`/api/inbox/emails/${emailId}/contact`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ contact_id: contactId }),
                });

                // Log interaction on contact
                await fetch(`/api/contacts/${contactId}/interactions`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    interaction_type: "email",
                    direction: "outbound",
                    subject: subject,
                    summary: `Sent email: ${subject}`,
                    related_email_id: emailId,
                  }),
                });
              })
            );
          } catch (linkError) {
            console.error("Error linking email to contacts:", linkError);
            // Don't fail the whole operation for linking errors
          }
        }

        if (scheduled) {
          toast.success(`Email scheduled for ${new Date(scheduleTime).toLocaleString()}`);
        } else {
          toast.success("Email sent successfully!");
        }
        // Clear form
        setTo("");
        setCc("");
        setBcc("");
        setSubject("");
        setBody("");
        setScheduleTime("");
        setAttachments([]);
        onSent?.({ id: emailId, subject });
        onClose?.();
      } else {
        toast.error(data.error || "Failed to send email");
      }
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error("An error occurred while sending");
    } finally {
      setSending(false);
    }
  }

  async function handleAiGenerate() {
    handleAiGenerateWithContext(aiPrompt);
  }

  async function handleAiGenerateWithContext(prompt: string) {
    if (!prompt.trim()) {
      toast.error("Please describe what you want to write");
      return;
    }

    setAiGenerating(true);
    try {
      const response = await fetch("/api/email/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt,
          context: {
            subject,
            to: to.split(",").map(e => e.trim()).filter(e => e),
            in_reply_to: inReplyTo,
            original_email: replyContext, // Include original email for context
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSubject(data.subject || subject);
        setBody(data.body);
        toast.success("Email draft generated!");
      } else {
        toast.error("Failed to generate draft");
      }
    } catch (error) {
      console.error("Error generating draft:", error);
      toast.error("An error occurred");
    } finally {
      setAiGenerating(false);
      setAiPrompt("");
    }
  }

  function useTemplate(template: EmailTemplate) {
    setSubject(template.subject);
    setBody(template.body_text);
    setShowTemplates(false);
    toast.success(`Template "${template.name}" applied`);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;

    const newAttachments: AttachmentFile[] = [];
    const maxSize = 25 * 1024 * 1024; // 25MB per file (Gmail limit)

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > maxSize) {
        toast.error(`${file.name} is too large (max 25MB)`);
        continue;
      }
      newAttachments.push({
        file,
        id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
      });
    }

    setAttachments((prev) => [...prev, ...newAttachments]);
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function removeAttachment(id: string) {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  const content = (
    <div className={compact ? "space-y-4" : "p-6 space-y-4"}>
      {/* Contact Context Banner */}
      {contactContext && contactContext.count > 0 && (
        <div className="flex items-center gap-2 p-3 bg-violet-50 dark:bg-violet-900/20 rounded-lg border border-violet-200 dark:border-violet-800">
          <div className="h-8 w-8 rounded-full bg-violet-100 dark:bg-violet-800 flex items-center justify-center">
            <Send className="h-4 w-4 text-violet-600 dark:text-violet-300" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-violet-900 dark:text-violet-100">
              Emailing {contactContext.count} contact{contactContext.count !== 1 ? "s" : ""}
            </p>
            <p className="text-xs text-violet-600 dark:text-violet-300 truncate">
              {contactContext.names.slice(0, 3).join(", ")}
              {contactContext.names.length > 3 && ` +${contactContext.names.length - 3} more`}
            </p>
          </div>
        </div>
      )}

      {/* Header - hide in compact mode */}
      {!compact && (
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">New Email</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTemplates(true)}
            >
              <FileText className="mr-2 h-4 w-4" />
              Templates
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={saveDraft}
            >
              <Save className="mr-2 h-4 w-4" />
              Save Draft
            </Button>
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}

        {/* Recipients */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="To (comma-separated)"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
            <div className="flex gap-1">
              <Button
                variant={showCc ? "default" : "outline"}
                size="sm"
                onClick={() => setShowCc(!showCc)}
              >
                Cc
              </Button>
              <Button
                variant={showBcc ? "default" : "outline"}
                size="sm"
                onClick={() => setShowBcc(!showBcc)}
              >
                Bcc
              </Button>
            </div>
          </div>

          {showCc && (
            <Input
              placeholder="Cc (comma-separated)"
              value={cc}
              onChange={(e) => setCc(e.target.value)}
            />
          )}

          {showBcc && (
            <Input
              placeholder="Bcc (comma-separated)"
              value={bcc}
              onChange={(e) => setBcc(e.target.value)}
            />
          )}
        </div>

        {/* Subject */}
        <Input
          placeholder="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />

        {/* AI Generation */}
        <div className="flex gap-2">
          <Input
            placeholder="✨ AI: Describe what you want to write..."
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleAiGenerate();
              }
            }}
          />
          <Button
            onClick={handleAiGenerate}
            disabled={aiGenerating || !aiPrompt.trim()}
          >
            {aiGenerating ? (
              "Generating..."
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate
              </>
            )}
          </Button>
        </div>

        {/* Body */}
        <Textarea
          placeholder="Write your message..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={12}
          className="resize-none"
        />

        {/* Attachments */}
        <div className="space-y-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            multiple
            className="hidden"
          />

          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-700 rounded-md border text-sm"
                >
                  {att.file.type.startsWith("image/") ? (
                    <Image className="h-4 w-4 text-blue-500" />
                  ) : (
                    <File className="h-4 w-4 text-slate-500" />
                  )}
                  <span className="max-w-[150px] truncate">{att.file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatFileSize(att.file.size)}
                  </span>
                  <button
                    onClick={() => removeAttachment(att.id)}
                    className="ml-1 text-muted-foreground hover:text-red-500 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button
              onClick={() => handleSend(false)}
              disabled={sending}
            >
              <Send className="mr-2 h-4 w-4" />
              {sending ? "Sending..." : "Send Now"}
            </Button>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="mr-2 h-4 w-4" />
              Attach
              {attachments.length > 0 && (
                <span className="ml-1 text-xs bg-primary/10 px-1.5 py-0.5 rounded">
                  {attachments.length}
                </span>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowSchedule(true)}
            >
              <Clock className="mr-2 h-4 w-4" />
              Schedule
            </Button>
          </div>

          {showSchedule && (
            <div className="flex gap-2 items-center">
              <Input
                type="datetime-local"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="w-auto"
              />
              <Button
                onClick={() => handleSend(true)}
                disabled={sending || !scheduleTime}
              >
                <Calendar className="mr-2 h-4 w-4" />
                Schedule Send
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowSchedule(false);
                  setScheduleTime("");
                }}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>

      {/* Templates Dialog */}
      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Templates</DialogTitle>
            <DialogDescription>
              Choose a template to get started quickly
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 mt-4">
            {templates.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No templates found. Create templates to speed up your email workflow!
              </p>
            ) : (
              templates.map((template) => (
                <div
                  key={template.id}
                  className="p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => useTemplate(template)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium">{template.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {template.subject}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                        {template.body_text}
                      </p>
                    </div>
                    <span className="text-xs bg-secondary px-2 py-1 rounded">
                      {template.category}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  return compact ? content : <Card>{content}</Card>;
}
