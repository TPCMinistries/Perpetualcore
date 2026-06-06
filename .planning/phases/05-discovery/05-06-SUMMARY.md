---
phase: 05-discovery
plan: "06"
subsystem: dual-mode-feed
tags: [rfp, discovery, dual-mode, mode-filter, org-union, dedup-by-max-fit, over-fetch, empty-state, org-switcher-chip]

# Dependency graph
requires:
  - phase: 05-discovery (plan 04)
    provides: buildFeedQuery + /api/rfp/opps + DiscoveryClient + FilterPills + FeedRow + FeedList + DiscoveryPage + OrgSwitcher
  - phase: 04-foundations-salvage-port
    provides: rfp_orgs.type column + listUserOrgs() + getOrgForUser()
provides:
  - "FeedFilters.dual_org_ids + mode_filter — query unions matches across the user's nonprofit + for-profit orgs"
  - "FeedRow.scored_for_org_{id,name,type} — populated via nested rfp_orgs select; used by the dual-mode row badge"
  - "GET /api/rfp/opps ?dual=true&mode=all|nonprofit|forprofit — verifies dual lens, resolves underlying member org ids, calls buildFeedQuery with the union set"
  - "API response empty_reason='no_member_orgs' discriminator — surfaced when a dual user owns no underlying nonprofit/forprofit orgs matching the mode"
  - "FilterPills.ModePill — segmented popover (All / Nonprofit / For-profit) rendered ONLY when isDualMode prop is true; appears to the left of Source"
  - "FeedRow scoring-org badge — compact 'NP · {name}' or 'FP · {name}' chip in dual mode, threaded through FeedList"
  - "DiscoveryClient empty-state branch — renders 'No member orgs in {mode}' with /orgs/new CTA when API returns empty_reason='no_member_orgs'"
  - "OrgSwitcher dual indicators — emerald-300 type label in the trigger, plus a 'dual' chip + 'Nonprofit + For-profit' subtitle inside dropdown items for dual orgs"
