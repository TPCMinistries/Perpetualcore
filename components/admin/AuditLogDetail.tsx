"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Shield,
  Clock,
  User,
  Globe,
  Monitor,
  FileText,
  AlertCircle,
} from "lucide-react";
import type { AuditLog } from "@/types";
import { formatDistanceToNow, format } from "date-fns";

interface AuditLogDetailProps {
  logId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusStyles: Record<string, string> = {
  success: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  failure: "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800",
  warning: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
};

const severityStyles: Record<string, string> = {
  debug: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
  info: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  warning: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
  error: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400",
  critical: "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400",
};

function DetailRow({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="h-4 w-4 mt-0.5 text-slate-400" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-sm text-slate-900 dark:text-slate-100 break-all">{value}</p>
      </div>
    </div>
  );
}

export default function AuditLogDetail({ logId, open, onOpenChange }: AuditLogDetailProps) {
  const [log, setLog] = useState<AuditLog | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (logId && open) {
      setLoading(true);
      fetch(`/api/audit-logs/${logId}`)
        .then((res) => res.json())
        .then((data) => setLog(data.log || null))
        .catch(() => setLog(null))
        .finally(() => setLoading(false));
    } else {
      setLog(null);
    }
  }, [logId, open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-violet-600" />
            Audit Log Detail
          </SheetTitle>
          <SheetDescription>
            Full details for the selected audit event
          </SheetDescription>
        </SheetHeader>

        {loading && (
          <div className="space-y-4 mt-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
            ))}
          </div>
        )}

        {!loading && !log && logId && (
          <div className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="h-8 w-8 text-slate-400 mb-2" />
            <p className="text-sm text-slate-500">Audit log not found</p>
          </div>
        )}

        {!loading && log && (
          <div className="mt-6 space-y-6">
            {/* Event Info */}
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
                {log.description}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={statusStyles[log.status] || statusStyles.success}>
                  {log.status}
                </Badge>
                <Badge variant="outline" className={severityStyles[log.severity] || severityStyles.info}>
                  {log.severity}
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {log.event_category.replace("_", " ")}
                </Badge>
              </div>
            </div>

            <Separator />

            {/* Timestamp */}
            <div>
              <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Timestamp
              </h4>
              <DetailRow
                icon={Clock}
                label="Event Time"
                value={`${format(new Date(log.created_at), "PPpp")} (${formatDistanceToNow(new Date(log.created_at), { addSuffix: true })})`}
              />
            </div>

            <Separator />

            {/* Actor */}
            <div>
              <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Actor
              </h4>
              <DetailRow icon={User} label="Email" value={log.actor_email} />
              <DetailRow icon={User} label="Name" value={log.actor_name} />
              <DetailRow icon={Globe} label="IP Address" value={log.actor_ip_address} />
              <DetailRow icon={Monitor} label="User Agent" value={log.actor_user_agent} />
            </div>

            <Separator />

            {/* Event Details */}
            <div>
              <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Event
              </h4>
              <DetailRow icon={Shield} label="Event Type" value={log.event_type} />
              <DetailRow icon={Shield} label="Action" value={log.event_action} />
              <DetailRow icon={FileText} label="Resource Type" value={log.resource_type} />
              <DetailRow icon={FileText} label="Resource ID" value={log.resource_id} />
              <DetailRow icon={FileText} label="Resource Name" value={log.resource_name} />
            </div>

            {/* Error */}
            {log.error_message && (
              <>
                <Separator />
                <div>
                  <h4 className="text-xs font-semibold text-rose-500 uppercase tracking-wider mb-2">
                    Error
                  </h4>
                  <p className="text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 rounded-lg p-3">
                    {log.error_message}
                  </p>
                </div>
              </>
            )}

            {/* Metadata */}
            {log.metadata && typeof log.metadata === "object" && Object.keys(log.metadata).length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Metadata
                  </h4>
                  <pre className="text-xs bg-slate-50 dark:bg-slate-800 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-all text-slate-700 dark:text-slate-300">
                    {JSON.stringify(log.metadata, null, 2)}
                  </pre>
                </div>
              </>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
