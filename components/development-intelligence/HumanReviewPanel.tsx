"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, RotateCcw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export function HumanReviewPanel({
  analysisId,
  currentStatus,
  currentNote,
}: {
  analysisId: string;
  currentStatus: string;
  currentNote: string | null;
}) {
  const router = useRouter();
  const [note, setNote] = useState(currentNote || "");
  const [saving, setSaving] = useState<string | null>(null);

  async function save(status: "approved" | "needs_revision" | "rejected") {
    setSaving(status);
    try {
      const response = await fetch(
        `/api/development-intelligence/analyses/${analysisId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status, note: note.trim() || undefined }),
        }
      );
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Review failed");
      toast.success("Human review saved.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save review");
    } finally {
      setSaving(null);
    }
  }

  return (
    <Card className="border-amber-200 bg-amber-50/60 print:hidden">
      <CardHeader>
        <CardTitle className="text-base">Human review gate</CardTitle>
        <p className="text-sm leading-6 text-slate-600">
          Confirm that observations are supported, job-relevant where applicable,
          appropriately limited, and free of prohibited inference.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Reviewer note, corrections, or limitations..."
          className="min-h-24 bg-white"
          maxLength={2_000}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => save("approved")}
            disabled={saving !== null}
            className="bg-emerald-700 hover:bg-emerald-800"
          >
            {saving === "approved" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-2 h-4 w-4" />
            )}
            Approve evidence
          </Button>
          <Button
            variant="outline"
            onClick={() => save("needs_revision")}
            disabled={saving !== null}
          >
            {saving === "needs_revision" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="mr-2 h-4 w-4" />
            )}
            Request revision
          </Button>
          <Button
            variant="outline"
            onClick={() => save("rejected")}
            disabled={saving !== null}
            className="border-rose-200 text-rose-700 hover:bg-rose-50"
          >
            {saving === "rejected" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <XCircle className="mr-2 h-4 w-4" />
            )}
            Reject report
          </Button>
        </div>
        <p className="text-xs text-slate-500">
          Current status: {currentStatus.replaceAll("_", " ")}
        </p>
      </CardContent>
    </Card>
  );
}
