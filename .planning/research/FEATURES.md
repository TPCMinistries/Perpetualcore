# Feature Research — RFP Engine v2.0

**Domain:** AI-native capture operations platform (gov RFP + foundation grant)
**Researched:** 2026-06-05
**Confidence:** HIGH (core patterns verified against Granted.ai, Instrumentl, CLEATUS, GovDash, Sweetspot; RAG and multi-agent patterns verified against current literature)

---

## Context: What Is Already Built (Do Not Re-Spec)

The following exist and should be treated as infrastructure this feature set builds on:

- Discovery scrapers (SAM.gov, Grants.gov, SBIR/STTR, NY, NYC, CA)
- Voice fingerprint capture
- Vault-grounded RAG drafting with `[VERIFY]` citations
- Opus reviewer agent (single pass)
- Per-section editing workspace
- Submission bundle ZIP export
- Submit-readiness gate (basic)
- Audit trail
- Multi-tenant org isolation

---

## Feature Category 1: Unified Gov RFP + Foundation Grant Discovery

### What "Best-in-Class" Looks Like

Every competitor treats contracts and grants as separate products. No one normalizes them into a single opportunity model. The wedge: a nonprofit pursuing DYCD contracts AND foundation grants is the same person — they should not context-switch products or reconcile two different pipeline views. Best-in-class means one canonical opportunity record regardless of source type, with all source-specific fields preserved but exposed through a consistent interface.

### Table Stakes

| Feature | Why Expected | Complexity | Dependencies |
|---------|--------------|------------|--------------|
| Single unified feed across all connected sources | Users expect one inbox, not tab-switching between "grants" and "contracts" | MEDIUM | Existing scrapers + canonical `rfp_opportunities` table |
| Deduplication across sources | Same opp appearing from SAM.gov API + state mirror + a scraper = one record | MEDIUM | Canonical model + stable hash key on (source_id, agency, deadline, title fingerprint) |
| Saved searches with email/Slack alert | Instrumentl does this; absence creates a "why would I log in" problem | LOW | Existing notification infra |
| Deadline + posted date filtering | Users need to filter by urgency; expired opps in the feed kills trust | LOW | Canonical model: `deadline_at`, `posted_at` |
| Status indicator per source (healthy / degraded / stale) | Users must know if silence means "no opps" or "scraper broke" | MEDIUM | Source health SLA already in RFP_SCALE_PLAN |
| Verified opportunity counts (not marketing copy) | Trust-critical; scale plan is explicit: no fake "80k+" claims | LOW | Operational count from `rfp_opportunities` WHERE active |

### Differentiators

| Feature | Value Proposition | Complexity | Dependencies |
|---------|-------------------|------------|--------------|
| Canonical opportunity model spanning contracts AND grants | No competitor owns this seam. One pursuit workspace for any opp type | HIGH | Schema migration: add `opportunity_type` enum (contract / grant / cooperative_agreement / sbir), `funding_instrument`, `eligibility_types`, `cfda_number` (grants only), `naics_codes` (contracts only), `set_aside` (contracts only), `foundation_ein` (foundation grants only); all nullable by type |
| Funder profiles (IRS 990 data, giving history, key contacts) | Powers fit scoring and outreach; Granted has it for foundations only | HIGH | 990 ingestion pipeline (separate from open opportunity count per scale plan) |
| Tiered source coverage gated by plan | Level 1 (Federal) on Starter; Level 2 (State + foundations) on Pro; Level 3 (Global) on Agency/Enterprise | MEDIUM | Entitlement check at query time on `rfp_opportunities.coverage_tier` |
| "Why did this surface?" source trail on every opp | Transparent about which scraper, which API call, when it was fetched | LOW | Already have audit trail; extend to opportunity ingestion events |
| Regional packs by org type | Pre-filtered views: "NYC Workforce Nonprofits", "Federal SBIR/AI companies" | LOW | Tag taxonomy on opps + org profile matching |

### Anti-Features

| Anti-Feature | Why Requested | Why Problematic | Instead |
|--------------|---------------|-----------------|---------|
| Inflated "live opportunities" count | Looks impressive in marketing | Destroys trust when users search and find 200 real results against a claimed 80,000 | Honest real-time count from verified indexed records; frame target coverage separately |
| Funder profiles counted as open opportunities | Makes numbers bigger | Misleads users into pursuing non-active funders; scale plan is explicit on this | Separate funder intelligence from open opportunity feed; clear visual distinction |
| Global (Level 3) on launch | Impressive scope | Coverage at that scale requires significant parser maintenance budget; launching with unreliable global coverage is worse than no coverage | Ship Level 1 reliably; gate Level 2 and 3 behind paid tiers and ship when sources are validated |
| Real-time feed (sub-minute refresh) | Sounds better than batch | Gov sources publish on irregular schedules; real-time polling wastes compute and hits rate limits | 6-hour batch cron is correct; show "last updated" timestamp honestly |

### Canonical Opportunity Model (Schema Contract for Requirements Authors)

The unified model must accommodate both contracts (NAICS, set-aside, PSC, contract type) and grants (CFDA, eligibility types, cost-sharing, project periods). Fields that are null by type should be nullable, not absent. Core shared fields:

```
opportunity_id          uuid PK
source                  text (sam_gov | grants_gov | sbir | ny_state | nyc_passport | candid | ...)
source_id               text (external ID from source)
opportunity_type        enum (contract | grant | cooperative_agreement | sbir | other)
title                   text
agency_name             text
agency_code             text (nullable)
description             text
posted_at               timestamptz
deadline_at             timestamptz
award_floor             numeric (nullable)
award_ceiling           numeric (nullable)
coverage_tier           int (1=federal, 2=national, 3=global)
naics_codes             text[] (contracts only)
set_aside               text (contracts only)
cfda_number             text (grants only)
eligibility_types       text[] (grants only)
foundation_ein          text (foundation grants only)
raw_json                jsonb (full source payload preserved)
dedup_hash              text UNIQUE (stable fingerprint for dedup)
active                  bool
```

### Behavior Testable Requirements (User Can X)

- User can open the Discovery feed and see all active opportunities from all connected sources in one chronological list, regardless of whether they are government contracts or foundation grants.
- User can filter the feed by: opportunity type, deadline range, award range, NAICS code, eligibility type, keyword, source.
- User can save a filter combination as a "Saved Search" and receive email or Slack notifications when new matching opportunities appear.
- User can see, per source in the feed, the last successful sync timestamp and a health indicator (green/yellow/red).
- User can see the real verified count of active indexed opportunities, not a static marketing number.
- Admin can see per-source ingestion volume, drift events, and last parse timestamp in `/admin/rfp`.

---

## Feature Category 2: Cited, Evidence-Based Fit Scoring

### What "Best-in-Class" Looks Like

Every competitor offers a fit score. None of them explains it. CLEATUS gives a ranked shortlist "with clear reasons" but does not cite the specific vault artifacts or prior wins that generated the score. Instrumentl's matching drifts irrelevant when org profiles are not updated. Granted.ai does peer benchmarking (quartile vs. sector peers) but not vault-grounded citation. The gap: a score that reads like a capture manager wrote it — citing the org's specific past wins, NAICS alignment, dollar threshold gaps, and named funder behavior — rather than a black box percentage.

### Table Stakes

| Feature | Why Expected | Complexity | Dependencies |
|---------|--------------|------------|--------------|
| Numeric fit score (0-100) per opportunity | Users need to triage quickly; a number lets them sort | LOW | Org profile + opportunity fields |
| Score breakdown by dimension | Users need to know which dimensions are strong vs. weak | MEDIUM | Score model with labeled sub-scores |
| Score recalculates when org profile changes | Stale scores cause users to distrust the system | MEDIUM | Re-score trigger on org profile update |
| Pursuit / No-Pursuit decision capture | Users need a structured way to log their go/no-go decision | LOW | `pursuits` table already exists |

### Differentiators

| Feature | Value Proposition | Complexity | Dependencies |
|---------|-------------------|------------|--------------|
| Vault-grounded score citations ("your 2023 DYCD Bridge win maps to this NAICS at 87% overlap") | No competitor does this. Turns a black-box number into a defensible capture argument. | HIGH | Vault RAG + embeddings on prior proposals + win/loss records |
| Peer funder behavior citations ("a peer org in your geo won this funder at $450K — you're at $380K, within range") | Instrumentl has 990 data; nobody surfaces it as a score citation | HIGH | 990 ingestion + geographic org clustering |
| Dollar threshold gap flag ("funder's median award is $2.1M; your largest prior award is $450K — significant risk") | Common cause of avoidable losses; no competitor surfaces this explicitly | MEDIUM | Funder 990 award history + org track record |
| Score confidence indicator ("based on 3 prior wins in this category vs. 0 prior wins in this category") | Honest about when the score is well-calibrated vs. speculative | LOW | Win/loss count per category in org profile |
| Score explanation as a narrative paragraph, not a table | Executives read sentences, not spreadsheets | LOW | LLM synthesis of sub-scores + citations into a short paragraph |

### Score Dimensions (Recommended Model)

Five scored dimensions (each 0–20, total 0–100):

1. **Mission / Programmatic Fit** — Does the opportunity's stated purpose match org's mission, program names, and population served? (vault match + keyword overlap)
2. **Eligibility Alignment** — Does org meet explicit eligibility requirements (org type, certifications, geo, set-aside status)?
3. **Track Record Alignment** — Does org have prior wins in the same NAICS, CFDA, or funder category? Dollar range proximity?
4. **Capacity Signal** — Does org's stated staff, budget, and prior award size suggest capacity to execute at the required level?
5. **Funder Relationship** — Has org applied to or won from this funder before? Do peer orgs win here?

Citations should appear per dimension, not just at the aggregate level.

### Anti-Features

| Anti-Feature | Why Requested | Why Problematic | Instead |
|--------------|---------------|-----------------|---------|
| Probability of win as a precise percentage ("67.3% win probability") | Sounds scientific | Impossible to calibrate without large org-specific historical datasets; early users will have 0–3 data points | Show confidence band ("Strong Match", "Moderate Match", "Weak Match") with a numeric score and explicit confidence level; refine to probability bands after 10+ outcomes |
| Auto-pursue high-score opportunities without human decision | Efficiency | Removes the human judgment that federal funders expect; creates compliance risk | Score surfaces priority; human clicks Pursue |
| Single aggregate score with no breakdown | Simplicity | Users can't act on it; they can't fix a "62" | Always show dimension breakdown; aggregate is secondary |

### Behavior Testable Requirements