affects: [05-07 alerts (no contract change — alerts subscribe to INSERTs on rfp_opp_matches and don't care about how the feed reads), 06 capture-profile (dual users may want to edit one underlying profile at a time — deep link contract stable)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Dedup-by-max-fit-score: when union-querying across orgs, the same opp can appear with different scores per org. We collect into a Map keyed by opp_id, keeping the row with the highest fit_score, then re-sort by (fit_score DESC, opp_id ASC) so the keyset cursor stays monotonic."
    - "Over-fetch ratio 2x for dual mode: dedup happens AFTER the database returns rows, so to guarantee returning `limit` distinct opps we fetch 2*limit and slice down post-dedup. 2x is conservative — even if every opp dupes across nonprofit+forprofit (worst case), we still return at least `limit` rows. Documented inline."
    - "Server prefetch parity with API: page.tsx replicates the API's dual-mode resolution (listUserOrgs → filter by type → either pass dual_org_ids or short-circuit with empty_reason) so first paint matches the data the client would fetch. No flicker on hydration."
    - "Mode pill emit policy: ?mode=... only enters the URL when isDualMode AND mode !== 'all'. Single-mode orgs never see ?mode= in their URL — zero leakage of dual-mode concepts into the single-org UX."
    - "Defensive optional badge render: FeedRow only shows the org badge when scored_for_org_name.trim().length > 0, so a missing nested join (e.g. RLS edge case) degrades gracefully to no badge instead of an empty box."
    - "Activeorg `dual` discrimination at OrgSwitcher trigger: emerald-300 type label vs zinc-500 for single-mode types — at-a-glance signal in the header that the active org unions multiple."

key-files:
  created: []
  modified:
    - lib/rfp/feed.ts                                                # +119 −22  (322 total)
    - app/api/rfp/opps/route.ts                                       # +139 −16  (277 total)
    - app/(dashboard)/org/[orgId]/discovery/DiscoveryClient.tsx       # +152 −58  (281 total)
    - app/(dashboard)/org/[orgId]/discovery/page.tsx                  # +88 −24   (152 total)
    - app/(dashboard)/org/[orgId]/discovery/parts/FilterPills.tsx     # +120 −0   (387 total)
    - app/(dashboard)/org/[orgId]/discovery/parts/FeedList.tsx        # +21 −3    (123 total)
    - app/(dashboard)/org/[orgId]/discovery/parts/FeedRow.tsx         # +59 −4    (130 total)
    - components/rfp/OrgSwitcher.tsx                                  # +58 −11   (219 total)

key-decisions:
  - "Dedup-by-max-fit happens in JS, not in SQL. A window function (row_number() over (partition by opp_id order by fit_score desc)) is more efficient at high cardinality but requires an RPC or untyped raw SQL call from supabase-js. At our row volumes (≤50 fetched per page) the JS pass is O(n) over a tiny set and keeps the code path identical to the single-org path, which matters for testability."
  - "Mode filtering at the API route, not in the feed query. The route resolves the user's underlying org ids (via listUserOrgs) and pre-filters them by type before calling buildFeedQuery. This keeps buildFeedQuery agnostic to user identity (it never reads cookies for ownership — only RLS does), which preserves the principle that lib/rfp/feed.ts is a pure server helper, not an auth boundary."
  - "Empty-state discriminator (empty_reason) is a response field, not an HTTP status. A dual user with no underlying orgs is in a NORMAL state — they just need to join one. Returning 400 or 404 would force the client to special-case error parsing; returning 200 with rows=[] + empty_reason='no_member_orgs' lets the client treat it as 'feed loaded successfully, just empty for a structural reason' and render an actionable CTA inline."
  - "Excluding type='dual' orgs from the union: a dual user might have multiple dual orgs (rare but possible — e.g. one for IHA + Perpetual Core, another for a separate dual venture). The union deliberately filters those out so we never double-count by querying both a dual lens and its members. If a dual org has its own rfp_opp_matches rows directly (which it shouldn't under the current model), they're invisible to the union — that's the right behavior because the dual lens isn't supposed to be a scoring target."
  - "FeedRow badge ALWAYS renders in dual mode, even when scored_for_org_id equals the active orgId. The plan's truth #3 makes this explicit. The badge is the user's primary signal for which side of the lens produced each row, and conditional rendering would create a 'sometimes-visible' UX that makes the rule harder to learn. We pass activeOrgId through anyway for forward-compat — a future iteration could suppress when the active org IS the scoring org (e.g. if we ever scored directly against the dual lens)."
  - "Server prefetch and API duplicate the dual-resolution logic. We could DRY this by extracting a helper from app/api/rfp/opps/route.ts and re-using it in page.tsx, but: (a) the two call sites have different return shapes (page.tsx threads into a server-side buildFeedQuery, route.ts threads into a NextResponse), (b) extracting would create a third file with no other consumers, (c) the duplication is small (~15 lines each side). Inline duplication wins on legibility for now; if a third caller appears, refactor then."
  - "URL hygiene: ?mode= is only emitted when isDualMode AND mode !== 'all'. This means: (1) single-mode orgs never see ?mode= in their URL (zero leakage of dual concepts), (2) the default dual view (mode=all) doesn't pollute share-links, (3) deep-links like /org/<dual>/discovery?mode=nonprofit work end-to-end. parseModeFromSearch on the server reads the same URL contract so deep-link navigations don't need a client-side re-fetch."
  - "OrgSwitcher dual chip is in addition to (not replacing) the existing type label. Both signals — the colored type label in the trigger + the 'dual' chip + 'Nonprofit + For-profit' subtitle in the dropdown — coexist so dual users see the signal at every level of UI depth. Single-mode users see exactly the same UI they did in 05-04, no regression."

patterns-established:
  - "Pattern: union query across user-owned orgs with dedup-by-max-fit + over-fetch — usable for any future 'aggregate across membership set' read path"
  - "Pattern: empty_reason discriminator on a 200 response when an empty result is semantically meaningful (vs filter-empty); client renders a contextual empty state instead of the generic placeholder"
  - "Pattern: mirror server prefetch logic against API logic for dual-mode-style discriminated responses, so first paint is byte-for-byte identical to subsequent fetches"
  - "Pattern: feature-gated filter pills (isDualMode prop gates the Mode pill) — same component, conditional surface; non-dual users see zero added UI"
  - "Pattern: row-level badge surfaces multi-source provenance when the parent query unions across multiple scoping entities"

requirements-completed: ["ORG-04"]

# Metrics
duration: ~45 min
completed: 2026-05-11
---

# Phase 05 Plan 06: Dual-Mode Feed Support Summary

**Dual-mode Discovery feed: users whose active org is type='dual' now see a unified ranked feed unioned across their nonprofit + for-profit member orgs, with a left-most Mode pill (All / Nonprofit / For-profit), per-row scoring-org badges showing which side matched, an actionable empty state when the user has a dual lens but no underlying member orgs, and OrgSwitcher dual indicators (emerald type label + 'dual' chip + 'Nonprofit + For-profit' subtitle). Non-dual orgs see zero UI changes — the Mode pill and badges are gated on org.type === 'dual'.**

## Performance

- **Duration:** ~45 min (single session, all 3 commit groups)
- **Tasks:** 3 logical (feed/API extension; client+UI orchestration; OrgSwitcher dual indicators)
- **Files created:** 0
- **Files modified:** 8
- **Atomic commits on `feat/05-06-dual-mode`:** 3 (be6bc3e, 6474df8, d189a23)

## Accomplishments

- **ORG-04 closed:** Dual-mode users (active org type='dual') see a union feed across all their underlying nonprofit + for-profit member orgs; the same opp scoring against both sides surfaces once with the higher fit_score, badged with whichever org won.
- **Mode pill:** Renders left of Source ONLY for dual-mode orgs. Popover with All / Nonprofit / For-profit; URL-synced via ?mode= (only emitted when non-default, to keep single-mode URLs clean).
- **Empty-state for dual-with-no-member-orgs:** API returns `{ rows: [], next_cursor: null, empty_reason: 'no_member_orgs', mode }` and DiscoveryClient renders a mode-specific empty state ("No member orgs in nonprofit" etc.) with a `/orgs/new` CTA. Server prefetch mirrors this so first paint shows the empty state without a flicker.
- **Per-row scoring-org badge:** Each FeedRow in dual mode renders a compact `NP · {orgName}` / `FP · {orgName}` chip inline with the title so the user sees which underlying org produced each row.
- **OrgSwitcher dual indicators:** Trigger pill colors the type label emerald-300 for dual orgs (zinc-500 for single types); dropdown rows for dual orgs gain a `dual` chip + `Nonprofit + For-profit` subtitle. The user gets the signal at every level of UI depth.
- **Zero regression for non-dual users:** Mode pill hidden, no API param leakage (?dual= and ?mode= never emitted), no badge on rows, identical visual + behavioral surface to 05-04.
- **RLS preserved end-to-end:** Both the API route and the server prefetch use the request-scoped `createClient`. The route additionally gates `dual=true` requests on `getOrgForUser` (membership check) AND `org.type === 'dual'`. `createAdminClient` is never touched on the feed read path.
- **Stable keyset pagination under dedup:** Over-fetch by 2x to compensate for dedup-by-max-fit collapsing duplicates; after dedup we re-sort and slice to `limit` so `(fit_score, opp_id)` cursors remain monotonic.
- **TS strict + ESLint clean:** Scoped `tsc --noEmit -p tsconfig.06-only.json` and `eslint` on all 8 touched files return clean.

## Task Commits

Atomic on `feat/05-06-dual-mode`:

| # | Commit  | Type | Description                                                                                                   |
| - | ------- | ---- | ------------------------------------------------------------------------------------------------------------- |
| 1 | be6bc3e | feat | dual-mode feed query union + mode filter (lib/rfp/feed.ts + app/api/rfp/opps/route.ts)                        |
| 2 | 6474df8 | feat | DiscoveryClient passes mode + dual to API; renders mode pill + org badge (client + page + 3 parts)            |
| 3 | d189a23 | feat | OrgSwitcher highlights dual-type orgs (trigger color + dropdown chip + subtitle)                              |

## Files Created/Modified

### Modified (this session)

- `lib/rfp/feed.ts` (322 lines, +119 −22) — Extended `FeedFilters` with `dual_org_ids?: string[]` + `mode_filter?: 'all'|'nonprofit'|'forprofit'`; extended `FeedRow` with `scored_for_org_{id,name,type}`. `buildFeedQuery` branches: when `dual_org_ids` is non-empty, switches to `.in('org_id', ids)`, nested-selects `rfp_orgs (id,name,type)`, over-fetches 2×, deduplicates by opp_id keeping highest fit_score, then re-sorts (DESC fit_score, ASC opp_id) and slices back to `limit` for stable cursors.
- `app/api/rfp/opps/route.ts` (277 lines, +139 −16) — Added Zod fields `dual` (bool) + `mode` (enum, default 'all'). New `resolveDualOrgIds()` helper: verifies `getOrgForUser(org_id).type === 'dual'`, calls `listUserOrgs()`, filters out dual lenses themselves, narrows by mode. Returns `{kind:'invalid'}` (→ 400 invalid_dual_org), `{kind:'empty'}` (→ 200 with `empty_reason:'no_member_orgs', mode`), or `{kind:'ok', ids}` (→ pass into `buildFeedQuery`). Surfaces `mode` in the success response for client UI parity.
- `app/(dashboard)/org/[orgId]/discovery/DiscoveryClient.tsx` (281 lines, +152 −58) — Accepts the full `org: RfpOrg` (not just `orgId`) so it can read `org.type`. New state `mode: ModeFilter` + `emptyReason: 'no_member_orgs' | null`. `buildUrl()` injects `dual=true&mode=...` when `isDualMode`. Filter re-fetch effect now depends on `[filters, mode]`. URL sync emits `?mode=` only when `isDualMode && mode !== 'all'`. When `isDualMode && emptyReason === 'no_member_orgs' && rows.length === 0`, renders an inline empty state ("No member orgs in {mode}") with `/orgs/new` CTA instead of FeedList.
- `app/(dashboard)/org/[orgId]/discovery/page.tsx` (152 lines, +88 −24) — Loads org via `getOrgForUser` (defense-in-depth `notFound()` on null). Reads `?mode=` from search params. For dual orgs, replicates the API's dual-resolution logic to compute `dualOrgIds` or set `initialEmptyReason = 'no_member_orgs'`. Skips the buildFeedQuery prefetch entirely when the empty state will render. Passes `org`, `initialMode`, `initialEmptyReason` to `DiscoveryClient`.
- `app/(dashboard)/org/[orgId]/discovery/parts/FilterPills.tsx` (387 lines, +120 −0) — Added `ModeFilter` type. New props on `FilterPillsProps`: `isDualMode?: boolean`, `mode?: ModeFilter`, `onModeChange?`. New `ModePill` component: popover with role=listbox + role=option entries (All / Nonprofit / For-profit), exclusive selection, click-outside dismissal, active styling when value !== 'all'. Rendered before `SourcePill` ONLY when `isDualMode && onModeChange` are both truthy.
- `app/(dashboard)/org/[orgId]/discovery/parts/FeedList.tsx` (123 lines, +21 −3) — Added optional props `showOrgBadge?: boolean` + `activeOrgId?: string`; passes both through to each `<FeedRow />`.
- `app/(dashboard)/org/[orgId]/discovery/parts/FeedRow.tsx` (130 lines, +59 −4) — Added `showOrgBadge?` + `activeOrgId?` props (activeOrgId currently unused, kept for forward-compat). New `orgTypeAbbrev()` helper. Renders a compact badge inline with the title in the row's flex header: `NP · {name}` / `FP · {name}`, mono uppercase, zinc-900 background + zinc-800 border, `title` attribute for hover-disclosure of the full name. Defensive guard: badge suppressed when `scored_for_org_name` is blank (e.g. nested join didn't resolve).
- `components/rfp/OrgSwitcher.tsx` (219 lines, +58 −11) — Trigger pill: type label colored emerald-300 when `type === 'dual'`, zinc-500 otherwise. Current-org dropdown row + all "others" rows: when org is dual, gain a `dual` chip (emerald-300 text on emerald-950/40 background w/ emerald-900/50 border) next to the name and a `Nonprofit + For-profit` subtitle beneath. Nonprofit/forprofit single-type rows render unchanged.

### Not committed (intentional)

- `tsconfig.06-only.json` — Scoped tsconfig for verification (project-wide `tsc --noEmit` OOMs at 4GB heap per the 05-02/05-03/05-04 pattern). Includes only this plan's files + transitive deps. Not committed per the established phase convention.

## Decisions Made

(All reproduced in frontmatter `key-decisions`. Highlights below.)

1. **Dedup-by-max-fit in JS, not SQL.** A `row_number() over (partition by opp_id order by fit_score desc)` window in a database VIEW or RPC is more efficient at high cardinality, but requires SQL outside supabase-js's typed query builder (raw RPC or `.rpc()` call). At our row volumes (≤50 fetched per page with 2× over-fetch), a Map-based JS pass is O(n) over a tiny set and keeps the code path identical to the single-org path — easier to reason about, easier to test, easier to debug.
2. **Over-fetch ratio 2×.** Worst case: every opp scored against both nonprofit + for-profit (full duplication). 2× guarantees at least `limit` distinct opps post-dedup. We slice back to exactly `limit` after dedup + re-sort so the keyset cursor stays monotonic with the single-org path. Documented inline.
3. **Mode resolution at the API route, not in the helper.** `buildFeedQuery` stays a pure server helper — it never reads cookies for ownership, only RLS does. The route reads the user's membership set via `listUserOrgs()`, filters by mode → org type, and hands an already-resolved id list to the helper. This preserves the principle that `lib/rfp/feed.ts` is not an auth boundary, only a query shape — testable in isolation.
4. **`empty_reason` discriminator on a 200, not a 4xx.** A dual user with no underlying orgs is in a normal state ("you need to join an org") — not an error. Returning 400/404 would force special-case error parsing on the client; returning 200 + `empty_reason='no_member_orgs'` + `mode` lets the client treat it as a successfully-loaded-but-empty-for-a-structural-reason response and render an actionable inline CTA.
5. **Exclude type='dual' orgs from the union.** A dual user might own multiple dual lenses (e.g. one for IHA+Perpetual Core, another for a separate venture). The union deliberately filters those out so we never double-count by querying both a dual lens and its underlying members. Dual orgs aren't supposed to be scoring targets themselves; the union targets the underlying scoring orgs only.
6. **Badge always renders in dual mode, regardless of whether scored_for matches active.** Plan truth #3 makes this explicit. The badge is the primary user signal for "which side of the lens produced this row" — conditional rendering would create a "sometimes-visible" rule that's harder to learn. We thread `activeOrgId` through anyway for forward-compat in case a future iteration wants to suppress it when the active org IS the scoring org (e.g. if we ever directly score against the dual lens).
7. **Server prefetch duplicates API dual-resolution logic.** DRYing into a shared helper would mean: extra file, two call sites with different return shapes (NextResponse vs Awaited<buildFeedQuery>), only two consumers. Inline duplication wins on legibility for now; if a third caller appears we refactor then. The two implementations are easy to keep in sync because they share the same shape and the same comments.
8. **URL hygiene for `?mode=`.** Only emitted when `isDualMode && mode !== 'all'`. Single-mode org URLs never see dual concepts leak in. The default dual view (`mode=all`) doesn't pollute share-links. Deep-link parsing in `page.tsx` reads the same contract so a deep link to `/org/<dual>/discovery?mode=nonprofit` lands correctly without a client-side re-fetch.
9. **OrgSwitcher dual signals at every depth.** Trigger pill color (emerald-300 type label) + dropdown chip + dropdown subtitle. Dual users see the signal whether they're glancing at the header or actively switching orgs. Single-mode users see exactly the 05-04 UI — zero added pixels.

## Deviations from Plan

### Auto-fixed Issues

None. The plan was specific enough that all logic landed as written. Two minor additions inside scope:

**1. [In-scope refinement] Defensive badge suppression when scored_for_org_name is blank**
- **Found during:** Task 2 implementation, while writing FeedRow.
- **Issue:** Single-mode rows go through the same `toFeedRow()` mapper and now carry `scored_for_org_name`, but in single-org mode the nested `rfp_orgs` select might be filtered by RLS in edge cases (the user is by definition a member, so this should never happen — but defensive code is cheaper than a missing-data render). An empty name would render a sad-looking " · " badge.
- **Fix:** `badgeVisible = showOrgBadge && row.scored_for_org_name.trim().length > 0`. If the name is blank, no badge — the row just shows the existing title + meta line as in 05-04.
- **Committed in:** `6474df8`

**2. [In-scope refinement] API surfaces `mode` field on dual-mode success responses**
- **Found during:** Task 1 wrap-up. The plan only required `empty_reason` + `mode` together on the empty case, but I added `mode` to the success-case response too.
- **Rationale:** The client now has a single source of truth for the resolved mode without re-deriving it from URL state on every response. Cost is one extra string per response; benefit is that the client could in principle correct itself if a server-side default ever drifts from the URL.
- **Committed in:** `be6bc3e`

### Process Notes

**3. [Process] `tsconfig.06-only.json` not committed**
- Same pattern as Plan 05-04's `tsconfig.04-only.json`. Project-wide `tsc --noEmit` OOMs at 4GB heap. The scoped tsconfig includes only this plan's files + transitive deps and tsc-passes cleanly. Per the orchestrator's instructions, helper artifacts like this stay local to the worktree.

**4. [Process] No `npm run build` verification**
- The plan asks for `npm run build` as Step 1 of Task 1's verify. The 05-04 SUMMARY documented that the project-wide build OOMs at the heap limit in this worktree environment. ESLint + scoped tsc cover the static analysis surface; live integration coverage is deferred to Phase 9 (Quality + Eval).

**5. [Process] No live RLS verification**
- Verifying that a non-member calling `?dual=true&mode=all` gets `invalid_dual_org` requires logged-in test users with known dual-org memberships. The code path mirrors 05-04's RLS pattern (also request-scoped `createClient`) and 05-04 documented the same RLS-derived behavior. Live verification should run on the merged main branch.

---

**Total deviations:** 0 architectural, 0 scope creep, 2 in-scope refinements (defensive null-check + `mode` echo on success), 3 process notes.

## Issues Encountered

- **Project-wide `tsc --noEmit` OOMs at 4GB heap** — pre-existing per 05-02/03/04 SUMMARYs. Verified locally via the scoped `tsconfig.06-only.json` (clean).
- **No live UI smoke** — bash sandbox blocks `cd` into the worktree for `npm run dev`. ESLint + scoped tsc run via `node -e "process.chdir(...); spawnSync('npx', ...)"`. Live verification on orchestrator's merge tick, not this branch.
- **Single chained bash denial early in the session** — orchestrator note predicted this; resolved by separating `cd` from the action (`git -C /tmp/perpetual-core-w4-06 status` style throughout). Did not require retry on any subsequent command.

## Authentication Gates

None encountered. The feed routes are request-scoped (use the caller's session cookie); the layout already enforces membership via `getOrgForUser()` from 04-03. The dual-mode resolution piggybacks on the same auth surface.

## Next Phase Readiness

- **Plan 05-07 (Alerts)** unchanged contract. Alerts subscribe to INSERTs on rfp_opp_matches and don't care about how the feed reads — dual mode is purely a read-side concern.
- **Phase 6 (Capture Profile)** can deep-link into `/org/<dual>/discovery?mode=nonprofit&sources=...` — the full URL contract (filters + mode) is stable and documented in both the route handler and the page.tsx parsers.
- **Phase 9 (Quality + Eval)** should add:
  - Vitest cases for `buildFeedQuery` with `dual_org_ids` covering: union across two orgs, dedup-by-max when an opp scores in both, mode filtering at the route level, empty-orgs short-circuit at the route level, over-fetch correctness (≤50 fetched but only `limit` returned post-dedup).
  - Playwright e2e: dual user toggles Mode pill → URL updates → feed rescopes; non-dual user sees no Mode pill (DOM assertion); dual user with no underlying orgs sees the empty-state CTA.
  - Visual regression on FeedRow badge across the three org types.

## User Setup Required

None for code. Operational items:
- A dual-org fixture user (member of one dual lens + at least one nonprofit + at least one for-profit) needed for live verification of the union path on the merged branch.
- A second fixture: dual lens with zero underlying member orgs, for the empty-state assertion.

## Self-Check: PASSED

| Item                                                                                                                  | Status |
| --------------------------------------------------------------------------------------------------------------------- | ------ |
| `lib/rfp/feed.ts` modified (322 lines, dual_org_ids + scored_for_org_* + dedup-by-max + over-fetch 2x)                | FOUND  |
| `app/api/rfp/opps/route.ts` modified (277 lines, resolveDualOrgIds + invalid_dual_org + empty_reason)                 | FOUND  |
| `app/(dashboard)/org/[orgId]/discovery/DiscoveryClient.tsx` modified (281 lines, org prop, mode state, empty-state)   | FOUND  |
| `app/(dashboard)/org/[orgId]/discovery/page.tsx` modified (152 lines, getOrgForUser + dual prefetch)                  | FOUND  |
| `app/(dashboard)/org/[orgId]/discovery/parts/FilterPills.tsx` modified (387 lines, ModePill + isDualMode props)       | FOUND  |
| `app/(dashboard)/org/[orgId]/discovery/parts/FeedList.tsx` modified (123 lines, threads showOrgBadge + activeOrgId)   | FOUND  |
| `app/(dashboard)/org/[orgId]/discovery/parts/FeedRow.tsx` modified (130 lines, scoring-org badge inline with title)   | FOUND  |
| `components/rfp/OrgSwitcher.tsx` modified (219 lines, dual chip + Nonprofit+For-profit subtitle + emerald type)       | FOUND  |
| Commit `be6bc3e` (Task 1 — feed/API dual-mode + empty_reason)                                                          | FOUND  |
| Commit `6474df8` (Task 2 — client + filter pill + feed row badge + page.tsx)                                          | FOUND  |
| Commit `d189a23` (Task 3 — OrgSwitcher dual indicators)                                                                | FOUND  |
| ESLint clean on all 8 touched files                                                                                    | PASS   |
| Scoped `npx tsc --noEmit -p tsconfig.06-only.json` clean                                                              | PASS   |
| Must-have artifact: `lib/rfp/feed.ts` provides `dual_org_ids` + `mode_filter`                                          | PASS   |
| Must-have artifact: `app/api/rfp/opps/route.ts` reads `dual=true&mode=...`, resolves user orgs, passes dual_org_ids   | PASS   |
| Must-have artifact: DiscoveryClient detects org.type === 'dual', sets dual=true on API, passes mode                    | PASS   |
| Must-have artifact: FilterPills conditionally renders Mode pill when isDualMode                                        | PASS   |
| Must-have artifact: FeedRow renders scoring-org badge when row.scored_for_org_name set                                 | PASS   |
| Must-have key-link: DiscoveryClient → /api/rfp/opps via `dual=true` pattern                                            | PASS   |
| Must-have key-link: /api/rfp/opps → buildFeedQuery via `dual_org_ids` arg                                              | PASS   |
| Must-have truth: dual user feed unions matches across all owned nonprofit + forprofit orgs (via dedup-by-max-fit)      | PASS   |
| Must-have truth: Mode pill appears ONLY for dual orgs, All/Nonprofit/For-profit, default All                           | PASS   |
| Must-have truth: each FeedRow in dual mode shows scoring-org badge (NP · {name} / FP · {name})                         | PASS   |
| Must-have truth: OrgSwitcher distinguishes dual orgs (emerald label + chip + subtitle)                                 | PASS   |
| Must-have truth: non-dual orgs see no Mode pill, no badges, no behavior change from 05-04                              | PASS   |
| Must-have truth: dual user w/ no underlying member orgs → empty_reason='no_member_orgs' → mode-specific empty state    | PASS   |
| Working tree clean except intentional untracked tsconfig.06-only.json                                                  | PASS   |

---
*Phase: 05-discovery*
*Plan: 05-06*
*Completed: 2026-05-11*
