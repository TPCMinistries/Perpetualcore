/**
 * /org/[orgId]/settings/voice — Voice Fingerprint trainer page.
 *
 * Server component. Membership is enforced by the parent
 * app/(dashboard)/org/[orgId]/layout.tsx (getOrgForUser → notFound). By the
 * time we render here the caller IS a member.
 *
 * This page does:
 *   1. Resolve the caller's role so we can show a read-only state to
 *      reviewer/viewer roles (only owner/writer can train).
 *   2. Load the current voice_fingerprint from rfp_orgs.
 *   3. Hand off to <VoiceTrainingForm /> with the current fingerprint (or
 *      null when empty/not trained yet).
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { VoiceTrainingForm } from "@/components/rfp/VoiceTrainingForm";
import { isVoiceFingerprint, type VoiceFingerprint } from "@/lib/rfp/voice/extract";

interface PageProps {
  params: Promise<{ orgId: string }>;
}

interface OrgRow {
  name: string;
  voice_fingerprint: unknown;
}

export default async function VoiceSettingsPage({ params }: PageProps) {
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

  const role = (membership as { role: string } | null)?.role ?? "viewer";
  const canTrain = role === "owner" || role === "writer";

  const { data: orgRow } = await supabase
    .from("rfp_orgs")
    .select("name, voice_fingerprint")
    .eq("id", orgId)
    .maybeSingle<OrgRow>();
  if (!orgRow) {
    notFound();
  }

  const fingerprint: VoiceFingerprint | null = isVoiceFingerprint(orgRow.voice_fingerprint)
    ? orgRow.voice_fingerprint
    : null;

  return (
    <div className="container max-w-3xl py-10">
      <Link
        href={`/org/${orgId}/discovery`}
        className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500 hover:text-zinc-700"
      >
        ← Discovery
      </Link>

      <header className="mt-6 mb-10">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500">
          Settings · Voice
        </p>
        <h1
          className="mt-2 text-3xl leading-tight italic text-zinc-900"
          style={{ fontFamily: "Georgia, serif" }}
        >
          Train {orgRow.name}&apos;s voice
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-zinc-600">
          The drafter normally writes in a generic voice and flags every
          org-specific fact as [VERIFY]. When you train a voice fingerprint
          here, the drafter inherits your cadence, signature phrases, and the
          terms you avoid — applied to its system prompt at every generation.
        </p>
      </header>

      {canTrain ? (
        <VoiceTrainingForm orgId={orgId} initialFingerprint={fingerprint} />
      ) : (
        <ReadOnlyState fingerprint={fingerprint} role={role} />
      )}
    </div>
  );
}

function ReadOnlyState({
  fingerprint,
  role,
}: {
  fingerprint: VoiceFingerprint | null;
  role: string;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-md border border-amber-200 bg-amber-50 p-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-amber-700">
          Read-only · {role}
        </p>
        <p className="mt-3 text-sm text-zinc-700">
          You can see the current voice fingerprint but not retrain it. Ask an
          owner or writer to update the org&apos;s voice.
        </p>
      </div>
      {fingerprint ? (
        // Re-uses the form's renderer indirectly by reusing the same fields layout
        // is overkill — the simplest honest path is to inline a minimal summary.
        <section className="rounded-md border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500">
            Current voice fingerprint
          </h2>
          <p
            className="mt-4 text-zinc-700 italic leading-relaxed"
            style={{ fontFamily: "Georgia, serif" }}
          >
            {fingerprint.voice_summary}
          </p>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
            Register: {fingerprint.register} · {fingerprint.source_doc_count} source docs · v
            {fingerprint.version}
          </p>
        </section>
      ) : (
        <div className="rounded-md border border-zinc-200 bg-white p-6">
          <p className="text-sm text-zinc-500">Not trained yet.</p>
        </div>
      )}
    </div>
  );
}
