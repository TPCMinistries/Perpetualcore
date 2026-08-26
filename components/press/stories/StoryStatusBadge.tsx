import { AlertCircle, CheckCircle2, CircleDot, Loader2, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PressStoryStatus } from "@/lib/press/stories/types";

const STATUS: Record<PressStoryStatus, { label: string; className: string; icon: typeof CircleDot }> = {
  collecting: { label: "Collecting", className: "border-zinc-300 bg-zinc-100 text-zinc-700", icon: CircleDot },
  interviewing: { label: "Interviewing", className: "border-blue-200 bg-blue-50 text-blue-700", icon: MessageCircle },
  generating: { label: "Generating", className: "border-violet-200 bg-violet-50 text-violet-700", icon: Loader2 },
  ready: { label: "Ready", className: "border-emerald-200 bg-emerald-50 text-emerald-700", icon: CheckCircle2 },
  failed: { label: "Needs attention", className: "border-red-200 bg-red-50 text-red-700", icon: AlertCircle },
};

export function StoryStatusBadge({ status }: { status: PressStoryStatus }) {
  const config = STATUS[status] ?? STATUS.collecting;
  const Icon = config.icon;
  const isWorking = status === "generating";

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium", config.className)}>
      <Icon className={cn("h-3.5 w-3.5", isWorking && "animate-spin motion-reduce:animate-none")} aria-hidden />
      {config.label}
    </span>
  );
}
