"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  FileText,
  Upload,
  Link2,
  MessageSquare,
  Mic,
  PenSquare,
  Plug,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Loader2,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import Link from "next/link";

interface TeachMethod {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  bgColor: string;
  action: "link" | "modal" | "upload";
  href?: string;
}

const TEACH_METHODS: TeachMethod[] = [
  {
    id: "brain-dump",
    title: "Brain Dump",
    description: "Free-form tell the AI about yourself, your work, goals, and preferences",
    icon: Brain,
    color: "text-violet-600 dark:text-violet-400",
    bgColor: "bg-violet-100 dark:bg-violet-900/50",
    action: "link",
    href: "/dashboard/onboarding/brain-dump",
  },
  {
    id: "quick-note",
    title: "Quick Note",
    description: "Add a quick piece of information for AI to remember",
    icon: PenSquare,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/50",
    action: "modal",
  },
  {
    id: "upload",
    title: "Upload Documents",
    description: "Upload PDFs, docs, and files for AI to learn from",
    icon: Upload,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/50",
    action: "link",
    href: "/dashboard/library?upload=true",
  },
  {
    id: "chat",
    title: "Teach via Chat",
    description: "Have a conversation where you explain things to AI",
    icon: MessageSquare,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-900/50",
    action: "link",
    href: "/dashboard/chat",
  },
  {
    id: "connect",
    title: "Connect Services",
    description: "Link Google, email, calendar, and other services",
    icon: Plug,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-900/50",
    action: "link",
    href: "/dashboard/settings?tab=integrations",
  },
  {
    id: "import-url",
    title: "Import from URL",
    description: "Fetch content from a webpage for AI to learn",
    icon: Link2,
    color: "text-cyan-600 dark:text-cyan-400",
    bgColor: "bg-cyan-100 dark:bg-cyan-900/50",
    action: "modal",
  },
];

const SUGGESTED_TOPICS = [
  "Your professional background and expertise",
  "Current projects and priorities",
  "Communication preferences",
  "Key contacts and relationships",
  "Goals for this quarter",
  "Challenges you're facing",
  "Your work style and habits",
  "Important deadlines and dates",
];

export default function TeachPage() {
  const [quickNote, setQuickNote] = useState("");
  const [showQuickNote, setShowQuickNote] = useState(false);
  const [showUrlImport, setShowUrlImport] = useState(false);
  const [urlToImport, setUrlToImport] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleMethodClick = (method: TeachMethod) => {
    if (method.action === "modal") {
      if (method.id === "quick-note") {
        setShowQuickNote(true);
      } else if (method.id === "import-url") {
        setShowUrlImport(true);
      }
    }
  };

  const handleQuickNoteSubmit = async () => {
    if (!quickNote.trim()) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/memory/teach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "quick_note",
          content: quickNote,
        }),
      });

      if (response.ok) {
        toast.success("AI will remember this!");
        setQuickNote("");
        setShowQuickNote(false);
      } else {
        toast.error("Failed to save note");
      }
    } catch (error) {
      toast.error("Failed to save note");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUrlImport = async () => {
    if (!urlToImport.trim()) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/memory/teach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "url_import",
          url: urlToImport,
        }),
      });

      if (response.ok) {
        toast.success("Content imported successfully!");
        setUrlToImport("");
        setShowUrlImport(false);
      } else {
        toast.error("Failed to import URL");
      }
    } catch (error) {
      toast.error("Failed to import URL");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 md:p-8 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3 md:gap-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="h-12 w-12 md:h-14 md:w-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-lg"
            >
              <Sparkles className="h-6 w-6 md:h-7 md:w-7 text-white" />
            </motion.div>
            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 dark:text-slate-100">
                Teach Your AI
              </h1>
              <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mt-1">
                The more your AI knows, the better it can help you
              </p>
            </div>
          </div>
          <Link href="/dashboard/memory">
            <Button variant="outline" className="gap-2">
              <Brain className="h-4 w-4" />
              View Memory
            </Button>
          </Link>
        </div>
      </div>

      {/* Teaching Methods */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {TEACH_METHODS.map((method) => {
          const Icon = method.icon;
          const isLink = method.action === "link" && method.href;

          const content = (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              className="p-6 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md transition-all cursor-pointer group h-full"
              onClick={() => !isLink && handleMethodClick(method)}
            >
              <div className="flex items-start gap-4">
                <div className={`h-12 w-12 rounded-xl ${method.bgColor} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                  <Icon className={`h-6 w-6 ${method.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                      {method.title}
                    </h3>
                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {method.description}
                  </p>
                </div>
              </div>
            </motion.div>
          );

          return isLink ? (
            <Link key={method.id} href={method.href!} className="block">
              {content}
            </Link>
          ) : (
            <div key={method.id}>{content}</div>
          );
        })}
      </div>

      {/* Suggested Topics */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <span className="text-slate-900 dark:text-slate-100">What to Teach</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Here are some things that help your AI assist you better:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {SUGGESTED_TOPICS.map((topic, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                <span className="text-sm text-slate-700 dark:text-slate-300">{topic}</span>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Link href="/dashboard/onboarding/brain-dump">
              <Button className="w-full bg-violet-600 hover:bg-violet-700 text-white gap-2">
                <Brain className="h-4 w-4" />
                Start Brain Dump
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Quick Note Modal */}
      {showQuickNote && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-xl p-6 w-full max-w-lg border border-slate-200 dark:border-slate-700 shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Quick Note
              </h3>
              <button
                onClick={() => setShowQuickNote(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
              >
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Tell your AI something to remember. For example: "I prefer concise answers" or "My main project is the Q1 marketing campaign"
            </p>
            <Textarea
              value={quickNote}
              onChange={(e) => setQuickNote(e.target.value)}
              placeholder="Type something for AI to remember..."
              className="min-h-[120px] mb-4"
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowQuickNote(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleQuickNoteSubmit}
                disabled={submitting || !quickNote.trim()}
                className="bg-violet-600 hover:bg-violet-700 text-white gap-2"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Save
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* URL Import Modal */}
      {showUrlImport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-xl p-6 w-full max-w-lg border border-slate-200 dark:border-slate-700 shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Import from URL
              </h3>
              <button
                onClick={() => setShowUrlImport(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
              >
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Enter a URL and AI will extract and learn from its content.
            </p>
            <input
              type="url"
              value={urlToImport}
              onChange={(e) => setUrlToImport(e.target.value)}
              placeholder="https://example.com/article"
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 mb-4"
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowUrlImport(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUrlImport}
                disabled={submitting || !urlToImport.trim()}
                className="bg-cyan-600 hover:bg-cyan-700 text-white gap-2"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Link2 className="h-4 w-4" />
                )}
                Import
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
