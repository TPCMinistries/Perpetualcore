import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/**
 * Owner allowlist from HQ_OWNER_EMAILS (comma-separated). Deny-all by design:
 * an unset env var means the gate blocks EVERYONE, never opens for anyone.
 */
function getOwnerAllowlist(): string[] {
  const raw = process.env.HQ_OWNER_EMAILS;
  if (!raw) return [];
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Server-side gate for /hq — Perpetual Core's own operator dashboard.
 * Requires an authenticated session AND an email on the HQ_OWNER_EMAILS
 * allowlist. Anything else redirects to /login with a return path.
 */
export async function requireHqOwner(returnPath: string): Promise<{ email: string }> {
  const allowlist = getOwnerAllowlist();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    redirect(`/login?next=${encodeURIComponent(returnPath)}`);
  }

  const email = user.email.toLowerCase();
  if (allowlist.length === 0 || !allowlist.includes(email)) {
    redirect(`/login?next=${encodeURIComponent(returnPath)}`);
  }

  return { email: user.email };
}
