# Day-1 Critical-Path Actions

External dependencies with wait-time. **These do not require any code to be written.** They run in parallel to the build and gate Phase 1 (Discovery) the moment they land.

> **Smoke test result (2026-05-09):** Existing `ldc-command-center` SAM.gov key returned `HTTP 401 API_KEY_INVALID`. The key has lapsed. **The 10-day registration wait is back on the critical path.** Re-register today.

## Critical path (start TODAY)

### 1. SAM.gov API key — re-register, ~10 business day wait

**Status:** Old key (40 chars, in `~/ORGANIZED/01_PROJECTS/ARCHIVED/ldc-command-center/.env.local`) is invalidated as of 2026-05-09. SAM.gov keys lapse after extended non-use.

**Why it matters:** SAM.gov is the federal contracting source. No key = no `api.sam.gov/prod/opportunities/v2/search`. Discovery agent (Phase 1) cannot ship the federal contract leg without it.

**Action:**
1. Go to https://sam.gov/ → sign in (or create account if not registered for The Perpetual Core LLC).
2. Navigate to *Account Details → API Keys*.
3. Request a new Public API key (free tier = 1,000 requests/day).
4. Confirm you receive the request-acknowledgment email.

**Note:** If you previously registered SAM.gov under TPC Ministries / a different entity, decide whether the new Engine should run under The Perpetual Core LLC's SAM identity or inherit the old one. Federal contracts care about the entity name on file.

**Done when:** Email confirms key issued (typically 5-10 business days). Drop the key into a secure note; we'll add it to Vercel env vars during Phase 0.

**Owner:** Lorenzo · **Time to start:** 5-10 minutes · **Wait:** ~10 business days

**What we can build in parallel without it:** Phase 0 schema migration, workspace + auth port from `ldc-command-center`, Grants.gov + SBIR.gov + Simpler Grants integration (none of those need SAM.gov), and the universal AI URL importer port. So the build doesn't idle.

---

### 2. Simpler.Grants.gov API key — 5 minutes

**Why it matters:** Simpler Grants is the modern API for Grants.gov data. Cleaner schema, better rate limits than the legacy Grants.gov API. Phase 1 needs both.

**Action:**
1. Go to https://simpler.grants.gov/developer
2. Sign up for an API key.
3. Receive `X-API-Key` header value immediately.

**Done when:** Key in your secure notes. 60/min, 10,000/day rate limit.

**Owner:** Lorenzo · **Time to start:** 5 minutes · **Wait:** instant

---

### 3. Grants.gov (legacy) — no auth required, but verify

**Why it matters:** Backup data source while Simpler Grants firms up. No key needed.

**Action:** Smoke test `https://api.grants.gov/v1/api/search2` with a minimal POST body. If it responds, we're good.

**Owner:** Claude Code can verify in Phase 0 · **Wait:** none

---

### 4. SBIR.gov solicitations endpoint — verify

**Why it matters:** Perpetual Core's lane. Free, no auth.

**Action:** Smoke test `https://www.sbir.gov/api/solicitations.json` from Phase 0.

**Owner:** Claude Code · **Wait:** none

---

## High priority (this week)

### 5. Candid Foundation Directory — paid plan decision

**Why it matters:** Foundation discovery (RWJF, Ford, Gates, Kellogg, smaller regional foundations) lives behind Candid's paid API. Without it, foundation discovery is degraded to manual / RSS / web scrape.

**Two options:**
- **Now:** Subscribe to Candid Premium ($300-500/mo) → unlock funder-search API
- **Later:** Defer to Phase 2 or Phase 7; ship federal/state/city first; add foundations after MV proves out

**Recommendation:** Defer until we have one design partner who specifically asks for foundation coverage. Federal + state + city is enough for the Uplift/Perpetual dogfood and most CBOs.

**Owner:** Lorenzo decision · **Wait:** activation 1 day if you subscribe

---

### 6. Domain decision — `perpetualcore.com/engine` vs `pcrfp.ai`