- User can see a fit score for any opportunity with a breakdown showing scores across all 5 dimensions.
- For each dimension, user can see at least one citation linking the score to a specific vault artifact, prior win, or 990 data point.
- User can see whether a score has high or low confidence based on the number of calibrating data points.
- When a user updates their org profile (new program added, new win logged), fit scores for open opportunities in their pipeline refresh within 24 hours.
- Admin can see the scoring model version and last calibration date in the operator console.

---

## Feature Category 3: Adversarial Rubric Review

### What "Best-in-Class" Looks Like

Granted.ai's 6-expert panel (grant-type-specialized reviewers working independently, then deliberating, then producing a consensus weakness list with fix instructions) is the current gold standard for grant review. Nobody does this for government RFPs. The gap: government RFPs have explicit evaluation criteria in Section L (instructions) and Section M (evaluation factors and relative weights). A best-in-class reviewer extracts those criteria, weights them, scores the draft against each criterion, then simulates the panel disagreement that real review panels produce. The output should look like what comes back from a real debrief, not a generic "your executive summary needs work."

### Table Stakes

| Feature | Why Expected | Complexity | Dependencies |
|---------|--------------|------------|--------------|
| Existing Opus reviewer agent (single pass) | Already built | — | Already exists |
| Reviewer output grouped by section | Users need to know which section needs revision, not a flat list | LOW | Existing reviewer + section structure |
| Actionable fix suggestions per weakness | A weakness without a fix suggestion is just criticism | MEDIUM | Existing Opus reviewer |

### Differentiators

| Feature | Value Proposition | Complexity | Dependencies |
|---------|-------------------|------------|--------------|
| Automatic extraction of evaluation criteria from solicitation (Section L/M for RFPs; scoring rubric for grant RFPs) | Turns vague "review against the RFP" into precise per-criterion scoring | HIGH | PDF/DOCX parser + criteria extraction prompt; structured `review_criteria` table per pursuit |
| Multi-agent panel (3–5 reviewer personas, each specialized) | Granted's 6-expert model; simulates the diversity of a real review panel | HIGH | Multi-agent orchestration; each agent runs the same draft + criteria set with different role prompts |
| Per-criterion score with weight-adjusted impact | Shows which weaknesses cost the most points | MEDIUM | Criteria extraction + weight parsing from Section M |
| Panel deliberation synthesis (where reviewers agree vs. disagree) | Surfaces the highest-confidence weaknesses and flags where the draft is ambiguous | HIGH | Aggregation layer after individual reviewer passes |
| One-click revision targeting a specific weakness | User clicks "fix this" on a panel finding; draft section regenerates addressing that finding | MEDIUM | Link from review finding to per-section editor; existing section editor as target |
| Compliance shred distinct from rubric review | Two different things: compliance is binary (present/absent); rubric review is qualitative (score-based) | LOW | Architecture: keep compliance gate (Category 6) separate from this reviewer output |

### Reviewer Persona Model (Government RFP)

For a federal RFP draft, the panel should include:

- **Technical Evaluator** — Scores technical approach against requirements; looks for feasibility, specificity, innovation.
- **Past Performance Evaluator** — Scores prior work citations; checks dollar proximity, recency, relevance.
- **Price/Cost Evaluator** — Checks budget narrative reasonableness; flags unsupported cost assumptions.
- **Management/Staffing Evaluator** — Checks org chart, key personnel quals, transition plan.
- **Small Business / Compliance Evaluator** — Checks set-aside eligibility, required certifications, subcontracting plan.

For a grant RFP, the panel should include roles derived from funder scoring rubric (e.g., NIH gets Significance, Innovation, Approach, Investigators, Environment — the actual NIH review criteria).

### Anti-Features

| Anti-Feature | Why Requested | Why Problematic | Instead |
|--------------|---------------|-----------------|---------|
| Fully automated revision without human review of panel findings | Efficiency | Risk of AI-on-AI drift where the system optimizes for its own review criteria, not the actual funder's | Human must review panel findings before triggering revision; one-click revision is a proposal, not an auto-apply |
| Generic rubric applied to all grants | Simpler to build | A Workforce Innovation grant and an SBIR have completely different review criteria; generic rubric produces useless feedback | Extract criteria from each specific solicitation; fall back to domain rubric only when extraction fails |
| Review panel personas exposed as named "AI experts" in marketing | Anthropomorphizes the feature | Federal procurement officers are skeptical of AI; over-claiming leads to distrust | Market this as "rubric-aligned review" and "panel simulation"; do not claim the AI is a human expert |

### Behavior Testable Requirements

- When a user triggers adversarial review on a draft, the system first extracts evaluation criteria from the attached solicitation document before running reviewer agents.
- User can see criteria extracted with their stated weights (e.g., "Technical Approach — 40 points") before the review begins.
- Each reviewer persona produces an independent score per criterion with a written rationale.
- The synthesis layer produces a consensus weakness list ranked by score impact (highest-point-value weaknesses first).
- User can see which reviewers flagged a specific weakness, indicating panel agreement vs. a single dissenting voice.
- User can trigger per-section revision targeted at a specific panel finding; the revised section returns with the finding cited as context.
- Compliance checks (page limits, required attachments) are surfaced in a separate compliance gate panel, not mixed into the rubric review output.

---

## Feature Category 4: Closed-Loop Submission

### What "Best-in-Class" Looks Like

