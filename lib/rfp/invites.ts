/**
 * lib/rfp/invites.ts — Server-side helpers for rfp_org_invites.
 *
 * Function summary:
 *  - createInvite:   owner mints a single-use token invite (RLS-scoped: only org owners can insert)
 *  - validateToken:  anyone can read invite metadata by token (admin client; invitee may not be authed)
 *  - acceptInvite:   authenticated invitee consumes the token and gets rfp_user_orgs membership
 *
 * NOTE: rfp_org_invites is not yet in database.types.ts (pending `supabase gen types` in Phase 5).
 * We cast with `as` per the existing pattern in lib/rfp/orgs.ts.
 *
 * Email delivery: NOT implemented here. The token is returned in the POST response body.
 * Phase 5 will add Resend-based invite email; see Phase 5 deferred items.
 */

import { randomBytes } from 'node:crypto';
import { createClient, createAdminClient } from '@/lib/supabase/server';

// ── Domain types ──────────────────────────────────────────────────────────────

export type InviteRole = 'owner' | 'writer' | 'reviewer' | 'viewer';
export type InviteStatus = 'pending' | 'accepted' | 'expired' | 'revoked';

export interface RfpOrgInvite {
  id: string;
  org_id: string;
  email: string;
  role: InviteRole;
  token: string;
  invited_by: string | null;
  status: InviteStatus;
  expires_at: string;
  message: string | null;
  created_at: string;
  accepted_at: string | null;
}

export interface CreateInviteInput {
  orgId: string;
  email: string;
  role: InviteRole;
  invitedBy: string;
  message?: string;
  /** Invite TTL in days. Default: 14. Max: 60. */
  ttlDays?: number;
}

export type ValidateTokenResult =
  | {
      valid: true;
      invite: Pick<RfpOrgInvite, 'id' | 'org_id' | 'email' | 'role' | 'status' | 'expires_at' | 'invited_by' | 'message'> & {
        org_name: string;
      };
    }
  | {
      valid: false;
      reason: 'not_found' | 'already_used' | 'expired';
      status?: InviteStatus;
    };

export interface AcceptInviteResult {
  orgId: string;
  role: InviteRole;
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function generateToken(): string {
  // 32 random bytes → base64url (43 chars, URL-safe, no padding)
  return randomBytes(32).toString('base64url');
}

// ── Public helpers ────────────────────────────────────────────────────────────

/**
 * createInvite — Mints a new invite for orgId:email:role.
 *
 * Uses RLS-scoped anon client (createClient). The rfp_org_invites_owner_all
 * policy enforces that only org owners can insert. This is the "trust RLS as
 * primary gate" approach. The POST route adds a defense-in-depth explicit
 * ownership check before calling this function.
 */
export async function createInvite(input: CreateInviteInput): Promise<RfpOrgInvite> {
  const supabase = await createClient();
  const ttlDays = input.ttlDays ?? 14;
  const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000).toISOString();
  const token = generateToken();

  const { data, error } = await supabase
    .from('rfp_org_invites')
    .insert({
      org_id:     input.orgId,
      email:      input.email.toLowerCase(),
      role:       input.role,
      token,
      invited_by: input.invitedBy,
      message:    input.message ?? null,
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`invite_create_failed: ${error?.message ?? 'no data returned'}`);
  }

  return data as RfpOrgInvite;
}

/**
 * validateToken — Returns invite metadata for display (org name, email, role).
 *
 * Uses admin client because the invitee is typically NOT logged in yet when
 * they first open the accept-invite URL. No token is consumed.
 */
export async function validateToken(token: string): Promise<ValidateTokenResult> {
  const admin = createAdminClient();

  const { data: invite } = await admin
    .from('rfp_org_invites')
    .select('id, org_id, email, role, status, expires_at, invited_by, message')
    .eq('token', token)
    .maybeSingle();

  if (!invite) {
    return { valid: false, reason: 'not_found' };
  }

  if ((invite as RfpOrgInvite).status !== 'pending') {
    return {
      valid: false,
      reason: 'already_used',
      status: (invite as RfpOrgInvite).status,
    };
  }

  if (new Date((invite as RfpOrgInvite).expires_at) < new Date()) {
    return { valid: false, reason: 'expired' };
  }

  // Fetch org name for the UI display card
  const { data: org } = await admin
    .from('rfp_orgs')
    .select('name')
    .eq('id', (invite as RfpOrgInvite).org_id)
    .single();

  return {
    valid: true,
    invite: {
      ...(invite as Pick<RfpOrgInvite, 'id' | 'org_id' | 'email' | 'role' | 'status' | 'expires_at' | 'invited_by' | 'message'>),
      org_name: (org as { name: string } | null)?.name ?? 'an organization',
    },
  };
}

/**
 * acceptInvite — Consumes the invite token for an authenticated user.
 *
 * Uses admin client for both:
 *  1. Fetching the invite (token-based, not email-based — avoids auth.email() reliability issues)
 *  2. Writing rfp_user_orgs membership (user is inserting their own row BUT we also need to
 *     update the invite row, which the user has no WRITE policy on → admin solves both atomically)
 *
 * Idempotent: if user is already a member with the same role, the upsert is a no-op.
 * The invite status is still updated to 'accepted' on every successful call.
 */
export async function acceptInvite(
  token: string,
  userId: string,
  userEmail: string,
): Promise<AcceptInviteResult> {
  const admin = createAdminClient();

  // Fetch the invite by token
  const { data: invite } = await admin
    .from('rfp_org_invites')
    .select('*')
    .eq('token', token)
    .maybeSingle();

  if (!invite) throw new Error('invite_not_found');
  const inv = invite as RfpOrgInvite;
  if (inv.status !== 'pending') throw new Error(`invite_${inv.status}`);
  if (new Date(inv.expires_at) < new Date()) throw new Error('invite_expired');

  // Email must match (case-insensitive) — prevent token-sharing attacks
  if (inv.email.toLowerCase() !== userEmail.toLowerCase()) {
    throw new Error('email_mismatch');
  }

  // Insert membership idempotently — on conflict keep existing role (DO NOTHING)
  const { error: memErr } = await admin
    .from('rfp_user_orgs')
    .upsert(
      { user_id: userId, org_id: inv.org_id, role: inv.role },
      { onConflict: 'user_id,org_id' },
    );

  if (memErr) {
    throw new Error(`membership_failed: ${memErr.message}`);
  }

  // Mark invite as accepted
  await admin
    .from('rfp_org_invites')
    .update({ status: 'accepted', accepted_at: new Date().toISOString() })
    .eq('id', inv.id);

  return { orgId: inv.org_id, role: inv.role };
}
