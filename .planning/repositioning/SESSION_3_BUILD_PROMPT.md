# Session 3 — Build agent prompt (queued, fires when Session 2 commits land)

**Spawn with:** `Agent(subagent_type: general-purpose, isolation: worktree)` on the **same `feat/studio-repositioning` branch** Sessions 1-2 used.

---

You are the Session 3 build agent for Perpetual Core's studio repositioning. Sessions 1 + 2 landed. Your scope is product detail pages + cleanup + correctness sweep.

## Branch + worktree setup

- Continue on `feat/studio-repositioning`. Sessions 1-2 = 13 commits already. You'll add 6-8 more.
- Confirm with `git log --oneline -20`.
- DO NOT touch main checkout (second-RFP active).

## Required reading

All in `~/ORGANIZED/01_PROJECTS/ACTIVE/perpetual-core/.planning/repositioning/`:

1. `BRAND_ARCHITECTURE.md` — §1 (product stack), §5.2 (Atlas card spec), §8 (Vellum pricing locked)
2. `COPY_PRODUCTS.md` — all 7 product cards (use card copy as the basis for the detail-page hero)
3. `BRIEF_RECONCILED.md` — A5 (pages to retire), A8 (correctness checks)
4. `INVENTORY.md` — links to live Sentinel surface; confirm sentinel.perpetualcore.com exists
5. `SESSION_1_REPORT.md` + `SESSION_2_REPORT.md` — anything deferred to Session 3
6. `AGENT_LOG.md` — side-fix agent's "noticed for build pass" list (17 stale "© 2024" footers, navbar consolidation, compliance claims)

## Scope — Session 3

Build, in this order, with atomic commits per major step:

### Step 1: /products/atlas — by-invitation card pattern
- New route `app/products/atlas/page.tsx`. Use `COPY_PRODUCTS.md` Card 2 as basis.
- Hero: "Atlas — AI-native COO for fund-backed portfolio companies." Subhead names PE Operating Partners. Scarcity framing: "In pilot with select funds — by introduction only."
- 3-paragraph explainer (you write — operator register, no jargon, references the Engine).
- Intake form: name, fund/portco name, email, "what you're trying to install" textarea. Wire to existing `/api/contact` or to a Calendly URL (use Calendly if endpoint config available; else email mailto:lorenzo@perpetualcore.com).
- NO pricing on this page.
- COMMIT: "feat(repositioning): add /products/atlas by-invitation page"

### Step 2: /products/sentinel — minimal landing + outbound link
- New route `app/products/sentinel/page.tsx`. Use `COPY_PRODUCTS.md` Card 1.
- Minimal: hero, 3-line value prop, prominent CTA "Run a vet at sentinel.perpetualcore.com" → `https://sentinel.perpetualcore.com`
- Note in code comment: Sentinel is awaiting dedicated Supabase migration per memory; this page links to current live surface.
- COMMIT: "feat(repositioning): add /products/sentinel landing"

