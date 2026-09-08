-- live_visitor_session_detail: captured from production on 2026-09-08
-- (pg_get_functiondef) and locked to the service role. Ryan approved the
-- restriction on 2026-09-07 (docs/usage-receipts-2026-09.md, item 17).
--
-- It returns one visitor's last 20 paths and dwell times by hashed session.
-- Production granted it to `authenticated`, so any signed-in member could
-- read another visitor's page trail. No page or component in website/ calls
-- it (grep live_visitor_session_detail), and the public Map Room must never
-- need it, so the body is unchanged and only the grants move.
CREATE OR REPLACE FUNCTION public.live_visitor_session_detail(p_ping_id text)
 RETURNS TABLE(path text, viewed_at timestamp with time zone, dwell_seconds integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'auth', 'pg_temp'
AS $function$
  WITH match AS (
    SELECT pv.session_id FROM page_views pv
    WHERE substr(encode(extensions.digest(pv.session_id::bytea, 'sha256'), 'hex'), 1, 10) = p_ping_id
    LIMIT 1
  )
  SELECT pv.path, pv.started_at,
    GREATEST(0, EXTRACT(EPOCH FROM (pv.last_activity_at - pv.started_at))::int)
  FROM page_views pv
  WHERE pv.session_id = (SELECT session_id FROM match)
    AND pv.path NOT LIKE '/admin%' AND pv.path NOT LIKE '/api/%'
  ORDER BY pv.started_at DESC
  LIMIT 20;
$function$;

-- Before: {postgres, authenticated, service_role}. After: service role only.
revoke all on function public.live_visitor_session_detail(text) from public, anon, authenticated;
grant execute on function public.live_visitor_session_detail(text) to service_role;
