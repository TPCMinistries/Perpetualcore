---
phase: 12-studio-repositioning-v1-1
plan: "02"
subsystem: products-atlas-discovery
tags: [atlas, discovery, audit, sales-contacts, supabase, studio-repositioning]
requirements: [STUDIO-AD-01]

dependency_graph:
  requires:
    - "Phase 12 Wave 1 (repositioning foundation — /products/atlas, Footer, Navbar already in place)"
  provides:
    - "/products/atlas-discovery page (productized audit landing)"
    - "sales_contacts table with product column (LDC Brain AI, hgxxxmtfmvguotkowxbu)"
    - "Extended /api/contact-sales endpoint accepting product field"
  affects:
    - "/products/atlas — new cross-link block added (non-destructive)"
    - "components/landing/Footer.tsx — Atlas Discovery added to Products column"
    - "sales_contacts table — created for first time in remote Supabase project"

tech_stack:
  added:
    - "sales_contacts Supabase table (new in remote LDC Brain AI project)"
  patterns:
    - "Dual-write routing: explicit product field + message prefix for Supabase filtering"
    - "createAdminClient() for server-side DB inserts per CORE-tier rule"
    - "Client component page.tsx + server component layout.tsx (Metadata pattern)"
    - "en-dash U+2013 in pricing strings per STUDIO-AD-01 spec"

key_files:
  created:
    - "app/products/atlas-discovery/page.tsx — Atlas Discovery audit landing (402 lines)"
    - "app/products/atlas-discovery/layout.tsx — Server component exporting Metadata"
    - "supabase/migrations/20260510_sales_contacts_product.sql — CREATE TABLE + product column"
  modified:
    - "app/products/atlas/page.tsx — Added 'Lower-friction entry' cross-link section"
    - "components/landing/Footer.tsx — Added Atlas Discovery to PRODUCT_LINKS array"
    - "app/api/contact-sales/route.ts — Extended schema (product field), createAdminClient, routing comment"

decisions:
  - "URL: /products/atlas-discovery (not /studio/atlas-discovery) per BRAND_ARCHITECTURE §7 — Atlas Discovery is a product SKU, not an engagement tier"
  - "Dual-write pattern chosen over single filter: product field (preferred) + message prefix (legacy compat)"
  - "sales_contacts table created from scratch in remote project (was never applied despite migration history)"
  - "valid_interested_in constraint expanded to accept both API case variants ('Pro','Custom','Enterprise') and original lowercase values"
  - "Footer Products order: Platform → Atlas → Atlas Discovery → Sentinel → Sage → Vellum → RFP Engine → RFP Sentry"
  - "Atlas Discovery NOT added to homepage 3-card strip per BRAND_ARCHITECTURE §5.6 (strip locked to Sentinel, Atlas, Sage)"

metrics:
  duration: "10 min 25 sec"
  completed_date: "2026-05-10"
  tasks_completed: 3
  tasks_total: 3
  files_created: 3
  files_modified: 3
---

# Phase 12 Plan 02: Atlas Discovery Audit Page — Summary

**One-liner:** New /products/atlas-discovery landing page with hero, 4-card what's-included, pricing band ($5,000–$15,000 en-dash), intake form posting to /api/contact-sales with explicit product='atlas-discovery' dual-write routing, backed by a new sales_contacts Supabase table created and verified live.

## What Was Built

### Task 1: /products/atlas-discovery page + layout

- `app/products/atlas-discovery/page.tsx` — 402-line client component per STUDIO-AD-01 spec
- `app/products/atlas-discovery/layout.tsx` — server component exporting Metadata
- 6 sections: Navbar, Hero, What's Included (4 cards), Pricing Band, Intake Form, Final CTA, Footer
- Hero pricing string: "$5,000–$15,000" (en-dash U+2013, verified via grep -P)
- 4 cards: Operational map (Map icon), AI opportunity ranking (BarChart3), Outcome-eval scope (Target), OP+CFO co-signed contract framing (FileSignature) — all lucide-react, mono-violet (primary/10 background)
- Intake form fields: name, fund, portco, email, install (textarea)
- Form submit dual-write payload: `product: "atlas-discovery"` + message prefix `[Atlas Discovery intake]`
- Success/error states with card-based UI matching /products/atlas patterns
- No client/fund/portco names in copy per BRAND_ARCHITECTURE §5.7

