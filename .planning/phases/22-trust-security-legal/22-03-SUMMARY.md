---
phase: 22-trust-security-legal
plan: "03"
subsystem: trust-legal
tags: [legal, trust, public-pages, ai-disclosure, middleware]
dependency_graph:
  requires: []
  provides: [/terms, /privacy, /ai-disclosure public unauthenticated]
  affects: [middleware.ts public-path allowlist]
tech_stack:
  added: []
  patterns: [Next.js static page, amber draft banner pattern]
key_files:
  created:
    - app/ai-disclosure/page.tsx
  modified:
    - app/terms/page.tsx
    - app/privacy/page.tsx
    - middleware.ts
decisions:
  - "All three legal pages carry an inline amber draft banner — preferred over a shared component to keep changes surgical"
  - "/ai-disclosure added to isRfpAppPath allowlist in middleware.ts (not the second public-paths block) to match where /privacy and /terms already live"
  - "Live-domain production confirmation deferred to next vercel --prod deploy (project does not auto-deploy on push)"
metrics:
  duration: 14 min
  completed: 2026-06-07
  tasks_completed: 3
  files_changed: 4
---

# Phase 22 Plan 03: Legal Pages & AI Disclosure Summary

RFP-engine-specific Terms of Service, Privacy Policy, and AI-use disclosure pages written and made publicly accessible without authentication.

## What Was Built

### /terms (rewritten)
- Replaced generic AI OS copy (Slack/Zoom/WhatsApp/calendar integrations) with RFP engine context
- Sections: acceptance, service description (explicit no-auto-submit), user responsibilities, government/public data sources, AI-generated content (links to /ai-disclosure), intellectual property, limitation of liability, termination, contact
- Entity named as Perpetual Core LLC throughout
- 2026 last-updated date
- Amber draft banner

### /privacy (rewritten)
- Removed all references to Slack/Google Drive/Zoom/Twilio/WhatsApp
- Sections: account/org data, vault documents (user-uploaded PDF/DOCX), proposal content, usage data, how we use data, third-party sub-processors (Anthropic/OpenAI for AI, SAM.gov/Grants.gov/SBIR/NIH/NSF as data sources, Supabase/Stripe/Vercel as infra), data security (RLS tenant isolation), data retention, rights, contact
- 2026 last-updated date
- Link to /ai-disclosure
- Amber draft banner

### /ai-disclosure (new)
- How AI is used: fit scoring, draft generation, adversarial review, compliance checking, embeddings/RAG
- AI providers: Anthropic (Claude) + OpenAI — vault docs and opportunity context sent to these providers
- Human review requirement: no auto-submit, user is solely responsible for accuracy
- Federal & grant compliance context: GSA GSAR 552.239-7001 (federal contractor AI clause), NIH grant application AI disclosure guidance, other funders
- Controlling AI use / opt-out description
- Data retention for AI-processed content
- Amber draft banner, 2026 last-updated date

### middleware.ts
- Added `pathname === '/ai-disclosure'` to the `isRfpAppPath` function public-path list, adjacent to existing `/privacy` and `/terms` entries (line 90)
- No other middleware logic touched

## Verification Results

| Check | Result |
|-------|--------|
| `grep -ni "slack\|zoom\|whatsapp\|calendar\|Perpetual Core, Inc" app/terms app/privacy` | CLEAN — 0 matches |
| `grep -n "ai-disclosure" middleware.ts` | line 90: `pathname === '/ai-disclosure' ||` |
| `grep -n "552.239-7001" app/ai-disclosure/page.tsx` | lines 180 + 186: present verbatim |
| `npm run type-check` | PASSED (exit 0) |
| `npm run build` (background) | PASSED (exit 0) |
| Live-domain confirmation | PENDING — requires next `vercel --prod` deploy |

## Task 3 Checkpoint (human-verify)

Per plan `<checkpoint_handling>` instructions: checkpoint satisfied at the build level. All three routes compile (`npm run build` exit 0), middleware allows all three without auth (grep confirmed), no banned terms remain (grep confirmed). Live-domain confirmation at rfp.perpetualcore.com is pending the next production deploy via `vercel --prod`.

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

- [x] app/ai-disclosure/page.tsx exists
- [x] app/terms/page.tsx updated (Perpetual Core LLC, 2026, ai-disclosure link, no banned terms)
- [x] app/privacy/page.tsx updated (vault, Perpetual Core LLC, 2026, ai-disclosure link, no banned terms)
- [x] middleware.ts contains ai-disclosure allowlist entry
- [x] Build passed (exit 0)
- [x] Task commits: d7485a1 (Task 1), 1f318ff (Task 2)
