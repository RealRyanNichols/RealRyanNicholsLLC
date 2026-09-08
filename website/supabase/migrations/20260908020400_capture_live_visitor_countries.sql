-- Captured from production on 2026-09-08 (pg_get_functiondef, proacl).
-- No behavior change: created straight in production, no migration until now.
-- Service-role only in production; kept that way.
CREATE OR REPLACE FUNCTION public.live_visitor_countries()
 RETURNS TABLE(country text, viewers bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'auth', 'pg_temp'
AS $function$
  SELECT country, COUNT(DISTINCT session_id)::bigint AS viewers
  FROM page_views pv
  WHERE pv.last_activity_at >= now() - interval '5 minutes'
    AND pv.country IS NOT NULL
    AND pv.session_id IS NOT NULL
  GROUP BY country
  ORDER BY viewers DESC;
$function$;

-- Grants as in production: {postgres, service_role}.
revoke all on function public.live_visitor_countries() from public, anon, authenticated;
grant execute on function public.live_visitor_countries() to service_role;
