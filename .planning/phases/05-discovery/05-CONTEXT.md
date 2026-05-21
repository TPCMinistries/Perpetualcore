# Phase 5: Discovery — Context

**Gathered:** 2026-05-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Always-on opportunity scanner. Six sources (SAM.gov, Grants.gov, Simpler.Grants.gov, SBIR.gov, NY State Grants Gateway, NYC DYCD/HRA/DOE) ingest every six hours via Vercel Cron. Each opportunity is scored against the active org's capture profile and surfaced in a ranked feed UI. Users can switch orgs (ORG-03), view a combined nonprofit + for-profit feed in dual mode (ORG-04), paste arbitrary URLs to import (Quick Import / DISC-07), and receive alerts on high-fit opportunities.

**In scope:** ingestion cron, fit scoring, feed UI, org switcher, dual-mode feed, Quick Import, alert delivery.

**Out of scope:** drafting from a feed item (Phase 7), capture profile UI / vault uploads (Phase 6), agent activity log UI (Phase 10), automated outreach.

</domain>

<decisions>
## Implementation Decisions

### Feed layout

- **Primary view: split (list + detail pane).** Left pane scrollable opportunity list; right pane shows the selected opportunity in full (description, criteria, fit reasoning, source link, deadline, amount, agency).
- **List row density (Claude's discretion → locked to "score + 2 lines"):** each row shows fit score chip + title (1 line, truncated) + agency · amount · deadline (1 line). Maximizes scannability in the narrow left column.
- **Default sort + filters (Claude's discretion):** sort by fit score descending. Filter pills above the list: Source, Deadline window (7d / 30d / all), Min amount. Dual-mode toggle pill appears only for users whose active org is in `dual` mode.
- **Loading (Claude's discretion):** infinite scroll, 25 rows per chunk. Scroll position persists across detail-pane navigation (use a stable list virtualizer or scrollIntoView restoration).
- **Detail pane: full fit reasoning visible, not collapsed.** This is the trust-builder for the ranking — score numbers without explanation feel arbitrary.

### Fit score presentation

- **Numeric format:** `"94 · Strong fit"` — number plus tier label together. Number gives precision for power users; tier gives readable context for newcomers.
- **Tier thresholds:** `≥90 Strong fit`, `70–89 Good fit`, `50–69 Marginal`, `<50 Weak`. (Threshold cutoffs are Claude's discretion if research shows different distribution.)
- **Visual weight:** threshold-based color on the score chip — `≥90` emerald-300, `70–89` zinc-300, `<70` zinc-500. Same palette as the rest of the dark UI (no new color tokens).
- **Reasoning rendering:** **both** structured chips AND a 1–2 sentence AI summary. Chips first ("NAICS match · Capacity OK · 3 prior wins · Workable deadline"), summary below ("Strong fit because your past DYCD work in workforce dev maps to this RFP's capacity requirements; deadline is 4+ weeks out."). Chips are the durable, model-agnostic explanation; the summary is the narrative gloss.
- **Recompute trigger:** **async on capture-profile change**. When voice fingerprint, NAICS, or capacity facts mutate, all open `rfp_opportunities` rescore in the background (worker / queue). Stale scores never linger. Trade-off: slightly more compute cost per profile edit; offset by debouncing.

### Quick Import (paste-URL flow)

- **Placement:** persistent input bar in the feed header — `"Paste opportunity URL…"`. Always visible above the feed. Lowest friction.
- **In-flight UX:** inline 4-step live progress, mono type, emerald checks: `○ Fetching page → ○ Parsing → ○ Scoring fit → ● Done`. The visual makes the engine feel like it's working — matches the home page Live Capture Feed pattern.
- **Failure handling:** **save raw + flag.** If the scrape can't fully normalize, persist whatever we got with a `Needs review` flag visible in the feed (and a small badge in the row). User completes missing fields from the detail pane. Never throw away user intent.
- **PDF / DOCX URLs:** treated identically — fetch + parse through the same pipeline (Tavily/AI fallback handles binary content). PDFs do NOT route to vault — that's a separate user action via the vault upload UI in Phase 6.

### Alert delivery

- **Channels at MVP:** email + Telegram + Discord. Slack deferred to a follow-up phase. (Note: ROADMAP DISC-06 mentions Slack/Telegram/email; we're substituting Discord for Slack at Lorenzo's direction — Discord is increasingly where workforce nonprofits and SBIR-chasing teams collaborate.)
- **Preference scope:** per-org default with per-user override. Org owner sets default channels and threshold; each member can opt out, change channels, or tighten threshold for themselves. New schema: `rfp_alert_prefs` with `(org_id, user_id NULL | user_id NOT NULL)` rows; user-row trumps org-row at lookup.
- **Threshold (Claude's discretion):** default fires at fit ≥ 80. User-tunable 60–100 in settings. Frequency cap: max 5 alerts/day per channel; if more, the engine batches into a single digest.
- **Alert content (Claude's discretion):** compact format — `94 · Strong fit · DOL ETA Workforce Innovation ($2.4M · deadline Jun 14) · open →`. Email gets the full reasoning chips and AI summary inline below; Telegram and Discord get the compact line plus a "view in Discovery" link. User can opt into "daily digest" mode in prefs to convert all alerts into a once-per-day batch regardless of threshold.

### Claude's Discretion

The following are explicit "you decide" calls — research and planner have flexibility:

- Exact list-row density (locked to score + 2 lines, but typography spec is open).
- Default sort + visible filter pills (fit-desc + Source/Deadline/Min-amount, but UX of how filter pills render is open).
- Infinite scroll vs. virtualized full list (Claude picked infinite scroll; planner can revisit if perf research surfaces a problem).
- Tier threshold cutoffs (90/70/50 default; research may suggest different cuts based on score distribution).
- Score recompute scheduling (async on profile change is decided, but worker pattern — queue, edge function, RPC — is research's call).
- Threshold default (80) and frequency cap (5/day) are reasonable defaults; can be tuned post-launch from telemetry.

</decisions>

<specifics>
## Specific Ideas

- **Split layout reference:** like email or Notion — scrollable list with persistent detail pane. Selection should not lose scroll position.
- **Fit chip + tier label together:** `"94 · Strong fit"` reads more like a credit-bureau score than a school grade. Builds trust in a category where buyers are skeptical of AI rankings.
- **Live progress on Quick Import:** the 4-step inline progress should rhyme visually with the home page's "Live Capture Feed" tile — same mono uppercase, same emerald accent, same hairline rows. The product should feel coherent across marketing + app.
- **Discord substitution:** Lorenzo specified Discord over Slack at MVP — workforce nonprofits and SBIR teams increasingly run capture out of Discord servers, and Lorenzo has existing patterns wired up there.

</specifics>

<deferred>
## Deferred Ideas

These came up during discussion but belong elsewhere:

- **Bulk paste / CSV import** — agency-tier feature. Defer to Phase 10 (Multi-Tenant Productization) or a follow-up Phase 5.5.
- **Slack channel** — defer to a follow-up integration phase once email/Telegram/Discord are stable.
- **Quiet hours / DND windows** — likely Phase 10 (productization). Default 24/7 alerts at MVP.
- **In-app notification center** — Phase 10. Email/Telegram/Discord cover MVP; in-app inbox is a productization concern.
- **Snooze / dismiss on individual opportunities** — likely Phase 10 once the feed has a "saved" / "dismissed" state model.
- **User-tunable scoring weights** — Phase 7 or 10. MVP uses fixed weights from capture profile.
- **Score history / deltas** — "this opp went from 72 → 89 after you uploaded the new annual report" — nice but not MVP. Phase 10.

</deferred>

---

*Phase: 05-discovery*
*Context gathered: 2026-05-10*