**Tradeoff:**
- `perpetualcore.com/engine` — keeps the Perpetual Core brand house consolidated; SEO accrues to one domain; no extra DNS/SSL infra; signals product-line strategy
- `pcrfp.ai` — standalone product brand; easier to spin out / sell / co-brand; cleaner mental model for capture-consultant Agency tier; more memorable in cold outreach

**Recommendation:** `perpetualcore.com/engine` for now. The whole GTM doc frames RFP Engine as the wedge for a Perpetual Core product suite (Plaud Voice Agent, Boardroom Agent, Compliance Filing Agent later). Brand house consolidation wins. If standalone branding becomes valuable later, redirect `pcrfp.ai` → `perpetualcore.com/engine` and own both.

**Owner:** Lorenzo decision · **Wait:** none if existing domain; ~30 min if new

---

### 7. Stripe products — create, don't activate

**Why it matters:** Phase 0 calls for Stripe products configured. Phase 7 turns payments on. Configure now; price-flag in test mode until external launch.

**Action:** Create four products in Stripe (test mode):
- `Starter` — $299/mo recurring
- `Pro` — $799/mo recurring
- `Agency` — $2,499/mo recurring
- `Enterprise` — custom (placeholder $25K/yr annual price for the API; final priced per deal)

**Note:** Use the Vercel Stripe MCP integration if available to verify products got created and price IDs are accessible from env.

**Owner:** Claude Code can do this in Phase 0 once Lorenzo grants Stripe API access · **Wait:** instant

---

### 8. NAICS codes — verify per org

**Why it matters:** NAICS overlap is 30% of the fit-score function (per tech spec § 4.1). Wrong NAICS = bad matching.

**Stated in prototype:**
- Uplift: `611430, 624310, 621399`
- IHA: `611710, 624190, 813219`
- Perpetual Core: `541511, 518210, 541512`

**Action:** Lorenzo confirms these are the codes registered in SAM.gov for each entity. If any org isn't yet SAM-registered, that's a Phase 0 task (multi-week wait — distinct from the API key).

**Owner:** Lorenzo · **Wait:** instant if already registered; 2-4 weeks if not

---

## Medium priority (before Phase 2 starts, ~Day 11)

### 9. Vault staging

See `VAULT-CHECKLIST.md`. Begin the inbox + Drive archeology now so MV-bar files are in place by the time Phase 2 needs them. Lorenzo can spread this across nights and weekends; doesn't block earlier phases.

**Owner:** Lorenzo + Sarah · **Wait:** weekend of work to hit MV per org

---

### 10. Boardroom × Prayer Room episode

**Why it matters:** Founder-led content channel per GTM § 4.3. The episode that announces the build is also the founding artifact for the case study.

**Action:** Schedule the recording for ~Day 75-90 (when first Uplift wins start landing). Working title: *"How We Built the AI Capture Team We Couldn't Afford to Hire."*

**Owner:** Lorenzo · **Wait:** booking

---

## Lower priority (before Phase 7 / external beta)

- SOC 2 Type I scoping (Enterprise tier requirement)
- DPIA / privacy policy update for vault-grounded drafting
- Affiliate program platform (Rewardful / Tolt) — for capture-consultant channel
- White-label theming infrastructure (Agency tier)
- Slack / Teams app registration (Pro tier notifications)

These all happen during Phase 7 (multi-tenant productization). No need to start them now.

---

## Summary table — what to do today

| # | Action | Owner | Wait time | Blocks |
|---|--------|-------|-----------|--------|
| 1 | **Re-register SAM.gov key** (old one lapsed) | Lorenzo | ~10 days | Phase 1 federal leg |
| 2 | Simpler.Grants.gov API key | Lorenzo | 5 min | Phase 1 non-federal |
| 6 | Domain decision (recommend: `perpetualcore.com/engine`) | Lorenzo | None | Phase 7 marketing |
| 8 | Verify NAICS per org are SAM-registered | Lorenzo | instant | Phase 1 scoring quality |

SAM.gov re-registration is the only true wait-state. While it bakes, the build runs Phase 0 schema work + the salvage port from `ldc-command-center` + Grants.gov / SBIR.gov / Simpler Grants integration — federal grants and SBIR are unblocked even without SAM.gov.
