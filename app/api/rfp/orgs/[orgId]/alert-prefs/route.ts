/**
 * Phase 05-07 — Alert preferences API.
 *
 *   GET  /api/rfp/orgs/[orgId]/alert-prefs?scope=org|me
 *   POST /api/rfp/orgs/[orgId]/alert-prefs?scope=org|me
 *
 * Both scopes use request-scoped `createClient()` so RLS enforces:
 *   - scope=org: writes only succeed when the caller is an org owner
 *     (rfp_alert_prefs_org_default_owner policy: user_id IS NULL + owned org).
 *   - scope=me:  writes only succeed when the caller is a member writing
 *     their own override (rfp_alert_prefs_user_override_self policy).
 *
 * We avoid the partial-index ON CONFLICT path because it requires the unique
 * index column-with-WHERE-clause syntax which supabase-js's onConflict option
 * doesn't speak. Instead we SELECT first → INSERT/UPDATE branch. Simpler and
 * RLS-checked the same way.
 *
 * 404 (not 403) on non-member orgs — matches the rest of the rfp_* surface.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getOrgForUser } from '@/lib/rfp/orgs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ── Validation schemas ──────────────────────────────────────────────────────

const ScopeSchema = z.enum(['org', 'me']);

/**
 * All fields optional on input — server merges with existing row (or system
 * defaults). Threshold range matches the CHECK constraint in the migration.
 */
const PrefsBodySchema = z
  .object({
    threshold: z
      .number()
      .min(60, 'threshold must be >= 60')
      .max(100, 'threshold must be <= 100')
      .optional(),
    email_enabled: z.boolean().optional(),
    email_address: z.string().email().nullable().optional(),
    telegram_enabled: z.boolean().optional(),
    telegram_chat_id: z.string().min(1).max(64).nullable().optional(),
    discord_enabled: z.boolean().optional(),
    discord_webhook: z
      .string()
      .url()
      .refine((u) => u.startsWith('https://'), {
        message: 'webhook URL must be https',
      })
      .nullable()
      .optional(),
    digest_mode: z.boolean().optional(),
  })
  .strict();

type PrefsBody = z.infer<typeof PrefsBodySchema>;

// ── Shared shape ────────────────────────────────────────────────────────────

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

const COLUMNS =
  'id, org_id, user_id, threshold, email_enabled, email_address, telegram_enabled, telegram_chat_id, discord_enabled, discord_webhook, digest_mode';

