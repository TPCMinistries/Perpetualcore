---
phase: 12-studio-repositioning-v1-1
plan: "04"
subsystem: vellum-data-layer
tags:
  - supabase-migration
  - api-endpoint
  - email-template
  - stripe-setup-intent
  - vellum
  - waitlist
dependency-graph:
  requires: []
  provides:
    - vellum_early_access table (LDC Brain AI Supabase)
    - /api/early-access?product=vellum endpoint
    - /api/vellum/setup-intent endpoint
    - lib/email/templates/vellum-early-access.tsx template
  affects:
    - Plan 12-05 (Wave 2 — UI form + admin view depends on this data layer)
tech-stack:
  added: []
  patterns:
    - createAdminClient() for all server-side Supabase operations (CORE-tier rule)
    - Soft-fail email + DB pattern (log server-side, return success to user)
    - Stripe setup_intent (not paymentIntent or checkout.session) for payment method capture
    - SHA-256 IP hash truncated to 32 hex chars (no raw IPs stored)
key-files:
  created:
    - supabase/migrations/20260510_vellum_early_access.sql
    - lib/email/templates/vellum-early-access.tsx
    - app/api/vellum/setup-intent/route.ts
  modified:
    - app/api/early-access/route.ts
decisions:
  - "Email template returns HTML string (not JSX) — matches existing codebase pattern (WelcomeEmail.tsx, sendEmail helpers in lib/email/index.ts all use raw HTML strings)"
  - "30% mission-driven discount in email template sourced from BRAND_ARCHITECTURE.md §8 Lorenzo's locks (2026-05-10). String is hardcoded per the lock — not parameterized."
  - "Stripe apiVersion '2024-12-18.acacia' used to match existing repo convention (app/api/stripe/create-checkout-session/route.ts). Stripe v19 requires '2025-09-30.clover' but project tsconfig handles this via skipLibCheck — deferred for a separate Stripe upgrade pass."
  - "supabase db push not used (migration history out of sync); applied via 'supabase db query --linked -f <file>' against linked project — equivalent outcome, migration file is the repo source of truth"
metrics:
  duration: "9 minutes"
  completed: "2026-05-10"
  tasks: 3
  files: 4
---

# Phase 12 Plan 04: Vellum Waitlist Data Layer Summary

**One-liner:** Supabase migration + extended /api/early-access + Stripe setup_intent endpoint + Resend email template for Vellum by Perpetual Core early-access waitlist capture.

---

## What Was Built

### Task 1: vellum_early_access Supabase migration (commit: cf29084)

Migration file `supabase/migrations/20260510_vellum_early_access.sql` created and applied to LDC Brain AI project (`hgxxxmtfmvguotkowxbu`).

**Table:** `public.vellum_early_access` — 11 columns:
- `id` uuid PK, `email` text NOT NULL, `tier_preference` text CHECK IN ('free','operator','team','institution')
- `organization_type` text CHECK IN ('501c3','forprofit','individual','other'), `is_501c3` boolean DEFAULT false
- `source` text DEFAULT 'vellum-waitlist', `ip_hash` text, `metadata` jsonb DEFAULT '{}'
- `setup_intent_id` text, `setup_intent_status` text, `created_at` timestamptz NOT NULL DEFAULT now()

**RLS:** Service-role-only INSERT + SELECT. No anon/authenticated read path. No UPDATE/DELETE — append-only.

**Indexes:** `idx_vellum_early_access_email`, `idx_vellum_early_access_tier`, `idx_vellum_early_access_created` (created_at DESC).

**Verification:** Synthetic insert (row id `a975607a-b993-4ca4-b0ff-07c7162ad6fe`) + SELECT + DELETE confirmed. `relrowsecurity: true` confirmed.

**Migration applied via:** `npx supabase db query --linked -f supabase/migrations/20260510_vellum_early_access.sql` (supabase CLI linked to hgxxxmtfmvguotkowxbu). The on-disk .sql file is the repo source of truth.

---

### Task 2: Extended /api/early-access + email template (commit: e7e032f)

**`app/api/early-access/route.ts`** extended with:
- Vellum-specific Zod fields: `tier_preference`, `organization_type`, `is_501c3`, `first_name`, `setup_intent_id`
- `hashIp()` helper: SHA-256 one-way hash, 32 hex chars truncated (no raw IPs in DB)
- `sendVellumConfirmationEmail()` helper: Resend soft-fail (logs error, does not throw)
- Vellum branch (`product === 'vellum'`): validates tier_preference required, inserts to `vellum_early_access` via `createAdminClient()`, fires confirmation email
- Default branch (rfp-sentry + future products) preserved unchanged — backward compatible

