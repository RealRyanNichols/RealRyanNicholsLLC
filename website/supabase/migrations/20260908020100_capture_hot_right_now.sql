-- Captured from production on 2026-09-08 (pg_get_functiondef, proacl).
-- No behavior change: created straight in production, no migration until now.
CREATE OR REPLACE FUNCTION public.hot_right_now()
 RETURNS TABLE(path text, viewers bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'auth', 'pg_temp'
AS $function$
  SELECT pv.path, COUNT(DISTINCT pv.session_id)::bigint AS viewers
  FROM page_views pv
  WHERE pv.last_activity_at >= now() - interval '5 minutes'
    AND pv.session_id IS NOT NULL
    AND pv.path NOT LIKE '/admin%'
    AND pv.path NOT LIKE '/api/%'
    AND pv.path NOT LIKE '/_next/%'
  GROUP BY pv.path
  HAVING COUNT(DISTINCT pv.session_id) >= 1
  ORDER BY viewers DESC, pv.path ASC
  LIMIT 6;
$function$;

-- Grants as in production: {postgres, anon, authenticated, service_role}.
revoke all on function public.hot_right_now() from public;
grant execute on function public.hot_right_now() to anon, authenticated, service_role;
