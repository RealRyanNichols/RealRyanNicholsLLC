-- Richer admin analytics for the Attention Dashboard:
--   analytics_visitor_trend   — daily views + unique visitors + sessions
--   analytics_traffic_sources — normalized referrer breakdown (FB / X / search…)
--   analytics_hourly_heatmap  — day-of-week x hour view counts ("best time to post")
-- All admin-gated, bucketed in America/Chicago, read-only.

create or replace function public.analytics_visitor_trend(p_days int default 30)
returns jsonb language plpgsql stable security definer
set search_path to 'public','extensions','auth','pg_temp'
as $function$
declare
  v_days int := greatest(1, least(p_days, 180));
  v_start date := (now() at time zone 'America/Chicago')::date - (v_days - 1);
  result jsonb;
begin
  if not coalesce(public.is_admin(auth.uid()), false) then
    return jsonb_build_object('error','forbidden');
  end if;
  with days as (
    select generate_series(v_start, (now() at time zone 'America/Chicago')::date, interval '1 day')::date as d
  ),
  counts as (
    select (started_at at time zone 'America/Chicago')::date as d,
           count(*)::int as views,
           count(distinct visitor_hash)::int as visitors,
           count(distinct session_id)::int as sessions
    from public.page_views
    where started_at >= v_start
    group by 1
  )
  select jsonb_agg(jsonb_build_object(
    'day', to_char(days.d,'YYYY-MM-DD'),
    'views', coalesce(counts.views,0),
    'visitors', coalesce(counts.visitors,0),
    'sessions', coalesce(counts.sessions,0)
  ) order by days.d)
  into result from days left join counts on counts.d = days.d;
  return coalesce(result,'[]'::jsonb);
end; $function$;
revoke all on function public.analytics_visitor_trend(int) from public;
grant execute on function public.analytics_visitor_trend(int) to authenticated;

create or replace function public.analytics_traffic_sources(p_days int default 30)
returns jsonb language plpgsql stable security definer
set search_path to 'public','extensions','auth','pg_temp'
as $function$
declare
  v_days int := greatest(1, least(p_days, 365));
  v_start timestamptz := now() - make_interval(days => v_days);
  result jsonb;
begin
  if not coalesce(public.is_admin(auth.uid()), false) then
    return jsonb_build_object('error','forbidden');
  end if;
  with norm as (
    select
      case
        when referrer_host is null or referrer_host = '' then 'Direct / app'
        when referrer_host ilike '%facebook%' or referrer_host ilike '%fb.%' then 'Facebook'
        when referrer_host ilike '%t.co%' or referrer_host ilike '%x.com%' or referrer_host ilike '%twitter%' then 'X / Twitter'
        when referrer_host ilike '%google%' then 'Google search'
        when referrer_host ilike '%instagram%' then 'Instagram'
        when referrer_host ilike '%gab.com%' then 'Gab'
        when referrer_host ilike '%truth%' then 'Truth Social'
        when referrer_host ilike '%bing%' or referrer_host ilike '%duckduckgo%' or referrer_host ilike '%yahoo%' then 'Other search'
        when referrer_host ilike '%realryannichols%' then 'Internal links'
        else referrer_host
      end as source,
      visitor_hash
    from public.page_views
    where started_at >= v_start
  )
  select jsonb_agg(row order by (row->>'views')::int desc) from (
    select jsonb_build_object('source', source, 'views', count(*)::int, 'visitors', count(distinct visitor_hash)::int) as row
    from norm group by source order by count(*) desc limit 12
  ) t into result;
  return coalesce(result,'[]'::jsonb);
end; $function$;
revoke all on function public.analytics_traffic_sources(int) from public;
grant execute on function public.analytics_traffic_sources(int) to authenticated;

create or replace function public.analytics_hourly_heatmap(p_days int default 30)
returns jsonb language plpgsql stable security definer
set search_path to 'public','extensions','auth','pg_temp'
as $function$
declare
  v_days int := greatest(1, least(p_days, 180));
  v_start timestamptz := now() - make_interval(days => v_days);
  result jsonb;
begin
  if not coalesce(public.is_admin(auth.uid()), false) then
    return jsonb_build_object('error','forbidden');
  end if;
  select jsonb_agg(jsonb_build_object('dow', dow, 'hour', hr, 'views', views) order by dow, hr)
  from (
    select extract(dow from (started_at at time zone 'America/Chicago'))::int as dow,
           extract(hour from (started_at at time zone 'America/Chicago'))::int as hr,
           count(*)::int as views
    from public.page_views
    where started_at >= v_start
    group by 1,2
  ) t into result;
  return coalesce(result,'[]'::jsonb);
end; $function$;
revoke all on function public.analytics_hourly_heatmap(int) from public;
grant execute on function public.analytics_hourly_heatmap(int) to authenticated;
