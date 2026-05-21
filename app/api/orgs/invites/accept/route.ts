/**
 * POST /api/orgs/invites/accept — Authenticated invitee accepts an invite token.
 *
 * The caller MUST be logged in. The logged-in user's email must match the invite email.
 * Returns { orgId, role } on success and redirects responsibility to the client.
 * Idempotent: calling twice with the same token returns `invite_accepted` error on the
 * second call (status already changed; no second membership row created).
 *
 * Error codes:
 *   401 unauthorized       — not logged in or no email on session
 *   400 invalid_body       — bad request JSON
 *   403 email_mismatch     — logged-in email ≠ invite email
 *   400 invite_not_found   — token doesn't exist
 *   400 invite_accepted    — already accepted
 *   400 invite_expired     — TTL elapsed
 *   400 invite_revoked     — invite was cancelled
 *   500 membership_failed  — DB write failure
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { acceptInvite } from '@/lib/rfp/invites';

const AcceptBody = z.object({
  token: z.string().min(8),
});

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body: z.infer<typeof AcceptBody>;
  try {
    body = AcceptBody.parse(await req.json());
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  try {
    const result = await acceptInvite(body.token, user.id, user.email);
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const status = msg === 'email_mismatch' ? 403 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
