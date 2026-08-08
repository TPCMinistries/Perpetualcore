/* Disposable one-off: NJ Treasury "Upcoming Procurement Opportunities" PDF ingest.
   Tractable NJ-state source (state's live RFPs require headless NJSTART/JSF — deferred).
   Parses the structured PDF (• Tnnnn – Title / o description) → upserts as source 'nj_treasury'.
   Run: NODE_PATH=<parent>/node_modules node scripts/run-nj-treasury-ingest-once.cjs */
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { PDFParse } = require('pdf-parse');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const PDF_URL = 'https://www.nj.gov/treasury/purchase/pdf/UpcomingProcurementOpportunities.pdf';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124 Safari/537.36';

(async () => {
  const res = await fetch(PDF_URL, { headers: { 'User-Agent': UA } });
  if (!res.ok) { console.log('PDF HTTP', res.status); return; }
  const buf = Buffer.from(await res.arrayBuffer());
  const parsed = await new PDFParse({ data: new Uint8Array(buf) }).getText();
  const clean = (parsed.text || '').replace(/\r/g, '').replace(/ /g, ' ');

  const re = /[•·]\s*(T\d{3,5})\s*[–-]\s*([\s\S]*?)(?=\n\s*o\s|\n\s*[•·]|\n[A-Z][a-z].*Upcoming Procurement|$)/g;
  const items = []; let m;
  while ((m = re.exec(clean))) {
    const id = m[1];
    const title = m[2].replace(/\s+/g, ' ').trim();
    const after = clean.slice(re.lastIndex);
    const dm = after.match(/^\s*o\s*([\s\S]*?)(?=\n\s*[•·]|\n[A-Z][a-z].*Upcoming Procurement|$)/);
    const desc = dm ? dm[1].replace(/\s+/g, ' ').trim() : null;
    if (!title) continue;
    items.push({
      source: 'nj_treasury', source_id: id, title: title.slice(0, 300),
      agency: 'State of New Jersey', type: 'Bid Solicitation (upcoming)',
      amount_min: null, amount_max: null, deadline: null, posted_at: null,
      brief: desc ? desc.slice(0, 500) : null,
      keywords: title.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 3).slice(0, 8),
      geo: 'NJ', url: 'https://www.nj.gov/treasury/purchase/bid.shtml',
      needs_review: false, last_seen_at: new Date().toISOString(),
      raw_json: { bid_id: id, title, description: desc, source_pdf: PDF_URL },
    });
  }
  console.log('parsed', items.length, 'NJ Treasury upcoming opportunities');
  if (!items.length) return;
  const { error } = await sb.from('rfp_opportunities').upsert(items, { onConflict: 'source,source_id' });
  if (error) { console.log('upsert error:', error.message); return; }
  await sb.from('rfp_state_coverage').update({
    status: 'partial', last_success_at: new Date().toISOString(), opportunity_count: items.length, updated_at: new Date().toISOString(),
  }).eq('state_code', 'NJ');
  const { count } = await sb.from('rfp_opportunities').select('*', { count: 'exact', head: true }).eq('source', 'nj_treasury');
  console.log('=> nj_treasury rows now:', count);
})().catch(e => console.log('FATAL', e.message));
