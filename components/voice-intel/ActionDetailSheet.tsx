"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, ExternalLink } from "lucide-react";
import { ClassificationBadge } from "./ClassificationBadge";
import { PeopleList } from "./PeopleList";
import type { VoiceIntelAction } from "@/lib/voice-intel/types";

interface ActionDetailSheetProps {
  action: VoiceIntelAction | null;
  open: boolean;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
}

export function ActionDetailSheet({
  action,
  open,
  onClose,
  onApprove,
  onReject,
}: ActionDetailSheetProps) {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const handleReject = () => {
    if (!action || !rejectionReason.trim()) return;
    onReject(action.id, rejectionReason.trim());
    setRejectionReason("");
    setShowRejectForm(false);
  };

  const handleApprove = () => {
    if (!action) return;
    onApprove(action.id);
  };

  const handleClose = () => {
    setShowRejectForm(false);
    setRejectionReason("");
    onClose();
  };

  if (!action) return null;

  const showActions = action.tier === "red" && action.status === "pending";

  return (
    <Sheet open={open} onOpenChange={(o) => !o && handleClose()}>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{action.title}</SheetTitle>
          <SheetDescription>
            Action details and classification
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 py-4">
          {/* Classification triple */}
          {action.related_entity && (
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1.5">
                Classification
              </p>
              <ClassificationBadge
                entity={action.related_entity}
                activity={action.action_type}
                actionType={action.tier}
              />
            </div>
          )}

          {/* Description */}
          {action.description && (
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1.5">
                Description
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                {action.description}
              </p>
            </div>
          )}

          {/* Status */}
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1.5">Status</p>
            <Badge variant="outline">{action.status}</Badge>
          </div>

          {/* Tier */}
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1.5">Tier</p>
            <Badge
              variant="outline"
              className={
                action.tier === "red"
                  ? "border-red-300 text-red-700 dark:text-red-400"
                  : action.tier === "yellow"
                  ? "border-amber-300 text-amber-700 dark:text-amber-400"
                  : "border-emerald-300 text-emerald-700 dark:text-emerald-400"
              }
            >
              {action.tier}
            </Badge>
          </div>

          {/* Action type */}
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1.5">
              Action Type
            </p>
            <Badge variant="secondary">{action.action_type}</Badge>
          </div>

          {/* People */}
          {action.related_people && action.related_people.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1.5">
                People
              </p>
              <PeopleList people={action.related_people} />
            </div>
          )}

          {/* Delivery payload */}
          {action.delivery_payload &&
            Object.keys(action.delivery_payload).length > 0 && (
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1.5">
                  Delivery Payload
                </p>
                <pre className="text-xs bg-slate-50 dark:bg-slate-900 rounded-md p-3 overflow-x-auto max-h-48">
                  {JSON.stringify(action.delivery_payload, null, 2)}
                </pre>
              </div>
            )}

          {/* Rejection reason (if rejected) */}
          {action.rejection_reason && (
            <div>
              <p className="text-xs font-medium text-red-500 mb-1.5">
                Rejection Reason
              </p>
              <p className="text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/20 rounded-md p-2">
                {action.rejection_reason}
              </p>
            </div>
          )}

          {/* Timestamps */}
          <div className="text-xs text-slate-400 space-y-1">
            <p>Created: {new Date(action.created_at).toLocaleString()}</p>
            {action.approved_at && (
              <p>Approved: {new Date(action.approved_at).toLocaleString()}</p>
            )}
            {action.completed_at && (
              <p>
                Completed: {new Date(action.completed_at).toLocaleString()}
              </p>
            )}
          </div>

          {/* Link to source voice memo */}
          {action.voice_memo_id && (
            <a
              href="/dashboard/voice-memos"
              className="inline-flex items-center gap-1.5 text-sm text-violet-600 dark:text-violet-400 hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              View source voice memo
            </a>
          )}
        </div>

        {/* Actions footer */}
        {showActions && (
          <SheetFooter className="border-t pt-4">
            {showRejectForm ? (
              <div className="w-full space-y-3">
                <Textarea
                  placeholder="Reason for rejection..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowRejectForm(false);
                      setRejectionReason("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleReject}
                    disabled={!rejectionReason.trim()}
                  >
                    Confirm Reject
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2 w-full">
                <Button
                  variant="outline"
                  className="flex-1 gap-1 text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/30"
                  onClick={() => setShowRejectForm(true)}
                >
                  <X className="h-4 w-4" />
                  Reject
                </Button>
                <Button
                  className="flex-1 gap-1 bg-emerald-600 hover:bg-emerald-700"
                  onClick={handleApprove}
                >
                  <Check className="h-4 w-4" />
                  Approve
                </Button>
              </div>
            )}
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
