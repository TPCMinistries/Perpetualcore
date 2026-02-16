-- Fix subscriptions CHECK constraint to include all 7 plan tiers
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_check;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_plan_check
  CHECK (plan IN ('free', 'starter', 'pro', 'team', 'business', 'enterprise', 'custom'));
