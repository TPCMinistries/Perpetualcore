/**
 * /unsubscribe — opt-out for RFP nurture sequences.
 *
 * v1 model: GET ?email=...&seq=... unsubscribes that email from the named
 * sequence (or all sequences if `seq` is omitted). No token signing —
 * the URL is one-way and only sets `unsubscribed_at`; an attacker
 * trolling through emails can stop someone else's sequence but cannot
 * read anything or take destructive action. We accept that risk in
 * exchange for CAN-SPAM compliance and a frictionless one-click flow.
 */

import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; seq?: string }>;
}) {
  const params = await searchParams;
  const email = params.email?.toLowerCase().trim() ?? null;
  const seq = params.seq?.trim() ?? null;

  let outcome: "ok" | "noop" | "error" = "noop";
  let count = 0;

  if (email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    const admin = createAdminClient();
    const update = admin
      .from("rfp_email_enrollments")
      .update({ unsubscribed_at: new Date().toISOString() })
      .eq("email", email)
      .is("unsubscribed_at", null);
    const { data, error } = seq
      ? await update.eq("sequence_key", seq).select("id")
      : await update.select("id");
    if (error) {
      outcome = "error";
    } else {
      outcome = "ok";
      count = data?.length ?? 0;
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-lg px-6 py-24">
        <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-emerald-300">
          RFP Engine
        </div>
        <h1
          className="mt-3 text-2xl italic text-white"
          style={{ fontFamily: "Georgia, serif" }}
        >
          {outcome === "ok"
            ? count > 0
              ? "You're unsubscribed."
              : "Already unsubscribed."
            : outcome === "error"
              ? "Something went wrong."
              : "Unsubscribe from RFP Engine emails"}
        </h1>
        {outcome === "ok" ? (
          <p className="mt-4 text-[14px] leading-relaxed text-zinc-400">
            We won't send any further sequence emails to{" "}
            <span className="text-zinc-200">{email}</span>
            {seq ? <> for the {seq} series</> : null}. Transactional emails
            (security, billing, password resets) still send.
          </p>
        ) : outcome === "error" ? (
          <p className="mt-4 text-[14px] leading-relaxed text-zinc-400">
            We couldn't process your unsubscribe right now. Email{" "}
            <a
              className="text-emerald-300 underline"
              href="mailto:lorenzo@tpcmin.org?subject=RFP%20unsubscribe"
            >
              lorenzo@tpcmin.org
            </a>{" "}
            and we'll remove you manually.
          </p>
        ) : (
          <p className="mt-4 text-[14px] leading-relaxed text-zinc-400">
            This page needs an <code>?email=</code> parameter from the
            footer of an RFP Engine email. To unsubscribe manually, email{" "}
            <a
              className="text-emerald-300 underline"
              href="mailto:lorenzo@tpcmin.org?subject=RFP%20unsubscribe"
            >
              lorenzo@tpcmin.org
            </a>
            .
          </p>
        )}
      </div>
    </main>
  );
}
