-- live_visitor_pings(): stop returning each visitor's current path and page
-- count. The function is callable with the anon key (the browser polls it
-- for the public radar), so those two columns were readable by anyone even
-- though every consumer stripped them (lib/radar-pings.ts). No page or
-- component reads them (grep pages_in_session), so this removes data nobody
-- used and closes the gap against the rule that no public surface shows a
-- visitor's path or page trail. The path filters stay inside the query.
-- Applied to production 2026-09-08.
drop function if exists public.live_visitor_pings();

create function public.live_visitor_pings()
 returns table(
   ping_id text,
   country text,
   region text,
   city text,
   last_seen timestamp with time zone,
   latitude numeric,
   longitude numeric
 )
 language sql
 stable security definer
 set search_path to 'public', 'extensions', 'auth', 'pg_temp'
as $function$
  WITH active AS (
    SELECT pv.session_id, pv.country, pv.region, pv.city, pv.path,
           pv.latitude, pv.longitude,
           pv.last_activity_at,
           ROW_NUMBER() OVER (PARTITION BY pv.session_id ORDER BY pv.last_activity_at DESC) AS rn
    FROM page_views pv
    WHERE pv.last_activity_at >= now() - interval '5 minutes'
      AND pv.session_id IS NOT NULL
  )
  SELECT
    substr(encode(extensions.digest(a.session_id::bytea, 'sha256'), 'hex'), 1, 10),
    a.country, a.region, a.city,
    a.last_activity_at,
    round(a.latitude, 1), round(a.longitude, 1)
  FROM active a
  WHERE a.rn = 1
    AND a.path NOT LIKE '/admin%'
    AND a.path NOT LIKE '/api/%'
    AND a.path NOT LIKE '/_next/%'
  ORDER BY a.last_activity_at DESC
  LIMIT 200;
$function$;

revoke all on function public.live_visitor_pings() from public;
grant execute on function public.live_visitor_pings() to anon, authenticated, service_role;