Every tool gets you to "draft ready." Nobody closes the loop post-submission. The gap has two components: (1) amendment tracking — solicitations change after release; missing an amendment makes the draft non-compliant; (2) submission status tracking — users need to know their submission was received, where it is in review, and when an award decision is expected. Best-in-class is a system that monitors the original solicitation for changes, diffs them against the current draft, and alerts on compliance-affecting changes — before the deadline, not after.

### Table Stakes

| Feature | Why Expected | Complexity | Dependencies |
|---------|--------------|------------|--------------|
| Exportable submission packet (DOCX/PDF + compliance matrix + attachments checklist) | Users submit packages, not individual draft sections | MEDIUM | Existing ZIP export; extend to structured DOCX/PDF |
| Submission log (date, version, submission method) | Audit requirement; users need to know what was submitted when | LOW | `submissions` table; already have audit trail |
| Manual status update on submission (submitted / under review / award / no award) | Users need to track their pipeline post-submission | LOW | `pursuits` status field extension |

### Differentiators

| Feature | Value Proposition | Complexity | Dependencies |
|---------|-------------------|------------|--------------|
| Amendment / addendum monitoring (re-poll source for changes to the original solicitation after the pursuit is opened) | Missing an amendment = non-compliant submission; no competitor automates this | HIGH | Source polling per active pursuit; compare current source document vs. ingested version at pursuit-open time |
| Semantic diff of amendment vs. current draft ("Section 4.2 requirements changed — this affects your Technical Approach") | Amendment awareness without semantic diff is just a noise alert | HIGH | Diff engine: embed both versions; compute section-level similarity deltas; flag sections with structural change above threshold |
| Compliance impact classification per amendment delta ("requirement added", "deadline changed", "evaluation criteria changed", "minor clarification") | Not all changes are equal; users need to know urgency | MEDIUM | Classification prompt on each detected delta |
| Submission acknowledgment tracking (for federal: SF33 Block 14, amendment acknowledgment fields) | Federal submissions require explicit amendment acknowledgment; missing it = disqualified | MEDIUM | Checklist in submission packet; pre-submission gate checks acknowledgment fields |
| Auto-alert when amendment deadline is < 48h away AND draft has unaddressed amendment impacts | Time-critical alert; captures the scenarios where teams miss changes | LOW | Alert scheduler + amendment impact log |

### Anti-Features

| Anti-Feature | Why Requested | Why Problematic | Instead |
|--------------|---------------|-----------------|---------|
| Automated submission on behalf of user | Maximum automation | Federal and most foundation submission portals (SAM.gov, Grants.gov, Submittable) do not expose submit APIs; this is legally and operationally a liability | Gate at submit-ready; provide packet + portal link + checklist; final act is always human |
| Live amendment polling every few minutes | "Never miss a change" | Rate limit violations + most agencies publish amendments on business-day schedules | Poll on 6-hour cycle for active pursuits inside 30 days of deadline; increase to hourly inside 7 days |
| Diff surfaced as raw text comparison | Engineers understand this | Capture managers need a plain-English summary of what changed and whether it matters | Semantic diff → classification → plain-English summary; raw diff is an optional expand |

### Behavior Testable Requirements

- When a user opens a pursuit workspace, the system records the current solicitation version (hash + fetch timestamp).
- For pursuits with deadlines within 30 days, the system re-fetches the source solicitation every 6 hours and diffs against the recorded version.
- When a change is detected, the system classifies the change type and notifies the assigned user with a plain-English summary and which draft sections are affected.
- User can view a side-by-side comparison of the original solicitation and the amended version with changes highlighted.
- User can mark each amendment impact as "addressed" or "acknowledged / no action needed" to clear the alert.
- User can generate a submission packet that includes: all draft sections as a merged DOCX/PDF, compliance matrix, attachments checklist, amendment acknowledgment log, and submission metadata.
- User can update pursuit status to Submitted, Under Review, Awarded, or No Award, and log the submission date and method.

---

## Feature Category 5: Win/Loss Learning Loop

### What "Best-in-Class" Looks Like

Industry research is unambiguous: teams that do debriefs but leave insights in a slide deck that nobody revisits do not improve win rates. The loop is only closed when outcome data (win/loss, evaluator feedback, award amounts) feeds back into future fit scoring and drafting quality. No competitor in this space has shipped an automatic learning loop. Responsive and AutoRFP.ai track win rates as analytics metrics, not as training signals. The gap: structured capture of debrief data, tagged by theme, that directly recalibrates the fit scoring model and populates drafting exemplars for future pursuits.

### Table Stakes

| Feature | Why Expected | Complexity | Dependencies |
|---------|--------------|------------|--------------|
| Win/loss outcome recording on every pursuit | Basic pipeline hygiene; users expect to log outcomes | LOW | `pursuits.outcome` field + `pursuits.award_amount` |
| Win rate dashboard (by funder type, by org, over time) | Users need to see if the product is working | LOW | Aggregate query on `pursuits` |
| Debrief notes capture (free text + structured feedback) | Evaluator feedback is the highest-signal learning input | LOW | `pursuits.debrief_notes` + structured tags |

### Differentiators

