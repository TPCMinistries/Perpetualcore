# Phase 24-04 Summary — Admin Margin and Entitlement Controls

## Completed

- Extended `/admin/rfp` platform totals with:
  - active RFP MRR
  - AI cost over the last 30 days
  - gross margin dollars
  - gross margin percent
- Extended the operator action queue with margin-risk and unfunded-AI-spend warnings.
- Extended per-org admin rows with:
  - subscription tier/status
  - MRR
  - AI cost over the last 30 days
  - gross margin dollars/percent
  - coverage level
  - monthly AI budget
  - score/draft/review/vault quotas
  - last override timestamp/reason
- Added a gated `updateEntitlement` server action on `/admin/rfp`.
- Operator overrides upsert `rfp_entitlements` by `org_id` and preserve the existing nullable quota semantics:
  - blank budget/quota fields become `NULL`
  - `NULL` means unlimited/inherited under the existing entitlement design
  - filled budget/quota fields become explicit overrides
- Override writes use `createAdminClient()` and stamp `override_by`, `override_reason`, `override_at`, and `updated_at`.

## Verification

- `npx eslint app/admin/rfp/page.tsx lib/rfp/admin-metrics.ts --ext .ts,.tsx` — passed.
- Env-loaded runtime import check passed:
  - `lib/rfp/admin-metrics.ts`
  - `app/admin/rfp/page.tsx`
- `npm run build` — passed; generated all 402 routes including `/admin/rfp`.
- Production deploy `dpl_6gRf69DSzFEnZFqRaKpV3isd39gi` is Ready and aliased to `https://rfp.perpetualcore.com`.
- Production smoke checks passed:
  - `GET /api/health/rfp` returned `200` with `cron_24h.error_rate_percent=0`.
  - `HEAD /rfp` returned `200`.
  - `HEAD /admin/rfp` returned gated `404` for unauthenticated access with `x-matched-path: /admin/rfp`.

## Notes

- No schema migration was needed; existing `rfp_entitlements`, `rfp_org_subscriptions`, and `rfp_agent_sessions` fields were sufficient.
- MRR uses current RFP tier pricing in code: Pro `$799`, Agency `$2,499`; Enterprise remains `$0` because enterprise pricing is custom/manual.
- Full project `tsc --noEmit --pretty false --incremental false -p tsconfig.json` was stopped after several minutes with no diagnostics to avoid the known long compiler-run issue documented in the handoff.
- Local authenticated `/admin/rfp` browser verification could not run because `.env.local` does not include `RFP_PLATFORM_ADMIN_USER_IDS`; the route fails closed with `404` for non-admin access as designed.

## Remaining Work

- Authenticated browser pass on `/admin/rfp`.
- External uptime/status monitor wiring for the remaining ADMIN-04 task.
- Authenticated FTUE E2E for create org → scored Discovery → first draft.
