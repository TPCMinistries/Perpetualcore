"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  Copy,
  RefreshCw,
  AlertTriangle,
  Twitter,
  Linkedin,
  Instagram,
  Facebook,
  Mail,
  FileText,
  ListChecks,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AITaskRunnerProps {
  taskId: string;
  taskTitle: string;
  onComplete?: () => void;
  variant?: "button" | "icon";
  size?: "sm" | "default" | "lg";
}

interface ContentItem {
  title?: string;
  platform?: string;
  content: string;
}

interface ExecutionResult {
  success: boolean;
  strategy: "immediate" | "decompose" | "blocked";
  contentType?: string;
  content?: ContentItem[];
  subtasks?: Array<{ title: string; description?: string }>;
  blockReason?: string;
  summary?: string;
  confidence?: number;
  taskId?: string;
  savedDeliverables?: string[];
  deliverableCount?: number;
}

function PlatformIcon({ platform }: { platform?: string }) {
  const p = platform?.toLowerCase() || "";
  if (p.includes("twitter") || p.includes("x")) return <Twitter className="h-4 w-4" />;
  if (p.includes("linkedin")) return <Linkedin className="h-4 w-4" />;
  if (p.includes("instagram")) return <Instagram className="h-4 w-4" />;
  if (p.includes("facebook")) return <Facebook className="h-4 w-4" />;
  if (p.includes("email")) return <Mail className="h-4 w-4" />;
  return <FileText className="h-4 w-4" />;
}

export function AITaskRunner({
  taskId,
  taskTitle,
  onComplete,
  variant = "button",
  size = "sm",
}: AITaskRunnerProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);

  const viewDeliverables = () => {
    setShowResults(false);
    router.push(`/dashboard/tasks/${taskId}`);
  };

  const handleRun = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/tasks/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to execute task");
      }

      setResult(data);
      setShowResults(true);

      if (data.strategy === "immediate") {
        toast.success("Task completed by AI!");
        onComplete?.();
      } else if (data.strategy === "decompose") {
        toast.success(`Created ${data.subtasks?.length || 0} subtasks`);
        onComplete?.();
      } else if (data.strategy === "blocked") {
        toast.info("This task needs your input");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to run task");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (content: string) => {
    await navigator.clipboard.writeText(content);
    toast.success("Copied to clipboard");
  };

  const handleCopyAll = async () => {
    if (!result?.content) return;
    const allContent = result.content
      .map((item) => {
        const header = item.platform ? `[${item.platform}]` : item.title ? `[${item.title}]` : "";
        return `${header}\n${item.content}`;
      })
      .join("\n\n---\n\n");
    await navigator.clipboard.writeText(allContent);
    toast.success("All content copied");
  };

  return (
    <>
      {variant === "button" ? (
        <Button
          variant="outline"
          size={size}
          onClick={handleRun}
          disabled={loading}
          className="gap-2"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 text-purple-500" />
          )}
          {size !== "sm" && (loading ? "Running..." : "Run with AI")}
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRun}
          disabled={loading}
          className="h-8 w-8"
          title="Run with AI"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 text-purple-500" />
          )}
        </Button>
      )}

      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {result?.strategy === "immediate" && (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              )}
              {result?.strategy === "decompose" && (
                <ListChecks className="h-5 w-5 text-blue-500" />
              )}
              {result?.strategy === "blocked" && (
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              )}
              AI Execution Results
            </DialogTitle>
            <DialogDescription>
              {result?.summary || `Results for: ${taskTitle}`}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            {/* Immediate execution - Show generated content */}
            {result?.strategy === "immediate" && result.content && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {result.content.length} item{result.content.length !== 1 ? "s" : ""} generated
                  </Badge>
                  <Button variant="outline" size="sm" onClick={handleCopyAll}>
                    <Copy className="h-3.5 w-3.5 mr-1.5" />
                    Copy All
                  </Button>
                </div>

                {result.content.map((item, index) => (
                  <Card key={index} className="overflow-hidden">
                    <div className="bg-muted/50 px-4 py-2 flex items-center justify-between border-b">
                      <div className="flex items-center gap-2">
                        <PlatformIcon platform={item.platform} />
                        <span className="font-medium text-sm">
                          {item.platform || item.title || `Item ${index + 1}`}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(item.content)}
                        className="h-7"
                      >
                        <Copy className="h-3.5 w-3.5 mr-1" />
                        Copy
                      </Button>
                    </div>
                    <CardContent className="p-4">
                      <p className="text-sm whitespace-pre-wrap">{item.content}</p>
                    </CardContent>
                  </Card>
                ))}

                {result.confidence && (
                  <p className="text-xs text-muted-foreground text-right">
                    Confidence: {Math.round(result.confidence * 100)}%
                  </p>
                )}
              </div>
            )}

            {/* Decomposition - Show created subtasks */}
            {result?.strategy === "decompose" && result.subtasks && (
              <div className="space-y-4">
                <Badge variant="secondary" className="gap-1">
                  <ListChecks className="h-3 w-3" />
                  Created {result.subtasks.length} subtasks
                </Badge>

                <div className="space-y-2">
                  {result.subtasks.map((subtask, index) => (
                    <Card key={index}>
                      <CardContent className="py-3 px-4">
                        <p className="font-medium text-sm">{subtask.title}</p>
                        {subtask.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {subtask.description}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <p className="text-sm text-muted-foreground">
                  The original task has been broken down into smaller steps. Complete each
                  subtask to finish the main task.
                </p>
              </div>
            )}

            {/* Blocked - Show reason */}
            {result?.strategy === "blocked" && (
              <div className="space-y-4">
                <Card className="border-amber-200 bg-amber-50">
                  <CardContent className="py-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-amber-800">Action Required</p>
                        <p className="text-sm text-amber-700 mt-1">
                          {result.blockReason ||
                            "This task requires human intervention to complete."}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </ScrollArea>

          <div className="flex justify-end gap-2 pt-4 border-t mt-4">
            <Button variant="outline" onClick={() => setShowResults(false)}>
              Close
            </Button>
            {result?.strategy === "immediate" && (
              <>
                <Button variant="outline" onClick={handleRun} disabled={loading}>
                  <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
                  Regenerate
                </Button>
                {result.deliverableCount && result.deliverableCount > 0 && (
                  <Button onClick={viewDeliverables}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Deliverables
                  </Button>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