| Feature | Value Proposition | Complexity | Dependencies |
|---------|-------------------|------------|--------------|
| Outcome-driven fit score recalibration (wins in a NAICS category increase future scores in that category for this org; losses flag risk factors) | Closes the learning loop; score improves with use, not just with more data | HIGH | Score model versioning; per-org calibration weights stored in org profile; recalibration trigger on outcome record |
| Evaluator feedback theme extraction (AI reads debrief notes and tags recurring themes: "past performance too generic", "budget narrative unclear") | Turns free-text debrief feedback into structured patterns | MEDIUM | LLM classification on debrief notes; `debrief_themes` table |
| Theme-to-drafting instruction propagation ("3 losses cited 'past performance too generic' — add this as a reviewer instruction for future pursuits in this category") | Closes the loop from theme to drafting behavior | HIGH | `org_drafting_instructions` table; these instructions are injected into future drafting prompts for this org |
| Win exemplar vault (winning proposals auto-tagged as exemplars and surfaced preferentially in RAG retrieval for future drafts) | Best proposals become the drafting baseline; most tools treat all vault docs equally | MEDIUM | Tag `vault_documents` with `is_winning_proposal=true` + `award_amount`; boost in retrieval ranking |
| Outreach timing recommendation ("based on funder behavior, decisions on this program type average 87 days post-deadline — expect by [date]") | Reduces the anxiety of the post-submission silence | LOW | Funder 990 + historical award date data; simple median calculation |

### Anti-Features

| Anti-Feature | Why Requested | Why Problematic | Instead |
|--------------|---------------|-----------------|---------|
| Automatic model fine-tuning on user data | Sounds like adaptive AI | Requires significant labeled data volume per org to avoid overfitting; early user pools are too small | Use prompt-level calibration (inject outcome-derived instructions into system prompts) until sufficient data accumulates for proper calibration |
| Sharing win/loss data across tenants to improve global model | Network effect argument | Users' competitive intelligence and vault content are their moat; cross-tenant sharing is a trust-destroyer | Strict per-tenant isolation; aggregate only anonymized theme counts at the platform level for product analytics |
| Publishing win rate benchmarks by org type without opt-in | Transparency | Org win rates are competitive intelligence; publishing without consent creates legal and competitive exposure | Opt-in benchmark program; show "how you compare to similar orgs" only when user has explicitly opted in |

### Behavior Testable Requirements

- User can record an outcome (Win / Loss / No Bid / In Review / Awarded Partial) on any pursuit and attach the award amount and debrief notes.
- When a win outcome is recorded, the system tags all vault documents used in that pursuit as winning-proposal exemplars.
- When a loss outcome is recorded with debrief notes, the system extracts themes within 24 hours and surfaces them to the org admin.
- Admin can see a win rate dashboard broken down by funder type, opportunity type, and time period.
- After 5+ outcomes in a given NAICS/CFDA category, the fit scoring model reflects org-specific calibration in that category (surfaced to user as "score refined by your history").
- Future draft prompts for an org inject org-specific drafting instructions derived from recurring loss themes.

---

## Feature Category 6: Compliance Gate v1

### What "Best-in-Class" Looks Like

Compliance checking is binary — the proposal either passes each requirement or it doesn't. The best-in-class implementation extracts every compliance requirement from the solicitation document into a structured table, then checks each one automatically where possible (page count, file format, required sections present, budget math) and flags the rest for human confirmation. The output is a three-state compliance matrix: PASS / FAIL / NEEDS HUMAN CONFIRMATION. Nothing ships until the gate is cleared.

### Table Stakes

| Feature | Why Expected | Complexity | Dependencies |
|---------|--------------|------------|--------------|
| Deadline + timezone check (is the deadline past or within 24h?) | Basic; missing deadlines is the most common avoidable failure | LOW | `opportunities.deadline_at` with timezone; alert at T-7d, T-24h, T-2h |
| Required sections present check (does the draft have all required narrative sections?) | Proposals missing required sections are rejected as non-compliant | MEDIUM | Section structure from solicitation extraction + draft section manifest |
| Page limit check per section and total | Section and total page limits are explicit in most solicitations; violations = disqualification | MEDIUM | Word count / page count calculation on draft output; page limit parsed from solicitation |
| Required attachments checklist | Most solicitations require specific forms, certifications, letters — missing any = non-compliant | LOW | Attachment requirements extracted from solicitation; checklist with user-confirmation checkboxes |
| Budget math spot-check (does the total budget equal the sum of line items?) | Simple arithmetic errors are common and embarrassing | LOW | Budget template with formula validation; flag when totals don't reconcile |

### Differentiators

| Feature | Value Proposition | Complexity | Dependencies |
|---------|-------------------|------------|--------------|
| Eligibility verification (does this org meet the stated eligibility requirements for this opportunity?) | Prevents wasted work on opportunities the org cannot win | MEDIUM | Org profile eligibility fields (org type, certifications, DUNS/UEI, geo) checked against extracted eligibility requirements |
| Solicitation requirement extraction into a structured compliance matrix (every SHALL / MUST / REQUIRED captured, categorized, and status-tracked) | No manual compliance matrix required; system generates and maintains it | HIGH | PDF/DOCX parser + compliance extraction prompt; `compliance_requirements` table per pursuit |
| Amendment-aware compliance re-check (when an amendment adds or changes a requirement, the compliance gate re-runs on affected items) | Ties directly to Category 4; requirements that change post-amendment are re-evaluated | MEDIUM | Amendment diff (Category 4) triggers re-evaluation of specific compliance requirements |
| AI-use disclosure generation (produces the standardized AI disclosure statement that federal funders and some foundations now require) | NIH, some DOD agencies, and growing list of foundations now ask; auto-generating removes friction and ensures consistency | LOW | Template + audit log excerpt; configurable per funder requirement |

