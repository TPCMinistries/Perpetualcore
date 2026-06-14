/* Disposable one-off: registry-driven Socrata ingest (mirrors lib/rfp/ingest/connectors/socrata.ts).
   Reads rfp_state_coverage rows where connector='socrata' AND a dataset_id is configured,
   ingests open opportunities, upserts canonically, and marks the state live. */
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const stripHtml = s => String(s).replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const kw = t => String(t).toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 3).slice(0, 8);

async function ingestRow(row) {
  const cfg = row.source_config || {};
  const fm = cfg.field_map || {};
  if (!cfg.dataset_id || !fm.source_id || !fm.title) return { state: row.state_code, skipped: 'no dataset/field_map' };

  const nowIso = new Date().toISOString().slice(0, 19);
  const u = new URL(`https://${cfg.domain}/resource/${cfg.dataset_id}.json`);
  for (const [k, v] of Object.entries(cfg.filters || {})) u.searchParams.set(k, v);
  if (cfg.open_field) { u.searchParams.set('$where', `${cfg.open_field} > '${nowIso}'`); u.searchParams.set('$order', `${cfg.open_field} ASC`); }
  u.searchParams.set('$limit', String(cfg.limit || 300));

  const res = await fetch(u, { headers: { Accept: 'application/json' } });
  if (!res.ok) return { state: row.state_code, error: `HTTP ${res.status}` };
  const rows = await res.json();

  const pick = (r, f) => (f && r[f] != null ? String(r[f]) : null);
  const mapped = [];
  for (const r of rows) {
    const source_id = pick(r, fm.source_id), title = pick(r, fm.title);
    if (!source_id || !title) continue;
    const brief = pick(r, fm.brief);
    mapped.push({
      source: cfg.source_tag, source_id, title: title.slice(0, 300),
      agency: pick(r, fm.agency), type: pick(r, fm.type),
      amount_min: null, amount_max: fm.amount_max && r[fm.amount_max] != null ? Number(r[fm.amount_max]) || null : null,
      deadline: pick(r, fm.deadline), posted_at: pick(r, fm.posted_at),
      brief: brief ? stripHtml(brief).slice(0, 500) : null, keywords: kw(title),
      geo: cfg.geo || null, url: pick(r, fm.url), needs_review: false,
      last_seen_at: new Date().toISOString(), raw_json: r,
    });
  }

  let up = 0;
  for (let i = 0; i < mapped.length; i += 200) {
    const chunk = mapped.slice(i, i + 200);
    const { error } = await sb.from('rfp_opportunities').upsert(chunk, { onConflict: 'source,source_id' });
    if (error) return { state: row.state_code, error: error.message, upserted: up };
    up += chunk.length;
  }
  await sb.from('rfp_state_coverage').update({
    status: 'live', last_success_at: new Date().toISOString(), opportunity_count: mapped.length, updated_at: new Date().toISOString(),
  }).eq('state_code', row.state_code);
  return { state: row.state_code, source: cfg.source_tag, fetched: rows.length, mapped: mapped.length, upserted: up };
}

(async () => {
  const { data: rows, error } = await sb.from('rfp_state_coverage').select('*').eq('connector', 'socrata');
  if (error) { console.log('registry read error:', error.message); return; }
  const wired = rows.filter(r => (r.source_config || {}).dataset_id);
  console.log(`socrata states wired with a dataset: ${wired.length} (${wired.map(r => r.state_code).join(', ') || 'none'})`);
  for (const row of wired) {
    const r = await ingestRow(row);
    console.log(' ', JSON.stringify(r));
  }
})().catch(e => console.log('FATAL', e.message));
