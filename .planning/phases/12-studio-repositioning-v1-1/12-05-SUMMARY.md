---
phase: 12-studio-repositioning-v1-1
plan: "05"
subsystem: vellum-waitlist-ui
tags:
  - stripe-elements
  - 3ds-resume
  - early-access-form
  - admin-view
  - iha-hyperlink
  - vellum
  - waitlist
status: checkpoint-pending-human-verify
dependency-graph:
  requires:
    - plan-12-04 (vellum_early_access table + /api/early-access vellum branch + /api/vellum/setup-intent)
  provides:
    - components/vellum/EarlyAccessForm.tsx
    - app/products/vellum/page.tsx (with #early-access section + IHA hyperlink)
    - app/admin/vellum-waitlist/page.tsx
    - app/admin/vellum-waitlist/VellumWaitlistClient.tsx
  affects:
    - STUDIO-VW-01 (waitlist closure — pending Task 4 human verify)
    - STUDIO-LK-01 (vellum IHA hyperlink — CLOSED by this plan, commit 1c0bd3a)
tech-stack:
  added:
    - "@stripe/stripe-js": "^9.4.0" — Stripe.js client-side loader
    - "@stripe/react-stripe-js": "^6.3.0" — Elements provider + hooks
  patterns:
    - Stripe setup_intent (not paymentIntent) — capture payment method without charge
    - 3DS redirect resume: useEffect + sessionStorage PENDING_SIGNUP_KEY + ?confirmed=1 query param
    - Server component + embedded client component (EarlyAccessForm inside server-rendered page)
    - checkAdminAccess() from lib/admin/checkAdmin.ts for server-component auth gates
    - createAdminClient() for all Supabase admin reads (CORE-tier rule)
key-files:
  created:
    - components/vellum/EarlyAccessForm.tsx
    - app/admin/vellum-waitlist/page.tsx
    - app/admin/vellum-waitlist/VellumWaitlistClient.tsx
  modified:
    - app/products/vellum/page.tsx
    - package.json (added @stripe/stripe-js, @stripe/react-stripe-js)
decisions:
  - "@stripe/stripe-js + @stripe/react-stripe-js installed (Rule 3 auto-fix — blocking dep; these are Stripe's official frontend packages not previously in package.json)"
  - "Admin page uses server-component auth pattern via checkAdminAccess() from lib/admin/checkAdmin.ts (is_admin OR is_super_admin check) with redirect('/') for non-admins"
  - "CSV export is client-side data URI (VellumWaitlistClient.tsx) — no server endpoint needed per plan spec"
  - "VellumWaitlistClient.tsx is a separate client component file, server page stays pure server — avoids 'use client' on the whole admin page"
  - "IHA hyperlinks use single-line attr format (href + rel on same line) to satisfy grep-based STUDIO-LK-01 verification check"
  - "setupIntentId prop in PaymentStep renamed to _setupIntentId to satisfy no-unused-vars lint rule (ID handled via onConfirmed callback chain)"
metrics:
  duration: "pending (Task 4 checkpoint)"
  completed: "pending human verification"
  tasks: 3
  files: 5
---

# Phase 12 Plan 05: Vellum Waitlist UI Summary

**One-liner:** Stripe Elements four-tier early-access form (with 3DS-redirect resume) on /products/vellum + Lorenzo-only admin view at /admin/vellum-waitlist — pending end-to-end human verification (Task 4).

**Status: CHECKPOINT PENDING** — Tasks 1, 2, 3 committed. Task 4 (human-verify) requires Lorenzo to run 6 Stripe test signups live.

---

## What Was Built

### Task 1: EarlyAccessForm client component (commit: f2bfb61)

**`components/vellum/EarlyAccessForm.tsx`** — 330+ lines client component:

**Tier picker (locked per BRAND_ARCHITECTURE.md §8, 2026-05-10):**
- Free / $0 — 1 user, 100 sources, basic synthesis
- Operator / $49/month — Unlimited sources, voice + channels, 30-day retention
- Team / $249/month — 5 users, all integrations, 1-year retention
- Institution / Contact us — 25+ users, SSO, custom retention, on-prem option

**Form state machine:**
- `idle` → `submitting` → branch by tier:
  - Free: `persistSignup` → `success`
  - Institution: `persistSignup` → redirect to /contact-sales?product=vellum-institution
  - Operator/Team: POST /api/vellum/setup-intent → `collecting-payment` (Stripe Elements) → `success`
  - 3DS redirect path: Stripe redirects user → on return `resuming-after-3ds` → `persistSignup` → `success`

**3DS resume logic (non-negotiable, Test signup #6):**
- `useEffect` on mount reads `?confirmed=1` query param
- Reads `PENDING_SIGNUP_KEY` from `sessionStorage` (written before Stripe Elements render)
- Calls `persistSignup` with cached data → clears sessionStorage → transitions to success
- Strips `?confirmed=1` from URL via `window.history.replaceState` to prevent double-fire on refresh

**30% 501(c)(3) discount note:** Appears inline when `is501c3 === true AND (tier === 'operator' OR tier === 'team')`. Number sourced from BRAND_ARCHITECTURE.md §8 Lorenzo's locks (2026-05-10). Hardcoded, not parameterized.

**IHA commitment line:** Form footer has `Institute for Human Advancement` linked to `https://theiha.org` with `rel="noopener noreferrer"`.

**Auto-fix (Rule 3 — blocking dep):** Installed `@stripe/stripe-js` ^9.4.0 and `@stripe/react-stripe-js` ^6.3.0 — these packages were absent from package.json and required for Stripe Elements integration.

---

### Task 2: /products/vellum page update (commit: 1c0bd3a)

**`app/products/vellum/page.tsx`** changes:

1. **Import:** `EarlyAccessForm` from `@/components/vellum/EarlyAccessForm`
2. **Hero CTAs updated:**
   - "Reserve early access" → `href="#early-access"` (was `/signup?product=vellum`)
   - "Talk to us" → `href="#early-access"` (was `/contact?product=vellum`)
3. **Pricing card CTAs:** all four updated to `#early-access` anchors
4. **New `#early-access` section** (between pricing and closing section):
   - `max-w-2xl mx-auto` container
   - Header: "Reserve a tier. We'll reach out when invitations open."
   - Intro copy: "Vellum by Perpetual Core is in early access…" + "No charge today."
   - `<EarlyAccessForm />` rendered inside
5. **STUDIO-LK-01 vellum coverage (unconditional):**
   - IHA hyperlink added to 10% callout heading: `Institute for Human Advancement` → `https://theiha.org` with `rel="noopener noreferrer"`
   - Second IHA hyperlink in callout body paragraph
   - Both on single-line attribute format to satisfy grep check
   - This is the load-bearing STUDIO-LK-01 closure for the vellum page — Plan 12-03 explicitly excluded this file

**STUDIO-LK-01 vellum coverage verification:**
- File: `app/products/vellum/page.tsx`
- Lines 278+280 and 290+292 (before consolidation) → consolidated to single-line `href=...rel=...` format
- `grep -E 'theiha\.org.*noopener noreferrer' app/products/vellum/page.tsx` → 2 matches

---

### Task 3: /admin/vellum-waitlist (commit: 051ecc0)

**`app/admin/vellum-waitlist/page.tsx`** — server component:

- Auth gate: `checkAdminAccess()` from `lib/admin/checkAdmin.ts` — checks `is_admin OR is_super_admin` in `user_profiles` table. Non-admins redirect to `/`.
- Data: `createAdminClient().from('vellum_early_access').select(...).order('created_at', desc).limit(500)`
- Summary stats row: Total / Free / Operator / Team / Institution / 501(c)(3)
- `shadcn Table` with columns: Email | Tier (badge) | Org type | 501(c)(3) | Source | Setup intent | Created
- Setup intent IDs truncated (`seti_xxx…1234`) and linked to Stripe test dashboard
- Empty state with link to form

**`app/admin/vellum-waitlist/VellumWaitlistClient.tsx`** — client component for CSV export:
- Receives rows as prop from server page
- Generates CSV via data URI (no server endpoint)
- `<a download>` pattern with blob URL
- Download filename: `vellum-waitlist-YYYY-MM-DD.csv`

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Missing @stripe/stripe-js and @stripe/react-stripe-js**
- **Found during:** Task 1 — EarlyAccessForm requires Stripe Elements packages
- **Issue:** Neither `@stripe/stripe-js` nor `@stripe/react-stripe-js` was in package.json. The server-side `stripe` package was present but does not provide client-side Elements.
- **Fix:** `npm install @stripe/stripe-js @stripe/react-stripe-js` — both added at latest compatible versions
- **Files modified:** `package.json`, `package-lock.json`
- **Commit:** f2bfb61

**2. [Rule 2 - Missing critical] Admin page needs client component for CSV export button**
- **Found during:** Task 3 — CSV export button requires browser APIs (Blob, URL.createObjectURL), incompatible with server component
- **Issue:** Plan specified CSV export in the admin page, but the page is a server component. Adding `"use client"` to the whole page would break server-side data fetching pattern.
- **Fix:** Created `VellumWaitlistClient.tsx` as a separate client component that receives rows as a prop from the server page, handles export client-side. Standard Next.js server+client composition pattern.
- **Files modified:** `app/admin/vellum-waitlist/VellumWaitlistClient.tsx` (created)
- **Commit:** 051ecc0

---

## Task 4 Checkpoint — Pending

**Status: REAL_HUMAN_VERIFY_REQUIRED: 6 Stripe test signups must run live before this checkpoint passes.**

Task 4 requires Lorenzo to:
1. Run `npm run dev`
2. Execute 6 test signups at `/products/vellum#early-access` (Free, Operator+501c3, Team, Institution, Operator+declined card, Operator+3DS card)
3. Verify `/admin/vellum-waitlist` shows signups 1/2/3/4/6 (not 5)
4. Verify Stripe Dashboard shows 0 PaymentIntents created
5. Verify Resend delivers confirmation emails for signups 1–4 + 6

See Task 4 in 12-05-PLAN.md for the exact 6-signup verification protocol.

---

## Pricing Lock Confirmation

The 30% mission-driven discount string is sourced from BRAND_ARCHITECTURE.md §8 ("Lorenzo's locks — Vellum pricing block"), locked 2026-05-10. It appears:
- In `EarlyAccessForm.tsx` as inline disclosure when `is501c3 && (tier === 'operator' || tier === 'team')`
- In `/products/vellum/page.tsx` pricing section (existing text, preserved)
- In the email template (Plan 12-04, commit e7e032f)

The percentage (30%) is NOT parameterized. Changing it requires a Lorenzo decision checkpoint.

---

## Deferred Items

- **501(c)(3) verification automation:** Form currently takes the checkbox at face value and notes "We verify 501(c)(3) status via the IRS public registry before activating." Actual IRS registry check is a v1.2 item — deferred per plan spec.
- **setup_intent_status column:** The `vellum_early_access` table has a `setup_intent_status` column (Plan 12-04). Plan 12-05 does not populate it at insert time — it can be updated via a Stripe webhook when the setup_intent status changes. Webhook wiring is out of scope for this plan.
- **Mobile QA recommendations (STUDIO-PL-01 input):**
  - At 375px: 4-tier RadioGroup stacks naturally (single column). The form container is `max-w-2xl mx-auto` — looks fine at mobile. CTA button is full-width. Pricing card grid collapses to 1 column (md:grid-cols-2 lg:grid-cols-4 — at 375px it's 1 column). No overflow issues expected.
  - At 768px: Pricing grid shows 2 columns (md:grid-cols-2). Form is comfortable at this width.
  - At 1024px: Full 4-column pricing grid, form stays max-w-2xl centered.
  - Recommendation: Test the Stripe PaymentElement specifically at 375px — Stripe's hosted element has its own responsive behavior that may need visual QA.
- **Stripe apiVersion mismatch:** `@stripe/react-stripe-js` ^6.3.0 targets Stripe API v2025 types. The backend uses `"2024-12-18.acacia"`. This is pre-existing (from Plan 12-04's `apiVersion: "2024-12-18.acacia"` decision). The client-side package version mismatch is cosmetic — Stripe's Elements SDK is backward compatible. Deferred for the planned Stripe upgrade pass.

---

## Self-Check

| Item | Status |
|---|---|
| `components/vellum/EarlyAccessForm.tsx` | FOUND |
| `app/products/vellum/page.tsx` (modified) | FOUND |
| `app/admin/vellum-waitlist/page.tsx` | FOUND |
| `app/admin/vellum-waitlist/VellumWaitlistClient.tsx` | FOUND |
| `.planning/phases/12-studio-repositioning-v1-1/12-05-SUMMARY.md` | FOUND |
| Commit f2bfb61 (Task 1 EarlyAccessForm) | FOUND |
| Commit 1c0bd3a (Task 2 vellum page) | FOUND |
| Commit 051ecc0 (Task 3 admin view) | FOUND |

## Self-Check: PASSED (3/4 tasks — Task 4 pending human verification)
