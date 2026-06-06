# RFP Engine — Stripe Live Mode Swap Checklist

**Status:** DRAFT — preflight only. Do not execute until prospect demand is firm and at least one paying customer has signed.
**Owner:** Lorenzo
**Last updated:** 2026-05-22

This document describes how to swap the RFP Engine's Stripe integration from
TEST mode to LIVE mode without touching unrelated PC LLC products. It is
a checklist only — no live keys, no live product IDs, no live webhook
secrets in this file or in the repo.

Related memory:
- `stripe-mcp-wired` — Stripe MCP server wired in `~/.claude/mcp.json` (test + live keys, restricted live key)
- `rfp-stripe-webhook-wired` — test-mode webhook setup notes
- `sage-saas-legal-entity` — PC LLC Stripe account is shared across products via `metadata.product`

---

## 1. Current Test Mode State (reference)

**Stripe account:** `acct_1PaRTgIwAPnWjXPH` (Perpetual Core LLC).
Shared across products: `rfp_engine`, `sage_saas`, `janice`, `lorenzodc`.
Product isolation is enforced via `metadata.product` on every customer,
subscription, and checkout session. Webhook handlers filter on
`metadata.product === "rfp_engine"` (see
`app/api/webhooks/rfp-stripe/route.ts`).

**Test-mode IDs in use today:**

| Resource | Test-mode ID |
|---|---|
| Pro price | `price_1TZDqGIwAPnWjXPHLzGlgPEL` |
| Agency price | `price_1TZDqSIwAPnWjXPHEXFueC3N` |
| Webhook endpoint | `we_1TZb39IwAPnWjXPHK87nPL4F` |
| Webhook URL | `https://rfp.perpetualcore.com/api/webhooks/rfp-stripe` |
| Subscribed events | `customer.subscription.created`, `.updated`, `.deleted`, `checkout.session.completed`, `invoice.payment_failed` |

**Vercel env vars (all environments) currently in test mode:**

| Var | Test-mode value shape |
|---|---|
| `STRIPE_SECRET_KEY` | `sk_test_…` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` (legacy PC SaaS webhook, leave alone) |
| `RFP_STRIPE_PRICE_PRO` | `price_1TZDqGIwAPnWjXPHLzGlgPEL` |
| `RFP_STRIPE_PRICE_AGENCY` | `price_1TZDqSIwAPnWjXPHEXFueC3N` |
| `RFP_STRIPE_WEBHOOK_SECRET` | `whsec_…` (test) |
| `NEXT_PUBLIC_APP_URL` | `https://rfp.perpetualcore.com` |

> **Reminder:** `STRIPE_SECRET_KEY` is shared by every PC LLC product. Swapping
> it to live affects Sage, Janice, lorenzodc, and any other product reading the
> same env var. Confirm each product is ready for live mode BEFORE flipping the
> shared key, or split the key per-product first (see § 7).

---

## 2. Pre-flight Checks

- [ ] Stripe Dashboard → Business settings → **business profile** fully
  populated (business name, support email, support phone, address, statement
  descriptor).
- [ ] Stripe Dashboard → **Activate payments** completed (bank account verified
  for PC LLC, EIN on file, owner identity verified). This is required before
  Stripe will accept live charges.
- [ ] Restricted live key (`rk_live_…`) created with permissions limited to
  `Products: read/write`, `Prices: read/write`, `Webhooks: read/write`,
  `Customers: read`, `Subscriptions: read`. Used only for the one-time live
  product creation. Do not embed this in CI.
- [ ] Latest test-mode webhook deliveries show 200 OK for the last 50 events
  (Stripe Dashboard → Developers → Webhooks → `we_1TZb39IwAPnWjXPHK87nPL4F`
  → Recent deliveries).
- [ ] Test-mode end-to-end happy path verified (signup → checkout →
  subscription active → webhook persisted to `rfp_org_subscriptions`).
  Run `scripts/verify-stripe.ts` against the demo org seeded by
  `scripts/seed-rfp-demo-org.ts`.
- [ ] At least one prospect verbally committed to paying. **Do not switch
  to live mode speculatively** — Stripe runs reconciliation on live mode
  metadata that's expensive to undo.

---

## 3. Create Live-Mode Mirror Products

### Option A — Stripe Dashboard (recommended for the first run)

