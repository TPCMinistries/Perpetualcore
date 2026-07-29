import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { isAuthorizedCronRequest } from '@/lib/cron/auth';
import { createAdminClient } from '@/lib/supabase/server';
import {
  buildOperatingHealthFreshnessRow,
  operatingHealthReceiptSchema,
} from '@/lib/hq/operating-health';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = operatingHealthReceiptSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid operating-health receipt', issues: parsed.error.issues.map((issue) => issue.path.join('.')) },
      { status: 400 },
    );
  }

  try {
    const admin = createAdminClient() as unknown as SupabaseClient;
    const sourceKey = `operating_health:${parsed.data.sourceKey}`;
    const { data: existing, error: readError } = await admin
      .from('hq_source_freshness')
      .select('metadata')
      .eq('source_key', sourceKey)
      .maybeSingle();
    if (readError) throw new Error(`receipt history read failed: ${readError.message}`);

    const row = buildOperatingHealthFreshnessRow(
      parsed.data,
      (existing?.metadata as Record<string, unknown> | null | undefined) ?? null,
    );
    const { error: writeError } = await admin
      .from('hq_source_freshness')
      .upsert(row, { onConflict: 'source_key' });
    if (writeError) throw new Error(`receipt write failed: ${writeError.message}`);

    return NextResponse.json({
      ok: true,
      sourceKey: row.source_key,
      healthState: row.metadata.healthState,
      metricCount: row.metadata.metrics.length,
      observedAt: row.observed_at,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'unknown receipt failure';
    console.error('[Operating health] receipt failed', { message, sourceKey: parsed.data.sourceKey });
    return NextResponse.json({ error: 'operating_health_receipt_failed' }, { status: 500 });
  }
}