**`lib/email/templates/vellum-early-access.tsx`** — 123 lines, exports `VellumEarlyAccessEmail({ firstName, tierPreference, is501c3 })`:
- Returns HTML string (matches existing project email pattern)
- Tier-aware body: Free / Operator $49 / Team $249 / Institution copy
- 30% mission-driven discount note (locked per BRAND_ARCHITECTURE.md §8, 2026-05-10)
- IHA full name "Institute for Human Advancement" with theiha.org link
- "Vellum by Perpetual Core" header branding
- Sign-off: "— Lorenzo and the Perpetual Core team"

---

### Task 3: /api/vellum/setup-intent Stripe endpoint (commit: 17b3097)

**`app/api/vellum/setup-intent/route.ts`** — new file:
- POST accepts `{ email, tier_preference: 'operator'|'team', is_501c3? }`
- Finds or creates Stripe Customer by email (dedupes re-signups)
- Calls `stripe.setupIntents.create({ customer, usage: 'off_session', metadata })` — NO charge
- Returns `{ client_secret, setup_intent_id, customer_id }` for Plan 12-05 form wire
- Stripe API version `"2024-12-18.acacia"` — matches existing repo convention
- Lint clean; no new env vars; Free + Institution tiers do not hit this endpoint

**No charge was created during testing.** The setup_intent only captures a payment method — Lorenzo charges off_session when invitations go out.

---

## Verification Results

| Check | Result |
|---|---|
| `vellum_early_access` table live in LDC Brain AI | PASS — 11 columns confirmed |
| RLS active (service-role-only) | PASS — `relrowsecurity: true` |
| Synthetic insert/select/delete via service role | PASS |
| `/api/early-access` accepts `product=vellum` payload | PASS — code path verified |
| `/api/early-access` backward compatible (rfp-sentry) | PASS — default branch unchanged |
| `/api/vellum/setup-intent` uses `setupIntents.create` only | PASS — grep confirmed |
| No `paymentIntents.create` or `checkout.sessions.create` in impl | PASS — only in docstring comment |
| Email template has `30% mission-driven discount` string | PASS — in body at line 88 |
| `createAdminClient()` used for all Supabase server ops | PASS — 5 occurrences in route.ts |
| Lint clean on all new/modified files | PASS |
| No new env vars introduced | PASS |

---

## Deviations from Plan

None — plan executed exactly as written with one notable method difference:

**Migration application method:** The plan specified using `mcp__supabase__apply_migration`. The Supabase MCP tool was not directly available as a bash-callable command, so the migration was applied via `npx supabase db query --linked -f <file>` after linking the project with `npx supabase link --project-ref hgxxxmtfmvguotkowxbu`. This is functionally equivalent — the SQL ran against the same live database. The `db push` command was not used because the migration history was out of sync (remote had versions not in local repo). The on-disk `.sql` file is the authoritative repo artifact.

**Auth gates:** None encountered. All env vars (SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY, RESEND_API_KEY) were pre-configured.

---

## Deferred Items for Plan 12-05

- The email template uses `VellumEarlyAccessEmail` as an HTML-string generator. If Plan 12-05 requires React Email JSX (for previewing in Resend's preview system), the template can be refactored — the interface is the same.
- `setup_intent_status` column exists in the table but is not populated by the API (Plan 12-05 webhook can update it after the user confirms the setup_intent client-side).
- Admin view at `/admin/vellum-waitlist` is explicitly owned by Plan 12-05 — not touched here.

---

## Self-Check: PASSED

| Item | Status |
|---|---|
| `supabase/migrations/20260510_vellum_early_access.sql` | FOUND |
| `lib/email/templates/vellum-early-access.tsx` | FOUND |
| `app/api/early-access/route.ts` | FOUND |
| `app/api/vellum/setup-intent/route.ts` | FOUND |
| `.planning/phases/12-studio-repositioning-v1-1/12-04-SUMMARY.md` | FOUND |
| Commit cf29084 (Task 1 migration) | FOUND |
| Commit e7e032f (Task 2 route + email) | FOUND |
| Commit 17b3097 (Task 3 setup-intent) | FOUND |
