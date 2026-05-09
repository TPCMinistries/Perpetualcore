/**
 * GET /api/orgs/invites/validate?token=... — Read invite metadata by token.
 *
 * No authentication required — the invitee may not yet have an account.
 * Uses admin client under the hood (lib/rfp/invites.ts: validateToken).
 * Does NOT consume the invite token.
 *
 * Response:
 *   200 { valid: true,  invite: { org_name, email, role, status, expires_at, ... } }
 *   200 { valid: false, reason: 'not_found' | 'already_used' | 'expired', status? }
 *   400 { valid: false, reason: 'missing_token' }
 */

import { NextResponse } from 'next/server';
import { validateToken } from '@/lib/rfp/invites';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get('token');

  if (!token || token.trim().length === 0) {
    return NextResponse.json({ valid: false, reason: 'missing_token' }, { status: 400 });
  }

  const result = await validateToken(token.trim());
  return NextResponse.json(result);
}
