# VERIFY-phase19-seed.md

Phase 19 rubric extraction + compliance gate + AI disclosure end-to-end verification runbook.

**Login:** lorenzo.d.chambers@gmail.com on https://rfp.perpetualcore.com
**Fixture:** `/tmp/phase19-section-lm-fixture.docx` (20-page DOCX with Section L/M evaluation criteria)
**DB:** LDC Brain AI — hgxxxmtfmvguotkowxbu (Supabase project)

---

## SEED

### Step 1 — Identify or create a test proposal linked to an opportunity

1. Go to https://rfp.perpetualcore.com and log in as `lorenzo.d.chambers@gmail.com`
2. Open your org's **Pursuits** view and choose any existing opportunity, or create a test one
3. Click into the pursuit to open the proposal workspace
4. Note the **Proposal ID** from the URL: `https://rfp.perpetualcore.com/org/<orgId>/proposals/<PROPOSAL_ID>`
5. Note the **Opportunity ID** — visible in the proposal workspace header or via SQL below:

```sql
-- Get proposal + opp IDs for your test proposal
select p.id as proposal_id, p.opp_id, p.title
from rfp_proposals p
where p.title ilike '%test%'
  or p.created_at > now() - interval '7 days'
order by p.created_at desc
limit 10;
```

Record:
- `PROPOSAL_ID = <value from step 4>`
- `OPP_ID = <p.opp_id from above query>`

### Step 2 — Upload the fixture

1. In the proposal workspace, find the **Package Intake** panel
2. Make sure the **"This is the solicitation — extract evaluation rubric"** checkbox is ON (default)
3. Click the **upload** tab
4. Set title: `Phase 19 Test Fixture — Section L/M`
5. Select file: `/tmp/phase19-section-lm-fixture.docx`
6. Click **Extract package rules**
7. Wait for completion (up to ~60s — rubric extraction runs inline)

**Expected result:** Result state shows `"4 evaluation criteria extracted — view them in the proposal workspace"`

### Step 3 — Note the Package Doc ID

```sql
-- Find the package document just uploaded
select id as package_doc_id, title, created_at
from rfp_package_documents
where proposal_id = '<PROPOSAL_ID>'
order by created_at desc
limit 5;
```

Record: `PACKAGE_DOC_ID = <value>`

---

## VERIFY

### V1 — Rubric criteria extracted (REVIEW-01)

```sql
-- Confirm 4 criteria rows for the opportunity
select id, section_ref, criterion_text, max_points, weight, is_inferred
from rfp_rubric_criteria
where opp_id = '<OPP_ID>'
order by section_ref;
```

**Expected:** 4 rows with section_refs matching `Section M.1`, `Section M.2`, `Section M.3`, `Section M.4` (or similar variants).
Expected point values: 40, 25, 20, 15. Record each `id` for rollback.

Record:
- `CRITERIA_ID_1 = <id for M.1>`
- `CRITERIA_ID_2 = <id for M.2>`
- `CRITERIA_ID_3 = <id for M.3>`
- `CRITERIA_ID_4 = <id for M.4>`

### V2 — Criteria visible in workspace (REVIEW-01 visible)

1. Open (or refresh) the proposal workspace at `https://rfp.perpetualcore.com/org/<orgId>/proposals/<PROPOSAL_ID>`
2. Look for an **Evaluation Rubric** panel above the reviewer findings
3. Confirm: 4 criteria listed with section refs (Section M.1, M.2, M.3, M.4), point values, and amber "inferred — verify against source" badge where `is_inferred = true`

### V3 — Criterion-anchored reviewer findings (REVIEW-02/03)

1. Click the **Review** button in the proposal workspace
2. Wait for review to complete
3. Confirm: findings display criterion chips (e.g. `Section M.1`) next to severity badges
4. Confirm: each finding has a concrete suggested fix, not generic grammar feedback
5. Confirm: the model shown on the session/cost line is a `claude-*` model