### Step 3: /products/sage — minimal landing + outbound to sage.perpetualcore.com
- New route `app/products/sage/page.tsx`. Use `COPY_PRODUCTS.md` Card 3.
- Hero copy from `COPY_PRODUCTS.md`. CTA "Meet Sage" → `https://sage.perpetualcore.com` (note: subdomain reserved, may not resolve yet — that's OK, page is built ahead).
- 15% to IHA call-out per card.
- Optional: link to existing `docs/SAGE_LANDING_COPY.md` content if not already shipped at sage.perpetualcore.com — but DO NOT block on Sage SaaS launch. This studio-site page is just the entry point.
- COMMIT: "feat(repositioning): add /products/sage entry-point page"

### Step 4: /products/vellum — full detail page with pricing
- New route `app/products/vellum/page.tsx`. Use `COPY_PRODUCTS.md` Card 4.
- Always qualify "Vellum by Perpetual Core" in copy.
- 4 pricing tiers per BRAND_ARCHITECTURE §8:
  - Free: 1 user, 100 sources, basic synthesis
  - Operator $49/mo: 1 user, unlimited sources, voice + channels, 30-day retention
  - Team $249/mo: 5 users, all channels + integrations, 1-year retention
  - Institution: Contact us — 25+ users, SSO, custom retention, on-prem
- 30% mission-driven discount call-out for verified 501(c)(3)s on Operator + Team.
- 10% to IHA line in pricing footer.
- 4–6 paragraph value prop section before pricing — institutional memory framing, not consumer note-taking. Reference the eight registries (Vellum operates on the Knowledge registry per /engine §2).
- CTA primary: Start free → /signup?product=vellum. Secondary: Talk to us → /contact?product=vellum.
- COMMIT: "feat(repositioning): add /products/vellum detail page with pricing"

### Step 5: /products/rfp-engine — repoint existing
- The existing route `app/(rfp-marketing)/rfp/page.tsx` is the live RFP Engine.
- Add new route `app/products/rfp-engine/page.tsx` that either:
  - (a) Re-exports the existing `(rfp-marketing)/rfp` page component, OR
  - (b) Adds a 301 redirect from `/products/rfp-engine` → `/rfp` in `next.config.mjs`
- Choose (b) — preserves the live SEO surface. Use `COPY_PRODUCTS.md` Card 5 description in any meta.
- DO NOT touch the `(rfp-marketing)` directory contents (active second-RFP session).
- COMMIT: "feat(repositioning): redirect /products/rfp-engine → /rfp (preserves live SEO)"

### Step 6: /products/rfp-sentry — stub page with email capture
- New route `app/products/rfp-sentry/page.tsx`. Use `COPY_PRODUCTS.md` Card 6.
- Stub: hero, 2-paragraph explainer ("In build. Score RFPs for fit before you write. Compliance flags surface before submission, not after a debrief."), email capture form ("Join the early list").
- Form posts to `/api/early-access?product=rfp-sentry` or stores in Supabase `early_access` table — match existing newsletter/waitlist pattern in the codebase.
- COMMIT: "feat(repositioning): add /products/rfp-sentry stub with early-list capture"

### Step 7: /solutions/* top banners
- Add a top banner component to all `/solutions/*` pages linking to `/studio/engagements`.
- Banner copy: "Looking for an engagement? Perpetual Core engagements start at $75,000 → /studio/engagements"
- IMPORTANT: per side-fix agent's report, all 14 `/solutions/*` files have uncommitted modifications in main. They're NOT modified on `feat/studio-repositioning`. **Confirm via `git status` that these files are clean on this branch.** If modified here too, skip and flag.
- COMMIT: "feat(repositioning): add engagement banners to /solutions/* pages"

### Step 8: Bulk year-bump + cleanup
- Bulk replace "© 2024" → "© 2026" across all unmodified files. Side-fix agent identified 17 occurrences.
- Use a single `find` + `sed` operation on a per-file basis.
- ALSO: bulk replace any remaining "© 2025" → "© 2026" missed by side-fix agent.
- COMMIT: "chore(repositioning): bulk year bump to 2026 across stale footers"

### Step 9: Compliance claims sweep
- Side-fix agent flagged unverified compliance claims in `/solutions/*` pages: "HIPAA Compliant", "SOC 2 Type II Certified", "FERPA Compliant", "ABA Compliant", "SEC Compliant".
- Per BRIEF_RECONCILED A8 spirit: don't ship unverified compliance claims.
- Replace each with hedged language: "HIPAA-aware", "SOC 2 Type I in progress", "FERPA-conscious", etc. — OR remove entirely.
- This is a JUDGMENT call — flag in report what you changed and let Lorenzo + legal review before merge.
- COMMIT: "fix(repositioning): hedge unverified compliance claims pending legal review"

### Step 10: Mobile QA + link audit
- Run a quick mobile-breakpoint check: load each new page in Chrome devtools at 375px and 768px viewports. Note any obvious layout breaks in report.
- Run `pnpm dlx linkinator` or equivalent to find broken internal links. Fix any in /studio/*, /engine, /products/*. Report unfixable ones.
- COMMIT (if anything fixed): "fix(repositioning): mobile + link audit fixes"

## After all commits

1. `git log --oneline -25` — should show ~6-8 new commits on top of Sessions 1-2 (~19-21 total).
2. `pnpm typecheck` + `pnpm build` — both must pass. Fix with new commits.
3. `pnpm lint`.
4. No dev server (can't visually verify). No push. No merge.

## Hard rules

- Atomic commits, specific paths
- Never touch `(rfp-marketing)`, `lib/rfp/`, `components/rfp/`
- Use exact pricing strings everywhere
- "Vellum by Perpetual Core" — always qualified
- Compliance claims hedged unless verified

## Output

Write `SESSION_3_REPORT.md`:
- All commits + SHAs
- Typecheck/build/lint results
- Compliance claims diff (what was hedged or removed) — Lorenzo + legal review needed
- Mobile + link audit findings
- Final manual QA checklist for Lorenzo before merge
- Recommendation: ready to merge to main, or any remaining blockers

Return short summary: total commits across S1-S3, typecheck status, merge-readiness, top 3 things Lorenzo verifies in browser.
