-- Captured from production on 2026-09-08 (pg_get_functiondef, proacl).
-- No behavior change: created straight in production, no migration until now.
-- Only its `today` / `week` fields are used; `live_now` on site_totals() is
-- the one live count (AGENTS.md).
CREATE OR REPLACE FUNCTION public.site_live_pulse()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'auth', 'pg_temp'
AS $function$
  select jsonb_build_object(
    'reading_now', (
      select count(distinct session_id) from page_views
      where last_activity_at > now() - interval '2 minutes'
    ),
    'today', (
      select count(distinct session_id) from page_views
      where started_at > now() - interval '24 hours'
    ),
    'week', (
      select count(distinct session_id) from page_views
      where started_at > now() - interval '7 days'
    )
  );
$function$;

-- Grants as in production: {public, postgres, anon, authenticated, service_role}.
grant execute on function public.site_live_pulse() to public, anon, authenticated, service_role;
