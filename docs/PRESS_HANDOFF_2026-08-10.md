# Press production handoff — 2026-08-10

## Live result

- Customer site: https://press.perpetualcore.com
- Studio entry: https://press.perpetualcore.com/press/studio
- The marketing site, same-domain sign-in, Studio route, both asset sets, and unauthenticated worker boundary were verified live:
  - marketing `/`: `200`
  - `/login?next=/press/studio`: `200`
  - logged-out Studio: `307` to `/login?next=/press/studio`
  - routed Studio CSS: `200`
  - marketing CSS after returning home: `200`
  - unauthenticated wake-config endpoint: `401`

## Product release

Canonical implementation checkout:

`/Users/lorenzodaughtry-chambers/ORGANIZED/01_PROJECTS/ACTIVE/perpetual-core-press-production-ready`

- Source commit: `a1b388c34109402a9dbb5bdfb26369596f2bbd88`
- Source branch: `codex/press-production-lifecycle-20260809`
- Pull request: https://github.com/TPCMinistries/Perpetualcore/pull/58
- Main application Vercel production deployment: `dpl_F3QXT4dfkC1fDDrKt35qS2DjPvem`
- This exact deployment contains the event-driven worker, resumable upload, access controls, lifecycle controls, and customer UX release.

Validated before release:

- local type-check, Press type-check, focused Press tests, full test suite, full production build
- GitHub CI run `31352955359`: lint/type-check, build, and unit tests all passed
- Vercel preview for `a1b388c` passed before promotion

### What changed

- TUS resumable uploads with real progress, pause/resume/retry, and 6 MiB chunks.
- Worker wake latch via Supabase Realtime, with a five-minute recovery sweep rather than a constant claim poll.
- Owner/admin lifecycle controls: archive, retry, export, permanent deletion, and preserved storage-boundary validation.
- Role checks close the prior viewer mutation bypass.
- Job monitor, upload/lifecycle status, archival read-only mode, and clear customer-facing language.
- Quota/lifecycle protections and terminal archived-project handling.

## Press domain router

Router checkout:

`/Users/lorenzodaughtry-chambers/ORGANIZED/01_PROJECTS/ACTIVE/press-public-router-production`

- Router branch on GitHub: `codex/press-product-routing-20260809`
- Router content commit on GitHub: `905fecf3c76d961f7a92db917e18971c9abaef5a`
- Local equivalent commit: `c25f910`
- Production router deployment: `dpl_FVj5eJERaNdqbTy3ayCgoRKR9MaT`
- Router project: `the-gdi/press-public-router`

The router keeps the new marketing experience at the root and forwards Press product routes (`/login`, `/auth/*`, `/press/studio/*`, and `/api/press/*`) to the main application. It uses a short-lived HTTP-only `press_app_surface` marker so routed Studio assets load from the application build without colliding with marketing assets.

`pnpm check` passed in the router checkout. The verified preview was `dpl_CCgZyTFthJ6qMg6Z8Z6gQXF1y7Sg`.

## Mac Mini worker

- Service: `gui/501/com.perpetualcore.press-worker`
- Worker ID: `press-worker-sage-mini`
- Worker repo: `/Users/herald/Services/press-worker`
- Service wrapper: `/Users/herald/Services/press-worker/scripts/press/run-production-worker-mini.sh`

Installed the following checksum-verified files:

- `scripts/press/queue-worker.ts`
- `scripts/press/worker-scheduler.ts`
- `scripts/press/run-production-worker-mini.sh`

Old locally patched worker files were preserved at:

`/Users/herald/Services/press-worker/.press-backups/a1b388c-20260810T0358Z`

Staged release files remain at:

`/Users/herald/Services/press-worker/.press-release-a1b388c`

Operational proof after restart:

- launchd service was running with PID `14231`
- production heartbeat reported `wakeMode: realtime+recovery`, `realtimeConnected: true`, `recoverySweepMs: 300000`
- a data-free update of `press_worker_wakeups` produced `Press queue drain requested (realtime).`
- no new worker error was written; the last error-log timestamp remained from the prior caption-rendering issue

## Database state

Production Supabase project: `hgxxxmtfmvguotkowxbu` (LDC Brain AI).

Applied migrations:

- `20260810025826_press_worker_event_wakeup.sql`
- `20260810030208_press_lifecycle_controls.sql`

Verified after migration:

- only the non-sensitive wake latch is in Realtime; `press_jobs` is not
- wake latch RLS allows only anonymous select and service-role mutation
- customer-facing roles cannot call archive/retry RPCs or directly delete Press rows
- worker heartbeat is fresh and Realtime-connected

## Remaining owner actions / next session

1. Verify an email address for the GitHub identity at https://github.com/settings/emails. GitHub currently rejects PR creation, merge, and normal `git push` with: `At least one email address must be verified to do that.`
2. Then merge PR #58 into `TPCMinistries/Perpetualcore` and open/merge the router branch above into `TPCMinistries/press-public-router`. Both production artifacts are live now, but the repository default branches must catch up to prevent a later Git-triggered deployment from reverting them.
3. Sign in once at `https://press.perpetualcore.com/press/studio` with the approved Google account and confirm the visible Studio workspace. The route and login page are proven, but this final same-domain authenticated browser check was not completed because the available browser sessions had no active login.
4. Run one disposable synthetic recording through upload → transcribe → clips → render → archive/delete. Do not use real customer media for the first end-to-end proof.
5. Before broad self-serve signup, keep Press as guided/invite-only until billing/entitlements, support inbox, and isolated worker resource limits are complete. Current release is ready for a governed pilot, not an unbounded public upload service.

## Housekeeping performed

To free build space, removed only verified inactive generated `.next` caches (about 2.6 GB) from four Press worktrees. They are recoverable by rebuilding; no source files or customer data were removed.
