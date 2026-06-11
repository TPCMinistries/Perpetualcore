# Phase 24-02 Summary — First-Run FTUE Path

## Completed

- Replaced the create-org flow with a five-field setup:
  - name
  - org type
  - mission
  - geography
  - funding types
- Stored the five-field setup into `rfp_orgs.capacity_summary`.
- Kept automatic post-create scoring through `createOrgWithOwner`.
- Added `profile_complete` to derived onboarding state.
- Reworked the Discovery checklist into the required sequence:
  - profile
  - voice
  - vault
  - match
  - draft
  - reviewer/export
- Made checklist step CTAs visible instead of hidden links.
- Improved empty states:
  - Discovery: recompute CTA remains, decorative halo removed.
  - Proposals: existing activation opportunities remain the CTA path.
  - Vault: empty state now points to evidence upload and Discovery.
  - Voice: empty state now points to training or describe-your-voice shortcut.
- Corrected stale Vault page copy to reflect current PDF/DOCX extraction and drafter retrieval.

## Verification

- Focused ESLint passed for touched FTUE files.
- Runtime import check passed for touched client/server modules.
- Local dev server started on `http://localhost:3002`.
- Browser smoke to `/orgs/new` returned HTTP `200` after auth redirect to `/login?next=/orgs/new`, with no page or console errors.
- Production deploy `dpl_DrP1M1S6epZWn4Ug1nSV8xiKNEak` is Ready and aliased to `https://rfp.perpetualcore.com`.
- Production `GET /api/health/rfp` includes `scraper_last_success` and `cron_24h`; current status is `degraded` because `open_drift_events=24`.

## Remaining Work

- Authenticated browser pass on a seeded org.
- E2E coverage for create org → scored Discovery → first draft.
- Admin console/operator pieces in ADMIN-01, ADMIN-02, ADMIN-03, ADMIN-05.
