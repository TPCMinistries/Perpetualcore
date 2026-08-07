"use client";

/**
 * VaultPanel — small client wrapper that owns the `refreshKey` state shared
 * between VaultUploadForm (which bumps it after a successful upload) and
 * VaultArtifactList (which refetches when it changes).
 *
 * Keeping this tiny shim client-side lets the surrounding settings page stay
 * a server component (so we can use the auth+RLS pattern from
 * settings/voice/page.tsx).
 */

import { useState } from "react";
import { VaultUploadForm } from "./VaultUploadForm";
import { VaultArtifactList } from "./VaultArtifactList";
import { VaultQuickSeedModal } from "./VaultQuickSeedModal";

interface VaultPanelProps {
  orgId: string;
  canWrite: boolean;
  canDelete: boolean;
}

export function VaultPanel({ orgId, canWrite, canDelete }: VaultPanelProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="flex flex-col gap-8">
      {canWrite && (
        <div className="rounded-md border border-zinc-200 bg-white p-5 shadow-sm flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-emerald-700">
              No past docs handy?
            </p>
            <p className="mt-1.5 text-sm text-zinc-700">
              Describe what your org has actually done — programs, outcomes,
              partners, geography, history. The AI expands it into a structured
              capacity narrative and indexes it for retrieval. Good enough to
              seed drafts now; add real past proposals later.
            </p>
          </div>
          <VaultQuickSeedModal
            orgId={orgId}
            onSeeded={() => setRefreshKey((k) => k + 1)}
          />
        </div>
      )}
      {canWrite ? (
        <VaultUploadForm
          orgId={orgId}
          onUploaded={() => setRefreshKey((k) => k + 1)}
        />
      ) : (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-5 text-sm text-zinc-700">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-amber-700">
            Read-only
          </p>
          <p className="mt-2">
            Your role can view the vault but not upload new documents. Ask an
            owner or writer to add past proposals, annual reports, or founder
            letters.
          </p>
        </div>
      )}
      <VaultArtifactList
        orgId={orgId}
        refreshKey={refreshKey}
        canDelete={canDelete}
      />
    </div>
  );
}
