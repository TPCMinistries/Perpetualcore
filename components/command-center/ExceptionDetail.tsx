"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Exception,
  ExceptionEvent,
  ExceptionStatus,
  getSeverityColor,
  getStatusColor,
  getSourceLabel,
} from "@/types/command-center";
import {
  Clock,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  User,
  Loader2,
  Code,
  Sparkles,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ExceptionDetailProps {
  exception: Exception | null;
  events: ExceptionEvent[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export function ExceptionDetail({
  exception,
  events,
  open,
  onOpenChange,
  onUpdate,
}: ExceptionDetailProps) {
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<ExceptionStatus | "">("");
  const [resolutionNotes, setResolutionNotes] = useState("");

  if (!exception) return null;

  const handleSave = async () => {
    if (!status) return;

    setSaving(true);
    try {
      const response = await fetch(
        `/api/command-center/exceptions/${exception.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status,
            resolution_notes: resolutionNotes || undefined,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to update");

      toast.success("Exception updated");
      onUpdate();
      onOpenChange(false);
    } catch {
      toast.error("Failed to update exception");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-2">
            <AlertTriangle
              className={cn(
                "h-5 w-5 mt-0.5",
                exception.severity === "critical" && "text-red-500",
                exception.severity === "high" && "text-orange-500",
                exception.severity === "medium" && "text-yellow-500",
                exception.severity === "low" && "text-slate-500"
              )}
            />
            <div>
              <DialogTitle>{exception.title}</DialogTitle>
              <DialogDescription className="mt-1">
                {getSourceLabel(exception.source_type)}
                {exception.source_name && ` - ${exception.source_name}`}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={cn(getSeverityColor(exception.severity))}>
              {exception.severity}
            </Badge>
            <Badge
              variant="outline"
              className={cn(getStatusColor(exception.status))}
            >
              {exception.status}
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Created{" "}
              {formatDistanceToNow(new Date(exception.created_at), {
                addSuffix: true,
              })}
            </span>
            {exception.retry_count > 0 && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <RefreshCw className="h-3 w-3" />
                {exception.retry_count} retries
              </span>
            )}
          </div>

          {/* Description */}
          {exception.description && (
            <div>
              <Label className="text-xs text-muted-foreground">Description</Label>
              <p className="text-sm mt-1">{exception.description}</p>
            </div>
          )}

          {/* Error Message */}
          {exception.error_message && (
            <div>
              <Label className="text-xs text-muted-foreground">Error Message</Label>
              <div className="mt-1 p-2 rounded bg-red-50 text-red-700 text-sm font-mono">
                {exception.error_message}
              </div>
            </div>
          )}

          {/* Error Code */}
          {exception.error_code && (
            <div>
              <Label className="text-xs text-muted-foreground">Error Code</Label>
              <code className="text-sm bg-slate-100 px-2 py-0.5 rounded">
                {exception.error_code}
              </code>
            </div>
          )}

          {/* Stack Trace */}
          {exception.stack_trace && (
            <div>
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Code className="h-3 w-3" />
                Stack Trace
              </Label>
              <pre className="mt-1 p-2 rounded bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto max-h-32">
                {exception.stack_trace}
              </pre>
            </div>
          )}

          {/* AI Suggestion */}
          {exception.ai_suggested_resolution && (
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
              <Label className="text-xs text-blue-700 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                AI Suggested Resolution
                {exception.ai_confidence_score && (
                  <span className="ml-1">
                    ({Math.round(exception.ai_confidence_score * 100)}% confidence)
                  </span>
                )}
              </Label>
              <p className="text-sm text-blue-800 mt-1">
                {exception.ai_suggested_resolution}
              </p>
            </div>
          )}

          {/* Resolution Notes (if resolved) */}
          {exception.resolution_notes && (
            <div>
              <Label className="text-xs text-muted-foreground">
                Resolution Notes
              </Label>
              <p className="text-sm mt-1 p-2 rounded bg-green-50 text-green-800">
                {exception.resolution_notes}
              </p>
            </div>
          )}

          {/* Update Form */}
          {exception.status !== "resolved" && exception.status !== "dismissed" && (
            <div className="space-y-3 pt-2 border-t">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Update Status</Label>
                  <Select
                    value={status}
                    onValueChange={(v) => setStatus(v as ExceptionStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="acknowledged">
                        <span className="flex items-center gap-2">
                          <CheckCircle2 className="h-3 w-3" />
                          Acknowledge
                        </span>
                      </SelectItem>
                      <SelectItem value="in_progress">
                        <span className="flex items-center gap-2">
                          <RefreshCw className="h-3 w-3" />
                          In Progress
                        </span>
                      </SelectItem>
                      <SelectItem value="resolved">
                        <span className="flex items-center gap-2 text-green-600">
                          <CheckCircle2 className="h-3 w-3" />
                          Resolved
                        </span>
                      </SelectItem>
                      <SelectItem value="dismissed">
                        <span className="flex items-center gap-2 text-slate-600">
                          <XCircle className="h-3 w-3" />
                          Dismiss
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {(status === "resolved" || status === "dismissed") && (
                <div className="space-y-2">
                  <Label htmlFor="notes">Resolution Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Describe how the issue was resolved..."
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              )}
            </div>
          )}

          {/* Event History */}
          {events.length > 0 && (
            <div className="pt-2 border-t">
              <Label className="text-xs text-muted-foreground">Activity</Label>
              <div className="mt-2 space-y-2">
                {events.slice(0, 5).map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-2 text-xs"
                  >
                    <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                      {event.performed_by_system ? (
                        <RefreshCw className="h-3 w-3 text-slate-500" />
                      ) : (
                        <User className="h-3 w-3 text-slate-500" />
                      )}
                    </div>
                    <div>
                      <span className="font-medium capitalize">
                        {event.event_type.replace("_", " ")}
                      </span>
                      {event.from_status && event.to_status && (
                        <span className="text-muted-foreground">
                          {" "}
                          from {event.from_status} to {event.to_status}
                        </span>
                      )}
                      <span className="text-muted-foreground ml-2">
                        {format(new Date(event.created_at), "MMM d, h:mm a")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {exception.status !== "resolved" && exception.status !== "dismissed" && (
            <Button onClick={handleSave} disabled={!status || saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
