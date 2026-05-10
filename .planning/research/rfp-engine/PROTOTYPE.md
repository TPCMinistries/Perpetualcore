# UI Prototype Notes

Full source: `source-docs/perpetual-core-rfp-engine-prototype.jsx`

A working React component that demonstrates the three core views of the engine. **Treat this as a faithful design spec, not as code to ship.** The actual implementation will be split across multiple Next.js pages, server components, and shared layout.

## Three views

### 1. Discovery
Lists matched opportunities with fit score (0-100), win probability (%), funding amount, deadline, source (SAM.gov / Grants.gov / DYCD / RWJF / etc.), and a one-paragraph brief. Click an opportunity → routes to Drafting view with that opportunity attached.

### 2. Capture Profile
Per-org view showing:
- **Voice fingerprint** (register, signature phrases, do-not-use words)
- **Capacity** (one-paragraph capacity statement)
- **NAICS codes** (chips)
- **Recent wins** (checklist)
- **Artifact vault** (list of past proposals, partner letters, logic models, etc.)

### 3. Drafting Agent
Two-pane layout:
- Left: **Solicitation excerpt** textarea + section type selector (Need Statement, Approach, Logic Model, Org Capacity, Eval Plan, Sustainability for nonprofits; Executive Summary, Tech Approach, Past Performance, Mgmt Plan, Pricing Narrative, Differentiators for for-profits) + Generate button
- Right: **Generated section** with copy/save/run-reviewer buttons

## Mode switcher

Three top-level modes: `nonprofit | forprofit | dual`. The `dual` mode is the operator view (Lorenzo) — sees both Uplift and IHA (nonprofit) plus Perpetual Core (for-profit) in one feed.

## Active org switcher

Inline switcher: Uplift Communities | Institute for Human Advancement | The Perpetual Core. Switching the active org changes:
- Section types shown (nonprofit vs for-profit conventions)
- Voice fingerprint used in drafting prompt
- Vault retrieval scope
- NAICS filter on Discovery feed

## Visual language

- **Background:** `#0a0e1a` (deep navy, almost black)
- **Accent:** `#d9b25c` (gold gradient `#d9b25c → #b8954a`)
- **Display font:** Fraunces (serif, used for headers and large numbers)
- **Body font:** Inter (sans-serif)
- **Mono font:** JetBrains Mono (used for `mono` class — micro-labels, source attribution, tags)
- **Subtle radial gradient grain background** — gold + steel-blue at 4% opacity
- **Live dot** — pulsing gold ring next to "Discovery live" badge

## Implementation notes for build

- The prototype calls `https://api.anthropic.com/v1/messages` directly from the browser. **Don't ship that.** Production routes through `/api/proposals/:id/sections` which uses a server-side Claude Managed Agents call with the proper system prompt, tools, and audit logging.
- The mock `opportunities` array becomes `rfp_opportunities` rows joined to `rfp_opp_matches` filtered by current org and `min_fit=80`.
- The mock `vaultEntries` becomes `rfp_vault_artifacts` rows; the artifact-vault list view uses pgvector similarity search when the user types in a search box (not in the prototype).
- The mock `orgs` registry becomes `rfp_orgs` rows; voice fingerprint pulled from `rfp_capture_profiles.profile_json`.
- "Run reviewer agent" and "Save to proposal" buttons are stubs — wire to `/api/proposals/:id/sections/:section_id/review` and a save mutation respectively.

## Section types defined

**Nonprofit** (6): Need Statement, Project Approach, Logic Model, Organizational Capacity, Evaluation Plan, Sustainability

**For-profit** (6): Executive Summary, Technical Approach, Past Performance, Management Plan, Pricing Narrative, Differentiators

These map 1:1 to allowed values for `rfp_proposal_sections.section_type`.