### Task 2: Cross-links

- `/products/atlas` — inserted "Lower-friction entry." section between the 3-paragraph explainer and the intake form. H2: "Not ready for the full Atlas install? Start with Atlas Discovery." Button links to /products/atlas-discovery. Non-destructive — no existing copy removed.
- `components/landing/Footer.tsx` — Atlas Discovery added to `PRODUCT_LINKS` array immediately after Atlas, before Sentinel. Order now: Platform → Atlas → **Atlas Discovery** → Sentinel → Sage → Vellum → RFP Engine → RFP Sentry.

### Task 3: /api/contact-sales schema extension + Supabase migration

**Schema changes:**
- Zod schema extended with optional `product: z.string().min(1).max(64).regex(/^[a-z0-9-]+$/).optional().nullable()`
- INSERT now persists `product: sanitizedProduct ?? null`
- Switched from `createClient()` → `createAdminClient()` per CORE-tier rule (CLAUDE.md)
- Added routing comment block documenting dual-filter query pattern

**Migration applied:** `supabase/migrations/20260510_sales_contacts_product.sql`
- Applied to LDC Brain AI project `hgxxxmtfmvguotkowxbu` via Management API
- Result: `[]` (success)

## Supabase Verification

**Column confirmed present:**
```
{'column_name': 'product', 'data_type': 'text', 'is_nullable': 'YES'}
```

**Synthetic INSERT test (dual-write row):**
```
{'id': '7a187c2c-9b12-40b7-99db-3d4d9821f767', 'name': 'Test OP', 
 'email': 'test@example.com', 'message': '[Atlas Discovery intake] portco=TestCo | install=test description', 
 'product': 'atlas-discovery', 'created_at': '2026-05-10 19:24:33.346693+00'}
```

**Dual-filter SELECT (both patterns work):**
```sql
SELECT id, name, email, message, product, created_at
FROM public.sales_contacts
WHERE message ILIKE '%Atlas Discovery intake%' OR product = 'atlas-discovery'
ORDER BY created_at DESC LIMIT 1;
```
Returns: same row with `product='atlas-discovery'` AND `message` starting with `[Atlas Discovery intake]`. Both filter patterns confirmed.

**Backward-compatibility INSERT (no product field):**
```
{'id': '6e92600d-c6a4-454b-87c0-ebe2e070bc88', 'product': None}
```
Legacy callers without `product` field insert successfully with `product = NULL`.

Test rows cleaned after verification.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking] sales_contacts table missing from remote Supabase**
- **Found during:** Task 3
- **Issue:** `public.sales_contacts` did not exist in LDC Brain AI project `hgxxxmtfmvguotkowxbu`. Migration `20250122_add_sales_contacts.sql` was in the migrations directory but had never been applied to remote.
- **Fix:** Rewrote `20260510_sales_contacts_product.sql` to `CREATE TABLE IF NOT EXISTS` with all columns including `product` from the start, rather than `ADD COLUMN IF NOT EXISTS` on an existing table.
- **Files modified:** `supabase/migrations/20260510_sales_contacts_product.sql`
- **Commit:** d8f93a4

**2. [Rule 1 — Bug] valid_interested_in constraint prevented all DB inserts**
- **Found during:** Task 3 (while reviewing migration)
- **Issue:** Original `valid_interested_in` CHECK constraint used lowercase values `('business','enterprise','custom','consultation')` but the API route's zod schema sends uppercase `('Pro','Enterprise','Custom')`. This caused every `sales_contacts` INSERT to fail silently at the DB layer — the route's soft-fail logic caught the error and continued to send emails, masking the bug entirely.
- **Fix:** Replaced the constraint to accept both the API's mixed-case values AND the original lowercase values for backward compat with any pre-existing rows.
- **Files modified:** `supabase/migrations/20260510_sales_contacts_product.sql`
- **Commit:** d8f93a4

