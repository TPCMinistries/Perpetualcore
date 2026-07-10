-- Cycle-watch alert dedup log (applied to prod 2026-07-10 via MCP).
-- One row per (opportunity, user, alert kind) so a watched opportunity's
-- window-open alert fires exactly once per user.
create table if not exists public.rfp_watch_alert_log (
  id uuid primary key default gen_random_uuid(),
  opp_id uuid not null references public.rfp_opportunities(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  org_id uuid not null references public.rfp_orgs(id) on delete cascade,
  kind text not null check (kind in ('window_open','deadline_set')),
  alerted_at timestamptz not null default now(),
  unique (opp_id, user_id, kind)
);
alter table public.rfp_watch_alert_log enable row level security;
create policy "watch_alert_log_service_only" on public.rfp_watch_alert_log
  for all using (false) with check (false);
