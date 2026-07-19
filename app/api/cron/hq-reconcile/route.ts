import { NextResponse } from 'next/server';
import { isAuthorizedCronRequest } from '@/lib/cron/auth';
import { runCloudHqReconciliation } from '@/lib/hq/reconciliation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const result = await runCloudHqReconciliation();
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown reconciliation failure';
    console.error('[HQ reconcile] failed', { message });
    return NextResponse.json({ ok: false, error: 'hq_reconciliation_failed', message }, { status: 500 });
  }
}
