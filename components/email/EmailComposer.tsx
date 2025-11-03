"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface EmailComposerProps {
  inReplyTo?: string;
  onSent?: () => void;
  onClose?: () => void;
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

export function EmailComposer({ inReplyTo, onSent, onClose }: EmailComposerProps) {
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [subject, setSubject] = useState("");
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
      const response = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to_emails: to.split(",").map(e => e.trim()).filter(e => e),
          cc_emails: cc ? cc.split(",").map(e => e.trim()).filter(e => e) : [],
          bcc_emails: bcc ? bcc.split(",").map(e => e.trim()).filter(e => e) : [],
          subject,
          body_text: body,
          scheduled_at: scheduled ? scheduleTime : null,
          in_reply_to: inReplyTo,
        }),
      });

      if (response.ok) {
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
        onSent?.();
        onClose?.();
      } else {
        const data = await response.json();
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
    if (!aiPrompt.trim()) {
      toast.error("Please describe what you want to write");
      return;
    }

    setAiGenerating(true);
    try {
      const response = await fetch("/api/email/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiPrompt,
          context: {
            subject,
            to: to.split(",").map(e => e.trim()).filter(e => e),
            in_reply_to: inReplyTo,
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

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Header */}
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
    </Card>
  );
}
