-- City-level pings on the public Map Room, with a privacy floor.
-- Ryan approved city-level public pings on 2026-09-07
-- (docs/usage-receipts-2026-09.md, item 17).
--
-- Source of every coordinate: Vercel's own geolocation request headers,
-- x-vercel-ip-latitude and x-vercel-ip-longitude
-- (vercel.com/docs/headers/request-headers, read 2026-09-08). Nothing is
-- geocoded here and no city dataset is imported.
--
-- Privacy floor: both values are rounded to a tenth of a degree (about 11 km
-- north-south, 8 to 10 km east-west at US latitudes) before they are stored,
-- and rounded again on the way out. A dot lands near a town, never on a
-- street. The path and page count still never leave the server
-- (lib/radar-pings.ts strips them).
alter table public.page_views
  add column if not exists latitude numeric(5,1)
    check (latitude is null or (latitude >= -90 and latitude <= 90)),
  add column if not exists longitude numeric(6,1)
    check (longitude is null or (longitude >= -180 and longitude <= 180));

comment on column public.page_views.latitude is
  'Visitor latitude from Vercel''s x-vercel-ip-latitude header, rounded to 0.1 degree (about 11 km). Never a precise point.';
comment on column public.page_views.longitude is
  'Visitor longitude from Vercel''s x-vercel-ip-longitude header, rounded to 0.1 degree. Never a precise point.';

-- record_page_view: the ten-argument form becomes a twelve-argument form with
-- two optional coordinates. The old signature is dropped so PostgREST sees
-- one candidate; callers that pass ten named arguments (app/api/track-pageview)
-- or ten positionals (the four-argument wrapper below it) still resolve.
-- Body otherwise identical to production (captured 2026-09-08).
drop function if exists public.record_page_view(text, text, text, text, text, text, text, text, text, text);

create or replace function public.record_page_view(
  p_session_id text,
  p_path text,
  p_ref text default null,
  p_ua text default null,
  p_country text default null,
  p_region text default null,
  p_city text default null,
  p_referrer_host text default null,
  p_visitor_hash text default null,
  p_device_kind text default null,
  p_latitude numeric default null,
  p_longitude numeric default null
)
returns bigint
language plpgsql
set search_path to 'public', 'extensions', 'auth', 'pg_temp'
as $function$
begin
  if p_session_id is null or length(p_session_id) < 8 or length(p_session_id) > 64 then
    return null;
  end if;
  if p_path is null or length(p_path) > 500 then
    return null;
  end if;

  perform set_config('app.analytics_rpc', 'record_page_view', true);

  insert into public.page_views (
    session_id, user_id, path, ref, ua,
    country, region, city, referrer_host, visitor_hash, device_kind,
    latitude, longitude
  )
  values (
    p_session_id,
    null,
    left(p_path, 500),
    nullif(left(p_ref, 500), ''),
    nullif(left(p_ua, 300), ''),
    nullif(left(p_country, 8), ''),
    nullif(left(p_region, 120), ''),
    nullif(left(p_city, 120), ''),
    nullif(left(p_referrer_host, 200), ''),
    nullif(left(p_visitor_hash, 64), ''),
    nullif(left(p_device_kind, 16), ''),
    case when p_latitude between -90 and 90 then round(p_latitude, 1) end,
    case when p_longitude between -180 and 180 then round(p_longitude, 1) end
  );

  return null;
end;
$function$;

-- Grants as the ten-argument form had in production: {postgres, service_role, anon}.
revoke all on function public.record_page_view(text, text, text, text, text, text, text, text, text, text, numeric, numeric) from public;
grant execute on function public.record_page_view(text, text, text, text, text, text, text, text, text, text, numeric, numeric) to anon, service_role;

-- live_visitor_pings: same rows as production (captured 2026-09-08) plus the
-- rounded coordinates. Return type changes, so drop and recreate.
drop function if exists public.live_visitor_pings();

create function public.live_visitor_pings()
 returns table(
   ping_id text,
   country text,
   region text,
   city text,
   path text,
   last_seen timestamp with time zone,
   pages_in_session integer,
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
  ),
  counts AS (
    SELECT session_id, COUNT(*)::int AS n
    FROM page_views
    WHERE last_activity_at >= now() - interval '30 minutes' AND session_id IS NOT NULL
    GROUP BY session_id
  )
  SELECT
    substr(encode(extensions.digest(a.session_id::bytea, 'sha256'), 'hex'), 1, 10),
    a.country, a.region, a.city, a.path,
    a.last_activity_at, COALESCE(c.n, 1),
    round(a.latitude, 1), round(a.longitude, 1)
  FROM active a
  LEFT JOIN counts c ON c.session_id = a.session_id
  WHERE a.rn = 1
    AND a.path NOT LIKE '/admin%'
    AND a.path NOT LIKE '/api/%'
    AND a.path NOT LIKE '/_next/%'
  ORDER BY a.last_activity_at DESC
  LIMIT 200;
$function$;

-- Grants as in production: {postgres, anon, authenticated, service_role}.
revoke all on function public.live_visitor_pings() from public;
grant execute on function public.live_visitor_pings() to anon, authenticated, service_role;