/** Untyped handle since rfp_* tables aren't in database.types.ts. */
type SupabaseClient = Awaited<ReturnType<typeof createClient>>;
function rfpHandle(supabase: SupabaseClient): { from: (table: string) => any } {
  return supabase as unknown as { from: (table: string) => any };
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function parseScope(url: URL): 'org' | 'me' | null {
  const raw = url.searchParams.get('scope');
  const parsed = ScopeSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

/** Single-row fetch for the (orgId, user_id?) tuple. */
async function loadRow(args: {
  supabase: SupabaseClient;
  orgId: string;
  userId: string | null;
}): Promise<PrefsRow | null> {
  const handle = rfpHandle(args.supabase);
  let query = handle
    .from('rfp_alert_prefs')
    .select(COLUMNS)
    .eq('org_id', args.orgId);
  query = args.userId === null
    ? query.is('user_id', null)
    : query.eq('user_id', args.userId);
  const { data, error } = await query.maybeSingle();
  if (error) {
    console.error('[/api/rfp/orgs/alert-prefs] load failed:', error.message);
    return null;
  }
  return (data as PrefsRow | null) ?? null;
}

/**
 * Merge body into existing row (or seed system defaults) and write.
 * Behavior:
 *   - When row exists → UPDATE only the supplied columns.
 *   - When row doesn't exist → INSERT a row with system defaults + supplied
 *     overrides. RLS still applies (only owners can insert org-default rows,
 *     only the caller can insert their own override).
 */
async function upsertRow(args: {
  supabase: SupabaseClient;
  orgId: string;
  userId: string | null;
  body: PrefsBody;
  existing: PrefsRow | null;
}): Promise<{ row: PrefsRow | null; error: string | null }> {
  const handle = rfpHandle(args.supabase);

  if (args.existing) {
    const updates: Partial<PrefsRow> = {};
    if (args.body.threshold !== undefined) updates.threshold = args.body.threshold;
    if (args.body.email_enabled !== undefined) updates.email_enabled = args.body.email_enabled;
    if (args.body.email_address !== undefined) updates.email_address = args.body.email_address;
    if (args.body.telegram_enabled !== undefined) updates.telegram_enabled = args.body.telegram_enabled;
    if (args.body.telegram_chat_id !== undefined) updates.telegram_chat_id = args.body.telegram_chat_id;
    if (args.body.discord_enabled !== undefined) updates.discord_enabled = args.body.discord_enabled;
    if (args.body.discord_webhook !== undefined) updates.discord_webhook = args.body.discord_webhook;
    if (args.body.digest_mode !== undefined) updates.digest_mode = args.body.digest_mode;

    if (Object.keys(updates).length === 0) {
      return { row: args.existing, error: null };
    }

    const { data, error } = await handle
      .from('rfp_alert_prefs')
      .update(updates)
      .eq('id', args.existing.id)
      .select(COLUMNS)
      .maybeSingle();
    if (error) return { row: null, error: error.message };
    return { row: (data as PrefsRow | null) ?? null, error: null };
  }

  // INSERT — seed system defaults + supplied overrides.
  const insertRow = {
    org_id: args.orgId,
    user_id: args.userId,
    threshold: args.body.threshold ?? 80,
    email_enabled: args.body.email_enabled ?? true,
    email_address: args.body.email_address ?? null,
    telegram_enabled: args.body.telegram_enabled ?? false,
    telegram_chat_id: args.body.telegram_chat_id ?? null,
    discord_enabled: args.body.discord_enabled ?? false,
    discord_webhook: args.body.discord_webhook ?? null,
    digest_mode: args.body.digest_mode ?? false,
  };

  const { data, error } = await handle
    .from('rfp_alert_prefs')
    .insert(insertRow)
    .select(COLUMNS)
    .maybeSingle();
  if (error) return { row: null, error: error.message };
  return { row: (data as PrefsRow | null) ?? null, error: null };
}

// ── Route handlers ──────────────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
): Promise<NextResponse> {
  const { orgId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(orgId)) {
    return NextResponse.json({ error: 'invalid_orgId' }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const org = await getOrgForUser(orgId);
  if (!org) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const url = new URL(request.url);
  const scope = parseScope(url);
  if (!scope) {
    return NextResponse.json(
      { error: 'invalid_scope', detail: 'scope must be "org" or "me"' },
      { status: 400 }
    );
  }

  const targetUserId = scope === 'org' ? null : user.id;
  const row = await loadRow({ supabase, orgId, userId: targetUserId });

  return NextResponse.json({
    scope,
    org_id: orgId,
    row,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
): Promise<NextResponse> {
  const { orgId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(orgId)) {
    return NextResponse.json({ error: 'invalid_orgId' }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const org = await getOrgForUser(orgId);
  if (!org) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const url = new URL(request.url);
  const scope = parseScope(url);
  if (!scope) {
    return NextResponse.json(
      { error: 'invalid_scope', detail: 'scope must be "org" or "me"' },
      { status: 400 }
    );
  }

  let body: PrefsBody;
  try {
    const raw = (await request.json()) as unknown;
    const parsed = PrefsBodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'invalid_body', detail: parsed.error.flatten() },
        { status: 400 }
      );
    }
    body = parsed.data;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const targetUserId = scope === 'org' ? null : user.id;
  const existing = await loadRow({ supabase, orgId, userId: targetUserId });

  const { row, error } = await upsertRow({
    supabase,
    orgId,
    userId: targetUserId,
    body,
    existing,
  });

  if (error) {
    // RLS rejection surfaces as a Postgres permission error string. Map to 403.
    if (
      error.includes('row-level security') ||
      error.includes('violates') ||
      error.includes('permission')
    ) {
      return NextResponse.json(
        { error: 'forbidden', detail: 'RLS prevented this write' },
        { status: 403 }
      );
    }
    console.error('[/api/rfp/orgs/alert-prefs] upsert failed:', error);
    return NextResponse.json({ error: 'save_failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, scope, org_id: orgId, row });
}
