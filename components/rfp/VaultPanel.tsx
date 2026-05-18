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

interface VaultPanelProps {
  orgId: string;
  canWrite: boolean;
  canDelete: boolean;
}

export function VaultPanel({ orgId, canWrite, canDelete }: VaultPanelProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="flex flex-col gap-8">
      {canWrite ? (
        <VaultUploadForm
          orgId={orgId}
          onUploaded={() => setRefreshKey((k) => k + 1)}
        />
      ) : (
        <div className="rounded-md border border-zinc-800 bg-zinc-950 p-5 text-sm text-zinc-300">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-amber-300">
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