```sql
-- Check reviewer findings contain criterion_id values
select id as finding_id, criterion_id, section_type, severity, suggested_fix
from rfp_reviewer_findings
where proposal_id = '<PROPOSAL_ID>'
order by created_at desc
limit 10;
```

Record: `FINDINGS_ROWS_CREATED_AFTER = <timestamp of upload>` (for rollback scoping)

### V4 — Compliance gate blockers (REVIEW-04)

1. Click **Capture Readiness** (or navigate to the compliance checklist) in the proposal workspace
2. Confirm the checklist shows:
   - `deadline-timezone` item: status **FAIL/missing** (fixture has `"December 15, 2026 5:00 PM"` with no timezone)
   - `page-limit` item: comparing current page count vs the 15-page limit from Section L.1
   - `budget-math` item: shows `[BUDGET]` marker count (fixture has 3)
   - `ai-disclosure` item: status **needs_review** (not yet acknowledged)

### V5 — AI disclosure acknowledge flip (REVIEW-05)

1. In the proposal workspace, find the **AI-Use Disclosure** banner
2. Confirm it mentions GSAR 552.239-7001 and/or NIH disclosure requirement
3. Click **Acknowledge**
4. Re-run **Capture Readiness**
5. Confirm the `ai-disclosure` checklist item flips to **met**

```sql
-- Confirm the ack persisted
select id, ai_disclosure_acknowledged, ai_disclosure_acknowledged_at
from rfp_proposals
where id = '<PROPOSAL_ID>';
```

**Expected:** `ai_disclosure_acknowledged = true`, `ai_disclosure_acknowledged_at` is set.

### V6 — Cached re-upload (no duplicate rows)

1. Re-upload `/tmp/phase19-section-lm-fixture.docx` via Package Intake with rubric mode ON (do NOT use Re-extract rubric — just normal upload)
2. Confirm: result shows the cached count (4 criteria), not a new LLM call

```sql
-- Confirm no duplicate rows were inserted
select count(*) as total_criteria_rows
from rfp_rubric_criteria
where opp_id = '<OPP_ID>';
```

**Expected:** still 4 rows (not 8).

---

## ROLLBACK

Run these statements after verification is complete to restore DB to pre-seed state.
Replace all `<placeholder>` values with the IDs captured during VERIFY above.

```sql
-- Step 1: Delete rubric criteria for this opportunity (scoped by exact IDs)
delete from rfp_rubric_criteria
where id in (
  '<CRITERIA_ID_1>',
  '<CRITERIA_ID_2>',
  '<CRITERIA_ID_3>',
  '<CRITERIA_ID_4>'
);

-- Step 2: Delete the test package document row
delete from rfp_package_documents
where id = '<PACKAGE_DOC_ID>';

-- Step 3: Delete reviewer findings created during this test
-- (scope by proposal_id + timestamp to avoid removing pre-existing findings)
delete from rfp_reviewer_findings
where proposal_id = '<PROPOSAL_ID>'
  and created_at > '<FINDINGS_ROWS_CREATED_AFTER>';

-- Step 4: Reset ai_disclosure_acknowledged on the test proposal
update rfp_proposals
set
  ai_disclosure_acknowledged = false,
  ai_disclosure_acknowledged_at = null
where id = '<PROPOSAL_ID>';
```

**Verify rollback:**

```sql
-- Confirm 0 criteria rows remain for the opp
select count(*) from rfp_rubric_criteria where opp_id = '<OPP_ID>';
-- Expected: 0

-- Confirm package doc is gone
select count(*) from rfp_package_documents where id = '<PACKAGE_DOC_ID>';
-- Expected: 0

-- Confirm ack is reset
select ai_disclosure_acknowledged from rfp_proposals where id = '<PROPOSAL_ID>';
-- Expected: false
```

---

*Phase: 19-rubric-review-compliance-gate-upload*
*Generated: 2026-06-10*
*Fixture: /tmp/phase19-section-lm-fixture.docx*
