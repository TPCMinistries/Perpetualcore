"use client";

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bot,
  Workflow,
  Zap,
  Clock,
  Play,
  Pause,
  MoreVertical,
  Edit,
  Copy,
  Trash2,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { Automation, AutomationType } from "./AutomationHub";
import { cn } from "@/lib/utils";

interface AutomationCardProps {
  automation: Automation;
  onToggle?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onRun?: () => void;
}

const typeConfig: Record<AutomationType, { icon: any; color: string; bg: string; href: string }> = {
  bot: {
    icon: Bot,
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    href: "/dashboard/bots",
  },
  workflow: {
    icon: Workflow,
    color: "text-violet-500",
    bg: "bg-violet-50 dark:bg-violet-950/30",
    href: "/dashboard/workflows",
  },
  n8n: {
    icon: Zap,
    color: "text-orange-500",
    bg: "bg-orange-50 dark:bg-orange-950/30",
    href: "/dashboard/n8n",
  },
  job: {
    icon: Clock,
    color: "text-green-500",
    bg: "bg-green-50 dark:bg-green-950/30",
    href: "/dashboard/jobs",
  },
};

const statusConfig = {
  active: { icon: CheckCircle2, color: "text-green-500", label: "Active" },
  inactive: { icon: Pause, color: "text-slate-400", label: "Inactive" },
  error: { icon: XCircle, color: "text-red-500", label: "Error" },
};

export function AutomationCard({
  automation,
  onToggle,
  onDelete,
  onDuplicate,
  onRun,
}: AutomationCardProps) {
  const type = typeConfig[automation.type];
  const status = statusConfig[automation.status];
  const Icon = type.icon;
  const StatusIcon = status.icon;
  const detailHref = `${type.href}/${automation.id}`;

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={cn("p-2 rounded-lg", type.bg)}>
              <Icon className={cn("h-5 w-5", type.color)} />
            </div>
            <div className="space-y-1">
              <Link href={detailHref} className="hover:underline">
                <h3 className="font-medium leading-tight">{automation.name}</h3>
              </Link>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {automation.type}
                </Badge>
                <span className={cn("flex items-center gap-1 text-xs", status.color)}>
                  <StatusIcon className="h-3 w-3" />
                  {status.label}
                </span>
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={detailHref}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Link>
              </DropdownMenuItem>
              {onRun && (
                <DropdownMenuItem onClick={onRun}>
                  <Play className="h-4 w-4 mr-2" />
                  Run Now
                </DropdownMenuItem>
              )}
              {onToggle && (
                <DropdownMenuItem onClick={onToggle}>
                  {automation.status === "active" ? (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
                      Disable
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Enable
                    </>
                  )}
                </DropdownMenuItem>
              )}
              {onDuplicate && (
                <DropdownMenuItem onClick={onDuplicate}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {onDelete && (
                <DropdownMenuItem onClick={onDelete} className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        {automation.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {automation.description}
          </p>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Runs</p>
            <p className="font-medium">{automation.runCount}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Success Rate</p>
            <p className={cn(
              "font-medium",
              automation.successRate >= 90 ? "text-green-600" :
              automation.successRate >= 70 ? "text-yellow-600" : "text-red-600"
            )}>
              {automation.successRate}%
            </p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t text-xs text-muted-foreground">
        <div className="flex justify-between w-full">
          {automation.lastRun ? (
            <span>Last run {formatDistanceToNow(new Date(automation.lastRun), { addSuffix: true })}</span>
          ) : (
            <span>Never run</span>
          )}
          {automation.nextRun && (
            <span>Next: {formatDistanceToNow(new Date(automation.nextRun), { addSuffix: true })}</span>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
