"use client";

/**
 * ProposalSectionEditor — per-section inline editor for the proposal view.
 *
 * Read mode (default): renders `content` as preformatted text with [VERIFY: ...]
 * markers highlighted. An "Edit" button flips into edit mode.
 *
 * Edit mode: focuses a textarea, shows Save / Cancel. Cmd+S / Ctrl+S also saves.
 * Save calls PATCH /api/rfp/proposals/:proposalId/sections/:sectionId, updates
 * local state with the new version, and flips back to read mode.
 *
 * Status line copy (honest):
 *   - version == 1 AND last_drafted_by_agent_at != null → "Last drafted by agent"
 *   - otherwise → "Edited v{version}"
 *
 * v1 is dumb-but-real: no autosave, no diff history, no optimistic concurrency
 * (last write wins on this section row). The version bump is monotonic so two
 * simultaneous saves both succeed but the later one overwrites the earlier.
 * That's a Phase 2 problem.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { MarkupRenderer, type CitationChunk } from "./MarkupRenderer";
import { SectionFindings } from "./SectionFindings";
import type { ReviewerFinding } from "@/lib/rfp/review/rubric";

export interface ProposalSectionEditorProps {
  proposalId: string;
  sectionId: string;
  sectionType: string;
  sectionLabel: string;
  initialContent: string;
  initialVersion: number;
  lastDraftedByAgentAt: string | null;
  /**
   * Ordered vault chunks used at draft time. Array position + 1 = N in
   * `[CITE: vault-N]` markers inside `content`. Optional: older proposals
   * predating Wave 1 of "Best-Site Plan" have no persisted chunks, in which
   * case citation pills render in the "source unavailable" state.
   */
  vaultChunks?: CitationChunk[];
  /**
   * Reviewer findings filtered to this section_type (the parent page does
   * the filtering). Empty array renders nothing — the panel is fully
   * collapsed away for sections with no findings.
   */
  findings?: ReviewerFinding[];
}

interface PatchResponse {
  version: number;
  updated_at: string;
}

interface PatchError {
  error: string;
  detail?: string;
}

export function ProposalSectionEditor({
  proposalId,
  sectionId,
  sectionType: _sectionType,
  sectionLabel,
  initialContent,
  initialVersion,
  lastDraftedByAgentAt,
  vaultChunks,
  findings,
}: ProposalSectionEditorProps) {
  const [content, setContent] = useState<string>(initialContent);
  const [draft, setDraft] = useState<string>(initialContent);
  const [version, setVersion] = useState<number>(initialVersion);
  const [editing, setEditing] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const statusLine =
    version === 1 && lastDraftedByAgentAt
      ? "Last drafted by agent"
      : `Edited v${version}`;

  const onEnterEdit = useCallback(() => {
    setDraft(content);
    setError(null);
    setEditing(true);
  }, [content]);

  const onCancel = useCallback(() => {
    setDraft(content);
    setError(null);
    setEditing(false);
  }, [content]);

  const onSave = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/rfp/proposals/${proposalId}/sections/${sectionId}`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ content: draft }),
        },
      );
      const payload = (await res.json()) as PatchResponse | PatchError;
      if (!res.ok || !("version" in payload)) {
        const msg =
          "error" in payload
            ? `${payload.error}${payload.detail ? `: ${payload.detail}` : ""}`
            : `http_${res.status}`;
        setError(msg);
        return;
      }
      setContent(draft);
      setVersion(payload.version);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "network error");
    } finally {
      setSaving(false);
    }
  }, [draft, proposalId, sectionId, saving]);

  // Cmd+S / Ctrl+S inside the textarea triggers save.
  useEffect(() => {
    if (!editing) return;
    const el = textareaRef.current;
    if (!el) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void onSave();
      }
    };
    el.addEventListener("keydown", handler);
    el.focus();
    return () => {
      el.removeEventListener("keydown", handler);
    };
  }, [editing, onSave]);

  return (
    <section>
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500">
          {sectionLabel}
        </h2>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-400">
            {statusLine}
          </span>
          {editing ? null : (
            <button
              type="button"
              onClick={onEnterEdit}
              className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700 transition hover:bg-emerald-100"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      {editing ? (
        <div className="mt-3 space-y-3">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            spellCheck
            className="w-full rounded-md border border-zinc-300 bg-white px-4 py-3 font-mono text-[13px] leading-relaxed text-zinc-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
            style={{ minHeight: "320px", resize: "vertical" }}
          />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => void onSave()}
              disabled={saving}
              className="inline-flex items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-400">
              Cmd/Ctrl+S to save
            </span>
            {error ? (
              <span className="text-[12px] text-rose-700">Save failed: {error}</span>
            ) : null}
          </div>
        </div>
      ) : (
        <>
          <div className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-zinc-700">
            <MarkupRenderer text={content} vaultChunks={vaultChunks} />
          </div>
          {findings && findings.length > 0 ? (
            <SectionFindings findings={findings} />
          ) : null}
        </>
      )}
    </section>
  );
}
