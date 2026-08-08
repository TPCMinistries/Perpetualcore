import { AlertCircle, CheckCircle2, CircleDot, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PressProjectStatus } from "./types";

const STATUS: Record<PressProjectStatus, { label: string; className: string; icon: typeof CircleDot }> = {
  draft: { label: "Awaiting source", className: "border-zinc-300 bg-zinc-100 text-zinc-700", icon: CircleDot },
  uploading: { label: "Uploading", className: "border-blue-200 bg-blue-50 text-blue-700", icon: Loader2 },
  processing: { label: "Processing", className: "border-blue-200 bg-blue-50 text-blue-700", icon: Loader2 },
  transcribing: { label: "Transcribing", className: "border-blue-200 bg-blue-50 text-blue-700", icon: Loader2 },
  review: { label: "Ready for review", className: "border-amber-200 bg-amber-50 text-amber-800", icon: CircleDot },
  rendering: { label: "Rendering", className: "border-violet-200 bg-violet-50 text-violet-700", icon: Loader2 },
  ready: { label: "Ready", className: "border-emerald-200 bg-emerald-50 text-emerald-700", icon: CheckCircle2 },
  failed: { label: "Needs attention", className: "border-red-200 bg-red-50 text-red-700", icon: AlertCircle },
  archived: { label: "Archived", className: "border-zinc-300 bg-zinc-100 text-zinc-600", icon: CircleDot },
};

export function PressStatusBadge({ status }: { status: PressProjectStatus }) {
  const config = STATUS[status] ?? STATUS.draft;
  const Icon = config.icon;
  const isWorking = status === "uploading" || status === "processing" || status === "transcribing" || status === "rendering";

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium", config.className)}>
      <Icon className={cn("h-3.5 w-3.5", isWorking && "animate-spin motion-reduce:animate-none")} aria-hidden />
      {config.label}
    </span>
  );
}