1. Toggle Stripe Dashboard to **Live mode** (top-left).
2. Products → **+ Add product** for each tier. Mirror the test-mode product
   exactly:
   - Name: `RFP Engine — Pro` / `RFP Engine — Agency`
   - Description: copy from test mode
   - Pricing model: Recurring · Monthly
   - Amount: copy from test mode (verify against `lib/rfp/billing.ts`)
   - **Metadata:** `product = rfp_engine` (CRITICAL — webhook filters on this)
3. Save. Copy the new live price IDs (will look like `price_1XXXXIwAPnWjXPH…`).

### Option B — API (faster if you're confident)

```bash
# Read live restricted key from ~/.secrets/stripe-live (mode 700)
RK=$(cat ~/.secrets/stripe-live-restricted)

# 1. Create Pro product
curl https://api.stripe.com/v1/products \
  -u "$RK:" \
  -d "name=RFP Engine — Pro" \
  -d "metadata[product]=rfp_engine"

# 2. Create Pro price (replace amount + product id from step 1)
curl https://api.stripe.com/v1/prices \
  -u "$RK:" \
  -d "product=prod_LIVE_PRO_ID" \
  -d "unit_amount=<copy_from_test>" \
  -d "currency=usd" \
  -d "recurring[interval]=month" \
  -d "metadata[product]=rfp_engine"

# Repeat for Agency tier.
```

> **Never** put `sk_live_…` in a shell command or env var. Always use the
> restricted `rk_live_…` for one-time admin tasks.

### Verify

- [ ] Dashboard (Live mode) → Products lists both new products with
  `metadata.product = rfp_engine`.
- [ ] Each new price's `id` is recorded in this checklist (NOT in the repo).

---

## 4. Create Live-Mode Webhook Endpoint

1. Stripe Dashboard → Live mode → Developers → Webhooks → **+ Add endpoint**.
2. Endpoint URL: `https://rfp.perpetualcore.com/api/webhooks/rfp-stripe`
   (same URL as test — the handler is environment-agnostic).
3. Events to listen for (must match the test-mode endpoint exactly):
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `checkout.session.completed`
   - `invoice.payment_failed`
4. Description: `RFP Engine — production`
5. Save. Copy the signing secret (`whsec_…`). **This is the value that will
   go into Vercel env as `RFP_STRIPE_WEBHOOK_SECRET`.**
6. Note the new endpoint ID (looks like `we_…`) for the rollback section.

### Verify

- [ ] Endpoint shows status "Enabled" in Live mode dashboard.
- [ ] "Send test webhook" → pick `checkout.session.completed` → fires
  successfully (200 OK from production).

---

## 5. Swap Vercel Env Vars

Use the **Vercel dashboard** for the first swap so each variable change shows
a clear diff and audit log. Subsequent rotations can use `vercel env` CLI.

For each environment (Production, Preview, Development) flip these vars
**in one batch** so there's no period where the secret key and price IDs
are out of sync:

```
STRIPE_SECRET_KEY            sk_test_…  →  sk_live_…
RFP_STRIPE_PRICE_PRO         price_1TZDqGIwAPnWjXPHLzGlgPEL  →  <new live price id>
RFP_STRIPE_PRICE_AGENCY      price_1TZDqSIwAPnWjXPHEXFueC3N  →  <new live price id>
RFP_STRIPE_WEBHOOK_SECRET    whsec_…  →  <new live whsec>
```

`NEXT_PUBLIC_APP_URL` does not change.

> **Warning:** swapping `STRIPE_SECRET_KEY` to live also flips Sage, Janice,
> and lorenzodc to live (same env var). Either flip all four products
> together or split `STRIPE_SECRET_KEY` per-product before this step — see § 7.

### Trigger a redeploy

After the env-var change, a redeploy is required (Vercel does NOT auto-redeploy
on env changes):

```bash
vercel --prod
# or trigger a no-op commit + push
```

### Verify (live mode now active)

- [ ] `https://rfp.perpetualcore.com/api/health/rfp` returns 200 and the
  Stripe section shows live-mode price IDs.
- [ ] Trigger a test checkout with a real card (smallest possible amount,
  refund immediately). Confirm:
  - [ ] Stripe Dashboard (Live mode) → Customers shows the new customer
    with `metadata.product = rfp_engine`.
  - [ ] `rfp_org_subscriptions` table in Supabase has a new row for the
    org with `status = active` and a live `stripe_subscription_id`.
  - [ ] Webhook endpoint `we_…` (live) shows the event delivered with 200.
- [ ] Refund the test charge. Confirm `customer.subscription.deleted` (after
  cancel) updates `rfp_org_subscriptions.status` to `canceled`.

