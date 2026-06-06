---
phase: 13-pre-work-stabilization
plan: 01
subsystem: admin-rfp
tags: [trust, inflated-counts, launch-readiness, admin-dashboard]
dependency_graph:
  requires: []
  provides: [LAUNCH-04]
  affects: [app/admin/rfp/page.tsx]
tech_stack:
  added: []
  patterns: [coverage-percent-driven tone, no hardcoded inventory targets]
key_files:
  created: []
  modified:
    - app/admin/rfp/page.tsx
decisions:
  - "Indexed tile tone driven by indexedCoveragePercent >= 80, not raw 80000 threshold"
  - "Operator action for inventory scale driven by indexedCoveragePercent < 80, copy names no absolute target"
  - "lib/rfp/source-readiness.ts left untouched — already computes targetIndexedEstimate dynamically from catalog"
metrics:
  duration: ~15 min
  completed: 2026-06-06T04:15:40Z
  tasks_completed: 2
  files_modified: 1
---

# Phase 13 Plan 01: Purge Inflated Opportunity Count Claims Summary

**One-liner:** Removed all hardcoded 80k/80000 opportunity-count claims from the admin RFP dashboard, replacing them with coverage-percent-driven signals that never assert an absolute inventory target.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Locate every inflated/static count claim in RFP surfaces | (audit only, no code change) | grep audit documented below |
| 2 | Purge the hardcoded 80k threshold and aspirational copy | 3d8802b | app/admin/rfp/page.tsx |

## Grep Audit (Task 1 — Full Output)

Command: `grep -rniE "80[,]?000|80k\+?" app components lib | grep -viE "node_modules|\.next"`

```
app/(rfp-marketing)/rfp/page.tsx:240:              Capture is a $90K–$180K human role.{" "}
app/roi-calculator/page.tsx:58:      avgSalary: 80000,
app/test-documents/page.tsx:94:          { Name: "Charlie Brown", Age: 29, Department: "Engineering", Salary: 80000 },
app/(dashboard)/org/[orgId]/discovery/parts/FeedRow.tsx:11: * Amount formatting: $2.4M / $480K / $12K — short, scannable.
lib/rfp/alerts/format.ts:10:/** $2.4M / $480K / $12K — short, scannable. Null → '—'. */
app/admin/rfp/page.tsx:314:        tone={summary.indexed >= 80000 ? "emerald" : "amber"}
app/admin/rfp/page.tsx:490:  if (sourceReadinessSummary.indexed < 80000) {
app/admin/rfp/page.tsx:494:      detail: "Public positioning wants 80k+ opportunities. Keep copy tied to verified indexed count until ingestion reaches that number.",
```

**Confirmed salary/dollar figures (left untouched):**
- `app/(rfp-marketing)/rfp/page.tsx:240` — "$90K–$180K human role" (salary range in capture-role copy)
- `app/roi-calculator/page.tsx:58` — `avgSalary: 80000` (salary assumption in ROI calculator)
- `app/test-documents/page.tsx:94` — `Salary: 80000` (test data)
- `app/(dashboard)/org/[orgId]/discovery/parts/FeedRow.tsx:11` — "$480K" in JSDoc comment (amount formatting example)
- `lib/rfp/alerts/format.ts:10` — "$480K" in JSDoc comment (amount formatting example)

**Inflated opportunity-count claims fixed:**
- `app/admin/rfp/page.tsx:314` — Indexed tile hardcoded threshold
- `app/admin/rfp/page.tsx:490-494` — Operator action with "80k+ opportunities" copy

## Exact Lines Changed (Task 2)

### Fix 1: Indexed tile tone (line ~314)

**Before:**
```tsx
tone={summary.indexed >= 80000 ? "emerald" : "amber"}
```

**After:**
```tsx
tone={
  summary.indexedCoveragePercent !== null &&
  summary.indexedCoveragePercent >= 80
    ? "emerald"
    : "amber"
}
```

Drives tone from coverage percentage against the dynamic catalog estimate — no hardcoded inventory number.

### Fix 2: Operator action block (lines ~490-498)

**Before:**
```ts
if (sourceReadinessSummary.indexed < 80000) {
  actions.push({
    id: "inventory-scale",
    label: "Scale verified inventory",
    detail: "Public positioning wants 80k+ opportunities. Keep copy tied to verified indexed count until ingestion reaches that number.",
    metric: formatNumber(sourceReadinessSummary.indexed),
    severity: "watch",
  });
}
```

**After:**
```ts
if (
  sourceReadinessSummary.indexedCoveragePercent !== null &&
  sourceReadinessSummary.indexedCoveragePercent < 80
) {
  actions.push({
    id: "inventory-scale",
    label: "Scale verified inventory",
    detail: "Indexed inventory is below catalog coverage target — keep all public copy tied to the live verified count.",
    metric: `${sourceReadinessSummary.indexedCoveragePercent.toFixed(1)}% covered`,
    severity: "watch",
  });
}
```

Removes "80k+ opportunities" from the detail string entirely. Drives the condition off `indexedCoveragePercent < 80` (a relative coverage signal, not a raw target number). The metric now shows "X% covered" instead of a raw count.

### lib/rfp/source-readiness.ts — No changes

Confirmed: `targetIndexedEstimate` is computed dynamically by summing `entry.targetIndexedEstimate` across catalog entries. No 80000 hardcoded. File left untouched.

## Verification Results

1. **Grep clean:** `grep -n "80000\|80k" app/admin/rfp/page.tsx lib/rfp/source-readiness.ts` — no output (clean)
2. **Remaining hits are all salary/dollar figures** — confirmed above
3. **TypeScript:** `npx tsc --noEmit --skipLibCheck` — no errors
4. **Admin RFP readiness view:** No longer references "80k+ opportunities" in any tone comparison, operator action label, or detail string

## Deviations from Plan

None — plan executed exactly as written. `lib/rfp/source-readiness.ts` confirmed clean with no 80000 hardcoded, as the plan anticipated.

## Self-Check: PASSED

- [x] `app/admin/rfp/page.tsx` modified (exists, grep-verified clean)
- [x] Commit `3d8802b` exists in git log
- [x] TypeScript passes with no new errors
- [x] All remaining grep hits are salary/dollar figures, zero are opportunity counts
