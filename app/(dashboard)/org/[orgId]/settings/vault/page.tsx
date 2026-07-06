/**
 * /org/[orgId]/settings/vault — Vault Grounding v1 dashboard.
 *
 * Server component. Same membership + role pattern as settings/voice/page.tsx.
 *
 * v1 honest scope: plaintext paste only. PDF/Docx upload arrives in Phase 2.
 * Retrieval is wired and queryable — but the drafter does NOT yet consume
 * vault chunks. Integration into the drafter ships in a follow-up commit.
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { VaultPanel } from "@/components/rfp/VaultPanel";

interface PageProps {
  params: Promise<{ orgId: string }>;
}

interface OrgRow {
  name: string;
}

export default async function VaultSettingsPage({ params }: PageProps) {
  const { orgId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    notFound();
  }

  const { data: membership } = await supabase
    .from("rfp_user_orgs")
    .select("role")
    .eq("org_id", orgId)
    .eq("user_id", user.id)
    .maybeSingle();

  const role = (membership as { role: string } | null)?.role ?? null;
  if (!role) {
    notFound();
  }

  const canWrite = role === "owner" || role === "writer";
  const canDelete = role === "owner";

  const { data: orgRow } = await supabase
    .from("rfp_orgs")
    .select("name")
    .eq("id", orgId)
    .maybeSingle<OrgRow>();
  if (!orgRow) {
    notFound();
  }

  return (
    <div className="container max-w-3xl py-10">
      <Link
        href={`/org/${orgId}/discovery`}
        className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500 hover:text-zinc-300"
      >
        ← Discovery
      </Link>

      <header className="mt-6 mb-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500">
          Settings · Vault
        </p>
        <h1
          className="mt-2 text-3xl leading-tight italic text-zinc-100"
          style={{ fontFamily: "Georgia, serif" }}
        >
          {orgRow.name}&apos;s vault
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-zinc-400">
          Vault — preview. Paste past proposals, annual reports, founder
          letters. Each doc gets chunked, embedded, and stored as evidence the
          drafter can retrieve when grounding claims. Today&apos;s v1 only
          supports plaintext paste — PDF/Docx upload is Phase 2.
        </p>
        <p className="mt-2 max-w-2xl text-xs text-zinc-500">
          Note: the drafter does not yet read from the vault. Retrieval ships
          separately. Uploads you make today become available to the drafter
          the moment that integration lands.
        </p>
      </header>

      <VaultPanel orgId={orgId} canWrite={canWrite} canDelete={canDelete} />
    </div>
  );
}
