/**
 * Phase 05-07 — /org/[orgId]/settings/alerts — Alert preferences page.
 *
 * Server component. Org membership is already enforced by the parent layout
 * (app/(dashboard)/org/[orgId]/layout.tsx → getOrgForUser → notFound). By the
 * time we render here the caller IS a member.
 *
 * The page does THREE things server-side:
 *   1. Resolve the caller's role (owner / writer / reviewer / viewer) so the
 *      form knows whether to enable the org-default column.
 *   2. Pre-load both the org-default row and the caller's user-override row
 *      via the same query patterns the API uses — RLS sees them via the
 *      request-scoped client.
 *   3. Hand off to <AlertPrefsForm /> with everything wired up.
 */

import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AlertPrefsForm } from './AlertPrefsForm';

interface PageProps {
  params: Promise<{ orgId: string }>;
}

interface PrefsRow {
  id: string;
  org_id: string;
  user_id: string | null;
  threshold: number;
  email_enabled: boolean;
  email_address: string | null;
  telegram_enabled: boolean;
  telegram_chat_id: string | null;
  discord_enabled: boolean;
  discord_webhook: string | null;
  digest_mode: boolean;
}

const PREFS_COLUMNS =
  'id, org_id, user_id, threshold, email_enabled, email_address, telegram_enabled, telegram_chat_id, discord_enabled, discord_webhook, digest_mode';

export default async function AlertsSettingsPage({ params }: PageProps) {
  const { orgId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    notFound();
  }

  const rfp = supabase as unknown as { from: (table: string) => any };

  // Caller's role in this org. Used to gate the org-default column in the UI.
  const { data: membership } = await rfp
    .from('rfp_user_orgs')
    .select('role')
    .eq('org_id', orgId)
    .eq('user_id', user.id)
    .maybeSingle();
  const role = (membership as { role: string } | null)?.role ?? 'viewer';
  const isOwner = role === 'owner';

  // Org default (user_id IS NULL).
  const { data: orgDefaultRaw } = await rfp
    .from('rfp_alert_prefs')
    .select(PREFS_COLUMNS)
    .eq('org_id', orgId)
    .is('user_id', null)
    .maybeSingle();
  const orgDefault = (orgDefaultRaw as PrefsRow | null) ?? null;

  // Caller's override.
  const { data: myOverrideRaw } = await rfp
    .from('rfp_alert_prefs')
    .select(PREFS_COLUMNS)
    .eq('org_id', orgId)
    .eq('user_id', user.id)
    .maybeSingle();
  const myOverride = (myOverrideRaw as PrefsRow | null) ?? null;

  // Optional — surface whether telegram is configured server-side so the form
  // can render the "Telegram unavailable" hint without leaking the token.
  const telegramConfigured = !!process.env.TELEGRAM_BOT_TOKEN;

  return (
    <div className="container max-w-5xl py-10">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-wide text-zinc-500 font-mono mb-2">
          Settings · Alerts
        </p>
        <h1 className="text-2xl font-semibold text-zinc-900">
          High-fit opportunity alerts
        </h1>
        <p
          className="mt-2 text-sm text-zinc-600 max-w-2xl"
          style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
        >
          When the scanner finds an opportunity whose fit score meets your
          threshold, we send an alert through your configured channels. The
          org default applies to everyone unless they set a personal override.
        </p>
      </header>

      <AlertPrefsForm
        orgId={orgId}
        userEmailHint={user.email ?? null}
        isOwner={isOwner}
        telegramConfigured={telegramConfigured}
        orgDefault={orgDefault}
        myOverride={myOverride}
      />
    </div>
  );
}
