/**
 * POST /api/orgs/[orgId]/invites — Org owner creates a single-use invite token.
 * GET  /api/orgs/[orgId]/invites — List pending (and all) invites for the org.
 *
 * Defense-in-depth: explicit ownership check runs BEFORE createInvite() to return
 * a clear 403 for non-owners instead of a potentially ambiguous RLS-blocked 500.
 * RLS on rfp_org_invites still acts as the database-layer backstop.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createInvite } from '@/lib/rfp/invites';

const CreateInviteBody = z.object({
  email:   z.string().email(),
  role:    z.enum(['owner', 'writer', 'reviewer', 'viewer']),
  message: z.string().max(500).optional(),
  ttlDays: z.number().int().min(1).max(60).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ orgId: string }> },
) {
  const { orgId } = await params;

  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  // Defense-in-depth: explicit ownership check before relying solely on RLS.
  // Returns a clear 403 for non-owners; avoids confusing 500s from RLS-blocked inserts.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: membership } = await (supabase as any)
    .from('rfp_user_orgs')
    .select('role')
    .eq('user_id', user.id)
    .eq('org_id', orgId)
    .single();

  if (!membership || membership.role !== 'owner') {
    return NextResponse.json({ error: 'Only org owners can send invites.' }, { status: 403 });
  }

  // Parse + validate request body
  let body: z.infer<typeof CreateInviteBody>;
  try {
    body = CreateInviteBody.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: 'invalid_body', detail: String(e) }, { status: 400 });
  }

  try {
    const invite = await createInvite({
      orgId,
      email:     body.email,
      role:      body.role,
      invitedBy: user.id,
      message:   body.message,
      ttlDays:   body.ttlDays,
    });

    // Return only the public fields + token (caller is responsible for sharing the token)
    return NextResponse.json(
      {
        invite: {
          id:         invite.id,
          token:      invite.token,
          email:      invite.email,
          role:       invite.role,
          expires_at: invite.expires_at,
        },
      },
      { status: 201 },
    );
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: 'create_failed', detail }, { status: 500 });
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ orgId: string }> },
) {
  const { orgId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  // RLS (rfp_org_invites_owner_all) handles the owner gate — non-owners get empty array.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('rfp_org_invites')
    .select('id, email, role, status, expires_at, created_at, accepted_at')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'fetch_failed' }, { status: 500 });
  }

  return NextResponse.json({ invites: data ?? [] });
}
