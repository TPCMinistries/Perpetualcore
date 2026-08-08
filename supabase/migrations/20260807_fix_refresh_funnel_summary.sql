-- Fix refresh_funnel_summary(): it has never successfully refreshed.
--
-- The function ran REFRESH MATERIALIZED VIEW CONCURRENTLY. Postgres only allows
-- CONCURRENTLY when the matview carries a unique index on plain columns, and the
-- only unique index here is built on expressions:
--
--   CREATE UNIQUE INDEX idx_funnel_daily_unique ON public.funnel_daily_summary
--     USING btree (day, event_type, COALESCE(utm_source, ''), COALESCE(utm_medium, ''),
--                  COALESCE(utm_campaign, ''))
--
-- so every hourly run of /api/cron/refresh-funnel raised
--   55000: cannot refresh materialized view "public.funnel_daily_summary" concurrently
-- and the view stayed frozen at 0 rows while analytics_events accumulated 485.
-- Every surface reading the funnel therefore showed zero, which is
-- indistinguishable from having no demand.
--
-- The COALESCE expressions are not incidental: utm_* are nullable, and NULLs do
-- not collide in a unique index, so a plain-column index would not actually
-- enforce one row per (day, event_type, utm triple). Rather than reshape the
-- view to emit non-null utm columns, drop CONCURRENTLY. This view aggregates a
-- few hundred rows; a plain refresh takes an ACCESS EXCLUSIVE lock for
-- milliseconds, on an hourly cron, against a table nothing reads
-- transactionally. That is the cheaper correct fix.

CREATE OR REPLACE FUNCTION public.refresh_funnel_summary()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  REFRESH MATERIALIZED VIEW public.funnel_daily_summary;
END;
$function$;
