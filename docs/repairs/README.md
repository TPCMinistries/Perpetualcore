# Repair service setup

September 5, 2026. Isolated branch: `codex/repair-service-setup-20260905`, based on fetched `origin/main` at `5493549`. Existing dirty/stale checkout was preserved.

## Ready to review

- `/repairs`: $300 USD fixed-scope service page for one Next.js or automation failure.
- Client-only brief composer with required-field validation, encoded email draft, clipboard feedback and text download. No lead writes, uploads or checkout.
- Static n8n export inspector under `scripts/repairs/`. Not an execution engine or customer case study.
- [Operating runbook](OPERATING_RUNBOOK.md): qualification, scope confirmation, delivery, acceptance, payment evidence and operating diagnosis.
- [Setup receipt](setup-status.json): verified checks and outstanding account dependencies.

The browser opens drafts to the site's existing published address, `lorenzo@perpetualcore.com`. Opening a draft does not send it. Commercial inbox access is not yet verified. No application, provider or payment configuration was changed.

## Validation

Commands from the worktree using existing dependencies:

```
node node_modules/vitest/vitest.mjs run tests/repairs/brief.test.ts tests/repairs/form.test.tsx
node node_modules/typescript/bin/tsc --noEmit --project tsconfig.repairs.json --pretty false
node node_modules/eslint/bin/eslint.js app/repairs lib/repairs tests/repairs
node scripts/repairs/preflight.check.ts
git diff --check
```

All passed. The focused suite has six tests. Next.js 16.2.11 compiled the route and a local HTTP check returned 200 with the heading, price, brief CTA and recipient. The local server used placeholder Supabase configuration, not customer/production credentials. Browser control repeatedly timed out, so visual layout and a real mail-handler launch remain unverified. This is not a full application build or production acceptance claim.

Local review URL while the development server runs: `http://127.0.0.1:3197/repairs`.

## Next operating step

Confirm/access the commercial inbox and intended Stripe merchant. The existing sending domains are verified. The live Stripe account checked has charges/payouts enabled but a LorenzoDC business profile; no new payment objects were created. Save the offer in the authenticated Revenue Studio workspace once browser access works, then run one authorized inbound/sending receipt check and a specifically scoped buyer conversation. Payment follows accepted scope. No unattended operator or campaign is running.

This adds only a new route, helper, tests, inspector and documents. Shared intake, database, auth, existing prices, navigation and other products are unchanged.
