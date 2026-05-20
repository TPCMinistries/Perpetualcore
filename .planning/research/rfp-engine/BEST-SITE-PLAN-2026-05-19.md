# RFP Engine — "Best-Site" Plan

Goal: make rfp.perpetualcore.com the best-in-class capture-operations product across **user experience**, **admin experience**, **marketing / sales**, **nurture**, and **upkeep**.

Status anchor: 2026-05-19, on branch `feat/rfp-orgs-invites-cont`, worktree `~/perpetual-core-rfp`. Live at https://rfp.perpetualcore.com.

---

## Honest snapshot (going in)

| Surface | State | Gap |
|---|---|---|
| Marketing (`/rfp`, `/how-it-works`, `/pricing`, `/trust`) | Live, honest stage badges | No SEO schema, no ROI calc, no comparison page, no public roadmap, no case study |
| Auth + product chrome | Host-aware brand wrapper live | No post-signup welcome |
| Multi-tenant orgs | Create / invite / switch / dual-mode | No "first 10 minutes" guided setup |
| Discovery | 8 real opps from NY State + NYC HRA | Federal blocked (SAM.gov ~05-23); DYCD/DOE empty; PASSPort pagination needs Playwright |
| Drafter + Voice + Vault + Reviewer | All wired end-to-end | `[CITE:]`/`[VERIFY:]` markers render raw, no inline reviewer annotation, no compliance gate, no PDF/DOCX upload |
| Pricing | Page exists ($299/$799/$2,499/Ent) | No Stripe checkout for RFP tiers |
| Nurture | Sequence cron exists (Janus reuse) | No RFP-specific sequences |
| Admin (operator view) | None | No metrics, no scraper health, no per-org cost, no quota meters |
| Upkeep | Drift detector + alerts | No admin triage UI, no `/api/health/rfp`, no changelog, PR #4 unmerged |

---

## Wave 1 — USER credibility wedge

1. **Citation pills** — parse `[CITE: vault-N]` → numbered popover pill showing chunk title/snippet/score.
2. **VERIFY-marker coverage** — confirm `VerifyMarkerHighlights` renders in read + editor preview mode.
3. **Inline reviewer-finding annotation** — anchor `cited_excerpt` text in sections with severity-colored underline + margin marker; click expands the finding card.
4. **First-run onboarding checklist** — sticky card on `/org/[orgId]/discovery` with 5 derived steps (org → voice → vault → draft → review). Persists `dismissed_at` to `rfp_orgs.onboarding_state` jsonb.
5. **Empty-state polish** — Discovery / Proposals / Vault / Voice each get a real empty state with one CTA.

Schema delta:
```sql
ALTER TABLE rfp_proposals ADD COLUMN IF NOT EXISTS vault_chunks_used jsonb DEFAULT '[]'::jsonb;
ALTER TABLE rfp_orgs ADD COLUMN IF NOT EXISTS onboarding_state jsonb DEFAULT '{}'::jsonb;
```

`vault_chunks_used` stores ordered `[{id, doc_id, doc_title, doc_type, chunk_index, text_preview, similarity_score}]` indexed by N — array index + 1 = the N in `[CITE: vault-N]`.

---

## Wave 2 — USER trust + completeness

1. **Compliance gate v1** — page-limit, budget math, deadline-TZ, required-doc checklist parsed from NOFO brief. Renders as "Submission checklist" panel.
2. **PDF/Docx vault upload** — add `pdf-parse` + `mammoth`; text-paste stays.
3. **Per-section assignment + status** — owner assigns sections to writers; status badges (draft / reviewing / final).
4. **Deadline tracker** — surface "X opps closing this week"; 7 / 3 / 1-day-out emails via existing alert dispatcher.

---

## Wave 3 — ADMIN operator view

Lives at `/admin/rfp` (gated to staff). Net new.

1. **Platform metrics** — orgs, drafts/week, reviewer runs, vault chunks, MRR by tier, AI token cost per org, gross margin per org.
2. **Scraper health** — last successful run, row deltas, drift events, manual "Rerun now".
3. **Per-org feature flags** — toggle private-beta features from `rfp_orgs.feature_flags`.
4. **Audit log viewer** — `rfp_agent_sessions` filtered by org/agent/date.
5. **Token-budget alarms** — auto-Telegram Lorenzo if org's monthly AI spend exceeds tier's COGS allowance.

---

## Wave 4 — MARKETING / SALES

1. **SEO** — Organization + Product structured data, sitemap entries, OG images, targeted meta titles.
2. **ROI calculator** on `/rfp` — gated lead magnet (email → PDF report).
3. **Comparison page** `/rfp/vs` — vs Grants.gov, Instrumentl, OpenGrants, Submittable.
4. **Public roadmap** `/rfp/roadmap` — Live / Beta / Next quarter.
5. **Self-serve Stripe checkout** — Pro $799 + Agency $2,499 (Enterprise stays sales-led). 14-day trial → webhook provisions org + magic link.
6. **Case study slot** — `/rfp/case-studies/uplift` published when Uplift dogfood produces first win.

---

## Wave 5 — NURTURE (reuses existing `process-sequences` + `send-sequence-emails` crons)

1. **Lead-capture sequence** (signup w/o checkout): Day 0 welcome + 3 opps → Day 3 voice training → Day 7 capture-session invite.
2. **Trial sequence**: Day 1 voice → Day 3 vault → Day 7 reviewer → Day 12 trial-ends.
3. **Activation re-engagement** — no draft within 7 days → "Need help picking your first opp?" + calendar.
4. **Win/loss survey** — fires on `won` / `lost` mark; 2-question feedback into product memory.
5. **Monthly digest** — per-org email: opps surfaced, drafts, win-rate, tokens.

---

## Wave 6 — UPKEEP

1. **`/api/health/rfp`** — JSON summary (scraper-last-success, drift-open, cron-last-run, error-rate-24h). Hook UptimeRobot.
2. **Changelog page** `/rfp/changelog` — auto-generated from `feat(rfp-*)` commits.
3. **Weekly auto-report** — Sunday cron emails Lorenzo (orgs, drafts, $ spent, errors).
4. **PR #4 merge** — coordinate with `feat/studio-repositioning` reconciliation.
5. **SAM.gov re-registration** — flip federal cron live when key lands (~05-23).
6. **PASSPort pagination** — fix Playwright binary mismatch.
7. **Vault scale prep** — `rfp_vault_match` SECURITY DEFINER RPC + hnsw index before any org > 50 docs.

---

## Execution order

```
Wave 1 (citation pills + onboarding)   ← in progress 2026-05-19
Wave 4.1-4.4 (SEO + ROI + vs + roadmap)
Wave 3 (admin view)
Wave 5 (nurture)
Wave 4.5 (Stripe self-serve)
Wave 2 (compliance + PDF + assignment)
Wave 6 (upkeep)  ← stand up health + changelog now, rest continuous
```

Branch stays `feat/rfp-orgs-invites-cont`. No merge to main until Waves 1+3+4 land — PR #4 is ~70 commits ahead and will collide with `feat/studio-repositioning`. One coordinated merge later. (Per [[feedback-merge-main-at-milestone-close]].)
