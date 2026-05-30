-- Admin-only daily page_views trend for the Attention Dashboard.
-- Returns a gap-filled array of { day, views } for the last N days, bucketed
-- by America/Chicago calendar day (matching analytics_summary's heatmap tz).
-- A single aggregation here avoids pulling thousands of page_views rows into
-- the page just to draw a 14-day trend. Forward-only, read-only.
create or replace function public.analytics_daily_views(p_days int default 14)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public','extensions','auth','pg_temp'
as $function$
declare
  v_days int := greatest(1, least(p_days, 90));
  v_start date := (now() at time zone 'America/Chicago')::date - (v_days - 1);
  result jsonb;
begin
  if not coalesce(public.is_admin(auth.uid()), false) then
    return jsonb_build_object('error', 'forbidden');
  end if;

  with days as (
    select generate_series(
      v_start,
      (now() at time zone 'America/Chicago')::date,
      interval '1 day'
    )::date as d
  ),
  counts as (
    select (started_at at time zone 'America/Chicago')::date as d,
           count(*)::int as views
    from public.page_views
    where started_at >= v_start
    group by 1
  )
  select jsonb_agg(
    jsonb_build_object(
      'day', to_char(days.d, 'YYYY-MM-DD'),
      'views', coalesce(counts.views, 0)
    ) order by days.d
  )
  into result
  from days
  left join counts on counts.d = days.d;

  return coalesce(result, '[]'::jsonb);
end;
$function$;

revoke all on function public.analytics_daily_views(int) from public;
grant execute on function public.analytics_daily_views(int) to authenticated;
