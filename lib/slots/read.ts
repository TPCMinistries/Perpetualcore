import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { unstable_cache } from 'next/cache';

/**
 * Reads content_slots / content_slot_versions — tables the ops plane's
 * Management-API executor created ad hoc (see scripts/ops/slot-write.ts),
 * not tracked in the generated Database types. Same untyped service-role
 * client pattern as lib/hq/snapshot.ts: these live in this app's own
 * Supabase project (LDC Brain AI), so no cross-project client is needed.
 */

export interface MomentItem {
  ts: string;
  project: string;
  what: string;
  whyItMatters?: string;
  proof?: string;
}

export type SlotContent =
  | { type: 'moments'; heading?: string; items: MomentItem[] }
  | { type: 'banner'; headline: string; body?: string; cta?: { label: string; href: string } };

function createSlotsReaderClient() {
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function toMomentItem(v: unknown): MomentItem | null {
  if (typeof v !== 'object' || v === null) return null;
  const o = v as Record<string, unknown>;
  if (typeof o.ts !== 'string' || typeof o.project !== 'string' || typeof o.what !== 'string') return null;
  return {
    ts: o.ts,
    project: o.project,
    what: o.what,
    whyItMatters: typeof o.whyItMatters === 'string' ? o.whyItMatters : undefined,
    proof: typeof o.proof === 'string' ? o.proof : undefined,
  };
}

function toCta(v: unknown): { label: string; href: string } | undefined {
  if (typeof v !== 'object' || v === null) return undefined;
  const o = v as Record<string, unknown>;
  if (typeof o.label !== 'string' || typeof o.href !== 'string') return undefined;
  return { label: o.label, href: o.href };
}

/** Defensive shape coercion — a malformed/unknown-type row degrades to null, never throws. */
function toSlotContent(raw: unknown): SlotContent | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const o = raw as Record<string, unknown>;

  if (o.type === 'moments') {
    if (!Array.isArray(o.items)) return null;
    const items = o.items.map(toMomentItem).filter((m): m is MomentItem => m !== null);
    return { type: 'moments', heading: typeof o.heading === 'string' ? o.heading : undefined, items };
  }

  if (o.type === 'banner') {
    if (typeof o.headline !== 'string') return null;
    return {
      type: 'banner',
      headline: o.headline,
      body: typeof o.body === 'string' ? o.body : undefined,
      cta: toCta(o.cta),
    };
  }

  return null;
}

async function fetchSlotContent(key: string): Promise<SlotContent | null> {
  try {
    const supabase = createSlotsReaderClient();
    const { data: slot, error: slotErr } = await supabase
      .from('content_slots')
      .select('current_version')
      .eq('key', key)
      .maybeSingle();
    if (slotErr || !slot) return null;
    const currentVersion = (slot as { current_version: number }).current_version;
    if (!currentVersion) return null;

    const { data: version, error: versionErr } = await supabase
      .from('content_slot_versions')
      .select('content')
      .eq('slot_key', key)
      .eq('version', currentVersion)
      .eq('status', 'live')
      .maybeSingle();
    if (versionErr || !version) return null;

    return toSlotContent((version as { content: unknown }).content);
  } catch {
    return null;
  }
}

/**
 * Reads a slot's live content. Never throws — a missing slot, empty slot,
 * or DB outage all degrade to null so pages render with zero visual change.
 */
export async function getSlotContent(key: string): Promise<SlotContent | null> {
  try {
    const cached = unstable_cache(() => fetchSlotContent(key), ['slot-content', key], {
      revalidate: 60,
      tags: [`slot-${key}`],
    });
    return await cached();
  } catch {
    return null;
  }
}
