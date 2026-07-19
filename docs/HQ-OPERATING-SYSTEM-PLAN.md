# Perpetual Core HQ — One-Person Company Operating System

**Owner:** Lorenzo Daughtry-Chambers

**Status:** Active implementation

**Started:** 2026-07-15
**Route:** `https://perpetualcore.com/hq`

## Objective

Turn `/hq` from a read-only portfolio report into the owner interface for a durable, auditable operating loop:

`signals → priorities → proposed actions → owner policy/approval → execution → verification → outcomes`

The system should continue to reconcile state when Lorenzo's laptop is offline. Local vault documents remain useful inputs, but they cannot be the only runtime dependency.

## Product rules

1. **Exceptions first.** The default view answers: what changed, what is blocked, what needs Lorenzo, and what happened after the last decision.
2. **Every approval has a contract.** An action has a type, validated payload, risk level, idempotency key, expected outcome, execution status, and evidence.
3. **Approval is not execution.** Approval and execution are separate audited transitions.
4. **Safe by default.** Unknown actions fail closed. External sends, money movement, destructive changes, permission changes, and production deployment always require explicit owner approval at action time.
5. **Cloud is durable; local is a producer.** Supabase holds current operational state and audit history. Local jobs may publish signals and reports but cannot be the sole scheduler.
6. **Freshness is per source.** A fresh page render must never make an old strategist memo or failed connector look current.
7. **Outcomes beat activity.** The scorecard prioritizes cash collected, pipeline created, deadlines protected, hours saved, successful actions, and failed actions.

## Delivery plan

### Phase 1 — Owner cockpit

- Add a dominant Today brief.
- Put approvals and deadline exceptions ahead of portfolio reports.
- Collapse long markdown reports behind progressive disclosure.
- Add mobile navigation, accessible action controls, and visible snapshot freshness.

**Exit:** The first screen communicates today's operating state without reading a report.

### Phase 2 — Durable execution plane

- Track the existing ad hoc `hq_queue` schema in a migration.
- Add structured action contracts to queue items.
- Add append-oriented action-run history with idempotency.
- Add per-source health/freshness records.
- Add outcome measurements linked to actions and engines.
- Enable RLS and deny direct client access; server operations use `createAdminClient()` after owner or cron authentication.

**Exit:** Every executable HQ item has a durable state machine and audit trail.

### Phase 3 — Safe action registry

- Maintain an explicit allowlist of supported actions.
- Validate every payload with Zod.
- Classify risk and approval requirements in code, never from client input.
- Default new actions to preview/dry-run.
- Record execution start, completion, failure, evidence, and retry metadata.
- Begin with reversible internal actions; adapters for external side effects remain gated.

**Exit:** HQ can execute approved low-risk actions and fail closed for unsupported or high-risk actions.

### Phase 4 — Cloud reconciliation

- Add a `CRON_SECRET`-protected Vercel cron route.
- Reconcile lapsed snoozes, approved actions awaiting execution, failed/retryable runs, stale sources, and daily outcome rollups.
- Write a cloud heartbeat even when local producers have not run.
- Surface degraded sources as owner exceptions.

**Exit:** HQ detects stale/broken operating inputs while the laptop is offline.

### Phase 5 — Daily operating loop

- Render Proposed → Approved → Running → Verify → Done as an understandable workflow.
- Provide a focused action inbox, execution history, and outcome scorecard.
- Show source-level freshness and failure evidence.
- Keep reports available as evidence, not as the primary interface.

**Exit:** Lorenzo can clear the company queue in one session and see verified results later.

## Initial action policy

| Risk | Examples | Default policy |
|---|---|---|
| Low | refresh internal snapshot, recalculate metrics, create internal task | owner approval may be reusable; dry-run available |
| Medium | draft outreach, change internal priority, schedule an internal job | explicit approval for each action |
| High | send external communication, publish content, deploy production, modify access | explicit action-time approval; adapter must provide preview |
| Prohibited | move money, reveal secrets, bypass security/RLS, destructive production DB changes | no autonomous execution |

## Deployment sequence

1. Review the generated migration and application contract together.
2. Apply the migration to LDC Brain AI using the guarded database workflow.
3. Deploy application code in observe-only mode (`HQ_CRON_EXECUTION_ENABLED` unset or `false`).
4. Run reconciliation manually and verify source health/action-run writes.
5. Confirm `HQ_CRON_ACTOR_EMAIL` is an owner address, then set `HQ_CRON_EXECUTION_ENABLED=true` to enable cloud dispatch.
6. Keep only low-risk internal action adapters enabled.
7. Add higher-risk adapters one at a time with preview and rollback evidence.

## Verification gates

- Production build passes.
- Focused execution-contract and reconciliation tests pass.
- Unauthenticated cron requests return `401`.
- Unsupported action types never execute.
- Duplicate idempotency keys do not duplicate side effects.
- A failed adapter produces a visible failed run without losing the queue item.
- Stale source records become visible exceptions.
- No migration is applied and no production deployment is performed without explicit owner approval.

## Deferred until the core loop is proven

- Fully autonomous external email/social publishing.
- Money movement or automatic purchasing.
- Automatic production deployments.
- Broad third-party connector expansion.
- Multi-user delegation and role-based approval chains.
