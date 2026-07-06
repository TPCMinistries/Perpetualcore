-- Operator Deck v1 — deck_metrics: append-only daily time-series for the scoreboard.
-- deck_snapshots holds "latest state" (overwrite); this holds history so the
-- $1M-by-Dec-2026 cumulative line has a series to draw from.
--
-- RLS posture: enabled + FORCE + zero policies. Writes arrive via the Management
-- API (postgres role) and reads via Sage's BRAIN_SUPABASE_SERVICE_KEY — both bypass
-- RLS. anon/authenticated get default-deny. No "System can manage"-style hole.

create table if not exists public.deck_metrics (
  id          bigint generated always as identity primary key,
  day         date        not null,
  source      text        not null,   -- 'stripe:perpetualcore' | 'supabase:workforce' | ...
  segment     text        not null,   -- metadata.product / 'donations' / metric label; NEVER lumped
  metric      text        not null,   -- 'gross_usd' | 'failed_charges' | 'active_subs' | 'new_rows_24h'
  value       numeric     not null,
  meta        jsonb       not null default '{}'::jsonb,
  captured_at timestamptz not null default now(),
  unique (day, source, segment, metric)
);

alter table public.deck_metrics enable row level security;
alter table public.deck_metrics force row level security;
revoke all on public.deck_metrics from anon, authenticated;
