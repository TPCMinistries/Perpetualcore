# RFP Release Gates

Last updated: 2026-06-16

## Current Release Gate

Use this command before production RFP deploys:

```sh
npm run verify:rfp-release
```

It runs:

1. `npm run lint -- --quiet`
2. `npm run type-check:release`
3. `npm audit --audit-level=high --omit=dev`
4. `npm run build`

`npm run type-check` now points at `type-check:release`, which runs the full RFP launch TypeScript slice (`tsconfig.rfp-launch.json`). That slice covers the RFP marketing surface, RFP app shell/components, authenticated RFP APIs, RFP cron/health routes, RFP Stripe webhook, shared RFP libs, Supabase types, and proxy/SEO files. The old all-repo TypeScript command is preserved as `npm run type-check:legacy`.

## Authenticated Browser Gates

When production or staging E2E credentials are available, run:

```sh
PLAYWRIGHT_BASE_URL=https://rfp.perpetualcore.com npm run verify:rfp-production
```

`verify:rfp-production` runs both authenticated browser gates:

1. `test:e2e:rfp-auth` validates the live capture workflow, proposal exports, status API, and billing checkout handoff.
2. `test:e2e:rfp-visual` checks authenticated proposal, pursuit, and billing surfaces across mobile/tablet/desktop for horizontal overflow, authenticated cookie-banner leakage, text clipping, and proposal export-bundle tile sizing.

Required env:

```sh
RFP_E2E_EMAIL=...
RFP_E2E_PASSWORD=...
RFP_E2E_ORG_ID=...
RFP_E2E_PROPOSAL_ID=...
PLAYWRIGHT_BASE_URL=https://rfp.perpetualcore.com
```

CI runs the same production browser gate after the build job. The workflow validates that all four RFP E2E secrets are present before Playwright starts, so missing credentials fail the release gate instead of silently skipping the authenticated tests.

## Why The Legacy Gate Is Not The Release Gate

The historical root command, `tsc --noEmit`, includes the entire legacy monorepo. On 2026-06-16 it ran CPU-active for 30+ seconds with no diagnostics in this workspace, matching prior sessions where it ran for 5-10+ minutes without returning. That makes it a poor deploy gate: it neither finishes quickly nor tells an engineer where to act.

The current production surface is the RFP Engine. Until the historical app surface is split into owned TypeScript projects, RFP deploys should use the finite RFP gate above and treat `type-check:legacy` as cleanup/investigation work.

## Moderate Audit Exceptions

`npm audit --audit-level=high --omit=dev` passes. Remaining production audit findings are moderate transitive advisories:

| Package path | Advisory | Current decision |
| --- | --- | --- |
| `next -> postcss` | PostCSS CSS stringify XSS advisory for `<8.5.10` | Accepted temporarily. The audit fix suggests forcing `next@9.3.3`, which is not a valid remediation for a Next 16 app. Track upstream Next/PostCSS resolution. |
| `exceljs -> uuid` | Missing buffer bounds check in `uuid` when caller provides `buf` | Accepted temporarily. The audit fix suggests downgrading `exceljs` to `3.4.0`, which is a breaking downgrade. Current XLSX import path does not expose raw `uuid` buffer APIs. Track ExcelJS transitive update. |

Revisit these exceptions on every dependency upgrade or before broad public launch.
