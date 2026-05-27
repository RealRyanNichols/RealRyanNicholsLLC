-- Admin-only aggregation over page_arrivals for the analytics dashboard:
-- by ua_class, a daily stacked time-series, top posts (human vs bot), top
-- countries, top referrers, and a recent feed. Self can be excluded.
create or replace function public.arrivals_overview(
  p_days int default 14,
  p_exclude_self boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_temp'
as $function$
declare
  v_since timestamptz := now() - make_interval(days => greatest(1, least(p_days, 90)));
  result jsonb;
begin
  if not coalesce(public.is_admin(auth.uid()), false) then
    return jsonb_build_object('error', 'forbidden');
  end if;

  with base as (
    select * from public.page_arrivals
    where at >= v_since
      and (not p_exclude_self or not is_self)
  )
  select jsonb_build_object(
    'since', to_jsonb(v_since),
    'days', greatest(1, least(p_days, 90)),
    'exclude_self', p_exclude_self,
    'total', (select count(*) from base),
    'self_total', (select count(*) from public.page_arrivals where at >= v_since and is_self),
    'by_class', (
      select coalesce(jsonb_object_agg(ua_class, c), '{}'::jsonb)
      from (select ua_class, count(*) c from base group by ua_class) q
    ),
    'by_day', (
      select coalesce(jsonb_agg(day_obj order by dd), '[]'::jsonb)
      from (
        select dd,
          jsonb_build_object(
            'day', dd::date,
            'human', coalesce(sum(c) filter (where ua_class = 'human'), 0),
            'ai', coalesce(sum(c) filter (where ua_class = 'ai-bot'), 0),
            'search', coalesce(sum(c) filter (where ua_class = 'search-bot'), 0),
            'social', coalesce(sum(c) filter (where ua_class = 'social-bot'), 0),
            'uptime', coalesce(sum(c) filter (where ua_class = 'uptime-bot'), 0),
            'unknown', coalesce(sum(c) filter (where ua_class = 'unknown'), 0),
            'total', coalesce(sum(c), 0)
          ) as day_obj
        from generate_series(date_trunc('day', v_since), date_trunc('day', now()), interval '1 day') dd
        left join (
          select date_trunc('day', at) d, ua_class, count(*) c from base group by 1, 2
        ) x on x.d = dd
        group by dd
      ) days
    ),
    'top_posts', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'path', path, 'total', total, 'human', human, 'bots', bots
      ) order by total desc), '[]'::jsonb)
      from (
        select path,
          count(*) total,
          count(*) filter (where ua_class = 'human') human,
          count(*) filter (where ua_class in ('ai-bot','search-bot','social-bot','uptime-bot')) bots
        from base where path like '/posts/%'
        group by path order by count(*) desc limit 15
      ) p
    ),
    'top_countries', (
      select coalesce(jsonb_agg(jsonb_build_object('country', country, 'n', n) order by n desc), '[]'::jsonb)
      from (select coalesce(country, '??') country, count(*) n from base group by 1 order by count(*) desc limit 10) c
    ),
    'top_referrers', (
      select coalesce(jsonb_agg(jsonb_build_object('host', host, 'n', n) order by n desc), '[]'::jsonb)
      from (select coalesce(nullif(referrer_host, ''), '(direct)') host, count(*) n from base group by 1 order by count(*) desc limit 10) r
    ),
    'recent', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'path', path, 'ua_class', ua_class, 'country', country,
        'referrer_host', referrer_host, 'is_self', is_self, 'at', at
      ) order by at desc), '[]'::jsonb)
      from (select * from base order by at desc limit 50) z
    )
  ) into result;

  return result;
end;
$function$;

revoke all on function public.arrivals_overview(int, boolean) from public;
grant execute on function public.arrivals_overview(int, boolean) to authenticated;
