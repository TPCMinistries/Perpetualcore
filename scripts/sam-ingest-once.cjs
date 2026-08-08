/* Disposable one-off: direct SAM.gov ingest using supabase-js only (no @supabase/ssr chain). */
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const apiKey = process.env.SAM_GOV_API_KEY || fs.readFileSync(process.env.HOME + '/.secrets/sam-gov.key', 'utf8').trim();
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const fmt = d => `${String(d.getUTCMonth() + 1).padStart(2, '0')}/${String(d.getUTCDate()).padStart(2, '0')}/${d.getUTCFullYear()}`;
const now = new Date(), from = new Date(now - 14 * 864e5);

function mapRecord(r) {
  if (!r.noticeId || !r.title) return null;
  const agency = [r.department, r.subTier].filter(Boolean).join(' — ') || null;
  const geo = r.placeOfPerformance?.state?.code ?? r.placeOfPerformance?.state?.name ?? r.placeOfPerformance?.country?.code ?? 'US';
  const naics = Array.isArray(r.naicsCode) ? r.naicsCode : (r.naicsCode ? [r.naicsCode] : []);
  const kw = [...naics.map(c => `naics:${c}`), ...String(r.title).toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 3).slice(0, 8)];
  const num = v => (typeof v === 'number' ? v : (v != null ? Number(v) : null));
  return {
    source: 'sam_gov', source_id: r.noticeId, title: r.title, agency, type: r.type ?? null,
    amount_min: num(r.awardFloor), amount_max: num(r.awardCeiling),
    deadline: r.responseDeadLine ?? null, posted_at: r.postedDate ?? null,
    brief: r.description ? String(r.description).slice(0, 500) : null, keywords: kw, geo, url: r.uiLink ?? null,
    needs_review: false, last_seen_at: new Date().toISOString(), raw_json: r,
  };
}

(async () => {
  let all = [], offset = 0;
  while (all.length < 200) {
    const u = new URL('https://api.sam.gov/prod/opportunities/v2/search');
    u.searchParams.set('api_key', apiKey); u.searchParams.set('postedFrom', fmt(from));
    u.searchParams.set('postedTo', fmt(now)); u.searchParams.set('limit', '100'); u.searchParams.set('offset', String(offset));
    const res = await fetch(u, { headers: { Accept: 'application/json' } });
    if (!res.ok) { console.log('SAM HTTP', res.status); break; }
    const j = await res.json();
    const page = j.opportunitiesData || [];
    if (offset === 0) console.log('SAM totalRecords (14d window) =', j.totalRecords);
    if (!page.length) break;
    for (const r of page) { const m = mapRecord(r); if (m) all.push(m); }
    if (page.length < 100) break; offset += 100;
  }
  console.log('mapped', all.length, 'federal contract opportunities');
  let up = 0;
  for (let i = 0; i < all.length; i += 100) {
    const chunk = all.slice(i, i + 100);
    const { error } = await sb.from('rfp_opportunities').upsert(chunk, { onConflict: 'source,source_id' });
    if (error) { console.log('upsert error:', error.message); break; }
    up += chunk.length;
  }
  console.log('upserted', up, 'rows');
  const { count } = await sb.from('rfp_opportunities').select('*', { count: 'exact', head: true }).eq('source', 'sam_gov');
  const { count: open } = await sb.from('rfp_opportunities').select('*', { count: 'exact', head: true }).eq('source', 'sam_gov').gte('deadline', new Date().toISOString());
  console.log('=> sam_gov rows now:', count, '| open now:', open);
})().catch(e => console.log('FATAL', e.message));