**3. [Rule 2 — Missing critical functionality] createClient() used instead of createAdminClient()**
- **Found during:** Task 3
- **Issue:** Existing `/api/contact-sales/route.ts` used `createClient()` (cookie-based anon client) for the `sales_contacts` INSERT. CORE-tier rule in CLAUDE.md: "Background/server operations: ALWAYS use `createAdminClient()`, never `createClient()`."
- **Fix:** Replaced `createClient()` → `createAdminClient()`.
- **Files modified:** `app/api/contact-sales/route.ts`
- **Commit:** d8f93a4

**4. [Rule 3 — Blocking] CREATE POLICY IF NOT EXISTS not supported**
- **Found during:** Task 3 migration application
- **Issue:** First migration attempt used `CREATE POLICY IF NOT EXISTS` syntax which PostgreSQL rejected with syntax error.
- **Fix:** Replaced with `DO $$ BEGIN IF NOT EXISTS ... EXECUTE ... END IF; END $$;` pattern.
- **Files modified:** `supabase/migrations/20260510_sales_contacts_product.sql`
- **Commit:** d8f93a4 (same commit — resolved within task)

**5. [Note] atlas-discovery files were bundled in a prior session commit**
- **Found during:** Task 1 commit attempt
- **Issue:** `app/products/atlas-discovery/page.tsx` and `layout.tsx` were already committed in `cf29084 chore(12-04): create vellum_early_access migration with RLS policies` from a prior agent session that apparently wrote the files and staged them alongside the Vellum migration.
- **Action:** Verified the committed content against all Task 1 verification criteria — all passed. The files matched the plan spec. No redo required; tracked as deviation.

## Recommendation: Atlas Discovery on Homepage Strip

**No.** Do not add Atlas Discovery to the locked 3-card homepage strip per BRAND_ARCHITECTURE §5.6. The strip is locked to Sentinel (live = proof), Atlas (flagship = aspiration), Sage (relational = humanity). Atlas Discovery is accessible via the Products column footer, the /products/atlas cross-link, and the /products/ overview page. Adding it to the strip would dilute the three-card logic. Re-evaluate post-first-audit-close if conversion data suggests direct entry via homepage is needed.

## Deferred Items for STUDIO-PL-01

- Mobile-specific layout review: the 4-card grid uses `md:grid-cols-2` — on mobile, all 4 cards stack. No visual issues expected but should be reviewed on a real device.
- `assigned_to UUID REFERENCES auth.users(id)` from original sales_contacts schema was intentionally omitted from the migration — the current table doesn't have it. Add when an admin dashboard for sales routing is built.
- The `updated_at` column exists but no trigger is wired to auto-update it. Pre-existing gap from original schema; deferred.

## Self-Check

Verified:
- `app/products/atlas-discovery/page.tsx` — EXISTS ✓
- `app/products/atlas-discovery/layout.tsx` — EXISTS ✓
- en-dash pricing string ($5,000–$15,000) — 2 occurrences ✓
- `[Atlas Discovery intake]` refs — 2 occurrences ✓
- `product: "atlas-discovery"` field — 2 occurrences ✓
- `atlas-discovery` in /products/atlas — 1 occurrence ✓
- `Atlas Discovery` in Footer.tsx — 1 occurrence ✓
- `product` field in zod schema — confirmed ✓
- `createAdminClient` in route — confirmed ✓
- Migration file — EXISTS ✓
- Live Supabase `sales_contacts.product` column — EXISTS ✓
- Dual-filter SELECT — RETURNS ROW ✓
- Legacy INSERT — PRODUCT = NULL ✓
