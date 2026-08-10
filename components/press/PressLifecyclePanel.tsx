"use client";

import { useState } from "react";
import { AlertCircle, Archive, Download, Loader2, ShieldCheck, Trash2 } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deletePressProject, downloadPressProjectExport, getErrorMessage } from "./api-client";
import type { PressProject } from "./types";

export function PressLifecyclePanel({ project, onArchive, onDeleted }: {
  project: PressProject;
  onArchive: () => void;
  onDeleted: () => void;
}) {
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmationTitle, setConfirmationTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const canManage = project.permissions?.canManageLifecycle === true;

  async function exportMetadata() {
    setExporting(true);
    setError(null);
    try {
      await downloadPressProjectExport(project.id);
    } catch (exportError) {
      setError(getErrorMessage(exportError));
    } finally {
      setExporting(false);
    }
  }

  async function permanentlyDelete() {
    setDeleting(true);
    setError(null);
    try {
      await deletePressProject(project.id, confirmationTitle);
      setDeleteOpen(false);
      onDeleted();
    } catch (deleteError) {
      setError(getErrorMessage(deleteError));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section className="mt-6 border border-zinc-300 bg-[#f6f1e8] p-5 sm:p-6" aria-labelledby="recording-controls-heading">
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#1648d8]" aria-hidden />
        <div>
          <h2 id="recording-controls-heading" className="font-semibold text-zinc-950">Your recording, under your control</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-zinc-600">
            During the guided pilot, Press keeps the source and production history until an authorized workspace manager permanently deletes the recording. Archiving stops new work and makes the record read-only; it does not remove files.
          </p>
        </div>
      </div>
      {error && <div className="mt-4 flex items-start gap-2 border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />{error}</div>}
      <div className="mt-5 flex flex-wrap gap-2">
        {canManage && (
          <Button type="button" variant="outline" className="h-11 bg-white" disabled={exporting} onClick={() => void exportMetadata()}>
            {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden /> : <Download className="mr-2 h-4 w-4" aria-hidden />}
            Export record
          </Button>
        )}
        {canManage && project.status !== "archived" && (
          <Button type="button" variant="outline" className="h-11 bg-white" onClick={onArchive}>
            <Archive className="mr-2 h-4 w-4" aria-hidden /> Archive recording
          </Button>
        )}
        {canManage && project.status === "archived" && (
          <Button type="button" variant="outline" className="h-11 border-red-300 bg-white text-red-800 hover:bg-red-50 hover:text-red-900" onClick={() => { setConfirmationTitle(""); setError(null); setDeleteOpen(true); }}>
            <Trash2 className="mr-2 h-4 w-4" aria-hidden /> Permanently delete
          </Button>
        )}
      </div>
      {!canManage && <p className="mt-4 text-xs text-zinc-500">Ask a workspace owner or administrator to export, archive, or permanently delete this recording.</p>}

      <AlertDialog open={deleteOpen} onOpenChange={(open) => { if (!deleting) setDeleteOpen(open); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently delete this recording?</AlertDialogTitle>
            <AlertDialogDescription>
            This removes the source file, renders, transcript, clips, analytics, and production history. It cannot be undone. Export the record first if you need a copy. A recent unfinished upload may require a 48-hour safety window before deletion.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-2">
            <label htmlFor="delete-project-title" className="text-sm font-medium text-zinc-900">Type <span className="font-semibold">{project.title}</span> to confirm</label>
            <Input id="delete-project-title" autoComplete="off" value={confirmationTitle} onChange={(event) => setConfirmationTitle(event.target.value)} />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Keep recording</AlertDialogCancel>
            <AlertDialogAction className="bg-red-700 text-white hover:bg-red-800" disabled={deleting || confirmationTitle !== project.title} onClick={(event) => { event.preventDefault(); void permanentlyDelete(); }}>
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden />}
              Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