---

## 6. Rollback Procedure

If live mode misbehaves (webhook failures, checkout errors, customer
provisioning bugs), roll back **fast** to preserve the test-mode happy path.

### Tier 1 — Re-disable live webhook (fastest, ~30 seconds)

1. Stripe Dashboard → Live mode → Developers → Webhooks → live endpoint
   → **Disable**. This stops new live events from being delivered.
2. Existing live customers remain — new signups will get 4xx until the
   webhook is re-enabled or env reverted.

### Tier 2 — Revert env vars (~5 minutes)

1. Vercel dashboard → Settings → Environment Variables. For each of the
   four vars listed in § 5, click **Edit** → restore the test-mode value
   from this document (or from `1Password → PC LLC → Stripe Test`).
2. Trigger redeploy (`vercel --prod`).
3. Verify `https://rfp.perpetualcore.com/api/health/rfp` shows test-mode
   IDs again.
4. Any live customers created during the live window: handle manually —
   their Stripe subscriptions still exist on the account, but the app
   will read them via the test-mode key (which won't see them). Either
   refund + cancel in the Stripe Dashboard, or wait to re-enable live
   mode after the fix.

### Tier 3 — Data cleanup (only if needed)

If live mode wrote rows to `rfp_org_subscriptions` referencing live
Stripe IDs that are no longer reachable from test-mode reads:

```sql
-- Mark rows as stale rather than deleting (preserves audit trail)
UPDATE rfp_org_subscriptions
SET status = 'rolled_back'
WHERE stripe_customer_id LIKE 'cus_%'
  AND created_at >= '<live_mode_window_start>';
```

Run this through `/db-safe` — DO NOT delete rows without a snapshot first.

---

## 7. Future Hardening — Per-Product Stripe Keys

Today PC LLC products share `STRIPE_SECRET_KEY` and rely on
`metadata.product` filtering at the webhook layer. This is fine for now
but creates a coupling: any live-mode swap affects every product.

**Option:** create restricted keys per product (`rk_live_rfp_engine`,
`rk_live_sage_saas`, `rk_live_janice`) and use a product-specific env var
(`RFP_STRIPE_SECRET_KEY`) in each app. Migration plan:

1. In Stripe Dashboard → Live mode → Developers → API keys → Create
   restricted key, scoped to `Charges`, `Customers`, `Subscriptions`,
   `Checkout Sessions`, `Prices` (read), `Products` (read), `Webhooks`
   (none — webhooks signed separately).
2. Add `RFP_STRIPE_SECRET_KEY` to Vercel env for the RFP project.
3. Update `lib/stripe/client.ts` to prefer the product-specific env var
   when present:
   ```ts
   const key =
     process.env.RFP_STRIPE_SECRET_KEY ??
     process.env.STRIPE_SECRET_KEY;
   ```
4. Test, deploy, then remove `STRIPE_SECRET_KEY` from the RFP project's env
   (other products keep using it until they're migrated).

This is out of scope for the initial live-mode swap. File it as a follow-up.

---

## 8. Sign-off

Before declaring live mode complete:

- [ ] At least one real customer paid invoice has cleared.
- [ ] Stripe Radar rules reviewed (default rules are usually fine for v1).
- [ ] Backup of test-mode env vars stored in 1Password (`PC LLC → Stripe Test`).
- [ ] This checklist updated with actual live-mode IDs in 1Password
  (NOT committed to the repo).
- [ ] Memory entry `rfp-stripe-live-cutover-<date>` written summarizing
  the switch and any anomalies.

---

## Appendix — Quick reference

**Test-mode IDs** (already in env):
- Pro price: `price_1TZDqGIwAPnWjXPHLzGlgPEL`
- Agency price: `price_1TZDqSIwAPnWjXPHEXFueC3N`
- Webhook: `we_1TZb39IwAPnWjXPHK87nPL4F`

**Account:** `acct_1PaRTgIwAPnWjXPH` (PC LLC)

**Webhook URL (test + live, same path):**
`https://rfp.perpetualcore.com/api/webhooks/rfp-stripe`

**Subscribed webhook events:**
`customer.subscription.created`, `customer.subscription.updated`,
`customer.subscription.deleted`, `checkout.session.completed`,
`invoice.payment_failed`

**Webhook product filter:** `metadata.product === "rfp_engine"`
(see `app/api/webhooks/rfp-stripe/route.ts` § `isRfpEvent`).
