-- 20260520_rfp_org_subscriptions.sql
-- Wave 4.5 — Stripe self-serve checkout for RFP Pro + Agency.
--
-- Parallel to the legacy `subscriptions` table (which is keyed on
-- organization_id from the PC SaaS schema and has no link to rfp_orgs).
-- RFP has its own subscription tracker so the two systems don't entangle.

create table if not exists rfp_org_subscriptions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references rfp_orgs(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_price_id text,
  tier text,                            -- 'pro' | 'agency' | null
  status text,                          -- trialing | active | past_due | canceled | ...
  current_period_end timestamptz,
  trial_ends_at timestamptz,
  cancel_at_period_end boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id)
);

create index if not exists rfp_org_subscriptions_customer
  on rfp_org_subscriptions (stripe_customer_id);
create index if not exists rfp_org_subscriptions_subscription
  on rfp_org_subscriptions (stripe_subscription_id);

alter table rfp_org_subscriptions enable row level security;

create policy "rfp_org_subscriptions_member_read"
  on rfp_org_subscriptions for select
  using (
    exists (
      select 1 from rfp_user_orgs
      where rfp_user_orgs.org_id = rfp_org_subscriptions.org_id
        and rfp_user_orgs.user_id = auth.uid()
    )
  );

create policy "rfp_org_subscriptions_service_role_write"
  on rfp_org_subscriptions for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
