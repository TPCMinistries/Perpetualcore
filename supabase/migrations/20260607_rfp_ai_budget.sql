-- Phase 17: Add AI spend limit to rfp_entitlements
-- Additive only. NULL = unlimited (all existing rows remain unlimited).
-- Applied to: hgxxxmtfmvguotkowxbu (LDC Brain AI) via supabase MCP apply_migration

ALTER TABLE rfp_entitlements
  ADD COLUMN IF NOT EXISTS monthly_ai_budget_usd numeric;

COMMENT ON COLUMN rfp_entitlements.monthly_ai_budget_usd IS
  'Monthly AI spend hard limit in USD. NULL = unlimited. Enforced by Phase 17 guardrail before every LLM call.';