### Anti-Features

| Anti-Feature | Why Requested | Why Problematic | Instead |
|--------------|---------------|-----------------|---------|
| Compliance gate as a blocker (user literally cannot export until all items pass) | Strict compliance enforcement | Some items require human judgment or are intentionally deferred; blocking export creates frustration for expert users | Gate shows PASS/FAIL/NEEDS CONFIRMATION; export is allowed with a "I acknowledge X items need human confirmation" override; audit trail records override |
| Auto-generating required forms (SF330, SF424, etc.) | Maximum automation | These forms contain legal certifications; generating them without explicit human input creates liability | Pre-fill known fields from org profile; surface the form for human completion; never auto-certify |
| Compliance check as a one-time pre-submission step | Simpler | By the time users check compliance at submission, they may have to redo significant work | Compliance gate runs incrementally as sections are drafted; amber/green status per section in the workspace sidebar |

### Behavior Testable Requirements

- When a user opens a pursuit and attaches a solicitation document, the system extracts all compliance requirements into a structured table within 5 minutes.
- Each extracted requirement has a status: PASS (auto-verified), FAIL (auto-detected violation), or CONFIRM (needs human action).
- User can see page count remaining per section and total, updated in real time as they edit.
- The deadline countdown is displayed prominently in the pursuit workspace, with alerts at T-7d, T-24h, and T-2h.
- Budget module validates that line item totals equal stated totals; flags discrepancies immediately.
- User can override a FAIL or CONFIRM item with a written acknowledgment; the override is logged in the audit trail.
- Submission packet cannot be marked "submit-ready" unless all FAIL items are either resolved or overridden.
- System generates a standard AI-use disclosure statement based on the pursuit's audit log, configurable per funder type.

---

## Feature Category 7: Market-Ready UX

### What "Best-in-Class" Looks Like

Time-to-value under 14 days is the retention cliff — users who don't hit first value within 14 days retain at 35–50% vs. 80%+ for those who do. For this product, "first value" is a specific, reachable goal: the user's org profile is set up AND they have their first qualified opportunity with a fit score AND they know what to do next. The onboarding must deliver that in one session, not across a week of drip emails. Everything else in this category follows from that constraint.

### Table Stakes

| Feature | Why Expected | Complexity | Dependencies |
|---------|--------------|------------|--------------|
| Guided onboarding (org profile setup → vault document upload → first discovery run → first fit-scored opportunity) | Without this, users wander; most churn before first value | MEDIUM | Org profile form + existing vault upload + discovery feed + fit scoring (Category 2) |
| Deadline calendar view (all active pursuits with deadlines, color-coded by urgency) | Capture managers live by deadlines; a calendar view is expected | LOW | `pursuits` + `opportunities.deadline_at`; simple calendar component |
| Win rate analytics dashboard (your win rate, by funder type, vs. goal) | Users need to see the product working; this is the primary retention signal | LOW | Aggregate on `pursuits.outcome` (Category 5) |
| Transparent pricing page (all tiers, features per tier, visible monthly and annual) | 87% of B2B buyers want to self-serve part of the buying journey; hiding pricing = friction | LOW | Static pricing page |
| Self-serve trial → paid upgrade (Stripe checkout, no sales call required for Starter + Pro) | Users expect this in 2026; forcing a sales call for a $299 plan kills self-serve conversion | LOW | Existing Stripe integration; trial-to-paid upgrade flow |
| Mobile-responsive core views (discovery feed, pursuit list, deadline calendar) | Half of exec directors and EDs check email and apps on mobile | MEDIUM | Tailwind responsive; not a native app |

### Differentiators

| Feature | Value Proposition | Complexity | Dependencies |
|---------|-------------------|------------|--------------|
| "60 seconds to first opportunity" onboarding flow (org type → mission statement → geo → first discovery run; no doc upload required for first pass) | Best SaaS products deliver first value in 2–5 minutes; doc upload can be deferred | MEDIUM | Lightweight org profile (5 fields) → run discovery with those fields → show fit-scored results; full profile build is step 2 |
| Risk-reversal guarantee in pricing (first-win guarantee: if you submit a qualifying proposal built with the engine and don't win, we credit your next month) | Increases conversion by 12–18%; differentiates from faceless SaaS | LOW | Policy + Stripe credit flow; qualifying criteria must be explicit |
| Org benchmark widget (how your win rate compares to similar orgs; opt-in only) | Social proof + competitive pressure; Granted.ai has quartile stats but only for funders, not org outcomes | MEDIUM | Opt-in aggregate; requires sufficient user base (20+ orgs in category) to be meaningful; gated behind sufficient data |
| Weekly opportunity digest email (your top 5 fit-scored matches from the past 7 days, sent Monday morning) | Keeps the product top-of-mind without requiring log-in; drives re-engagement | LOW | Cron + email template + fit scoring |
| AI-use disclosure generator in submission packet | Reduces anxiety about compliance with emerging AI disclosure norms | LOW | Already noted in Category 6; surfaces in the UX as a distinct submission packet element |
| Capture consultant / agency white-label exports (export proposals with client org branding, not platform branding) | Agency tier users need this; it is a tier gate, not a broad feature | LOW | Export template with configurable org logo/name field; gated to Agency tier |

### Anti-Features

| Anti-Feature | Why Requested | Why Problematic | Instead |
|--------------|---------------|-----------------|---------|
| Gamification (badges, points, streaks for submitting proposals) | Engagement tactics | Infantilizes the users (executive directors, capture managers, professional grant writers); the actual reward is winning money | Win announcements with real dollar amounts are the only gamification needed; social sharing of wins (opt-in) |
| Forced annual commitment at first pricing touch | Maximizes ACV | Increases friction for first purchase; kills self-serve for Starter tier | Monthly default; annual offered at checkout as a discount option (not required) |
| "AI wrote this for you" framing | Efficiency claim | Federal and foundation funders are increasingly sensitive to fully AI-generated submissions; framing this way creates liability for users | "Your capture team" framing; position AI as the drafter, human as the director and editor; every section shows vault citations |
| Splash page without immediate product demo | Brand building | Users in this domain are skeptical; they need to see real opportunities for their org before they trust the product | Live demo mode (unauthenticated user enters org type + geo + mission and sees real scored opportunities within 60 seconds) |

### Onboarding Flow (Testable Sequence)

The first-run experience must complete in one session and produce a qualified opportunity with a fit score.

Step 1 (2 min): Org type selector (nonprofit / for-profit / agency) → mission statement (free text, 3 sentences max) → geography (city + state + national/international) → primary funding types (gov contracts / gov grants / foundation grants / all).

Step 2 (auto, 30 sec): Discovery runs with the 5-field profile. User sees the feed populating in real time with a progress indicator.

Step 3 (1 min): Top 3 scored opportunities are surfaced with scores and one-line score rationale each. User is prompted to click into one.

Step 4 (optional, async): "Upload your past proposals to sharpen your scores" — deferred, not required for first value. Async prompt via email.

### Behavior Testable Requirements

- A new user who signs up and completes the 5-field org profile can see fit-scored opportunities within 2 minutes of account creation.
- The deadline calendar shows all open pursuits with deadlines, color-coded: green (>30 days), amber (8–30 days), red (≤7 days).
- The pricing page shows all tiers, prices (monthly and annual), and feature differences without any "contact us for pricing" on Starter or Pro tiers.
- A user on the Starter or Pro trial can upgrade to a paid plan via Stripe checkout without contacting sales.
- The win rate dashboard shows the user's win rate, number of submissions, and number of wins, filterable by date range.
- The weekly digest email surfaces the top 5 fit-scored opportunities from the past 7 days and is delivered Monday at 8am in the user's local timezone.
- Agency-tier users can export a proposal packet with their client org's name and logo, not the platform's branding.

---

## Feature Dependencies

```
Canonical Opportunity Model (Cat 1)
    └──required by──> Fit Scoring (Cat 2)
    └──required by──> Adversarial Review [opportunity context] (Cat 3)
    └──required by──> Amendment Monitoring (Cat 4)
    └──required by──> Compliance Gate [eligibility check] (Cat 6)

Funder Profiles / 990 Ingestion (Cat 1 differentiator)
    └──enhances──> Fit Scoring peer citations (Cat 2)
    └──enhances──> Win/Loss outreach timing (Cat 5)

Solicitation Document Extraction (Cat 3 + 6)
    └──required by──> Criteria Extraction for Review Panel (Cat 3)
    └──required by──> Compliance Requirement Extraction (Cat 6)
    └──required by──> Amendment Diff [baseline version] (Cat 4)

Win/Loss Outcome Recording (Cat 5)
    └──enhances──> Fit Score Recalibration (Cat 2)
    └──enhances──> Drafting Instruction Propagation (Cat 2 + draft agent)
    └──required for──> Win Rate Analytics (Cat 7)

Org Profile (all categories)
    └──required by──> Fit Scoring (Cat 2)
    └──required by──> Eligibility Check (Cat 6)
    └──required by──> Onboarding Flow (Cat 7)
    └──enhances──> Discovery filtering (Cat 1)

Compliance Gate (Cat 6)
    └──required by──> Submission Packet [gate must pass] (Cat 4)

Amendment Monitoring (Cat 4)
    └──triggers──> Compliance Re-check (Cat 6)
```

### Critical Ordering Notes

- **Canonical opportunity model must be schema-locked before** fit scoring, compliance gate, and amendment monitoring are built. Schema changes to `rfp_opportunities` after these features are built will cascade.
- **Solicitation document extraction** is a shared dependency for both adversarial review (criteria) and compliance gate (requirements). Build this once as a shared service, not twice.
- **Win/loss recording** is table stakes, but recalibration is a differentiator that requires sufficient outcome data. Build the recording first; recalibration logic can ship in a follow-on.
- **Funder profiles (990 ingestion)** should not block MVP; fit scoring works without it (lower citation quality). Add as a P2 enrichment layer.

---

## Prioritization Matrix

| Feature | User Value | Build Cost | Priority |
|---------|------------|------------|----------|
| Canonical opportunity model | HIGH | MEDIUM | P1 |
| Source health SLA + honest counts | HIGH | LOW | P1 |
| Saved searches + alerts | HIGH | LOW | P1 |
| Fit score with dimension breakdown | HIGH | MEDIUM | P1 |
| Vault-grounded score citations | HIGH | HIGH | P1 |
| Solicitation criteria extraction | HIGH | HIGH | P1 |
| Adversarial multi-agent review panel | HIGH | HIGH | P1 |
| Compliance matrix extraction | HIGH | HIGH | P1 |
| Page limit / section check | HIGH | MEDIUM | P1 |
| Deadline calendar + alerts | HIGH | LOW | P1 |
| Guided onboarding (5-field → first opp) | HIGH | MEDIUM | P1 |
| Transparent pricing page | HIGH | LOW | P1 |
| Self-serve Stripe trial → paid | HIGH | LOW | P1 |
| Win/loss outcome recording | HIGH | LOW | P1 |
| Submission packet (DOCX/PDF) | HIGH | MEDIUM | P1 |
| Amendment monitoring + diff | HIGH | HIGH | P2 |
| Funder profiles (990 ingestion) | HIGH | HIGH | P2 |
| Peer fit score citations (990-grounded) | HIGH | HIGH | P2 |
| Win rate dashboard | MEDIUM | LOW | P2 |
| Weekly digest email | MEDIUM | LOW | P2 |
| Score recalibration from outcomes | HIGH | HIGH | P2 |
| Debrief theme extraction | MEDIUM | MEDIUM | P2 |
| Risk-reversal guarantee UX | MEDIUM | LOW | P2 |
| Compliance re-check on amendment | MEDIUM | MEDIUM | P2 |
| White-label export (Agency) | MEDIUM | LOW | P2 |
| AI-use disclosure generator | LOW | LOW | P2 |
| Live demo mode (unauthenticated) | MEDIUM | MEDIUM | P3 |
| Org benchmark widget | LOW | HIGH | P3 |
| Global Level 3 coverage | MEDIUM | HIGH | P3 |
| Drafting instruction propagation from loss themes | HIGH | HIGH | P3 |

**Priority key:**
- P1: Must ship in v2.0 to call it market-ready and best-in-class
- P2: Ships in v2.0 where capacity allows; strong differentiators but not blocking launch
- P3: Future milestone (v2.1+); require prerequisite data volume or significant build

---

## Competitor Feature Gap Summary

| Feature | Instrumentl | Granted.ai | CLEATUS | GovDash | Perpetual Core v2.0 |
|---------|-------------|------------|---------|---------|---------------------|
| Unified gov + grant feed | No (grants only) | No (grants only) | No (gov only) | No (gov only) | YES — our wedge |
| Vault-grounded citations in fit score | No | No | No | No | YES |
| Adversarial panel review | No | YES (grants) | No | No | YES (gov + grants) |
| Criteria extraction (L/M) | No | No | Partial | YES | YES |
| Amendment monitoring + diff | No | No | Partial | YES | YES |
| Win/loss learning loop | No | Partial (improve over time) | No | No | YES |
| Transparent pricing | YES | YES | No (contact us) | No (contact us) | YES |
| Risk-reversal guarantee | No | No | No | No | YES |
| Closed-loop submission tracking | Basic | Basic pipeline | NO | YES | YES |
| Compliance matrix auto-extraction | No | No | Partial | YES | YES |

---

## Sources

- Granted.ai features page (https://grantedai.com/features) — adversarial review, compliance verification, pipeline tracking
- Instrumentl review analysis (https://grantsights.com/blog/instrumentl-review-2026) — fit score behavior, profile drift risk
- CLEATUS.ai context-aware AI article (https://www.govconwire.com/articles/context-aware-ai-yigit-guney-cleatus-legacy-govcon) — fit scoring model approach
- GovDash vs. other GovCon software (https://www.govdash.com/govdash-versus-other-govcon-software) — compliance matrix, amendment handling
- Hinz Consulting on RFP amendments (https://hinzconsulting.com/rfp-amendments/) — amendment tracking practitioner requirements
- Red Team Consulting on loss debriefs (https://redteamconsulting.com/2025/07/07/what-happens-after-the-loss-debrief-most-teams-do-nothing/) — win/loss loop best practices
- AutoRFP win-loss analysis guide (https://autorfp.ai/blog/win-loss-analysis) — outcome tracking patterns
- SaaS onboarding time-to-value research (https://www.saasmag.com/time-to-value-saas-onboarding-retention-2026/) — 14-day retention cliff
- B2B SaaS transparent pricing guide (https://www.saashero.net/strategy/transparent-b2b-saas-pricing-gtm/) — risk reversal conversion impact
- Citation-aware RAG (https://www.tensorlake.ai/blog/rag-citations) — vault citation grounding techniques
- GEP AI agents for RFP evaluation (https://www.gep.com/blog/technology/ai-agents-rfp-rfq-response-evaluation) — multi-agent reviewer patterns
- Federal compliance AI evaluation (https://federalnewsnetwork.com/commentary/2026/04/federal-agencies-are-using-ai-to-evaluate-proposals-is-your-team-ready/) — compliance gate requirements
- SAM.gov API documentation (https://open.gsa.gov/api/get-opportunities-public-api/) — contract opportunity schema fields
- RFP_SCALE_PLAN.md and GTM-PLAN.md (project files) — existing architecture constraints and competitive positioning

---

*Feature research for: AI-native capture operations platform (Perpetual Core RFP Engine v2.0)*
*Researched: 2026-06-05*
*Confidence: HIGH on core patterns; MEDIUM on competitor internals (based on public docs and reviews)*
